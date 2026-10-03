# Canvas UI 与 WebGPU 实例分层组合（开发中）

推进 #177，尚未满足其完整验收条件；不关闭 M2。导航的 GPU 分类提供 `Layer Composition · UI 与实例同屏`，入口仍在同一页面通过状态切换。

## 层契约

`quamolit.layers` 提供 `LayerFrame`、`LayerViewport`、`RenderLayer`、`LayerPolicy`、`LayerBackend`。层数组顺序是从底到顶，不因后端重新排序；层 ID 唯一且非空。各层 Scene 的节点身份限于该层。帧只有一个有限绝对时间和视口，不允许每层保存不同的时钟或 DPR。

`viewport(css-width, css-height, dpr)` 验证正有限输入，将实际像素尺寸统一舍入一次，最小 1 像素。`validate-frame!` 拒绝伪造尺寸、重复 ID、非法时间和 Scene；`plan-for` 在任何绘制之前校验全部层，再按原顺序返回后端选择。

`:canvas` 层保持 Canvas。`:gpu-instances` 当前只接受无绑定的单根 instances Scene；不可用或不支持时整层选择 Canvas，不抽取部分节点绘制。该选择不是对任意混合 Scene 的 Canvas 支持承诺：调用者仍须执行 Canvas 能力预检，不支持时明确失败，不能漏绘。

`quamolit.webgpu-batches/draw-cleared!` 接收明确清屏色。透明层使用 `(color 0 0 0 0)`，宿主保持 premultiplied alpha。旧 `draw!` 签名与白色清屏默认值不变。

`compile-hit-layers(frame)` 按逆绘制顺序生成独立 `LayerHitPlan`，`hit-test-layers` 查询实际像素坐标，`hit-at` 把 CSS 指针坐标按统一 DPR 换算一次。结果是 `Option<LayerHit>`，包含 layer-id 与原 Scene 的 HitResult。不同层可以有相同节点 ID；事件所有者必须同时带层 ID。绘制不建立命中区域；示例在声明变化时重建命中计划，事件只查询计划。密集 instances picking、跨层冒泡/捕获仍不在本接口范围，不宣称 #34 完成。

## 实际消费者

示例的实例布局、声明、文字/图表 Scene 和绘制选择由 Calcit 定义。JS 只管理 DOM、时钟、TypedArray 搬运及设备生命周期。底层是 125×80 个静态实例，不是 10k 独立运动；时间驱动上层看板缩放、淡入、裁剪揭示。CSS px 坐标的 UI 使用根 DPR 矩阵，实例数据使用实际像素坐标。

两个 Canvas 全屏覆盖同一视口，下层 `pointer-events:none`，不作为逻辑命中源。切换后端只替换底层 Canvas，UI Canvas、逻辑时间和实例资源仍保留。导航卸载移除底层、观察器、计时器与资源；出入场透明度同时作用两层。

层 Scene 使用实际像素坐标；UI 的 CSS 单位通过根矩阵转换，不应再在指针适配中重复乘 DPR。ACTIVE FLOW 卡片使用 Scene target 控制暂停/继续，不根据 Canvas 层数决定交互。DPR 监听同时包含媒体查询、窗口 resize，以及每 250 ms 的值变化兜底；兜底仅在 DPR 变化时重绘，不维持空闲绘制循环，卸载后取消。自动化用 Chromium CDP 的真实 deviceScaleFactor 模拟 1→2，不等于跨物理显示器测试。

## 当前决策与成本边界

推荐作为**显式、实验性的分层选择**：大量同类实例需要 GPU、文字/复杂 UI 仍走 Canvas 时，由 Calcit 声明两个完整 Scene。当前不更改框架默认后端、不自动拆分任意 Scene，也不把一个隔离透明度 group 拆到两层。独立 Canvas 元素增加浏览器合成和 backing-store 成本；透明度、裁剪只能在各层自己的 Scene 内求值，跨层效果需要另行设计。

