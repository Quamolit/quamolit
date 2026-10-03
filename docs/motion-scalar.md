# Motion IR：标量、二维向量与关键帧切片

这是 issue #48 的局部实现，不是完整 Motion IR，也不改变现有 `quamolit.core` 绘制 API。目标是先固定一个可类型检查、可序列化、可在任意时间直接采样的 CPU 参考路径；之后颜色、有界组合及 GPU lowering 必须沿用相同的时间和身份语义。

`quamolit.motion` 定义 `ScalarDescriptor { id, version, motion }`。`motion` 是封闭枚举：常量、`scale * time + offset`、`ScalarTween { start, duration, from, to, easing }`，以及关键帧轨道；easing 目前只有 linear 和 smoothstep。所有时间以秒为单位，结果为标量 `Number`。`sample-scalar descriptor time` 是纯函数，不读取上一帧，也不维护播放状态；调用方可以按 `1, 0, 0.5, 0.25, 1` 的顺序采样。`duration=0` 在 `start` 时刻切换；正时长区间在两端钳制。输入/输出中的 NaN 与无穷值会拒绝，持续时间不能为负。描述可以作为数据传递，里面没有 JS 闭包或 GPU handle。

所有带 ID/version 的 Motion 描述（标量、Vec2、颜色、两输入组合和 CPU 自定义标量）现在统一要求非空 ID、有限非负整数版本。独立 CPU 采样与 GPU 候选分类使用同一边界；不能让 `1.5` 或空 ID 先被采样接受、到 Scene 绑定时才失败。版本代表描述内容的修订，内容变化必须递增版本；不能在同一 ID/version 下悄悄替换内容。对于接受原始 `Number` 的结构体，这些约束由入口的运行时校验执行，静态类型仍保证它是数值而非字符串。

