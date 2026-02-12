import { redactJson } from './redaction';

type LogLevel = 'info' | 'warn' | 'error';

type LogEvent = {
  event: string;
  message: string;
  requestId?: string;
  data?: Record<string, unknown>;
};

function emit(level: LogLevel, payload: LogEvent) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event: payload.event,
    message: payload.message,
    requestId: payload.requestId,
    data: payload.data ? redactJson(payload.data) : undefined,
  };

  const serialized = JSON.stringify(entry);

  if (level === 'error') {
    console.error(serialized);
    return;
  }

  if (level === 'warn') {
    console.warn(serialized);
    return;
  }

  console.info(serialized);
}

export function logInfo(payload: LogEvent) {
  emit('info', payload);
}

export function logWarn(payload: LogEvent) {
  emit('warn', payload);
}

export function logError(payload: LogEvent) {
  emit('error', payload);
}
