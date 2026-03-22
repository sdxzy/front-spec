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
