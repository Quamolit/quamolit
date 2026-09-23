# 固定步长模拟：M1 #31 的状态推进切片

`quamolit.fixed-step` 与 `quamolit.motion` 的绝对时间直接采样是两个独立入口。前者用于确实依赖历史状态的算法；它不能倒着积分，也不应替代可直接写成 `f(time, parameters)` 的渐变或关键帧。

`SimulationState<S> { tick, dt, seed, state }` 是不可变、带类型的显式检查点。`start-simulation dt seed state` 在 tick 0 建立或重置状态，要求 `dt` 是有限正秒数、`seed` 是有限整数。恢复公开结构体构造的检查点时，`valid-simulation-state?` 验证非负整数 tick、有限正 dt 和有限整数 seed；两个推进入口都会拒绝无效检查点。`step-simulation previous next-tick input update-state` 只接受 `next-tick = previous.tick + 1`；回调收到旧状态、当前 tick 输入、固定 `dt` 和显式 seed，返回新状态。框架不读取墙上时间，不在绘制时推进状态，也无法替调用方证明回调纯净。

`advance-simulation previous target-tick input-log max-steps update-state` 从当前检查点推进到非负整数目标 tick；输入日志是按 tick 编号的 `Map<Number,I>`，每个待执行 tick 必须有一条输入。目标等于当前 tick 时直接返回原状态，可用于暂停后的重复绘制；小于当前 tick、缺失输入或超出显式追帧预算都会报错。预算是一次调用中允许的最多步数，不会悄悄丢弃待处理输入。调用方若要 seek 到过去，须选取不晚于目标的已保存检查点或重新调用 `start-simulation`，再用相同输入日志重放。

例如 `dt=0.25`、输入 tick 1–4 为 `2,4,-2,0`、更新规则为 `state + input * dt` 时，tick `0,1,2,3,4` 的手算结果分别为 `0,0.5,1.5,1,1`。一次从 0 推进到 4，与先在 1、2 建检查点再推进到 4，结果相同；显示请求顺序和 rAF 调度不进入模拟方程。[浏览器夹具](../test/simulation.html) 在固定 `t=0.5` 显示 tick 2 的画面，并检查从 1 秒倒回 0 秒后的重放及像素。Canvas 只是夹具绘制，不是新的生产后端。

运行 `yarn test:simulation` 和 `yarn test:motion-browser`。前者覆盖 Calcit 原生、严格公共类型检查和编译后 JS；后者在固定 Chromium 中验证画面。架构 scaffold 见 `docs/architectures/fixed-step-simulation.cirru`；源码 `calcit.cirru` 由 Calcit CLI 维护。

独立的 [宿主时间映射](host-clock.md) 现提供暂停、速度和 seek 的纯函数变换；它不自动推进固定步长模拟。[CPU 回放档案](replay-archive.md)定义完整输入日志与有界最近检查点的保留/淘汰及旧 tick 重放；尚未提供持久化、长期输入日志容量上限、随机数生成器或设备丢失处理。同时间依赖失效由 [直接采样切片](direct-frame-sampling.md) 的显式修订号覆盖；声明式组件的 CPU 参考入口见 [组件直接采样](component-sample.md)。这些切片不等于 #50 的生产保留执行计划或 GPU 模拟。
