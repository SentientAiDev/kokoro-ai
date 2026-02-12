import { redactSensitiveJson } from './sensitive-data';

type Level = 'info' | 'warn' | 'error';

function emit(level: Level, event: string, payload?: Record<string, unknown>) {
  const data = payload ? (redactSensitiveJson(payload) as Record<string, unknown>) : undefined;
  const line = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...data,
  };

  const serialized = JSON.stringify(line);

  if (level === 'error') {
    console.error(serialized);
    return;
  }

  if (level === 'warn') {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export function logInfo(event: string, payload?: Record<string, unknown>) {
  emit('info', event, payload);
}

export function logWarn(event: string, payload?: Record<string, unknown>) {
  emit('warn', event, payload);
}

export function logError(event: string, payload?: Record<string, unknown>) {
  emit('error', event, payload);
}

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  const normalized =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
        }
      : {
          message: 'Unknown error',
        };

  logError('app.error', {
    ...context,
    error: normalized,
  });
}
