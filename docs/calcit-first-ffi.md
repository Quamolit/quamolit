# Calcit 优先的浏览器 FFI 边界

Quamolit 的目标是增强 Calcit 动画生态：声明式组件与显式时间产生 Scene/Motion IR，动画与场景编排优先由 Calcit 实现。`js-ffi` 同时要保持作为 **Calcit 面向 JS 生态的通用基础 API 封装**；它可以在包内使用 JavaScript 实现浏览器原生调用。不能把“Calcit 优先”误解为“js-ffi 不能有 JS”。

## 归属规则

| 内容 | 归属 | 验收依据 |
| --- | --- | --- |
| 通用 JS 生态基础 API：DOM/Canvas2D/WebGPU/TypedArray 对象与方法、可复用的批量提交、GPU 资源和能力探测 | `js-ffi` 的 Calcit 公共命名空间；必要的通用 JS 实现在同一个上游包内 | Calcit 调用方可直接导入类型化接口；契约不依赖 Quamolit Scene/Motion IR |
| Quamolit 专属的 Scene/Motion 遍历、动画采样、变更分类、执行计划、资源/批次策略和后端选择 | Quamolit 的 `calcit.cirru` | 相同输入与绝对时间可在 Calcit 测试复现；下游只引用 Quamolit Calcit 模块 |
| Quamolit 专属且暂时无法合理用 Calcit 实现的宿主桥接 | Quamolit 的 `src/host/` | 说明专属原因、所需原生对象及未来迁移条件；不复制上游已有通用 API |
| 测试页面、浏览器夹具、构建入口 | `test/`、根目录 `main.mjs` 和 `vite.config.mjs` | 不对下游暴露为框架 API |

归属依据是 API 的语义与复用边界，不是 JS 代码行数。通用 buffer 上传、资源生命周期或绘制批次可以在 `js-ffi` 由 JS 实现，同时用 Calcit 定义公共类型与调用入口；Quamolit 的 Scene IR 结构、动画模型和失效决策不因此进入上游。若逐图元跨边界调用太贵，先用 Calcit 编排 retained plan 与脏范围，再设计不依赖 Quamolit IR 的通用批量提交 API。比较记录帧时间、复制字节、调用次数、画面语义与设备。

现有接口初步归类：`js-ffi.typed-arrays`、`js-ffi.canvas-batches`、`js-ffi.webgpu-capabilities` 以及通用矩形批次/WebGPU 资源操作继续属于上游，即使内部使用 JS。`js-ffi.canvas-scene` 同时含 Canvas 原生操作和整场景命令格式，先按下节拆分审查，不预设整包迁走。`src/host/retained-scene-plan.mjs` 的绑定失效和 `src/host/gpu-vec2-translation.mjs` 的 Motion 解释明显属于 Quamolit；其中若调用通用 GPU/typed-array API，应复用上游而非复制实现。这是归属清单，不表示这些代码已经完成 Calcit 迁移。

## 当前债务与迁移顺序

`js-ffi` 的 0.1.45 曾加入 Canvas Scene 的 JS 命令解释器。问题不在于它使用 JS，而在于其命令格式与整场景解释是否承担了 Quamolit 专属语义；已发布 tag 不改写历史。[上游 #112](https://github.com/calcit-lang/js-ffi/issues/112) 跟踪拆分审查。[上游 #113](https://github.com/calcit-lang/js-ffi/pull/113) 已在 0.1.46 添加 Calcit 类型化的 `save/restore/fillRect/fillStyle` 与 Calcit `fill-solid-rect!`；Quamolit 改用该 tag，但不消费旧的整场景命令解释器。首个纯色矩形参考遍历位于 Quamolit 的 `quamolit.canvas-reference`。组语义、实例和批次性能仍未因此完成。[Quamolit #35](https://github.com/Quamolit/quamolit/issues/35) 跟踪后续能力与本仓库逻辑迁移。

本仓库 `src/host/` 目前仍混有纯逻辑与宿主适配，并非最终归属。优先把 `gpu-vec2-translation`、`retained-scene-plan`、`demand-frame-scheduler`、`presence-resources` 中的 Quamolit 逻辑迁到 Calcit；逐项审查实例源与画布批次：通用 typed array、WebGPU device/buffer/pipeline 及可复用批量调用归 `js-ffi`，Quamolit 的资源版本和图层策略归本仓库。每迁移一项，删除对应的重复业务 JS，而不是保留 Calcit 空壳转发层；同一测试继续检验乱序时间、资源版本、DPR、失败与释放。

## PR 退出检查

1. 新增接口先说明是否可跨项目复用、公共 Calcit 类型、必要的 JS 实现及所属仓库；评审是否让 Quamolit Scene/Motion 业务决策进入通用包，不用 JS 行数作为单独否决标准。
2. `js-ffi` 的公共入口由 Calcit 定义和类型化，通用 JS 实现可在其包内；Quamolit 下游示例只导入 Calcit 模块，不要求再单独导入上游 `.mjs`。本仓库 JS 只承载专属宿主桥接。
3. 运行受影响命名空间的 `calcit analyze check-public`、原生测试、JS 编译、Node/Chromium 固定时间与像素回归；有 GPU 结论时必须实际用非软件 adapter 验证。
4. 记录迁移前后相同 fixture 的语义和性能数据；没有测量就只称为代码归属重构，不宣称加速。
