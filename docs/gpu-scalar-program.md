# 标量 Motion 到公共 GPU 计划（开发中）

推进#52，复用已合并的ComponentPlan/矩形批次，不另造组件或Scene。参数常驻与vertex shader采样、原子集的GPU像素/数值和独立消费者分发已有证据。下述八槽线性RGB属于[候选#238](https://github.com/Quamolit/quamolit/pull/238)，未合并或发布；完整颜色组合与性能验收仍未完成。

`quamolit.gpu-scalar-program/prepare-program(plan)` 返回 `ProgramResult :ready ScalarProgram` 或 `:fallback reason`。ready 保存同一来源计划、矩形帧和 ScalarParameter 列表。通过既有 `motion-gpu/lower-scalar` 检查描述符，再将明确支持的矩形 x/y/alpha/width/height constant、linear/smoothstep tween 或两点 clamp/mirror 轨道转成参数。轨道复用 tween 编码与 shader，段 easing 取首帧；重复时间保留“时间点前取首值，到点后右侧胜出”，非恒定零时长跳变仍被原精度预算拒绝。多段及 repeat 未实现，仍明确回退。alpha 是填充透明度替换，端点须在 `[0,1]`，不是 group opacity；隔离组、CPU 自定义变换、其他目标/算子及不支持的节点仍整层回退，不返回部分有效绑定。

参数逻辑布局为`index,axis,start,duration,from,to,easing,padding`。axis0/1/2/3/4对应x/y/alpha/width/height，5/6/7对应矩形`linear-red/linear-green/linear-blue`；easing0/1为clamp linear/smoothstep，2/3为mirror。constant、零时长与原精度预算不变。storage每节点八个32B槽：from/to/start/duration、enabled/easing/0/0，地址为index×256+axis×32。RGB槽保存线性光通道，采样后编码sRGB并按Canvas的8位规则取整；alpha仍为直通道透明度，不做色域转换。静态未绑定的通道保留原值，层序不变。

八槽共用原buffer/pipeline，宿主仍为3个buffer，但参数容量由每节点160B增至256B。当前65节点的Calcit声明含原x与四个RGBA绑定，本机实际冷安装为16640B清零+160B写入=16800B，时间帧参数/记录不重写，仍仅16B uniform。25c5555的干净独立消费者已实测10k双轴为2560000B清零+640000B写入=3200000B，candidate=harness、dirty=false，原Metal画面/读回合同通过；旧2240000B报告仅属历史布局。此处是功能扩展，不声称加速。

宽高复用已有`ScalarTarget :width/:height`；非负端点、原精度拒绝与图层回退不变。旋转/缩放与group opacity仍未支持。原`?motion=dual`消费者的位移/宽高、数值及画面合同不变，必须在新布局下重验，不能只更新字节期望。

线性RGB绑定输入为[0,1]线性光值，不是编码sRGB数字；低层调用者可用`motion/srgb-to-linear`转换颜色端点。应用优先用纯Calcit的`component-sample/with-rect-color-motion`添加已有`ColorDescriptor`，不手工拆通道；constant/tween桥接及冲突规则见[组件声明](component-sample.md)。CPU复用现有`linear-to-srgb`，GPU使用同一分段编码规则，避免把sRGB通道直接算术混合后当作标准颜色渐变。越界端点以`scalar-color-outside-unit-interval`回退，CPU仍明确拒绝。独立消费者`?motion=color`在同页使用该入口，linear/smoothstep颜色版本切换复用原双轴硬件专项：11帧含同时间版本失效、整帧零差异和独立内区公式，7个smoothstep时间点的21个线性通道读回使用原数值容差；原门禁不放宽。GPU完整常量/轨道/透明叠加组合、完整精度域与正式tag分发仍未完成。

本地Apple/Metal-3诊断：`declare-colored-demo`用公共颜色描述和桥接构建保留计划，1→0→0.5→0.25→1的5个不透明内区像素与独立sRGB参考实际零差异，连续3轮通过。新夹具预设RGB≤1级8位转换差、alpha精确255，未改变原整图零差异门禁。0.37/0.81/0.4999999/-0.1/1.1的15个线性值读回满足既定`1e-5+1e-5*abs(expected)`；声明/计划构建各1次。临时仅把`:file`中的输出改为未经编码的线性值，重新codegen后真实像素断言失败（中点128而非188），恢复后复验；不是自比较或仅修改期望。此为仓库内Calcit到后端的功能验证，不替代干净安装或完整#144画质；原始JSON仅在忽略artifact，测量数据本身不作为测试PASS结论。

