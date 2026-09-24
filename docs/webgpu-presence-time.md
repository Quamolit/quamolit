# Presence 时间帧的 WebGPU 实例路径

`test/presence-resources.html` 用固定事件日志独立重放 0、0.25、0.5、0.75、0.875、1 秒；每次采样创建独立的 `InstanceSourceRegistry` 和 `PresenceInstanceResources`，因此终点 `live=0、released=1、active=false` 不受此前点击顺序影响。Canvas 是每帧的正确性参考。可用非软件 WebGPU adapter 时，另建一个上限为单个 10k 实例源的归档输入缓存和一个 WebGPU 图层；它不是 Presence 的实时所有权表。终点执行 `clear()` 绘制空帧，但保留已上传的不可变位置源，乱序 seek 回旧时间无需再复制或上传。禁用/设备丢失会释放图层与 device，重试从归档输入重新创建并上传。

同一实例描述符、尺寸、颜色和 `PresenceSample.alpha` 输入两条后端。320×100 实际像素、DPR=1 下检查锚点 `(40,50)`、重复覆盖区 `(0,0)`、白色间隔 `(2,0)`。不透明帧和空帧四通道精确一致；半透明帧的锚点 RGB 每通道容差 1、重叠区容差 2，alpha 精确一致。这些阈值在硬件验证前固定；不忽略整幅图。诊断 `readPixel` 会创建临时读回资源，不计入稳态绘制指标。

本机应用内浏览器 `adapter=apple/false` 实测：0.5 秒锚点两后端均为 `234,88,12,255`；0.875 秒 Canvas 为 `244,171,133,255`，GPU 为 `245,171,133,255`；1 秒均为白色。1→0.5→0.875 秒乱序回放均 `upload=0、copied=0、pipeline=1、buffers=2`。手动禁用后 Canvas 继续通过；重试 GPU 位置上传和 CPU 拷贝各 80,000 字节。截图中两个 10k 网格画面可见一致。这是指定设备的正确性观察，不是 FPS/吞吐结论。

`yarn test:motion-browser` 检查 Canvas 生命周期与模拟能力失败/丢失；`yarn test:webgpu-instances` 新增 WebGPU Presence 专项。无头 Chromium 无硬件 adapter 时专项显式 SKIP，仍检查 Canvas 可运行；SKIP 不是 GPU 通过。未知或已知软件 adapter 不能作为硬件性能证据。本切片不覆盖自然设备丢失时的自动恢复、通用资源表、跨层合成、resize/DPR 与完整应用入口。若真实 GPU 绘制或像素不匹配，页面标记失败并回退 Canvas，不以 Canvas PASS 代替 GPU 通过。
