import { describe, expect, it } from 'vitest';
import HomePage from '../app/page';

describe('HomePage', () => {
  it('renders content function', () => {
    const page = HomePage();
    expect(page).toBeTruthy();
  });
});
