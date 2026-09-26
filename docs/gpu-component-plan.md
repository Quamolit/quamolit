# 公共组件计划到 WebGPU 矩形批次

推进 M2 #38/#40，复用 #114 的 `ComponentPlan`；不是第二套 Scene 或动画运行时。页面沿用导航中的“Calcit 保留组件” `/test/retained-component.html`，新增同源 GPU 对照与禁用/重建、严格像素检查。固定尺寸仅用于此诊断页。

以下介绍基础 CPU 采样→GPU 绘制模式。另有[标准标量 GPU 采样模式](gpu-scalar-program.md)，复用同一声明与 renderer 资源构造器，时间帧只上传 uniform；支持范围、精度回退及数值读回证据见该文档。

## Calcit API 与宿主分工

`quamolit.gpu-component/prepare-plan(plan)` 返回封闭结果：

- `:rects RectFrame`：顶层矩形按原绘制顺序保存 ID、RectNode 和采样矩阵；CPU 自定义变换仍由公共运行时采样，不转换为 WGSL。
- `:fallback reason`：整层回退，绝不返回已处理的局部 GPU 列表。当前 text/polyline/group/instances/子节点或超出 f32 安全域均回退。非法 Scene/矩阵长度直接报错。

数值预检保守限制每个角点的仿射项绝对值之和不超过 `1e37`，为 f32 中间乘加及投影预留余量；不能只检查 CPU 最终相消结果是否有限。

`update-frame(previous,next)` 由 Calcit 比较物理绘制索引上的记录，给出 `RectWrite {index,record}` 和记录上传预算。重排不按颜色排序；删除末尾只降低绘制数，旧 buffer 尾部不再绘制。一个矩形记录为 64 字节：x/y/w/h、rgba、a/b/c/d、e/f/0/0。RGB 遵循现有 Canvas `color-css` 的 8 位取整，再转换为 f32；alpha 保留连续值，shader 用预乘 alpha 混合。

`create-renderer!(canvas,device,format,capacity)` 创建一个固定容量 renderer；device 为 js-ffi 的类型化 `DeviceHost`，内部 raw ABI 使用 JsObject。`submit-frame!(host,previous,next)` 在 Calcit 中预检、决定变更并逐条写入，宿主只做 typed array/GPU 调用。首次与重建必须传 `empty-frame()`，后续 previous 必须是该 renderer 上一次成功提交的帧；一个 renderer 只允许一个调用方维护这条历史。异常/设备丢失后销毁并重建，不在未知 GPU 状态上继续复用旧历史。

`dispose-renderer!` 幂等释放两个 buffer 和 Canvas 配置；device 所有权属于调用方，不在此销毁。初始化错误清理已创建 buffer。容量不足在任何写入前报错，当前由调用者用更大容量重建；尚未实现自动增长或一般资源表。

创建 pipeline/shader/资源的长表达式位于 `src/host/gpu-component-create.mjs`，通过定义级 `:ffi :js :file` 编译时嵌入；写入、绘制和销毁使用 inline。它不是 ESM 导入，不解释 Scene/Motion，也不移动到 js-ffi。下游仅导入 Calcit 公共定义。上游探测仍经 `quamolit.webgpu-capabilities` → js-ffi。

## 当前证据与限制

`yarn test:gpu-component`：严格类型、原生差量合同、Node 的顺序/字段/1000 时间帧/非法输入与编译后宿主 mock，以及浏览器回退与硬件专项。软件 adapter 明确 skip，不计硬件通过。`yarn test:retained-component` 保留已有全量 Canvas 与统一计划对照。

本机应用内浏览器 `apple/metal-3, software=false` 已实际创建 pipeline、绘制同一 65 节点 ComponentPlan；`1→0→0.5→0.25→1` 每帧 230400 通道零差异。首帧记录上传 4160 B，只有动态矩形变化时 64 B，重复帧 0 B；每次提交额外 16 B viewport。常驻 1 pipeline / 2 buffers。像素检查在同一任务内重新提交并捕获画布，避免读取呈现后被回收的 WebGPU texture；诊断额外提交不计稳态吞吐。

