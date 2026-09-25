# Calcit 优先的浏览器 FFI 边界

Quamolit 的目标是增强 Calcit 动画生态：声明式组件与显式时间产生 Scene/Motion IR，动画与场景编排优先由 Calcit 实现。`js-ffi` 同时要保持作为 **Calcit 面向 JS 生态的通用基础 API 封装**；它可以在包内使用 JavaScript 实现浏览器原生调用。不能把“Calcit 优先”误解为“js-ffi 不能有 JS”。

## 归属规则

| 内容 | 归属 | 验收依据 |
| --- | --- | --- |
| 通用 JS 生态基础 API：DOM/Canvas2D/WebGPU/TypedArray 原生对象、方法和能力探测 | `js-ffi` 的 Calcit 公共命名空间；必要的原生宿主 JS 可在上游包内 | Calcit 调用方可直接导入类型化接口；契约不依赖 Quamolit Scene/Motion IR |
| Quamolit 专属的 Scene/Motion 遍历、动画采样、变更分类、执行计划、资源/批次策略和后端选择 | Quamolit 的 `calcit.cirru` | 相同输入与绝对时间可在 Calcit 测试复现；下游只引用 Quamolit Calcit 模块 |
| Quamolit 专属且暂时无法合理用 Calcit 实现的宿主桥接 | Quamolit 的 `src/host/` | 说明专属原因、所需原生对象及未来迁移条件；不复制上游已有通用 API |
| 测试页面、浏览器夹具、构建入口 | `test/`、根目录 `main.mjs` 和 `vite.config.mjs` | 不对下游暴露为框架 API |

归属依据首先是 API 语义，再检查实际消费者：若一个 JS 文件当前只有 Quamolit 使用，且实现的是自定义绘制循环、shader、动画或图层策略，而非浏览器原生 API 封装，则迁回 Quamolit；不能仅凭“未来可能复用”留在上游。通用原生 buffer、资源生命周期仍由 `js-ffi` 的 Calcit 类型化接口提供。若逐图元跨边界调用太贵，Quamolit 可在 `src/host/` 保留有明确计数与测试的批量宿主循环。比较记录帧时间、复制字节、调用次数、画面语义与设备。

本轮已核对实际消费：`typed-arrays.mjs` 的 Float32Array 快照与 `webgpu-capabilities.mjs` 的 adapter/device 探测仍封装平台能力，保留上游；`canvas-rect-batches.mjs` 的批次循环与 `webgpu-rect-batches.mjs` 的矩形 shader、Vec2 tween 和图层资源当前只有 Quamolit 的实际消费者，迁到本仓库 `src/host/`，由 `quamolit.instance-ffi` / `quamolit.webgpu-batches` Calcit 入口调用。旧 `canvas-scene-commands.mjs` 没有 Quamolit 运行消费者，不把它复制成死代码；上游 0.2.0-alpha.1 移除实验接口。`src/host/retained-scene-plan.mjs` 的绑定失效仍属于 Quamolit，尚需迁移。原 `gpu-vec2-translation.mjs` 的 Motion 参数解释已迁至 Calcit。

## 当前债务与迁移顺序

`js-ffi` 的 0.1.45 曾加入 Canvas Scene 的 JS 命令解释器；Quamolit 没有运行代码使用旧命令格式。已发布 0.1.x tag 不改写，0.2.0-alpha.1 删除旧接口并记录迁移说明。Canvas 原生方法及单矩形组合仍留在 js-ffi Calcit API；Quamolit 的 Scene 遍历位于 `quamolit.canvas-reference`，其现有能力仍不是完整组/裁剪后端。Quamolit 专属 Canvas/WebGPU 矩形批次的 Calcit 指标、颜色、位移和宿主 Trait 也由本仓库定义；不再引用上游的旧批次命名空间。[上游 #112](https://github.com/calcit-lang/js-ffi/issues/112) 与 [Quamolit #35](https://github.com/Quamolit/quamolit/issues/35) 跟踪边界及后续验收。

本仓库 `src/host/` 目前仍混有纯逻辑与宿主适配，并非最终归属。下一步优先把 `retained-scene-plan`、`demand-frame-scheduler`、`presence-resources` 中的 Quamolit 逻辑迁到 Calcit；逐项审查实例源与画布批次：通用 typed array、WebGPU device/buffer/pipeline 及可复用批量调用归 `js-ffi`，Quamolit 的资源版本和图层策略归本仓库。每迁移一项，删除对应的重复业务 JS，而不是保留 Calcit 空壳转发层；同一测试继续检验乱序时间、资源版本、DPR、失败与释放。

## PR 退出检查

1. 新增接口先说明是否可跨项目复用、公共 Calcit 类型、必要的 JS 实现及所属仓库；评审是否让 Quamolit Scene/Motion 业务决策进入通用包，不用 JS 行数作为单独否决标准。
2. `js-ffi` 的公共入口由 Calcit 定义和类型化，通用 JS 实现可在其包内；Quamolit 下游示例只导入 Calcit 模块，不要求再单独导入上游 `.mjs`。本仓库 JS 只承载专属宿主桥接。
3. 运行受影响命名空间的 `calcit analyze check-public`、原生测试、JS 编译、Node/Chromium 固定时间与像素回归；有 GPU 结论时必须实际用非软件 adapter 验证。
4. 记录迁移前后相同 fixture 的语义和性能数据；没有测量就只称为代码归属重构，不宣称加速。
