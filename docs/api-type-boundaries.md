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

### 当前关键消费边界

完整定义数、开放类型命中与源码 SHA 由上述命令生成的报告维护，不在主题文档持续追加会过期的全量清单。稳定 UI 合同及其 `quamolit.motion/Easing` 引用仍由轻量 CI 校验；缺 schema 和开放边界分列，未命中不等于间接类型关系已封闭。

以下只维护会影响实际消费者的边界与下一项动作，不按 `raw-` 前缀猜测归属：

| 入口 | 实际声明/用途 | 状态与动作 |
| --- | --- | --- |
| `quamolit.instance-resource` 七项公共操作 | `InstanceTableHost` + `InstanceSource` + `Float32ArrayHost`；`patch-info` 返回 `PatchInfo` | 已迁移；保留类型/复制隔离/8 B 补丁/释放及独立消费门禁，不升为稳定 |
| `raw-create-table!` / `InstanceTableHost.patch-info` | 唯一创建片段返回 JsObject；Trait 的原始补丁 DTO 是局部 JsObject，进入 Calcit 后校验字段并转换 | 仍为必要 ABI；不新增 JS 包装对象，不迁往 js-ffi，不宣称整个 Trait 无开放类型 |
| 历史六个 `instance-resource/raw-*` 操作转发 | 裸 JsObject 平行入口，Calcit 引用查询和仓库调用方检查均无使用 | 已移除；[迁移对照](instance-resource-table.md)，历史 tag 不改写，不保证未知外部调用方无需迁移 |
| GPU scalar/component renderer | 创建返回 `RectRendererHost`，公共提交/安装/绘制/释放使用同一专属句柄；裸 JsObject 只留在原始 ABI 与 Canvas 创建参数 | [边界合同](gpu-component-plan.md)；静态类型不验证任意伪造 JS 对象，仍为实验，不因命中数减少就标为稳定 |
| `quamolit.motion-cpu/CpuFunctionRegistry` | Struct 的 samplers 是 `Map<String, Fn<I, Number → O>>`，保留输入/输出泛型关系 | 继续保留泛型，不能为了兼容 JS 回调改为 Dynamic |

- 原生 DOM/Canvas/WebGPU 对象、Promise 或 TypedArray 搬运可在宿主 ABI 边界出现 JsObject；平台类型优先由 js-ffi 暴露 Calcit 定义。Quamolit 的资源/renderer 专用句柄仍留在本项目，不为减少命中计数把专属逻辑搬到 js-ffi。
- 帧、Model、Motion/Scene 数据和生命周期动作不能借宿主需要而整体变为 JsObject/Dynamic；可以表达的字段用 Struct/Enum/泛型保留关系。
- 通用回调、CPU 扩展或尚未迁移旧应用中的 Dynamic 必须写明输入/输出的验证位置。缺少 schema 与显式 Dynamic 是不同债务，不能互相抵消。
- 收紧一个边界时核对实际下游定义、inline/file 分发与编译后的宿主调用；纯 schema 变更不证明资源生命周期或画面正确。稳定合同变化需遵守 [alpha 规则](api-contract.md)。

## 证据限制

这是全部**显式声明**的词法类型盘点，不是完整类型推断或污点分析：不会证明一个 Struct 参数间接携带的 JsObject 是否流入渲染逻辑，不验证 JS 内部对象内容，也不盘点外部依赖模块。缺少 schema 的定义、间接引用类型、原始 ABI 与业务语义之间的转换仍需人工审查和实际消费者测试。不能把“稳定直接声明无命中”写成“整个框架无 Dynamic/JsObject”。
