const SENSITIVE_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: '[REDACTED:EMAIL]',
  },
  {
    pattern: /\b(?:\+?\d{1,2}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/g,
    replacement: '[REDACTED:PHONE]',
  },
  {
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    replacement: '[REDACTED:SSN]',
  },
  {
    pattern: /\b(?:\d[ -]*?){13,16}\b/g,
    replacement: '[REDACTED:CARD]',
  },
  {
    pattern: /(authorization|cookie|token|secret|password|api[-_]?key)\s*[:=]\s*[^\s,;]+/gi,
    replacement: '$1=[REDACTED:SECRET]',
  },
];

function redactTextValue(input: string) {
  return SENSITIVE_PATTERNS.reduce(
    (value, { pattern, replacement }) => value.replace(pattern, replacement),
    input,
  );
}

export function redactText(input: string) {
  return redactTextValue(input);
}

export function redactJson(value: unknown): unknown {
  if (typeof value === 'string') {
    return redactText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactJson(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, redactJson(nestedValue)]),
    );
  }

  return value;
}
