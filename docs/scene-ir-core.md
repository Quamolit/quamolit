# Scene IR 核心：M1 #32 的可序列化切片

`quamolit.scene-ir` 定义不含 Canvas、DOM、GPU 句柄或可执行闭包的带类型场景数据。`SceneDocument` 按预序保存扁平 `SceneNode` 列表；每个节点有全局唯一的逻辑 `id`、父节点 `parent`、同级稳定 `key`、封闭的 `SceneContent`、标量 Motion 引用和逻辑事件目标。空父 ID 表示顶层；非顶层父节点必须在列表中先出现且为 group。列表顺序保留默认绘制顺序，不能为了合批改排透明节点。

当前内容变体为 group、实色矩形和实例图层。Group 声明 CSS px 的仿射矩阵、无裁剪或矩形裁剪，以及 `[0,1]` 的组 opacity；该 opacity 的真正隔离合成属于后端语义，**本切片没有实现隔离绘制**。矩形保存有限坐标与非负尺寸、直通道 sRGB 颜色。实例图层用 `InstanceSource { id, version, count }` 引用外部数据：即使 `count=10000`，IR 中仍只有一个节点；源数据、脏范围和宿主 buffer 的生命周期不进入 IR。Motion 绑定仅保存目标、描述 ID 和版本，当前只允许 group opacity 或矩形 x/y/width/height；不接受同一节点的重复目标，也不把 Calcit 回调塞入描述。

`validate-scene` 在绘制之前拒绝非法数值、颜色、尺寸、资源版本或实例数量、空事件目标、重复节点 ID、同一父级重复 key、缺失/非 group 父节点和不按预序排列的子节点。当前校验是 O(n²) 的正确性参考，不是后续保留执行计划或每帧全量树 diff 的要求。节点的物理 GPU/Canvas 存储槽未定义；后续变更集应以父身份、key 与节点类型判断复用，跨父或换类型视为卸载与新增。当前尚未实现这套变更集，不能仅凭本切片关闭 #32。

编译后的 [场景夹具](../test/scene-core.html) 在 `t=[1,0,0.5,0.25,1]` 逐次构造并校验相同结构的 Scene IR，再把 Calcit 值转成普通 JSON 数据供测试适配器绘制矩形。Canvas 只是像素验证工具；实例源没有加载，故适配器不绘制 10k 实例。`yarn test:scene-core` 验证严格公共类型、Calcit 原生反例以及编译后 JS 的 JSON 往返；`yarn test:motion-browser` 验证 Chromium 中间帧、像素和刷新重放。架构 scaffold 见 [scene-ir-core.cirru](architectures/scene-ir-core.cirru)，Snapshot `calcit.cirru` 由 Calcit CLI 维护。

仍待 #32：同 key 重排/换父/换类型的变更集、结构与几何/资源/属性/仅时间变化分类、完整资源/图元/序列化边界和绑定解析。执行计划与增量调度属于 #50；完整裁剪、透明组和绘制由后续后端 issue 验收。
