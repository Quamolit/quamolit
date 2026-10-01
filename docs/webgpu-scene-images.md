# Calcit Scene 图片绘制：M2 #40/#51

`quamolit.webgpu-images` 消费与 Canvas 相同的 `SceneDocument`，按声明顺序绘制纯图片子场景。Folding Fan 的 24 个纵向裁剪片、旋转角度、打断和乱序时间都继续由原有 Calcit `scene-at` 生成，不在 shader 或页面中重写动画。

GPU 硬件验证仅 macOS / Apple Metal-3；其余设备未验证。软件 adapter 的专项明确 SKIP，不计硬件通过。

## 使用与职责

- `create!(canvas,device,format,capacity)` 创建一个固定容量图片图层；调用者拥有 device 与 texture，图层只拥有 pipeline、sampler、uniform buffer 和 bind group 缓存。
- `supported-document?` 检查 Scene 的图元与绑定：image 和 opacity=1 的 group 可用，不接受未解析绑定或混合图元。`prepare-document` 结合实际 view 检查裁剪能力：累计矩阵的 b/c 必须为 0 才能执行矩形 clip；不能把旋转矩形的外包框冒充原裁剪。半透明组需要隔离合成，本入口明确拒绝。调用者选择完整 Canvas 图层，不能跳过节点拼半帧。
- `render-decision(document,view,available)` 是纯 Calcit 的完整图层判定，返回 `ImageRenderDecision :webgpu` 或 `:canvas reason`。原因分别为 `webgpu-unavailable`、`unsupported-image-layer`、`rotated-image-clip`、`fractional-image-clip`；裁剪须经 view × 祖先矩阵变换后四边均落在整数物理像素上，DPR 由 view 表达，不取整或使用 epsilon 放行。每个祖先窗口分别检查，整数子窗口不能掩盖小数祖先。它先验证 Scene/view，不把非法父级或 NaN 当作正常回退。不创建设备，不查找纹理，也不输出局部图片子集。Canvas 仍须通过自身 `preflight!`，此结果不代表任何 Scene（如 instances）都被 Canvas 支持。
- `prepare-document` 先检查整个 Scene、视口、view 矩阵与每个 texture 尺寸，保持声明顺序；准备结果是临时宿主执行数据，不写入 Scene/Model。
- `draw-document!` 接受图层、document、`lookup(id,version)`、view `Matrix2D`、像素视口宽高和清屏颜色。Calcit 合成 view × 祖先矩阵 × image.matrix、归一化源裁剪、求交全部祖先窗口与视口；全资源/数值预检和容量检查完成后才开始绘制。矩阵合成溢出也在 begin 前拒绝。
- `dispose!` 幂等释放图层自己的 buffer 与画布配置。调用者应先等待已提交 GPU 工作完成，再关闭 texture registry 和 device；通用 fence-safe 回收仍由 #51 继续实现。

原生宿主是定义级 `:ffi :js :file` 的单函数表达式 `src/host/webgpu-image-layer-create.js`，codegen 嵌入 Calcit namespace，下游无需导入独立 JS 文件。它接收 texture 与 24 个数值的参数记录，不理解 Scene、资源 identity 或动画 Model。公开边界由 Calcit Trait/Struct/Fn 类型定义；通用 texture API 缺口沿用 js-ffi #151。`parameters` 是 20 个基础几何参数；完整宿主命令由 `checked-parameters` 追加 4 个裁剪边界，不应由下游手写打包。

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

采用 straight-alpha `rgba8unorm` 图片上传、线性 sampler、shader 输出预乘 alpha，并按原始顺序 source-over 混合。仿射变换在 vertex shader 中执行，视口缩放由调用方显式 view 矩阵表达。group.opacity 必须为 1，不能用这个入口冒充组隔离。裁剪在 fragment 中按像素中心 `[left,right) × [top,bottom)` 判定，空交集全部丢弃；负缩放/镜像的边界用 min/max 正规化。未实现裁剪边缘覆盖抗锯齿，亚像素边界不能据此宣称与 Canvas 等价。

每个 draw slot 保留 bind group 和 f32 参数，重复相同图片与参数时不上传 uniform，不创建新的 pipeline/buffer/bind group。变更矩阵/裁剪只上传该 slot 的 96 B 参数；资源句柄改变时替换 bind group。此路径逐图片 draw，祖先遍历也尚未保留编译，不声称自动图片合批或吞吐优化。

