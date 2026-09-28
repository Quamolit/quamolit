# Solar 递归轨道恢复：M3 #36 切片

推进 #36，恢复历史 `9b5bcdd` 的 `quamolit.app.comp.solar/comp-solar`。旧门户从 level 4 开始：每层一个半径 60 的大圆、偏移 `(100,-40)` 的半径 30 小圆；下一层在 0.6 倍坐标系中偏移 `(260,40)`（初层世界坐标为 `(156,24)`）。各层以每秒 100 度旋转。旧实现用 `d!` 累加 elapsed；新入口直接按绝对时间递归采样，允许乱序、重复与截图。

## Calcit 场景与页面

`quamolit.examples.solar/scene-at (time)` 返回五层共 10 个稳定 ID 的填充 `CircleNode`，逐层计算旋转后的圆心偏移，半径依次乘 0.6。大圆恢复浅黄绿色填充及半透明蓝边，小圆恢复浅蓝色填充。`draw!` 由 Canvas 参考绘制器通过 js-ffi 已有的类型化 `arc!` 调用原生圆弧。动画、圆体和递归变换全在 Calcit；`examples/solar/main.mjs` 只管理时间、全屏 Canvas 的 DPR/contain 变换、DOM 控件和截图接口。`?t=` 固定时间默认暂停，提供 0、1、3、10 秒按钮及分享链接。

## 检验

```sh
yarn test:solar-demo
yarn test:demo-nav
```

前者覆盖 Calcit 严格公共类型、Node 的几何/乱序重复采样、10 次原生 `arc` 调用，以及 Chromium 的初始/中间/结束“浮层 + Canvas”和纯 Canvas 截图、DPR 2 暂停 resize。截图在 CI 的 `test-results/solar/` artifact。导航测试要求 Solar 从 `planned` 移入 `entries` 并能从发布产物往返。

## 已知边界

- **已消除 48 边近似**：最大半径 60 的旧多边形弦高误差为 `60 * (1 - cos(PI/48)) ≈ 0.1285` 逻辑像素；4 倍放大且 DPR=2 时约 `1.0277` 设备像素。生产绘制改为原生 arc 后不再受该分段边界限制。
- 保留几何、GPU 路径与真实设备性能尚未实现；当前阶段按计划暂不做性能优化。
- 所有原有 demo 都有运行入口，但外观和过渡保真仍须逐项检验；本切片不单独关闭 #36 或 M3。
