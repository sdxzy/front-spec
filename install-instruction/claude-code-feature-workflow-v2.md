# Claude Code 大功能分阶段开发：命令驱动工作流方案 v2

## 一、设计理念

将"靠人记住流程"转化为"靠命令封装流程"。每个关键操作都通过 slash command 调用，command 内部自动携带正确的上下文、执行正确的步骤、写入正确的文件。开发者只需要记住几个命令，而不是一套复杂的协议。

v2 引入 **Demand（需求）→ Feature（功能点）** 的两层结构，解决实际项目中"一个需求涉及多个模块"和"一个大模块需要纵向拆分"的场景。

---

## 二、核心概念

### Demand（需求）

一个完整的业务需求，对应 PRD 中的一个章节或一个独立的需求单。它可能：
- 涉及一个很大的模块，需要纵向拆分成多个可独立验证的 feature
- 横跨多个模块，每个模块有各自的变更，被一个业务目标串联

Demand 层的职责是**编排**——定义 feature 的拆分方式、执行顺序（phase）、整体验收标准。

### Feature（功能点）

一个可独立实现和验证的最小交付单元，隶属于某个 demand。Feature 层的职责是**执行**——包含具体的技术方案、实现步骤、进度追踪。

### Contract（契约）

模块间的共享约定，独立于任何 demand 或 feature。所有跨模块交互必须通过 contract 定义。

---

## 三、项目目录结构

```
project/
├── CLAUDE.md                              # 全局层：架构约束 + 代码规范 + 命令说明
├── .claude/
│   └── commands/                          # slash commands
│       ├── fw-demand-init.md                 # /fw-demand-init <name>
│       ├── fw-demand-plan.md                 # /fw-demand-plan <name>
│       ├── fw-demand-status.md               # /fw-demand-status <name>
│       ├── fw-feature-init.md                # /fw-feature-init <demand>/<feature>
│       ├── fw-feature-resume.md              # /fw-feature-resume <demand>/<feature>
│       ├── fw-feature-checkpoint.md          # /fw-feature-checkpoint
│       ├── fw-feature-done.md                # /fw-feature-done
│       ├── fw-feature-update-spec.md         # /fw-feature-update-spec
│       ├── fw-contract-update.md             # /fw-contract-update
│       ├── fw-overview.md                    # /fw-overview
│       └── fw-help.md                        # /fw-help [问题或阶段]
├── docs/
│   ├── prd.md                             # PRD 主文档
│   ├── contracts/                         # 模块间共享契约（跨 demand 共享）
│   │   ├── README.md                      # 契约使用说明
│   │   ├── shared-types.md                # 共享类型定义
│   │   ├── api-contracts.md               # 模块间 API 约定
│   │   └── event-protocols.md             # 事件/消息协议
│   └── demands/                           # 按需求隔离
│       └── <demand-name>/                 # 一个具体需求
│           ├── demand.md                  # 需求总览：拆分、编排、验收标准
│           └── features/                  # 该需求下的 feature
│               ├── <feature-name>/
│               │   ├── spec.md            # 设计态
│               │   ├── checkpoint.md      # 运行态
│               │   └── decisions.md       # 变更记录
│               └── ...
```

---

## 四、CLAUDE.md 全局配置

CLAUDE.md **只放稳定的全局约束**，不放任何运行时状态。

