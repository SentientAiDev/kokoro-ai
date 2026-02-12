import { generateEpisodicSummary } from '../episodic-summary';
import { prisma } from '../prisma';
import type { RecallItem, RecallReason } from '../recall';
import { redactSensitiveJson, redactSensitiveText } from '../sensitive-data';
import { logInfo } from '../structured-logging';

export class PreferenceMemoryConsentError extends Error {
  constructor() {
    super('Preference memory requires explicit user consent.');
    this.name = 'PreferenceMemoryConsentError';
  }
}

type MemoryDb = {
  episodicSummary: {
    findUnique(args: { where: { journalEntryId: string } }): Promise<{ summary: string; topics: unknown; openLoops: unknown } | null>;
    update(args: { where: { journalEntryId: string }; data: Record<string, unknown> }): Promise<{ id: string }>;
    create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
    findMany(args: {
      where: { userId: string };
      orderBy: { createdAt: 'desc' };
    }): Promise<Array<{ id: string; createdAt: Date; summary: string; topics: unknown; openLoops: unknown; journalEntryId: string; whyShown: string }>>;
    findFirst(args: { where: { id: string; userId: string }; select: { id: true } }): Promise<{ id: string } | null>;
    delete(args: { where: { id: string } }): Promise<{ id: string }>;
  };
  preferenceMemory: {
    upsert(args: { where: { userId_key: { userId: string; key: string } }; create: Record<string, unknown>; update: Record<string, unknown> }): Promise<{ id: string; key: string; value: unknown; source: string | null; consentGivenAt: Date; updatedAt: Date }>;
    findMany(args: {
      where: { userId: string; revokedAt: null };
      orderBy: { createdAt: 'desc' };
    }): Promise<Array<{ id: string; key: string; value: unknown; source: string | null; createdAt: Date }>>;
    findFirst(args: { where: { id: string; userId: string; revokedAt: null }; select: { id: true } }): Promise<{ id: string } | null>;
    update(args: { where: { id: string }; data: { revokedAt: Date } }): Promise<{ id: string }>;
  };
  auditLog: {
    create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
  };
};

const db = prisma as unknown as MemoryDb;

export class MemoryService {
  async writeEpisodicSummary(input: { userId: string; journalEntryId: string; content: string }) {
    const generated = generateEpisodicSummary(input.content);
    const summary = redactSensitiveText(generated.summary);
    const openLoops = generated.openLoops.map((loop) => redactSensitiveText(loop));
    const existing = await db.episodicSummary.findUnique({ where: { journalEntryId: input.journalEntryId } });

    const hasChanged =
      !existing ||
      existing.summary !== summary ||
      JSON.stringify(existing.topics ?? []) !== JSON.stringify(generated.topics) ||
      JSON.stringify(existing.openLoops ?? []) !== JSON.stringify(openLoops);

    if (!hasChanged) {
      return { summary, topics: generated.topics, openLoops };
    }

    const saved = existing
      ? await db.episodicSummary.update({
          where: { journalEntryId: input.journalEntryId },
          data: {
            summary,
            topics: generated.topics,
            openLoops,
            whyShown: 'Generated from your journal entry to provide continuity over time.',
          },
        })
      : await db.episodicSummary.create({
          data: {
            userId: input.userId,
            journalEntryId: input.journalEntryId,
            summary,
            topics: generated.topics,
            openLoops,
            whyShown: 'Generated from your journal entry to provide continuity over time.',
          },
        });

    await db.auditLog.create({
      data: {
        userId: input.userId,
        action: 'episodic_summary.generated',
        entityType: 'EpisodicSummary',
        entityId: saved.id,
        metadata: {
          journalEntryId: input.journalEntryId,
          topicCount: generated.topics.length,
          openLoopCount: openLoops.length,
        },
      },
    });

    return { summary, topics: generated.topics, openLoops };
  }

