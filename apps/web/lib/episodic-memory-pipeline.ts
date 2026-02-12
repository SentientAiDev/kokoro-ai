import { prisma } from './prisma';
import { generateEpisodicSummary } from './episodic-summary';

type PipelineDb = {
  episodicSummary: {
    upsert(args: {
      where: { journalEntryId: string };
      create: {
        userId: string;
        journalEntryId: string;
        summary: string;
        topics: string[];
        openLoops: string[];
        whyShown: string;
      };
      update: {
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

  const episodicSummary = await db.episodicSummary.upsert({
    where: { journalEntryId: input.journalEntryId },
    create: {
      userId: input.userId,
      journalEntryId: input.journalEntryId,
      summary: result.summary,
      topics: result.topics,
      openLoops: result.openLoops,
      whyShown: 'Generated from your journal entry to provide continuity over time.',
    },
    update: {
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
