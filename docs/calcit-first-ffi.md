# Calcit 优先的浏览器 FFI 边界

Quamolit 的目标是增强 Calcit 动画生态：声明式组件与显式时间产生 Scene/Motion IR，动画与场景编排优先由 Calcit 实现。`js-ffi` 同时要保持作为 **Calcit 面向 JS 生态的通用基础 API 封装**；它可以在包内使用 JavaScript 实现浏览器原生调用。不能把“Calcit 优先”误解为“js-ffi 不能有 JS”。

## 归属规则

判断顺序是 **API 语义 → 是否有状态 → Calcit 类型/ABI 能否表达**，不以 JS 行数决定。Calcit 0.22 起提供的定义级 JS 嵌入（`:ffi :js :inline` / `:file`）是同步、无状态、原始类型小适配器的首选载体，用于避免新增独立 JS 文件。

| 内容 | 归属 | 验收依据 |
| --- | --- | --- |
| 通用 JS 生态基础 API：DOM/Canvas2D/WebGPU/TypedArray 原生对象、方法、能力探测 | `js-ffi` 的 Calcit 公共命名空间；实现可以是包内原生 JS，或包内模块定义的 `:ffi :js :inline/:file` | Calcit 调用方可直接导入类型化接口；契约不依赖 Quamolit Scene/Motion IR |
| Quamolit 专属的 Scene/Motion 遍历、动画采样、变更分类、执行计划、资源/批次策略和后端选择 | Quamolit 的 `calcit.cirru` | 相同输入与绝对时间可在 Calcit 测试复现；下游只引用 Quamolit Calcit 模块 |
| Quamolit 专属、同步、无状态、参数与返回可由原始 ABI（`Number`/`String`/`Bool`/`Unit`/`JsObject`/`JsNullish`）表达的宿主原语 | Quamolit `calcit.cirru` 定义内的 `:ffi :js :inline` 或 `:file` | `Fn` schema 精确、显式 `:target`、带 `:js-ffi`；附 Node 或浏览器宿主测试 |
| Quamolit 专属、经复现确认当前 Calcit/inline/file ABI 无法合理表达的宿主边界 | 局部适配暂留 `src/host/*.mjs`，通过 Calcit 类型化入口调用 | 记录具体限制、上游 issue（存在缺口时）、替代方案与撤销条件；状态/批量/shader 不自动构成例外 |
| 测试页面、浏览器夹具、测试用宿主桥接、构建入口 | `test/`（测试宿主桥接放 `test/host/`）、根目录 `main.mjs` 和 `vite.config.mjs` | 不对下游暴露为框架 API |

归属依据首先是 API 语义，再检查实际消费者：若一个 JS 文件当前只有 Quamolit 使用，且实现的是自定义绘制循环、shader、动画或图层策略，而非浏览器原生 API 封装，则迁回 Quamolit；不能仅凭“未来可能复用”留在上游。通用原生 buffer、资源生命周期仍由 `js-ffi` 的 Calcit 类型化接口提供。若逐图元跨边界调用太贵，Quamolit 可在 `src/host/` 保留有明确计数与测试的批量宿主循环。比较记录帧时间、复制字节、调用次数、画面语义与设备。

## 定义级 JS 嵌入：`:ffi :js :inline` 与 `:file`

Calcit 0.22 起，定义级 `:ffi :js` 可以嵌入一个 JS 函数表达式：`(x) => ...`（`:inline`）或模块根目录下含单个表达式的 `.js`/`.mjs` 文件（`:file`）。构建时表达式被嵌入所属 Calcit namespace 的生成文件，调用方只按普通 Calcit `:require` 使用，不单独引用 JS 文件或安装片段专用 npm 包。Calcit 侧要求：

| 约束 | 说明 |
| --- | --- |
| schema | 完整 `Fn` schema 并声明 `:features $ #{} :js-ffi`；schema 是作者承诺的外部边界，编译器不解析 JS 来验证返回值 |
| target | 必须显式 `:target :browser` 或 `:node`；`node:` 内置模块只能用于 node target |
| ABI | 仅接受 `Bool`/`Number`/`String`/`Unit`/`JsObject`/`JsNullish<T>`；暂不支持 Trait、Struct、Enum、泛型、rest、async |
| file | 必须是模块根内以 `.js`/`.mjs` 结尾的单表达式文件，禁止 `import`/`export`/`require`/动态 `import()`，禁止绝对路径、`..` 与 symlink 越界 |
| modules | 仅 `node:` 内置或裸包名，相对路径拒绝；不同定义即使引用同一文件也各自求值一次，**不共享状态** |

```cirru.no-check
:ffi $ {} (:backend :js) (:target :browser)
  :js $ {} $ :inline "|(k) => String.fromCharCode(k)"
:schema $ :: 'Fn $ {}
  :return 'String
  :args $ [] 'Number
  :features $ #{} :js-ffi
```

