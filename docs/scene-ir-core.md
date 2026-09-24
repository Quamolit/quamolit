# Scene IR 核心：M1 #32 的可序列化切片

`quamolit.scene-ir` 定义不含 Canvas、DOM、GPU 句柄或可执行闭包的带类型场景数据。`SceneDocument` 按预序保存扁平 `SceneNode` 列表；每个节点有全局唯一的逻辑 `id`、父节点 `parent`、同级稳定 `key`、封闭的 `SceneContent`、标量 Motion 引用和逻辑事件目标。空父 ID 表示顶层；非顶层父节点必须在列表中先出现且为 group。列表顺序保留默认绘制顺序，不能为了合批改排透明节点。

当前内容变体为 group、实色矩形和实例图层。Group 声明 CSS px 的仿射矩阵、无裁剪或矩形裁剪，以及 `[0,1]` 的组 opacity；该 opacity 的真正隔离合成属于后端语义，**本切片没有实现隔离绘制**。矩形保存有限坐标与非负尺寸、直通道 sRGB 颜色。实例图层用 `InstanceSource { id, version, count }` 引用外部数据：即使 `count=10000`，IR 中仍只有一个节点；源数据、脏范围和宿主 buffer 的生命周期不进入 IR。Motion 绑定仅保存目标、描述 ID 和版本，当前只允许 group opacity 或矩形 x/y/width/height；不接受同一节点的重复目标，也不把 Calcit 回调塞入描述。

`validate-scene` 在绘制之前拒绝非法数值、颜色、尺寸、资源版本或实例数量、空事件目标、重复节点 ID、同一父级重复 key、缺失/非 group 父节点，以及不按真正深度优先预序排列的子节点。子树必须连续：一旦走到兄弟节点，不可再回到已关闭的子树。当前校验是正确性参考；祖先链线性查找使极深树最坏可达 O(n³)，不是后续保留执行计划或每帧全量树 diff 的要求。节点的物理 GPU/Canvas 存储槽未定义。[Scene diff 参考实现](scene-diff.md)现已按父路径、key 与节点类型判断复用；跨父或换类型视为卸载与新增。

绘制按文档中的深度优先预序遍历：group 打开 transform、clip 与隔离 opacity 作用域，子节点按声明顺序绘制，不得为合批改变半透明层序。命中按相反的叶节点绘制顺序检查；先应用逆变换与祖先裁剪，再检查显式 `SceneInteraction :target` 的几何区域。group target 是其子树未命中时的后备目标，取子图元几何并集；完全透明不自动禁用命中，是否交互由 target 决定；奇异变换下无法逆映射的子树不命中。实例层内部绘制顺序为资源索引升序，命中相反；它依旧只占一个逻辑 Scene 节点。这里是后端应遵守的顺序契约，实际 hit-test 和隔离绘制仍待 #34 与后端验收。

序列化边界只包含标量、封闭 Enum/Struct、逻辑事件目标、Motion ID/version 和实例源 `{id, version, count}`；原始 typed array、回调和宿主句柄不入 Scene。外部实例数据按 `(id, version)` 定位，同一版本必须视为不可变；任何原地修改都必须递增版本或通过将来显式的脏范围协议通知，否则框架可合法复用旧上传。后端可在逻辑路径、图元类型和几何签名不变时复用几何，在资源 `(id, version)` 不变时复用上传；属性或时间变化只失效相应参数。实际 buffer 槽位可迁移，不能反过来决定逻辑身份。

编译后的 [场景夹具](../test/scene-core.html) 在 `t=[1,0,0.5,0.25,1]` 逐次构造并校验相同结构的 Scene IR。`quamolit.canvas-reference/draw-reference-rects!` 在 Calcit 中按原顺序读取 `SceneDocument` 的矩形节点，使用 `js-ffi.canvas-batches/fill-solid-rect!` 绘制；测试 JS 只准备白色画布、核对 JSON/像素和状态，不再解释矩形绘制。该窄参考路径暂不执行 group 变换、裁剪、隔离透明度或实例图层，不能算完整 Canvas2D 后端。独立的 [实例数据夹具](../test/instance-sources.html) 用 [版本化宿主边界](instance-sources.md) 登记并绘制 10k 个位置，检查同一时间的版本切换。`yarn test:scene-core` 验证严格公共类型、Calcit 原生反例以及编译后 JS 的 JSON 往返；`yarn test:motion-browser` 验证 Chromium 中间帧、像素、背景、样式恢复和刷新重放。架构 scaffold 见 [scene-ir-core.cirru](architectures/scene-ir-core.cirru)，Snapshot `calcit.cirru` 由 Calcit CLI 维护。

Scene 标量绑定已有 [CPU 参考解析器](scene-binding.md)。实例 typed-array 的版本化引用和宿主快照边界已有实现；资源表、批量绑定执行与上传优化仍待后续里程碑。执行计划与增量调度属于 #50；完整裁剪、透明组和绘制由后续后端 issue 验收。
