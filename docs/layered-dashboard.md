# Layered Signals：嵌套裁剪与隔离透明度

这个全屏图表 demo 验证 `quamolit.canvas-scene/draw-document!` 的两项组语义：子组的矩形裁剪在累计变换后生效；组透明度通过独立 surface 只合成一次，而不是把透明度逐个乘到子节点上。

Scene、动画时间、矩阵相乘、树遍历与绘制顺序全部由 Calcit 定义。当前仅有创建隔离 surface、取得 2D context、以 `globalAlpha` 回贴 surface 三个 inline JS 宿主原语；它们将在 [js-ffi #147](https://github.com/calcit-lang/js-ffi/issues/147) 提供类型接口后删除。

可在 URL 使用 `?t=0`、`?t=0.5`、`?t=1` 固定截图，也可通过 `window.layeredDashboardDemo.seek(t)` 乱序采样。验收时同时检查：起点只有背景、中间帧裁剪边界内只有部分柱图、终点完整显示，以及重叠色块仍按一次组透明度合成。

## Scene 能力与完整预检

以下区分完整 `canvas-scene/draw-document!` 与受限 GPU 消费者，不能把单图层能力拼成任意 Scene 都支持的承诺。

| SceneContent | Canvas document | 现有 WebGPU 路径 / 不支持时 |
| --- | --- | --- |
| group | 累计矩阵、矩形 clip、隔离 opacity | 矩形批次拒绝，整层走 Canvas；图片图层只支持声明过的子集 |
| rect | 实色矩形 | 顶层矩形批次支持；嵌套组不静默扁平化 |
| polyline | 圆头/圆连接折线 | 矩形批次拒绝，整层 Canvas |
| text | 基础 monospace 文字 | 矩形批次拒绝，整层 Canvas |
| image | 须提供匹配 id/version/尺寸的 ImageHost | 图片图层支持矩阵/源裁剪子集；混合文字/路径整层 Canvas |
| polygon | 填充及声明的描边 | 矩形批次拒绝，整层 Canvas |
| cubic-path | 声明的三次曲线描边 | 矩形批次拒绝，整层 Canvas |
| circle | 圆形填充 | 矩形批次拒绝，整层 Canvas |
| instances | 此 document 入口明确拒绝；另用版本化实例入口 | 独立实例图层另有支持合同，不自动插入任意嵌套 Scene |

`content-supported?` 是纯 Calcit 种类查询，不验证图元数值或资源 ready。`unsupported-nodes(document)` 返回有序 `List<quamolit.scene-ir/SceneDiagnostic>`（id/key/kind/reason），目前 instances 的原因是 `unsupported-canvas-scene-instances`；GPU 的 `diagnose-plan(plan)` 使用同一个类型，保留自己的后端原因。调用者可展示诊断或选择完整实例层入口，不丢弃节点继续绘制。`preflight!` 先检查尺寸、完整 Scene 合法性和全部不支持种类，再解析图片资源，任何失败发生在第一次 Canvas 操作之前。图片丢失或尺寸不匹配仍使用已有资源错误，不把资源状态伪装为种类不支持。原候选的 CanvasDiagnostic 尚未发布，在同一 PR 收敛为共享类型，不保留重复别名。

独立消费者在同一页面提供“嵌套图表与隔离透明度”，通过公共 Calcit 保留计划采样组透明度与柱条宽度，再调用 `draw-document!`。测试沿现有 `test:consumer` 检查全部9种 Scene 标签的能力表、id/key诊断、失败前零 Canvas 调用、1000帧结构共享、同时间Model失效，以及独立原生Canvas的整图像素；不是新增 renderer，也不证明这些组语义已在 GPU 实现。

像素参考独立计算动画、矩阵、裁剪和组合成，但与实际后端采用同类隔离 surface（可用时 OffscreenCanvas，否则 DOM Canvas），最终绘制到 DOM Canvas。Chromium 上以 scale=3.125、clip 顶边 y=343.75 原生复现，边界像素 DOM Canvas 为 `[255,0,0,16]`、OffscreenCanvas 为 `[0,0,0,0]`；因此不能混用 surface 类型再用宽松阈值掩盖差异。门禁保持整帧零差异，不证明两类原生 Canvas 边缘栅格化相同，也不外推到 #144 的 Canvas/GPU 合同。