```markdown
# 项目约束

## 技术栈
- 前端：React 18 + TypeScript + Zustand
- BFF：Node.js + Express
- 构建：Vite + pnpm
（根据实际项目替换）

## 代码规范
- 组件使用函数式 + Hooks
- 命名：文件 kebab-case，组件 PascalCase，变量 camelCase
- 提交：Conventional Commits

## 开发工作流命令

### Demand 层（需求管理）
- `/fw-demand-init <name>` — 初始化新需求
- `/fw-demand-plan <name>` — 规划/调整需求的 feature 拆分和 phase 编排
- `/fw-demand-status <name>` — 查看某需求的整体进度

### Feature 层（功能实现）
- `/fw-feature-init <demand>/<feature>` — 在某需求下初始化新 feature
- `/fw-feature-resume <demand>/<feature>` — 恢复 feature 上下文
- `/fw-feature-checkpoint` — 保存当前进度
- `/fw-feature-done` — 完成当前 feature
- `/fw-feature-update-spec` — 修改当前 feature 的设计

### 全局
- `/fw-contract-update` — 修改模块间契约
- `/fw-overview` — 查看所有需求和 feature 的全局状态
- `/fw-help [问题或阶段]` — 查询工作流使用帮助

## 开发规则
- 实现任何 feature 前，必须先读取该 feature 的 spec.md 和所属 demand 的 demand.md
- 修改共享类型或跨模块接口时，必须先更新 docs/contracts/ 再改代码
- 不要修改其他 feature 目录下的文件，除非 spec.md 中显式声明了依赖
- 一个 feature 完成后，检查所属 demand 的 phase 是否解锁下一批 feature

## Contracts 说明
- docs/contracts/ 定义模块间的共享约定，独立于任何 demand
- 修改 contract 前必须执行影响分析（/fw-contract-update 会自动执行）
- 每个 contract 文件顶部维护「被引用方」列表
```

---

## 五、文档模板

### demand.md 模板

```markdown
# Demand: <demand-name>

## 状态
planning | in-progress | done

## 业务目标
（本需求要达成的业务目标，对应 PRD 中的章节引用）

## Feature 拆分与 Phase 编排

### Phase 1: <phase 主题>（可并行）
| Feature | 描述 | 状态 |
|---------|------|------|
| <feature-a> | <一句话描述> | draft |
| <feature-b> | <一句话描述> | draft |

### Phase 2: <phase 主题>（依赖 Phase 1）
| Feature | 描述 | 依赖 | 状态 |
|---------|------|------|------|
| <feature-c> | <一句话描述> | feature-a 的等级接口 | draft |

### Phase 3: <phase 主题>（依赖 Phase 1 + 2）
| Feature | 描述 | 依赖 | 状态 |
|---------|------|------|------|
| <feature-d> | <一句话描述> | feature-a + feature-c | draft |

## 跨 Feature 约束
- <描述所有 feature 必须遵守的共享约定>
- <引用相关的 contracts 文件>

## 整体验收标准
- <端到端的验收条件 1>
- <端到端的验收条件 2>
- <端到端的验收条件 3>

## 变更记录
- <date>: <需求级别的变更，如新增/移除 feature、调整 phase 顺序>
```

### spec.md 模板

```markdown
# Feature: <feature-name>
# Demand: <demand-name>

## 状态
draft | in-progress | done | revised

## 需求摘要
（从 PRD / demand.md 提取的与本 feature 相关的核心需求）

## 技术方案

### 实现步骤
1. Step 1: <描述>
2. Step 2: <描述>
3. Step 3: <描述>

### 涉及的文件和模块
- src/modules/xxx/
- src/api/xxx.ts

## Dependencies

### 依赖的 contracts
- docs/contracts/shared-types.md — <具体引用哪些类型>
- docs/contracts/api-contracts.md — <具体引用哪些接口>

### 依赖的其他 feature（同 demand 内）
- <feature-name>: <依赖什么、为什么>

### 依赖的其他 demand 的产出
- <demand>/<feature>: <依赖什么>（跨需求依赖，需特别注意）

### 被依赖方
- <feature-name>: <对方依赖本 feature 的什么>

## 边界约束
- 本 feature 不处理 xxx（属于 <other-feature> 的范围）
- xxx 相关逻辑暂用 mock，待 <other-feature> 完成后替换
```

### checkpoint.md 模板

```markdown
# Checkpoint: <feature-name>
# Demand: <demand-name>

## 最近更新
<timestamp>

## 总体进度
Step 1 ✅ — Step 2 🔄 (进行中) — Step 3 ⬜ (待开始)

## 已完成的内容
- <文件路径>: <做了什么>
- <文件路径>: <做了什么>

## 当前停在哪
<具体到正在做什么、做到哪一步>

## 已知问题 / 待决事项
- <问题描述>: <当前处理方式>

## 设计变更记录
- <date>: <变更内容>（详见 decisions.md）
```

### decisions.md 模板

