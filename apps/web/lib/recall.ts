import { prisma } from './prisma';

export type RecallReason = 'query match' | 'topic overlap' | 'open loop';

export type RecallItem = {
  id: string;
  memoryType: 'episodic' | 'preference';
  sourceDate: Date;
  content: string;
  reason: RecallReason;
  journalEntryId: string | null;
  whyShown: string;
};

type EpisodicRecord = {
  id: string;
  summary: string;
  topics: string[] | null;
  openLoops: string[] | null;
  createdAt: Date;
  journalEntryId: string;
  whyShown: string;
};

type PreferenceRecord = {
  id: string;
  key: string;
  value: unknown;
  source: string | null;
  createdAt: Date;
};

type RecallDb = {
  episodicSummary: {
    findMany(args: {
      where: { userId: string };
      orderBy: { createdAt: 'desc' };
      select: {
        id: true;
        summary: true;
        topics: true;
        openLoops: true;
        createdAt: true;
        journalEntryId: true;
        whyShown: true;
      };
    }): Promise<EpisodicRecord[]>;
    findFirst(args: { where: { id: string; userId: string }; select: { id: true } }): Promise<{ id: string } | null>;
    delete(args: { where: { id: string } }): Promise<{ id: string }>;
    deleteMany(args: { where: { userId: string } }): Promise<{ count: number }>;
  };
  preferenceMemory: {
    findMany(args: {
      where: { userId: string; revokedAt: null };
      orderBy: { createdAt: 'desc' };
      select: {
        id: true;
        key: true;
        value: true;
        source: true;
        createdAt: true;
      };
    }): Promise<PreferenceRecord[]>;
    findFirst(args: { where: { id: string; userId: string; revokedAt: null }; select: { id: true } }): Promise<{ id: string } | null>;
    update(args: { where: { id: string }; data: { revokedAt: Date } }): Promise<{ id: string }>;
    updateMany(args: { where: { userId: string; revokedAt: null }; data: { revokedAt: Date } }): Promise<{ count: number }>;
  };
  auditLog: {
    create(args: {
      data: {
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata: { memoryType: 'episodic' | 'preference' } | { episodicDeleted: number; preferenceRevoked: number };
      };
    }): Promise<{ id: string }>;
  };
  $transaction<T>(input: Promise<T>[]): Promise<T[]>;
};

const db = prisma as unknown as RecallDb;

function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

function detectEpisodicReason(record: EpisodicRecord, query: string): RecallReason | null {
  if (!query) {
    return 'query match';
  }

  const topicMatch = (record.topics ?? []).some((topic) => topic.toLowerCase().includes(query));

  if (topicMatch) {
    return 'topic overlap';
  }

  const openLoopMatch = (record.openLoops ?? []).some((loop) => loop.toLowerCase().includes(query));

  if (openLoopMatch) {
    return 'open loop';
  }

  if (record.summary.toLowerCase().includes(query)) {
    return 'query match';
  }

  return null;
}

function stringifyPreferenceValue(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
}

function detectPreferenceMatch(record: PreferenceRecord, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [record.key, record.source ?? '', stringifyPreferenceValue(record.value)]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

export async function searchRecall(userId: string, rawQuery: string) {
  const query = normalizeQuery(rawQuery);
  const [episodicRecords, preferenceRecords] = await Promise.all([
    db.episodicSummary.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        summary: true,
        topics: true,
        openLoops: true,
        createdAt: true,
        journalEntryId: true,
        whyShown: true,
      },
    }),
    db.preferenceMemory.findMany({
      where: { userId, revokedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        key: true,
        value: true,
        source: true,
        createdAt: true,
      },
    }),
  ]);

  const episodicItems: RecallItem[] = [];

  for (const record of episodicRecords) {
    const reason = detectEpisodicReason(record, query);

    if (!reason) {
      continue;
    }

    episodicItems.push({
      id: record.id,
      memoryType: 'episodic',
      sourceDate: record.createdAt,
      content: record.summary,
      reason,
      journalEntryId: record.journalEntryId,
      whyShown: record.whyShown,
    });
  }

  const preferenceItems: RecallItem[] = preferenceRecords
    .filter((record) => detectPreferenceMatch(record, query))
    .map((record) => ({
      id: record.id,
      memoryType: 'preference',
      sourceDate: record.createdAt,
      content: `${record.key}: ${stringifyPreferenceValue(record.value)}`,
      reason: 'query match',
      journalEntryId: null,
      whyShown: 'Saved because you explicitly consented to store this preference.',
    }));

  return [...episodicItems, ...preferenceItems].sort(
    (left, right) => right.sourceDate.getTime() - left.sourceDate.getTime(),
  );
}

export async function deleteMemoryItem(input: {
  userId: string;
  memoryType: 'episodic' | 'preference';
  id: string;
}) {
  if (input.memoryType === 'episodic') {
    const exists = await db.episodicSummary.findFirst({
      where: {
        id: input.id,
        userId: input.userId,
      },
      select: { id: true },
    });

    if (!exists) {
      return false;
    }

    await db.episodicSummary.delete({ where: { id: input.id } });
    await db.auditLog.create({
      data: {
        userId: input.userId,
        action: 'memory.deleted',
        entityType: 'EpisodicSummary',
        entityId: input.id,
        metadata: {
          memoryType: 'episodic',
        },
      },
    });

    return true;
  }

  const exists = await db.preferenceMemory.findFirst({
    where: {
      id: input.id,
      userId: input.userId,
      revokedAt: null,
    },
    select: { id: true },
  });

  if (!exists) {
    return false;
  }

  await db.preferenceMemory.update({
    where: { id: input.id },
    data: {
      revokedAt: new Date(),
    },
  });
  await db.auditLog.create({
    data: {
      userId: input.userId,
      action: 'memory.deleted',
      entityType: 'PreferenceMemory',
      entityId: input.id,
      metadata: {
        memoryType: 'preference',
      },
    },
  });

  return true;
}


export async function deleteAllMemoriesForUser(userId: string) {
  const [episodicResult, preferenceResult] = await db.$transaction([
    db.episodicSummary.deleteMany({ where: { userId } }),
    db.preferenceMemory.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);

  await db.auditLog.create({
    data: {
      userId,
      action: 'memory.bulk_deleted',
      entityType: 'Memory',
      entityId: userId,
      metadata: {
        episodicDeleted: episodicResult.count,
        preferenceRevoked: preferenceResult.count,
      },
    },
  });

  return {
    episodicDeleted: episodicResult.count,
    preferenceRevoked: preferenceResult.count,
  };
}
