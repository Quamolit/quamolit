# Scene IR 核心：M1 #32 的可序列化切片

`quamolit.scene-ir` 定义不含 Canvas、DOM、GPU 句柄或可执行闭包的带类型场景数据。`SceneDocument` 按预序保存扁平 `SceneNode` 列表；每个节点有全局唯一的逻辑 `id`、父节点 `parent`、同级稳定 `key`、封闭的 `SceneContent`、标量 Motion 引用和逻辑事件目标。空父 ID 表示顶层；非顶层父节点必须在列表中先出现且为 group。列表顺序保留默认绘制顺序，不能为了合批改排透明节点。

当前内容变体包括 group、基础图元和实例图层。Group 声明 CSS px 的仿射矩阵、无裁剪或矩形裁剪，以及 `[0,1]` 的组 opacity；`quamolit.canvas-scene` 已提供完整 Canvas2D 正确性参考：累计嵌套矩阵，在独立 surface 上执行裁剪与子树绘制，最后只合成一次组 opacity。实例图层用 `InstanceSource { id, version, count }` 引用外部数据：即使 `count=10000`，IR 中仍只有一个节点；源数据、脏范围和宿主 buffer 的生命周期不进入 IR。Motion 绑定仅保存目标、描述 ID 和版本，不把 Calcit 回调塞入描述。

`validate-scene` 在绘制之前拒绝非法数值、颜色、尺寸、资源版本或实例数量、空事件目标、重复节点 ID、同一父级重复 key、缺失/非 group 父节点，以及不按真正深度优先预序排列的子节点。子树必须连续：一旦走到兄弟节点，不可再回到已关闭的子树。当前校验是正确性参考；祖先链线性查找使极深树最坏可达 O(n³)，不是后续保留执行计划或每帧全量树 diff 的要求。节点的物理 GPU/Canvas 存储槽未定义。[Scene diff 参考实现](scene-diff.md)现已按父路径、key 与节点类型判断复用；跨父或换类型视为卸载与新增。

绘制按文档中的深度优先预序遍历：group 打开 transform、clip 与隔离 opacity 作用域，子节点按声明顺序绘制，不得为合批改变半透明层序。命中按相反的叶节点绘制顺序检查；先应用逆变换与祖先裁剪，再解析 `SceneInteraction :target` 的几何区域。`:none` 仍允许继承祖先 target，`:disabled` 则屏蔽整个子树（不改变绘制），子节点 target 不能绕过它。group target 取受支持后代图元的几何并集；完全透明不自动禁用命中；奇异变换下无法逆映射的子树不命中。实例层内部绘制顺序为资源索引升序，未来命中应相反；它依旧只占一个逻辑 Scene 节点，当前 HitPlan 尚不支持 instances。

`quamolit.scene-hit` 现已提供不依赖 Canvas 的第一版正确性内核。`compile-hit-plan` 先完整校验 Scene，再只收集能解析到 target 的受支持叶图元，并按逆绘制顺序固化为可缓存 `HitPlan`；`hit-test-plan` 的事件热路径只扫描候选，不遍历无交互装饰节点。1000 个装饰节点的门禁确认编译后候选数和一次命中的访问数均为 1，但计划编译仍包含全量校验，不能把这个结果外推为 Scene 构建性能。命中支持累计仿射逆变换、全部祖先矩形裁剪、rect/circle/text/image/polygon/polyline，group target 通过后代叶图元自然形成几何并集；`hit-test` 是一次性编译与查询的便利入口。文字区域使用当前 monospace 左对齐/中线约定的确定性近似宽度。纯 Calcit 的冒泡、指针捕获、子树禁用、Scene 提交时即时协调与真实 DOM capture 接线见 [Scene 指针路由](scene-pointer.md)。浏览器夹具已覆盖 DPR 1/2 的 resize/禁用并发；完整 Presence group 退出动画与 instances 命中仍待实现；cubic-path 候选见下文，不得把这些切片视为 #34 完成。Canvas2D 的嵌套裁剪与隔离绘制已有参考实现，WebGPU 对等语义仍待后续验收。

