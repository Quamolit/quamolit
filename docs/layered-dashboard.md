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

本批未优化时间帧Scene/绑定分配或全ID访问；现有文字使用内置monospace，不证明#51的外部字体/图片资源租约与退出并发。WebGPU一般组不支持，硬件及性能结论未新增；#34/#53/M3不能因此关闭。

## 图表子组件的独立出入

同一浮层新增“隐藏图表／恢复图表”，不另建demo。它只改变chart子树的声明，标题、指标与信号块保持可见；默认柱图0.6秒淡出期间仍有28节点，终点结算后剩19节点，重入恢复28节点。`VisibilityEvent` 同时保存visible/chart-visible/line-chart，各操作保留其他意图；增量播放、乱序seek与历史分支使用同一Calcit日志，不在JS维护另一套动画状态。`setChartVisible`是对应的页面入口，重置恢复全部内容。

组件使用显式的 `declare-tree-coalesced`，所有者配置为dashboard/chart及七个bar逻辑ID：整组卸载产生相同phase/tween时只由父级承担淡化；子图表单独退出时由chart承担。已有独立子动画不会被父级删除重启或抹掉，例如图表t=1开始退出、看板t=1.3退出，图表仍在t=1.6到终点，父级在t=1.9结束。旧 `declare-tree` 的有意双乘行为保留，规则与限制见[组件合同](presence-component.md)。直接采样未结算小数终点需要#217的精确tween端点修复，本切片以该PR的已实现候选为明确前置，尚非已合并主线交付。

“切换折线图／切换柱状图”声明真正的类型替换：七个rect退出、沿用bar-1逻辑key的polyline进入，29节点过渡至22节点。完整kind/path生成不同渲染身份，旧rect继续绘制但立即disabled，其原生捕获随Scene提交释放。视口投影只替换同类型内容，不能用当前rect覆盖尚在Model中的polyline。应用明确折线叠在柱图之上，正反打断均保持该声明层序；这不是renderer为合批重排任意透明节点。DPR1/2验证0.5中间帧、快速切回整Canvas像素完全相等、终点停帧、乱序重放及折线隐藏/恢复；完整类型/重排矩阵仍未验收。

真实DPR1/2门禁新增子图表capture中的resize+退出同次提交、捕获立即释放一次、退出终点停帧、快速重入的稳定身份/内容与整Canvas像素不变。子树消失后不能恢复旧capture，但其余看板目标继续有效；不把父级背景交互误称为图表仍可命中。100次19↔28节点往返、父子意图组合与原有整看板RGBA零差异回归保留，生成截图仍放忽略artifact。font/image联合、完整换类型/重排矩阵、GPU及性能仍未因此验收。

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
| instances | 此 document 入口明确拒绝；另用版本化实例入口 | 独立实例图层另有支持合同，不自动插入任意嵌套 Scene |

`content-supported?` 是纯 Calcit 种类查询，不验证图元数值或资源 ready。`unsupported-nodes(document)` 返回有序 `List<quamolit.scene-ir/SceneDiagnostic>`（id/key/kind/reason），目前 instances 的原因是 `unsupported-canvas-scene-instances`；GPU 的 `diagnose-plan(plan)` 使用同一个类型，保留自己的后端原因。调用者可展示诊断或选择完整实例层入口，不丢弃节点继续绘制。`preflight!` 先检查尺寸、完整 Scene 合法性和全部不支持种类，再解析图片资源，任何失败发生在第一次 Canvas 操作之前。图片丢失或尺寸不匹配仍使用已有资源错误，不把资源状态伪装为种类不支持。原候选的 CanvasDiagnostic 尚未发布，在同一 PR 收敛为共享类型，不保留重复别名。

独立消费者在同一页面提供“嵌套图表与隔离透明度”，通过公共 Calcit 保留计划采样组透明度与柱条宽度，再调用 `draw-document!`。测试沿现有 `test:consumer` 检查全部9种 Scene 标签的能力表、id/key诊断、失败前零 Canvas 调用、1000帧结构共享、同时间Model失效，以及独立原生Canvas的整图像素；不是新增 renderer，也不证明这些组语义已在 GPU 实现。

同一消费者的 `primitive-document(time)` 用 Calcit 声明8种 document 支持图元的真实 payload（group/rect/polyline/text/image/polygon/cubic-path/circle）；`draw-primitives!` 通过公共模块绘制，与图表共用一个纯 Calcit 布局函数。现有无GPU浏览器门禁在同一Canvas上检查5个乱序时间、固定尺寸与全屏DPR1/2，逐通道比较独立原生参考，不从Scene数据生成参考；绘制前后声明不变。JS测试只创建8×8图片宿主和期望画面，不是库的实现或新增demo。图片缺失/尺寸不符的Node反例使用不可访问Canvas替身，要求零宿主调用；instances仍明确拒绝。结果位于原报告的 `layeredCanvas.primitives` 与各fullscreen记录的 `primitives`，截图仍为忽略artifact。这补齐合法图元实际绘制证据，不把种类查询当资源验证，不外推到任意路径/字体排版或GPU完整语义。

像素参考独立计算动画、矩阵、裁剪和组合成，但与实际后端采用同类隔离 surface（可用时 OffscreenCanvas，否则 DOM Canvas），最终绘制到 DOM Canvas。Chromium 上以 scale=3.125、clip 顶边 y=343.75 原生复现，边界像素 DOM Canvas 为 `[255,0,0,16]`、OffscreenCanvas 为 `[0,0,0,0]`；因此不能混用 surface 类型再用宽松阈值掩盖差异。门禁保持整帧零差异，不证明两类原生 Canvas 边缘栅格化相同，也不外推到 #144 的 Canvas/GPU 合同。

隔离 surface 在 Calcit 遍历中使用 `CanvasLayerHost`，通过 `layer-create!` 检查有限正尺寸后创建；`layer-context!`/`composite-layer!` 只在三个原始 inline ABI 处转换 JsObject。不新增宿主文件或依赖，下游安装模块并编译即可携带片段。此类型是 js-ffi #147 的局部过渡方案，上游发布类型化平台入口后替换。既有浏览器门禁分别核验离屏与 DOM 回退的原生合成 RGBA 零差异、非空图像、transform/globalAlpha 恢复及非法尺寸拒绝。
