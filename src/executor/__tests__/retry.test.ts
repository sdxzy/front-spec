import { describe, it, expect, vi } from 'vitest';
import { executeWithRetry } from '../retry.js';
import type { ExecuteResult, ExecutorError, RetryStrategy } from '../types.js';

function mockExecutor(results: ExecuteResult[]) {
  let callCount = 0;
  return {
    execute: vi.fn(async () => results[callCount++]),
    on: vi.fn(),
    abort: vi.fn(),
  };
}

function makeResult(error?: ExecutorError): ExecuteResult {
  return {
    exitCode: error ? 1 : 0,
    result: error ? '' : 'success',
    sessionId: '',
    costUsd: 0,
    durationMs: 0,
    usage: {},
    streamEvents: [],
    error,
  };
}

const rateLimitError: ExecutorError = {
  kind: 'rate_limit',
  message: 'rate limited',
  exitCode: 1,
};

const permissionError: ExecutorError = {
  kind: 'permission_denied',
  message: 'not allowed',
  exitCode: 1,
};

describe('executeWithRetry', () => {
  it('returns immediately on success', async () => {
    const executor = mockExecutor([makeResult()]);
    const strategy: RetryStrategy = {
      maxRetries: 3,
      shouldRetry: () => true,
      delayMs: () => 0,
    };

    const result = await executeWithRetry(executor as any, { prompt: 'hello' }, strategy);
    expect(result.result).toBe('success');
    expect(executor.execute).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable error then succeeds', async () => {
    const executor = mockExecutor([
      makeResult(rateLimitError),
      makeResult(rateLimitError),
      makeResult(), // success on 3rd try
    ]);
    const strategy: RetryStrategy = {
      maxRetries: 3,
      shouldRetry: (err) => err.kind === 'rate_limit',
      delayMs: () => 0,
    };

    const result = await executeWithRetry(executor as any, { prompt: 'hello' }, strategy);
    expect(result.result).toBe('success');
    expect(executor.execute).toHaveBeenCalledTimes(3);
  });

  it('stops retrying on non-retryable error', async () => {
    const executor = mockExecutor([
      makeResult(permissionError),
      makeResult(), // should never reach
    ]);
    const strategy: RetryStrategy = {
      maxRetries: 3,
      shouldRetry: (err) => err.kind === 'rate_limit',
      delayMs: () => 0,
    };

    const result = await executeWithRetry(executor as any, { prompt: 'hello' }, strategy);
    expect(result.error?.kind).toBe('permission_denied');
    expect(executor.execute).toHaveBeenCalledTimes(1);
  });

  it('respects maxRetries limit', async () => {
    const executor = mockExecutor([
      makeResult(rateLimitError),
      makeResult(rateLimitError),
      makeResult(rateLimitError),
      makeResult(rateLimitError), // 4th call = 3 retries + 1 initial
    ]);
    const strategy: RetryStrategy = {
      maxRetries: 2,
      shouldRetry: () => true,
      delayMs: () => 0,
    };

    const result = await executeWithRetry(executor as any, { prompt: 'hello' }, strategy);
    expect(result.error?.kind).toBe('rate_limit');
    expect(executor.execute).toHaveBeenCalledTimes(3); // initial + 2 retries
  });
});
