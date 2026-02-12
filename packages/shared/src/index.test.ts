import { describe, expect, it } from 'vitest';
import { appName } from './index';

describe('shared constants', () => {
  it('exports app name', () => {
    expect(appName).toBe('Kokoro Presence');
  });
});
