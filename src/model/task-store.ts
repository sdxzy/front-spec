import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { assertTransition } from './types.js';
import type { Task, TaskStatus, TaskResult, CreateTaskInput, TaskFilter } from './types.js';

type StatusChangeCallback = (task: Task, oldStatus: TaskStatus) => void;

export class TaskStore {
  private db: DatabaseSync;
  private statusChangeCallbacks: StatusChangeCallback[] = [];

  constructor(dbPath: string = 'data/tasks.db') {
    this.db = new DatabaseSync(dbPath);
    this.db.exec('PRAGMA journal_mode = WAL');
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        prompt TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        cwd TEXT,
        options TEXT,
        result TEXT,
        session_id TEXT,
        output_file TEXT,
        error TEXT,
        created_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT
      )
    `);
    // node:sqlite doesn't support multiple statements in exec, so run separately
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
    this.db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at)');
  }

  create(input: CreateTaskInput): Task {
    const id = randomUUID();
    const now = new Date();
    const task: Task = {
      id,
      prompt: input.prompt,
      status: 'pending',
      cwd: input.cwd,
      options: input.options,
      createdAt: now,
    };

    this.db
      .prepare(
        'INSERT INTO tasks (id, prompt, status, cwd, options, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(
        id,
        input.prompt,
        'pending',
        input.cwd ?? null,
        input.options ? JSON.stringify(input.options) : null,
        now.toISOString(),
      );

    return task;
  }

  getById(id: string): Task | null {
    const row = this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    return this.rowToTask(row);
  }

  list(filter?: TaskFilter): Task[] {
    let sql = 'SELECT * FROM tasks';
    const params: SQLInputValue[] = [];

    if (filter?.status) {
      sql += ' WHERE status = ?';
      params.push(filter.status);
    }

    sql += ' ORDER BY created_at DESC';

    if (filter?.limit) {
      sql += ' LIMIT ?';
      params.push(filter.limit);
    }
    if (filter?.offset) {
      sql += ' OFFSET ?';
      params.push(filter.offset);
    }

    const rows = this.db.prepare(sql).all(...params) as Record<string, unknown>[];
    return rows.map((r) => this.rowToTask(r));
  }

  updateStatus(id: string, status: TaskStatus, data?: Partial<Task>): Task {
    const current = this.getById(id);
    if (!current) throw new Error(`Task not found: ${id}`);

    assertTransition(current.status, status);

    const now = new Date();
    const sets: string[] = ['status = ?'];
    const values: SQLInputValue[] = [status];

    if (status === 'running') {
      sets.push('started_at = ?');
      values.push(now.toISOString());
    }
    if (status === 'done' || status === 'failed' || status === 'cancelled') {
      sets.push('completed_at = ?');
      values.push(now.toISOString());
    }
    if (data?.result) {
      sets.push('result = ?');
      values.push(JSON.stringify(data.result));
    }
    if (data?.sessionId) {
      sets.push('session_id = ?');
      values.push(data.sessionId);
    }
    if (data?.outputFile) {
      sets.push('output_file = ?');
      values.push(data.outputFile);
    }
    if (data?.error) {
      sets.push('error = ?');
      values.push(data.error);
    }

    values.push(id);
    this.db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...values);

    const oldStatus = current.status;
    const updated = this.getById(id)!;

    for (const cb of this.statusChangeCallbacks) {
      cb(updated, oldStatus);
    }

    return updated;
  }

  getResult(id: string): TaskResult | null {
    const task = this.getById(id);
    return task?.result ?? null;
  }

  cleanup(olderThanMs: number): number {
    const cutoff = new Date(Date.now() - olderThanMs).toISOString();
    const result = this.db
      .prepare(
        "DELETE FROM tasks WHERE status IN ('done', 'failed', 'cancelled') AND completed_at < ?",
      )
      .run(cutoff);
    return (result as unknown as { changes: number }).changes;
  }

  markStaleAsFailed(thresholdMs: number): Task[] {
    const cutoff = new Date(Date.now() - thresholdMs).toISOString();
    const rows = this.db
      .prepare("SELECT * FROM tasks WHERE status = 'running' AND started_at < ?")
      .all(cutoff) as Record<string, unknown>[];

    const stale: Task[] = [];
    for (const row of rows) {
      const task = this.rowToTask(row);
      const updated = this.updateStatus(task.id, 'failed', {
        error: `Stale: running longer than ${thresholdMs}ms`,
      });
      stale.push(updated);
    }
    return stale;
  }

  onStatusChange(callback: StatusChangeCallback): void {
    this.statusChangeCallbacks.push(callback);
  }

  close(): void {
    this.db.close();
  }

  private rowToTask(row: Record<string, unknown>): Task {
    return {
      id: row.id as string,
      prompt: row.prompt as string,
      status: row.status as TaskStatus,
      cwd: (row.cwd as string) ?? undefined,
      options: row.options ? JSON.parse(row.options as string) : undefined,
      result: row.result ? JSON.parse(row.result as string) : undefined,
      sessionId: (row.session_id as string) ?? undefined,
      outputFile: (row.output_file as string) ?? undefined,
      error: (row.error as string) ?? undefined,
      createdAt: new Date(row.created_at as string),
      startedAt: row.started_at ? new Date(row.started_at as string) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at as string) : undefined,
    };
  }
}
