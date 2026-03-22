# 使用指南：命令驱动开发工作流

本文档面向日常开发，解释在什么时机使用哪个命令。建议先通读一遍，然后在实际使用中按需查阅。

---

## 快速开始（5 分钟上手）

### 第一步：把命令文件放进项目

将 `.claude/commands/` 目录下的所有 `.md` 文件复制到你的项目中。确保目录结构是：

```
your-project/
├── .claude/
│   └── commands/
│       ├── fw-demand-init.md
│       ├── fw-demand-plan.md
│       ├── fw-demand-status.md
│       ├── fw-feature-init.md
│       ├── fw-feature-resume.md
│       ├── fw-feature-checkpoint.md
│       ├── fw-feature-done.md
│       ├── fw-feature-update-spec.md
│       ├── fw-contract-update.md
│       ├── fw-overview.md
│       └── fw-help.md
```

### 第二步：配置 CLAUDE.md

把方案文档中「四、CLAUDE.md 全局配置」的模板复制到项目根目录的 `CLAUDE.md` 中，替换技术栈和代码规范为你项目的实际情况。

### 第三步：创建 docs 基础目录

```bash
mkdir -p docs/contracts docs/demands
```

如果已有 PRD，放到 `docs/prd.md`。如果没有，后续 `/fw-demand-init` 时会提示你补充。

将本使用指南文件放到 `docs/workflow-guide.md`，`/fw-help` 命令会读取它来回答使用问题。

### 第四步：开始使用

打开 Claude Code，输入 `/fw-help` 查看命令总览，或直接 `/fw-demand-init my-first-demand` 开始。

---

## 命令速查表

| 我想做什么 | 用哪个命令 |
|------------|-----------|
| 拿到一个新需求，开始规划 | `/fw-demand-init <需求名>` |
| 调整需求的 feature 拆分 | `/fw-demand-plan <需求名>` |
| 看某个需求做到哪了 | `/fw-demand-status <需求名>` |
| 开始做一个具体的 feature | `/fw-feature-init <需求>/<feature>` |
| 清了上下文，要继续做 | `/fw-feature-resume <需求>/<feature>` |
| 做到一半，准备离开或清上下文 | `/fw-feature-checkpoint` |
| 一个 feature 做完了 | `/fw-feature-done` |
| 发现设计有问题要改 | `/fw-feature-update-spec` |
| 要改跨模块的接口或类型 | `/fw-contract-update` |
| 看全局进度 | `/fw-overview` |
| 不知道下一步该做什么 | `/fw-help` 或 `/fw-help <问题>` |

---

## 按阶段详解

### 阶段一：需求规划

**时机**：拿到新需求或 PRD 时。

**操作**：

```
> /fw-demand-init membership-system
```

Claude Code 会：
- 创建 `docs/demands/membership-system/` 目录
- 读取 PRD，提取相关内容
- 建议 feature 拆分和 phase 编排

**你需要做的**：
- 审核拆分是否合理（粒度是否合适、依赖关系是否正确）
- 确认或修改 phase 顺序
- 确认后，demand.md 就是这个需求的"作战地图"

**判断拆分粒度的原则**：一个 feature 应该是你能在 1-3 次 Claude Code 会话内完成并验证的量。如果预估超过 5 次会话，考虑继续拆分。

### 阶段二：Feature 设计

**时机**：demand 规划确认后，准备开始实现某个 feature 时。

**操作**：

```
> /fw-feature-init membership-system/user-level
```

Claude Code 会：
- 创建 feature 目录和模板文件
- 从 demand.md 提取相关信息
- 提示你需要补充的内容

**你需要做的**：
- 打开生成的 `spec.md`，补充技术方案和实现步骤
- 确认依赖声明和边界约束
- 这一步不要急，spec 写得越清楚后续越顺

**什么时候创建 feature**：不需要一次性把所有 feature 都 init。推荐在一个 phase 开始时，只 init 该 phase 内的 feature。后续 phase 的 feature 等前面做完再 init，因为到时候你的理解会更准确。

