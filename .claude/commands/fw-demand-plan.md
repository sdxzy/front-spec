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
