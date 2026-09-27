# Folding Fan：原有荷花折扇恢复切片

推进 #36/#37，恢复历史 `quamolit.app.comp.folding-fan/comp-folding-fan` 的 650 × 432 荷花图片、24 个纵向裁剪片和 Toggle 开合。与旧入口逐帧加减状态不同，新 `quamolit.examples.folding-fan` 使用 Calcit `FanModel` 保存目标及 `TransitionIntent`，给定当前 Model 的显式时间可直接采样；连续 Toggle 从打断瞬间的采样姿态开始。现在 `scene-at(model,time)` 将每片变成纯数据 `SceneContent :image`，稳定 key、版本化资源、矩阵和九参数裁剪均由 Calcit 决定，再由公共 `canvas-images/draw-document!` 按声明顺序绘制。Canvas 原生九参数 `drawImage` 由 js-ffi `0.2.1-alpha.9` 的类型化 `draw-image-crop!` 提供；图片创建、解码和尺寸读取也复用 js-ffi 的 Calcit 类型化浏览器 API。本地强转与 inline 适配均不再需要，通用能力见 [js-ffi #141](https://github.com/calcit-lang/js-ffi/issues/141)。

全屏 Canvas 按视口 × DPR 重设 backing store；650 × 432 是原图片与逻辑几何，不是固定页面尺寸。DOM 控制面板可收起，导航始终可用。`?t=` 与有序 `?events=0,0.18` 重放时间和 Toggle 输入，`window.foldingFanDemo` 提供固定时间、Toggle、快照与暂停，供截图与回归复用；`?image=missing` 验证解码失败时显式诊断。

输入日志由 Calcit 的 `FanEvent`、`append-event`、`events-through`、`branch-toggle` 与 `replay` 维护。任意 seek 只重放时间不晚于目标时刻的事件，同一时间的多个 Toggle 保留插入顺序；从历史时间点击时保留该时刻及之前的事件，截断未来，再追加当前 Toggle。日志最多 100 条，时间须有限、非降序且处于 0–120 秒。页面 JS 只解析 URL、驱动时钟、DOM 和图片资源，不再保存最后一个 Model 来冒充历史画面。

```sh
yarn test:folding-fan
QUAMOLIT_DEMO_TEST_PORT=5192 yarn test:demo-nav
```

本切片验收：Calcit 严格公开 API、Node 24 切片源区域/层序/乱序时间/中途打断、100 条事件容量与历史分支、Scene JSON 往返及几何差分、资源尺寸失败零绘制；Chromium 初始/中间/终点与历史分支截图、URL 刷新像素一致、图片失败、DPR 2 暂停 resize、浮层与发布子路径导航。此参考入口每帧仍完整构造 Scene 并遍历 24 片，重放至多 100 条输入；不宣称已达到 #50 的保留执行计划或 WebGPU 纹理复用，这些性能工作留给后续里程碑。

限制：图片节点已接入公共 Scene IR 和 Canvas 资源解析，但 WebGPU 纹理路径未完成；输入日志合同目前落在折扇示例，尚未抽成通用组件 API。与历史视觉角度的像素级对照、缩放过滤质量、复杂遮挡语义及完整 M3 验收仍待 #53/#37，不以当前 Canvas 切片关闭 #36。
