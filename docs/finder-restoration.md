# Finder 植物档案恢复：M3 #36/#37/#34 切片

历史 `9b5bcdd` 的 Finder 有五组植物文件夹，打开时居中放大，其他文件夹淡出；每组的中文卡片可以继续居中放大，其他卡片淡出，再逐层返回。本切片保留五组名称和卡片文本，以 Calcit `FinderModel` 的两个 `TransitionIntent` 表达文件夹与卡片的目标，`scene-at (model time)` 生成 Scene 节点，`hit-at (model time x y)` 判断画布点击。页面 JS 只管理宿主时间、DOM、URL 与 Canvas 坐标逆变换。

`append-event` 校验非降序点击日志，`replay` 在任意时间从日志重建 Model；历史时刻新输入先截断未来事件。`select-folder`、`select-card`、`back` 使用 `interrupt-transition`，快速返回/重新进入从当前采样值接续。页面提供预设点击日志、手动点击、时间 seek 与包含日志的分享链接。逻辑构图为 1100 × 800 contain，全屏 Canvas 按视口和 DPR 更新实际像素；DOM 控制浮层可收起，桌面打开时构图避让浮层，窄屏默认收起。

卡片矩形和文字从同一个局部缩放比例计算字号与内边距。五组文件夹的初始、中间、聚焦帧均检查文字保持在父卡片内；视觉上不再像独立图层一样越界。

检验命令：

```sh
yarn test:finder-demo
yarn test:demo-nav
```

Node 检查五组中文内容、稳定节点 ID、卡片几何、命中、快速打断连续性、非法切换与日志乱序重放；Chromium 实际点击画布，保存初始/文件夹展开/卡片聚焦/预设中间帧，验证分享链接的 Scene 和 Canvas 像素一致、DPR 2 暂停 resize 与浮层。CI 上传 `test-results/finder/`。

当前是 Canvas2D 参考绘制，尚未接保留式组件计划或 WebGPU；无法在上一文件夹/卡片尚未关闭时直接切换到另一项。`hit-at` 为该示例的独立几何判定，不代表 #34 的通用命中索引、层序与指针捕获已完成。窄屏 contain 构图的文字/点击目标优化见 [#128](https://github.com/Quamolit/quamolit/issues/128)。其余 Table、Folding Fan、Drag demo 仍待恢复，M3 不关闭。