参数预检要求 f32 有限、绝对值及 start+duration 不超过 1e30；正 duration 至少 1e-30，排除 f32 下溢与过大中间值。除此之外，Calcit 冷准备计算保守精度预算，不能只凭有限性接受大绝对时间/短时长。

令 ε=2^-23，M=abs(from)+abs(to)，V=abs(to-from)/duration（smoothstep 乘 1.5），B=1e-5+1e-5×区间内最小绝对值；跨零时最小值为 0。每个绑定计算 A=8ε×(M+V×(abs(start)+duration))/B、S=8ε×V/B。常量 V=0；非恒定零时长跳变直接拒绝 GPU program（参数描述本身仍保留，可由 CPU 处理）。全程序分别取最大 A/S，当前时间满足 A+S×abs(time)≤1 才允许提交；常数系数为浮点打包、时间减除/除法、easing 和混合运算预留保守余量。

`time-supported?(program,time)` 在时间帧做 O(1) 检查，不重新遍历或采样所有绑定。它可能拒绝实际上可安全运行的跨零、大时间或短区间动画，当前保留整层 CPU 回退；后续可用相对时间原点及更精细误差分析扩大支持范围，不能靠放宽验收阈值扩大。固定 seed 的独立 f32 运算模型检验被接受的样本，但不是完整形式化证明，也不能替代真实 GPU 数值读回和设备验证。

同一节点/轴重复绑定拒绝，绑定索引必须是有效记录范围内的非负整数。当前检测在冷准备时扫描已有参数，尚未优化为大规模索引；不能把它作为 10k 性能证据。每次 prepare-program 仍全量准备；`reusable?` 由 Calcit 检查 ComponentPlan 身份及六类版本，诊断页据此复用 program，不在时间帧重复准备。

`create-renderer!` 复用现有定义级 file 的资源构造器，仅选择 scalar shader 变体；创建返回及公共安装/绘制/释放参数统一使用 [RectRendererHost](gpu-component-plan.md)，不增加包装对象。`install-program!` 冷安装先验证完整来源、清除旧槽、上传参数和初始记录，再绘制；`draw-at!(host,program,time)` 在精度检查后仅更新 16 B time/viewport uniform 并提交。必须传入该 host 当前安装的 program；一个 renderer 只由一个调用方维护安装历史。版本变化、提交失败或设备重建后重新安装，不能在未安装或已释放的对象上绘制。动态 `draw-at!` 不在 CPU 采样 Motion；对照页的另外两块 Canvas 仍独立采样。拒绝的时间帧在任何上传前失败，页面据此整层回退。

以下两段保留早期布局的历史硬件观察，不代表八槽候选的新测量。Apple/Metal-3（software=false）验证t=1→0→0.5→0.25→1，每帧230400通道零差异，同时间Model/资源/视口变化后也零差异。当时65节点记录4160B、参数清零4160B加32B绑定，热帧仅16B uniform，1 pipeline/3 buffers。WGSL曾因保留字失败，已修复；mock不证明实际shader编译。

同一硬件的有界数值读回复用 renderer 的 `scalarSource` 与已安装 storage 参数，不另写测试版 WGSL。t=0.37 得到 94.80000305175781（独立线性公式 94.8）；t=0.81 得到 112.4000015258789（112.4）；t=0.4999999 得到 100（99.999996）；t=-0.1/1.1 得到 80/120。全部满足既定 `1e-5 + 1e-5*abs(expected)`，未放宽阈值。五次共读回 40 B，每次诊断临时分配三个 buffer 并释放；测试专用 compute 不是正常绘制路径，不计稳态帧资源和吞吐。当前仅证明这个线性绑定，不能外推所有 smoothstep/双轴或整个精度域。

## 已有测试与下一交付

