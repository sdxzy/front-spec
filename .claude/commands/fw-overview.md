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
