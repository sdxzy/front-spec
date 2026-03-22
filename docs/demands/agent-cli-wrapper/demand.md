# Demand: agent-cli-wrapper

## 状态: in-progress (Phase 1 ✅ → Phase 2 已解锁)

## 业务目标

构建一个 Agent 系统应用，本质是一个"套壳"应用——通过 CLI 调用 Claude Code 的能力，对外提供 Agent 服务。用户通过该系统提交任务，系统内部通过调用 `claude` CLI 来完成实际的代码生成、分析、执行等工作。

### 核心价值
- 将 Claude Code 的 CLI 能力封装为可编程、可调度的 Agent 服务
- 支持任务队列、并发管理、结果收集等 Claude Code 原生 CLI 不直接提供的能力
- 提供 Web/API 界面，降低使用门槛

## Feature 拆分建议

### Phase 1: 基础能力层（无依赖，优先实现）

| Feature | 说明 | 预估复杂度 |
|---------|------|-----------|
| `cli-executor` | Claude Code CLI 调用封装：子进程管理、输入输出流处理、超时控制、错误处理 | 中 |
| `task-model` | 任务数据模型：任务定义、状态机（pending→running→done/failed）、持久化 | 低 |

### Phase 2: 调度与管理层（依赖 Phase 1）

| Feature | 说明 | 预估复杂度 |
|---------|------|-----------|
| `task-queue` | 任务队列与调度：优先级队列、并发控制（限制同时运行的 Claude Code 实例数）、重试策略 | 中 |
| `session-manager` | 会话管理：维护 Claude Code 的工作目录、上下文隔离、会话复用 | 中 |

### Phase 3: 对外接口层（依赖 Phase 2）

| Feature | 说明 | 预估复杂度 |
|---------|------|-----------|
| `api-server` | HTTP API 服务：RESTful 接口，提交任务、查询状态、获取结果 | 中 |
| `ws-streaming` | WebSocket 实时推送：任务执行过程的实时输出流式推送 | 中 |

### Phase 4: 增强能力（依赖 Phase 3）

| Feature | 说明 | 预估复杂度 |
|---------|------|-----------|
| `web-ui` | 简易 Web 前端：任务提交表单、实时输出展示、历史记录查看 | 中 |
| `prompt-template` | Prompt 模板系统：预置常用任务模板、变量替换、模板管理 | 低 |

## 依赖关系

```
Phase 1: cli-executor, task-model (可并行)
    ↓
Phase 2: task-queue(依赖 cli-executor + task-model), session-manager(依赖 cli-executor)
    ↓
Phase 3: api-server(依赖 task-queue), ws-streaming(依赖 task-queue + session-manager)
    ↓
Phase 4: web-ui(依赖 api-server + ws-streaming), prompt-template(依赖 api-server)
```

## 技术选型建议

- **运行时**: Node.js（与 Claude Code 生态一致）
- **CLI 调用**: `child_process.spawn` 管理 `claude` 子进程
- **API 框架**: Express 或 Fastify
- **WebSocket**: ws 库
- **持久化**: SQLite（轻量，无需额外服务）
- **前端**: 简单的 React SPA 或纯 HTML + vanilla JS

## 验收标准

- [ ] 能通过 API 提交任务，系统自动调用 Claude Code CLI 执行
- [ ] 支持并发任务管理，不会因多任务导致系统崩溃
- [ ] 任务执行过程可实时查看输出
- [ ] 任务结果可查询和回溯
- [ ] 异常情况（CLI 超时、进程崩溃）有合理的错误处理

## 跨需求依赖

无（当前唯一需求）

## 相关 Contracts

暂无，待 Phase 2 时可能需要定义：
- API 接口契约（`api-contracts.md`）
- 任务状态机定义（`shared-types.md`）
