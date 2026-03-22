# Front-Spec: Claude Code 命令驱动开发工作流

一套基于 Claude Code slash commands 的**大功能分阶段开发工作流**，将"靠人记住流程"转化为"靠命令封装流程"。

适用于需要跨多次会话完成的复杂需求，帮助你在 Claude Code 中系统地管理需求拆分、功能实现、进度追踪和跨模块协作。

## 核心概念

| 概念 | 说明 |
|------|------|
| **Demand（需求）** | 一个完整的业务需求，负责编排 feature 的拆分方式、执行顺序（phase）和验收标准 |
| **Feature（功能点）** | 可独立实现和验证的最小交付单元，包含技术方案、实现步骤和进度追踪 |
| **Contract（契约）** | 模块间的共享约定，定义跨模块交互的类型、API 和事件协议 |

## 快速开始

### 1. 复制文件到你的项目

```bash
# 将 .claude/commands/ 目录复制到你的项目根目录
cp -r .claude/ your-project/.claude/

# 创建基础目录
mkdir -p your-project/docs/contracts your-project/docs/demands
```

### 2. 配置 CLAUDE.md

将本项目 `CLAUDE.md` 中的内容作为模板，复制到你项目的 `CLAUDE.md`，根据实际技术栈修改。

### 3. 开始使用

```bash
# 在 Claude Code 中输入
/fw-help                              # 查看命令总览
/fw-demand-init my-first-demand       # 初始化第一个需求
```

## 命令一览

### Demand 层（需求管理）

| 命令 | 说明 |
|------|------|
| `/fw-demand-init <name>` | 初始化新需求，创建目录并规划 feature 拆分 |
| `/fw-demand-plan <name>` | 调整需求的 feature 拆分和 phase 编排 |
| `/fw-demand-status <name>` | 查看某需求的整体进度和阻塞情况 |

### Feature 层（功能实现）

| 命令 | 说明 |
|------|------|
| `/fw-feature-init <demand>/<feature>` | 在某需求下初始化新 feature |
| `/fw-feature-resume <demand>/<feature>` | 清上下文后恢复 feature 工作现场 |
| `/fw-feature-checkpoint` | 保存当前进度（像 Ctrl+S 一样常用） |
| `/fw-feature-done` | 标记 feature 完成，更新 phase 进度 |
| `/fw-feature-update-spec` | 修改 feature 的技术方案 |

### 全局

| 命令 | 说明 |
|------|------|
| `/fw-contract-update` | 修改模块间契约，自动执行跨需求影响分析 |
| `/fw-overview` | 查看所有需求和 feature 的全局状态 |
| `/fw-help [问题]` | 查询工作流使用帮助 |

## 典型工作流程

```
拿到需求
  │
  ├─ /fw-demand-init        创建需求 + 规划 feature 拆分
  │
  ├─ /fw-feature-init       初始化 phase 内的 feature
  │
  │  ┌─── 开发循环 ───┐
  │  │  写代码 → 验证   │
  │  │  /fw-feature-checkpoint  (保存进度)
  │  │  /fw-feature-resume      (恢复现场)
  │  └─────────────────┘
  │
  ├─ /fw-feature-done       完成 feature + 推进 phase
  │
  └─ 所有 phase 完成 → 需求交付
```

## 项目结构

```
your-project/
├── CLAUDE.md                         # 全局约束 + 命令说明
├── .claude/commands/                 # slash commands 定义
├── docs/
│   ├── contracts/                    # 跨模块共享契约
│   └── demands/                      # 按需求隔离
│       └── <demand-name>/
│           ├── demand.md             # 需求总览
│           └── features/
│               └── <feature-name>/
│                   ├── spec.md       # 技术方案
│                   ├── checkpoint.md # 进度快照
│                   └── decisions.md  # 变更记录
```

## 设计原则

- **命令封装流程**：每个关键操作都通过 slash command 调用，自动携带正确上下文
- **两层结构**：Demand 负责编排，Feature 负责执行，关注点分离
- **契约驱动协作**：跨模块交互通过 contract 定义，修改前自动影响分析
- **渐进式使用**：小需求可以只用 3 个命令，复杂需求再启用完整流程

## 详细文档

- [使用指南](docs/workflow-guide.md) — 各阶段详细操作说明和常见问题
- [方案设计](install-instruction/claude-code-feature-workflow-v2.md) — 完整的设计文档
- [安装说明](install-instruction/claude-code-workflow-usage-guide.md) — 详细安装配置指南

## License

MIT