两点镜像轨道复用相同参数布局：easing 2/3 编码往返 linear/smoothstep，WGSL 用 floor 周期映射处理负时间；首帧 easing 控制两个方向，奇数段长取末值，偶数段长取首值。零段长镜像按 CPU 规则归一化为末值常量；原始尺寸/alpha/参数域检查先执行。重复轨道的不连续周期边界和多段轨道仍回退。镜像的预算系数采用16ε（原clamp为8ε），为周期减除/归约多留余量，保持现有数值容差和 O(1) 时间门禁；大时间或小值大增幅仍可能拒绝。现有固定seed f32模型同时检查mirror，不能代替硬件验收。独立消费者的往返模式及双轴子专项复用安装、搬移、版本失效、释放与数值读回，无新renderer/命令/job。

安装身份以实际 `ScalarProgram` / `InstanceProgram` 对象为准：绘制须传入该 renderer 最后成功安装的对象，即使另一份重新准备的描述结构相等也须先安装。原始 inline 仅持有不透明引用并做身份比较，不解析 Scene/Motion；公开入口仍由 Calcit 检查类型与精度。开始写入新安装前清除旧身份，全部上传成功后才标记 ready；中途失败须重新安装或销毁重建，不能继续使用旧 program。释放同时清除引用。旧/另一 renderer 的 program 在更新 uniform 和提交前拒绝，现有消费者与 Node 门禁保留该反例。

矩形alpha复用原双轴消费者专项，不另建测试入口：整数几何的8个乱序/同时间失效画面使用原零差异断言；7个非整数/端点样本复用真实shader读回和既定`1e-5+1e-5*abs(expected)`。Apple/Metal-3候选ac73880已得到全图零差异及数值通过，未外推到分数几何、重叠透明节点、DPR或其他设备。CPU参考被停止时必须失败；GPU不可用仍明确SKIP，不作为alpha硬件通过。

同一专项另在Model=80时将已有badge移到静态条带上，检查t=0/0.5/1的source-over层序，不新增节点、shader或消费者入口。新增整数重叠夹具仅在badge区域采用既有分层合同的RGB逐通道≤2（8位预乘与混合量化），区域外与整帧alpha仍零差异；内区像素须与独立混合公式完全相等，错误的灰色上层不能通过中间帧检查。GPU/Canvas/差异图保存到忽略的consumer artifact。原8帧仍要求全图零差异，数值容差不变；此规则不扩张到小数边缘、group opacity或其他设备。

`yarn test:gpu-component` 纳入新命名空间严格检查及 `test/gpu-scalar-program-smoke.mjs`：公共计划参数、乱序时间不变、constant/smoothstep/零时长、CPU/算子/目标回退、重复目标、起点有效终点越界。测试调用编译后的 Calcit，而不是 JS 重写 lowering。

位置与尺寸消费者以公共 Calcit 声明四轴 smoothstep。2026-10-02 候选 bb8ed0d 的干净安装在 Apple/Metal-3 上通过：8帧各230400通道零差异，7个非整数/边界时间的 x/y/width/height 读回满足原数值阈值。两节点四绑定冷参数448B，1000时间帧仍每帧仅16B uniform、1 pipeline/3 buffers；切回单轴会清除旧 y/width/height 槽。现有 `yarn test:consumer` 的报告和截图位于忽略目录 `test-results/consumer/`，复现硬件检查加 `QUAMOLIT_CONSUMER_HEADED=1 QUAMOLIT_CONSUMER_REQUIRE_GPU=1`。页面 `?motion=dual` 展示同源 Canvas 参考，GPU 对照由该门禁执行；不宣称完整图表已迁到 GPU。

现有保守精度域仍可能拒绝合法的小尺寸大增幅，例如 width=10→74 的1秒smoothstep；这不是负尺寸错误，仍按 `scalar-precision-budget` 回退。当前展示采用40→104，不修改精度阈值；扩大支持域留给 #52 的后续精度合同，不另造特殊尺寸采样器。

10k 独立实例的实验入口 `prepare-instance-program` / `install-instance-program!` / `draw-instance-at!` 复用本模块的参数编码、精度预算及 renderer，并接通同一消费者的三路径，见[消费者说明](../examples/retained-consumer/README.md)。真实 Metal 五个乱序时间的 GPU 采样 / CPU→GPU 全图零差异，Canvas 整数端点零差异；小数中间帧仍按 #144 的开放栅格化合同处理，不声称画质验收通过。两档尺寸三路径正式时长报告见[既有消费者测量](consumer-performance.md)，不是所有设备/精度域的证明。任意 Calcit 函数仍走 CPU；发布 tag、目标环境与完整 #52/M2 验收尚未完成。
