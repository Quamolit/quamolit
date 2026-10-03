# Drag demo 恢复：M3 #36/#34/#37 切片

历史 `9b5bcdd` 的 Drag demo 包含一个 100 × 60 的可拖动矩形与一个取值 -4 到 40 的滑块；滑块以每逻辑像素 0.2 单位更新。本切片保留这两个交互和原有的长标题。Calcit `DragModel` 保存矩形位置、数值、活动 pointer、锚点及滑块起始值；`hit-at`、`begin-pointer`、`move-pointer`、`end-pointer` 分离状态与绘制，`scene-at` 生成稳定身份且带 target 的 Canvas Scene。

本 demo 已实际接入 `Scene HitPlan`、纯 Calcit `PointerState` 与类型化浏览器桥：Calcit 安装和卸载 pointer/lost-capture/blur/pagehide 监听器，统一决定捕获、释放、坐标逆变换及 Model 更新；页面 JavaScript 只保留 Canvas backing size、DPR 绘制、DOM 浮层与测试快照。卸载协议会先释放仍持有的原生 capture，再移除全部监听器，卸载后的事件不能继续修改 Model。

拖动越出原图形边界后仍按捕获的指针更新；非拥有 pointer 不能移动或释放；`pointerup`、`pointercancel`、丢失捕获和窗口失焦均收尾一次。页面只在输入或尺寸变化时绘制，没有空闲动画循环。画布覆盖视口，浮层可收起；窄屏收起时增大 contain 比例。

“禁用交互”通过 Calcit Model 的 `enabled?` 将原四个图元设为 `SceneInteraction :disabled`，不移除图形或改变历史几何。`commit-drag-scene!` 在 Model/尺寸提交时调用既有 `reconcile-pointer-surface!`，立即协调逻辑状态和原生捕获；禁用后不等待新输入即可结束拖动，重复提交不重复释放，恢复后须重新按下。重置/预设也先释放旧捕获，再替换 Model。这个实际应用入口不新增事件系统或生产 JS 桥；DPR1/2 浏览器检查捕获中的禁用与 resize、重入、重置和两秒停帧。它不是完整嵌套 Presence 退出动画的验收。

```sh
yarn test:drag-demo
yarn test:demo-nav
```

Node 验证锚点、非拥有指针、滑块夹取、稳定 Scene ID 与非法输入；Chromium 用真实鼠标跨矩形边界拖动和滑动，验证捕获释放、取消、DPR 2 窄屏 resize、浮层、空闲停帧及实际 demo 卸载，并保存初始/拖动中/释放/滑块终点截图。它仍是 Canvas2D 参考；不证明 WebGPU 绘制、移动触摸硬件体验、任意嵌套退出子树或 cubic-path/instances 命中，不能据此关闭 #36/#34/#37。
