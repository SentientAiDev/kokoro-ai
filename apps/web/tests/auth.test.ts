import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/prisma', () => ({
  prisma: {},
}));

import { authOptions } from '../lib/auth';

describe('authOptions', () => {
  it('uses email provider for magic links', () => {
    expect(authOptions.providers).toBeDefined();
    expect(authOptions.providers?.[0]?.id).toBe('email');
  });

  it('uses database sessions', () => {
    expect(authOptions.session?.strategy).toBe('database');
  });
});