固定 SVG fixture 检查红色源裁剪、蓝色 0.5 alpha、90° 旋转和重叠层序。实色内区与独立手算、同源 Canvas 比较：允许最多 1 个通道级差异，仅用于 alpha 转换舍入，不适用于边缘或整张图片。Folding Fan 的分数源裁剪和旋转边缘尚未满足 Canvas 完整 RGBA 等价；线性过滤与无 MSAA 的边缘差异仍归 #144，Canvas 历史零差异门禁保持不变。

## 验证与展示

`yarn test:webgpu-images`：31/31 严格公共定义、7 个 Node 场景（嵌套/镜像、DPR 1/2 的物理裁剪判定、不支持语义在资源查询/绘制前拒绝、合成溢出预检和混合图层判定）、三个 Chromium 用例（adapter 失败 Canvas 与两个 GPU 专项）。1000 个重复帧的 GPU 计数为 pipeline=1、buffer=1、bind group=2、首帧 uniform=192 B、热帧=0 B。Apple Metal-3 的红色／交叠／蓝色／背景实色样本分别为 `[255,0,0,255]`、`[127,0,128,255]`、`[0,0,128,255]`、`[0,0,0,255]`，无 uncaptured GPU error；嵌套平移与整数 clip 的内区/三个外区样本与 Canvas 完全一致。GPU 图片的 full-frame Canvas 等价与其他硬件未验证；此结果不是性能测量。

折扇增加“父组矩形窗口裁剪”，URL 可加 `clip=window`。Calcit `display-scene` 包装同一 24 片 Scene：父组拥有视口变换与可选局部裁剪，Canvas 通过 `canvas-scene` 正确性入口绘制，GPU 通过同源 group 解析；原 `windowed-scene/draw-windowed!` 便利入口保留。小数物理窗口整层回退 Canvas，保持全部 24 片、Model、时间和请求后端；resize 到整数边界后复用已有 GPU runtime。默认关闭，历史零差异合同不变。这个保守边界不是图片栅格化等价证明；#144 的矩形实验只提供拒绝未验证 clip 的依据。`yarn test:folding-fan` 另覆盖 DPR 2、窗口外全图无残留、暂停 resize、分享刷新与取消窗口时 Model 不变。

“文字/折线标注”增加另一个组和两个真实 Scene 图元，URL `annotations=1` 保存选择。请求 WebGPU 时，Calcit 把完整 28 节点 Scene 判为 Canvas：恢复导航原画布，图片、线与字全部走同一 `canvas-scene`，不提交局部 GPU 图片。关闭标注后复用已有 GPU runtime，无须重新创建 pipeline/texture；显式切回 Canvas、离开 demo 或设备丢失仍按原 fence 规则关闭 runtime。回退期间只显示一块 Canvas，时间/Model 不变；分享保存请求后端而非临时实际后端，因此刷新后仍能恢复相同策略。这里保留的一个 GPU runtime 是有界的暖缓存，不是逐帧分配。

真实 Metal 测试覆盖 GPU→含文字/折线的完整 Canvas→暂停 resize→GPU。Canvas DPR 2 测试与独立原生 Canvas 参考全像素零差异（参考采用合同声明的 OffscreenCanvas 隔离 surface，不能用 DOM Canvas 分数缩放字形替代），并覆盖 URL 分享刷新。截图 `fan-whole-layer-fallback.png` 和 `fan-mixed-canvas-dpr2.png` 保存在现有 artifact 目录。此路径不是 #177 的 Canvas UI + 10k GPU 实例双层同屏，不把单层回退当作分层合成完成。

从现有导航进入 Folding Fan，选择“WebGPU 图片（实验）”。也可使用 `demos/index.html?demo=folding-fan&t=0.18&events=0&backend=webgpu`。控制面板仍是 DOM 浮层、Canvas 仍全屏；DOM 始终只保留一块画布（不同原生 context 不能共用同一 canvas，因此 GPU 模式替换显示节点，切回或卸载时同步恢复导航持有的原画布）。切换后端保持时间、输入日志和 Model，暂停 resize 不重置动画；初始化失败与 device loss 回退 Canvas，并显示原因。异步初始化取消后不安装迟到的 GPU 画布；离开 GPU demo 后可继续进入图表作品。用户可再次选择 WebGPU 重新初始化。GPU 截图保存在 `test-results/gpu-images/`，Actions 上传同名证据；无 adapter/软件 adapter 的 GPU 图片用例明确 SKIP。

下一项是 #177 的 UI/实例分层组合、圆、旋转矩形与隔离组透明度、跨物理显示器 DPR 变化和真实设备故障自动重建；通用提交后延迟释放、font/glyph/geometry/pipeline loader 仍未完成，不关闭 #40/#51/M2。
