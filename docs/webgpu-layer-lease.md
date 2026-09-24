# WebGPU 图层租约：M2 #51 切片

`WebGpuLayerLease` 是 Quamolit 的后端宿主适配，不是通用浏览器 FFI；设备探测仍经 `quamolit.webgpu-capabilities` → js-ffi 0.1.44 的 Calcit 公共 API。它持有一个实例图层与一个设备能力结果，逻辑 Scene IR 只保存可重建的实例源 ID/version、颜色、尺寸和动画描述，不保存 GPU/DOM 句柄。

`open` 合并并发请求，软件 adapter 显式回退。`close` 递增代际并使在途探测/创建失效；迟到的 ready device 或 layer 立即释放，不能覆盖新代际。设备丢失关闭当前租约并通知页面重绘 Canvas，手动重试再从逻辑描述建立 pipeline、buffer 并上传当前源。释放顺序为图层再设备；图层释放抛错也继续释放设备，且 `metrics.live` 保留未确认释放的计数以暴露可能泄漏。`created/disposed/live` 统计已正式接管的图层，迟到但立即销毁的图层不记为 live。

三个 GPU 页面（10k 同源实例、Vec2 时间采样、Presence 退出）共用该协议。`test/webgpu-layer-lease-smoke.mjs` 用宿主替身验证 100 次装卸后 live 为 0、并发探测去重、探测/创建中关闭、设备丢失、软件回退、创建失败后重试、释放错误诊断。`yarn test:webgpu-instances` 包含这些测试；固定浏览器动画回归由 `yarn test:motion-browser` 运行。应用内浏览器 `apple/false` 路径另需实际点击禁用/重试与乱序时间按钮核对画面及 live 图层，不以 headless 软件 adapter 的 SKIP 代替。

这不是 #51 的完整资源表：texture/font/geometry 的统一 ID/version、容量回收、GPU 使用完成后的延迟释放与不可恢复来源仍未实现；不据此关闭 #51。