```markdown
# Decisions: <feature-name>
# Demand: <demand-name>

## [D001] <决策标题>
- **日期**: <date>
- **背景**: <为什么要改>
- **原方案**: <之前的设计>
- **新方案**: <改成什么>
- **原因**: <为什么改>
- **影响范围**: <影响了哪些文件/模块/其他 feature>
```

---

## 六、Slash Commands 完整定义

### 1. `/fw-demand-init` — 初始化新需求

文件：`.claude/commands/fw-demand-init.md`

```markdown
---
description: 初始化一个新需求的工作空间
argument-hint: <demand-name>
---

初始化需求: $ARGUMENTS

执行以下步骤：

1. 创建目录 `docs/demands/$ARGUMENTS/`
2. 创建 `docs/demands/$ARGUMENTS/features/`（空目录）
3. 创建 `docs/demands/$ARGUMENTS/demand.md`，使用 demand 模板，填入需求名称，状态设为 `planning`

4. 读取 `docs/prd.md`，提取与该需求相关的章节内容，填入 demand.md 的「业务目标」部分

5. 基于 PRD 内容，给出初步的 feature 拆分建议：
   - 识别可以独立实现和验证的功能点
   - 分析功能点之间的依赖关系
   - 建议 phase 编排（哪些可以并行、哪些有先后依赖）

6. 扫描 `docs/contracts/`，列出可能与本需求相关的已有契约
7. 扫描 `docs/demands/` 下其他需求，检查是否存在跨需求依赖

8. 输出：
   - 已创建的文件列表
   - 建议的 feature 拆分和 phase 编排（供我确认和调整）
   - 可能涉及的 contracts
   - 与其他需求的潜在关联

不要创建任何 feature 目录，等我确认 demand.md 的拆分方案后，通过 /fw-feature-init 逐个创建。
```

### 2. `/fw-demand-plan` — 规划或调整需求编排

文件：`.claude/commands/fw-demand-plan.md`

```markdown
---
description: 规划或调整需求的 feature 拆分和 phase 编排
argument-hint: <demand-name>
---

规划/调整需求: $ARGUMENTS

我会在这条指令后描述调整内容（新增 feature、移除 feature、调整 phase 顺序、修改依赖关系等）。

执行以下步骤：

1. 读取 `docs/demands/$ARGUMENTS/demand.md`
2. 读取该 demand 下所有已有 feature 的 spec.md 状态

3. 根据我的描述，分析调整方案：
   - 如果是新增 feature：建议它应该放在哪个 phase，与哪些已有 feature 有依赖
   - 如果是移除 feature：检查是否有其他 feature 依赖它，列出影响
   - 如果是调整 phase 顺序：验证依赖关系是否仍然成立（不能把被依赖方放到依赖方后面）
   - 如果是拆分/合并 feature：评估对已完成代码的影响

4. 输出调整方案的 diff，包括：
   - demand.md 的变更
   - 受影响的 feature 列表及影响程度
   - 是否需要新增/修改 contracts

5. 等我确认后更新 demand.md
6. 在 demand.md 的「变更记录」中追加本次调整

如果调整涉及已经 in-progress 或 done 的 feature，特别标注风险。
```

### 3. `/fw-demand-status` — 查看需求进度

文件：`.claude/commands/fw-demand-status.md`

```markdown
---
description: 查看某个需求的整体进度和 phase 状态
argument-hint: <demand-name>
---

查看需求进度: $ARGUMENTS

执行以下步骤：

1. 读取 `docs/demands/$ARGUMENTS/demand.md`
2. 扫描该 demand 下所有 feature 的 spec.md 和 checkpoint.md

3. 输出 Phase 视图：

### Phase 1: <主题>
| Feature | 状态 | 进度 | 阻塞项 |
|---------|------|------|--------|
| ... | ... | Step x/y | ... |

Phase 1 完成度：x/y features done

### Phase 2: <主题>
🔒 未解锁（等待 Phase 1 的 feature-a 完成）
或
🔓 已解锁
| Feature | 状态 | 进度 | 阻塞项 |
...

4. 输出整体进度：
   - 总 feature 数、已完成数、进行中数
   - 当前可以并行开发的 feature 列表
   - 阻塞链：哪些 feature 阻塞了后续 phase 的推进
   - 整体验收标准的达成情况（逐条标注）

5. 如果有 feature 状态为 revised，提醒关注设计变更的影响
6. 如果有跨需求依赖，显示外部依赖的状态
```

