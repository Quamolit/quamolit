# Metric Flow：图表 UI 的多组件出入场

`/demos/index.html?demo=tidal-bloom` 在统一页面的全屏 Canvas 中打开交互演示；无 `t` 时自动从概览切向分析（缩减动态效果除外），可随时点按钮反向。`?t=5` 和 `/examples/tidal-bloom/index.html?t=5` 是固定时间截图入口。作品现名 Metric Flow；`tidal-bloom` 仅作为历史 URL、源码目录及测试入口保留，避免旧链接失效。

## 场景与组件

这不是抽象花纹，而是数据工作台的两个界面。概览屏包含项目卡片、任务队列和活动小图；分析屏包含三张 KPI 卡片、十二根逐次生长的趋势柱和三个渠道分项。全部节点由 `quamolit.examples.tidal-bloom` 的 Calcit 组件函数组成；宿主 JS 只管理时间、画布、浮层和 URL。

0–1.4 秒，概览卡片依次淡入、位移归位，同时布局、进度和文案渐变。3–4.16 秒，旧三组卡片依次淡出，退出结束后从 `SceneDocument` 删除；3.55 秒起新的 KPI、图表、渠道分项交错进入。4.2–6.32 秒，十二根柱图逐根长出。切换时短暂同时存在两屏节点，但最终仅保留分析屏。`scene-at(time)` 是绝对时间纯采样，乱序、倒放和分享固定时间链接均可复现。

`transition-node` 对矩形与文字统一处理透明度和位移，`transition-nodes` 把此动作施加到组件节点列表；具体组件只声明自己的几何和内容。概览进度仍由正式 `ComponentDeclaration` 和版本化 `ScalarDescriptor` 绑定宽度及文字透明度，再由 `sample-component-at` 求值。分析屏的其余编排目前使用 Calcit 纯组件函数与 `ScalarTween`，可为后续更通用的声明式 presence/transition API 提供真实需求。

## 交互切换

“打开概览 / 打开分析”是实际输入，不是跳转到时间轴预设点。Calcit `MetricFlowModel` 保存初始位置、带 key 的 `TransitionIntent` 和有序事件；`set-view` 在输入时间采样当前姿态后重新建立 tween，因此切换中反向不会跳变。`view-position-at` 可以乱序重放事件前缀。`interactive-scene-at` 把位置转换为两屏组件的错峰进退场：项目卡片、队列、活动图依次卸载，KPI、柱图、渠道卡片分段加入；到两端时仅保留当前屏节点。终点后宿主停止请求连续帧，新输入再唤醒。

分析屏另有独立的 `ChartSeriesModel`：访客／营收按钮触发 `set-series`，12 根柱子的稳定节点 ID 不变，高度和颜色由 Calcit 在任意时刻插值；切换中再次点击可从当前位置反向。交互宿主使用 `interactive-scene-with-series-at`，原 `interactive-scene-at` 保持旧调用方兼容。视图与数据系列使用同一逻辑时钟，但分别保存事件，任何一个过渡未结束就继续绘帧。固定时间轴仍展示原始访客数据，不受交互系列影响。

原 0–8 秒固定时间轴继续作为视觉回归和演示回放；点击固定点或滑块会切回此模式。交互模式的“播放”会继续当前过渡，已停帧时切向另一屏。“复制当前画面链接”保存 `progress` 与 `seriesProgress`，可复原该中间画面，但目前不保存完整事件历史。两份事件日志分别上限为 2000 条，后续应接有界检查点。Canvas2D 是参考绘制；尚未接入保留式 `ExecutionDeclaration`、真实资源与指针捕获释放或 WebGPU 绘制，不宣称性能提升。下一阶段再将这些作品内的进退场规则抽成通用 Calcit 组件 API。

## 体验与检验

- 视图与数据系列按钮可反复切换；固定回放全程 8 秒，快捷点位为概览 `t=1.4`、切换中 `t=3.7`、图表生长 `t=5`、分析完成 `t=7`。滑块支持任意时间 seek，浮层可收起；缩减动态效果下不自动播放。
- `yarn test:tidal-bloom` 检查 Calcit 类型、编译、打断连续性、事件重放、100 次往返、真实节点增删、错峰动画、终点停帧，并保存 Chromium 固定时间及交互截图。还验证 DPR 2 窄屏与全屏 Canvas。
- `yarn test:demo-nav` 检查统一导航、同页切换及原有 demo 回归。

截图位于 `test-results/tidal-bloom/`。视觉评审重点是切换阶段的新旧画面重叠是否可读、图表逐项进入是否明确，以及工作台在不同视口下是否仍完整呈现。

后续作品可从折线/面积图的路径生长、堆叠图的数据重排、热力图的筛选进退场中选择不同构图；每件都应有实际 UI 状态变化和独立的 Calcit 组件声明，而不是只把本页柱图换色或改数据。
