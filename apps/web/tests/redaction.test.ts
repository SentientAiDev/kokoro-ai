import { describe, expect, it } from 'vitest';
import { redactSensitiveJson, redactSensitiveText } from '../lib/sensitive-data';

describe('redaction', () => {
  it('redacts sensitive text patterns', () => {
    const redacted = redactSensitiveText('email me at user@example.com or 212-555-1212');
    expect(redacted).toContain('[REDACTED:EMAIL]');
    expect(redacted).toContain('[REDACTED:PHONE]');
  });

  it('recursively redacts JSON values', () => {
    const redacted = redactSensitiveJson({
      profile: {
        email: 'person@example.com',
        secret: 'token: abc123',
      },
    });

    expect(redacted).toEqual({
      profile: {
        email: '[REDACTED:EMAIL]',
        secret: 'token=[REDACTED:SECRET]',
      },
    });
  });
});
