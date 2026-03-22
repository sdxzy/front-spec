# Decisions: cli-executor

## 变更记录

### 2026-03-22 — 多轮对话参数修正

**变更内容**：将多轮对话的实现从 `--session-id` 改为 `--resume`。

**触发原因**：冒烟测试实测发现，`--session-id <id>` 用于为新会话指定自定义 ID，**不能**用于续接已完成的会话。续接已有会话必须使用 `--resume <sessionId>`，否则报错 `Session ID xxx is already in use`。

**变更内容**：
- `ExecuteOptions` 新增 `resumeSessionId?: string` 字段，映射为 `--resume <id>`
- 原有 `sessionId?: string` 字段保留，映射为 `--session-id <id>`（仅用于新会话指定自定义 ID）
- smoke.ts 改用临时 db，避免测试数据污染

**影响范围**：仅 cli-executor 内部，不涉及其他 feature 或 contracts。
