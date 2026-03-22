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
