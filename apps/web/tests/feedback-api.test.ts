import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getAuthSessionMock, enforceRateLimitMock, createMock, logRequestMock } = vi.hoisted(() => ({
  getAuthSessionMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  createMock: vi.fn(),
  logRequestMock: vi.fn(),
}));

vi.mock('../lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('../lib/infrastructure/http', () => ({
  getRequestId: () => 'req-1',
  logRequest: logRequestMock,
  enforceRequestRateLimit: enforceRateLimitMock,
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    feedbackMessage: {
      create: createMock,
    },
  },
}));

import { POST } from '../app/api/feedback/route';

describe('POST /api/feedback', () => {
  beforeEach(() => {
    enforceRateLimitMock.mockResolvedValue(null);
    getAuthSessionMock.mockResolvedValue(null);
  });

  it('validates payload', async () => {
    const response = await POST(
      new Request('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ message: 'short' }),
      }),
    );

    expect(response.status).toBe(400);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('stores feedback message', async () => {
    getAuthSessionMock.mockResolvedValue({ user: { id: 'user-1' } });
    createMock.mockResolvedValue({ id: 'feedback-1', createdAt: new Date('2026-01-01T00:00:00.000Z') });

    const response = await POST(
      new Request('http://localhost/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ message: 'This is a useful feature request for launch readiness.' }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalled();
  });
});
