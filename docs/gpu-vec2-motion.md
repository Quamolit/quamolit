# Vec2 Motion 的真实 GPU 时间采样：M2 #52 切片

`quamolit.motion-gpu/lower-vec2` 产生的可序列化 `:supported GpuVec2Plan` 仍是逻辑描述。`gpu-vec2-translation.mjs` 只接受其中的 Vec2 tween（linear/smoothstep），验证 ID/version 与有界 f32 参数，映射成 js-ffi 0.1.41 的通用 `translation` uniform；非 Vec2、关键帧或 CPU 自定义计划显式返回 `unsupported`，不伪称 GPU 执行。Quamolit 不维护 WebGPU shader 或直接的通用 FFI 实现；上游实现见 [js-ffi PR #107](https://github.com/calcit-lang/js-ffi/pull/107) 与 tag `0.1.41`。

`test/gpu-vec2.html` 从同一份 Calcit Scene IR 获取 10k 实例源，从同一 Vec2 Motion 描述分别得到 CPU 参考采样和 GPU 参数。Canvas 逐实例 `fillRect`，WebGPU 在 vertex shader 使用绝对时间平移整个保留式位置 buffer。固定实际像素 400×220、DPR=1，t=0/0.25/0.5/0.75/1 的锚点和背景像素须与 CPU 精确一致；页面初始化及按钮乱序重放，禁用后整图层回退 Canvas，重试重建资源。

应用内浏览器 `adapter=apple/false` 已实测 1→0→0.25 秒及回到 0.5 秒的两张画布可见一致；锚点 `234,88,12,255`、背景白像素均通过。热帧 10k 位置上传与 CPU 再复制均为 0，`draw=1、uniform=64、pipeline=1、buffers=2`；禁用后 Canvas 继续正确，重试上传 80,000 字节。64 字节 uniform 每帧包含时间与固定 tween 参数，尚未优化为只写 4 字节时间。诊断像素读回会创建临时 staging buffer，不属于稳态绘制。

`yarn test:motion-gpu` 检查严格 Calcit 公共定义、计划序列化、CPU 数值与薄映射；`yarn test:motion-browser` 检查无 GPU 的同源 Canvas 帧；`yarn test:webgpu-instances` 增加硬件 GPU 专项。无头 Chromium 当前只有 `google/true` 软件 adapter，GPU 专项显式 SKIP，不算硬件通过。当前像素断言只覆盖整数锚点与白色背景，**尚不能证明** GPU f32 数值满足 `1e-5` 阈值、亚像素/混合边缘等价、随机 seed 样本、标准旋转/颜色/透明度/关键帧、吞吐或 FPS；这些仍留在 #52。真实设备意外丢失后的自动恢复与通用资源表留在 #51。