### 4. `/fw-feature-init` — 初始化 feature

文件：`.claude/commands/fw-feature-init.md`

```markdown
---
description: 在某需求下初始化一个新 feature
argument-hint: <demand-name>/<feature-name>
---

初始化 feature: $ARGUMENTS

解析参数：从 $ARGUMENTS 中提取 demand 名称和 feature 名称（格式：demand/feature）。

执行以下步骤：

1. 验证 `docs/demands/<demand>/demand.md` 是否存在，如果不存在，提示先执行 `/fw-demand-init`
2. 读取 demand.md，确认该 feature 在拆分计划中（如果不在，询问是否需要先更新 demand 计划）

3. 创建目录 `docs/demands/<demand>/features/<feature>/`
4. 创建以下文件：
   - `spec.md` — 使用 spec 模板，填入 feature 名称和 demand 名称，状态设为 `draft`
   - `checkpoint.md` — 使用 checkpoint 模板，所有 step 标记为待开始
   - `decisions.md` — 使用 decisions 模板，内容为空

5. 从 demand.md 中提取与该 feature 相关的描述和约束，填入 spec.md
6. 从 demand.md 的 phase 编排中提取该 feature 的依赖关系，填入 spec.md 的 Dependencies

7. 扫描 `docs/contracts/` 目录，列出可能相关的契约
8. 扫描同 demand 下其他 feature 的 spec.md，检查双向依赖关系

9. 输出：
   - 已创建的文件列表
   - 需要手动补充的内容（技术方案、实现步骤、边界约束）
   - 该 feature 所在的 phase 和前置依赖是否已满足
   - 与同 demand 内其他 feature 的依赖关系

不要开始写任何实现代码，等我确认 spec.md 内容后再开始。
```

### 5. `/fw-feature-resume` — 恢复 feature 上下文

文件：`.claude/commands/fw-feature-resume.md`

```markdown
---
description: 清上下文后恢复某个 feature 的工作现场
argument-hint: <demand-name>/<feature-name>
---

恢复 feature 上下文: $ARGUMENTS

解析参数：从 $ARGUMENTS 中提取 demand 名称和 feature 名称。

执行以下步骤：

1. 读取 `docs/demands/<demand>/demand.md`，了解需求整体背景和 phase 编排
2. 读取 `docs/demands/<demand>/features/<feature>/checkpoint.md`，了解当前进度
3. 读取 `docs/demands/<demand>/features/<feature>/spec.md`，了解技术方案
4. 读取 `docs/demands/<demand>/features/<feature>/decisions.md`，了解设计变更
5. 读取 spec.md 中 Dependencies 引用的所有 contracts 文件
6. 如果 spec.md 中声明了对其他 feature 的依赖，读取那些 feature 的 spec.md 状态段落（只读状态，不读全文）

读取完成后，输出上下文摘要：
- 所属需求和 phase 位置
- 当前 feature 的目标
- 已完成的步骤
- 当前停在哪，下一步应该做什么
- 有哪些已知问题或待决事项
- 依赖的 feature 的当前状态（是否已完成）

然后等待我的指令继续实现。
```

### 6. `/fw-feature-checkpoint` — 保存当前进度

文件：`.claude/commands/fw-feature-checkpoint.md`

```markdown
---
description: 保存当前 feature 的执行进度到 checkpoint 文件
---

保存当前 feature 的检查点。

执行以下步骤：

1. 确认当前正在处理的 feature 和所属 demand（如果上下文不明确，询问我）
2. 基于当前对话中的工作内容，更新对应的 checkpoint.md：
   - 更新「最近更新」时间戳
   - 更新「总体进度」中各 step 的状态标记
   - 更新「已完成的内容」，列出本次会话中创建或修改的文件及其变更摘要
   - 更新「当前停在哪」，精确描述当前的工作位置
   - 更新「已知问题 / 待决事项」
3. 将更新后的 checkpoint.md 内容展示给我确认

注意：
- 只记录事实，不要添加主观判断
- 「当前停在哪」要具体到文件和函数级别，确保下次恢复时能精确定位
- 如果本次会话有设计变更，同步提醒我是否需要更新 decisions.md
```

