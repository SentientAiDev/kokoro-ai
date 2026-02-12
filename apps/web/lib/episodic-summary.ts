const TOPIC_KEYWORDS: Array<{ topic: string; keywords: string[] }> = [
  { topic: 'work', keywords: ['work', 'meeting', 'deadline', 'client', 'project'] },
  { topic: 'health', keywords: ['health', 'sleep', 'exercise', 'workout', 'doctor'] },
  { topic: 'relationships', keywords: ['family', 'friend', 'partner', 'relationship', 'mom', 'dad'] },
  { topic: 'finance', keywords: ['money', 'budget', 'bill', 'expense', 'salary'] },
  { topic: 'learning', keywords: ['study', 'learn', 'course', 'read', 'practice'] },
];

const OPEN_LOOP_MARKERS = [
  'todo',
  'to do',
  'need to',
  'follow up',
  'follow-up',
  'waiting',
  'pending',
  'later',
  'next step',
  'remember to',
  'should',
  '?',
];

export type EpisodicSummaryResult = {
  summary: string;
  topics: string[];
  openLoops: string[];
};

function normalizeWhitespace(input: string) {
  return input.replace(/\s+/g, ' ').trim();
}

function splitIntoSegments(content: string) {
  return content
    .split(/\n+|(?<=[.!?])\s+/)
    .map((segment) => normalizeWhitespace(segment))
    .filter(Boolean);
}

function buildShortSummary(content: string) {
  const segments = splitIntoSegments(content);
  const firstSegment = segments[0];

  if (!firstSegment) {
    return 'No details were provided for this day.';
  }

  if (firstSegment.length <= 180) {
    return firstSegment;
  }

  return `${firstSegment.slice(0, 177).trimEnd()}...`;
}

function detectTopics(content: string) {
  const lowered = content.toLowerCase();
  const topics = TOPIC_KEYWORDS.filter(({ keywords }) =>
    keywords.some((keyword) => lowered.includes(keyword)),
  ).map(({ topic }) => topic);

  return topics.slice(0, 5);
}

function detectOpenLoops(content: string) {
  const segments = splitIntoSegments(content);

  return segments
    .filter((segment) => {
      const lowered = segment.toLowerCase();
      return OPEN_LOOP_MARKERS.some((marker) => lowered.includes(marker));
    })
    .slice(0, 5);
}

export function generateEpisodicSummary(content: string): EpisodicSummaryResult {
  const normalized = normalizeWhitespace(content);

  return {
    summary: buildShortSummary(normalized),
    topics: detectTopics(normalized),
    openLoops: detectOpenLoops(content),
  };
}
