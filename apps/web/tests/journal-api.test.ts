import { describe, expect, it, vi } from 'vitest';

const { getAuthSessionMock, createJournalEntryMock } = vi.hoisted(() => ({
  getAuthSessionMock: vi.fn(),
  createJournalEntryMock: vi.fn(),
}));

vi.mock('../lib/auth', () => ({
  getAuthSession: getAuthSessionMock,
}));

vi.mock('../lib/journal', () => ({
  createJournalEntry: createJournalEntryMock,
}));

import { POST } from '../app/api/journal/route';

describe('POST /api/journal', () => {
  it('returns unauthorized when no session exists', async () => {
    getAuthSessionMock.mockResolvedValueOnce(null);

    const response = await POST(
      new Request('http://localhost/api/journal', {
        method: 'POST',
        body: JSON.stringify({ content: 'test' }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it('returns validation error for empty content', async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: 'user-1' } });

    const response = await POST(
      new Request('http://localhost/api/journal', {
        method: 'POST',
        body: JSON.stringify({ content: '' }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it('creates a journal entry for valid input', async () => {
    getAuthSessionMock.mockResolvedValueOnce({ user: { id: 'user-1' } });
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
