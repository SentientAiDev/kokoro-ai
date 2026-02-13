import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getActorMock, enforceRateLimitMock, createMock, logRequestMock } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  createMock: vi.fn(),
  logRequestMock: vi.fn(),
}));

vi.mock('../lib/actor', () => ({
  getActor: getActorMock,
}));

vi.mock('../lib/infrastructure/http', () => ({
  getRequestId: () => 'req-1',
  logRequest: logRequestMock,
  enforceRequestRateLimit: enforceRateLimitMock,
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    abuseReport: {
      create: createMock,
    },
  },
}));

import { POST } from '../app/api/abuse/route';

describe('POST /api/abuse', () => {
  beforeEach(() => {
    enforceRateLimitMock.mockResolvedValue(null);
    getActorMock.mockResolvedValue(null);
  });

  it('validates payload', async () => {
    const response = await POST(
      new Request('http://localhost/api/abuse', {
        method: 'POST',
        body: JSON.stringify({ category: 'bug', message: 'short' }),
      }),
    );

    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('creates abuse report', async () => {
    getActorMock.mockResolvedValue({ actorId: 'user-1', kind: 'USER' });
    createMock.mockResolvedValue({ id: 'abuse-1', createdAt: new Date('2026-01-01T00:00:00.000Z') });

    const response = await POST(
      new Request('http://localhost/api/abuse', {
        method: 'POST',
        body: JSON.stringify({ category: 'bug', message: 'There is a reproducible issue in recall view.' }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalled();
  });
});
