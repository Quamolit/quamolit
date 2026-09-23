# Scene 标量绑定解析：M1 #32 的 CPU 参考实现

`quamolit.scene-binding/resolve-scene(document, descriptors, time)` 将 `SceneNode.bindings` 中的 Motion ID/version 与 `ScalarDescriptor` 精确配对，在给定有限绝对时间采样，返回一个新的 `SceneDocument`。输入和输出都经过 `validate-scene`，输出保留原绑定元数据，可继续序列化、比较和重新采样。不同版本的描述可以同时存在，但同一 ID/version 对不得重复；空 ID、非整数/非有限版本、缺失或版本不符的引用会报错。

当前目标只允许 group opacity 和 rect x/y/width/height。采样后的 opacity 必须仍在 `[0,1]`，尺寸不得为负；越界会由 Scene 校验拒绝，而不是悄悄裁剪。实例源、事件目标和资源版本原样保留；不把闭包、DOM 或 GPU 句柄引入 IR。描述的数值语义由 [Motion 标量参考实现](motion-scalar.md)定义。Scene 的连续预序子树约束及绘制/命中顺序见 [Scene IR 核心](scene-ir-core.md)。

这是逐节点/逐绑定查找的 CPU **正确性参考**，会产生新文档；不代表生产路径必须每帧重建 Scene、遍历所有绑定或上传所有几何。#50 的保留执行计划需用稳定逻辑身份记录绑定依赖，只重新采样受时间/模型版本影响的字段，并证明静态几何与资源复用。

`yarn test:scene-binding` 检查严格类型、乱序时间、与独立直接采样的手算点、绑定保留、非法描述/输出及 JS JSON 边界。`yarn test:motion-browser` 实际用绑定解析结果绘制 Canvas，并在同一时间与独立参考 Scene 的内容和像素比较。架构约束见 [scene-binding.cirru](architectures/scene-binding.cirru)。当前不包含 GPU lowering、批量绑定表或资源 ready/error 解析；这些属于后续工作项。
