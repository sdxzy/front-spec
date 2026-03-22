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
