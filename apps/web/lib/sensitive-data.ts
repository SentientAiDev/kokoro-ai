import { redactJson, redactText } from './infrastructure/redaction';

export function redactSensitiveText(input: string) {
  return redactText(input);
}

export function redactSensitiveJson(value: unknown): unknown {
  return redactJson(value);
}
