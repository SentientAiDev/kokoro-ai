import { prisma } from './prisma';

export type CheckInStatus = 'pending' | 'dismissed' | 'snoozed' | 'done';

export type CheckInReasonDetails = {
  openLoops: Array<{ summaryId: string; summary: string; loop: string }>;
  inactivityDays: number | null;
  sourceSummaryIds: string[];
};

type SchedulerUser = {
  id: string;
  notificationSetting: {
    proactiveCheckIns: boolean;
    checkInWindowStart: string;
    checkInWindowEnd: string;
    checkInMaxPerDay: number;
    checkInInactivityDays: number;
  } | null;
};

type OpenLoopSummary = {
  id: string;
  summary: string;
  openLoops: string[] | null;
  createdAt: Date;
};

type CheckInSuggestionRecord = {
  id: string;
  message: string;
  status: CheckInStatus;
  why: string;
  reasonDetails: CheckInReasonDetails;
  createdAt: Date;
  snoozedUntil: Date | null;
};

type CheckInDb = {
  user: {
    findMany(args: {
      where: { notificationSetting: { is: { proactiveCheckIns: true } } };
      select: {
        id: true;
        notificationSetting: {
          select: {
            proactiveCheckIns: true;
            checkInWindowStart: true;
            checkInWindowEnd: true;
            checkInMaxPerDay: true;
            checkInInactivityDays: true;
          };
        };
      };
    }): Promise<SchedulerUser[]>;
  };
  notificationSetting: {
    upsert(args: {
      where: { userId: string };
      create: {
        userId: string;
        proactiveCheckIns: boolean;
        checkInWindowStart: string;
        checkInWindowEnd: string;
        checkInMaxPerDay: number;
        checkInInactivityDays: number;
      };
      update: {
        proactiveCheckIns?: boolean;
        checkInWindowStart?: string;
        checkInWindowEnd?: string;
        checkInMaxPerDay?: number;
        checkInInactivityDays?: number;
      };
      select: {
        proactiveCheckIns: true;
        checkInWindowStart: true;
        checkInWindowEnd: true;
        checkInMaxPerDay: true;
        checkInInactivityDays: true;
      };
    }): Promise<{
      proactiveCheckIns: boolean;
      checkInWindowStart: string;
      checkInWindowEnd: string;
      checkInMaxPerDay: number;
      checkInInactivityDays: number;
    }>;
    findUnique(args: {
      where: { userId: string };
      select: {
        proactiveCheckIns: true;
        checkInWindowStart: true;
        checkInWindowEnd: true;
        checkInMaxPerDay: true;
        checkInInactivityDays: true;
      };
    }): Promise<{
      proactiveCheckIns: boolean;
      checkInWindowStart: string;
      checkInWindowEnd: string;
      checkInMaxPerDay: number;
      checkInInactivityDays: number;
    } | null>;
  };
  checkInSuggestion: {
    count(args: { where: { userId: string; createdAt: { gte: Date; lt: Date } } }): Promise<number>;
    create(args: {
      data: {
        userId: string;
        message: string;
        why: string;
        reasonDetails: CheckInReasonDetails;
      };
      select: {
        id: true;
        message: true;
        status: true;
        why: true;
        reasonDetails: true;
        createdAt: true;
        snoozedUntil: true;
      };
    }): Promise<CheckInSuggestionRecord>;
    findMany(args: {
      where: { userId: string; OR: Array<{ status: 'pending' } | { status: 'snoozed'; snoozedUntil: { lte: Date } }> };
      orderBy: { createdAt: 'desc' };
      select: {
        id: true;
        message: true;
        status: true;
        why: true;
        reasonDetails: true;
        createdAt: true;
        snoozedUntil: true;
      };
      take: number;
    }): Promise<CheckInSuggestionRecord[]>;
    findFirst(args: {
      where: { id: string; userId: string };
      select: { id: true; status: true };
    }): Promise<{ id: string; status: CheckInStatus } | null>;
    update(args: {
      where: { id: string };
      data: { status: CheckInStatus; snoozedUntil?: Date | null };
      select: {
        id: true;
        message: true;
        status: true;
        why: true;
        reasonDetails: true;
        createdAt: true;
        snoozedUntil: true;
      };
    }): Promise<CheckInSuggestionRecord>;
  };
  episodicSummary: {
    findMany(args: {
      where: { userId: string; createdAt: { gte: Date } };
      orderBy: { createdAt: 'desc' };
      take: number;
      select: {
        id: true;
        summary: true;
        openLoops: true;
        createdAt: true;
      };
    }): Promise<OpenLoopSummary[]>;
  };
  journalEntry: {
    findFirst(args: {
      where: { userId: string };
      orderBy: { createdAt: 'desc' };
      select: { createdAt: true };
    }): Promise<{ createdAt: Date } | null>;
  };
  auditLog: {
    create(args: {
      data: {
        userId: string;
        action: string;
        entityType: 'CheckInSuggestion';
        entityId: string;
        metadata: Record<string, unknown>;
      };
    }): Promise<{ id: string }>;
  };
};

