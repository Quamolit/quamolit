# Tidal Studio：图表 UI 的多组件出入场

`/demos/index.html?demo=tidal-bloom&t=5` 在统一页面的全屏 Canvas 中打开；`/examples/tidal-bloom/index.html?t=5` 是独立截图入口。保留 `tidal-bloom` URL ID，避免旧导航失效。

## 场景与组件

这不是抽象花纹，而是数据工作台的两个界面。概览屏包含项目卡片、任务队列和活动小图；分析屏包含三张 KPI 卡片、十二根逐次生长的趋势柱和三个渠道分项。全部节点由 `quamolit.examples.tidal-bloom` 的 Calcit 组件函数组成；宿主 JS 只管理时间、画布、浮层和 URL。

0–1.4 秒，概览卡片依次淡入、位移归位，同时布局、进度和文案渐变。3–4.16 秒，旧三组卡片依次淡出，退出结束后从 `SceneDocument` 删除；3.55 秒起新的 KPI、图表、渠道分项交错进入。4.2–6.32 秒，十二根柱图逐根长出。切换时短暂同时存在两屏节点，但最终仅保留分析屏。`scene-at(time)` 是绝对时间纯采样，乱序、倒放和分享固定时间链接均可复现。

`transition-node` 对矩形与文字统一处理透明度和位移，`transition-nodes` 把此动作施加到组件节点列表；具体组件只声明自己的几何和内容。概览进度仍由正式 `ComponentDeclaration` 和版本化 `ScalarDescriptor` 绑定宽度及文字透明度，再由 `sample-component-at` 求值。分析屏的其余编排目前使用 Calcit 纯组件函数与 `ScalarTween`，可为后续更通用的声明式 presence/transition API 提供真实需求。

这里展示的是固定两屏编排和真正的 Scene 节点增删，不是任意用户交互的完整生命周期，也未接入保留式 `ExecutionDeclaration`。Canvas2D 是参考绘制；本作品不宣称 WebGPU 加速或性能提升。下一步可将视图切换事件与可中断 Model 接入框架，让多次增删、重排、重入也保持稳定身份。

## 体验与检验

- 播放全程 8 秒；快捷点位为概览 `t=1.4`、切换中 `t=3.7`、图表生长 `t=5`、分析完成 `t=7`。滑块支持任意时间 seek，浮层可收起；缩减动态效果下不自动播放。
- `yarn test:tidal-bloom` 检查 Calcit 类型、编译、真实节点增删、错峰动画、几何与透明度、乱序重放，并保存 Chromium 固定时间截图。还验证 DPR 2 窄屏与全屏 Canvas。
- `yarn test:demo-nav` 检查统一导航、同页切换及原有 demo 回归。

截图位于 `test-results/tidal-bloom/`。视觉评审重点是切换阶段的新旧画面重叠是否可读、图表逐项进入是否明确，以及工作台在不同视口下是否仍完整呈现。
