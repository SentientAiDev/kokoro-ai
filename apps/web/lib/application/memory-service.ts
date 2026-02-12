import { processJournalIntoMemory } from '../domain/memory-processing';
import { prisma } from '../prisma';
import { redactJson, redactText } from '../infrastructure/redaction';
import { logInfo } from '../infrastructure/logger';
import type { RecallItem } from '../recall';
import {
  searchRecall as searchRecallInternal,
  deleteMemoryItem as deleteMemoryItemInternal,
  deleteAllMemoriesForUser as deleteAllMemoriesForUserInternal,
} from '../recall';

export class PreferenceMemoryConsentError extends Error {
  constructor() {
    super('Preference memory requires explicit user consent.');
    this.name = 'PreferenceMemoryConsentError';
  }
}

type Db = {
  episodicSummary: {
    findUnique(args: {
      where: { journalEntryId: string };
      select: {
        id: true;
        summary: true;
        topics: true;
        openLoops: true;
      };
    }): Promise<{ id: string; summary: string; topics: string[] | null; openLoops: string[] | null } | null>;
    create(args: {
      data: {
        userId: string;
        journalEntryId: string;
        summary: string;
        topics: string[];
        openLoops: string[];
        whyShown: string;
      };
    }): Promise<{ id: string }>;
    update(args: {
      where: { journalEntryId: string };
      data: {
        summary: string;
        topics: string[];
        openLoops: string[];
        whyShown: string;
      };
    }): Promise<{ id: string }>;
  };
  preferenceMemory: {
    upsert(args: {
      where: { userId_key: { userId: string; key: string } };
      create: {
        userId: string;
        key: string;
        value: unknown;
        source: string | null;
        consentGivenAt: Date;
      };
      update: {
        value: unknown;
        source: string | null;
        consentGivenAt: Date;
        revokedAt: null;
      };
    }): Promise<{
      id: string;
      userId: string;
      key: string;
      value: unknown;
      source: string | null;
      consentGivenAt: Date;
      updatedAt: Date;
    }>;
  };
  auditLog: {
    create(args: {
      data: {
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata: Record<string, unknown>;
      };
    }): Promise<{ id: string }>;
  };
};

const db = prisma as unknown as Db;

export const MemoryService = {
  async writeEpisodicSummaryFromJournal(input: { userId: string; journalEntryId: string; content: string }) {
    const result = processJournalIntoMemory(input.content);
    const existingSummary = await db.episodicSummary.findUnique({
      where: { journalEntryId: input.journalEntryId },
      select: { id: true, summary: true, topics: true, openLoops: true },
    });

    const hasChanged =
      !existingSummary ||
      existingSummary.summary !== result.summary ||
      JSON.stringify(existingSummary.topics ?? []) !== JSON.stringify(result.topics) ||
      JSON.stringify(existingSummary.openLoops ?? []) !== JSON.stringify(result.openLoops);

    if (!hasChanged) {
      return result;
    }

    const episodicSummary = existingSummary
      ? await db.episodicSummary.update({
          where: { journalEntryId: input.journalEntryId },
          data: {
            summary: result.summary,
            topics: result.topics,
            openLoops: result.openLoops,
            whyShown: 'Generated from your journal entry to provide continuity over time.',
          },
        })
      : await db.episodicSummary.create({
          data: {
            userId: input.userId,
            journalEntryId: input.journalEntryId,
            summary: result.summary,
            topics: result.topics,
            openLoops: result.openLoops,
            whyShown: 'Generated from your journal entry to provide continuity over time.',
          },
        });

    await db.auditLog.create({
      data: {
        userId: input.userId,
        action: 'episodic_summary.generated',
        entityType: 'EpisodicSummary',
        entityId: episodicSummary.id,
        metadata: {
          journalEntryId: input.journalEntryId,
          topics: result.topics,
          openLoopCount: result.openLoops.length,
        },
      },
    });

    return result;
  },

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

    const memory = await db.preferenceMemory.upsert({
      where: { userId_key: { userId: input.userId, key: input.key } },
      create: {
        userId: input.userId,
        key: input.key,
        value: redactJson(input.value),
        source: input.source ? redactText(input.source) : null,
        consentGivenAt: input.consentGivenAt ?? new Date(),
      },
      update: {
        value: redactJson(input.value),
        source: input.source ? redactText(input.source) : null,
        consentGivenAt: input.consentGivenAt ?? new Date(),
        revokedAt: null,
      },
    });

    logInfo({
      event: 'memory.preference.write',
      message: 'Preference memory upserted',
      data: { userId: input.userId, key: input.key, source: input.source },
    });

    return memory;
  },

  async recall(userId: string, query: string): Promise<RecallItem[]> {
    return searchRecallInternal(userId, query);
  },

  async deleteMemory(input: { userId: string; memoryType: 'episodic' | 'preference'; id: string }) {
    return deleteMemoryItemInternal(input);
  },

  async deleteAllMemories(userId: string) {
    return deleteAllMemoriesForUserInternal(userId);
  },
};
