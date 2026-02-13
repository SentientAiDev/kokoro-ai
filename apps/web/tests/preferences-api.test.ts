import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getActorMock, writePreferenceMemoryMock, enforceRateLimitMock, logRequestMock } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  writePreferenceMemoryMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  logRequestMock: vi.fn(),
}));

vi.mock('../lib/actor', () => ({
  getActor: getActorMock,
}));

vi.mock('../lib/preference-memory', () => ({
  writePreferenceMemory: writePreferenceMemoryMock,
}));

vi.mock('../lib/infrastructure/http', () => ({
  getRequestId: () => 'req-1',
  logRequest: logRequestMock,
  enforceRequestRateLimit: enforceRateLimitMock,
}));

import { POST } from '../app/api/preferences/route';

describe('POST /api/preferences', () => {
  beforeEach(() => {
    enforceRateLimitMock.mockResolvedValue(null);
  });

  it('returns unauthorized when no session exists', async () => {
    getActorMock.mockResolvedValueOnce(null);

    const response = await POST(
      new Request('http://localhost/api/preferences', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(401);
  });

  it('returns 400 when consent is not explicitly true', async () => {
    getActorMock.mockResolvedValueOnce({ actorId: 'user-1', kind: 'USER' });

    const response = await POST(
      new Request('http://localhost/api/preferences', {
        method: 'POST',
        body: JSON.stringify({
          key: 'communication',
          value: { email: 'person@example.com' },
          consentGranted: false,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(writePreferenceMemoryMock).not.toHaveBeenCalled();
  });

  it('writes a preference when consent is present', async () => {
    getActorMock.mockResolvedValueOnce({ actorId: 'user-1', kind: 'USER' });
    writePreferenceMemoryMock.mockResolvedValueOnce({
      id: 'pref-1',
      key: 'communication',
      value: { channel: 'email' },
      source: 'settings',
      consentGivenAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const response = await POST(
      new Request('http://localhost/api/preferences', {
        method: 'POST',
        body: JSON.stringify({
          key: 'communication',
          value: { channel: 'email' },
          source: 'settings',
          consentGranted: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(writePreferenceMemoryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        key: 'communication',
        consentGranted: true,
      }),
    );
  });
});
