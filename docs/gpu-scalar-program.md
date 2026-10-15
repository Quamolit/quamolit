# 标量 Motion 到公共 GPU 计划（开发中）

## 本地后续切片：标准 TRS（尚未完成，非已发布能力）

继 #239 的 CPU/Canvas 声明参考，本地后续分支将同一 `TransformSampler :motions` 降为常驻参数，继续复用矩形 pipeline，不创建平行 renderer。节点的常量矩阵保留；TRS 节点冷帧使用单位矩阵，shader 对局部点依次执行减 pivot、缩放、旋转、加 pivot 与平移，避免把 CPU 已采样矩阵再应用一次。普通位置/尺寸/透明度绑定仍可同时存在。拟采用每节点16个32B槽：0–4保持原义，5–7保留给颜色候选，8–12为 tx/ty/rotation/sx/sy，13/14为常量pivot；不把尚未合并的#238当作已交付。

数值合同在实现和测试前约定：已有标量阈值不变；TRS **世界坐标**另按误差传播计算保守上界，预算上限为每轴 `0.125` CSS px，不把这个数用于既有标量、Canvas像素或#144栅格化验收。依据[当前WGSL精度规范](https://www.w3.org/TR/WGSL/#floating-point-accuracy)，f32内建sin/cos在[-π,π]的绝对误差保证仅为2^-11；半径会放大此误差。因此本切片角度端点限于[-3,3]弧度，不做隐式取模/钳制；再用≤0.125的角度量化上界保证实际shader输入仍在[-π,π]。越界整层回退，不修改CPU描述。

对标量参数计算未归一化的误差包络 `E(t)=8ε·(M+V·(|start|+duration+|t|))`（mirror采用16ε，ε=2^-23，M与V同下文）；非恒定零时长跳变拒绝。令Dx/Dy为局部矩形全部位置/尺寸端点组合距pivot的最大距离，Sx/Sy为缩放端点的最大绝对值，G为位置/尺寸及pivot量化误差之和，`R=(Dx+1)(Sx+1)+(Dy+1)(Sy+1)`。每轴上界使用：`Etx+Ety+(1+Sx+Sy)G+R·(2^-11+Erotation)+(Dx+1)Esx+(Dy+1)Esy+32ε·世界坐标幅度界`；额外的1覆盖预算内≤0.125的交叉扰动。几何动画的误差与端点范围也须计入，不能只检查初始静态矩形或只读回角度。按节点收集后取最大仿射时间包络，提交仍为O(1)门禁；上界超过预算则在任何GPU上传前拒绝。无溢出/角度域/世界坐标误差证据，不得称为支持。

TRS硬件验收已从根项目迁入既有独立消费者：4ea3328在配套Calcit/runtime0.30.0-alpha.3、candidate=harness且dirty=false下通过Apple/Metal-3真实设备，覆盖普通/镜像/零缩放、9个乱序/重复/越界端点时间、135个顶点/中心数值样本与27帧；每种模式1000热帧记录/参数新增上传均0B。最大观测世界坐标误差0.00002113994px，对应传播包络最大0.074253308px，仍低于实施前每轴0.125预算；不是吞吐结论或完整精度域证明。根项目重复TRS硬件用例已移除，lowering/缓存/数值模型与负例保留；Canvas原8帧仍全图零差异。headed下337个旋转边缘像素曾因双方Canvas backing不一致失败，现仅在读回型测试页面固定双方willReadFrequently=true，不改生产路径或阈值。GPU旋转边缘的完整栅格合同仍归#144，其他设备未验证。前述9e2b230的根项目初验三轮仅作为历史诊断，不替代最终候选复验。

推进 #52，消费 #118 的 ComponentPlan/矩形批次候选，不另造组件或 Scene。已接入参数常驻和 vertex shader 采样；已有真实 GPU 像素、线性及双轴 smoothstep 非整数读回，以及独立消费者分发验证。完整精度域与性能验收仍在开发，不以这些诊断帧代表完整数值等价。

`quamolit.gpu-scalar-program/prepare-program(plan)` 返回 `ProgramResult :ready ScalarProgram` 或 `:fallback reason`。ready 保存同一来源计划、矩形帧和 ScalarParameter 列表。通过既有 `motion-gpu/lower-scalar` 检查描述符，再将明确支持的矩形 x/y/alpha/width/height constant、linear/smoothstep tween 或两点 clamp/mirror 轨道转成参数。轨道复用 tween 编码与 shader，段 easing 取首帧；重复时间保留“时间点前取首值，到点后右侧胜出”，非恒定零时长跳变仍被原精度预算拒绝。多段及 repeat 未实现，仍明确回退。alpha 是填充透明度替换，端点须在 `[0,1]`，不是 group opacity；隔离组、CPU 自定义变换、其他目标/算子及不支持的节点仍整层回退，不返回部分有效绑定。

