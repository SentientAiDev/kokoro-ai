import { prisma } from './prisma';
import { generateEpisodicSummary } from './episodic-summary';

type PipelineDb = {
  episodicSummary: {
    findUnique(args: {
      where: { journalEntryId: string };
      select: {
        id: true;
        summary: true;
        topics: true;
        openLoops: true;
      };
    }): Promise<{
      id: string;
      summary: string;
      topics: string[] | null;
      openLoops: string[] | null;
    } | null>;
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
  auditLog: {
    create(args: {
      data: {
        userId: string;
        action: string;
        entityType: string;
        entityId: string;
        metadata: { journalEntryId: string; topics: string[]; openLoopCount: number };
      };
    }): Promise<{ id: string }>;
  };
};

const db = prisma as unknown as PipelineDb;

export async function runEpisodicMemoryPipeline(input: {
  userId: string;
  journalEntryId: string;
  content: string;
}) {
  const result = generateEpisodicSummary(input.content);
  const existingSummary = await db.episodicSummary.findUnique({
    where: { journalEntryId: input.journalEntryId },
    select: {
      id: true,
      summary: true,
      topics: true,
      openLoops: true,
    },
  });

  const hasChanged =
    !existingSummary ||
    existingSummary.summary !== result.summary ||
    JSON.stringify(existingSummary.topics ?? []) !== JSON.stringify(result.topics) ||
    JSON.stringify(existingSummary.openLoops ?? []) !== JSON.stringify(result.openLoops);

  if (!hasChanged && existingSummary) {
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
}
