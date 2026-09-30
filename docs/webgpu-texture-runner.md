# WebGPU texture 资源 runner：M2 #51 第十切片

`quamolit.webgpu-texture-runner` 把可恢复图片描述、真实 `GPUTexture` 上传、共享 registry、有界加载队列与 device generation 接到同一条 Calcit 路径。逻辑 Scene/Model 只保存 `ResourceIdentity {kind:texture,id,version}`；URL、`ImageHost`、`GPUTexture` 和 Promise 都不进入 IR。

## 数据、任务与所有权

- `TextureResourceDescriptor` 保存 identity、URL、原始尺寸与 `rgba8unorm` 格式；当前固定为可采样、可上传、可读回、可作为外部图片上传目标的 usage 组合。
- `TextureResourceHandle` 把 resource generation 与 device generation 分开记录，同一资源在新 device 上重建时版本不变、宿主 generation 单调增加。
- `run-texture-load-task!` 经 js-ffi `ImageHost` 解码图片，再创建和上传真实 texture；尺寸、创建和上传失败都形成显式 failed outcome。
- `complete-texture-load!` 先结算 queue token。只有 accepted 结果可以进入 registry 并安装；discarded/unknown 的孤儿 texture 立即 destroy，不能复活旧 device 或旧资源。
- `rebuild-texture-device!` 取消旧 device 的 pending/running token，调用 `rebuild-registry` 释放旧句柄并仅为仍有 lease 的资源排入新任务；idle cache 不复活。
- metrics 分别记录 `created/released/live/live-bytes/uploaded-bytes`。逻辑释放不宣称物理显存已同步归零。

## 浏览器原生边界

Calcit 业务状态、队列、身份、generation、安装与释放均在本仓库实现。当前 js-ffi `0.2.1-alpha.10` 尚未类型化 `GPUTexture`、`createTexture` 与 `copyExternalImageToTexture`，因此两个同步无状态浏览器调用暂以定义级 `:ffi :js :inline` 接受原始 `JsObject`，公共入口立即收窄为 `DeviceHost`、`ImageHost` 与 `WebGpuTextureHost`，没有新增独立 JS 文件。

上游需求见 [calcit-lang/js-ffi#151](https://github.com/calcit-lang/js-ffi/issues/151)。js-ffi 发布对应类型化入口后，删除 `raw-create-texture!` / `raw-copy-image-to-texture!` 的本地 inline 元数据并改用上游 API；资源状态机不需要迁移。

## 验证与限制

`yarn test:webgpu-instances` 覆盖：

- Node 确定性宿主中的成功、解码失败、尺寸不符、上传异常和迟到 device 结果；
- 100 次 device rebuild 始终 `live=1`，关闭后 `created=released=101、live=0`，累计上传 1616 B；
- Chromium 真实 WebGPU API 把 2×2 红色 SVG 上传到两代 device 的 texture，分别复制读回 `[255,0,0,255]`，最终 `created=released=2、live=0`。

软件 adapter 可以证明浏览器 WebGPU API 与生命周期接线正确，但不是硬件性能或恢复时延证据。当前仍未把 texture 用于 Quamolit Scene 实际采样绘制，也未实现 queue completion 后的 fence-safe 延迟 destroy；font/glyph、geometry 与 pipeline loader 继续留在 #51。
