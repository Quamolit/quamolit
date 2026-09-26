# Solar 递归轨道恢复：M3 #36 切片

推进 #36，恢复历史 `9b5bcdd` 的 `quamolit.app.comp.solar/comp-solar`。旧门户从 level 4 开始：每层一个半径 60 的大圆、偏移 `(100,-40)` 的半径 30 小圆；下一层在 0.6 倍坐标系中偏移 `(260,40)`（初层世界坐标为 `(156,24)`）。各层以每秒 100 度旋转。旧实现用 `d!` 累加 elapsed；新入口直接按绝对时间递归采样，允许乱序、重复与截图。

## Calcit 场景与页面

`quamolit.examples.solar/scene-at (time)` 返回五层共 10 个稳定 ID 的 `PolylineNode`。每圆 48 段加闭合点，共 49 点；逐层计算旋转后的偏移，大小依次乘 0.6。`draw!` 使用现有 Canvas 参考绘制器。动画、圆环顶点、递归变换全在 Calcit；`examples/solar/main.mjs` 只管理时间、全屏 Canvas 的 DPR/contain 变换、DOM 控件和截图接口。`?t=` 固定时间默认暂停，提供 0、1、3、10 秒按钮及分享链接。

## 检验

```sh
yarn test:solar-demo
yarn test:demo-nav
```

前者覆盖 Calcit 严格公共类型、两项原生测试、Node 的几何/乱序重复采样，以及 Chromium 的固定时间截图与 DPR 2 暂停 resize。截图在 CI 的 `test-results/solar/` artifact。导航测试要求 Solar 从 `planned` 移入 `entries` 并能从发布产物往返。

## 已知边界

- 现有 Scene IR 尚无圆弧图元，以 48 段闭合折线近似原 Canvas arc；当前是描边轨道，旧版实心填充及细节配色未完整恢复。
- 每次采样重建 490 个顶点。保留几何、分段画质策略、GPU 路径与真实设备性能尚未实现。
- Icons 已有独立恢复切片；其余五个原 demo（table、finder、raining、folding-fan、drag-demo）仍待恢复。本切片不关闭 #36 或 M3。
