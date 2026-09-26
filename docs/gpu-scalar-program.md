# 标量 Motion 到公共 GPU 计划（开发中）

推进 #52，消费 #118 的 ComponentPlan/矩形批次候选，不另造组件或 Scene。已接入参数常驻和 vertex shader 采样；已有真实 GPU 像素、线性及双轴 smoothstep 非整数读回，以及独立消费者分发验证。完整精度域与性能验收仍在开发，不以这些诊断帧代表完整数值等价。

`quamolit.gpu-scalar-program/prepare-program(plan)` 返回 `ProgramResult :ready ScalarProgram` 或 `:fallback reason`。ready 保存同一来源计划、矩形帧和 ScalarParameter 列表。通过既有 `motion-gpu/lower-scalar` 检查描述符，再将明确支持的矩形 x/y constant 或 linear/smoothstep tween 转成参数。CPU 自定义变换、其他目标/算子以及不支持的节点整层回退，不返回部分有效绑定。

参数逻辑布局为 `index, axis, start, duration, from, to, easing, padding`，共 8 个 Number。axis 0/1 对应 x/y，easing 0/1 对应 linear/smoothstep。constant 归一化为相同 from/to、duration=0。零时长在 time < start 时取 from，否则取 to，shader 在除法前处理此分支。storage buffer 按节点保留两个 32 B 槽，每槽为 from/to/start/duration、enabled/easing/0/0；位置为 index×64+axis×32，不在 shader 中搜索全体绑定。

参数预检要求 f32 有限、绝对值及 start+duration 不超过 1e30；正 duration 至少 1e-30，排除 f32 下溢与过大中间值。除此之外，Calcit 冷准备计算保守精度预算，不能只凭有限性接受大绝对时间/短时长。

令 ε=2^-23，M=abs(from)+abs(to)，V=abs(to-from)/duration（smoothstep 乘 1.5），B=1e-5+1e-5×区间内最小绝对值；跨零时最小值为 0。每个绑定计算 A=8ε×(M+V×(abs(start)+duration))/B、S=8ε×V/B。常量 V=0；非恒定零时长跳变直接拒绝 GPU program（参数描述本身仍保留，可由 CPU 处理）。全程序分别取最大 A/S，当前时间满足 A+S×abs(time)≤1 才允许提交；常数系数为浮点打包、时间减除/除法、easing 和混合运算预留保守余量。

`time-supported?(program,time)` 在时间帧做 O(1) 检查，不重新遍历或采样所有绑定。它可能拒绝实际上可安全运行的跨零、大时间或短区间动画，当前保留整层 CPU 回退；后续可用相对时间原点及更精细误差分析扩大支持范围，不能靠放宽验收阈值扩大。固定 seed 的独立 f32 运算模型检验被接受的样本，但不是完整形式化证明，也不能替代真实 GPU 数值读回和设备验证。

同一节点/轴重复绑定拒绝，绑定索引必须是有效记录范围内的非负整数。当前检测在冷准备时扫描已有参数，尚未优化为大规模索引；不能把它作为 10k 性能证据。每次 prepare-program 仍全量准备；`reusable?` 由 Calcit 检查 ComponentPlan 身份及六类版本，诊断页据此复用 program，不在时间帧重复准备。

`create-renderer!` 复用现有定义级 file 的资源构造器，仅选择 scalar shader 变体；普通 GPU 路径不增加 buffer。`install-program!` 冷安装先验证完整来源、清除旧槽、上传参数和初始记录，再绘制；`draw-at!(host,program,time)` 在精度检查后仅更新 16 B time/viewport uniform 并提交。必须传入该 host 当前安装的 program；一个 renderer 只由一个调用方维护安装历史。版本变化、提交失败或设备重建后重新安装，不能在未安装或已释放的对象上绘制。动态 `draw-at!` 不在 CPU 采样 Motion；对照页的另外两块 Canvas 仍独立采样。拒绝的时间帧在任何上传前失败，页面据此整层回退。

Apple/Metal-3（software=false）实际验证 t=1→0→0.5→0.25→1，每帧 230400 通道零差异；同时间 Model、资源 ready、视口版本变化后也零差异。65 节点冷安装记录 4160 B，参数清零 4160 B 加一个绑定 32 B；时间帧记录与参数均 0 B，另加 uniform 16 B。1 pipeline / 3 buffers。真实执行发现过 WGSL `from` 保留字导致 shader 失败，已更名修复；mock 不证明 WGSL 能编译。

同一硬件的有界数值读回复用 renderer 的 `scalarSource` 与已安装 storage 参数，不另写测试版 WGSL。t=0.37 得到 94.80000305175781（独立线性公式 94.8）；t=0.81 得到 112.4000015258789（112.4）；t=0.4999999 得到 100（99.999996）；t=-0.1/1.1 得到 80/120。全部满足既定 `1e-5 + 1e-5*abs(expected)`，未放宽阈值。五次共读回 40 B，每次诊断临时分配三个 buffer 并释放；测试专用 compute 不是正常绘制路径，不计稳态帧资源和吞吐。当前仅证明这个线性绑定，不能外推所有 smoothstep/双轴或整个精度域。

## 已有测试与下一交付

`yarn test:gpu-component` 纳入新命名空间严格检查及 `test/gpu-scalar-program-smoke.mjs`：公共计划参数、乱序时间不变、constant/smoothstep/零时长、CPU/算子/目标回退、重复目标、起点有效终点越界。测试调用编译后的 Calcit，而不是 JS 重写 lowering。

独立消费者另以公共 Calcit 声明双轴 smoothstep，Apple/Metal-3 上 8 帧各 230400 通道零差异；非整数 .37/.81/.4999999 与区间外/端点共 7 次 xy 读回满足既定数值阈值。两个绑定常驻同一节点的两个参数槽，1000 时间帧 mock 仍只有每帧 16 B uniform；测试含切回单轴后的旧槽清理。详见 [独立消费检验](isolated-consumer.md)。页面可切换线性混合/双轴 Canvas 参考，GPU 对照由硬件门禁执行。

下一步扩大精度回退与重建证据，并接同源端到端报告和 10k 实例。保守预算尚未由这些硬件样本全面验证，不作为完成的 #52 交付。任意 Calcit 函数仍保留 CPU 路径，#52/M2 不因此关闭。