严格比较曾在静态块的 green=0.9 上发现 9216 个通道相差 1：Canvas 先取整 229.5→230，而 GPU 原始 f32 路径取到 229。已统一 RGB 打包，未放宽阈值。整数坐标诊断帧对照 320×180×4 通道；任意仿射/亚像素抗锯齿、透明叠加与跨设备画质尚未由这项通过证明。

本切片不是 #52 GPU 动画采样：动画仍在 CPU，GPU 只执行矩形顶点变换与绘制。基础 `prepare-plan` / `update-frame` 保留为全量参考；新增缓存路径见下节。没有完整端到端耗时、自动 device loss 恢复、独立下游 GPU 验收或一般资源表，M2 不关闭，也未证明 10k/60 FPS 达标。

下一步在同一公共入口接标准 Motion GPU 参数、CPU 变换的细粒度失效、独立消费者与真实阶段测量；不再新增孤立 shader 演示。完整 2D 能力采用整层回退，不静默漏绘。

## 静态批次缓存与候选记录

新增 `BatchPlan` 保存公共 ComponentPlan、PreparedFrame、RectUpdate、去重后的标量绑定索引和计数。`build-batch(plan)` 完整检查一次；`update-batch(batch,plan)` 在组件身份、全部六类版本一致且无 CPU 自定义变换时，仅更新绑定索引处的记录。重复时间产生空 delta，静态记录继续共享；新版本、身份变化、CPU 变换和回退恢复走完整重建。它信任公共 ComponentPlan 的版本契约，不接受绕过版本直接改写结构/槽位的伪造计划。

`submit-batch!(host,batch)` 校验并提交 delta，不再验证或序列化整个静态 Frame。只能按顺序提交同一缓存链；首次及设备重建必须重新 `build-batch`，不能在遗漏提交后直接使用最后一个局部 delta。提交失败时按原契约销毁/重建。完整 `submit-frame!` 继续用于独立全量参考。

计数 `full-builds` 是批次完整准备次数，`candidates` 是进入批次准备的候选节点数（包含初始节点）；不是所有底层函数访问/分配次数。65 节点、1 动态节点的 1000 时间帧：完整构建 1 次、候选 1065 个；64 个静态 RectRecord 保持对象身份。多个绑定指向同一节点时只检查该索引一次。浏览器状态只读取标量计数，不把整个 delta/Frame 转 JSON。

### CPU 微基准（探索证据，非 M2 性能验收）

`yarn bench:gpu-component` 在同一组预先准备的 ComponentPlan 上比较全量批次转换和缓存更新，隔离这一个 CPU 阶段；不含组件采样、设备提交、GPU 或显示。Apple M1 Pro / Node 24，预热各 500 帧后交替执行 3 轮、每轮 500 帧。原始输入/环境/样本见 [报告](evidence/gpu-component-cache-bench.json)。报告保留当时基线 SHA 和 dirty=true，因为测量包含未提交的缓存实现。

| 路径 | 三轮 p95（ms） | 每轮记录上传预算 | 候选数（含初始） |
| --- | --- | --- | --- |
| 全量参考 | 1.117 / 1.129 / 1.127 | 32000 B | 32565 |
| 标量缓存 | 0.0102 / 0.0089 / 0.0098 | 32000 B | 565 |

两条路径的记录上传预算相同；改善的是 CPU 批次准备，不是减少既有 GPU 上传。此短微基准不满足正式 5 秒预热/30 秒采样协议，不能代替 #39 端到端报告或当作 FPS 加速比。CPU 自定义变换仍重建全部记录，标准动画 GPU 参数与更大规模负载继续归 #52/#38。