### 阶段三：日常开发循环

这是你会重复最多次的阶段。核心循环是：

```
实现 → 验证 → 保存检查点 → (清上下文) → 恢复 → 继续实现
```

#### 开始写代码

spec.md 确认后，直接告诉 Claude Code：

```
> 开始实现 user-level，从 Step 1 开始
```

就像平时用 Claude Code 一样写代码。命令系统不干预实现过程本身。

#### 做到一半要离开或者上下文太长了

**先保存**，再离开：

```
> /fw-feature-checkpoint
```

Claude Code 会把当前进度写入 checkpoint.md，展示给你确认。确认后可以安全地清上下文或关闭会话。

**关键习惯**：把 `/fw-feature-checkpoint` 当成 `Ctrl+S`。以下场景都应该先执行它：
- 准备 `/clear` 清上下文
- 准备切换到另一个 feature
- 准备结束今天的工作
- 刚完成一个 step 的验证

#### 恢复现场

新的会话或清完上下文后：

```
> /fw-feature-resume membership-system/user-level
```

Claude Code 会读取所有相关文件，输出一段摘要告诉你"我们做到哪了"。确认后继续。

**不需要额外说什么**，resume 命令已经包含了读取 spec、checkpoint、decisions、contracts 的全部逻辑。

#### 一个 Step 做完了

验证通过后，保存并继续：

```
> /fw-feature-checkpoint
> 继续 Step 2
```

或者如果不需要清上下文，直接说"继续 Step 2"也可以，checkpoint 主要是为了防丢失。

### 阶段四：处理变更

**发现 feature 的技术方案需要调整**：

```
> /fw-feature-update-spec
> 把 Step 2 中的 localStorage 存 token 改为 httpOnly cookie
```

Claude Code 会更新 spec.md 和 decisions.md，展示 diff 等你确认。如果已有代码需要同步修改，会列出清单。

**发现需要改跨模块的接口定义**：

```
> /fw-contract-update
> api-contracts.md 中的 /api/user/info 接口返回值增加 memberLevel 字段
```

Claude Code 会自动扫描所有 demand 的所有 feature，输出影响分析。确认后才修改。

**发现需求拆分不合理，要调整 feature 或 phase**：

```
> /fw-demand-plan membership-system
> user-level 太大了，拆成 user-level-model 和 user-level-upgrade
```

Claude Code 会分析影响，更新 demand.md。

**变更操作的优先级**：如果一个变更同时涉及 contract 和 spec，先 `/fw-contract-update`，再 `/fw-feature-update-spec`。contract 是被多方依赖的，应该先处理。

### 阶段五：完成和推进

**一个 feature 做完了**：

```
> /fw-feature-done
```

Claude Code 会：
- 检查所有 step 是否完成
- 更新 demand.md 中的 phase 进度
- 告诉你当前 phase 完成度
- 如果 phase 全部完成，提示下一个 phase 已解锁
- 建议下一个应该做的 feature

**看看整体进度**：

```
> /fw-demand-status membership-system
```

输出 phase 级别的进度表、阻塞链、可并行开发的 feature 列表。

**看所有需求的状态**：

```
> /fw-overview
```

当你同时有多个需求在进行时用这个。

---

## 并行开发指南

### 同一需求内并行开发多个 feature

同一个 phase 内没有相互依赖的 feature 可以在不同会话中并行开发：

```
# 终端 A
> /fw-feature-resume membership-system/user-level

# 终端 B
> /fw-feature-resume membership-system/payment-bindcard
```

各自独立，通过 contracts 协作。如果终端 A 修改了 contract，终端 B 下次 resume 时会读到最新版本。

### 同时推进多个需求

不同 demand 天然隔离，直接在不同会话中操作：

