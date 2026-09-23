# 泛型 CPU Motion 扩展边界

`quamolit.motion-cpu` 是 #48 的 CPU-only 扩展切片，不是任意函数自动转 WGSL 的承诺。它把 `CpuFunctionDescriptor { id, version, callback-id, gpu-status }` 和实际回调分开：描述符只含可序列化身份，`CpuFunctionRegistry<I,O>` 持有运行时的 `Fn(I, Number) -> O`，不能写入 Scene IR、持久化或传给 GPU。当前 `gpu-status` 仅允许 `:unsupported reason`，原因必须非空。

`CpuFunctionRequest<I>` 包含描述符、绝对秒数、完整 `FrameVersions` 和显式输入。`sample-function(request, registry, valid-output)` 返回 `CpuFunctionFrame<O>`；泛型把输入 `I`、结果 `O` 与输出校验函数 `(O) -> Bool` 绑定。框架校验非空身份、有限非负整数版本、有限时间、六类依赖版本、`versions.motion == descriptor.version`、回调存在和输出校验结果。回调的语义纯度无法由类型系统证明；调用方不得读取未在输入/版本中表达的可变外部状态。

`resample-function(previous, request, registry, valid-output)` 只有在描述符 ID/version、回调 ID、绝对时间和完整六类版本都相同时才复用 `previous`。同一 ID/version 对应的回调实现和输入必须保持不变；更换任一者需递增相应版本。框架不比较任意泛型输入，也无法发现闭包中的未知捕获；违反这一约定会得到过期帧。资源 ready、Model 和 viewport 的同时间变化由不同版本号驱动。此处是正确性参考缓存键，不是跨组件的增量执行计划。

`quamolit.test.cpu-motion-fixture` 定义 `CustomInput` 和 `Vec2` 输出的可编译示例，测试 `t=[1,0,0.5,0.25,1]`、同时间版本失效和显式 GPU 回退。`yarn test:cpu-motion` 执行严格类型检查、原生测试、独立 JS 编译与 JS 数值断言；`yarn test:motion-browser` 在 Chromium 的 [CPU Vec2 页面](../test/cpu-motion.html)核对画面中心、实色像素和回退原因。Canvas 仅是测试绘制，不代表新渲染后端或 GPU 性能。

当前旧 `CpuScalarDescriptor`/`CpuScalarRegistry` API 仍为兼容切片，尚未迁移到此泛型接口。这个边界不解决任意输出的序列化、复杂 CPU 回调执行预算、跨线程传输或 WGSL 降低；这些必须有单独的类型、测量和浏览器证据。
