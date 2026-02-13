import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getActorMock, createJournalEntryMock, enforceRateLimitMock, logRequestMock } = vi.hoisted(() => ({
  getActorMock: vi.fn(),
  createJournalEntryMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  logRequestMock: vi.fn(),
}));

vi.mock('../lib/actor', () => ({
  getActor: getActorMock,
}));

vi.mock('../lib/journal', () => ({
  createJournalEntry: createJournalEntryMock,
}));

vi.mock('../lib/infrastructure/http', () => ({
  getRequestId: () => 'req-1',
  logRequest: logRequestMock,
  enforceRequestRateLimit: enforceRateLimitMock,
}));

import { POST } from '../app/api/journal/route';

describe('POST /api/journal', () => {
  beforeEach(() => {
    enforceRateLimitMock.mockResolvedValue(null);
  });

  it('returns unauthorized when no session exists', async () => {
    getActorMock.mockResolvedValueOnce(null);

    const response = await POST(
      new Request('http://localhost/api/journal', {
        method: 'POST',
        body: JSON.stringify({ content: 'test' }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it('returns 429 when rate limit is exceeded', async () => {
    getActorMock.mockResolvedValueOnce({ actorId: 'user-1', kind: 'USER' });
    enforceRateLimitMock.mockResolvedValueOnce(new Response(null, { status: 429 }));

    const response = await POST(
      new Request('http://localhost/api/journal', {
        method: 'POST',
        body: JSON.stringify({ content: 'hello' }),
      }),
    );

    expect(response.status).toBe(429);
    expect(createJournalEntryMock).not.toHaveBeenCalled();
  });

  it('returns validation error for empty content', async () => {
    getActorMock.mockResolvedValueOnce({ actorId: 'user-1', kind: 'USER' });

    const response = await POST(
      new Request('http://localhost/api/journal', {
        method: 'POST',
        body: JSON.stringify({ content: '' }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it('creates a journal entry for valid input', async () => {
    getActorMock.mockResolvedValueOnce({ actorId: 'user-1', kind: 'USER' });
    createJournalEntryMock.mockResolvedValueOnce({
      id: 'entry-1',
      content: 'hello',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const response = await POST(
      new Request('http://localhost/api/journal', {
        method: 'POST',
        body: JSON.stringify({ content: 'hello' }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createJournalEntryMock).toHaveBeenCalledWith('user-1', 'hello');
  });
});
