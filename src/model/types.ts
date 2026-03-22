import type { ExecuteOptions } from '../executor/types.js';

// ---- Task status & state machine ----

export type TaskStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  pending: ['running', 'cancelled'],
  running: ['done', 'failed', 'cancelled'],
  done: [],
  failed: [],
  cancelled: [],
};

export function validateTransition(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: TaskStatus, to: TaskStatus): void {
  if (!validateTransition(from, to)) {
    throw new Error(`Invalid state transition: ${from} → ${to}`);
  }
}

// ---- Task data model ----

export interface Task {
  id: string;
  prompt: string;
  status: TaskStatus;
  cwd?: string;
  options?: ExecuteOptions;
  result?: TaskResult;
  sessionId?: string;
  outputFile?: string;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface TaskResult {
  text: string;
  costUsd: number;
  durationMs: number;
  usage: Record<string, unknown>;
}

export interface CreateTaskInput {
  prompt: string;
  cwd?: string;
  options?: ExecuteOptions;
}

export interface TaskFilter {
  status?: TaskStatus;
  limit?: number;
  offset?: number;
}