`snapshot().costs` 记录视口/实例源准备、声明/计划/命中编译、两张 surface 尺寸同步、实例绘制边界、UI 绘制边界、DOM 控件更新六个 CPU 阶段，以及包围整个成功同步绘制调用的 `cpuFrameMs`。GPU submission 的 CPU 时间不是 GPU 时间；浏览器 compositor 与 GPU 执行无精确测量，因此 `compositorMs=null`、`gpuMs=null`，不能把这些值相加作为呈现时延或宣称 60 FPS。设备失败后重试的旧调用不包含在成功调用的计时内；正式热测量拒绝回退、资源增长和版本变化。

## 分层成本测量入口

`yarn bench:layer-composition` 编译完整演示静态产物，临时服务于 5195，退出时只停止自己的服务，不重启常驻 Vite。正式测量不通过开发服务器：热更新可能卸载正在采样的页面，导致提前关闭或陈旧 API 访问已移除 DOM。每轮使用独立 Chromium 进程，默认有窗口、1920×1080 实际像素、DPR 1；Canvas+Canvas 和 WebGPU+Canvas 各预热 5 秒、采样 30 秒、重复 3 次。

驱动只传入同一绝对时间 `t=(elapsed/1500)%1`，动画/声明/绘制均调用实际 Calcit 消费者。负载是静态 10k 实例与循环 UI 渐入，不能称为 10k 独立动画或替代 #175。记录各阶段 p50/p95/p99、rAF 间隔代理、冷帧完整指标、逐帧上传和逻辑资源计数、卸载后的资源计数。UI 每帧重新声明/编译属于当前事实，不隐去其成本；分配字节及 UI 原生调用量仍未测。

默认产物为 `test-results/layer-cost/report.json` 与六份压缩原始样本（`gzip -dc run-1-canvas.json.gz` 可读取）。报告保存 Git/脏状态、关键源码 SHA-256、工具链/浏览器/CPU/供电信息及 adapter；`complete=true` 且六轮通过才是完整报告。`formalDuration` 只说明达到采样时长，不说明未知指标已测或性能已达标。短测可用 `QUAMOLIT_BENCH_WARMUP=0.1 QUAMOLIT_BENCH_DURATION=0.5 QUAMOLIT_BENCH_RUNS=1`，不得作为正式硬件基线；GPU 不可用或软件 adapter 直接失败，不悄悄测 Canvas 代替。

`QUAMOLIT_LAYER_BENCH_OUTPUT` 可指定归档目录；`QUAMOLIT_LAYER_BENCH_URL` 仅用于显式指定预先构建的静态服务器，需确保它服务本次产物。`test/layer-cost-metrics.test.mjs` 的负例拒绝漏计时、NaN、热帧全量位置上传、GPU 重建、回退、源版本变化与资源增长。它不证明浏览器合成耗时；该证据仍需单独的 compositor trace/测量方案，不能据此把分层改为默认后端。

### 2026-10-01 本机阶段报告

以下保留人工整理的阶段结论。自动生成的报告 JSON 与六份 GZ 原始样本不入库，本机副本归档到被忽略的 `test-results/layer-cost-2026-10-01/`。正式阶段验收还应提供可下载 artifact；本地路径不等于长期在线证据。Apple M1 Pro、macOS Darwin 25.6.0、AC 供电、Chromium 153.0.8010.12、Calcit/runtime 0.27.0，真实 adapter `apple / metal-3`，1920×1080、DPR 1。各后端三轮分别预热 5 秒、采样 30 秒，独立浏览器进程；无并行回归测试。测量时源码为报告中注明的 dirty 候选，四份关键源码 SHA-256 可校验，不能把基底 Git SHA 当作未修改源码的成绩。

| 同步 CPU 边界 / 调度代理 | 双 Canvas | WebGPU + Canvas |
| --- | --- | --- |
| CPU 帧 p95，三轮各自结果 | 3.9 / 3.9 / 3.9 ms | 3.0 / 3.2 / 3.1 ms |
| rAF 间隔 p95，三轮各自结果 | 17.5 / 17.6 / 17.6 ms | 17.0 / 17.7 / 17.6 ms |
| 采样帧数，三轮各自结果 | 1800 / 1799 / 1799 | 1801 / 1801 / 1801 |

