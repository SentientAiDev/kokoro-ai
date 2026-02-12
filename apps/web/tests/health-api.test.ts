import { describe, expect, it, vi } from 'vitest';

const { queryRawMock } = vi.hoisted(() => ({
  queryRawMock: vi.fn(),
}));

vi.mock('../lib/prisma', () => ({
  prisma: {
    $queryRawUnsafe: queryRawMock,
  },
}));

import { GET } from '../app/api/health/route';

describe('GET /api/health', () => {
  it('returns ok when db query succeeds', async () => {
    queryRawMock.mockResolvedValue([{ '?column?': 1 }]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.status).toBe('ok');
    expect(payload.db).toBe('ok');
  });

  it('returns degraded when db query fails', async () => {
    queryRawMock.mockRejectedValue(new Error('db down'));

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload.status).toBe('degraded');
    expect(payload.db).toBe('down');
  });
});