### 7. `/fw-feature-done` — 完成当前 feature

文件：`.claude/commands/fw-feature-done.md`

```markdown
---
description: 标记当前 feature 为已完成，执行收尾检查并更新 demand 进度
---

完成当前 feature。

执行以下步骤：

1. 确认当前 feature 和所属 demand
2. 读取 spec.md，检查所有实现步骤是否都已完成
3. 读取 spec.md 的 Dependencies 中的「被依赖方」，列出等待本 feature 的其他 feature

4. 检查收尾项：
   - 本 feature 是否修改了 docs/contracts/，如有，确认影响分析已完成
   - 是否有未解决的已知问题（从 checkpoint.md）
   - 是否有未记录的设计变更（从 decisions.md）

5. 更新 feature 文件：
   - spec.md 状态改为 `done`
   - checkpoint.md 所有 step 标记完成，清空「当前停在哪」

6. **更新 demand 层**：
   - 读取 demand.md
   - 更新该 feature 在 phase 表格中的状态为 done
   - 检查当前 phase 是否全部完成
   - 如果当前 phase 全部完成，检查下一个 phase 的依赖是否满足，标注解锁状态

7. 输出完成报告：
   - 本 feature 实现的文件清单
   - 对 contracts 的修改（如有）
   - 对其他 feature 的影响
   - 当前 phase 完成度
   - 下一个 phase 是否解锁
   - 建议下一个可以开始的 feature（优先同 phase 内未完成的，其次下一 phase 已解锁的）
```

### 8. `/fw-feature-update-spec` — 修改 feature 设计

文件：`.claude/commands/fw-feature-update-spec.md`

```markdown
---
description: 修改当前 feature 的技术方案，并同步更新相关文件
---

修改当前 feature 的设计。

我会在这条指令后描述需要修改的内容。请按以下步骤执行：

1. 确认当前 feature 和所属 demand
2. 读取当前的 spec.md 和 demand.md

3. 根据我的描述，分析修改影响：
   - 如果修改影响了 Dependencies 中声明的 contracts，提醒我需要先执行 `/fw-contract-update`
   - 如果修改影响了同 demand 内其他 feature（根据「被依赖方」判断），列出受影响的 feature
   - 如果修改导致 demand.md 中的 phase 编排需要调整，提醒我需要执行 `/fw-demand-plan`

4. 更新 spec.md 中的相关段落
5. 在 decisions.md 中新增决策记录

6. 如果当前已有部分代码实现，评估哪些代码需要同步修改，列出清单等我确认后再改

展示变更前后的 diff 让我确认，确认后再写入文件。
```

### 9. `/fw-contract-update` — 修改模块间契约

文件：`.claude/commands/fw-contract-update.md`

```markdown
---
description: 修改模块间共享契约，并执行跨 demand 的影响分析
---

修改模块间契约。

我会在这条指令后描述需要修改的 contract 内容。请按以下步骤执行：

1. 确认要修改的 contract 文件（docs/contracts/ 下的哪个文件）
2. 读取该 contract 文件的当前内容

3. **影响分析（关键步骤）**：
   - 扫描 `docs/demands/` 下 **所有 demand 的所有 feature** 的 spec.md
   - 找出 Dependencies 中引用了该 contract 的所有 feature
   - 按 demand 分组输出影响：
     - demand A:
       - feature-x: 需要小调整（原因）
       - feature-y: 无影响
     - demand B:
       - feature-z: 需要重新设计（原因）
   - 对每个受影响的 feature，评估：
     - 影响程度（无影响 / 需要小调整 / 需要重新设计）
     - 该 feature 当前状态（如果已 done，修改成本更高）

4. 输出影响分析报告
5. 等我确认后，执行 contract 文件的修改
6. 更新 contract 文件顶部的「被引用方」列表

注意：不要在未经我确认的情况下修改任何 feature 的代码或 spec。
```

### 10. `/fw-overview` — 全局状态总览

文件：`.claude/commands/fw-overview.md`