  async writePreferenceMemory(input: {
    userId: string;
    key: string;
    value: unknown;
    source?: string;
    consentGranted: boolean;
    consentGivenAt?: Date;
  }) {
    if (!input.consentGranted) {
      throw new PreferenceMemoryConsentError();
    }

    const consentTimestamp = input.consentGivenAt ?? new Date();

    const saved = await db.preferenceMemory.upsert({
      where: { userId_key: { userId: input.userId, key: input.key } },
      create: {
        userId: input.userId,
        key: input.key,
        value: redactSensitiveJson(input.value),
        source: input.source ? redactSensitiveText(input.source) : null,
        consentGivenAt: consentTimestamp,
      },
      update: {
        value: redactSensitiveJson(input.value),
        source: input.source ? redactSensitiveText(input.source) : null,
        consentGivenAt: consentTimestamp,
        revokedAt: null,
      },
    });

    logInfo('memory.preference.written', { userId: input.userId, key: input.key });
    return saved;
  }

  async recall(userId: string, rawQuery: string): Promise<RecallItem[]> {
    const query = rawQuery.trim().toLowerCase();
    const [episodicRecords, preferenceRecords] = await Promise.all([
      db.episodicSummary.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      db.preferenceMemory.findMany({ where: { userId, revokedAt: null }, orderBy: { createdAt: 'desc' } }),
    ]);

    const episodicItems: RecallItem[] = [];

    for (const record of episodicRecords) {
      const reason = this.detectEpisodicReason(record, query);
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
      .filter((record) => this.detectPreferenceMatch(record, query))
      .map((record) => ({
        id: record.id,
        memoryType: 'preference',
        sourceDate: record.createdAt,
        content: `${record.key}: ${this.stringifyPreferenceValue(record.value)}`,
        reason: 'query match',
        journalEntryId: null,
        whyShown: 'Saved because you explicitly consented to store this preference.',
      }));

    return [...episodicItems, ...preferenceItems].sort((left, right) => right.sourceDate.getTime() - left.sourceDate.getTime());
  }

  async deleteMemory(input: { userId: string; memoryType: 'episodic' | 'preference'; id: string }) {
    if (input.memoryType === 'episodic') {
      const exists = await db.episodicSummary.findFirst({ where: { id: input.id, userId: input.userId }, select: { id: true } });
      if (!exists) {
        return false;
      }
      await db.episodicSummary.delete({ where: { id: input.id } });
    } else {
      const exists = await db.preferenceMemory.findFirst({ where: { id: input.id, userId: input.userId, revokedAt: null }, select: { id: true } });
      if (!exists) {
        return false;
      }
      await db.preferenceMemory.update({ where: { id: input.id }, data: { revokedAt: new Date() } });
    }

    await db.auditLog.create({
      data: {
        userId: input.userId,
        action: 'memory.deleted',
        entityType: input.memoryType === 'episodic' ? 'EpisodicSummary' : 'PreferenceMemory',
        entityId: input.id,
        metadata: { memoryType: input.memoryType },
      },
    });

    return true;
  }

  extractOpenLoops(content: string) {
    return generateEpisodicSummary(content).openLoops.map((loop) => redactSensitiveText(loop));
  }

  private detectEpisodicReason(record: { summary: string; topics: unknown; openLoops: unknown }, query: string): RecallReason | null {
    if (!query) return 'query match';
    const topics = Array.isArray(record.topics) ? record.topics : [];
    const loops = Array.isArray(record.openLoops) ? record.openLoops : [];
    if (topics.some((topic) => String(topic).toLowerCase().includes(query))) return 'topic overlap';
    if (loops.some((loop) => String(loop).toLowerCase().includes(query))) return 'open loop';
    if (record.summary.toLowerCase().includes(query)) return 'query match';
    return null;
  }

  private stringifyPreferenceValue(value: unknown) {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  private detectPreferenceMatch(record: { key: string; source: string | null; value: unknown }, query: string) {
    if (!query) return true;
    const haystack = [record.key, record.source ?? '', this.stringifyPreferenceValue(record.value)].join(' ').toLowerCase();
    return haystack.includes(query);
  }
}

export const memoryService = new MemoryService();