const db = prisma as unknown as CheckInDb;

function startOfUtcDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date) {
  const start = startOfUtcDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

function diffInDays(left: Date, right: Date) {
  return Math.floor((left.getTime() - right.getTime()) / (24 * 60 * 60 * 1000));
}

export async function getCheckInSettings(userId: string) {
  const existing = await db.notificationSetting.findUnique({
    where: { userId },
    select: {
      proactiveCheckIns: true,
      checkInWindowStart: true,
      checkInWindowEnd: true,
      checkInMaxPerDay: true,
      checkInInactivityDays: true,
    },
  });

  if (existing) {
    return existing;
  }

  return db.notificationSetting.upsert({
    where: { userId },
    create: {
      userId,
      proactiveCheckIns: false,
      checkInWindowStart: '09:00',
      checkInWindowEnd: '20:00',
      checkInMaxPerDay: 1,
      checkInInactivityDays: 3,
    },
    update: {},
    select: {
      proactiveCheckIns: true,
      checkInWindowStart: true,
      checkInWindowEnd: true,
      checkInMaxPerDay: true,
      checkInInactivityDays: true,
    },
  });
}

export async function updateCheckInSettings(
  userId: string,
  settings: {
    proactiveCheckIns: boolean;
    checkInWindowStart: string;
    checkInWindowEnd: string;
    checkInMaxPerDay: number;
    checkInInactivityDays: number;
  },
) {
  return db.notificationSetting.upsert({
    where: { userId },
    create: {
      userId,
      ...settings,
    },
    update: settings,
    select: {
      proactiveCheckIns: true,
      checkInWindowStart: true,
      checkInWindowEnd: true,
      checkInMaxPerDay: true,
      checkInInactivityDays: true,
    },
  });
}

export async function generateCheckInSuggestionForUser(userId: string, now: Date = new Date()) {
  const settings = await getCheckInSettings(userId);

  if (!settings.proactiveCheckIns) {
    return null;
  }

  const existingCount = await db.checkInSuggestion.count({
    where: {
      userId,
      createdAt: {
        gte: startOfUtcDay(now),
        lt: endOfUtcDay(now),
      },
    },
  });

  if (existingCount >= settings.checkInMaxPerDay) {
    return null;
  }

  const openLoopSummaries = await db.episodicSummary.findMany({
    where: {
      userId,
      createdAt: {
        gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      summary: true,
      openLoops: true,
      createdAt: true,
    },
  });

  const openLoops = openLoopSummaries
    .flatMap((summary) =>
      (summary.openLoops ?? []).map((loop) => ({
        summaryId: summary.id,
        summary: summary.summary,
        loop,
      })),
    )
    .slice(0, 3);

  const latestJournal = await db.journalEntry.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  const inactivityDays = latestJournal ? diffInDays(now, latestJournal.createdAt) : settings.checkInInactivityDays;
  const isInactive = inactivityDays >= settings.checkInInactivityDays;

  if (openLoops.length === 0 && !isInactive) {
    return null;
  }

  const whyParts: string[] = [];

  if (openLoops.length > 0) {
    whyParts.push(`You have ${openLoops.length} open loop${openLoops.length === 1 ? '' : 's'} from recent summaries.`);
  }

  if (isInactive) {
    whyParts.push(`No journal entries in the last ${inactivityDays} day${inactivityDays === 1 ? '' : 's'}.`);
  }

  const message = openLoops.length > 0 ? `Quick check-in: ${openLoops[0].loop}` : 'Quick check-in: how are you feeling today?';
  const reasonDetails: CheckInReasonDetails = {
    openLoops,
    inactivityDays: isInactive ? inactivityDays : null,
    sourceSummaryIds: [...new Set(openLoops.map((loop) => loop.summaryId))],
  };

  const suggestion = await db.checkInSuggestion.create({
    data: {
      userId,
      message,
      why: whyParts.join(' '),
      reasonDetails,
    },
    select: {
      id: true,
      message: true,
      status: true,
      why: true,
      reasonDetails: true,
      createdAt: true,
      snoozedUntil: true,
    },
  });

  await db.auditLog.create({
    data: {
      userId,
      action: 'checkin.created',
      entityType: 'CheckInSuggestion',
      entityId: suggestion.id,
      metadata: {
        sourceSummaryIds: reasonDetails.sourceSummaryIds,
        inactivityDays: reasonDetails.inactivityDays,
      },
    },
  });

  return suggestion;
}

export async function runDailyCheckInScheduler(now: Date = new Date()) {
  const users = await db.user.findMany({
    where: {
      notificationSetting: {
        is: {
          proactiveCheckIns: true,
        },
      },
    },
    select: {
      id: true,
      notificationSetting: {
        select: {
          proactiveCheckIns: true,
          checkInWindowStart: true,
          checkInWindowEnd: true,
          checkInMaxPerDay: true,
          checkInInactivityDays: true,
        },
      },
    },
  });

  let created = 0;

  for (const user of users) {
    const suggestion = await generateCheckInSuggestionForUser(user.id, now);

    if (suggestion) {
      created += 1;
    }
  }

  return { processed: users.length, created };
}

export async function listActiveCheckInSuggestions(userId: string) {
  return db.checkInSuggestion.findMany({
    where: {
      userId,
      OR: [{ status: 'pending' }, { status: 'snoozed', snoozedUntil: { lte: new Date() } }],
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      message: true,
      status: true,
      why: true,
      reasonDetails: true,
      createdAt: true,
      snoozedUntil: true,
    },
    take: 5,
  });
}

export async function applyCheckInSuggestionAction(input: {
  userId: string;
  suggestionId: string;
  action: 'dismiss' | 'snooze' | 'done';
  snoozeDays?: number;
}) {
  const suggestion = await db.checkInSuggestion.findFirst({
    where: {
      id: input.suggestionId,
      userId: input.userId,
    },
    select: { id: true, status: true },
  });

  if (!suggestion) {
    return null;
  }

  const actionMap: Record<typeof input.action, { status: CheckInStatus; auditAction: string }> = {
    dismiss: { status: 'dismissed', auditAction: 'checkin.dismissed' },
    snooze: { status: 'snoozed', auditAction: 'checkin.snoozed' },
    done: { status: 'done', auditAction: 'checkin.done' },
  };

  const selectedAction = actionMap[input.action];
  const snoozeDays = Math.max(1, Math.min(input.snoozeDays ?? 1, 30));

  const updated = await db.checkInSuggestion.update({
    where: { id: input.suggestionId },
    data: {
      status: selectedAction.status,
      snoozedUntil:
        selectedAction.status === 'snoozed' ? new Date(Date.now() + snoozeDays * 24 * 60 * 60 * 1000) : null,
    },
    select: {
      id: true,
      message: true,
      status: true,
      why: true,
      reasonDetails: true,
      createdAt: true,
      snoozedUntil: true,
    },
  });

  await db.auditLog.create({
    data: {
      userId: input.userId,
      action: selectedAction.auditAction,
      entityType: 'CheckInSuggestion',
      entityId: input.suggestionId,
      metadata: {
        previousStatus: suggestion.status,
        nextStatus: updated.status,
        snoozeDays: selectedAction.status === 'snoozed' ? snoozeDays : undefined,
      },
    },
  });

  return updated;
}
