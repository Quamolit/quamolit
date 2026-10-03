# Curve 动态闭合曲线恢复：M3 #36 切片

推进 #36，恢复一个月前 `9b5bcdd` 的 `quamolit.app.comp.ring`（旧门户 `:curve` 页）：32 段控制点的动态闭合曲线。旧实现是 `defcomp` + 每帧 `d!` 累加 `state += elapsed * 0.3`；本切片改写为 Calcit 绝对时间声明。

## 公共 Calcit 入口（`quamolit.examples.curve`）

- `curve-rotation (time) -> Number`：`raw = 0.3 * time`，按 `raw - 360 * floor(raw/360)` 取模（native `&number:rem` 只接受整数，故用 floor 实现浮点取模）。
- `curve-point (k time) -> List<Vec2>`：第 `k` 段（`k=1..32`）贡献三个控制点——两个外径 360 的点与一个内径 60 的点。这里严格恢复历史公式：`unit = 2 * PI / 32`，并继续经过旧实现的“度转弧度”三角函数；不再用语义猜测把 unit 改写为 11.25 度。
- `curve-points (time) -> List<Vec2>`：起始点 `(0,-60)` + 32 段 + 末尾重复起始点闭合，共 98 个控制点。
- `scene-at (time) -> SceneDocument`：使用新的 `CubicPathNode` 保留起点与 32 个 `CubicSegment`，线宽 1，颜色恢复历史 `hsl(300 80% 60%)` 对应的 `rgba(0.92,0.28,0.92,1)`。Canvas 参考绘制器通过 js-ffi 已有的类型化 `bezier-curve-to!` 调用原生三次贝塞尔；旧 16 步采样仅保留为独立误差基准，不再参与生产绘制。
- `draw! (context time)`：Canvas 参考绘制；页面只注入时间与视口。

三次路径与多边形描边明确使用 Canvas 默认的 butt 端点、miter 接头、miterLimit=10，不再继承调用方 context 的 square/round/bevel 设置；调用完成后恢复调用方样式。开放折线仍按已有 IR 合同使用 round 端点/接头。生产路径保持原生贝塞尔，不改变控制点或用折线替代；此约定只收紧端点/接头语义，不是任意 Canvas 状态（如外部 dash/filter）的完整隔离承诺。

多边形命中在 `quamolit.scene-hit` 使用纯 Calcit 的闭合描边几何，而不是开放圆头折线：包括末点到首点的边、miter 外角以及超过 miterLimit=10 后的 bevel 回退。相邻重复点与重复闭合端点先归并，零宽或全重合不产生描边区域。原有填充区域命中、显式 target 与透明度策略不变；没有新增 Canvas/JS 命中器。

## 三次曲线命中候选（#34，尚未合并）

`compile-hit-plan` 在 Calcit 中准备 `HitCandidate` / `CubicStrokePart`：de Casteljau 自适应细分，局部平坦度预算为 `min(1,width)/1024`，额外约束端点切线及描边方向。段间接头使用原始切线；零导数沿下一非重合控制点恢复方向。共线段解析求导数根，按参数次序保存真实极值，回折尖点增加圆形覆盖，不扩大到控制点凸包。全重合没有描边；起终点重合仍是开放路径，不暗中 `closePath`。

几何只在计划编译时准备，指针查询复用它；便利入口 `local-hit?` / `hit-test` 仍自行编译。Node 对原始控制段安装读取失败保护后连续查询1000次，并用便利入口触发失败作为负例，验证查询没有重新细分。这里是语义/复用计数，不是性能达标。递归预算20层，耗尽明确抛出 `cubic-hit-precision-exhausted`，不能静默采用固定16段。非共线尖点、极端坐标和全精度域仍待扩展验收。

几何参考需区分原生近似：[已记录的 #34 反例](https://github.com/Quamolit/quamolit/issues/34#issuecomment-5962052428)中，默认尺度 `isPointInStroke` 把距中心线10.010778的点判入半宽10，同时漏掉细曲线的12/32个精确中心点。现有浏览器门禁另外把控制点、线宽和查询坐标一起放大64倍，作为几何参考；固定边界带仍为1/32局部CSS px，不扩大容差。默认尺度结果另报，并强制保留已知拱形点与细曲线反例，不能宣称默认原生命中零差异。生产原生绘制及原RGBA零差异门禁不变；这不是跨后端画质或所有曲线精度的验收。

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
- 同一门禁新增闭合描边命中对照：8类方向/锐角/重复/退化/零宽夹具，每类3321个确定性点，DPR1/2分别与原生 `isPointInPath`/`isPointInStroke` 完全一致；原开放圆头算法负例必须失败。原生 Calcit 测试覆盖闭合边、外角、退化、旋转/缩放后的逆投影及祖先裁剪。点采样报告写入忽略的 `test-results/curve/`，沿用现有 artifact；这不证明任意自交填充规则、所有数值边界或 cubic 全精度域完成。

## 边界误差与未完成

- **已消除 16 步近似**：在 `t=30` 对每段取 1024 个密集参考点，旧 16 步折线的最大几何边界误差约 `0.1301` 逻辑像素；4 倍放大且 DPR=2 时约 `1.0404` 设备像素。验收要求该旧误差明确大于 1px，同时生产绘制必须是 32 次原生 cubic 调用。
- **旧门户的 `comp-debug`/hud 文本**未恢复；曲线本体不含调试文字。
- **几何保留/GPU**：每帧仍生成 98 个控制点，尚未做几何保留、批量或 GPU 路径；当前阶段按计划暂不做性能优化。
- **全部旧 Demo** 已有入口，但各自的历史视觉差异仍按 [保真核对](demo-fidelity-audit.md) 跟进；不能据此关闭 #36 或 M3。
