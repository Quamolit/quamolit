# Scene IR 核心：M1 #32 的可序列化切片

`quamolit.scene-ir` 定义不含 Canvas、DOM、GPU 句柄或可执行闭包的带类型场景数据。`SceneDocument` 按预序保存扁平 `SceneNode` 列表；每个节点有全局唯一的逻辑 `id`、父节点 `parent`、同级稳定 `key`、封闭的 `SceneContent`、标量 Motion 引用和逻辑事件目标。空父 ID 表示顶层；非顶层父节点必须在列表中先出现且为 group。列表顺序保留默认绘制顺序，不能为了合批改排透明节点。

当前内容变体包括 group、基础图元和实例图层。Group 声明 CSS px 的仿射矩阵、无裁剪或矩形裁剪，以及 `[0,1]` 的组 opacity；`quamolit.canvas-scene` 已提供完整 Canvas2D 正确性参考：累计嵌套矩阵，在独立 surface 上执行裁剪与子树绘制，最后只合成一次组 opacity。实例图层用 `InstanceSource { id, version, count }` 引用外部数据：即使 `count=10000`，IR 中仍只有一个节点；源数据、脏范围和宿主 buffer 的生命周期不进入 IR。Motion 绑定仅保存目标、描述 ID 和版本，不把 Calcit 回调塞入描述。

`validate-scene` 在绘制之前拒绝非法数值、颜色、尺寸、资源版本或实例数量、空事件目标、重复节点 ID、同一父级重复 key、缺失/非 group 父节点，以及不按真正深度优先预序排列的子节点。子树必须连续：一旦走到兄弟节点，不可再回到已关闭的子树。当前校验是正确性参考；祖先链线性查找使极深树最坏可达 O(n³)，不是后续保留执行计划或每帧全量树 diff 的要求。节点的物理 GPU/Canvas 存储槽未定义。[Scene diff 参考实现](scene-diff.md)现已按父路径、key 与节点类型判断复用；跨父或换类型视为卸载与新增。

绘制按文档中的深度优先预序遍历：group 打开 transform、clip 与隔离 opacity 作用域，子节点按声明顺序绘制，不得为合批改变半透明层序。命中按相反的叶节点绘制顺序检查；先应用逆变换与祖先裁剪，再检查显式 `SceneInteraction :target` 的几何区域。group target 是其子树未命中时的后备目标，取子图元几何并集；完全透明不自动禁用命中，是否交互由 target 决定；奇异变换下无法逆映射的子树不命中。实例层内部绘制顺序为资源索引升序，命中相反；它依旧只占一个逻辑 Scene 节点。

`quamolit.scene-hit` 现已提供不依赖 Canvas 的第一版正确性内核。`compile-hit-plan` 先完整校验 Scene，再只收集能解析到 target 的受支持叶图元，并按逆绘制顺序固化为可缓存 `HitPlan`；`hit-test-plan` 的事件热路径只扫描候选，不遍历无交互装饰节点。1000 个装饰节点的门禁确认编译后候选数和一次命中的访问数均为 1，但计划编译仍包含全量校验，不能把这个结果外推为 Scene 构建性能。命中支持累计仿射逆变换、全部祖先矩形裁剪、rect/circle/text/image/polygon/polyline，group target 通过后代叶图元自然形成几何并集；`hit-test` 是一次性编译与查询的便利入口。文字区域使用当前 monospace 左对齐/中线约定的确定性近似宽度。纯 Calcit 的冒泡、指针捕获、Scene 变更协调、真实 DOM capture、lost capture 与窗口失焦清理见 [Scene 指针路由](scene-pointer.md)。cubic-path、instances、canvas 真正卸载和 resize 中途拖拽仍未实现，不得把这些切片视为 #34 完成；Canvas2D 的嵌套裁剪与隔离绘制已有参考实现，WebGPU 对等语义仍待后续验收。

序列化边界只包含标量、封闭 Enum/Struct、逻辑事件目标、Motion ID/version 和实例源 `{id, version, count}`；原始 typed array、回调和宿主句柄不入 Scene。外部实例数据按 `(id, version)` 定位，同一版本必须视为不可变；任何原地修改都必须递增版本或通过将来显式的脏范围协议通知，否则框架可合法复用旧上传。后端可在逻辑路径、图元类型和几何签名不变时复用几何，在资源 `(id, version)` 不变时复用上传；属性或时间变化只失效相应参数。实际 buffer 槽位可迁移，不能反过来决定逻辑身份。

编译后的 [场景夹具](../test/scene-core.html) 在 `t=[1,0,0.5,0.25,1]` 逐次构造并校验相同结构的 Scene IR。`quamolit.canvas-reference/draw-reference-rects!` 在 Calcit 中按原顺序读取 `SceneDocument` 的矩形节点，使用 `js-ffi.canvas-batches/fill-solid-rect!` 绘制；测试 JS 只准备白色画布、核对 JSON/像素和状态，不再解释矩形绘制。该窄参考路径暂不执行 group 变换、裁剪、隔离透明度或实例图层，不能算完整 Canvas2D 后端。独立的 [实例数据夹具](../test/instance-sources.html) 用 [版本化宿主边界](instance-sources.md) 登记并绘制 10k 个位置，检查同一时间的版本切换。`yarn test:scene-core` 验证严格公共类型、Calcit 原生反例以及编译后 JS 的 JSON 往返；`yarn test:motion-browser` 验证 Chromium 中间帧、像素、背景、样式恢复和刷新重放。架构 scaffold 见 [scene-ir-core.cirru](architectures/scene-ir-core.cirru)，Snapshot `calcit.cirru` 由 Calcit CLI 维护。

