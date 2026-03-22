import type { ClaudeExecutor } from './claude-executor.js';
import type { ExecuteOptions, ExecuteResult, RetryStrategy } from './types.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeWithRetry(
  executor: ClaudeExecutor,
  options: ExecuteOptions,
  strategy: RetryStrategy,
): Promise<ExecuteResult> {
  let lastResult: ExecuteResult | undefined;

  for (let attempt = 0; attempt <= strategy.maxRetries; attempt++) {
    const result = await executor.execute(options);

    // Success — no error
    if (!result.error) {
      return result;
    }

    lastResult = result;

    // Last attempt — don't retry
    if (attempt === strategy.maxRetries) {
      break;
    }

    // Check if we should retry
    if (!strategy.shouldRetry(result.error, attempt)) {
      break;
    }

    // Wait before retrying
    const delay = strategy.delayMs(attempt);
    if (delay > 0) {
      await sleep(delay);
    }
  }

  return lastResult!;
}
