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
- `js-ffi` 是 Calcit 使用 JS 生态的通用基础 API 封装：DOM/Canvas2D/WebGPU/TypedArray 原生能力在上游提供 Calcit 类型化公共入口，必要的原生宿主 JS 可以留在上游包内。对只有 Quamolit 实际使用、且不是原始浏览器 API 封装的 JS 文件，迁回 Quamolit；不能只靠“未来可能复用”保留专属 renderer。归属不以 JS 行数决定。
- Quamolit 专属的 Scene/Motion 遍历、动画采样、执行计划、批次/资源策略与后端选择优先写在本仓库 Calcit 源码；确实需要 JS 的专属宿主适配放 `src/host/`。不得把 Quamolit 的场景命令解释器搬到 `js-ffi` 再用 Calcit 空壳转发。通用批量提交或资源原语可以在 `js-ffi` 实现；具体判定见 `docs/calcit-first-ffi.md`。
- 修改上游 `js-ffi` 前先检查实际路径和 remote，再提交上游变更并引用版本化 tag。对已发布接口先审查真实消费者、原生平台边界与专属逻辑；破坏性迁移使用新版本并保留历史 tag，不改写已发布版本。

## Calcit 文件和版本

- 写入 Snapshot 前运行 `calcit docs agents --contract`，按其要求核对 CLI、`deps.cirru` 和 `calcit query config`；首次使用或契约变化时读取完整指南。
- `calcit.cirru` 只能通过 `calcit edit/tree/cursor/config` 修改，禁止文本 patch 或正则改写。目标与替换内容来自查询结果；多步写入使用 transaction、dry-run 和 revision 检查。
- `calcit.cirru` 是项目主要源码，不得重新加上 `linguist-generated` 或 `-diff` 属性。
- 手写 JS 宿主适配只放 `src/host/`（入口/构建配置除外），测试夹具桥接放 `test/host/`；同步、无状态、原始 ABI 的小适配器优先用定义级 `:ffi :js :inline/:file` 嵌入 Calcit 定义，不新增独立 `.mjs`；归属细则见 [Calcit 优先的 FFI 边界](docs/calcit-first-ffi.md)。多入口 Calcit 编译产物放被忽略的 `target/js/<entry>/`，不得在根目录新建 `js-out-*`。
- 优先采用当前已发布且适用的新方案；升级时同步 Calcit CLI、runtime、依赖、lockfile 与 CI。不要未经核对机械升级所有依赖；若回退，给出可复现回归和上游 issue。
- 用泛型/Struct/Enum 保留能够表达的类型关系；不要用 Dynamic 或兼容模式掩盖新代码的类型错误。

## 完成与交付

- 按 `verification.md` 选择实际存在的命令。未来命令明确标为“待实现”，不能写成已经通过。
- `yarn compile` 当前可能仍指向 bootstrap。真实入口切换前，编译成功不能作为原应用运行成功的证据。
- PR 写清实际实现、未完成范围、运行命令、环境和结果。性能结论必须附数据；截图变化附差异图，不能静默放宽阈值。
- 部分实现使用“推进 #N”；仅在全部验收项有证据时写 `Closes #N`。不因预算或会话结束把 issue/milestone 标成完成。
- 编码 PR 需确认 Actions 结果。无法访问真实 GPU 时如实标为未验证，不用 skip 代替通过。
- 如接口名或技术选择改变，在同一 PR 更新路线/相关 issue 并记录原因、替代方案和验证证据。普通内部重构不需要额外审批；合并、发版与外部写入遵循用户已有授权。
