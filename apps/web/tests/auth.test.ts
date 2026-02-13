import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockedPrisma = {
  user: {
    upsert: vi.fn(),
  },
};

vi.mock('../lib/prisma', () => ({ prisma: mockedPrisma }));

describe('authOptions', () => {
  beforeEach(() => {
    vi.resetModules();
    delete process.env.EMAIL_SERVER;
    delete process.env.EMAIL_FROM;
    process.env.DEV_AUTH_BYPASS = 'false';
  });

  it('enables email provider only when email env vars are set', async () => {
    let auth = await import('../lib/auth');
    expect(auth.authOptions.providers?.find((provider) => provider.id === 'email')).toBeUndefined();

    vi.resetModules();
    process.env.EMAIL_SERVER = 'smtp://localhost:1025';
    process.env.EMAIL_FROM = 'test@example.com';
    auth = await import('../lib/auth');

    expect(auth.authOptions.providers?.find((provider) => provider.id === 'email')).toBeDefined();
  });

  it('uses database sessions', async () => {
    const auth = await import('../lib/auth');
    expect(auth.authOptions.session?.strategy).toBe('database');
  });
});
