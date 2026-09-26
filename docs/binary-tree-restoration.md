# Binary Tree：首个原有动画恢复切片

推进 #36/#37，消费 #31 的 `direct-frame` 公共入口、#35 的 js-ffi 0.2.0 类型化 Canvas 原语及 #109 的全屏约定。入口：`examples/binary-tree/index.html`，从导航“原有动画”可打开。

## 恢复内容与行为依据

历史提交 `9b5bcdd7f7157404fb96f96a042de91085e52652` 中 `quamolit.app.comp.binary-tree`：`comp-tree-waving` 把经过秒数乘以 10，再以深度 5 声明树；每层包含 `(80,-220) → (0,0) → (-140,-100)`，递归两条分支。复用原位移、缩放、角度、频率、青蓝色和 4 像素基础宽度。

新 `quamolit.examples.binary-tree/frame-at(time, depth)` 返回 `DirectFrame<List<StrokeSegment>>`，支持乱序、重复和负时间直接采样。深度限定整数 0–8（最大 1022 条线段），演示 UI 展示深度 5 的 126 条线段，时间控件限定 0–60 秒。不读取系统墙钟、不使用随机、不依赖上一帧。新的平头线段参考替代旧路径的圆头/圆连接，因此**递归动画可运行，但描边语义尚未完全还原**，#36 对应项暂不勾选完成。

绘制使用 `quamolit.canvas-strokes`：类型化线段经 Calcit 计算变换，再调用 `js-ffi.canvas-batches` 的原生 `save/transform/fillRect/restore`。没有新 JS 渲染模块，没有把 Quamolit 动画逻辑放进 js-ffi。CSS/DOM、rAF 时钟及视口适配属于页面胶水。

## 画布与控制

- 全页面 Canvas，DOM 面板独立浮层，可收起、滚动和键盘恢复，不占据画布布局宽度。
- 使用固定逻辑构图 contain，backing store 按视口 × DPR 更新；暂停后 resize/DPR 只重绘保留的帧，不再采样，也不改变时间。
- 支持播放、暂停、seek、回到起点；达到 60 秒停下，隐藏页面时停下。打开 `?t=2.5` 默认暂停，可分享精确时间；reduced-motion 默认暂停，用户仍可主动播放。
- 本例无画布点击目标，故不声称验证 #34 命中/捕获。浮层之外没有全屏 DOM 遮罩。

## 验证

```sh
yarn test:binary-tree
yarn test:demo-nav
```

第一条严格检查 11 个 Calcit 定义、原生测试和 3 项 Node 合同；独立 oracle 用旧版矩阵组合，不复制被测角度累加算法，对每一条分支的端点、宽度、ID 和颜色逐项核对（坐标误差 < 1e-10）。故意偏移分支的负例必须失败。拒绝非法深度/时间，核对 126 次宿主矩形调用与状态恢复。这是调用计数，不是性能测量。

导航门禁在真实静态产物上加入本页往返和动画用例：乱序时间画面对照、清空画布负例、播放暂停、分享链接刷新、reduced-motion、移动端/resize/浮层操作。画面对照使用独立 oracle 生成世界坐标四边形，以原生 path fill 绘制，不复用被测的局部 transform + fillRect；仅在两者实际覆盖像素内统计 alpha 误差（均值 < 4/255），禁止用大片空白稀释误差。原生 stroke 与 fill 的抗锯齿策略不同（初次对照均值 4.61/255），故改用相同平头几何的独立多边形参考，而非提高阈值。该对照不验证旧版圆头描边。截图与 CI artifact 随演示站点保存。

## 未完成与下一步

这不是 Scene IR path 的完整实现：当前每次时间采样会全量生成 126 个线段结构；暂停 resize 复用帧，但连续动画不具备保留式几何优化。不是 WebGPU，不提供加速结论。圆头/圆连接、通用 Path IR、拓扑保留和 GPU 路径由 #53/#50/#40 承接；不能据此关闭这些 issue 或 M2/M3。其他 10 个原有示例仍待恢复。下一切片应补原生路径类型化能力和同源 Scene 集成，不持续扩大旁路示例集合。

已向 [js-ffi #112 补充原生路径接口需求](https://github.com/calcit-lang/js-ffi/issues/112#issuecomment-5843758607)。待发布类型化 moveTo/lineTo/stroke 和 round 样式接口后重新验证，替换当前平头矩形近似；Quamolit 的动画与 Scene 遍历不迁往上游。此次不新增 Calcit 核心 issue，因为没有发现语言缺陷。
