# WebGPU 探测与 Canvas 时间帧夹具：M2 #35 切片

Quamolit 依赖 js-ffi `0.1.39` 的通用 `probeWebGpuDevice`，不在本仓库重新实现浏览器/WebGPU FFI。`test/presence-resources.html` 在固定事件日志与 10k 可见实例的退出动画前运行一次探测，并明确显示宿主不可用、adapter 不可用、失败阶段或 ready。当前尚无 WebGPU 渲染器：即使探测 ready，也立即释放该 device，继续显示 Canvas2D 正确性参考帧。不能把这个页面的 `ready` 解读为 WebGPU 画面通过。

页面查询参数 `gpu=native|denied|ready|lost`。后三种为测试专用宿主双重：adapter 请求失败、成功后显式释放、设备丢失通知后释放。每种模式都能在 0.875 秒显示半透明退出中间帧，在 1 秒结算后不再绘制并释放实例快照；浏览器测试检查状态、释放次数及时间帧。`native` 使用实际 `navigator`，在真实设备上只证明默认 adapter/device 可请求与释放；它不报告硬件性能，也不说明 GPU 是否为软件 adapter。

验证：`yarn test:motion-browser` 覆盖四种模式和原有 Presence 时间点；`yarn compile`、`yarn release` 覆盖普通入口。上游 [js-ffi 0.1.39](https://github.com/calcit-lang/js-ffi/releases/tag/0.1.39) 的 Node/Chromium 测试覆盖能力状态及异常设备清理。设备丢失后重建资源与真正回退仍归 #51/#40，真实 GPU 绘制证据仍缺失。
