# Binary Tree：首个原有动画恢复切片

当前默认入口已升级为[统一组件执行计划](retained-component.md)：静态 Scene、拓扑和局部几何共享，时间只更新变换；深度变化走统一版本失效入口。下文 `frame-at` 与 `scene-at` 是保留的全量参考，不再是默认播放路径。

推进 #36/#37/#53，消费 #31 的 `direct-frame` 公共入口、#35 的 js-ffi 0.2.1-alpha.1 类型化 Canvas 原生路径及 #109 的全屏约定。入口：`examples/binary-tree/index.html`，从导航“原有动画”可打开。

## 恢复内容与行为依据

历史提交 `9b5bcdd7f7157404fb96f96a042de91085e52652` 中 `quamolit.app.comp.binary-tree`：`comp-tree-waving` 把经过秒数乘以 10，再以深度 5 声明树；每层包含 `(80,-220) → (0,0) → (-140,-100)`，递归两条分支。复用原位移、缩放、角度、频率、青蓝色和 4 像素基础宽度。

`quamolit.examples.binary-tree/frame-at(time, depth)` 现在返回 `DirectFrame<List<RoundPolyline>>`，支持乱序、重复和负时间直接采样。深度限定整数 0–8（最大 511 条路径）；深度 5 为 63 条三点路径、126 条边，UI 时间为 0–60 秒。不读取系统墙钟、不使用随机、不依赖上一帧。每个分叉一次 stroke，恢复圆头与圆连接，不是给两条边分别加圆头。帧消费者需从旧 StrokeSegment 改读 points；旧独立线段绘制 API 保留。结构复用尚未完成，#36 对应项暂不勾选。

绘制使用 `quamolit.canvas-strokes/RoundPolyline` 与 `draw-polylines!`，仅承诺开放圆头/圆连接折线。整批先验证至少两点、有限坐标、有限非负宽度与有效颜色；零宽显式跳过，避免 Canvas 忽略 lineWidth=0 后误用旧宽度。保持列表绘制顺序，每条路径一次原生 stroke。save/restore 恢复样式与变换，但当前 path 不恢复；合法原生调用之外的宿主异常不提供事务保证。类型化取首点使用已通过长度预检的 `&list:nth`，不用通用 nth/first 的 Dynamic 返回。没有新 JS 渲染模块，动画和遍历仍在 Quamolit Calcit 中。

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

第一条严格检查 170 个 Calcit 定义、2 项原生测试和 8 项 Node 合同；独立 oracle 用旧版矩阵组合，不复制被测角度累加算法，对 126 条边的端点、宽度、ID 和颜色逐项核对（误差 < 1e-10）。偏移分支负例必须失败。拒绝非法深度/时间，核对 63 次 stroke、状态恢复、整批非法输入无宿主副作用及零宽跳过。另有正式 Scene 身份/序列化、diff 分类、混合层序、能力拒绝与保留计划 1000 帧验证。统一组件的混合图元和六类版本失效由 `yarn test:retained-component` 验证。这是调用计数，不是性能测量。

导航门禁包含乱序时间 `[5,0,2.5,10,5]`、清空画布负例、播放暂停、分享刷新、reduced-motion、DPR 1/2、移动端/resize/浮层操作。现在参考由历史独立矩阵生成每个分叉的三点路径，以原生 round stroke 绘制。alpha 误差仍仅统计覆盖像素（均值 < 4/255），实色 RGB 容差仍为 1，未放宽阈值。保存固定时间、浮层与移动端截图；2.5 秒另附 `tree-old`（上一版平头矩形近似）和 `tree-diff`（alpha 差异放大 4 倍，橙色）PNG，旧近似须有超过 100 个差异像素。

## 未完成与下一步

`draw!` 与页面“全量参考”使用 `scene-at(time, depth)` → `SceneDocument` → 公共 `draw-reference!`。页面默认使用 `build-plan` → `sample-plan-at` → `draw-plan!`，静态 polyline 的 ID 和层序不变。旧 `frame-at`/`RoundPolyline` 接口保留，共享描边原语。能力边界见 [Scene 折线契约](scene-ir-core.md) 与 [保留计划](retained-path.md)。

这仍不是完整 Path IR；默认保留动画每帧仍分配姿态与矩阵，Canvas 逐条提交路径，没有 GPU 合批或实际帧率结论。通用组件与几何计划统一、完整 Path IR 和 GPU 由 #50/#53/#40 承接；不关闭这些 issue 或 M2/M3。其他 10 个原有示例待恢复。

新保留画面的栅格化例外见 [#113](https://github.com/Quamolit/quamolit/issues/113)：局部仿射描边和世界坐标参考在少量重叠像素上有量化差异。alpha 均值仍 <4/255；实色 RGB 最大差允许 2/255，但超过旧 1/255 的像素最多占实色像素 0.1%（至少 1 个）。新增 `tree-retained-<time>-expected/diff.png`，区别于历史平头矩形差异；不是静默放宽所有图像门槛。

上游接口见 [js-ffi #122](https://github.com/calcit-lang/js-ffi/pull/122) 与 [0.2.1-alpha.1](https://github.com/calcit-lang/js-ffi/releases/tag/0.2.1-alpha.1)。安装沿用 `caps --ci`：touch-control 仍请求 js-ffi 0.1.35，根项目选择新版本，存在明确版本冲突警告，`caps --strict` 因此不通过；这是传递版本债务，未通过放宽 Calcit 类型检查处理。Yarn 引用和 lockfile 同步更新。
