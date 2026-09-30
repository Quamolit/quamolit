# Folding Fan：原有荷花折扇恢复切片

推进 #36/#37，恢复历史 `quamolit.app.comp.folding-fan/comp-folding-fan` 的 650 × 432 荷花图片、24 个纵向裁剪片和 Toggle 开合。与旧入口逐帧加减状态不同，新 `quamolit.examples.folding-fan` 使用 Calcit `FanModel` 保存目标及 `TransitionIntent`，给定当前 Model 的显式时间可直接采样；连续 Toggle 从打断瞬间的采样姿态开始。现在 `scene-at(model,time)` 将每片变成纯数据 `SceneContent :image`，稳定 key、版本化资源、矩阵和九参数裁剪均由 Calcit 决定，再由公共 `canvas-images/draw-document!` 按声明顺序绘制。Canvas 原生九参数 `drawImage` 由 js-ffi `0.2.1-alpha.10` 的类型化 `draw-image-crop!` 提供；图片创建、解码和尺寸读取也复用 js-ffi 的 Calcit 类型化浏览器 API。本地强转与 inline 适配均不再需要，通用能力见 [js-ffi #141](https://github.com/calcit-lang/js-ffi/issues/141)。

图片的 loading/ready/error、失败重试、generation 隔离和卸载现由纯 Calcit [`quamolit.resource-lifecycle`](resource-lifecycle.md)、[统一加载队列](resource-load-queue.md)与[图片资源 runner](image-resource-runner.md)共同决定。`ImageHost` 创建、解码、尺寸验证、generation 表、安装和逻辑释放均由 Calcit 调用 js-ffi 类型化 API；页面只提供 URL、时钟、视口和 DOM。迟到 Promise 不能覆盖新版本或已关闭页面。

全屏 Canvas 按视口 × DPR 重设 backing store；650 × 432 是原图片与逻辑几何，不是固定页面尺寸。DOM 控制面板可收起，导航始终可用。`?t=` 与有序 `?events=0,0.18` 重放时间和 Toggle 输入，`window.foldingFanDemo` 提供固定时间、Toggle、快照与暂停，供截图与回归复用；`?image=missing` 验证解码失败时显式诊断。

输入日志由 Calcit 的 `FanEvent`、`append-event`、`events-through`、`branch-toggle` 与 `replay` 维护。任意 seek 只重放时间不晚于目标时刻的事件，同一时间的多个 Toggle 保留插入顺序；从历史时间点击时保留该时刻及之前的事件，截断未来，再追加当前 Toggle。日志最多 100 条，时间须有限、非降序且处于 0–120 秒。页面 JS 只解析 URL、驱动时钟和 DOM，不再保存最后一个 Model 或实现图片资源状态机。

```sh
yarn test:folding-fan
QUAMOLIT_DEMO_TEST_PORT=5192 yarn test:demo-nav
```

本切片验收：Calcit 严格公开 API、Node 24 切片源区域/层序/乱序时间/中途打断、100 条事件容量与历史分支、Scene JSON 往返及几何差分、图片队列成功/失败/取消、100 次宿主装卸和资源尺寸失败零绘制；Chromium 初始/中间/终点与历史分支截图、URL 刷新像素一致、图片失败、DPR 2 暂停 resize、浮层与发布子路径导航。初始、半开和全开各自同时保存带 DOM 浮层与纯 Canvas PNG，避免浮层遮挡误判画面；半开状态另保存 DPR 2 的两类产物。

历史像素参考直接复现 `9b5bcdd:compact.cirru` 的绘制顺序：索引 0–23 依次取 `650 / 24` 的纵向源区域，以切片顶边中心为原点，使用 Calcit 计算的 `sin/cos` 仿射矩阵叠加。Chromium 在固定 1280 × 720 / DPR 1 与 1280 × 900 / DPR 2 视口中，把当前 Scene 路径和该参考路径的完整 RGBA 逐像素比较，要求差异像素数和最大通道差都为 0；同时锁定历史浏览器默认的 `imageSmoothingEnabled = true`、`imageSmoothingQuality = low`。这项门禁同时覆盖缩放过滤、分数源切片、透明接缝和重叠层序，不用主观截图替代。

此参考入口每帧仍完整构造 Scene 并遍历 24 片，重放至多 100 条输入；不宣称已达到 #50 的保留执行计划或 WebGPU 纹理复用，这些性能工作留给后续里程碑。

限制：图片节点已接入公共 Scene IR 和 Canvas 资源解析，但 WebGPU 纹理路径未完成；输入日志合同目前落在折扇示例，尚未抽成通用组件 API。当前像素对照证明 Chrome/Canvas2D 在上述固定视口与 DPR 下等同历史路径，不外推 Safari/Firefox、任意显卡驱动或 WebGPU 纹理采样；完整跨后端图片、复杂遮挡语义及 M3 其他能力仍由 #53/#37 承接。
