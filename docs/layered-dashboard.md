# Layered Signals：嵌套裁剪与隔离透明度

这个全屏图表 demo 验证 `quamolit.canvas-scene/draw-document!` 的两项组语义：子组的矩形裁剪在累计变换后生效；组透明度通过独立 surface 只合成一次，而不是把透明度逐个乘到子节点上。

Scene、动画时间、矩阵相乘、树遍历与绘制顺序全部由 Calcit 定义。当前仅有创建隔离 surface、取得 2D context、以 `globalAlpha` 回贴 surface 三个 inline JS 宿主原语；它们将在 [js-ffi #147](https://github.com/calcit-lang/js-ffi/issues/147) 提供类型接口后删除。

可在 URL 使用 `?t=0`、`?t=0.5`、`?t=1` 固定截图，也可通过 `window.layeredDashboardDemo.seek(t)` 乱序采样。验收时同时检查：起点只有背景、中间帧裁剪边界内只有部分柱图、终点完整显示，以及重叠色块仍按一次组透明度合成。

## 显隐生命周期与捕获

导航中的同一 Layered Signals 页面增加“隐藏看板／恢复看板”，不另建入口。原有 `t=0/.5/1` 的缩放、上移、柱图揭示和0.55隔离组效果保持不变；显隐使用0.6秒线性生命周期，整组只给 dashboard 绑定 Presence alpha，后代保留自身颜色及透明度。入场尚未完成时的显隐与原有动画叠加，打断当帧连续。

Model、显隐事件、乱序重放、正常播放的增量推进、终点结算、Scene投影和指针监听均在 Calcit。绘制只读Model；viewport投影保留逻辑path和当前动画意图，resize不创建新的显隐事件。先编译同一 sampled Scene 的CSS命中计划，再协调旧PointerState、保存新状态/计划，最后绘制；实际像素到CSS比例采用元素边界/像素尺寸，避免DPR取整带来的坐标偏差。root/柱图目标由Scene表达，退出开始自动disabled整个子树，不等资源终点释放。

可按住柱图获得原生捕获，再调用 `setVisible(false)` 观察立即释放；恢复后不会恢复旧捕获，须重新按下。`lostpointercapture`、up/cancel、blur和卸载复用公共指针状态机，监听器与原生捕获幂等清理。当前单个统一页面对应一个该demo实例；应用内部两个atom保存已提交计划与指针状态，不是新的框架运行时。

展示：导航 `?demo=layered-dashboard&t=1` → 隐藏 → 用时间条查看1.3秒中间帧、1.6秒终点；在1.3秒恢复可查看连续重入至1.9秒。`window.layeredDashboardDemo` 保留 seek/play/pause/snapshot，并提供setVisible/reset/dispose。显隐日志当前仅在内存，不序列化进URL；`?t=`仍是原有入场直链，刷新不会保留新日志。seek保留日志供重放，seek后新操作裁掉未来分支；重置清空日志。

`yarn test:layered-dashboard` 沿既有门禁验证8项Chromium用例：DPR1/2下resize与退出同次提交，在无新PointerEvent时释放恰好一次；渐出仍有28节点，中间帧截图、重入连续、新按下再次捕获、重复卸载后无监听/待执行帧；原有像素与全屏浮层断言不变。纯协议同时检查日志增量/乱序等价、100次1↔28节点往返、换父新旧身份共存、嵌套子项仍在原父组裁剪/层序，以及整组渐出的独立一次合成参考。首个rAF允许早于播放注册时间，宿主保证推进时间不倒退，回归检查终点停帧和两秒空闲。截图和报告仍在忽略的test-results/CI artifact，不入库。

本批未优化时间帧Scene/绑定分配或全ID访问；默认文字仍使用内置monospace，字体/图片联合验收见下节。WebGPU一般组不支持，硬件及性能结论未新增；#34/#53/M3不能因此关闭。

## 字体租约与真实退出联合提交

浮层“启用字体资源”显式启用 `QuamolitDashboard/version=1`，通过现有 Calcit 字体 loader 申请本机中文字体；默认不加载、不改变原画面。逻辑字体描述与 Presence Model 投影在 `with-font`，Registry/LoadQueue/FontResourceHost 仍使用公共入口；连接状态现为 `DashboardMedia`，不是第二套资源运行时。绘制不修改原动画 Model；启用后所有正向、seek 与乱序帧都按同一资源选择投影。

先同步意图 Model 的资源引用，再按实际就绪状态生成展示 Scene、编译/提交 HitPlan 协调捕获，最后绘制；解码未就绪时保留原卡片而非传递不存在的ImageHost。退出开始立刻禁交互、释放原生捕获，文字/图片与租约仍留到0.6秒退出终点；终点归零后资源进入 idle，不冒充已销毁。中途重入与 idle 重入复用一次加载；页面卸载关闭共享 registry、取消队列并精确删除 FontFace/图片强引用。异步完成总是交给最新 Calcit 状态判定；关闭后的迟到结果不能安装或触发重绘。

现有看板浏览器门禁在 DPR1/2 组合真实 FontFace、按住柱图、退出与 resize、0.5 alpha 中间帧、快速重入、终点归还与 idle 复用及重复卸载。另在真实字体加载等待期间卸载，验证迟到完成后 accepted=0、live=0、running=0，画面计数不变。静态发布导航再验证同一Canvas的两次挂载：旧加载未完成时持有原生capture，导航卸载释放一次；新看板成功安装同名字体后再放行旧完成，新状态/画面计数完全不变、旧结果不误删新FontFace，最终返回目录使FontFaceSet回到基线。该竞态在DPR1/2连续三轮验证，先结算新挂载正常ResizeObserver/DPR通知，不删绘制计数断言。原全帧隔离组像素和原入场效果回归保留。媒体提交改变registry时增加revision，关闭迟到保持不变；当前页面全量重绘，不声称已接保留布局缓存。该字体分支管理一种可选字体，失败保留通用回退；下节补图片联合，版本切换/自动重试UI或GPU fence/recovery仍未完成，#34/#51/M2/M3仍开放。

## 字体与共享图片的联合场景

“启用图片资源”将两个信号块投影成真实荷花缩略卡片，几何/逻辑key/父级隔离透明度不变，两个ImageNode共用`dashboard-cover/version=1`的一份租约。URL/预期尺寸仅在`ImageResourceDescriptor`，Scene没有URL或宿主句柄；`with-images`与`image-references`由Calcit定义。原`DashboardFonts`连接状态归并为`DashboardMedia`，同一个registry/queue协调font与image，分别复用FontResourceHost/ImageResourceHost。完成、缓存驱逐和关闭动作均同时应用到两类宿主，不在JS实现资源状态机。

默认不启用图片，保留原画面；解码等待/失败仍显示原卡片与可见错误。共享队列有两个并发槽，取消但尚未返回的decode仍占槽，维持有界背压；JS仅保存Promise/任务句柄并驱动DOM，引用/generation/当前任务判定均在Calcit。领取后以`consume-media-task`清空交付字段，每项只启动一次，resize/绘制不能吞掉它。操作的Promise只等待仍被当前Model引用且generation匹配的任务，不被旧版本拖住；旧任务最终仍结算释放。关闭后迟到图片计入created/released且不重绘、不复活字体；HTMLImageElement没有destroy，释放只表示框架删除强引用，不声称物理内存同步回收。snapshot的历史`fonts`字段现在含整个媒体状态（含images），没有另一套资源运行时。

“重试图片”只对当前image的error开放，以release/acquire创建新resource-generation，identity/version不变、引用仍为1，不关闭字体或重置动画。“刷新图片（新版本）”和`setImageSource(url)`由Calcit递增descriptor.version，Scene与lookup同时使用新identity；不在同identity下偷偷换URL。切换中的旧图片继续由队列跟踪，迟到的旧identity/generation不能安装、不能替换新画面。等待时显示原卡片，字体保持就绪；仅字体失败不能启用图片重试按钮。

两个旧decode占满槽时，新版本保持pending，页面操作不会把“未启动当前任务”误当成“已经完成”。Calcit的`media-pending-current?`复用identity/generation引用判定；宿主等待任一旧Promise结算腾出槽，再等待当前任务，不增加并发、不轮询资源表，也不等待剩余无效旧任务全部结束。

既有`test:layered-dashboard`含2项原生语义与23项浏览器回归：DPR1/2的独立原生Canvas图片/隔离alpha参考、捕获中的父级退出、暂停resize、100次独立reset/退出/重入、idle复用、重复关闭、真实解码等待期间卸载与失败不影响字体；同identity重试、新蓝图先就绪/旧红图后到，以及两槽占满后第三版本排队，断言版本、帧计数、像素与释放不被污染。临时恢复旧等待逻辑时，新排队用例在`completed=false`断言失败，证明能够检出提前返回；修复后完整23项通过。参考与实际采用相同物理画布尺寸和默认图片平滑，区域逐通道零差异；不使用宽容差掩盖不同尺寸的采样差异。像素与resize先在完整尺寸验证；计数链路使用固定800×600物理尺寸和独立短日志，不作为吞吐测量。预览：`?demo=layered-dashboard&t=1`→启用字体/图片→刷新新版本→隐藏→时间条1.3/1.6→恢复；截图仍为忽略artifact。通用多图版本UI、glyph缓存、GPU文字及fence-safe回收仍未实现，#34/#51/#53/M2/M3不关闭。

## 图表子组件的独立出入

同一浮层新增“隐藏图表／恢复图表”，不另建demo。它只改变chart子树的声明，标题、指标与信号块保持可见；默认柱图0.6秒淡出期间仍有28节点，终点结算后剩19节点，重入恢复28节点。`VisibilityEvent` 同时保存visible/chart-visible/line-chart，各操作保留其他意图；增量播放、乱序seek与历史分支使用同一Calcit日志，不在JS维护另一套动画状态。`setChartVisible`是对应的页面入口，重置恢复全部内容。

组件使用显式的 `declare-tree-coalesced`，所有者配置为dashboard/chart及七个bar逻辑ID：整组卸载产生相同phase/tween时只由父级承担淡化；子图表单独退出时由chart承担。已有独立子动画不会被父级删除重启或抹掉，例如图表t=1开始退出、看板t=1.3退出，图表仍在t=1.6到终点，父级在t=1.9结束。旧 `declare-tree` 的有意双乘行为保留，规则与限制见[组件合同](presence-component.md)。直接采样未结算小数终点使用已合并#217的精确tween端点修复，不放宽Scene校验。

“切换折线图／切换柱状图”声明真正的类型替换：七个rect退出、沿用bar-1逻辑key的polyline进入，29节点过渡至22节点。完整kind/path生成不同渲染身份，旧rect继续绘制但立即disabled，其原生捕获随Scene提交释放。视口投影只替换同类型内容，不能用当前rect覆盖尚在Model中的polyline。应用明确折线叠在柱图之上，正反打断均保持该声明层序；这不是renderer为合批重排任意透明节点。DPR1/2验证0.5中间帧、快速切回整Canvas像素完全相等、终点停帧、乱序重放及折线隐藏/恢复；完整类型/重排矩阵仍未验收。

真实DPR1/2门禁新增子图表capture中的resize+退出同次提交、捕获立即释放一次、退出终点停帧、快速重入的稳定身份/内容与整Canvas像素不变。子树消失后不能恢复旧capture，但其余看板目标继续有效；不把父级背景交互误称为图表仍可命中。100次19↔28节点往返、父子意图组合与原有整看板RGBA零差异回归保留，生成截图仍放忽略artifact。与主线字体租约合并后，视口投影保留逻辑文字的font，不能只加载资源却绘制默认字体；DPR1/2检查柱图/折线切换、子图表隐藏/恢复、重置与父级退出的实际Scene字体和一次加载。图片联合、完整换类型/重排矩阵、GPU及性能仍未因此验收。

## Scene 能力与完整预检

以下区分完整 `canvas-scene/draw-document!` 与受限 GPU 消费者，不能把单图层能力拼成任意 Scene 都支持的承诺。

| SceneContent | Canvas document | 现有 WebGPU 路径 / 不支持时 |
| --- | --- | --- |
| group | 累计矩阵、矩形 clip、隔离 opacity | 矩形批次拒绝，整层走 Canvas；图片图层只支持声明过的子集 |
| rect | 实色矩形 | 顶层矩形批次支持；嵌套组不静默扁平化 |
| polyline | 圆头/圆连接折线 | 矩形批次拒绝，整层 Canvas |
| text | 基础 monospace 文字 | 矩形批次拒绝，整层 Canvas |
| image | 须提供匹配 id/version/尺寸的 ImageHost | 图片图层支持矩阵/源裁剪子集；混合文字/路径整层 Canvas |
| polygon | 填充及声明的描边 | 矩形批次拒绝，整层 Canvas |
| cubic-path | 声明的三次曲线描边 | 矩形批次拒绝，整层 Canvas |
| circle | 圆形填充及声明的描边 | 矩形批次拒绝，整层 Canvas |
| arc | 原生方向/跨零/圆头圆弧描边 | 矩形批次拒绝，整层 Canvas |
| instances | 此 document 入口明确拒绝；另用版本化实例入口 | 独立实例图层另有支持合同，不自动插入任意嵌套 Scene |

矩形、图片、instances三种专用GPU入口的逐种类准入集中于[可执行能力矩阵](layer-composition.md#专用入口的种类矩阵)，由原有`test:layers`对照真实Scene枚举及四条能力/决策入口校验；本表保留Canvas语义说明，不把GPU各子集拼成通用renderer。

`content-supported?` 是纯 Calcit 种类查询，不验证图元数值或资源 ready。`unsupported-nodes(document)` 返回有序 `List<quamolit.scene-ir/SceneDiagnostic>`（id/key/kind/reason），目前 instances 的原因是 `unsupported-canvas-scene-instances`；GPU 的 `diagnose-plan(plan)` 使用同一个类型，保留自己的后端原因。调用者可展示诊断或选择完整实例层入口，不丢弃节点继续绘制。`preflight!` 先检查尺寸、完整 Scene 合法性和全部不支持种类，再解析图片资源，任何失败发生在第一次 Canvas 操作之前。图片丢失或尺寸不匹配仍使用已有资源错误，不把资源状态伪装为种类不支持。原候选的 CanvasDiagnostic 尚未发布，在同一 PR 收敛为共享类型，不保留重复别名。

独立消费者在同一页面提供“嵌套图表与隔离透明度”，通过公共 Calcit 保留计划采样组透明度与柱条宽度，再调用 `draw-document!`。测试沿现有 `test:consumer` 检查全部9种 Scene 标签的能力表、id/key诊断、失败前零 Canvas 调用、1000帧结构共享、同时间Model失效，以及独立原生Canvas的整图像素；不是新增 renderer，也不证明这些组语义已在 GPU 实现。

同一消费者的 `primitive-document(time)` 用 Calcit 声明8种 document 支持图元的真实 payload（group/rect/polyline/text/image/polygon/cubic-path/circle）；`draw-primitives!` 通过公共模块绘制，与图表共用一个纯 Calcit 布局函数。现有无GPU浏览器门禁在同一Canvas上检查5个乱序时间、固定尺寸与全屏DPR1/2，逐通道比较独立原生参考，不从Scene数据生成参考；绘制前后声明不变。JS测试只创建8×8图片宿主和期望画面，不是库的实现或新增demo。图片缺失/尺寸不符的Node反例使用不可访问Canvas替身，要求零宿主调用；instances仍明确拒绝。结果位于原报告的 `layeredCanvas.primitives` 与各fullscreen记录的 `primitives`，截图仍为忽略artifact。这补齐合法图元实际绘制证据，不把种类查询当资源验证，不外推到任意路径/字体排版或GPU完整语义。

像素参考独立计算动画、矩阵、裁剪和组合成，但与实际后端采用同类隔离 surface（可用时 OffscreenCanvas，否则 DOM Canvas），最终绘制到 DOM Canvas。Chromium 上以 scale=3.125、clip 顶边 y=343.75 原生复现，边界像素 DOM Canvas 为 `[255,0,0,16]`、OffscreenCanvas 为 `[0,0,0,0]`；因此不能混用 surface 类型再用宽松阈值掩盖差异。门禁保持整帧零差异，不证明两类原生 Canvas 边缘栅格化相同，也不外推到 #144 的 Canvas/GPU 合同。

隔离 surface 在 Calcit 遍历中使用 `CanvasLayerHost`，通过 `layer-create!` 检查有限正尺寸后创建；`layer-context!`/`composite-layer!` 只在三个原始 inline ABI 处转换 JsObject。不新增宿主文件或依赖，下游安装模块并编译即可携带片段。此类型是 js-ffi #147 的局部过渡方案，上游发布类型化平台入口后替换。既有浏览器门禁分别核验离屏与 DOM 回退的原生合成 RGBA 零差异、非空图像、transform/globalAlpha 恢复及非法尺寸拒绝。
