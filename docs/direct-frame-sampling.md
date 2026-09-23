# 直接采样：M1 #31 的绝对时间切片

`quamolit.direct-frame` 提供带类型的 CPU 参考入口：`sample-at(request, evaluate)` 从完整输入直接计算一帧，`resample-at(previous, request, evaluate)` 仅在身份、时间和全部修订号一致时复用上一帧。它们不读取前一帧来推进动画，因此请求可按任意顺序、倒退或重复；与历史状态有关的算法仍使用 [固定步长模拟](fixed-step-simulation.md)。

`DirectRequest<D,M,I,R,V>` 显式携带 `id`、秒数 `time`、`FrameVersions` 和 Motion 描述、Model、输入、资源、视口快照。求值回调依次接收这五份快照与时间，返回泛型场景值；`DirectFrame<S>` 保存身份、时间、版本和结果。时间必须是有限实数，版本必须是有限非负整数，身份不能为空。`sample-at` 每次调用求值回调；`resample-at` 只是单帧 CPU 复用参考，不是 retained scene、增量执行计划或生产渲染器。

版本由调用方负责维护：组件求值逻辑、Motion、Model、输入、资源、视口的任一可观察变化，必须分别递增相应修订号。视口版本也应覆盖 DPR 和影响结果的画质配置；资源版本应覆盖 loading、ready、error、替换等状态。若回调偷偷读取未列入请求的全局状态或闭包变量，框架无法证明缓存安全；此时应把依赖显式加入请求并更新版本，或只用始终重算的 `sample-at`。相同版本但不同快照值属于调用方违反契约，不能指望 `resample-at` 自动比较任意对象。

手算例子：标量 Motion 从 10 到 20、时长 1 秒，Model=5、输入=0、资源未 ready、视口宽 100；求值结果为 `motion(t) + model + input + (ready ? 20 : 0) + viewport / 10`。因此 `t=[1,0,0.5,0.25,1]` 得到 `[30,20,25,22.5,30]`。在 `t=0.5` 不变时，资源 ready 且资源版本递增，结果从 25 变成 45；Model、输入和视口变更也各自让相同时间的旧帧失效。完整键不变时可复用旧结果，不能额外执行回调或推进模拟 tick。

运行 `yarn test:direct` 检查严格公共类型、Calcit 原生与编译后 JS 数值；运行 `yarn test:motion-browser` 在 Chromium 验证乱序、倒退、相同时间的资源/Model/输入/视口变化和中心像素。[浏览器夹具](../test/direct.html) 只用 Canvas 展示 CPU 结果，不表示 Canvas/WebGPU 后端已经接入。源结构由 [架构 scaffold](architectures/direct-frame-sampling.cirru) 维护，`calcit.cirru` 由 Calcit CLI 更新。

这仍是 #31 的部分实现：尚无 host wall time 到动画时间的暂停、速度与 seek 映射，也没有完整组件声明/Scene IR、资源管理、生命周期或 GPU lowering。不能因为该切片通过而关闭 #31。
