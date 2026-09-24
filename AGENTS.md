# Quamolit 编码交接约定

## 开始工作

1. 先读 [技术路线](docs/roadmap.md) 与 [检验规则](docs/verification.md)，再定位 [工作项索引](docs/work-items.md) 中的当前 issue。GitHub 的状态可能已变化，开始前核对 milestone、issue 和相关 PR 的最新状态。
2. `roadmap.md` 中的计划 v2 取代旧 `vnext-design.md` 的三阶段顺序。本文说明仓库约定；用户当前明确要求优先。
3. 每次选择一个有明确前置产物的实现切片，说明其 issue、依赖和退出条件。依赖尚未关闭时，引用已合并且通过验证的前置产物；不能把尚未实现的草案当作可用接口。
4. 检查工作区，保留用户改动。文档与 PR 使用中文，README 保留中英文入口。

## 不能偏离的技术方向

- 默认动画由显式参数和绝对时间直接采样；历史相关模拟使用独立固定步长入口。现有 `evaluate-at` 是顺序求值基础，不等于任意时间采样已经完成。
- 应用 Model 保存动画意图、过渡状态、随机种子和显式资源状态。绘制不更新逻辑状态，也不创建事件区域。
- 声明式组件与执行计划分离。结构不变时应复用结构/几何/资源，时间变化只更新必要绑定；普通组件自动合批，大量同类对象可以使用 instances。
- Scene/Motion IR 不含 DOM/GPU 句柄。CPU 自定义函数单独注册，不能声称任意 Calcit 闭包可自动转成 WGSL。
- WebGPU 在 M2 建立可运行主路径；Canvas2D 提供基础语义参考与声明过的回退。保持层叠、裁剪、颜色和组透明度语义，不能为合批随意重排透明节点。
- `js-ffi` 的首要职责是用 Calcit 定义并类型化浏览器 Canvas2D/WebGPU 等原生基础 API，供 Quamolit 直接引用。场景遍历、动画采样、资源/批次决策和绘制计划留在 Quamolit 的 Calcit 源码中；不得把整场景命令解释器、大段业务 JS 搬到 `js-ffi` 再用一层 Calcit 转发。只有浏览器对象生命周期、原生 buffer/typed array 等当前 Calcit 无法合理表达的操作才保留最小 JS，优先放本仓库 `src/host/`，并记录为何无法用 Calcit。
- 修改上游 `js-ffi` 前先检查实际路径和 remote，再提交上游变更并引用版本化 tag。已发布的 JS 包装接口不自动成为新架构的推荐入口；详见 `docs/calcit-first-ffi.md`。

## Calcit 文件和版本

- 写入 Snapshot 前运行 `calcit docs agents --contract`，按其要求核对 CLI、`deps.cirru` 和 `calcit query config`；首次使用或契约变化时读取完整指南。
- `calcit.cirru` 只能通过 `calcit edit/tree/cursor/config` 修改，禁止文本 patch 或正则改写。目标与替换内容来自查询结果；多步写入使用 transaction、dry-run 和 revision 检查。
- `calcit.cirru` 是项目主要源码，不得重新加上 `linguist-generated` 或 `-diff` 属性。
- 手写 JS 宿主适配只放 `src/host/`（入口/构建配置除外）；多入口 Calcit 编译产物放被忽略的 `target/js/<entry>/`，不得在根目录新建 `js-out-*`。
- 优先采用当前已发布且适用的新方案；升级时同步 Calcit CLI、runtime、依赖、lockfile 与 CI。不要未经核对机械升级所有依赖；若回退，给出可复现回归和上游 issue。
- 用泛型/Struct/Enum 保留能够表达的类型关系；不要用 Dynamic 或兼容模式掩盖新代码的类型错误。

## 完成与交付

- 按 `verification.md` 选择实际存在的命令。未来命令明确标为“待实现”，不能写成已经通过。
- `yarn compile` 当前可能仍指向 bootstrap。真实入口切换前，编译成功不能作为原应用运行成功的证据。
- PR 写清实际实现、未完成范围、运行命令、环境和结果。性能结论必须附数据；截图变化附差异图，不能静默放宽阈值。
- 部分实现使用“推进 #N”；仅在全部验收项有证据时写 `Closes #N`。不因预算或会话结束把 issue/milestone 标成完成。
- 编码 PR 需确认 Actions 结果。无法访问真实 GPU 时如实标为未验证，不用 skip 代替通过。
- 如接口名或技术选择改变，在同一 PR 更新路线/相关 issue 并记录原因、替代方案和验证证据。普通内部重构不需要额外审批；合并、发版与外部写入遵循用户已有授权。
