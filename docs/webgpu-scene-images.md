# Calcit Scene 图片绘制：M2 #40/#51

`quamolit.webgpu-images` 消费与 Canvas 相同的 `SceneDocument`，按声明顺序绘制纯图片子场景。Folding Fan 的 24 个纵向裁剪片、旋转角度、打断和乱序时间都继续由原有 Calcit `scene-at` 生成，不在 shader 或页面中重写动画。

GPU 硬件验证仅 macOS / Apple Metal-3；其余设备未验证。软件 adapter 的专项明确 SKIP，不计硬件通过。

## 使用与职责

- `create!(canvas,device,format,capacity)` 创建一个固定容量图片图层；调用者拥有 device 与 texture，图层只拥有 pipeline、sampler、uniform buffer 和 bind group 缓存。
- `supported-document?` 返回支持判定。当前只接受无父节点、无未解析绑定、源裁剪范围处于图片内部的 image 节点；混合图元、group/clip/opacity 必须由调用者选择完整 Canvas 图层，不能跳过节点拼半帧。
- `prepare-document` 先检查整个 Scene、视口、view 矩阵与每个 texture 尺寸，保持声明顺序；准备结果是临时宿主执行数据，不写入 Scene/Model。
- `draw-document!` 接受图层、document、`lookup(id,version)`、view `Matrix2D`、像素视口宽高和清屏颜色。Calcit 合成 view × image.matrix，归一化源裁剪；预检和容量检查完成后才开始绘制。
- `dispose!` 幂等释放图层自己的 buffer 与画布配置。调用者应先等待已提交 GPU 工作完成，再关闭 texture registry 和 device；通用 fence-safe 回收仍由 #51 继续实现。

原生宿主是定义级 `:ffi :js :file` 的单函数表达式 `src/host/webgpu-image-layer-create.js`，codegen 嵌入 Calcit namespace，下游无需导入独立 JS 文件。它接收 texture 与 20 个数值的参数记录，不理解 Scene、资源 identity 或动画 Model。公开边界由 Calcit Trait/Struct/Fn 类型定义；通用 texture API 缺口沿用 js-ffi #151。

单图片资源便利入口 `open-runtime!` 异步组合 registry、加载队列、texture 上传和图层创建，返回带类型的 `ImageRuntime`；创建图层失败时释放已上传 texture。`draw-runtime!` 按 Scene 的 ID/version 查找资源并绘制，`close-runtime!` 幂等关闭图层及 registry。调用者仍拥有 device，并须在关闭前等待 queue fence；多资源 runtime/自动设备重建不是这个便利入口的能力。

Calcit 调用方的核心流程（宿主已提供 canvas、device、format；generation 为调用者的设备代次）：

```cirru
let
    descriptor $ textures/texture-descriptor |lotus 1 |/assets/lotus.jpg 650 432 |rgba8unorm
    runtime $ js-await $ images/open-runtime! canvas device format descriptor generation 24
  images/draw-runtime! runtime (fan/scene-at model time) view width height clear
  ; 关闭时先等待 device.queue.onSubmittedWorkDone，再调用 images/close-runtime!
```

这里 `images`、`textures`、`fan` 分别是 `quamolit.webgpu-images`、`quamolit.webgpu-texture-runner`、`quamolit.examples.folding-fan` 的 namespace 别名；`view` 为 `Matrix2D`，`clear` 为 `ColorRgba`，视口为实际像素。`js-await` 所在函数须声明 async 和 js-ffi feature。Scene 本身仍只保存资源 ID/version/尺寸，不含 texture 或 device。

## 画质与缓存合同

采用 straight-alpha `rgba8unorm` 图片上传、线性 sampler、shader 输出预乘 alpha，并按原始顺序 source-over 混合。仿射变换在 vertex shader 中执行，视口缩放由调用方显式 view 矩阵表达。整个 Scene 不具备 group opacity，不能用这个入口冒充组隔离。

每个 draw slot 保留 bind group 和 f32 参数，重复相同图片与参数时不上传 uniform，不创建新的 pipeline/buffer/bind group。变更矩阵只上传该 slot 的 80 B 参数；资源句柄改变时替换 bind group。此路径逐图片 draw，不声称自动图片合批或吞吐优化。

固定 SVG fixture 检查红色源裁剪、蓝色 0.5 alpha、90° 旋转和重叠层序。实色内区与独立手算、同源 Canvas 比较：允许最多 1 个通道级差异，仅用于 alpha 转换舍入，不适用于边缘或整张图片。Folding Fan 的分数源裁剪和旋转边缘尚未满足 Canvas 完整 RGBA 等价；线性过滤与无 MSAA 的边缘差异仍归 #144，Canvas 历史零差异门禁保持不变。

## 验证与展示

`yarn test:webgpu-images`：18/18 严格公共定义、4 个 Node 场景（初始化失败释放、矩阵、24 片参数、末资源失败与容量预检）、两个 Chromium 用例。1000 个重复帧的 GPU 计数为 pipeline=1、buffer=1、bind group=2、热帧 uniform 上传=0 B。Apple Metal-3 的红色／交叠／蓝色／背景实色样本分别为 `[255,0,0,255]`、`[127,0,128,255]`、`[0,0,128,255]`、`[0,0,0,255]`，无 uncaptured GPU error。GPU 图片的 full-frame Canvas 等价与其他硬件未验证；此结果不是性能测量。

从现有导航进入 Folding Fan，选择“WebGPU 图片（实验）”。也可使用 `demos/index.html?demo=folding-fan&t=0.18&events=0&backend=webgpu`。控制面板仍是 DOM 浮层、Canvas 仍全屏；DOM 始终只保留一块画布（不同原生 context 不能共用同一 canvas，因此 GPU 模式替换显示节点，切回或卸载时同步恢复导航持有的原画布）。切换后端保持时间、输入日志和 Model，暂停 resize 不重置动画；初始化失败与 device loss 回退 Canvas，并显示原因。异步初始化取消后不安装迟到的 GPU 画布；离开 GPU demo 后可继续进入图表作品。用户可再次选择 WebGPU 重新初始化。GPU 截图保存在 `test-results/gpu-images/`，Actions 上传同名证据；无 adapter/软件 adapter 的 GPU 图片用例明确 SKIP。

下一项是混合图元／完整图层回退与 GPU 矩形裁剪、DPR 变化和真实设备故障自动重建；通用提交后延迟释放、font/glyph/geometry/pipeline loader 仍未完成，不关闭 #40/#51/M2。