小数时间端点（[#213](https://github.com/Quamolit/quamolit/issues/213)）：`start=0.3,duration=0.25,from=0,to=1` 在 `time=0.55` 精确返回 `1`，不因除法舍入返回 `1.0000000000000002`。起点前返回 `from`，正时长终点及之后返回 `to`；中间进度限制到 `[0,1]`，linear/smoothstep 的结果限制到端点包络，升降方向一致，不改变零时长在起点切换的规则。既有 `test:motion` 覆盖原生与编译 JS 的小数起点、乱序邻域、升降、缓动和零时长；`test:motion-browser` 将公共返回值直接用于严格 Scene 组透明度，验证初始/中间/终点 Canvas 像素，不依赖应用侧 clamp。Scene 的合法性检查与既有像素阈值不变；本修复不等于 GPU 浮点合同或已发布 alpha.3 已含此修复，下游绕过须在新 tag 消费复测后移除。

早期 `old-fade` 命名的矩形位置夹具把 `from=10,to=20,start=0,duration=1` 的 `ScalarTween` 映射为画面 x，并非旧 fade 组件的透明度迁移。真正对照旧 `comp-fade-in-out` 的 [迁移夹具](fade-migration.md)现使用 v=4 对应的 0.25 秒 opacity tween、显式 Model 和 Scene 绑定。本仓库的 [基础浏览器夹具](../test/motion.html) 使用 Calcit 编译出的 `sample-at` 在 Canvas 上展示位置中间帧；Canvas 只负责夹具绘制，不是新渲染后端。`docs/architectures/motion-scalar.cirru` 保留可重复校验的 Calcit 架构 scaffold，真正定义存于 `calcit.cirru`，后者由 Calcit CLI 修改而非文本生成。

二维切片新增 `Vec2 { x, y }`、`Vec2Tween`、`Vec2Motion`、`Vec2Descriptor` 与 `sample-vec2`。两轴共用一个按标量规则采样的进度，因而起止、缓动和 `duration=0` 语义一致；坐标必须有限，端点是带类型的 `Vec2`，不能误传标量。它目前只处理常量和 tween，不宣称支持变换矩阵或颜色。架构 scaffold 见 `docs/architectures/motion-vec2.cirru`。

颜色切片新增 `ColorRgba { r, g, b, a }`、`ColorTween`、`ColorMotion`、`ColorDescriptor` 与 `sample-color`。输入是 `[0,1]` 内的直通道 sRGB 与 alpha；RGB 解码到线性 sRGB 插值后重新编码，alpha 独立线性插值。恰在两端返回原始颜色，透明端点的隐藏 RGB 仍可继续参与渐变。无效通道、版本、时间或时长报错。`test/color.html` 用 Canvas 合成到白底并读取像素，验证的是 CPU 数值与浏览器适配，不代表 Canvas2D 或 WebGPU 渲染后端已经完成。架构 scaffold 见 `docs/architectures/motion-color.cirru`。

有界组合切片新增 `ScalarComposeOp`（加、乘、带 `[0,1]` 右侧权重的 mix）、`ScalarComposition` 与 `sample-scalar-composition`。一个组合恰好有两个 `ScalarDescriptor` 叶子，结构上不可嵌套组合，避免在可序列化 IR 中引入任意深度或任意闭包；数值目前均视为无单位标量。两叶在同一绝对时间独立采样，结果必须有限。它是 CPU 正确性参考，不表示三个算子都能直接降低为 WGSL。`test/composition.html` 用旧 fade tween 加绝对时间项展示可乱序重放的位移；架构 scaffold 见 `docs/architectures/motion-composition.cirru`。

关键帧使用 `ScalarKeyframe { at, value, easing }` 和 `ScalarTrack { frames, loop }`，是 `ScalarMotion :keyframes` 分支。`sample-track` 是纯 CPU 参考：列表非空、时间非降序、时间和值有限；段 easing 取左帧。重复时间在该点取最后一帧。clamp 边界外取首尾值；repeat 使用半开区间 `[begin,end)`，在 end 回到 begin；mirror 在 end 折返，到 `begin + 2 * duration` 回到 begin。负时间使用相同周期映射。零跨度的 clamp 在时间点前取首值、到点后取末值；repeat/mirror 则始终映射到该点，取末值。CPU 每次扫描校验 O(n)，不是性能承诺。实际 GPU 支持与回退以 [Motion GPU 合同](motion-gpu-contract.md) 为准，不把 CPU 支持等同 GPU 执行。

CPU 自定义标量切片新增 `CpuScalarDescriptor { id, version, callback-id, gpu-status }` 和运行时 `CpuScalarRegistry`。描述符只含可序列化数据；回调函数只存于不可序列化的注册表，通过唯一 `callback-id` 解析。`register-cpu-scalar` 返回新注册表，拒绝空 ID 与重复 ID；`sample-cpu-scalar descriptor time registry` 可乱序、倒退或重复采样，拒绝缺失回调、非法版本/时间、非有限输出。`gpu-status` 当前只能为 `:unsupported reason`，原因不能为空；它是明确的 CPU-only 诊断，不会自动转换为 WGSL。调用方负责确保回调无副作用，并把所有影响结果的外部输入显式纳入自己的版本/失效规则；框架无法证明任意闭包纯净，也不会缓存其未知捕获。当前已有[受限 GPU 降低契约](motion-gpu-contract.md)，但依赖声明、输出类型扩展和真实 WGSL 执行仍待后续实现。架构 scaffold 见 `docs/architectures/motion-cpu-registry.cirru`，浏览器夹具见 [CPU 采样页面](../test/custom.html)。

新[泛型 CPU Motion 扩展边界](cpu-motion-extension.md)进一步提供显式输入 `I`、输出 `O` 与校验函数、六类依赖版本及 Vec2 夹具。旧标量注册表仍保持兼容；新入口也不自动生成 WGSL。

运行 `yarn test:motion`、`yarn test:cpu-motion`，再运行 `yarn test:motion-browser`。后者需安装锁定的 Chromium；CI 使用 Node 24。浏览器测试检查二维位置、关键帧轨迹、颜色渐变、两输入组合和 CPU 自定义标量的乱序、倒退、重复采样及页面重载，失败时非零退出。手工检查可打开 `/test/motion.html?time=0.5`、[关键帧页面](../test/keyframes.html)、[颜色页面](../test/color.html)、[组合页面](../test/composition.html)、[CPU 标量页面](../test/custom.html)与[CPU Vec2 页面](../test/cpu-motion.html)；即使时间倒退也不依赖累积状态。

本页只规定 Motion 的参考语义。组件绑定、打断与固定步长模拟已有独立实现，见 [M1 阶段验收](plan-v3.md#m1-阶段验收与展示)；#48 已关闭，不再将这些功能列为未实现。完整 GPU 算子、一般嵌套绘制与宿主资源仍按 M2/M3 支持矩阵验收；任意 Calcit 闭包不能自动转 WGSL，CPU 数值通过也不证明生产性能。