Scene 标量绑定已有 [CPU 参考解析器](scene-binding.md)。实例 typed-array 的版本化引用和宿主快照边界已有实现；资源表、批量绑定执行与上传优化仍待后续里程碑。执行计划与增量调度属于 #50；`canvas-scene` 目前是正确性路径，每组分配全尺寸 surface，不代表最终性能方案。固定时间截图及像素验证见 [Layered Signals](layered-dashboard.md)。

## 后续支持扩展

以下扩展修订上方初始切片的支持集：当前还包括开放折线、闭合多边形、原生三次贝塞尔路径、原生圆体、基础单行文字和图片；矩形、折线、文字均允许叶节点 `:alpha` 标量绑定（乘原颜色 alpha），不是组隔离透明度。`canvas-reference` 参考入口绘制顶层 rect/polyline/polygon/cubic-path/circle/text；图片须调用单独的 `canvas-images/draw-document!`，group、instances、子节点仍明确拒绝。

`SceneContent :text` 保存 `TextNode { x, y, size, text, fill }`，字号必须有限且大于零。位置、字号、内容是几何签名，颜色是属性签名；没有字体资源引用。支持 monospace、左对齐、中线绘制，尚无 shaping、字体加载或 GPU 字形缓存。实现与验证见 [TodoList 恢复](todolist-restoration.md)。

## #53 路径前置：正式开放折线

`SceneContent :polyline` 新增 `PolylineNode { points: List<Vec2>, width: Number, stroke: ColorRgba }`。至少两点，坐标有限、宽度有限且非负、颜色遵守现有约束。仅支持开放折线、圆头和圆连接；不代表任意曲线、闭合填充、dash 或完整 SVG Path。零宽不绘制。点与宽度变化是 geometry diff，颜色变化是 properties diff；没有外部资源签名。当前不接受路径标量绑定，直接调用绑定解析器也会明确拒绝。

新的 `quamolit.canvas-reference/draw-reference!` 按声明顺序混合绘制支持的顶层基础图元。先校验整个文档和能力集，group、子节点和 instances 均在任何绘制前报错，避免静默丢图。它不执行 group 的 transform/clip/opacity，也不支持 WebGPU。坐标使用调用方当前 Canvas 坐标系，调用方负责视口/DPR/清屏；每个图元保存与恢复绘图状态，当前 path 不恢复，宿主异常不保证事务回滚。旧 `draw-reference-rects!` 仅保留历史矩形夹具行为，遇到其他图元明确报错，不应作为新场景通用入口。

## 原生曲线与圆体

`SceneContent :cubic-path` 使用 `CubicPathNode { start, segments, width, stroke }`；每个 `CubicSegment` 明确保存 `control-1`、`control-2`、`end` 三个有限 `Vec2`。路径至少一段、宽度必须有限且大于零。`SceneContent :circle` 使用 `CircleNode { cx, cy, radius, width, fill, stroke }`；半径必须为正，描边宽度非负。两者均是纯 Calcit 数据：几何与属性签名参与 `scene-diff`，不携带 Canvas 句柄。

`canvas-reference` 直接调用 js-ffi `CanvasContextHost` 上已类型化的 `bezier-curve-to!` 与 `arc!`，没有 Quamolit 专用 JavaScript wrapper。Curve 和 Solar 分别作为 32 段 cubic 与 10 个 circle 的首批用户；旧 16 步/48 边近似只保留为测试误差基准。`retained-path`、标量绑定与 WebGPU 后端目前明确拒绝这两类新节点，后续支持必须单独声明语义，不得静默降级为折线。

树的 `scene-at(time, depth)` 与浏览器入口现已消费该正式 IR；旧 `RoundPolyline` API 委托同一 `draw-round-path!` 原语，没有另建 JS renderer。`yarn test:binary-tree` 验证序列化、身份、几何/属性失效、非法与不支持场景的零副作用；`test/scene-core.spec.mjs` 用原生 Canvas 独立像素参考验证半透明矩形/折线层序，并以倒序绘制作为负例。仍是全量参考实现，不能用这项集成声称跨帧缓存或 GPU 提速。下一步为 #50 的路径保留计划及同源全量/保留对照。

## #53 图片 Scene 参考路径

`SceneContent :image` 持有 `ImageNode { source, matrix, sx, sy, sw, sh, dx, dy, dw, dh }`，其中 `ImageSource { id, version, width, height }` 只有逻辑身份与原始像素尺寸；DOM 图片、解码状态和 GPU 纹理都在 Scene 外。源裁剪必须落在原始图片之内，源/目标尺寸必须为正，矩阵与坐标均须有限。`scene-diff` 把矩阵及裁剪/目标矩形归为 geometry，把 `ImageSource` 归为 resources；仅时间推进但图片不变不必更换资源。

`quamolit.canvas-images/draw-document!` 是窄 Canvas2D 正确性参考入口：先校验所有节点并解析 `(id, version)` 到宿主图片，检查 `naturalWidth/Height`，再按声明顺序绘制顶层 image/rect/polyline/text。缺失或尺寸不符在绘制前报错，不留下半帧；该入口暂不支持 group、子节点、标量绑定、实例、WebGPU 图片纹理或跨帧图片句柄缓存。图片九参数 `drawImage` 调用 js-ffi 的类型化 `draw-image-crop!`，其余节点、资源与调度逻辑在 Calcit。折扇恢复示例已通过 `scene-at(model,time)` 使用这一路径；相关用例见 [折扇恢复](folding-fan-restoration.md)。
