# 宿主时间映射：M1 #31 的显式时钟切片

`quamolit.host-clock` 的 `HostClock` 是不可变的时间映射，不读取 `Date.now`、`performance.now` 或 rAF。宿主提供单调秒数 `host-time`，`sample-clock` 计算动画秒数。运行时映射为 `animation-anchor + (host-time - host-anchor) × speed`；暂停时始终取 `animation-anchor`。可用负速度倒放可直接采样的动画；历史模拟不能因此倒着积分。

`start-clock(host-time, animation-time, speed)` 建立未暂停时钟。`pause-clock`、`resume-clock`、`set-clock-speed` 均先在给定宿主时间采样，再重设锚点，因此暂停期间的宿主时间不会累计，变速不会造成位置跳跃。`seek-clock` 在给定宿主时间设定新的动画秒数，保留暂停状态与速度。暂停时的单步可用 `seek-clock` 显式前进一步；倒退 seek 也不隐式恢复模拟检查点。所有操作接收有限数值；查询或变更的宿主时间不能早于当前锚点，超出有限结果范围即报错。调用方在墙钟回拨或页面恢复时应选择单调时钟并重新锚定，不把系统日历时间直接当可靠动画时钟。

`simulation-tick-at(clock, host-time, dt)` 只将非负动画时间映射为目标 tick，不推进状态。它要求有限正 `dt` 和安全整数范围内的商；通常取 `floor(time / dt)`。为消除 `0.3 / 0.1` 等二进制浮点表示导致的边界少一 tick，距最近整数小于 `1e-9` tick 时吸附到该整数。这是明确的边界容差：极靠近边界但未到达的时间也可能提前吸附，应用不应把它用于精确事件定序。若目标 tick 小于当前 [固定步长模拟](fixed-step-simulation.md) 检查点，调用方必须显式恢复旧检查点或重置，然后以输入日志重放；`advance-simulation` 会拒绝隐式倒退，追帧预算仍由其 `max-steps` 控制。

手算场景：在宿主 10 秒以动画 0 秒、速度 1 开始，宿主 10.25 秒得到动画 0.25。宿主 10.5 秒暂停，宿主跳到 20 秒仍是动画 0.5；20 秒恢复，到 20.25 秒是 0.75；改为 2 倍速，到 20.35 秒为 0.95；改为 -1 倍速，到 20.6 秒约为 0.7；再 seek 到 0.2 秒，画面立即对应 0.2。按钮和固定 Canvas 中间帧见 [浏览器夹具](../test/host-clock.html)。

运行 `yarn test:host-clock` 检查严格公共类型、Calcit 原生及编译后 JS 数值；`yarn test:motion-browser` 在 Chromium 检查操作序列、位置像素和刷新重放。时钟仅负责映射，不能替代 Scene IR、应用事件日志、检查点保留策略或生产渲染器。本切片并不关闭 #31。