```markdown
---
description: 查看所有需求和 feature 的全局状态
---

输出全局状态总览。

执行以下步骤：

1. 扫描 `docs/demands/` 下所有 demand 目录
2. 对每个 demand，读取 demand.md 和所有 feature 的状态

3. 输出需求总览：

| Demand | 状态 | Phase 进度 | Feature 完成度 |
|--------|------|-----------|---------------|
| membership | in-progress | Phase 2/3 | 3/6 done |
| refactor-user | planning | Phase 1/2 | 0/4 done |

4. 对每个 in-progress 的 demand，输出当前可执行的 feature 列表：
   - 已解锁且未开始的 feature
   - 正在进行中的 feature
   - 被阻塞的 feature 及阻塞原因

5. 检查跨 demand 依赖：
   - 是否有 feature 依赖其他 demand 的产出
   - 这些外部依赖是否已满足

6. 检查 contracts 健康度：
   - 最近被修改的 contract
   - 是否有未完成影响分析的 contract 变更
```

### 11. `/fw-help` — 使用帮助

文件：`.claude/commands/fw-help.md`

```markdown
---
description: 查询工作流使用帮助，支持：无参数查看总览、传入问题获取解答、传入当前阶段获取下一步指引
argument-hint: [问题或当前阶段，可选]
---

你是这个项目开发工作流的使用顾问。请先读取使用指南文档 `docs/workflow-guide.md`，基于其中的内容来回答用户的问题。

如果 `docs/workflow-guide.md` 不存在，尝试读取 `docs/claude-code-workflow-usage-guide.md`。如果都不存在，告诉用户需要先将使用指南文档放到 `docs/` 目录下。

---

根据用户输入的 $ARGUMENTS，判断属于以下哪种情况并执行对应逻辑：

## 情况 1：无参数（用户只输入了 /fw-help）

输出工作流总览，包括：

1. 命令速查表：

| 我想做什么 | 用哪个命令 |
|------------|-----------|
| 拿到新需求，开始规划 | `/fw-demand-init <需求名>` |
| 调整 feature 拆分或 phase | `/fw-demand-plan <需求名>` |
| 看某需求整体进度 | `/fw-demand-status <需求名>` |
| 开始做一个 feature | `/fw-feature-init <需求>/<feature>` |
| 清上下文后继续做 | `/fw-feature-resume <需求>/<feature>` |
| 保存进度 | `/fw-feature-checkpoint` |
| 完成一个 feature | `/fw-feature-done` |
| 修改 feature 设计 | `/fw-feature-update-spec` |
| 修改跨模块接口/类型 | `/fw-contract-update` |
| 全局状态 | `/fw-overview` |
| 使用帮助 | `/fw-help [问题]` |

2. 当前项目状态快照：
   - 扫描 `docs/demands/` 判断是否有已创建的 demand
   - 如果有，列出每个 demand 及其 feature 数量和状态
   - 如果没有，提示用户从 `/fw-demand-init` 开始

3. 提示用户可以通过 `/fw-help <具体问题>` 获取更详细的帮助

## 情况 2：用户传入了当前阶段描述

识别关键词来判断阶段，给出该阶段的详细操作指引：

**规划阶段**（关键词：规划、开始、新需求、新项目、拆分、planning）
→ 从指南中提取「阶段一：需求规划」的内容，告诉用户：
  - 应该先执行 `/fw-demand-init`
  - 如何判断 feature 拆分粒度（1-3 次会话能完成）
  - 确认拆分后如何用 `/fw-feature-init` 初始化

**设计阶段**（关键词：设计、spec、技术方案、怎么写）
→ 从指南中提取「阶段二：Feature 设计」和「spec.md 要写多详细」的内容，告诉用户：
  - spec.md 的关键原则：写到清完上下文两天后回来还能恢复理解
  - 实现步骤、依赖声明、边界约束各自怎么写
  - 不需要一次性 init 所有 feature

**开发阶段**（关键词：开发、写代码、实现、继续、恢复、resume、checkpoint）
→ 从指南中提取「阶段三：日常开发循环」的内容，告诉用户：
  - 核心循环：实现 → 验证 → checkpoint → (清上下文) → resume → 继续
  - `/fw-feature-checkpoint` 当成 Ctrl+S 用
  - 什么时候应该保存检查点

**变更阶段**（关键词：改设计、改方案、调整、修改、contract、接口变了）
→ 从指南中提取「阶段四：处理变更」的内容，告诉用户：
  - 变更操作的优先级：先 contract-update 再 feature-update-spec
  - 三种变更命令的区别和使用场景
  - `/fw-demand-plan` vs `/fw-feature-update-spec` 的判断标准

**收尾阶段**（关键词：完成、做完了、done、下一个、切换）
→ 从指南中提取「阶段五：完成和推进」的内容，告诉用户：
  - `/fw-feature-done` 会自动检查什么
  - 如何查看 phase 解锁状态
  - 如何切换到下一个 feature

**并行开发**（关键词：并行、多个、同时、两个终端）
→ 从指南中提取「并行开发指南」的内容

如果无法判断阶段，先扫描 `docs/demands/` 的实际状态来推断当前阶段，然后给出建议。

## 情况 3：用户传入了具体问题

根据使用指南的内容回答。常见问题映射：

- "忘了保存" / "checkpoint 丢了" → 提取「忘了保存 checkpoint 就清了上下文」段落
- "命名" / "怎么起名" → 提取「demand 和 feature 的命名规范」段落
- "需求很小" / "简单需求" → 提取「需求很小，只有一两个 feature」段落
- "contracts 放什么" → 提取「contracts 目录下应该放什么」段落
- "demand-plan 还是 feature-update-spec" → 提取对应判断标准段落

如果问题在指南中没有直接对应的内容，基于指南的整体思路给出合理建议，并明确说明哪些是指南中的建议、哪些是你的推断。

---

回答格式要求：
- 使用中文回答
- 简明扼要，不要复述整篇指南
- 给出具体的命令示例，而不是抽象的描述
- 如果涉及多个步骤，用编号列出操作顺序
```

