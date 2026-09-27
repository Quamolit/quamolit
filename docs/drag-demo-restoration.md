# Drag demo 恢复：M3 #36/#34/#37 切片

历史 `9b5bcdd` 的 Drag demo 包含一个 100 × 60 的可拖动矩形与一个取值 -4 到 40 的滑块；滑块以每逻辑像素 0.2 单位更新。本切片保留这两个交互和原有的长标题。Calcit `DragModel` 保存矩形位置、数值、活动 pointer、锚点及滑块起始值；`hit-at`、`begin-pointer`、`move-pointer`、`end-pointer` 分离命中/状态与绘制，`scene-at` 生成稳定身份的 Canvas Scene。浏览器宿主只做原生 Pointer Capture、DPR、逆变换和 DOM 浮层。

拖动越出原图形边界后仍按捕获的指针更新；非拥有 pointer 不能移动或释放；`pointerup`、`pointercancel`、丢失捕获和窗口失焦均收尾一次。页面只在输入或尺寸变化时绘制，没有空闲动画循环。画布覆盖视口，浮层可收起；窄屏收起时增大 contain 比例。

```sh
yarn test:drag-demo
yarn test:demo-nav
```

Node 验证锚点、非拥有指针、滑块夹取、稳定 Scene ID 与非法输入；Chromium 用真实鼠标跨矩形边界拖动和滑动，验证捕获释放、取消、DPR 2 窄屏 resize、浮层及空闲停帧，并保存初始/拖动中/释放/滑块终点截图。它仍是 Canvas2D 参考和示例级几何命中；不证明 #34 通用命中索引与事件层序、WebGPU 绘制或移动触摸硬件体验，不能据此关闭 #36/#34/#37。