序列化边界只包含标量、封闭 Enum/Struct、逻辑事件目标、Motion ID/version 和实例源 `{id, version, count}`；原始 typed array、回调和宿主句柄不入 Scene。外部实例数据按 `(id, version)` 定位，同一版本必须视为不可变；任何原地修改都必须递增版本或通过将来显式的脏范围协议通知，否则框架可合法复用旧上传。后端可在逻辑路径、图元类型和几何签名不变时复用几何，在资源 `(id, version)` 不变时复用上传；属性或时间变化只失效相应参数。实际 buffer 槽位可迁移，不能反过来决定逻辑身份。

多边形的描边命中包含闭合边与 miter 接头（miterLimit=10，超限 bevel），不再复用开放圆头折线。纯 Calcit 几何去除相邻重复点及重复闭合端点；零宽、全重合不增加描边区域。填充命中与透明度不自动禁交互的规则保持不变。`test:scene-hit` 覆盖闭合边、外角、退化及旋转/缩放/clip 的公共 HitPlan；`test:curve-demo` 在DPR1/2对8类夹具各3321点进行原生路径对照并检出旧算法。

本分支另加入 cubic-path 描边命中候选：`HitPlan.candidates` 保存 `HitCandidate`（原节点及预编译曲线段），自适应几何、真实端点切线、共线极值/尖点均由 Calcit 处理；每次查询不重新细分，绘制仍使用原生贝塞尔。这个实验性内部结构变化不要求消费者构造候选，继续调用 `compile-hit-plan` / `hit-test-plan`。上方“未实现”指已合并基线，不包括本候选；自交填充规则、病态曲线精度域与完整指针链路计数仍未验收。几何参考与默认原生近似差异详见[路径合同](curve-restoration.md#三次曲线命中候选34尚未合并)，不能将高精度点比较当作默认Canvas或GPU全画质完成。

### 实例命中候选（#34，尚未合并）

有交互的矩形实例层使用 `compile-hit-plan-with-positions(document, lookup)`；`lookup` 是类型化 Calcit 函数，从 `InstanceSource` 返回 `InstanceHitSource { source, points: List<Vec2> }`。编译时严格验证完整 id/version/count、位置数量和有限坐标，再把不可变位置倒序保留在计划中。Scene 仍只含源身份，不加入 typed array 或宿主句柄。原 `compile-hit-plan` 不接收源解析器，继续忽略 instances；两种入口不可混淆。

后续调用 `hit-test-plan` 得到原有逻辑节点/target；调用 `instance-hit-index(plan, node-id, x, y)` 得到 `Option<Number>`，重叠处选择最高源索引。两者均应用祖先逆变换和全部矩形 clip，坐标为 CSS px，不乘 DPR；不存在的节点或裁剪外返回 none。一个实例层仍是一个逻辑节点，索引不是独立 Scene ID，也不自动成为 PointerDispatch 字段。零透明度不自动禁交互，继续由 interaction 控制。

位置变化须提供新版本并重新构建计划；新计划不修改旧快照，热查询不再次调用 lookup。当前按倒序线性扫描位置，不声称空间索引或性能优化已经完成。纯 Calcit 原生用例检查重叠索引、旋转/缩放/clip与旧版本拒绝；沿用 `test:curve-demo` 的 Node 门禁检查1000次查询不重读源、错误身份/数量/非有限位置，Chromium在DPR1/2对两个版本各154点与独立原生Path2D比较，并对公共 `draw-instances!` 完整RGBA比较。测试宿主显式安装父级transform/clip；这不表示 `canvas-scene/draw-document!` 已支持嵌套实例。已有独立消费者的 `instances-hit-plan` 在Calcit中解析公共资源表、一次复制位置并转换成类型化Vec2；`test:consumer` 检查10k重叠最高索引、三个版本、移动索引5050和源释放后的旧计划，并检出始终返回none的负例。逻辑节点捕获、换版本保留及退出/卸载提交的原生释放沿既有薄桥验证，见[指针提交协议](scene-pointer.md)；不自动提供单个源索引的跨版本稳定捕获身份。安装/搬移是否通过以当前candidate/harness报告为准；完整应用接线与GPU picking仍未验收。

编译后的 [场景夹具](../test/scene-core.html) 在 `t=[1,0,0.5,0.25,1]` 逐次构造并校验相同结构的 Scene IR。`quamolit.canvas-reference/draw-reference-rects!` 在 Calcit 中按原顺序读取 `SceneDocument` 的矩形节点，使用 `js-ffi.canvas-batches/fill-solid-rect!` 绘制；测试 JS 只准备白色画布、核对 JSON/像素和状态，不再解释矩形绘制。该窄参考路径暂不执行 group 变换、裁剪、隔离透明度或实例图层，不能算完整 Canvas2D 后端。独立的 [实例数据夹具](../test/instance-sources.html) 用 [版本化宿主边界](instance-sources.md) 登记并绘制 10k 个位置，检查同一时间的版本切换。`yarn test:scene-core` 验证严格公共类型、Calcit 原生反例以及编译后 JS 的 JSON 往返；`yarn test:motion-browser` 验证 Chromium 中间帧、像素、背景、样式恢复和刷新重放。架构 scaffold 见 [scene-ir-core.cirru](architectures/scene-ir-core.cirru)，Snapshot `calcit.cirru` 由 Calcit CLI 维护。

Scene 标量绑定已有 [CPU 参考解析器](scene-binding.md)。实例 typed-array 的版本化引用和宿主快照边界已有实现；资源表、批量绑定执行与上传优化仍待后续里程碑。执行计划与增量调度属于 #50；`canvas-scene` 对 opacity=1、clip=none 且没有直接图片/折线子节点的组直接累计矩阵并绘制，不创建隔离 surface。透明组、裁剪组以及直接含图片/折线的组仍分配全尺寸 surface，保持原有合成和既定光栅像素结果（Chromium 的直接/离屏绘制可能相差一个通道单位）；没有把组 alpha 下推到子节点，也没有重排。现有 `test:layered-dashboard` 验证零/单次隔离分配，`test:folding-fan` 保持图片/折线/文字混合的严格全像素合同。这仍不是有界图层缓存或最终性能方案。固定时间截图及像素验证见 [Layered Signals](layered-dashboard.md)。

## 后续支持扩展

以下扩展修订上方初始切片的支持集：当前还包括开放折线、闭合多边形、原生三次贝塞尔路径、原生圆体、基础单行文字和图片；矩形、折线、文字均允许叶节点 `:alpha` 标量绑定（乘原颜色 alpha），不是组隔离透明度。`canvas-reference` 参考入口绘制顶层 rect/polyline/polygon/cubic-path/circle/text；图片须调用单独的 `canvas-images/draw-document!`，group、instances、子节点仍明确拒绝。

`SceneContent :text` 保存 `TextNode { x, y, size, text, fill, font }`，字号必须有限且大于零。位置、字号、内容是几何签名，颜色是属性签名；`FontSpec { family, fallback, version }` 进入资源签名。family 是单个命名字体，不是完整 CSS font shorthand；空串只使用 `FontFallback :monospace/:sans-serif/:serif`。非空名称由 Calcit 引用并转义，拒绝首尾空白/控制字符；version 是有限非负整数，标识字体来源/字形版本。同时间字体可用性变化须更新组件资源修订，不能仅靠 time 相等复用旧布局，也不应随意改变已经加载的字体版本。TextNode 仍是实验接口：已有10个示例构造点迁移到 `scene/default-font`，下游新增构造也需显式传 `:font`。默认画面保持 monospace、左对齐、中线绘制；尚无 shaping、布局缓存或 GPU 字形缓存。实现与验证见 [TodoList 恢复](todolist-restoration.md)。

`quamolit.font-resource` 提供显式 `load-font!(spec, source)`，返回 `FontLoadOutcome :ready LoadedFont / :failed String`。它只加载，不自动安装、绘制或修改Model；构造异常及Promise拒绝统一在Calcit处理。`install-font!(loaded, expected-spec)` 只安装与当前请求描述完全一致的结果，过期版本返回false且不访问document.fonts；`release-font!` 删除确切FontFace，重复删除返回false，不按family误删新版本。单资源调用方先核对请求再安装并更新可用性修订；共享资源可按下述registry入口管理，不在绘制循环隐藏加载或所有权转移。

加载和绘制共用纯 Calcit `scene/font-host-family` 生成的版本化宿主别名。字体来源/字形改变须提升 `FontSpec.version`，同一 family/version 必须对应同一来源；仅 loading→ready 时提升组件资源修订，保持加载与 Scene 的字体版本一致。Canvas 按“版本别名 → 原生 family → 通用 fallback”选择，不要求先加载系统字体；默认空 family 仍只有 monospace 等通用回退。别名属于实现细节，下游不自行构造 CSS 或访问 FontFace.family。否则同名字体即使逻辑版本不同，原生 FontFaceSet 仍无法按 version 选字形。既有浏览器门禁用两种不同字体来源验证双版本同时安装、两种安装顺序和释放旧版本后的新版全 RGBA 参考；共享缓存接入前必须保持这些语义。宿主 family 使用 `QuamolitFont:` 保留前缀，应用不要将它作为自定义原生字体名。

队列接入复用 `ResourceLoadQueue` 与 `ResourceState`：`run-font-load-task!(spec,source,task)` 核对 font kind/版本并返回完整任务身份，`complete-font-load(state,queue,result)` 先结算token，再核对当前identity/generation/loading。仅两道检查通过才交付 `Option :some LoadedFont` 与既有install/wake-frame动作；失败返回资源error，取消、运行时generation替换、资源关闭/换版与unknown结果返回none，既不安装也不复活状态。消费方按动作安装/释放并更新Scene资源修订；这个单资源结算函数纯Calcit，不含DOM调用。未安装FontFace没有destroy方法，丢弃意味着不交付长期引用，不冒充物理内存立即释放。重复完成不重复交付；token匹配但完整任务被伪造时拒绝。现有Node宿主替身覆盖竞态与100次显式装卸，真实Chromium验证取消中的原生加载结果不安装。消费方Calcit构造队列/资源请求，不要求写JS loader。

共享入口仍在同一namespace：`FontResourceHost`保存宿主引用，`complete-font-registry-load!(host,registry,queue,result)`先复用上述完成判定，再推进现有逻辑registry并执行install；`apply-font-registry-actions!`按完整`identity/generation`执行字体install/release，其他kind及load/wake/error动作不代替应用执行。`installed-font`返回对应已安装句柄或none。引用计数、idle、LRU与容量完全复用`resource-lifecycle`，没有第二套字体registry；预算使用应用约定的正数单位，不冒充字体物理字节数。同identity绑定同FontSpec/来源；不同版本可共存，两个资源generation都为1也不会串释放。host的accepted/released只统计接纳后的所有权，不统计失败/丢弃的FontFace构造或物理内存。最后lease释放只转idle，驱逐/close才删除确切FontFace；重放已接纳结果不误删活动句柄。关闭/驱逐运行中的资源时，应用还须按release身份调用`cancel-resource-loads`，再重新enqueue，并延续同一队列的token序列；已取消槽位不参与去重但仍占并发额度直到返回。

Node沿原门禁验证共享一次实际加载、idle重入、同generation身份隔离、驱逐、失败、关闭后相同身份重入的迟到隔离、重复结果，以及单容量100轮最终accepted=released=100/live=0。独立消费者新增一个Calcit `shared-font-cycle!`，自行获取两个lease、完成一次真实加载、idle重入并close；浏览器只驱动它，核对loads=1/accepted=released=1/live=0及FontFaceSet数量回基线，原中文帧仍走原像素合同。不新增JS loader、namespace、Snapshot、命令或job。共享作用域是显式传入的registry/host，不是全局隐式缓存；完整运行时自动发起/取消load、多后端恢复和原生排版/字形缓存仍未验收。

Presence 文字可复用同一共享入口：`presence-font-references(model)` 从所有仍在 Model 中的 text item 提取唯一 `(font,family,version)`；空 family 的原生通用回退不生成租约，同 family/version 的不同 fallback 共享同一 FontFace。退出项仍保留引用，只有 `settle-presence` 移除最后文字项后引用才消失。`font-identity(spec)` 提供同一映射，并拒绝空 family/非法 FontSpec。命名原生字体若不由应用加载，应由应用显式排除，不自动为任意系统字体发起请求。

`sync-font-leases(registry, previous, next, budget)` 对一个所有者的前后唯一引用列表同步：先释放消失项，再获取新增项，返回既有 `RegistryTransition`，没有另一套资源表。重复提交不改变引用数；不同所有者各持一个 lease。两个列表必须只含唯一合法 font identity，预算是固定的正数逻辑单位。调用方成功后保存 next，执行现有宿主动作并驱动加载队列；容量失败保留旧 registry/previous，不执行宿主副作用。来源变化必须升级 version，不能在同 identity 下换 source。离线乱序重放只查询引用，不向实时所有者重复同步；截图需要独立所有权状态。

现有独立消费者的 `shared-font-cycle!` 改为从真实 Calcit 文字声明构造 Presence，验证退出中间帧仍持有、快速重入不重载、两个所有者逐一释放，以及同一实际 FontFace 的100次 Presence 出入后 idle 重用，最终 close 使 accepted=released=1/live=0。Node 补不同 fallback/内置字体/换版本驱逐/非法与重复引用。循环使用同步具名消费者辅助函数，绕过正式0.28中外层async覆盖局部`:async false`的[已上报问题Calcit #1713](https://github.com/calcit-lang/calcit/issues/1713)；上游虽已关闭，当前固定CLI仍复现，升级后重测再考虑内联，不放宽foldl或引入Dynamic。加载完成的同时间资源修订仍由应用推进；这不是看板退出、resize与原生 capture 的完整组合，也不证明字体布局缓存或 GPU glyph 支持。

字体namespace隔离异步宿主与纯Scene/绘制模块，不能放入image runner或绘制循环。两个原生:inline仅创建/加载FontFace和读取document.fonts；临时类型化Trait关联[js-ffi #158](https://github.com/calcit-lang/js-ffi/issues/158)，上游交付后替换并删除局部平台声明。下游只引用Calcit模块，不手工导入JS。既有TodoList门禁增加纯FontSpec校验、Node失败/过期/释放合同，以及真实Chromium本地Arial/Liberation Sans加载、损坏字体失败、缺失首选字体回退和全RGBA原生参考。独立消费者声明“图表收入”，沿现有组件/transform链路验证乱序时间、1000次移动共享文字节点、同时间字体修订重声明，以及本地CJK加载、构造失败、过期安装拒绝、原生回退、非空与缺字字形差异；固定帧进入原消费者artifact。macOS用实际PostScript名PingFangSC-Regular，Linux依赖既有Playwright安装的WenQuanYi Zen Hei，缺失时失败不跳过。字形诊断验证浏览器最终绘制不是缺字，不等于解析字体文件证明全部字符覆盖。Node替身不算浏览器字体证据；精确文字命中及仅移动时不重排的原生布局/字形缓存计数仍未完成，旧monospace近似命中不能外推命名字体。

## #53 路径前置：正式开放折线

`SceneContent :polyline` 新增 `PolylineNode { points: List<Vec2>, width: Number, stroke: ColorRgba }`。至少两点，坐标有限、宽度有限且非负、颜色遵守现有约束。仅支持开放折线、圆头和圆连接；不代表任意曲线、闭合填充、dash 或完整 SVG Path。零宽不绘制。点与宽度变化是 geometry diff，颜色变化是 properties diff；没有外部资源签名。当前不接受路径标量绑定，直接调用绑定解析器也会明确拒绝。

新的 `quamolit.canvas-reference/draw-reference!` 按声明顺序混合绘制支持的顶层基础图元。先校验整个文档和能力集，group、子节点和 instances 均在任何绘制前报错，避免静默丢图。它不执行 group 的 transform/clip/opacity，也不支持 WebGPU。坐标使用调用方当前 Canvas 坐标系，调用方负责视口/DPR/清屏；每个图元保存与恢复绘图状态，当前 path 不恢复，宿主异常不保证事务回滚。旧 `draw-reference-rects!` 仅保留历史矩形夹具行为，遇到其他图元明确报错，不应作为新场景通用入口。

## 原生曲线与圆体

### 原生圆弧（#212）

`SceneContent :arc` 使用纯数据 `ArcNode { cx, cy, radius, start-angle, end-angle, counterclockwise, width, stroke }`，由 `canvas-reference/draw-arc!` 调用 js-ffi 已类型化的 `CanvasContextHost.arc!`。不添加专属 JS wrapper，不在应用或绘制器中离散折线。中心、半径、角度与宽度必须有限；半径大于零，宽度非负，颜色沿用 ColorRgba。宽度为零不绘制。

角度为弧度，零角朝右；CSS 坐标中 `counterclockwise=false` 顺时针，`true` 逆时针。起止角不预先取模：按 [HTML Canvas arc 规范](https://html.spec.whatwg.org/multipage/canvas.html#dom-context-2d-arc)，所选方向的跨度至少 `2π` 才画完整圆；跨零遵循所选方向，相同起止角按原生零长度路径处理，不自动改成完整圆。固定圆头、开放描边，无填充、扇区闭合、dash 或可选 lineCap。每条弧独立 beginPath，不连接上一条弧；不 closePath，以免引入径向线段。

几何签名包含中心、半径、两个角度、方向和宽度，颜色只进入属性签名，无宿主资源字段。`draw-reference!` 支持顶层弧；`canvas-scene/draw-document!` 支持原有祖先 transform/clip/隔离 opacity，绝对根变换由 Scene 提供（包括 DPR），不是继承调用者 context 的外部变换。

复用 `test:scene-core` 的原生/Node 门禁及 `test:motion-browser` 的 Scene 浏览器门禁：DPR1/2、乱序0/0.5/2.5秒、顺逆/跨零/完整圆/相同角度/零宽、圆头，与独立原生 Canvas 整帧 RGBA 零差异比较；错误方向/圆头是必需负例。`test:gpu-component` 检查完整图层 fallback 与节点身份诊断 `unsupported-node:arc`，不静默丢弧，不将 mock 或 Canvas 对照当真实 GPU 通过。

这是实验性 Scene 扩展：目前 WebGPU 无圆弧实现，矩形组件 GPU 入口明确整层回退；图片专属 GPU 入口仍预检拒绝非支持图元。弧的独立命中/指针目标、标量绑定和 retained-path 专用入口未实现，不以整圆命中或折线近似偷偷替代；绑定明确拒绝 `unsupported-arc-binding`，应用可以重新声明显式时间采样的弧。首次实际迁移对象是 Discs Vortex；待新 tag 后撤销其点离散绕过，并按原圈数/速度/DPR生产门禁复验，再收口 #212。

`SceneContent :cubic-path` 使用 `CubicPathNode { start, segments, width, stroke }`；每个 `CubicSegment` 明确保存 `control-1`、`control-2`、`end` 三个有限 `Vec2`。路径至少一段、宽度必须有限且大于零。`SceneContent :circle` 使用 `CircleNode { cx, cy, radius, width, fill, stroke }`；半径必须为正，描边宽度非负。两者均是纯 Calcit 数据：几何与属性签名参与 `scene-diff`，不携带 Canvas 句柄。

`canvas-reference` 直接调用 js-ffi `CanvasContextHost` 上已类型化的 `bezier-curve-to!` 与 `arc!`，没有 Quamolit 专用 JavaScript wrapper。Curve 和 Solar 分别作为 32 段 cubic 与 10 个 circle 的首批用户；旧 16 步/48 边近似只保留为测试误差基准。`retained-path`、标量绑定与 WebGPU 后端目前明确拒绝这两类新节点，后续支持必须单独声明语义，不得静默降级为折线。

树的 `scene-at(time, depth)` 与浏览器入口现已消费该正式 IR；旧 `RoundPolyline` API 委托同一 `draw-round-path!` 原语，没有另建 JS renderer。`yarn test:binary-tree` 验证序列化、身份、几何/属性失效、非法与不支持场景的零副作用；`test/scene-core.spec.mjs` 用原生 Canvas 独立像素参考验证半透明矩形/折线层序，并以倒序绘制作为负例。仍是全量参考实现，不能用这项集成声称跨帧缓存或 GPU 提速。下一步为 #50 的路径保留计划及同源全量/保留对照。

## #53 图片 Scene 参考路径

`SceneContent :image` 持有 `ImageNode { source, matrix, sx, sy, sw, sh, dx, dy, dw, dh }`，其中 `ImageSource { id, version, width, height }` 只有逻辑身份与原始像素尺寸；DOM 图片、解码状态和 GPU 纹理都在 Scene 外。源裁剪必须落在原始图片之内，源/目标尺寸必须为正，矩阵与坐标均须有限。`scene-diff` 把矩阵及裁剪/目标矩形归为 geometry，把 `ImageSource` 归为 resources；仅时间推进但图片不变不必更换资源。

`quamolit.canvas-images/draw-document!` 是窄 Canvas2D 正确性参考入口：先校验所有节点并解析 `(id, version)` 到宿主图片，检查 `naturalWidth/Height`，再按声明顺序绘制顶层 image/rect/polyline/text。缺失或尺寸不符在绘制前报错，不留下半帧；该入口暂不支持 group、子节点、标量绑定、实例、WebGPU 图片纹理或跨帧图片句柄缓存。图片九参数 `drawImage` 调用 js-ffi 的类型化 `draw-image-crop!`，其余节点、资源与调度逻辑在 Calcit。折扇恢复示例已通过 `scene-at(model,time)` 使用这一路径；相关用例见 [折扇恢复](folding-fan-restoration.md)。