---

## 七、典型工作流示例

### 场景 1：从零开始一个大需求（纵向拆分）

"重构用户中心"——一个大模块，拆成多个阶段。

```bash
# 1. 初始化需求
> /fw-demand-init user-center-refactor
#    → 创建 demand 目录和 demand.md 骨架
#    → 分析 PRD，建议 feature 拆分：
#      Phase 1: user-profile（基础信息）、user-avatar（头像上传）
#      Phase 2: user-settings（偏好设置，依赖 user-profile）
#      Phase 3: user-migration（数据迁移，依赖全部）

# 2. 确认拆分方案后，逐个初始化 feature
> /fw-feature-init user-center-refactor/user-profile
#    → 创建 feature 目录和模板文件
#    → 手动补充 spec.md 的技术方案

> /fw-feature-init user-center-refactor/user-avatar
#    → 同上

# 3. 开始实现 Phase 1 的第一个 feature
> 开始实现 user-profile，从 Step 1 开始

# 4. 阶段性保存
> /fw-feature-checkpoint

# 5. 清上下文后恢复
> /clear
> /fw-feature-resume user-center-refactor/user-profile

# 6. 完成第一个 feature
> /fw-feature-done
#    → 更新 demand.md 中 user-profile 状态为 done
#    → 显示 Phase 1 完成度：1/2
#    → 建议下一个：user-avatar

# 7. Phase 1 全部完成后
> /fw-feature-done  (完成 user-avatar)
#    → Phase 1: 2/2 done
#    → Phase 2 已解锁
#    → 建议开始 user-settings

# 8. 进入 Phase 2
> /fw-feature-init user-center-refactor/user-settings
```

### 场景 2：一个需求横跨多个模块

"上线会员体系"——用户模块、订单模块、支付模块各有变更。

```bash
# 1. 初始化需求
> /fw-demand-init membership-system
#    → 建议拆分：
#      Phase 1（并行）: user-level（用户等级）、payment-bindcard（会员卡绑定）
#      Phase 2: order-discount（会员折扣，依赖 user-level）
#      Phase 3: notification-push（通知，依赖 Phase 1 + 2）

# 2. 创建跨模块共享的 contract
#    手动创建 docs/contracts/membership-types.md（会员等级枚举等）

# 3. 并行开发 Phase 1
# 会话 A:
> /fw-feature-resume membership-system/user-level
# 会话 B:
> /fw-feature-resume membership-system/payment-bindcard

# 4. Phase 1 完成后进入 Phase 2
> /fw-demand-status membership-system
#    → Phase 1: 2/2 done ✅
#    → Phase 2: 已解锁 🔓
#    → 建议开始 order-discount

> /fw-feature-init membership-system/order-discount
```