参数逻辑布局为 `index, axis, start, duration, from, to, easing, padding`，共8个Number。axis 0/1/2/3/4 对应 x/y/alpha/width/height，8–14对应上述TRS；easing 0/1对应clamp linear/smoothstep，2/3对应mirror linear/smoothstep。constant归一化为相同from/to、duration=0；零时长在time<start时取from，否则取to，shader在除法前处理分支。当前本地storage布局为每节点16个32B槽，位置为index×512+axis×32，每槽为from/to/start/duration、enabled/easing/0/0；不在shader中搜索绑定。alpha交给原预乘混合；宽高在既有顶点路径中生成局部矩形，TRS再变换局部点，不改变绘制顺序。

16槽共用原buffer与pipeline，不增加资源数量，但标量模式参数容量从每节点160B增为512B。10k双轴负载冷安装为5120000B清零+640000B写入=5760000B，9e2b230已通过独立安装的Node/mock和headless Canvas门禁；热帧协议仍仅16B uniform，不把mock当硬件。先前五槽的2240000B属于旧布局，历史硬件/正式基准不改写、不冒充当前报告；本轮是功能扩展，不声称加速，也不隐瞒冷内存增长。紧凑布局不在本次功能切片展开。

宽高复用已有 `ScalarTarget :width/:height` 与标量描述，不新增公开 API。端点须非负（零合法），否则以 `scalar-size-negative` 整层回退；已支持的 linear/smoothstep 单段不会在非负端点间超调。颜色与group opacity仍不在此分支，旋转/缩放仅为上述本地候选。现有 `?motion=dual` 消费者同时声明x/y/width/height，测试保留原合同、参数槽清理、8个整数画面及7个非整数/边界样本；数值容差不变。

参数预检要求 f32 有限、绝对值及 start+duration 不超过 1e30；正 duration 至少 1e-30，排除 f32 下溢与过大中间值。除此之外，Calcit 冷准备计算保守精度预算，不能只凭有限性接受大绝对时间/短时长。

令 ε=2^-23，M=abs(from)+abs(to)，V=abs(to-from)/duration（smoothstep 乘 1.5），B=1e-5+1e-5×区间内最小绝对值；跨零时最小值为 0。每个绑定计算 A=8ε×(M+V×(abs(start)+duration))/B、S=8ε×V/B。常量 V=0；非恒定零时长跳变直接拒绝 GPU program（参数描述本身仍保留，可由 CPU 处理）。全程序分别取最大 A/S，当前时间满足 A+S×abs(time)≤1 才允许提交；常数系数为浮点打包、时间减除/除法、easing 和混合运算预留保守余量。

`time-supported?(program,time)` 在时间帧做 O(1) 检查，不重新遍历或采样所有绑定。它可能拒绝实际上可安全运行的跨零、大时间或短区间动画，当前保留整层 CPU 回退；后续可用相对时间原点及更精细误差分析扩大支持范围，不能靠放宽验收阈值扩大。固定 seed 的独立 f32 运算模型检验被接受的样本，但不是完整形式化证明，也不能替代真实 GPU 数值读回和设备验证。

同一节点/轴重复绑定拒绝，绑定索引必须是有效记录范围内的非负整数。当前检测在冷准备时扫描已有参数，尚未优化为大规模索引；不能把它作为 10k 性能证据。每次 prepare-program 仍全量准备；`reusable?` 由 Calcit 检查 ComponentPlan 身份及六类版本，诊断页据此复用 program，不在时间帧重复准备。

`create-renderer!` 复用现有定义级 file 的资源构造器，仅选择 scalar shader 变体；创建返回及公共安装/绘制/释放参数统一使用 [RectRendererHost](gpu-component-plan.md)，不增加包装对象。`install-program!` 冷安装先验证完整来源、清除旧槽、上传参数和初始记录，再绘制；`draw-at!(host,program,time)` 在精度检查后仅更新 16 B time/viewport uniform 并提交。必须传入该 host 当前安装的 program；一个 renderer 只由一个调用方维护安装历史。版本变化、提交失败或设备重建后重新安装，不能在未安装或已释放的对象上绘制。动态 `draw-at!` 不在 CPU 采样 Motion；对照页的另外两块 Canvas 仍独立采样。拒绝的时间帧在任何上传前失败，页面据此整层回退。

Apple/Metal-3（software=false）实际验证 t=1→0→0.5→0.25→1，每帧 230400 通道零差异；同时间 Model、资源 ready、视口版本变化后也零差异。65 节点冷安装记录 4160 B，参数清零 4160 B 加一个绑定 32 B；时间帧记录与参数均 0 B，另加 uniform 16 B。1 pipeline / 3 buffers。真实执行发现过 WGSL `from` 保留字导致 shader 失败，已更名修复；mock 不证明 WGSL 能编译。

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
