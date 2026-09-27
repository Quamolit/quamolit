# Folding Fan：原有荷花折扇恢复切片

推进 #36/#37，恢复历史 `quamolit.app.comp.folding-fan/comp-folding-fan` 的 650 × 432 荷花图片、24 个纵向裁剪片和 Toggle 开合。与旧入口逐帧加减状态不同，新 `quamolit.examples.folding-fan` 使用 Calcit `FanModel` 保存目标及 `TransitionIntent`，给定当前 Model 的显式时间可直接采样；连续 Toggle 从打断瞬间的采样姿态开始。每片的源区域、角度、绘制次序由 Calcit 决定，仅 Canvas `drawImage` 原生九参数调用使用定义级 inline FFI。图片创建、解码和尺寸读取复用 js-ffi 的 Calcit 类型化浏览器 API。通用 `drawImage` 类型化入口已向 [js-ffi #141](https://github.com/calcit-lang/js-ffi/issues/141) 提议；升级后应删除本地适配。

全屏 Canvas 按视口 × DPR 重设 backing store；650 × 432 是原图片与逻辑几何，不是固定页面尺寸。DOM 控制面板可收起，导航始终可用。`?t=` 与有序 `?events=0,0.18` 重放时间和 Toggle 输入，`window.foldingFanDemo` 提供固定时间、Toggle、快照与暂停，供截图与回归复用；`?image=missing` 验证解码失败时显式诊断。

```sh
yarn test:folding-fan
QUAMOLIT_DEMO_TEST_PORT=5192 yarn test:demo-nav
```

本切片验收：Calcit 严格公开 API、Node 24 切片源区域/层序/乱序时间/中途打断、Chromium 初始/中间/终点截图、实际像素、图片失败、DPR 2 暂停 resize、浮层与发布子路径导航。本地 `yarn test:folding-fan` 为 2 项 Node + 3 项 Chromium 通过；发布导航为 3 项 Node + 45 项 Chromium 通过，静态资源在 `/preview/` 子路径加载成功。

限制：尚未把图片节点接入公共 Scene IR、资源表或 WebGPU 纹理路径；分享链接记录 Toggle 时间，但多次 Toggle 后 seek 到较早输入之前，仍需要输入日志前缀重放/分支编辑的公共 Calcit 接口，见 [#132](https://github.com/Quamolit/quamolit/issues/132)。与历史视觉角度的像素级对照、缩放过滤质量、复杂遮挡语义及完整 M3 验收仍待 #53/#37，不以当前 Canvas 切片关闭 #36。