### 场景 3：开发中途需要调整需求拆分

```bash
# 发现 user-level 太大了，需要继续拆分
> /fw-demand-plan membership-system
> 将 user-level 拆分为 user-level-model（等级数据模型）和 user-level-upgrade（升降级逻辑），
> user-level-model 放在 Phase 1，user-level-upgrade 依赖 user-level-model 也放在 Phase 1
#    → 分析影响：order-discount 原本依赖 user-level，现在需要改为依赖 user-level-upgrade
#    → 更新 demand.md
#    → 提示需要更新受影响 feature 的 spec.md
```

### 场景 4：修改 contract 影响多个需求

```bash
> /fw-contract-update
> shared-types.md 中的 UserInfo 类型增加 memberLevel 字段

#    → 影响分析：
#      membership-system:
#        - user-level: 需要小调整（写入方）
#        - order-discount: 需要小调整（读取方，draft 状态）
#      user-center-refactor:
#        - user-profile: 需要小调整（展示方，已 done，改动成本注意）
#    → 等确认后修改
```

### 场景 5：查看全局状态

```bash
> /fw-overview
#    → 需求总览表
#    → 当前可执行的 feature 列表
#    → 跨需求依赖状态
#    → contracts 健康度
```

---

## 八、模块间依赖治理：三层防护

### 第一层：事前 — 结构化声明

- `/fw-demand-init` 在需求级别分析 feature 间依赖，建立 phase 编排
- `/fw-feature-init` 在 feature 级别声明对 contracts 和其他 feature 的具体依赖
- spec.md 的 Dependencies 段落区分：同 demand 内依赖 vs 跨 demand 依赖

### 第二层：事中 — 契约约束 + phase 门控

- 所有跨模块交互通过 `docs/contracts/` 约束
- `/fw-contract-update` 在修改契约时自动执行跨 demand 的影响分析
- phase 机制确保有依赖关系的 feature 按正确顺序执行
- CLAUDE.md 中的规则保证 Claude Code 不自行发明跨模块调用

### 第三层：事后 — 完成检查 + demand 联动

- `/fw-feature-done` 在 feature 完成时执行收尾检查，并联动更新 demand.md 的 phase 进度
- `/fw-demand-status` 提供 phase 级别的进度视图和阻塞链分析
- `/fw-overview` 在全局层面检查跨 demand 依赖和 contracts 健康度

---

## 九、注意事项

1. **checkpoint 是手动触发的**。养成习惯：每次准备清上下文或结束会话前，先执行 `/fw-feature-checkpoint`。如果忘了，中间状态会丢失。

2. **spec.md 的质量决定恢复效果**。spec 写得越精确（尤其是实现步骤和边界约束），清上下文后恢复的效果越好。模糊的 spec 会导致 Claude Code 的理解产生偏差。

3. **contracts 需要纪律性**。如果绕过 contracts 直接写跨模块代码，依赖治理就会失效。

4. **demand.md 是编排文档而非实现文档**。它不应该包含具体的技术实现细节，那些属于 feature 的 spec.md。demand.md 的粒度是"做什么"和"什么顺序"，不是"怎么做"。

5. **phase 不是刚性约束**。如果某个 Phase 2 的 feature 实际上可以提前开始（比如可以先 mock 依赖），在 spec.md 中注明即可。phase 是推荐顺序，不是硬性门禁。

6. **跨 demand 依赖要特别小心**。一个 demand 的 feature 依赖另一个 demand 的产出时，协调成本最高。在 spec.md 中用「依赖的其他 demand 的产出」显式标注，`/fw-overview` 会检查这类依赖的状态。

7. **按需裁剪**。小需求可以跳过 demand 层，直接在 `docs/demands/<name>/features/` 下创建单个 feature。不是所有项目都需要 phase 编排。最小可行集是 `/fw-feature-init` + `/fw-feature-resume` + `/fw-feature-checkpoint` 三个命令。
