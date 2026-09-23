# Motion GPU 降低契约（M1 切片）

`quamolit.motion-gpu` 是描述符到受限执行计划的纯数据转换，**不是 GPU 执行器**。输入仍由 `quamolit.motion` 的 CPU 参考采样器校验；计划保留 `id`、`version`，不包含宿主句柄、任意回调或上一帧状态。调用方必须检查 `:supported plan` / `:unsupported reason`，不可把后者当作可编译 WGSL。

当前标准标量子集为常量、`scale * time + offset`、`ScalarTween`（linear、smoothstep，含 `duration=0` 跳变），以及最多 16 个采样点的 `ScalarTrack`。轨道计划原样保留有序帧、重复时间和 clamp/repeat/mirror 模式；超过 16 帧返回 `keyframe-capacity-exceeded`。16 是本阶段的显式计划容量，不是 GPU 性能最优值；未来 #52 仍需决定缓冲布局、索引与数据上传策略。`lower-composition` 支持恰好两片可降低标量叶子的 add、multiply、mix；嵌套组合在原有 IR 结构上不可表示。

`lower-vec2` 支持 Vec2 常量与共享进度的 Vec2 tween，保留同一个 ID/version 与带类型的两个端点。`lower-cpu-scalar` 始终返回描述符里的 CPU-only 诊断，绝不转译注册回调。颜色、资源输入尚未进入此 GPU 子集，仍由 CPU 参考路径处理。计划中的 `:supported` 仅表示已落在受限数据子集内，不表示当前环境能用 WebGPU，也不表示已经执行了 WGSL。

无效版本、持续时间、数值和轨道属于输入错误，会抛错；合法但不受支持的表达式才返回 `:unsupported`。编译器不得静默改变语义。未来 #52 的 WGSL 实现需以此计划为输入，对相同绝对时间进行 CPU/GPU 数值比对，明确 f32 舍入；建议阈值 `abs(actual - expected) <= 1e-5 + 1e-5 * abs(expected)`，并单列精确端点、零持续时间、超范围及 overflow 的策略。此阈值目前是验收建议，**不是已经通过的 GPU 等价验证**。

运行 `yarn test:motion-gpu` 检查类型、16/17 帧容量边界、支持/回退分类、旧 fade 在 0/0.25/0.5/1 的 CPU 手算值、Vec2、固定组合与 JS 计划序列化。`yarn test:motion-browser` 使用与计划共用的描述符，在 Canvas 页面上检查关键帧和 Vec2 的乱序时间采样及像素；它不测试 WGSL 或 WebGPU 性能。后续接入 #52 时要增加真实 GPU 采样、读回及跨设备容差测试，不能把本切片当作 #48 整项验收完成。
