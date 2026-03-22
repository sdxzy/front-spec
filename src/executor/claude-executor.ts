import { spawn, type ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { resolveTools } from './config-loader.js';
import type {
  ExecuteOptions,
  ExecuteResult,
  ExecutorError,
  ErrorKind,
  StreamEvent,
  StreamResultEvent,
} from './types.js';

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const KILL_GRACE_MS = 5000; // 5 seconds between SIGTERM and SIGKILL

export class ClaudeExecutor extends EventEmitter {
  private process: ChildProcess | null = null;
  private aborted = false;

  constructor(private defaultOptions?: Partial<ExecuteOptions>) {
    super();
  }

  async execute(options: ExecuteOptions): Promise<ExecuteResult> {
    const merged = { ...this.defaultOptions, ...options };
    this.aborted = false;

    const args = this.buildArgs(merged);
    const streamEvents: StreamEvent[] = [];
    let stdout = '';
    let stderr = '';

    return new Promise<ExecuteResult>((resolve, reject) => {
      const timeoutMs = merged.timeoutMs ?? DEFAULT_TIMEOUT_MS;
      let timedOut = false;
      let killTimer: ReturnType<typeof setTimeout> | undefined;

      this.process = spawn('claude', args, {
        cwd: merged.cwd,
        env: merged.env ? { ...process.env, ...merged.env } : undefined,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Timeout handling
      const timer = setTimeout(() => {
        timedOut = true;
        this.process?.kill('SIGTERM');
        killTimer = setTimeout(() => {
          if (this.process) {
            this.process.kill('SIGKILL');
          }
        }, KILL_GRACE_MS);
      }, timeoutMs);

      // Stream output
      const isStreamJson = merged.outputFormat === 'stream-json';
      let lineBuf = '';

      this.process.stdout?.on('data', (chunk: Buffer) => {
        const text = chunk.toString();
        stdout += text;

        if (isStreamJson) {
          lineBuf += text;
          const lines = lineBuf.split('\n');
          lineBuf = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const event = JSON.parse(trimmed) as StreamEvent;
              streamEvents.push(event);
              this.emit('stream', event);
            } catch {
              // skip malformed lines
            }
          }
        }
      });

      this.process.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      this.process.on('error', (err) => {
        clearTimeout(timer);
        if (killTimer) clearTimeout(killTimer);
        this.process = null;
        reject(err);
      });

      this.process.on('close', (exitCode, signal) => {
        clearTimeout(timer);
        if (killTimer) clearTimeout(killTimer);
        this.process = null;

        // Flush remaining line buffer
        if (isStreamJson && lineBuf.trim()) {
          try {
            const event = JSON.parse(lineBuf.trim()) as StreamEvent;
            streamEvents.push(event);
            this.emit('stream', event);
          } catch {
            // skip
          }
        }

        const code = exitCode ?? (signal ? 1 : 0);
        const resultEvent = streamEvents.find(
          (e): e is StreamResultEvent => e.type === 'result',
        );

        const error =
          code !== 0 || timedOut || this.aborted
            ? this.classifyError(code, stderr, timedOut, this.aborted, signal)
            : undefined;

        const result: ExecuteResult = {
          exitCode: code,
          result: resultEvent?.result ?? this.parseTextResult(stdout, merged.outputFormat),
          sessionId: resultEvent?.session_id ?? '',
          costUsd: resultEvent?.total_cost_usd ?? 0,
          durationMs: resultEvent?.duration_ms ?? 0,
          usage: resultEvent?.usage ?? {},
          streamEvents,
          error,
        };

        resolve(result);
      });
    });
  }

  abort(): void {
    this.aborted = true;
    if (this.process) {
      this.process.kill('SIGTERM');
      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
        }
      }, KILL_GRACE_MS);
    }
  }

  buildArgs(options: ExecuteOptions): string[] {
    const args: string[] = ['-p', options.prompt];

    // Output format
    const format = options.outputFormat ?? 'json';
    args.push('--output-format', format);

    // stream-json requires --verbose
    if (format === 'stream-json') {
      args.push('--verbose');
    }

    // Multi-turn: resume an existing session
    if (options.resumeSessionId) {
      args.push('--resume', options.resumeSessionId);
    } else if (options.sessionId) {
      // Assign a custom ID to a new session
      args.push('--session-id', options.sessionId);
    }

    // Model
    if (options.model) {
      args.push('--model', options.model);
    }

    // Allowed tools — resolve from profile or explicit list
    const resolved = resolveTools({
      toolProfile: options.toolProfile,
      allowedTools: options.allowedTools,
    });
    if (resolved.dangerouslySkipPermissions) {
      args.push('--dangerously-skip-permissions');
    } else if (resolved.tools.length > 0) {
      args.push('--allowedTools', resolved.tools.join(' '));
    }

    // Budget
    if (options.maxBudgetUsd !== undefined) {
      args.push('--max-budget-usd', String(options.maxBudgetUsd));
    }

    // System prompt
    if (options.systemPrompt) {
      args.push('--system-prompt', options.systemPrompt);
    }
    if (options.appendSystemPrompt) {
      args.push('--append-system-prompt', options.appendSystemPrompt);
    }

    // Extra passthrough args
    if (options.extraArgs) {
      args.push(...options.extraArgs);
    }

    return args;
  }

  private parseTextResult(
    stdout: string,
    format?: 'text' | 'json' | 'stream-json',
  ): string {
    if (format === 'json') {
      try {
        const parsed = JSON.parse(stdout);
        return parsed.result ?? stdout;
      } catch {
        return stdout;
      }
    }
    return stdout;
  }

  private classifyError(
    exitCode: number,
    stderr: string,
    timedOut: boolean,
    aborted: boolean,
    signal: NodeJS.Signals | null,
  ): ExecutorError {
    if (timedOut) {
      return { kind: 'timeout', message: 'Process timed out', exitCode, stderr };
    }
    if (aborted) {
      return { kind: 'cli_error', message: 'Process aborted by user', exitCode, stderr };
    }
    if (signal && exitCode === 0) {
      return { kind: 'crash', message: `Process killed by signal ${signal}`, stderr };
    }

    const lower = stderr.toLowerCase();
    if (lower.includes('permission') || lower.includes('not allowed')) {
      return { kind: 'permission_denied', message: stderr, exitCode, stderr };
    }
    if (lower.includes('rate limit') || lower.includes('429') || lower.includes('too many')) {
      return { kind: 'rate_limit', message: stderr, exitCode, stderr };
    }
    if (exitCode === null || signal) {
      return { kind: 'crash', message: `Process crashed (signal: ${signal})`, stderr };
    }

    return { kind: 'cli_error', message: stderr || `Exit code ${exitCode}`, exitCode, stderr };
  }
}
