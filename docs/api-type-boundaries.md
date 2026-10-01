# API 类型边界盘点

推进 #176/#35。此盘点用于选择需要收紧的接口，不表示所有实验 API 已完成类型迁移，也不提升后端的稳定性标签。

## 可复现范围

```sh
yarn check:api-inventory
yarn audit:api-types
```

工具链使用 `deps.cirru` 指定的 Calcit 0.27.0。脚本通过只读 `calcit query ns/defs/def --format json` 枚举全部项目定义，不直接解析或修改 Snapshot。每个 namespace 的定义计数、身份与分类均核对；缺少 schema 的定义单列为未知，不能因未发现 Dynamic 就说其类型封闭。

检查包含函数 schema 的参数/返回值，以及 Struct/Enum/Type 的真实字段和 Trait 的方法签名（不是只检查 `StructDef`/`Trait` 标签）。普通函数体、文档和 JS 片段中的同名文本不算类型命中。报告逐定义保存 Dynamic/JsObject 的 token 与路径，汇总按定义数而非出现次数计数；同一定义可以同时出现在两类统计中。

`test-results/api-types/report.json` 是自动生成且被忽略的原始报告，包含源码与分类清单的 SHA-256、工具链、范围、全部定义及命中路径。执行期间源文件或分类变化会使报告失败。本页只人工整理结果和处理规则，原始 JSON 不入库。

此命令遍历全部项目定义，适合本地阶段审查，不加入每次 PR 的完整扫描；必需 CI 只运行清单/稳定合同门禁及盘点器的负例测试。命令拒绝稳定 namespace 或其显式引用类型的开放/未知边界，但实验/旧/内部的命中是待审查清单，不自动改标签来消除错误。

## 处理规则

### 2026-10-01 显式声明结果

完整扫描覆盖 118 个命名空间、1503 个定义；Snapshot SHA-256 为 `156d2b26d806a62991122329d16d16d8c7eae9fa1a3c0083433847731f6c5adf`。以下是该源码的人工阶段汇总，后续源码改变应重新扫描，不当作永远不变的全局预算。

| 分类 | 定义数 | 缺 schema | 含 Dynamic 的定义 | 含 JsObject 的定义 |
| --- | --- | --- | --- | --- |
| 稳定 alpha | 11 | 0 | 0 | 0 |
| 实验 | 774 | 0 | 0 | 55 |
| 旧迁移 | 178 | 21 | 132 | 3 |
| 内部 | 540 | 14 | 23 | 2 |

稳定 UI 合同引用的 `quamolit.motion/Easing` 也单独核对，声明无开放/未知类型。它在表中仍按所属实验 namespace 计数，不能重复计入稳定定义数。35 个缺 schema 定义仍是未知项；实验定义的 Dynamic=0 只说明直接声明，不证明推断类型或间接传播已封闭。

本表已包含 Trait 方法签名的复验结果：前一轮未扫描 Trait，实验 JsObject=53、旧 Dynamic=131；本轮分别新增 `RectBatchHost`/`ImageLayerHost` 方法边界和一个旧 Trait 的 Dynamic 边界。源码 SHA 不变，计数变化来自扫描范围修订，不是新增业务债务。

实验 JsObject 的具体定义清单（完整参数/返回/字段/方法路径在可复现报告中）：

