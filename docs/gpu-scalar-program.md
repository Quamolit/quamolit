# 标量 Motion 到公共 GPU 计划（开发中）

推进#52，复用ComponentPlan/矩形批次，不另造组件或Scene。线性RGB已随#238合并；本切片在配套0.30.1-alpha.5上加入标准TRS，保留颜色槽、同源CPU参考和整层回退。候选未合并或发布前不计入main；完整精度/栅格化与性能验收仍未完成。

`quamolit.gpu-scalar-program/prepare-program(plan)` 返回 `ProgramResult :ready ScalarProgram` 或 `:fallback reason`。ready 保存同一来源计划、矩形帧和 ScalarParameter 列表。通过既有 `motion-gpu/lower-scalar` 检查描述符，再将明确支持的矩形 x/y/alpha/width/height constant、linear/smoothstep tween 或两点 clamp/mirror 轨道转成参数。轨道复用 tween 编码与 shader，段 easing 取首帧；重复时间保留“时间点前取首值，到点后右侧胜出”，非恒定零时长跳变仍被原精度预算拒绝。多段及 repeat 未实现，仍明确回退。alpha 是填充透明度替换，端点须在 `[0,1]`，不是 group opacity；隔离组、CPU 自定义变换、其他目标/算子及不支持的节点仍整层回退，不返回部分有效绑定。

参数逻辑布局为`index,axis,start,duration,from,to,easing,padding`。axis0/1/2/3/4对应x/y/alpha/width/height，5/6/7对应矩形`linear-red/linear-green/linear-blue`，8–14对应TRS的tx/ty/angle/sx/sy/px/py；15未用。easing0/1为clamp linear/smoothstep，2/3为mirror。storage每节点十六个32B槽：from/to/start/duration、enabled/easing/0/0，地址为index×512+axis×32。RGB保持单位域校验、线性光插值与sRGB的8位编码，不因接入TRS被覆盖或放宽；alpha仍独立，静态通道和声明层序不变。

十六槽复用原pipeline与3个buffer，冷参数成本为512×节点数+32×绑定数；10k双轴预期为5,760,000B，须由当前消费者重验。热时间帧仍仅16B uniform。容量增加是功能成本，不是性能提升；此前八槽3,200,000B及更早2,240,000B报告属于历史布局，不能当当前测量或计算加速比。

宽高复用已有`ScalarTarget :width/:height`；非负端点、原精度拒绝与图层回退不变。标准TRS见下节，group opacity仍不支持。原`?motion=dual/color`的数值及画面合同在新布局下保留，不能只更新字节期望。

## 标准 TRS 与实际呈现

`TransformSampler :motions` 中的 `TransformMotion :trs` 由Calcit降低为五轴标量描述及两个固定pivot参数；vertex执行T(x,y)·T(pivot)·R·S·T(-pivot)。角度为顺时针弧度，当前端点限[-3,3]；负/零缩放合法。不支持的描述、CPU闭包、非矩形或超预算计划整层回退。动态TRS记录的冷矩阵归一为单位矩阵，避免CPU采样矩阵再次叠加；常量矩阵保持原值。

`update-program!(host, installed-program, plan)` 由Calcit决定相同来源/六类版本/标准变换描述是否复用；可复用时返回同一程序并提交时间，不可复用则完整准备和安装，算子/精度拒绝在上传前返回fallback。host仍须持有传入的已安装程序，异常或设备恢复后重建，不能混用另一renderer的身份。时间相等不吞掉依赖变化。

TRS冷准备传播标量量化、几何/支点、缩放与WGSL sin/cos规范误差（绝对2^-11）；接受范围要求每轴世界坐标预算不超过0.125。该预算不是所有DPR/投影下的CSS像素上界，更不等于跨后端旋转边缘逐像素一致。超大支点/时间等明确拒绝；CPU任意函数不自动转换WGSL。

`gpu-component/configure-viewport!(host, physical-width, physical-height, logical-width, logical-height)` 用公共`scene-ir/contain-matrix`等比居中配置表面，物理尺寸须为正整数且不超过设备限制，逻辑尺寸限[1e-6,1e30]。只改表面与逻辑uniform，不重装几何/Motion；配置后须重绘。同页GPU卡片按窗口×DPR配置实际buffer，不把320×180缓冲放大冒充原生呈现；无通知DPR-only仍归#50。

独立消费者`?motion=transform-gpu`与Canvas按钮使用同一Calcit声明及现有恢复协议；页面为诊断仍更新ComponentPlan并显示采样计数，不能以零位置上传声称没有CPU采样或帧率达标。纯时间提交入口的1000帧复用、颜色联用、负/零缩放及原生DPR证据由既有`test:consumer`承接；完整画质归#144，其他设备未验证。

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