GPU 冷帧位置上传 80 kB，所有采样热帧为 0 B；源版本保持不变，热帧不重新创建设备，六轮卸载后源 live=0，GPU accepted-runtime created=released。其他内部 buffer/pipeline 和 Canvas 离屏分配未独立计数，不能把 accepted-runtime 计数当作全部资源计数。浏览器合成/GPU 执行时间仍 null；不宣称真实呈现时延、60 FPS 达标、默认后端推荐或 #175 完成。

实际复现：先通过 `yarn test:layer-composition`，使用已有已验证的完整编译产物执行 `yarn vite build --config demos/vite.config.mjs --base=./`，再执行 `QUAMOLIT_LAYER_BENCH_OUTPUT=test-results/layer-cost-2026-10-01 node test/layer-cost-bench.mjs`。默认一条命令 `yarn bench:layer-composition` 会额外完整准备演示依赖；本轮该远程 tag 核对未完成，主动停止后使用本地既有依赖，未变更 tag。开发服务器上的两次不完整测量不采纳；静态产物的三轮双后端报告全部完成。

## 当前验证与待办

- `yarn test:layers`：公共类型、视口舍入、不可变时间/层序、完整层能力判定、非法输入，以及透明清屏 ABI；这些不是浏览器合成验收。
- `yarn compile:layer-composition`：独立示例入口。
- `yarn test:layer-composition`：DPR 1/2 的两层同步、暂停 resize、模拟 adapter 失败；实例使用独立原生循环参考，UI bitmap 复用上层画面，因此它是层合成验收，不替代现有看板自身的文字/裁剪验收。Canvas 合成整帧 RGBA 零差异。
- 本机硬件命令：`QUAMOLIT_LAYER_REQUIRE_GPU=1 yarn playwright test --config test/layer-composition.playwright.config.mjs --headed -g '真实 GPU'`。Apple / Metal-3，DPR 1/2 通过；整图最大 RGB 差值 2、alpha 差值 0。该像素对齐、alpha=0.5 的矩形夹具预先规定 RGB≤2/alpha≤1，来源是 8-bit 预乘/反预乘量化；不能外推到任意分数几何。诊断在同一浏览器任务内重绘并读取，因为呈现后的 WebGPU drawing buffer 不是持久快照；直接跨任务 `drawImage` 会读到清空后的 buffer，并非实际页面漏绘。
- 已补：运行中 DPR 1→2、独立卡片命中、Metal device loss 整层 Canvas 回退与同版本重建（重传 80 kB）、统一导航往返、实例资源卸载回零。`test:demo-nav` 完整静态产物的 59 项浏览器检查通过，包括异步 adapter 迟到后不创建设备、不复活画布。Actions 已接入，结果须按 PR 实际运行确认；CPU 阶段报告已补，合成成本仍未测，其他 GPU 平台未验证。
- 2026-10-04 在Calcit/runtime0.28.0、js-ffi0.2.1-alpha.11、Node24、锁定Chromium与真实Apple/Metal-3复测，并在同一个硬件用例补充：GPU重建后运行中DPR1→2，两张surface尺寸同步且暂停时间保持0.5；原生鼠标点击同一CSS点在GPU运行与device-lost整层Canvas回退后均命中UI的metric-a并唤醒播放。DPR1/2专项2/2通过，原全图RGB≤2/alpha≤1合同不变（实际maxRgb=2、maxAlpha=0）。普通headless6项通过、硬件2项明确SKIP；这是CDP模拟DPR，不是跨物理屏幕、跨层capture或任意图元画质验收。测试端口临时覆盖到空闲5230，不停止常驻5193/5199或复用其旧产物；覆盖不进入仓库配置。

浏览器门禁完成前不提交完成声明，不把本示例加入艺术作品验收，也不以结构测试替代 #177 的截图或硬件证据。
