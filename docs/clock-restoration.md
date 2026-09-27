# Clock 数字时钟恢复：M3 #36 切片

推进 #36，恢复一个月前 `9b5bcdd` 的 `quamolit.app.comp.clock` / `quamolit.app.comp.digits`：六位时分秒与七段笔画渐变。旧实现是 `defcomp` + 每帧 `d!` 的副作用与 `rand-shift` 随机散开；本切片改写为 Calcit 绝对时间声明，不读取当前墙钟。

## 公共 Calcit 入口（`quamolit.examples.clock`）

- `digits-at (time) -> List<Number>`：把秒数映射为 `[h十 h个 m十 m个 s十 s个]`，跨秒/分钟/小时进位并在 24 小时回绕。
- `scene-at (time) -> SceneDocument`：六位数字各七段折线；每段的描边透明度由当前位数与前一秒位数决定，在 0.25 秒窗口内确定性渐变（同开同关为 1，开→关渐隐到 0，关→开渐显到 1）。过渡时端点按旧版的 X ±120、Y ±160 范围散开，以位置、段和端点坐标为稳定 seed，随不透明度收拢；蓝青过渡色与稳定紫蓝色也恢复。
- `draw! (context time)`：Canvas 参考绘制整场景。
- 页面只注入逻辑时间、处理视口/DPR 与 DOM，不实现动画。

七段坐标沿用旧实现的 60 × 200 数字盒：横段在 y=0/100/200，竖段在 x=0/60 的上下半区；数字掩码与原 `comp-0`…`comp-9` 一致。

## 页面与全屏约定

`examples/clock/` 为全屏 Canvas + 可收起浮层：播放/暂停、0–120 秒滑块、`0/59/60/120` 固定时间按钮、复制当前时间链接。逻辑时间只来自滑块/播放，不读墙钟；`?t=` 直达固定时间并默认暂停，便于截图。视口与 DPR 变化只重绘，不推进时间。

## 验收与命令

```sh
yarn test:clock-demo
```

- `calcit analyze check-public --ns quamolit.examples.clock` 16/16；
- `calcit test --tag clock`：进位/回绕与稳定帧七段数（00:00:00 为 36、00:01:00 为 32）；
- Node `test/clock-smoke.mjs`：注入时钟进位、重复采样一致、渐变窗口内存在部分透明度、窗口结束后全开/全关；
- Playwright `test/clock.spec.mjs`：页面在 59.5/60/119.5/120 的位数、固定时间截图、重复采样一致，以及 DPR=2 窄屏 resize 不推进时间、浮层收起不误触。截图为 `test-results/clock/` 的 artifact。

## 与旧实现的差异与未完成

- **随机序列差异**：旧 `comp-stroke` 每次挂载临时抽取四个 `rand-shift`；新实现在相同范围内用稳定 seed，视觉保留散开/收拢，但与旧版单次运行的随机位置不会逐像素相同。
- **后端**：仅 Canvas 参考；GPU 路径与真实硬件证据未涉。
- **全部旧 Demo** 已有入口，但各自的历史视觉差异仍按 [保真核对](demo-fidelity-audit.md) 跟进；不能据此关闭 #36 或 M3。
