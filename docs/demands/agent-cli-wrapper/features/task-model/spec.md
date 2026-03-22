# Feature: task-model

## 所属 Demand: agent-cli-wrapper
## Phase: 1 — 基础能力层
## 状态: draft

## 概述

任务数据模型层。定义任务的数据结构、状态机和持久化方案。所有上层模块（队列、API、UI）都依赖此模型。

## Dependencies

- 无前置 feature 依赖（Phase 1，可立即开始）
- 与 `cli-executor` 同属 Phase 1，无相互依赖，可并行开发

## 技术方案

### 任务数据模型

```typescript
interface Task {
  id: string;              // UUID
  prompt: string;          // 用户输入的 prompt
  status: TaskStatus;      // 状态机
  cwd?: string;            // 执行目录
  options?: ExecuteOptions; // CLI 选项
  result?: TaskResult;     // 执行结果
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

type TaskStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';
```

### 状态机

```
pending → running → done
                  → failed
pending → cancelled
running → cancelled
```

### 持久化方案

使用 SQLite（通过 better-sqlite3）：
- 轻量，零配置，适合单机 Agent 应用
- 支持事务，保证状态一致性
- 文件级存储，方便备份和迁移

### 核心接口

```
TaskStore
├── create(input)          # 创建任务，状态为 pending
├── getById(id)            # 查询单个任务
├── list(filter?)          # 列表查询（支持按状态过滤）
├── updateStatus(id, status, data?)  # 更新任务状态
├── getResult(id)          # 获取执行结果
└── cleanup(olderThan)     # 清理过期任务
```

## 实现步骤

### Step 1: 类型定义与状态机
- 定义 Task、TaskStatus、TaskResult 等核心类型
- 实现状态机校验（哪些状态转换是合法的）
- **验证**：类型完整，状态转换规则正确

### Step 2: SQLite 持久化
- 初始化 SQLite 数据库和表结构
- 实现 TaskStore 的 CRUD 操作
- 支持按状态过滤的列表查询
- **验证**：任务能创建、查询、更新状态，重启后数据不丢失

### Step 3: 任务生命周期管理
- 实现任务超时自动标记 failed
- 实现过期任务清理
- 添加事件通知（任务状态变更时触发回调）
- **验证**：超时任务被正确标记，事件回调触发正常

## 边界约束

- 不负责任务调度和执行（由 `task-queue` + `cli-executor` 负责）
- 不暴露 HTTP 接口（由 `api-server` 负责）
- 本 feature 只关注数据模型和存储

## 输出产物

- `src/model/types.ts` — 核心类型定义
- `src/model/task-store.ts` — 持久化存储
- `src/model/__tests__/` — 单元测试
