import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { ClaudeExecutor } from '../claude-executor.js';
import type { StreamEvent } from '../types.js';

// ---- Mock child_process ----

function createMockProcess() {
  const proc = Object.assign(new EventEmitter(), {
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    stdin: { write: vi.fn(), end: vi.fn() },
    killed: false,
    kill: vi.fn(function (this: { killed: boolean }) {
      this.killed = true;
      return true;
    }),
  });
  return proc;
}

type MockProcess = ReturnType<typeof createMockProcess>;

let mockProc: MockProcess;

vi.mock('node:child_process', () => ({
  spawn: vi.fn(() => mockProc),
}));

beforeEach(() => {
  mockProc = createMockProcess();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

/** Helper: send stdout data and close the mock process */
function finishProcess(
  stdout: string,
  stderr: string,
  exitCode: number | null,
  signal: NodeJS.Signals | null = null,
) {
  if (stdout) mockProc.stdout.emit('data', Buffer.from(stdout));
  if (stderr) mockProc.stderr.emit('data', Buffer.from(stderr));
  mockProc.emit('close', exitCode, signal);
}

// ---- buildArgs tests ----

describe('ClaudeExecutor.buildArgs', () => {
  const executor = new ClaudeExecutor();

  it('builds basic args for text mode (includes default tools)', () => {
    const args = executor.buildArgs({ prompt: 'hello' });
    expect(args).toContain('-p');
    expect(args).toContain('hello');
    expect(args).toContain('--output-format');
    expect(args).toContain('json');
    expect(args).toContain('--allowedTools');
  });

  it('adds --verbose for stream-json', () => {
    const args = executor.buildArgs({ prompt: 'hello', outputFormat: 'stream-json' });
    expect(args).toContain('--verbose');
    expect(args).toContain('stream-json');
  });

  it('adds --session-id for multi-turn', () => {
    const args = executor.buildArgs({ prompt: 'hello', sessionId: 'abc123' });
    expect(args).toContain('--session-id');
    expect(args).toContain('abc123');
  });

  it('adds --model', () => {
    const args = executor.buildArgs({ prompt: 'hello', model: 'claude-sonnet-4-6' });
    expect(args).toContain('--model');
    expect(args).toContain('claude-sonnet-4-6');
  });

  it('joins allowedTools with space', () => {
    const args = executor.buildArgs({ prompt: 'hello', allowedTools: ['Read', 'Write', 'Edit'] });
    expect(args).toContain('--allowedTools');
    expect(args).toContain('Read Write Edit');
  });

  it('adds budget and system prompt', () => {
    const args = executor.buildArgs({
      prompt: 'hello',
      maxBudgetUsd: 0.5,
      systemPrompt: 'you are helpful',
    });
    expect(args).toContain('--max-budget-usd');
    expect(args).toContain('0.5');
    expect(args).toContain('--system-prompt');
    expect(args).toContain('you are helpful');
  });

  it('passes through extra args', () => {
    const args = executor.buildArgs({ prompt: 'hello', extraArgs: ['--no-markdown'] });
    expect(args).toContain('--no-markdown');
  });

  it('does not add --verbose for json mode', () => {
    const args = executor.buildArgs({ prompt: 'hello', outputFormat: 'json' });
    expect(args).not.toContain('--verbose');
  });
});

// ---- execute tests ----

describe('ClaudeExecutor.execute', () => {
  it('returns result from JSON output', async () => {
    const executor = new ClaudeExecutor();
    const promise = executor.execute({ prompt: 'hello', outputFormat: 'json' });

    const jsonResponse = JSON.stringify({ result: 'Hello!', session_id: 's1' });
    finishProcess(jsonResponse, '', 0);

    const result = await promise;
    expect(result.exitCode).toBe(0);
    expect(result.result).toBe('Hello!');
    expect(result.error).toBeUndefined();
  });

  it('returns result from stream-json output', async () => {
    const executor = new ClaudeExecutor();
    const collected: StreamEvent[] = [];
    executor.on('stream', (e: StreamEvent) => collected.push(e));

    const promise = executor.execute({ prompt: 'hello', outputFormat: 'stream-json' });

    const events = [
      { type: 'system', subtype: 'init', session_id: 's1', tools: [], model: 'opus' },
      { type: 'assistant', message: { model: 'opus', content: [{ type: 'text', text: 'Hi' }], usage: {} }, session_id: 's1' },
      { type: 'result', subtype: 'success', is_error: false, duration_ms: 100, result: 'Hi', stop_reason: 'end', session_id: 's1', total_cost_usd: 0.01, usage: {} },
    ];

    const streamData = events.map((e) => JSON.stringify(e)).join('\n') + '\n';
    mockProc.stdout.emit('data', Buffer.from(streamData));
    mockProc.emit('close', 0, null);

    const result = await promise;
    expect(result.exitCode).toBe(0);
    expect(result.result).toBe('Hi');
    expect(result.sessionId).toBe('s1');
    expect(result.costUsd).toBe(0.01);
    expect(result.durationMs).toBe(100);
    expect(result.streamEvents).toHaveLength(3);
    expect(collected).toHaveLength(3);
  });

  it('handles partial line buffering in stream mode', async () => {
    const executor = new ClaudeExecutor();
    const promise = executor.execute({ prompt: 'hello', outputFormat: 'stream-json' });

    const resultEvent = { type: 'result', subtype: 'success', is_error: false, duration_ms: 50, result: 'ok', stop_reason: 'end', session_id: 's1', total_cost_usd: 0, usage: {} };
    const json = JSON.stringify(resultEvent);

    // Send in two chunks splitting mid-JSON
    mockProc.stdout.emit('data', Buffer.from(json.slice(0, 20)));
    mockProc.stdout.emit('data', Buffer.from(json.slice(20) + '\n'));
    mockProc.emit('close', 0, null);

    const result = await promise;
    expect(result.streamEvents).toHaveLength(1);
    expect(result.result).toBe('ok');
  });

  it('classifies non-zero exit as cli_error', async () => {
    const executor = new ClaudeExecutor();
    const promise = executor.execute({ prompt: 'hello' });

    finishProcess('', 'Something went wrong', 1);

    const result = await promise;
    expect(result.exitCode).toBe(1);
    expect(result.error).toBeDefined();
    expect(result.error!.kind).toBe('cli_error');
  });

  it('classifies permission error', async () => {
    const executor = new ClaudeExecutor();
    const promise = executor.execute({ prompt: 'hello' });

    finishProcess('', 'Tool not allowed: permission denied', 1);

    const result = await promise;
    expect(result.error!.kind).toBe('permission_denied');
  });

  it('classifies rate limit error', async () => {
    const executor = new ClaudeExecutor();
    const promise = executor.execute({ prompt: 'hello' });

    finishProcess('', 'rate limit exceeded 429', 1);

    const result = await promise;
    expect(result.error!.kind).toBe('rate_limit');
  });
});

// ---- timeout tests ----

describe('ClaudeExecutor timeout', () => {
  it('sends SIGTERM on timeout then SIGKILL after grace period', async () => {
    vi.useFakeTimers();
    const executor = new ClaudeExecutor();
    const promise = executor.execute({ prompt: 'hello', timeoutMs: 5000 });

    // Advance past timeout
    vi.advanceTimersByTime(5000);
    expect(mockProc.kill).toHaveBeenCalledWith('SIGTERM');

    // Reset killed so SIGKILL branch can execute
    mockProc.killed = false;

    // Advance past grace period
    vi.advanceTimersByTime(5000);
    expect(mockProc.kill).toHaveBeenCalledWith('SIGKILL');

    // Simulate process exit
    mockProc.emit('close', null, 'SIGTERM');

    vi.useRealTimers();
    const result = await promise;
    expect(result.error?.kind).toBe('timeout');
  });
});

// ---- abort tests ----

describe('ClaudeExecutor.abort', () => {
  it('kills the process on abort', async () => {
    const executor = new ClaudeExecutor();
    const promise = executor.execute({ prompt: 'hello' });

    executor.abort();
    expect(mockProc.kill).toHaveBeenCalledWith('SIGTERM');

    mockProc.emit('close', null, 'SIGTERM');

    const result = await promise;
    expect(result.error).toBeDefined();
    expect(result.error!.message).toContain('aborted');
  });
});
