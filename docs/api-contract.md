# M1 声明式组件与动画 API 契约

对应 [#30](https://github.com/Quamolit/quamolit/issues/30)，以 [路线 v2](roadmap.md) 为上位约定。本文件规定用户可观察的语义和迁移边界；Motion/Scene IR 的具体类型与实现分别交给 #48/#32，任意时间采样和固定步长模拟由 #31 落实。没有标为“已实现”的名称，均不得在下游当作可调用 API。

## 能力状态与边界

| 能力 | 状态 | 当前证据或后续负责项 |
| --- | --- | --- |
| `initial-frame` / `evaluate-at` 和泛型 `EvaluatedFrame<M,S>` | 已实现；顺序帧求值 | [显式帧求值](frame-evaluation.md)、`yarn test:clock`、`yarn compile:visual` |
| `tick-tree` / `paint-tree-only-with` | 已实现；旧树迁移桥梁 | [确定性帧测试](../test/README.md) |
| `defcomp` / `on-tick` / `fade` 缓存 | 兼容旧组件写法；不承诺新架构语义 | 旧入口未恢复，不应据 bootstrap 编译推断可用 |
| `quamolit.direct-frame/sample-at`、`resample-at` | 已实现的实验性泛型 CPU 直接采样切片；非组件公共入口 | [直接采样](direct-frame-sampling.md)；显式请求与依赖版本；#31 尚未完成 |
| `quamolit.component-sample/sample-component-at`、`resample-component-at` 及宿主时间变体 | 已实现的实验性声明式组件 CPU 入口；非生产执行计划 | [组件直接采样](component-sample.md)；纯组件声明返回 Scene 与 Motion 描述，固定时间浏览器夹具通过；#31 尚未完成 |
| 组件公共 `sample-at(motion, time, parameters)` | 拟议；尚未实现 | #31；Motion 描述由 #48 定义 |
| `quamolit.motion/sample-scalar`、`sample-vec2`、`sample-track`、`sample-color`、`sample-scalar-composition` | 已实现的实验性内部 CPU 参考切片；非公共组件入口 | [Motion 数值与浏览器验证](motion-scalar.md)、#48 的局部进展 |
| `CpuScalarDescriptor`、`CpuScalarRegistry`、`register-cpu-scalar`、`sample-cpu-scalar` | 已实现的实验性 CPU-only 标量扩展切片；非组件公共入口 | 描述符仅保存回调 ID，注册表不参与序列化，GPU 明确为 `unsupported`；[Motion 数值与浏览器验证](motion-scalar.md) |
| `quamolit.motion-cpu/CpuFunctionRequest<I>`、`CpuFunctionRegistry<I,O>`、`sample-function`、`resample-function` | 已实现的实验性泛型 CPU-only 扩展切片；非组件公共入口 | 显式输入/输出校验和六类依赖版本；Vec2 浏览器夹具通过，回调本身不序列化；[泛型 CPU 扩展](cpu-motion-extension.md) |
| `step-simulation(state, tick, inputs)` | 拟议独立入口；固定步长历史模拟 | #31；不与 `sample-at` 混用 |
| `quamolit.fixed-step/start-simulation`、`step-simulation`、`advance-simulation` | 已实现的实验性泛型 CPU 状态推进切片；显式 tick/输入日志/追帧预算 | [固定步长模拟](fixed-step-simulation.md)；时间映射由独立时钟提供，尚无组件公共入口 |
| `quamolit.replay-archive/start-archive`、`record-input`、`sample-archive-at`、`reset-archive` | 已实现的实验性 CPU 输入日志与有界检查点策略；非持久化宿主存储 | [固定 tick 回放档案](replay-archive.md)；完整日志保留、旧 tick 重放受预算限制，不是生产调度器 |
| `quamolit.playback/sample-archive-at-host` | 已实现的实验性宿主时间到回放档案桥梁 | 暂停/seek 映射到固定 tick 后从保留检查点重放；不隐式反向积分；[回放档案](replay-archive.md) |
| `quamolit.host-clock/start-clock`、`sample-clock`、暂停/变速/seek 与 `simulation-tick-at` | 已实现的实验性纯函数时间映射切片；非宿主循环 | [宿主时间映射](host-clock.md)；调用方提供单调宿主秒数，模拟倒退仍需检查点 |
| `quamolit.scene-ir/SceneDocument`、`SceneNode`、`validate-scene` | 已实现的实验性可序列化核心切片；非生产绘制入口 | [Scene IR 核心](scene-ir-core.md)；group/rect/实例源、校验和 JSON 夹具；参考变更集见下行 |
| `InstanceSourceRegistry`（JS 宿主适配器） | 已实现的版本化坐标快照边界；非资源表或 GPU 上传器 | [实例数据源边界](instance-sources.md)；js-ffi 0.1.38 保留通用 Float32 快照 |
| `CanvasInstanceBatches`（JS 薄适配器） | 已实现的 Canvas 实例批次正确性路径；非 GPU/自动合批 | [Canvas 实例批次](canvas-instance-batches.md)；js-ffi 0.1.38 提供通用一次调用的矩形批次，指标区分 FFI 与 `fillRect` |
| `WebGpuInstanceBatches`（JS 薄适配器） | 已实现的 10k 矩形实例 GPU 切片；非完整 Scene 后端 | [WebGPU 实例切片](webgpu-instances.md)；通过 `quamolit.webgpu-batches` 消费 js-ffi 0.1.42 Calcit API，一次 instanced draw 并支持 [Vec2 时间平移](gpu-vec2-motion.md)，强制无 GPU/软件 adapter 时整层 Canvas 回退 |
| `quamolit.scene-diff/index-scene`、`diff-scene`、`SceneDelta` | 已实现的逻辑身份与 O(n²) 参考差分；非生产调度器 | [Scene diff](scene-diff.md)；重排保身份、重挂载、分类和时间独立标记；#50 执行计划未完成 |
| `quamolit.scene-binding/resolve-scene` | 已实现的绝对时间 CPU 标量绑定参考解析；非增量执行入口 | [Scene 绑定解析](scene-binding.md)；精确 ID/version、输出再校验、浏览器中间帧；#50 执行计划未完成 |
| `quamolit.transition/start-transition`、`interrupt-transition`、`sample-replay` | 已实现的位置连续打断与固定事件重放 CPU 切片；非完整生命周期 | [打断过渡](transition-interruption.md)；25%/50%/75% 打断及浏览器帧；Scene enter/exit 参考见下行 |
| `quamolit.presence/start-presence`、`reconcile-presence`、`sample-presence`、`settle-presence` | 已实现的 Scene 逻辑实例生命周期参考；非宿主资源管理器 | [进入退出](presence-lifecycle.md)；重排、fade、重入、一次性逻辑释放通知；#34/#51 宿主清理未完成 |
| `PresenceInstanceResources`（JS 宿主适配器） | 已实现的 instances Float32 快照所有权；非通用资源表 | [Presence 宿主资源跟踪](presence-resources.md)；退出期间保留、终点最后引用释放、100 次装卸计数回基线；GPU/指针捕获未覆盖 |
| 完整 Scene IR / 完整 Motion IR / 执行计划 | 拟议、尚未实现 | #32/#48/#50；现有切片不持有 DOM/GPU 句柄 |
| 完整 WebGPU/Canvas2D 双后端、资源表、命中索引 | 仅矩形实例切片可运行；完整能力尚未实现 | #40/#33/#51/#34 |

`evaluate-at` 不是新的 `quamolit.direct-frame/sample-at`：前者从上一帧按非倒退时间更新模型，相同时间直接复用旧场景；它既不能任意乱序求值，也不会在相同时间但资源/模型改变时自动刷新。新的 Calcit CPU 切片可以直接乱序求值，并通过显式版本使相同时间的依赖变更失效，但还不是组件公共入口。应用不得用“先把历史跑一遍”的隐藏全局状态伪装成直接采样。

## 输入、输出与所有权

声明式组件的拟议形状是纯函数 `component(props, model, resources) -> declaration`。`props` 是父组件显式传入的不可变配置；`model` 是应用拥有的逻辑状态，含目标、起点、过渡参数、模拟 tick/seed 和需要重放的输入；`resources` 是只读的逻辑资源快照，按 ID/version 暴露 `loading|ready|error`。组件不读取墙上时间、Canvas 上下文、GPU 句柄或宿主全局 atom，也不在求值时启动加载。用户事件进入应用 update，先得到新 Model，再请求场景更新。

普通时间动画由 `sample-at` 读取 Motion 描述、显式参数和绝对时间，返回带类型的值。相同三元输入必得相同输出；求值不写 Model。历史相关算法只进入 `step-simulation`：调用方提供固定 `dt`、单调整数 tick、该 tick 的输入与 seed，推进后保存状态/检查点。两个入口可在一帧的不同绑定上并存，但不能把模拟的上次状态藏进直接采样描述。宿主时钟到动画时间的暂停、速度、seek 变换由显式 clock 层完成。

资源加载完成、出错或替换会递增该 ID 的版本并请求新帧；不能只因 `time` 相同而复用旧结果。输入、应用 Model、viewport、DPR、画质、Motion/Scene 描述版本变化也各有可观察的失效信号。缓存键至少覆盖被缓存输出实际读取的依赖；未知 CPU 闭包捕获不得被框架猜成纯缓存依赖。绘制是消费既定场景的操作，不推进逻辑状态、不建事件区域、不隐式触发加载。

例如 `t=0.5` 时字形资源从 `loading@1` 变为 `ready@2`，新画面必须出现字形；`time` 没变化不是跳过更新的理由。反例：同样的完整输入连续请求两次，允许复用场景和宿主资源，但不得多推进一次模拟 tick。

## 数值、空间与颜色语义

- 时间统一为秒。拟议 `sample-at` 接受任意有限实数时间，包括动画开始之前的负时间；标准区间动画在起点前取起点值、终点后取终点值，`duration=0` 作为在 `start` 处瞬时切换。NaN/Infinity、负 duration 和非法关键帧在构造或求值时明确报错，不能悄悄变成零。`step-simulation` 的 tick 是非负整数，倒退必须显式恢复检查点或重置，不在一次调用中隐式逆算。
- 逻辑空间以 CSS px 为单位，原点左上，x 向右、y 向下。viewport 给出逻辑宽高，DPR 决定实际像素尺寸。变换先按声明的父到子矩阵组合；具体矩阵布局由 #32 固定，API 不暴露后端 buffer 布局。Canvas 坐标系中正角度视觉上顺时针；公共角度单位为弧度。例：`π/2` 旋转四分之一圈，传入 90 不会自动当成角度制。
- 颜色输入以带 alpha 的 sRGB 值表达；标准颜色渐变默认在线性 sRGB 中插值，再编码到目标输出色域。透明度统一为 `[0,1]`；非法值报错，不用静默截断掩盖数据错误。合成使用预乘 alpha 的 `source-over`，但 Model 和公共颜色值保持直通道 RGBA，预乘发生在执行边界。例：透明红到透明蓝的中点不能直接把两个预乘零值当成可见紫色；透明端点的隐藏 RGB 仍由描述保留。Canvas2D 与 WebGPU 的颜色/抗锯齿差异按 fixture 容差验证，不承诺逐位相同。
- 子节点声明顺序即默认绘制顺序，后面的节点画在前面；透明节点不能为合批任意重排。组 opacity 对整个子场景隔离后合成一次，不能对子节点逐一相乘冒充；嵌套裁剪取交集。例：组内两个重叠半透明形状，在组 opacity=0.5 时，重叠处不应因为各自又叠加一次而变深。组隔离和复杂裁剪由 #53 完整实现；本条是目标语义，不声称当前 Canvas 参考已经支持。
- 命中测试与绘制分离，以最终可见层序的逆序选择最高的可交互目标，并受变换和裁剪限制。opacity=0 本身不自动取消命中，交互开关需显式声明；退出动画期间是否可交互由生命周期策略显式决定。捕获后的指针事件先交给捕获目标，卸载时释放捕获。此处是 #34 的合同，当前旧绘制时收集事件区域并不满足它。

## 身份、生命周期与扩展

兄弟节点的显式 key 在同一父级作用域内唯一；逻辑身份由父级身份、key 和组件/节点类型共同确定。重排不改变身份；同一父级的重复 key 报可诊断错误；换父级或换类型视为旧节点退出、新节点进入。无 key 的静态单子节点可由实现给局部身份，但可重排列表必须提供稳定 key，不能用当前数组下标代替数据身份。逻辑 key 不等于 GPU buffer slot；后者可以压缩和重用，不改变用户可见生命周期。

过渡 Model 保存 `from/to/start/duration/easing` 等意图。目标在 `t=0.5` 打断时，先按旧意图取 `t=0.5` 的当前值，作为新过渡 `from`，以保证位置连续；[CPU 参考切片](transition-interruption.md)已实现并由浏览器验证。速度连续是另一个需明确声明的模式，不能混称。删除节点进入 `exit`，保留其展示数据直到退出结束再释放资源；同 key 重入、父级卸载与重复退出只执行一次的细则仍由 #49 落实。现有 fade 缓存的 `0.01` 残留 opacity 不应成为新生命周期合同。

标准 Motion 描述是可检查、可序列化的数据，后端可识别其中明确的 GPU 子集。任意 Calcit 纯函数只能经注册的 CPU 扩展点求值，并显式声明输入依赖、输出类型与失败行为；它不能自动转成 WGSL，也不能塞入需要序列化的 Scene IR。普通组件无需了解 GPU；大量同类数据可用一个 `instances` 逻辑图层表达，数据源通过版本化引用或显式脏范围更新。

## 迁移对照与可编译入口

| 旧写法 | 当前可执行桥梁 | 拟议新位置 |
| --- | --- | --- |
| `defcomp` 生成带 `on-tick` 的 Shape | 保留纯视图；用 `initial-frame` / `evaluate-at` 把模型更新移出绘制 | `component(props, model, resources)` 返回声明，#32 降为 Scene IR |
| `on-tick(elapsed, dispatch!)` 积分 | `evaluate-at` 的 `update-model(model, FrameSample)` 仅按给定顺序推进 | 无历史动画转 `sample-at`；有历史状态转固定步长 `step-simulation` |
| fade 内部 opacity/stage 缓存 | [可编译迁移夹具](fade-migration.md)：Model 保存过渡意图与阶段，Motion 描述绑定 Scene opacity；不依赖画笔调用次数 | #49 的 enter/present/exit 与宿主释放继续分离验收 |
| 在绘制时登记事件区域/资源 | 兼容旧入口仅用于迁移 | Scene IR 事件目标、资源 ID/version，独立命中/资源表 |

下面是**已实现且由仓库入口编译**的最小迁移例子，不是拟议 `sample-at` 的示例。`quamolit.test.frame-fixture/update-progress`、`scene` 和 `main!` 位于 `calcit.cirru`；`yarn compile:visual` 编译该入口，`yarn test:clock` 验证泛型求值及重放，`yarn test:visual` 在 Chromium 检查矩形中间帧：

```cirru
defn update-progress (model sample)
  + model $ :elapsed sample

defn scene (progress)
  rect $ {} (:w 48) (:h 48) (:y 80) (:fill-style |#ec4899)
    :x $ + 48 $ * 160 progress

let
    start $ initial-frame 0 0 scene
    half $ evaluate-at start 0.5 update-progress scene
  :scene half
```

这里用 `let` 展示调用关系；可编译源入口以 `calcit.cirru` 内的函数 schema、namespace import、`reset-fixture!` 和 `step-fixture!` 为准，详见 [显式帧求值](frame-evaluation.md)。上述 `half` 的模型为 `0.5`、矩形中心 `x=128`；在 `t=0.5` 但资源版本变化时，必须显式重建 `initial-frame`，当前 `evaluate-at` 不会自动失效。新的 [直接采样切片](direct-frame-sampling.md) 已支持 `t=[1,0,0.5,0.25,1]` 和同时间版本失效；#48 的完整 Motion IR 和 #49 的 fade 生命周期仍另行按各自 issue 验收。

## 设计选择与不选方案

保留应用 Model 中的动画意图，才能直接采样、截图、重放和跨后端共享；把状态藏在渲染器 hook/Canvas 对象内会破坏这些性质。选择小型显式 Motion IR + CPU 函数扩展，而不是引入 React/Use.GPU Live 运行时作为必要依赖：既保留 Calcit 组件函数，也让 WebGPU 只处理可降低的标准子集。Use.GPU 的数据驱动图层与增量执行思路可在 M2 评估，完整 Live 整合需要单独的 API/性能/迁移证据。Canvas2D 是基础语义参考，WebGPU 在 M2 建立主路径；本契约不以旧版 renderer 的偶然行为锁定两者。
