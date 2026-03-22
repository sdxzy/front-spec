// ---- Stream event types from Claude Code CLI (stream-json --verbose) ----

export interface StreamSystemEvent {
  type: 'system';
  subtype: 'init';
  session_id: string;
  tools: string[];
  model: string;
  [key: string]: unknown;
}

export interface StreamAssistantEvent {
  type: 'assistant';
  message: {
    model: string;
    content: Array<{ type: string; text?: string; [key: string]: unknown }>;
    usage: Record<string, unknown>;
    [key: string]: unknown;
  };
  session_id: string;
  [key: string]: unknown;
}

export interface StreamResultEvent {
  type: 'result';
  subtype: 'success' | 'error';
  is_error: boolean;
  duration_ms: number;
  result: string;
  stop_reason: string;
  session_id: string;
  total_cost_usd: number;
  usage: Record<string, unknown>;
  [key: string]: unknown;
}

export type StreamEvent =
  | StreamSystemEvent
  | StreamAssistantEvent
  | StreamResultEvent
  | { type: string; [key: string]: unknown };

// ---- Executor options & result ----

export interface ExecuteOptions {
  prompt: string;
  cwd?: string;
  model?: string;
  sessionId?: string;        // 为新会话指定自定义 ID（--session-id）
  resumeSessionId?: string;  // 续接已有会话（--resume），多轮对话使用此字段
  toolProfile?: string;
  allowedTools?: string[];
  outputFormat?: 'text' | 'json' | 'stream-json';
  timeoutMs?: number;
  env?: Record<string, string>;
  maxBudgetUsd?: number;
  systemPrompt?: string;
  appendSystemPrompt?: string;
  extraArgs?: string[];
}

export interface ExecuteResult {
  exitCode: number;
  result: string;
  sessionId: string;
  costUsd: number;
  durationMs: number;
  usage: Record<string, unknown>;
  streamEvents: StreamEvent[];
  error?: ExecutorError;
}

// ---- Error classification ----

export type ErrorKind =
  | 'cli_error'
  | 'timeout'
  | 'crash'
  | 'permission_denied'
  | 'rate_limit'
  | 'unknown';

export interface ExecutorError {
  kind: ErrorKind;
  message: string;
  exitCode?: number;
  stderr?: string;
}

// ---- Retry strategy (caller-provided) ----

export interface RetryStrategy {
  maxRetries: number;
  shouldRetry: (error: ExecutorError, attempt: number) => boolean;
  delayMs: (attempt: number) => number;
}
