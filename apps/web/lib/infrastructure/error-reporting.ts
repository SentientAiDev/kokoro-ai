import { logError } from './logger';

export function reportError(input: {
  event: string;
  error: unknown;
  requestId?: string;
  data?: Record<string, unknown>;
}) {
  const errorMessage =
    input.error instanceof Error
      ? { name: input.error.name, message: input.error.message }
      : { message: 'Unknown error' };

  logError({
    event: input.event,
    message: 'Unhandled application error',
    requestId: input.requestId,
    data: {
      ...input.data,
      error: errorMessage,
    },
  });
}
