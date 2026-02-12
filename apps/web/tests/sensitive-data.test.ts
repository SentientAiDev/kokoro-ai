import { describe, expect, it } from 'vitest';

import { redactSensitiveJson, redactSensitiveText } from '../lib/sensitive-data';

describe('sensitive data redaction', () => {
  it('redacts common sensitive text patterns', () => {
    const text = 'Email me at a@example.com or call 555-111-2222 with card 4242 4242 4242 4242';

    const redacted = redactSensitiveText(text);

    expect(redacted).toContain('[REDACTED:EMAIL]');
    expect(redacted).toContain('[REDACTED:PHONE]');
    expect(redacted).toContain('[REDACTED:CARD]');
  });

  it('redacts nested JSON payloads', () => {
    const value = {
      profile: {
        email: 'person@example.com',
      },
      notes: ['reach me at 555-123-4567'],
    };

    expect(redactSensitiveJson(value)).toEqual({
      profile: {
        email: '[REDACTED:EMAIL]',
      },
      notes: ['reach me at [REDACTED:PHONE]'],
    });
  });
});
