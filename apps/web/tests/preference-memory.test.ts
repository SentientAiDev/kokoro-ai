import { beforeEach, describe, expect, it, vi } from 'vitest';

const { upsertMock } = vi.hoisted(() => ({
  upsertMock: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    preferenceMemory: {
      upsert: upsertMock,
    },
  },
}));

import {
  PreferenceMemoryConsentError,
  writePreferenceMemory,
} from '../lib/preference-memory';

describe('writePreferenceMemory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upsertMock.mockResolvedValue({
      id: 'pref-1',
      userId: 'user-1',
      key: 'contact.preference',
      value: { email: '[REDACTED]' },
      source: 'journal [REDACTED:EMAIL]',
      consentGivenAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
  });

  it('requires explicit consent', async () => {
    await expect(
      writePreferenceMemory({
        userId: 'user-1',
        key: 'contact.preference',
        value: 'email me at person@example.com',
        consentGranted: false,
      }),
    ).rejects.toBeInstanceOf(PreferenceMemoryConsentError);

    expect(upsertMock).not.toHaveBeenCalled();
  });

  it('redacts sensitive values and source before writing', async () => {
    await writePreferenceMemory({
      userId: 'user-1',
      key: 'contact.preference',
      value: { email: 'person@example.com', phone: '555-333-4444' },
      source: 'journal entry person@example.com',
      consentGranted: true,
      consentGivenAt: new Date('2026-02-01T00:00:00.000Z'),
    });

    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          value: {
            email: '[REDACTED]',
            phone: '[REDACTED:PHONE]',
          },
          source: 'journal entry [REDACTED:EMAIL]',
        }),
      }),
    );
  });
});
