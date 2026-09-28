# Layered Signals：嵌套裁剪与隔离透明度

这个全屏图表 demo 验证 `quamolit.canvas-scene/draw-document!` 的两项组语义：子组的矩形裁剪在累计变换后生效；组透明度通过独立 surface 只合成一次，而不是把透明度逐个乘到子节点上。

Scene、动画时间、矩阵相乘、树遍历与绘制顺序全部由 Calcit 定义。当前仅有创建隔离 surface、取得 2D context、以 `globalAlpha` 回贴 surface 三个 inline JS 宿主原语；它们将在 [js-ffi #147](https://github.com/calcit-lang/js-ffi/issues/147) 提供类型接口后删除。

可在 URL 使用 `?t=0`、`?t=0.5`、`?t=1` 固定截图，也可通过 `window.layeredDashboardDemo.seek(t)` 乱序采样。验收时同时检查：起点只有背景、中间帧裁剪边界内只有部分柱图、终点完整显示，以及重叠色块仍按一次组透明度合成。