```
# 终端 A — 需求 1
> /fw-feature-resume membership-system/user-level

# 终端 B — 需求 2
> /fw-feature-resume user-center-refactor/user-profile
```

用 `/fw-overview` 看全局状态，用 `/fw-contract-update` 的影响分析检查跨需求影响。

---

## 常见问题

### 忘了保存 checkpoint 就清了上下文

checkpoint.md 停留在上次保存的状态。恢复后会回到上次保存点，中间的工作需要通过 git log 或文件 diff 来回忆。

**预防措施**：养成习惯，清上下文前先 `/fw-feature-checkpoint`。

### demand 和 feature 的命名规范

推荐用 kebab-case，简短且有辨识度：
- demand: `membership-system`、`user-center-refactor`、`order-v2`
- feature: `user-level`、`payment-bindcard`、`order-discount`

避免用编号（`feature-01`），因为随着拆分调整编号会混乱。用语义化名称。

### 需求很小，只有一两个 feature

可以简化流程：
1. 跳过 `/fw-demand-init`，直接手动创建 demand 目录和一个简单的 demand.md
2. 只用 `/fw-feature-init` + `/fw-feature-resume` + `/fw-feature-checkpoint` 三个命令
3. 不需要 phase 编排

甚至更简单的做法：如果 feature 能在一次会话内完成，直接写代码就行，不需要这套工作流。**这套流程是为"需要跨多次会话"的复杂需求设计的**。

### spec.md 要写多详细

关键原则：**写到你清完上下文、两天后回来，Claude Code 只读 spec.md 就能恢复到正确的理解**。

实践建议：
- 实现步骤：每个 step 写 1-3 句话，明确输入、输出、验证方式
- 依赖声明：具体到类型名称或接口路径，不要写"依赖用户模块"
- 边界约束：明确写"不做什么"，比"做什么"更重要，防止 Claude Code 越界

### 什么时候用 `/fw-demand-plan` vs `/fw-feature-update-spec`

- **调整 feature 怎么拆分、phase 怎么排**：用 `/fw-demand-plan`（需求编排层面的变更）
- **调整某个 feature 内部的技术实现**：用 `/fw-feature-update-spec`（feature 设计层面的变更）

简单判断：如果变更只影响一个 feature 内部，用 `/fw-feature-update-spec`；如果影响 feature 的拆分或顺序，用 `/fw-demand-plan`。

### contracts 目录下应该放什么

放的是**跨模块的共享约定**，不是模块内部的设计文档。典型内容包括：

- 共享类型定义（多个模块都需要用到的数据结构）
- 模块间 API 约定（一个模块暴露给另一个模块的接口）
- 事件协议（模块间通过事件通信的消息格式）

**不应该放的**：模块内部的数据库 schema、组件 props 定义、内部工具函数。这些属于 feature 的 spec.md 范畴。

---

## 完整生命周期一览

```
拿到需求
  │
  ├─ /fw-demand-init ─── 创建需求 + 拆分规划
  │
  ├─ (手动) 创建/更新 contracts
  │
  ├─ /fw-feature-init ─── 初始化 phase 内的 feature
  │
  │  ┌─────── 开发循环 ──────┐
  │  │                        │
  │  │  写代码                │
  │  │    │                   │
  │  │  验证                  │
  │  │    │                   │
  │  │  /fw-feature-checkpoint   │
  │  │    │                   │
  │  │  (清上下文)            │
  │  │    │                   │
  │  │  /fw-feature-resume       │
  │  │    │                   │
  │  └────┘                   │
  │                           │
  │  ── 遇到变更 ──           │
  │  /fw-feature-update-spec     │
  │  /fw-contract-update         │
  │  /fw-demand-plan             │
  │                           │
  ├─ /fw-feature-done ─── 完成 feature + 更新 phase 进度
  │
  ├─ (重复: 下一个 feature)
  │
  ├─ /fw-demand-status ─── 检查 phase 解锁情况
  │
  └─ 所有 phase 完成 → 需求交付
```
