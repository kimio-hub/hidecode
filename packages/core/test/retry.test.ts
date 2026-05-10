import { describe, expect, it } from 'vitest';
import { withRetry, classifyError } from '../src/retry/index.js';

describe('withRetry', () => {
  it('succeeds on first attempt', async () => {
    let calls = 0;
    const result = await withRetry(async () => { calls++; return 'ok'; });
    expect(result).toBe('ok');
    expect(calls).toBe(1);
  });

  it('retries on transient failure then succeeds', async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls++;
        if (calls < 3) throw new Error('429 rate limit');
        return 'ok';
      },
      { maxAttempts: 3, baseDelayMs: 10 },
    );
    expect(result).toBe('ok');
    expect(calls).toBe(3);
  });

  it('throws on non-retryable error', async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => { calls++; throw new Error('401 invalid token'); },
        { maxAttempts: 3, baseDelayMs: 10 },
      ),
    ).rejects.toThrow('401');
    expect(calls).toBe(1);
  });

  it('throws after max attempts', async () => {
    let calls = 0;
    await expect(
      withRetry(
        async () => { calls++; throw new Error('502 bad gateway'); },
        { maxAttempts: 2, baseDelayMs: 10 },
      ),
    ).rejects.toThrow('502');
    expect(calls).toBe(2);
  });
});

describe('classifyError', () => {
  it('classifies rate limits as retryable', () => {
    expect(classifyError(new Error('429 rate limit')).retryable).toBe(true);
    expect(classifyError(new Error('429 rate limit')).category).toBe('rate_limit');
  });

  it('classifies auth errors as non-retryable', () => {
    expect(classifyError(new Error('401 invalid token')).retryable).toBe(false);
    expect(classifyError(new Error('401 invalid token')).category).toBe('auth');
  });

  it('classifies upstream errors as retryable', () => {
    expect(classifyError(new Error('502 bad gateway')).retryable).toBe(true);
    expect(classifyError(new Error('503 service unavailable')).retryable).toBe(true);
  });
});
