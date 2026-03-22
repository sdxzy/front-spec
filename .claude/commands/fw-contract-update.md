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
