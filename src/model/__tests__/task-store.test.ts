import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TaskStore } from '../task-store.js';

let store: TaskStore;

beforeEach(() => {
  store = new TaskStore(':memory:');
});

afterEach(() => {
  store.close();
});

describe('TaskStore CRUD', () => {
  it('creates a task in pending status', () => {
    const task = store.create({ prompt: 'hello' });
    expect(task.id).toBeDefined();
    expect(task.status).toBe('pending');
    expect(task.prompt).toBe('hello');
    expect(task.createdAt).toBeInstanceOf(Date);
  });

  it('retrieves a task by id', () => {
    const created = store.create({ prompt: 'hello' });
    const found = store.getById(created.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.prompt).toBe('hello');
  });

  it('returns null for unknown id', () => {
    expect(store.getById('nonexistent')).toBeNull();
  });

  it('lists all tasks', () => {
    store.create({ prompt: 'one' });
    store.create({ prompt: 'two' });
    store.create({ prompt: 'three' });
    const all = store.list();
    expect(all).toHaveLength(3);
  });

  it('lists tasks filtered by status', () => {
    const t1 = store.create({ prompt: 'one' });
    store.create({ prompt: 'two' });
    store.updateStatus(t1.id, 'running');

    const running = store.list({ status: 'running' });
    expect(running).toHaveLength(1);
    expect(running[0].id).toBe(t1.id);
  });

  it('lists tasks with limit and offset', () => {
    for (let i = 0; i < 5; i++) {
      store.create({ prompt: `task ${i}` });
    }
    const page = store.list({ limit: 2, offset: 1 });
    expect(page).toHaveLength(2);
  });

  it('persists options as JSON', () => {
    const task = store.create({
      prompt: 'hello',
      cwd: '/tmp',
      options: { prompt: 'hello', model: 'opus' },
    });
    const found = store.getById(task.id)!;
    expect(found.cwd).toBe('/tmp');
    expect(found.options?.model).toBe('opus');
  });
});

describe('TaskStore state transitions', () => {
  it('transitions pending → running', () => {
    const task = store.create({ prompt: 'hello' });
    const updated = store.updateStatus(task.id, 'running');
    expect(updated.status).toBe('running');
    expect(updated.startedAt).toBeInstanceOf(Date);
  });

  it('transitions running → done with result', () => {
    const task = store.create({ prompt: 'hello' });
    store.updateStatus(task.id, 'running');
    const result = { text: 'world', costUsd: 0.01, durationMs: 100, usage: {} };
    const updated = store.updateStatus(task.id, 'done', { result });
    expect(updated.status).toBe('done');
    expect(updated.result?.text).toBe('world');
    expect(updated.completedAt).toBeInstanceOf(Date);
  });

  it('transitions running → failed with error', () => {
    const task = store.create({ prompt: 'hello' });
    store.updateStatus(task.id, 'running');
    const updated = store.updateStatus(task.id, 'failed', { error: 'timeout' });
    expect(updated.status).toBe('failed');
    expect(updated.error).toBe('timeout');
  });

  it('rejects invalid transition', () => {
    const task = store.create({ prompt: 'hello' });
    expect(() => store.updateStatus(task.id, 'done')).toThrow('Invalid state transition');
  });

  it('throws on unknown task id', () => {
    expect(() => store.updateStatus('nonexistent', 'running')).toThrow('Task not found');
  });
});

describe('TaskStore.getResult', () => {
  it('returns result for completed task', () => {
    const task = store.create({ prompt: 'hello' });
    store.updateStatus(task.id, 'running');
    const result = { text: 'answer', costUsd: 0.02, durationMs: 200, usage: {} };
    store.updateStatus(task.id, 'done', { result });

    const fetched = store.getResult(task.id);
    expect(fetched?.text).toBe('answer');
    expect(fetched?.costUsd).toBe(0.02);
  });

  it('returns null for task without result', () => {
    const task = store.create({ prompt: 'hello' });
    expect(store.getResult(task.id)).toBeNull();
  });
});

describe('TaskStore.cleanup', () => {
  it('deletes old completed tasks', () => {
    const task = store.create({ prompt: 'old' });
    store.updateStatus(task.id, 'running');
    store.updateStatus(task.id, 'done');

    // Manually backdate the completed_at
    const oldDate = new Date(Date.now() - 100_000).toISOString();
    (store as any).db.prepare('UPDATE tasks SET completed_at = ? WHERE id = ?').run(oldDate, task.id);


    const deleted = store.cleanup(50_000); // older than 50s
    expect(deleted).toBe(1);
    expect(store.getById(task.id)).toBeNull();
  });

  it('does not delete recent tasks', () => {
    const task = store.create({ prompt: 'recent' });
    store.updateStatus(task.id, 'running');
    store.updateStatus(task.id, 'done');

    const deleted = store.cleanup(100_000);
    expect(deleted).toBe(0);
  });

  it('does not delete pending or running tasks', () => {
    store.create({ prompt: 'pending' });
    const running = store.create({ prompt: 'running' });
    store.updateStatus(running.id, 'running');

    const deleted = store.cleanup(0); // even with 0 threshold
    expect(deleted).toBe(0);
  });
});

describe('TaskStore.markStaleAsFailed', () => {
  it('marks stale running tasks as failed', () => {
    const task = store.create({ prompt: 'stale' });
    store.updateStatus(task.id, 'running');

    // Backdate started_at
    const oldDate = new Date(Date.now() - 100_000).toISOString();
    (store as any).db.prepare('UPDATE tasks SET started_at = ? WHERE id = ?').run(oldDate, task.id);

    const stale = store.markStaleAsFailed(50_000);
    expect(stale).toHaveLength(1);
    expect(stale[0].status).toBe('failed');
    expect(stale[0].error).toContain('Stale');
  });
});

describe('TaskStore.onStatusChange', () => {
  it('fires callback on status change', () => {
    const callback = vi.fn();
    store.onStatusChange(callback);

    const task = store.create({ prompt: 'hello' });
    store.updateStatus(task.id, 'running');

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'running' }),
      'pending',
    );
  });
});
