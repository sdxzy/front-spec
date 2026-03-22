# 项目约束

## 开发工作流命令

### Demand 层（需求管理）
- `/fw-demand-init <name>` — 初始化新需求
- `/fw-demand-plan <name>` — 规划/调整需求的 feature 拆分和 phase 编排
- `/fw-demand-status <name>` — 查看某需求的整体进度

### Feature 层（功能实现）
- `/fw-feature-init <demand>/<feature>` — 在某需求下初始化新 feature
- `/fw-feature-resume <demand>/<feature>` — 恢复 feature 上下文
- `/fw-feature-checkpoint` — 保存当前进度
- `/fw-feature-done` — 完成当前 feature
- `/fw-feature-update-spec` — 修改当前 feature 的设计

### 全局
- `/fw-contract-update` — 修改模块间契约
- `/fw-overview` — 查看所有需求和 feature 的全局状态
- `/fw-help [问题或阶段]` — 查询工作流使用帮助

## 开发规则
- 实现任何 feature 前，必须先读取该 feature 的 spec.md 和所属 demand 的 demand.md
- 修改共享类型或跨模块接口时，必须先更新 docs/contracts/ 再改代码
- 不要修改其他 feature 目录下的文件，除非 spec.md 中显式声明了依赖
- 一个 feature 完成后，检查所属 demand 的 phase 是否解锁下一批 feature

## Contracts 说明
- docs/contracts/ 定义模块间的共享约定，独立于任何 demand
- 修改 contract 前必须执行影响分析（/fw-contract-update 会自动执行）
- 每个 contract 文件顶部维护「被引用方」列表
