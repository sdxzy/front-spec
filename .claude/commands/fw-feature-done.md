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
