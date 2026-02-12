import { prisma } from './prisma';
import { redactSensitiveJson, redactSensitiveText } from './sensitive-data';

export class PreferenceMemoryConsentError extends Error {
  constructor() {
    super('Preference memory requires explicit user consent.');
    this.name = 'PreferenceMemoryConsentError';
  }
}

type PreferenceMemoryDb = {
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
};

const db = prisma as unknown as PreferenceMemoryDb;

export async function writePreferenceMemory(input: {
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

  return db.preferenceMemory.upsert({
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
}