选择顺序：Calcit 业务逻辑 → js-ffi 类型化原生能力 → 必要宿主操作的 `:ffi :js :inline/:file`。短表达式用 inline，较长单函数表达式用 file；file 不等于 import 整个 ESM。状态、资源释放、批量或 WGSL 文本本身不排除表达式实现，必须实际检查 ABI、async 与共享实例。不能为内嵌重复共享状态，也不能把业务解释器整体塞入片段代替 Calcit 实现。

截至 2026-09-26，[Calcit #1359](https://github.com/calcit-lang/calcit/issues/1359)、[#1360](https://github.com/calcit-lang/calcit/issues/1360)、[#1361](https://github.com/calcit-lang/calcit/issues/1361)、[#1363](https://github.com/calcit-lang/calcit/issues/1363) 均已关闭，属于 0.22 已交付功能参考，不是等待 ABI 扩展的开放问题。遇到当前版本限制先查重，向 Calcit 提交版本、最小复现、期望与实际、影响及建议契约；用局部适配继续推进，并关联回归测试与撤销条件。升级后复测，不假定问题自动消失。#104 验证干净消费者安装、片段分发与输出搬移；JS-only 修改需要显式重编译。

## 当前债务与迁移顺序

`js-ffi` 的 0.1.45 曾加入 Canvas Scene 的 JS 命令解释器；Quamolit 没有运行代码使用旧命令格式。已发布 0.1.x tag 不改写，0.2.0-alpha 系列删除旧接口并记录迁移说明。Canvas 原生方法及单矩形组合仍留在 js-ffi Calcit API；Quamolit 的 Scene 遍历位于 `quamolit.canvas-reference`，其现有能力仍不是完整组/裁剪后端。Quamolit 专属 Canvas/WebGPU 矩形批次的 Calcit 指标、颜色、位移和宿主 Trait 也由本仓库定义；不再引用上游的旧批次命名空间。[上游 #112](https://github.com/calcit-lang/js-ffi/issues/112) 与 [Quamolit #35](https://github.com/Quamolit/quamolit/issues/35) 跟踪边界及后续验收。

本轮已核对实际消费：`typed-arrays.mjs` 的 Float32Array 快照与 `webgpu-capabilities.mjs` 的 adapter/device 探测仍封装平台能力，保留上游；`canvas-rect-batches.mjs` 的批次循环与 `webgpu-rect-batch-create.js` 的矩形 shader、Vec2 tween 和图层资源当前只有 Quamolit 的实际消费者，保留在本仓库 `src/host/`，由 `quamolit.instance-ffi` / `quamolit.webgpu-batches` Calcit 入口调用。旧 `canvas-scene-commands.mjs` 没有 Quamolit 运行消费者，不把它复制成死代码；上游 0.2.0-alpha.1 移除实验接口。原 `gpu-vec2-translation.mjs` 的 Motion 参数解释已迁至 Calcit。

本仓库当前使用 Calcit `0.28.0`、匹配 runtime 与 js-ffi `0.2.1-alpha.11`，可直接使用定义级 JS 嵌入（`:ffi :js :inline/:file`）、类型化图片绘制与 Canvas 当前路径 `.fill!`；原有单用途 inline fill 适配已移除。版本合同与门禁见[工具链升级](calcit-027-upgrade.md)。诊断计数只在同一源码 revision 上比较，不把旧版本统计称为当前验收。新路径立即收紧，legacy 应用命名空间挂到 [#36](https://github.com/Quamolit/quamolit/issues/36) 的迁移期限；不得通过全局 `:allow` 或宽泛 `Dynamic` 掩盖新代码的类型错误。

WebGPU texture 基础 API 缺口已上报 [js-ffi #151](https://github.com/calcit-lang/js-ffi/issues/151)。`quamolit.webgpu-texture-runner` 当前只用两个同步无状态 inline 原语构造 `createTexture` descriptor 和调用 `copyExternalImageToTexture`；identity、队列、registry、device/resource generation、安装和释放均为 Calcit。js-ffi 发布类型化 `TextureHost`/上传 API 后删除这两个 raw inline，公共 runner 合同保持不变。

本仓库 `src/host/` 目前仍混有生产宿主与待迁逻辑，并非最终归属：

- 生产宿主：`canvas-rect-batches.mjs` 已改为定义级 `:ffi :js :file` 内嵌（`quamolit.instance-ffi/raw-draw-canvas!` 与 `quamolit.canvas-reference/raw-draw-instances!`），宿主文件是单函数表达式；`instance-resource-table.mjs` 也由 `quamolit.instance-resource/raw-create-table!` 内嵌。`webgpu-rect-batch-create.js` 现在由 `quamolit.webgpu-batches/raw-create!` 内嵌，独立消费者不再复制 `src/host`。Calcit 0.27.0 下原始边界仍使用 `JsObject` 承接 Promise 与宿主句柄，公共 `create!` 中显式 `js-await` 并收窄为 `RectBatchHost`；若后续 ABI 扩展 async/nominal FFI 参数，应复测并移除转换。
- 测试夹具桥接：`webgpu-capabilities.mjs`、`instance-sources.mjs`、`canvas-instance-batches.mjs`、`webgpu-instance-batches.mjs`、`webgpu-layer-lease.mjs` 已迁到 `test/host/`，仅供 `test/` 引用并反向读取 `target/js/motion/`。
- 历史执行缓存夹具：`retained-scene-plan.mjs` 仅由测试调用，已迁入 `test/host/`；它反向读取 motion 测试产物，不是下游运行时。失效分类与采样校验仍由 Calcit `quamolit.retained-scene` 提供，参考算法见 [保留式 Scene 计划](retained-scene-plan.md)。正式生产宿主不得导入测试、演示或本地编译路径，既有 `check:api-inventory` 对 `src/host` 递归进行保守源码检查并带负例；它不解析 JS 依赖图，实际编译后依赖闭包仍由 `test:consumer` 验证。`demand-frame-scheduler.mjs` 已移入 `demos/`，只作为 demo 的宿主帧/计时句柄工具，不是公共 Calcit 消费者必须额外导入的文件。`presence-resources.mjs` 同样仅在 `test/host/` 中作为参考适配器。

模块交付以 Calcit API 为边界，inline/file 片段随模块源码分发并由编译器内嵌；不向调用者转嫁手工复制 JS、安装片段专用包或导入测试产物的步骤。生产、demo 和框架测试定义集中在根 `calcit.cirru`；`examples/retained-consumer/calcit.cirru` 是有意保留的独立下游，`docs/architectures/*.cirru` 只是设计示例，不是额外运行入口。主 Snapshot 内的 demo/测试优先改用完整的命名 entry（mode/target/init/reload/modules/用途集中配置），但 entry 本身不是发布隔离机制；独立消费者用于验证可达产物不含测试 namespace/夹具路径，而非仅核对 entry 名称。0.28.0 稳定版已复测，CLI 仍只能修改已有 entry，创建缺口已上报 [Calcit #1665](https://github.com/calcit-lang/calcit/issues/1665)。当前暂用已验证的 `--init-fn/--reload-fn` 覆盖，不新增 wrapper Snapshot、不手改主 Snapshot；上游发布创建能力后，按查询→事务预演→revision 应用迁移既有命令，再跑原编译/消费者门禁，届时才声明 named entry 迁移完成。

逐项审查实例源与画布批次：通用 typed array、WebGPU device/buffer/pipeline 及可复用批量调用归 `js-ffi`，Quamolit 的资源版本和图层策略归本仓库。新代码优先用 `:ffi :js :inline/:file`；每迁移一项删除对应的重复业务 JS，而不是保留 Calcit 空壳转发层；同一测试继续检验乱序时间、资源版本、DPR、失败与释放。

## PR 退出检查

`quamolit.webgpu-images` 的 Scene 支持判定、完整图层后端选择、全资源预检、矩阵合成、源裁剪归一化与绘制顺序位于 Calcit。`raw-create!` 的 `:file` 嵌入 `src/host/webgpu-image-layer-create.js` 单函数表达式，宿主只接收 texture 和 24 个数字（20 个几何参数与 4 个窗口边界），不解释 Scene/Motion；shader、WebGPU 命令编码与可变 bind group 缓存仍是宿主工作。用户只导入 Calcit 模块，不另行复制 renderer JS。

1. 新增接口先说明是否可跨项目复用、公共 Calcit 类型、必要的 JS 实现及所属仓库；评审是否让 Quamolit Scene/Motion 业务决策进入通用包，不用 JS 行数作为单独否决标准。
2. `js-ffi` 的公共入口由 Calcit 定义和类型化，通用 JS 实现可在其包内；Quamolit 下游示例只导入 Calcit 模块，不要求再单独导入上游 `.mjs`。本仓库 JS 只承载专属宿主桥接。
3. 使用 `:ffi :js :inline/:file` 时，核对完整 `Fn` schema、`:js-ffi` feature、显式 `:target`、原始 ABI 与单表达式约束；不满足时说明改用 `src/host/` 还是 `js-ffi` 类型化入口。
4. 新增 `src/host/*.mjs` 必须说明为何无法用 inline/file 或 Calcit 表达（状态、async、trait/Struct、shader）；测试夹具桥接放 `test/host/`，不占用生产目录。
5. 运行受影响命名空间的 `calcit analyze check-public`、原生测试、JS 编译、Node/Chromium 固定时间与像素回归；有 GPU 结论时必须实际用非软件 adapter 验证。
6. 记录迁移前后相同 fixture 的语义和性能数据；没有测量就只称为代码归属重构，不宣称加速。
7. 工具链或依赖版本变化须同步 `calcit.cirru`、`deps.cirru`、package/lockfile 与 CI，并在 PR 记录升级后的严格 FFI 诊断清单与未迁移项。
