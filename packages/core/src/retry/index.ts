// ─── Retry Logic ───────────────────────────────────────────────
// Retry wrapper with exponential backoff for transient failures.

export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Classify whether an error is retryable */
  isRetryable?: (error: unknown) => boolean;
}

const DEFAULT_RETRYABLE = (error: unknown): boolean => {
  const msg = String(error?.message ?? error ?? '').toLowerCase();
  // Retry on transient errors
  if (msg.includes('timeout') || msg.includes('econnreset') || msg.includes('econnrefused')) return true;
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('too many requests')) return true;
  if (msg.includes('502') || msg.includes('503') || msg.includes('504')) return true;
  if (msg.includes('socket hang up') || msg.includes('network error')) return true;
  return false;
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const opts: RetryConfig = {
    maxAttempts: config.maxAttempts ?? 3,
    baseDelayMs: config.baseDelayMs ?? 1000,
    maxDelayMs: config.maxDelayMs ?? 30000,
    isRetryable: config.isRetryable ?? DEFAULT_RETRYABLE,
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!opts.isRetryable(error) || attempt === opts.maxAttempts - 1) {
        throw error;
      }
      const delay = Math.min(opts.baseDelayMs * Math.pow(2, attempt), opts.maxDelayMs);
      const jitter = delay * 0.2 * Math.random();
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  throw lastError;
}

export function classifyError(error: unknown): { retryable: boolean; category: string; message: string } {
  const msg = String(error?.message ?? error ?? '');
  if (msg.includes('429') || msg.includes('rate limit')) return { retryable: true, category: 'rate_limit', message: msg };
  if (msg.includes('401') || msg.includes('invalid token')) return { retryable: false, category: 'auth', message: msg };
  if (msg.includes('403')) return { retryable: false, category: 'forbidden', message: msg };
  if (msg.includes('404') || msg.includes('model_not_found')) return { retryable: false, category: 'not_found', message: msg };
  if (msg.includes('502') || msg.includes('503') || msg.includes('504')) return { retryable: true, category: 'upstream', message: msg };
  if (msg.includes('timeout') || msg.includes('econnreset')) return { retryable: true, category: 'network', message: msg };
  return { retryable: false, category: 'unknown', message: msg };
}
