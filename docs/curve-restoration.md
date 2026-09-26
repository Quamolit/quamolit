# Curve 动态闭合曲线恢复：M3 #36 切片

推进 #36，恢复一个月前 `9b5bcdd` 的 `quamolit.app.comp.ring`（旧门户 `:curve` 页）：32 段控制点的动态闭合曲线。旧实现是 `defcomp` + 每帧 `d!` 累加 `state += elapsed * 0.3`；本切片改写为 Calcit 绝对时间声明。

## 公共 Calcit 入口（`quamolit.examples.curve`）

- `curve-rotation (time) -> Number`：`raw = 0.3 * time`，按 `raw - 360 * floor(raw/360)` 取模（native `&number:rem` 只接受整数，故用 floor 实现浮点取模）。
- `curve-point (k time) -> List<Vec2>`：第 `k` 段（`k=1..32`）贡献三个控制点——两个外径 360 的点（角度 `θ ± rotation` 附近）与一个内径 60 的点。角度以度计，`sin`/`cos` 经 `curve-degree (= PI/180)` 转弧度。
- `curve-points (time) -> List<Vec2>`：起始点 `(0,-60)` + 32 段 + 末尾重复起始点闭合，共 98 个控制点。
- `scene-at (time) -> SceneDocument`：单条 `PolylineNode`，线宽 1，颜色 `rgba(0.7,0.2,0.9,1)`。
- `draw! (context time)`：Canvas 参考绘制；页面只注入时间与视口。

## 页面与全屏约定

`examples/curve/` 为全屏 Canvas + 可收起浮层：播放/暂停、0–120 秒滑块、`0/30/60/120` 固定时间、复制当前时间链接。`?t=` 直达并默认暂停，便于截图；视口/DPR 变化只重绘不推进时间。

## 验收与命令

```sh
yarn test:curve-demo
```

- `calcit analyze check-public --ns quamolit.examples.curve` 10/10；
- `calcit test --tag curve`：闭合控制点数 98、重复采样一致；
- Node `test/curve-smoke.mjs`：顶点数与确定性、旋转随时间改变顶点、Scene 为单条折线且顶点等于曲线采样；
- Playwright `test/curve.spec.mjs`：页面固定时间顶点数/截图、重复采样一致，DPR=2 窄屏 resize 不推进时间、浮层收起不误触。截图为 `test-results/curve/` 的 artifact。

## 与旧实现的差异与未完成

- **角度单位重建**：旧 `comp-ring` 的 `&PI`/度数单位在历史版本中有歧义；本切片按语义重建为「角度以度计、经 PI/180 转弧度」，`rotation` 为度。若与旧画面存在差异，以本仓库固定时间截图为准并在此记录。
- **旧门户的 `comp-debug`/hud 文本**未恢复；曲线本体不含调试文字。
- **几何保留/GPU**：每帧重建 98 点，尚未做几何保留、批量或 GPU 路径。
- **其余 demo**：clock、solar、table、finder、raining、icons、folding-fan、drag-demo 仍待恢复；不能据此关闭 #36 或 M3。
