# Canvas 实例批次边界：M2 #35 的可计数切片

Quamolit 的 `CanvasInstanceBatches` 是薄适配：从 `InstanceSourceRegistry` 解析不可变 `(id,version,count)` 快照，在某个版本首次绘制时经 `quamolit.instance-ffi/copy-range` 复制一次交错 x/y 数据，之后按 token 缓存该私有副本；每次绘制经 Calcit `quamolit.instance-ffi/draw-canvas!` 调用本仓库 `src/host/canvas-rect-batches.mjs`。旧版本释放后即使有缓存也无法继续绘制；新版本获得不同 token 并重新复制。

10k 矩形的本地测试可观察指标：首次完整绘制执行一次 js-ffi 范围复制和一次本地宿主批次绘制，读取与复制各 80,000 字节；相同版本后续完整绘制仅一次批次调用、零额外复制；只绘制一个脏实例时读取 8 字节、仍一次批次调用。**Canvas2D 仍调用 10,000 次 `fillRect`**，所以这些计数只证明跨宿主边界不随标量字段增长，不是自动 GPU 合批、零上传或 60 FPS 证据。

批次参数检查、顺序绘制及 `save/restore` 现在由 Quamolit 本地宿主实现维护；js-ffi 保留 Canvas 原生方法的 Calcit 类型化入口。Quamolit 把 Scene 的颜色、尺寸、alpha 和资源引用转换为该批次调用。Canvas 测试页面是正确性参考，不能代替 #33 的完整 Scene 后端，也不能代替 #40 的 WebGPU 主路径。WebGPU 能力探测已有[诊断夹具](webgpu-capability-probe.md)，但 buffer 上传、设备丢失后的资源重建与真正回退仍属于 #35/#51/#40 后续切片。

验证：`yarn test:canvas-batches` 断言冷/热/单实例脏范围调用与字节数、版本替换和非法数据；`yarn test:motion-browser` 检查 10k 实例版本切换及 Presence 退出中间帧的 Chromium 像素和计数。页面采用确定性可见网格，上下条带实际绘制 9,999 个实例，中间保留一个版本锚点，既检查格点颜色也检查白色间隔。js-ffi 的 Node/Chromium 测试继续验证原生 Canvas 类型化 API，专属批次测试由本仓库负责。
