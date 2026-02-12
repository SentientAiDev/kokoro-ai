export type ApiErrorDetails = {
  message: string;
  retryAfterMs?: number;
};

export async function parseApiError(response: Response, fallbackMessage: string): Promise<ApiErrorDetails> {
  try {
    const payload = (await response.json()) as {
      error?: string;
      retryAfterMs?: number;
    };

    return {
      message: payload.error ?? fallbackMessage,
      retryAfterMs: payload.retryAfterMs,
    };
  } catch {
    return { message: fallbackMessage };
  }
}

export function formatRetryHint(retryAfterMs?: number) {
  if (!retryAfterMs || retryAfterMs <= 0) {
    return null;
  }

  const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return `You can retry in about ${seconds} second${seconds === 1 ? '' : 's'}.`;
}
