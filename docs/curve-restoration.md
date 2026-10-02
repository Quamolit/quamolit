# Curve 动态闭合曲线恢复：M3 #36 切片

推进 #36，恢复一个月前 `9b5bcdd` 的 `quamolit.app.comp.ring`（旧门户 `:curve` 页）：32 段控制点的动态闭合曲线。旧实现是 `defcomp` + 每帧 `d!` 累加 `state += elapsed * 0.3`；本切片改写为 Calcit 绝对时间声明。

## 公共 Calcit 入口（`quamolit.examples.curve`）

- `curve-rotation (time) -> Number`：`raw = 0.3 * time`，按 `raw - 360 * floor(raw/360)` 取模（native `&number:rem` 只接受整数，故用 floor 实现浮点取模）。
- `curve-point (k time) -> List<Vec2>`：第 `k` 段（`k=1..32`）贡献三个控制点——两个外径 360 的点与一个内径 60 的点。这里严格恢复历史公式：`unit = 2 * PI / 32`，并继续经过旧实现的“度转弧度”三角函数；不再用语义猜测把 unit 改写为 11.25 度。
- `curve-points (time) -> List<Vec2>`：起始点 `(0,-60)` + 32 段 + 末尾重复起始点闭合，共 98 个控制点。
- `scene-at (time) -> SceneDocument`：使用新的 `CubicPathNode` 保留起点与 32 个 `CubicSegment`，线宽 1，颜色恢复历史 `hsl(300 80% 60%)` 对应的 `rgba(0.92,0.28,0.92,1)`。Canvas 参考绘制器通过 js-ffi 已有的类型化 `bezier-curve-to!` 调用原生三次贝塞尔；旧 16 步采样仅保留为独立误差基准，不再参与生产绘制。
- `draw! (context time)`：Canvas 参考绘制；页面只注入时间与视口。

三次路径与多边形描边明确使用 Canvas 默认的 butt 端点、miter 接头、miterLimit=10，不再继承调用方 context 的 square/round/bevel 设置；调用完成后恢复调用方样式。开放折线仍按已有 IR 合同使用 round 端点/接头。生产路径保持原生贝塞尔，不改变控制点或用折线替代；此约定只收紧端点/接头语义，不是任意 Canvas 状态（如外部 dash/filter）的完整隔离承诺，也不代表 cubic-path 命中已实现。

## 页面与全屏约定

`examples/curve/` 为全屏 Canvas + 可收起浮层：播放/暂停、0–120 秒滑块、`0/30/60/120` 固定时间、复制当前时间链接。`?t=` 直达并默认暂停，便于截图；视口/DPR 变化只重绘不推进时间。

## 验收与命令

```sh
yarn test:curve-demo
```

- `calcit analyze check-public --ns quamolit.examples.curve` 17/17；
- `calcit test --tag curve`：闭合控制点数 98、重复采样一致；
- Node `test/curve-smoke.mjs`：顶点数与确定性、Scene 的 32 个原生 cubic segment、实际发出 32 次 `bezierCurveTo`、描边时的显式端点/接头与调用后状态恢复，以及旧 16 步折线的边界误差；
- Playwright `test/curve.spec.mjs`：初始/中间/结束三阶段分别保留“浮层 + Canvas”和纯 Canvas 截图，重复采样一致，DPR=2 窄屏 resize 不推进时间、浮层收起不误触。截图为 `test-results/curve/` 的 artifact。
- 同一 Playwright 门禁还在 DPR 1/2 下对照独立原生 Canvas 的三次折角与闭合多边形：正常路径全 RGBA 零差异；继承 square/bevel/miterLimit=1 的旧行为必须被像素负例检出。夹具留在主 Snapshot 的测试 namespace，不新增公开 JS、renderer、测试命令或 CI job。

## 边界误差与未完成

- **已消除 16 步近似**：在 `t=30` 对每段取 1024 个密集参考点，旧 16 步折线的最大几何边界误差约 `0.1301` 逻辑像素；4 倍放大且 DPR=2 时约 `1.0404` 设备像素。验收要求该旧误差明确大于 1px，同时生产绘制必须是 32 次原生 cubic 调用。
- **旧门户的 `comp-debug`/hud 文本**未恢复；曲线本体不含调试文字。
- **几何保留/GPU**：每帧仍生成 98 个控制点，尚未做几何保留、批量或 GPU 路径；当前阶段按计划暂不做性能优化。
- **全部旧 Demo** 已有入口，但各自的历史视觉差异仍按 [保真核对](demo-fidelity-audit.md) 跟进；不能据此关闭 #36 或 M3。
