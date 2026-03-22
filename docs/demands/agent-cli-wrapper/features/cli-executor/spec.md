# Feature: cli-executor

## 所属 Demand: agent-cli-wrapper
## Phase: 1 — 基础能力层
## 状态: draft

## 概述

Claude Code CLI 调用封装层。通过 `child_process.spawn` 管理 `claude` 子进程，处理输入输出流、超时控制和错误处理。这是整个 Agent 系统的核心底层能力。

## Dependencies

- 无前置 feature 依赖（Phase 1，可立即开始）
- 外部依赖：系统已安装 `claude` CLI

## 技术方案

### 核心模块

**ClaudeExecutor 类** — 封装单次 Claude Code CLI 调用

```
ClaudeExecutor
├── spawn(options)         # 启动 claude 子进程
├── send(input)            # 向子进程 stdin 写入
├── onOutput(callback)     # 注册 stdout/stderr 回调（流式）
├── abort()                # 终止子进程
└── waitForExit()          # 等待子进程结束，返回结果
```

**调用模式支持：**
1. **单次执行模式**：`claude -p "prompt"` — 发送 prompt，等待完整输出
2. **流式输出模式**：`claude -p "prompt" --output-format stream-json` — 逐行读取输出流
3. **多轮对话模式**：`claude -p "prompt" --resume <sessionId>` — 继续已有会话上下文
   - 第一轮：普通调用，从返回的 `result.sessionId` 获取会话 ID
   - 后续轮：传入 `resumeSessionId` 参数，映射为 `--resume`
   - 注意：`--session-id` 仅用于为新会话指定自定义 ID，**不能**复用已完成的会话（冒烟测试实测）

### 权限与工具管控

Claude Code CLI 在 `-p` 模式下为非交互式，遇到未授权工具会直接失败。通过本地配置文件管理工具白名单：

**配置文件**：`config/allowed-tools.json`

```json
{
  "default": ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  "profiles": {
    "readonly": ["Read", "Glob", "Grep"],
    "full": ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "Agent"],
    "dangerous": "__all__"
  }
}
```

**使用方式**：
- 每次调用可指定 profile 名称或自定义工具列表
- 未指定时使用 `default` profile
- `"dangerous"` 等同于 `--dangerously-skip-permissions`（需显式确认）
- 配置文件支持热加载，修改后无需重启

**映射到 CLI 参数**：
- 普通 profile → `--allowedTools "Read,Write,Edit,..."`
- `"__all__"` → `--dangerously-skip-permissions`

### 关键设计

- **子进程生命周期管理**：spawn → monitor → collect output → cleanup
- **超时控制**：可配置超时时间，超时后 SIGTERM → 等待 → SIGKILL
- **输出解析**：支持纯文本和 JSON 两种输出格式
- **错误分类**：区分 CLI 错误（非零退出码）、超时、进程崩溃、权限问题等
- **工作目录隔离**：每次调用可指定独立的 cwd
- **权限管控**：通过本地配置文件维护工具白名单，支持多 profile 切换
- **多轮对话**：首轮普通调用获取 sessionId，后续轮通过 `resumeSessionId` + `--resume` 继续会话

## 实现步骤

### Step 1: 基础子进程封装
- 实现 `ClaudeExecutor` 类
- 支持 `spawn`、`waitForExit`、`abort`
- 单次执行模式（`claude -p "prompt"`）
- 基础错误处理（非零退出码）
- **验证**：能调用 `claude -p "hello"` 并获取输出

### Step 2: 流式输出与超时
- 实现 stdout/stderr 流式回调
- 支持 `--output-format stream-json` 解析
- 超时控制（SIGTERM → SIGKILL 两阶段）
- **验证**：长任务能流式输出，超时能正确终止

### Step 3: 权限配置与选项体系
- 实现 `config/allowed-tools.json` 的加载与解析
- 支持 default / named profile / 自定义列表三种权限指定方式
- 支持传入工作目录（cwd）、环境变量、CLI 参数
- 支持 `--model` 等 Claude Code 参数透传
- 错误分类与结构化错误对象
- **验证**：不同 profile 对应的 CLI 参数正确拼装，权限不足时报错清晰

## 边界约束

- 不负责任务调度和队列管理（由 `task-queue` 负责）
- 不负责任务持久化（由 `task-model` 负责）
- 不管理并发数量（由上层控制）
- 本 feature 只关注"单次 CLI 调用"的正确性

## 输出产物

- `src/executor/claude-executor.ts` — 主模块
- `src/executor/types.ts` — 类型定义
- `src/executor/__tests__/` — 单元测试
- `config/allowed-tools.json` — 工具白名单配置
