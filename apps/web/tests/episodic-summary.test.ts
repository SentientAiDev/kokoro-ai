import { describe, expect, it } from 'vitest';
import { generateEpisodicSummary } from '../lib/episodic-summary';

describe('generateEpisodicSummary', () => {
  it('creates a deterministic short summary from the first segment', () => {
    const content =
      'Had a productive work meeting with the client today. We reviewed the roadmap and delivery dates.';

    const result = generateEpisodicSummary(content);

    expect(result.summary).toBe('Had a productive work meeting with the client today.');
  });

  it('extracts known topics based on keyword matches', () => {
    const content =
      'I did a workout before work, then joined a project meeting and studied for my course tonight.';

    const result = generateEpisodicSummary(content);

    expect(result.topics).toEqual(['work', 'health', 'learning']);
  });

  it('normalizes whitespace and truncates long first segments', () => {
    const content = `   ${'a'.repeat(200)}. second sentence`;

    const result = generateEpisodicSummary(content);

    expect(result.summary.length).toBeLessThanOrEqual(180);
    expect(result.summary.endsWith('...')).toBe(true);
  });

  it('limits open loops to at most five entries', () => {
    const content = [
      'Need to do one.',
      'Need to do two.',
      'Need to do three.',
      'Need to do four.',
      'Need to do five.',
      'Need to do six.',
    ].join(' ');

    const result = generateEpisodicSummary(content);

    expect(result.openLoops).toHaveLength(5);
  });

  it('detects open loops and unresolved items with marker heuristics', () => {
    const content = [
      'Need to follow up with the dentist.',
      'TODO: finish the budget sheet.',
      'I am waiting on feedback from the team?',
      'Went for a walk after dinner.',
    ].join('\n');

    const result = generateEpisodicSummary(content);

    expect(result.openLoops).toEqual([
      'Need to follow up with the dentist.',
      'TODO: finish the budget sheet.',
      'I am waiting on feedback from the team?',
    ]);
  });
});
