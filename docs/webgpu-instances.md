# WebGPU 矩形实例同源路径：M2 #40 切片

`test/instance-sources.html` 从同一份编译后的 Scene IR 取一个 10k `:instances` 逻辑节点、同一 `(id,version,count)` 位置源与同一颜色/尺寸，分别交给 Canvas 参考路径和 `WebGpuInstanceBatches`。后者只负责从 `InstanceSourceRegistry` 解析不可变 token、缓存 CPU 私有副本、在源版本变化时上传；矩形专属 pipeline、shader、instanced draw 和诊断读回现在由 Quamolit `src/host/webgpu-rect-batches.mjs` 维护；原生 WebGPU 对象与能力探测仍由 js-ffi 提供 Calcit 类型化基础 API。Quamolit 的 `quamolit.webgpu-batches` 与 `quamolit.instance-ffi` Calcit 命名空间引用本地专属宿主实现；框架下游不需直接导入 `.mjs`。Scene IR 不保存 DOM/GPU 句柄。

当前实测切片为 320×100 实际像素、DPR=1、`t=0.5` 的橙色矩形网格。切换源版本时上传 80,000 字节位置数据、一个逻辑实例图层绘制 10,000 个实例、一次 GPU draw；重复同版本绘制时位置上传和 CPU 再复制均为 0，pipeline/常驻 buffer 数保持 1/2。Canvas 参考仍执行 10,000 次 `fillRect`。页面同时读取两后端的锚点、非活动锚点、网格和白色间隔四个像素；GPU 读回是每帧临时诊断资源，不属于稳态性能路径。

能力策略：无 GPU 或 `adapter.info.isFallbackAdapter=true`（软件 adapter）时整个实例图层走 Canvas，不逐实例混合后端。按钮可主动禁用 GPU 并释放图层/device，再重新探测、创建 pipeline/buffer 和上传当前源；`device.lost` 通知也触发 Canvas 回退。未覆盖真实设备意外丢失后的自动恢复、应用入口统一调度和通用资源表。浏览器测试 `gpu=off` 强制无 GPU；`test:webgpu-instances` 用 Chromium WebGPU 标志尝试真实 GPU，软件 adapter 明确 SKIP，不得记为 GPU 通过。

本机应用内浏览器观察到 `adapter=apple/false`，两张 10k 画布可见一致，GPU 四个采样像素与 Canvas 精确一致；重复帧上传 0，禁用后 Canvas 继续绘制，重试重新建立 GPU 图层。该观察证明这台浏览器上的矩形实例画面正确，不是 60 FPS、跨设备或正式吞吐证据。本机 headless Chromium 启用 WebGPU 后只提供 `google/true` 软件 adapter，其读回曾返回透明零值或 `mapAsync` 设备失效；因此默认选择 Canvas，并保留诊断记录。是否有底层驱动/SwiftShader 问题尚未判定，不能把软件失败说成硬件通过。

未覆盖 #40 的圆/图片、基础 transform/clip、跨层混合顺序、resize/DPR、完整资源恢复、Use.GPU 对比及 #39 性能报告。当前普通 `yarn compile`/`yarn release` 仍是 bootstrap 入口；本页面是可运行的真实 GPU 实例切片，不是完整生产渲染器。WebGPU 的 standard Motion shader 采样另归 #52。

同一矩形图层已接入固定 Presence 时间帧；生命周期、乱序 seek 和退出 alpha 的双后端检验见 [Presence WebGPU 时间帧](webgpu-presence-time.md)。

历史上 js-ffi 0.1.41 为矩形批次加入绝对时间平移 uniform，0.1.42 将批次操作公开为 Calcit FFI，并加入诊断数值读回；0.1.43 进一步公开 Float32 快照与 Canvas 批次的 Calcit API；0.1.44 公开类型化 WebGPU 能力探测。0.2.0-alpha.1 将矩形 renderer 移回 Quamolit，保留上游原生能力和暂时兼容的 Calcit 批次类型。Quamolit 的标准 Vec2 Motion 映射与 10k 双后端验证见 [Vec2 GPU 时间采样](gpu-vec2-motion.md)。三个 GPU 测试页面现在通过 `quamolit.webgpu-capabilities` 的编译产物调用探测，不再直接导入上游底层 `.mjs`。#35 的整个新主路径与 FFI 盘点仍须另行审查，不能仅凭此切片关闭。
