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
