# 时间入口：直接采样与固定步长推进的边界

M1 #31 的 `quamolit.playback` 把已验证的宿主时钟、直接帧和固定步长模拟接在同一显式时间轴上，但保留两个独立调用。`sample-at-host` / `resample-at-host` 只把宿主时间映射为动画时间，再按完整请求求值或复用帧；它们不调用模拟更新。`advance-to-host` 才把映射时间转成目标 tick，并在输入日志和追帧预算内推进一个传入的检查点。渲染器不得在 paint 中隐式调用后者。

请求仍需携带 Motion、Model、输入、资源和视口快照，以及组件、Motion、Model、输入、资源、视口六类修订号。请求中的 `time` 在这个适配入口仅作占位，由宿主时钟映射值覆盖；直接调用 `quamolit.direct-frame/sample-at` 时仍以请求自身时间为准。时钟变化导致时间不同会重新求值；暂停后时间相同但资源从未就绪变为 ready，也必须增加资源版本，`resample-at-host` 才不会复用旧画面。调用方不能在版本不变时悄悄更换快照。

模拟的输入日志以 tick 为键。`advance-to-host` 只接受不早于检查点的目标 tick；seek 到过去时，调用方应显式传入旧检查点或重置后重放，而不能反向积分。暂停时相同 tick 返回原检查点；追帧预算不足或缺失输入会失败，不会静默跳过 tick。[CPU 回放档案](replay-archive.md)现定义完整输入日志、有界最近检查点及旧 tick 重放策略；`sample-archive-at-host` 将宿主暂停/seek 映射到档案中的目标 tick 后重放。它不管理 GPU 设备丢失后的模拟资源。

运行 `yarn test:playback` 检查严格类型、原生手算、JS 重放与相同时间失效；`yarn test:replay-archive` 检查有界检查点、完整输入日志和宿主暂停/seek。`yarn test:motion-browser` 将 playback 编译到独立的 `target/js/playback/`，并打开[时间入口页面](../test/playback.html)与[回放档案页面](../test/replay-archive.html)，检查暂停、资源 ready、seek、重置及倒退的 Canvas 位置与像素。这些是 CPU 参考，不是生产 retained scheduler；绘制操作本身不保存或推进模拟状态。独立产物目录避免多个 Calcit 入口按不同可达性覆盖彼此的 JS 导出。[声明式组件直接采样入口](component-sample.md)已接入 CPU 参考路径；长期输入持久化与生产执行计划由 #50/#51 后续完成。
