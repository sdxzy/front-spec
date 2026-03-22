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
