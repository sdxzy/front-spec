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
