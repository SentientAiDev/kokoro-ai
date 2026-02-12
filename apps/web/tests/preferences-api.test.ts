import { describe, expect, it, vi } from 'vitest';

const { getAuthSessionMock, writePreferenceMemoryMock, enforceRateLimitMock } = vi.hoisted(() => ({
  getAuthSessionMock: vi.fn(),
  writePreferenceMemoryMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
}));

vi.mock('../lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('../lib/application/memory-service', () => ({
  memoryService: {
    writePreferenceMemory: writePreferenceMemoryMock,
  },
}));

vi.mock('../lib/api-security', () => ({
  enforceRateLimit: enforceRateLimitMock,
  handleApiError: (error: unknown) => Response.json({ error: String(error) }, { status: 500 }),
  logApiRequest: vi.fn(),
}));

import { POST } from '../app/api/preferences/route';

describe('POST /api/preferences', () => {
  it('returns unauthorized when no session exists', async () => {
    getAuthSessionMock.mockResolvedValueOnce(null);

    const response = await POST(
      new Request('http://localhost/api/preferences', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(401);
  });

  it('returns 400 when consent is not explicitly true', async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: 'user-1' } });
    enforceRateLimitMock.mockResolvedValueOnce(null);

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
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: 'user-1' } });
    enforceRateLimitMock.mockResolvedValueOnce(null);
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
