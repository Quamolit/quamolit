# WebGPU 探测与 Canvas 时间帧夹具：M2 #35 切片

Quamolit 依赖 js-ffi `0.1.44` 的 `js-ffi.webgpu-capabilities/probe-device!` Calcit 公共 API。`quamolit.webgpu-capabilities/probe!` 是 Calcit 薄转发；仅由测试夹具引用的 `test/host/webgpu-capabilities.mjs` 只把类型化结果转换成既有浏览器夹具使用的宿主形状，不重新实现浏览器/WebGPU FFI。上游原始 `.mjs` 仅为该 Calcit 模块的包内实现，Quamolit 不直接引用。结果区分 `ready`、`unavailable`、`failed`；ready 持有 adapter/device、格式、状态、loss Promise 与幂等 `release()`，失败结果保留阶段和消息。`test/presence-resources.html` 在固定事件日志与 10k 可见实例的退出动画前运行一次探测，并明确显示宿主不可用、adapter 不可用、失败阶段或 ready。该页面即使探测 ready，也立即释放 device，继续显示 Canvas2D 正确性参考帧；不能把它的 `ready` 解读为 WebGPU 画面通过。

页面查询参数 `gpu=native|denied|ready|lost`。后三种为测试专用宿主双重：adapter 请求失败、成功后显式释放、设备丢失通知后释放。每种模式都能在 0.875 秒显示半透明退出中间帧，在 1 秒结算后不再绘制并释放实例快照；浏览器测试检查状态、释放次数及时间帧。`native` 使用实际 `navigator`，在真实设备上只证明默认 adapter/device 可请求与释放；它不报告硬件性能，也不说明 GPU 是否为软件 adapter。

验证：`yarn test:webgpu-instances` 严格检查 Calcit 公共定义并运行 Node 宿主替身，覆盖不可用、失败、ready/loss/release；`yarn test:motion-browser` 覆盖四种模式和原有 Presence 时间点；`yarn compile`、`yarn release` 覆盖普通入口。上游 [js-ffi 0.1.44](https://github.com/calcit-lang/js-ffi/releases/tag/0.1.44) 的 Node/Chromium 测试覆盖能力状态及异常设备清理。设备丢失后重建资源与真正回退仍归 #51/#40；这里的能力探测不是实际 GPU 绘制或性能证据。
