import { describe, expect, it, vi } from 'vitest';

const { getAuthSessionMock, enforceRateLimitMock, auditCreateMock } = vi.hoisted(() => ({
  getAuthSessionMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  auditCreateMock: vi.fn(),
}));

vi.mock('../lib/auth', () => ({ getAuthSession: getAuthSessionMock }));
vi.mock('../lib/api-security', () => ({ enforceRateLimit: enforceRateLimitMock }));
vi.mock('../lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: auditCreateMock,
    },
  },
}));

import { POST } from '../app/api/abuse/route';

describe('POST /api/abuse', () => {
  it('validates payload', async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    enforceRateLimitMock.mockResolvedValueOnce(null);

    const res = await POST(new Request('http://localhost/api/abuse', { method: 'POST', body: JSON.stringify({ category: 'other', description: 'short' }) }));
    expect(res.status).toBe(400);
  });

  it('stores abuse report in audit log', async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: 'u1' } });
    enforceRateLimitMock.mockResolvedValueOnce(null);
    auditCreateMock.mockResolvedValueOnce({ id: 'a1', createdAt: new Date('2026-01-01T00:00:00.000Z') });

    const res = await POST(
      new Request('http://localhost/api/abuse', {
        method: 'POST',
        body: JSON.stringify({ category: 'other', description: 'This is a meaningful report', contactEmail: 'u@example.com' }),
      }),
    );

    expect(res.status).toBe(201);
    expect(auditCreateMock).toHaveBeenCalledTimes(1);
  });
});
