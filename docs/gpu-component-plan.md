# 公共组件计划到 WebGPU 矩形批次

推进 M2 #38/#40，复用 #114 的 `ComponentPlan`；不是第二套 Scene 或动画运行时。页面沿用导航中的“Calcit 保留组件” `/test/retained-component.html`，新增同源 GPU 对照与禁用/重建、严格像素检查。固定尺寸仅用于此诊断页。

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

本切片不是 #52 GPU 动画采样：动画仍在 CPU，GPU 只执行矩形顶点变换与绘制。`prepare-plan` 当前每帧校验并遍历全部节点，差量比较也扫描记录；不是已优化的逐绑定增量上传路径，更不是 10k/60 FPS 达标。没有完整端到端耗时、自动 device loss 恢复、独立下游 GPU 验收或一般资源表，M2 不关闭。

下一步在同一公共入口接标准 Motion GPU 参数、静态批次缓存/脏范围、独立消费者与真实阶段测量；不再新增孤立 shader 演示。完整 2D 能力采用整层回退，不静默漏绘。
