/**
 * Smoke test — 验证 cli-executor + task-model 的端到端流程
 * 运行: npx tsx smoke.ts
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ClaudeExecutor } from './src/executor/index.js';
import { TaskStore } from './src/model/index.js';
import type { StreamEvent } from './src/executor/index.js';

mkdirSync('data', { recursive: true });

// 每次使用临时 db，避免测试数据污染
const tmpDb = join(tmpdir(), `smoke-${Date.now()}.db`);
const store = new TaskStore(tmpDb);
console.log(`Using temp db: ${tmpDb}`);
const executor = new ClaudeExecutor();

function section(title: string) {
  console.log('\n' + '─'.repeat(50));
  console.log(`▶ ${title}`);
  console.log('─'.repeat(50));
}

async function runTask(prompt: string) {
  const task = store.create({ prompt });
  console.log(`Task created: ${task.id} [${task.status}]`);

  store.updateStatus(task.id, 'running');

  process.stdout.write('Streaming');
  executor.on('stream', (event: StreamEvent) => {
    if (event.type === 'assistant') process.stdout.write('.');
  });

  const result = await executor.execute({
    prompt,
    outputFormat: 'stream-json',
    toolProfile: 'readonly',
  });
  console.log('');

  if (result.error) {
    store.updateStatus(task.id, 'failed', { error: result.error.message });
    console.log(`✗ Failed [${result.error.kind}]: ${result.error.message}`);
  } else {
    store.updateStatus(task.id, 'done', {
      result: {
        text: result.result,
        costUsd: result.costUsd,
        durationMs: result.durationMs,
        usage: result.usage,
      },
    });
    console.log(`✓ Result: ${result.result.slice(0, 200)}`);
    console.log(`  Cost: $${result.costUsd.toFixed(4)} | Time: ${result.durationMs}ms | Session: ${result.sessionId}`);
  }

  const final = store.getById(task.id)!;
  console.log(`  Task status: ${final.status}`);

  return { taskId: task.id, result };
}

// ── Test 1: 基础单次调用 ──────────────────────────────────────────────────

section('Test 1: 基础单次调用');
const { result: r1 } = await runTask('say exactly "hello world" and nothing else');

// ── Test 2: 多轮对话（session-id）────────────────────────────────────────

section('Test 2: 多轮对话');
const { result: turn1 } = await runTask('我叫 Mark，请记住这个名字，然后回复"好的"');
if (!turn1.error && turn1.sessionId) {
  console.log(`\n继续会话 ${turn1.sessionId} ...`);
  // 续接已有会话用 resumeSessionId（--resume），不能复用 --session-id
  const task2 = store.create({ prompt: '我叫什么名字？' });
  store.updateStatus(task2.id, 'running');
  const r2 = await executor.execute({
    prompt: '我叫什么名字？',
    resumeSessionId: turn1.sessionId,
    outputFormat: 'stream-json',
    toolProfile: 'readonly',
  });
  console.log('');
  if (r2.error) {
    store.updateStatus(task2.id, 'failed', { error: r2.error.message });
    console.log(`✗ Failed [${r2.error.kind}]: ${r2.error.message}`);
  } else {
    store.updateStatus(task2.id, 'done', {
      result: { text: r2.result, costUsd: r2.costUsd, durationMs: r2.durationMs, usage: r2.usage },
    });
    console.log(`✓ Result: ${r2.result}`);
    console.log(`  Cost: $${r2.costUsd.toFixed(4)} | Session: ${r2.sessionId}`);
  }
} else {
  console.log('跳过多轮测试（第一轮失败）');
}

// ── Test 3: TaskStore 查询 ────────────────────────────────────────────────

section('Test 3: TaskStore 查询');
const allTasks = store.list();
const done = store.list({ status: 'done' });
const failed = store.list({ status: 'failed' });
console.log(`总任务数: ${allTasks.length} | 完成: ${done.length} | 失败: ${failed.length}`);

// ── Test 4: 错误处理（超短超时）──────────────────────────────────────────

section('Test 4: 超时错误处理');
const task = store.create({ prompt: 'write a 1000 word essay about the history of computing' });
store.updateStatus(task.id, 'running');
const timeoutResult = await executor.execute({
  prompt: task.prompt,
  outputFormat: 'json',
  timeoutMs: 1000, // 1 秒，必然超时
});
if (timeoutResult.error?.kind === 'timeout') {
  store.updateStatus(task.id, 'failed', { error: timeoutResult.error.message });
  console.log('✓ 超时正确被捕获:', timeoutResult.error.kind);
} else {
  console.log('  Result (completed fast):', timeoutResult.result?.slice(0, 100));
  store.updateStatus(task.id, 'done', {
    result: { text: timeoutResult.result, costUsd: timeoutResult.costUsd, durationMs: timeoutResult.durationMs, usage: timeoutResult.usage },
  });
}

// ── 汇总 ─────────────────────────────────────────────────────────────────

section('汇总');
const final = store.list();
for (const t of final) {
  const icon = t.status === 'done' ? '✓' : t.status === 'failed' ? '✗' : '?';
  console.log(`${icon} [${t.status.padEnd(9)}] ${t.prompt.slice(0, 60)}`);
}

store.close();
console.log('\n✓ Smoke test 完成\n');
