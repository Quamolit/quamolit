# Scene diff：M1 #32 的逻辑身份与变更分类

`quamolit.scene-diff/index-scene` 先校验扁平预序 `SceneDocument`，再为每个节点建立逻辑路径。路径的每一段是同级 `key` 与封闭内容类型（group、rect、instances）；父 ID 只用于解析当次文档的父路径，最终身份不含临时节点 ID、Canvas/GPU 句柄或物理 buffer 槽。同 key 兄弟重排保留身份；换父或换类型形成旧路径的 `removed` 与新路径的 `added`。重复 key 仍由 Scene IR 校验拒绝。

`diff-scene(previous, current, previous-time, current-time)` 返回可序列化 `SceneDelta`：有序的 `removed`、`added`、`updated` 列表，以及独立 `time-changed` 位。保留节点的 `DirtyFlags` 区分引用 ID/父 ID、兄弟序号、几何、实例源 ID/版本/数量、视觉属性、Motion 绑定与事件目标。纯时间推进且文档不变时，`changes=[]`；调用方可在当前逻辑实例上直接重新采样 Motion。时间必须为有限数字。

这是 O(n²) 的**正确性参考**，不是每帧执行计划，也不能替代 #50 的保留式增量调度。兄弟序号变化会保守标记 `order`，即使只是前面插入一个节点；后端可利用相对顺序进一步缩小实际重排。透明内容的原始预序绘制次序必须保留。当前 `SceneChange` 只报告逻辑差异，不持有或销毁宿主资源；typed array 脏范围、实例源上传、绑定求值、局部 hit-test、Canvas/WebGPU 执行都尚未实现。

`yarn test:scene-diff` 覆盖严格类型、重排保身份、换父/类型重新挂载、添加/删除、几何/属性/资源版本/绑定/引用分类、非法时间和 JS JSON 边界。`yarn test:motion-browser` 在 Chromium 将不同时间的 Scene IR 绘成 Canvas 中间帧，同时校验对应 diff 的几何标记。架构约束见 [scene-diff.cirru](architectures/scene-diff.cirru)。