| 命名空间 | 定义 |
| --- | --- |
| `quamolit.canvas-reference` | `draw-instances!`, `raw-draw-instances!` |
| `quamolit.canvas-scene` | `composite-layer!`, `layer-context!`, `raw-composite-layer!`, `raw-layer-context!`, `raw-layer-create!` |
| `quamolit.gpu-component` | `create-renderer!`, `dispose-renderer!`, `raw-check!`, `raw-create!`, `raw-draw!`, `raw-write!`, `submit-batch!`, `submit-frame!`, `submit-update!` |
| `quamolit.gpu-scalar-program` | `create-renderer!`, `draw-at!`, `install-program!`, `raw-create!`, `raw-parameter!`, `raw-ready!`, `raw-reset!`, `raw-time!`, `write-parameter!` |
| `quamolit.instance-ffi` | `raw-draw-canvas!` |
| `quamolit.instance-gpu` | `draw-source!`, `upload-source!` |
| `quamolit.instance-resource` | `create-table!`, `live-count`, `patch-info`, `raw-create-table!`, `raw-live-count`, `raw-patch-info`, `raw-register!`, `raw-register-patch!`, `raw-release!`, `raw-resolve`, `register!`, `register-patch!`, `release!`, `resolve` |
| `quamolit.presence-webgpu-resources` | `execute-presence-device-action!`, `execute-presence-resource-action!`, `load-presence-buffer!`, `load-presence-buffer-safe!`, `run-presence-load-request!`, `run-presence-load-task!` |
| `quamolit.webgpu-batches` | `RectBatchHost`, `raw-create!` |
| `quamolit.webgpu-images` | `ImageLayerHost`, `metrics`, `raw-create!` |
| `quamolit.webgpu-texture-runner` | `raw-copy-image-to-texture!`, `raw-create-texture!` |

下一优先级是独立消费者实际导入的 instance-resource/GPU 公共包装：审查哪些只是原始 ABI、哪些将宿主表/数据对象暴露给应用；先建立专属句柄与返回值契约，再验证下游，不批量重命名或移动宿主文件。旧迁移与内部的 Dynamic/缺 schema 分别继续由 #36 和相应夹具负责，不反向放宽现代 API。

已核对的具体边界（不是按 `raw-` 前缀猜测归属）：

| 定义 | 实际声明/用途 | 后续处理 |
| --- | --- | --- |
| `quamolit.instance-resource/raw-resolve` | 有 `:ffi :js :inline`；接收宿主表，返回原生数据对象，参数/返回包含 JsObject | 保留原始 ABI 适配于 Quamolit；此表为专属资源逻辑，不迁往 js-ffi |
| `quamolit.instance-resource/resolve` | 普通 Calcit 函数，公开参数中的 table 与返回仍是 JsObject；另一个参数为 InstanceSource | 实验公共边界尚未封闭；稳定化前审查专属句柄类型及实际下游，不把 wrapper 名称当作类型隔离证据 |
| `quamolit.motion-cpu/CpuFunctionRegistry` | Struct 的 samplers 是 `Map<String, Fn<I, Number → O>>`，保留输入/输出泛型关系 | 继续保留泛型，不能为了兼容 JS 回调改为 Dynamic |

前两项说明“原生 ABI 必须开放”并不自动证明其公共包装已经收窄。后续 #35/#104 应从真实消费者的资源表、数据对象和 await 返回边界开始逐定义迁移，并验证编译产物搬移和生命周期；不在本盘点 PR 重写 renderer。

- 原生 DOM/Canvas/WebGPU 对象、Promise 或 TypedArray 搬运可在宿主 ABI 边界出现 JsObject；平台类型优先由 js-ffi 暴露 Calcit 定义。Quamolit 的资源/renderer 专用句柄仍留在本项目，不为减少命中计数把专属逻辑搬到 js-ffi。
- 帧、Model、Motion/Scene 数据和生命周期动作不能借宿主需要而整体变为 JsObject/Dynamic；可以表达的字段用 Struct/Enum/泛型保留关系。
- 通用回调、CPU 扩展或尚未迁移旧应用中的 Dynamic 必须写明输入/输出的验证位置。缺少 schema 与显式 Dynamic 是不同债务，不能互相抵消。
- 收紧一个边界时核对实际下游定义、inline/file 分发与编译后的宿主调用；纯 schema 变更不证明资源生命周期或画面正确。稳定合同变化需遵守 [alpha 规则](api-contract.md)。

## 证据限制

这是全部**显式声明**的词法类型盘点，不是完整类型推断或污点分析：不会证明一个 Struct 参数间接携带的 JsObject 是否流入渲染逻辑，不验证 JS 内部对象内容，也不盘点外部依赖模块。缺少 schema 的定义、间接引用类型、原始 ABI 与业务语义之间的转换仍需人工审查和实际消费者测试。不能把“稳定直接声明无命中”写成“整个框架无 Dynamic/JsObject”。
