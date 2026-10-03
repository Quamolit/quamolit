# 计划 v3：贯通 Calcit 动画主路径

2026-09-26。本文是 v2 的执行顺序与验收修订，冲突处以本文为准；未冲突的数值、视觉、性能和功能约束保留。GitHub issue 状态是实时进度来源。本轮没有关闭功能 issue。

## 当前事实与下一项交付

2026-10-04 核对：已合并基线为 `1fb5d0c`，包含 #217精确端点、#218圆弧、#219/#220窄屏、#221字体、#222图片所有权与#224分层输入验收，及此前的公共组件/资源/PR预览。采用 Calcit/runtime 0.28.0、js-ffi 0.2.1-alpha.11；已发布alpha.3不含上述新增能力。版本合同见[工具链升级](calcit-027-upgrade.md)。以下矩阵区分已合并实现、尚未合并候选与未验收范围；实时发布与合并状态以 GitHub 记录为准。功能通过不等于稳定 API、全画质或性能达标。

### 阶段矩阵

| Milestone | 状态与已验证产物 | 未完成出口 / 后续工作 |
| --- | --- | --- |
| [M0](https://github.com/Quamolit/quamolit/milestone/4) | 开放；[Canvas 参考与测量协议](performance-m0.md)已有基线，新路径另见消费者报告 | #39 的同环境 baseline 比较、供电记录、协议负例及阶段展示；旧 Canvas 数字不能替代新架构 |
| [M1](https://github.com/Quamolit/quamolit/milestone/1) | 已关闭；[下方阶段验收](#m1-阶段验收与展示)列出直接时间、固定 tick、声明、逻辑身份/释放及 TodoList 展示；材料随[已合并 #188](https://github.com/Quamolit/quamolit/pull/188)交付 | 不外推真实资源、一般指针捕获、GPU 全画质或稳定 tag 完成 |
| [M2](https://github.com/Quamolit/quamolit/milestone/2) | 开放；公共 Calcit 组件/保留计划、干净消费者、资源/恢复、受限 GPU 三路径已运行；0.0.18-alpha.3 的[发布后干净消费与Metal专项](isolated-consumer.md#未完成验收与下一步)已重跑；[正式报告](consumer-performance.md#2026-10-0210k-独立动画正式时长报告)记录真实负载 | #144 栅格化合同、#175 完整性能判定、#104 后续能力发布验收与稳定消费、#176 全公共边界、#177 分层决策、#178 阶段展示、#179 门禁成本；不能只按上传量关闭 |
| [M3](https://github.com/Quamolit/quamolit/milestone/3) | 开放；[11 个原有示例](demo-restoration.md)、图表作品、统一全屏画布、基础绘制与 Drag 路由已有可运行切片 | #36 真实发布入口已随 #201 接通、#34 完整交互、#53 文字/路径合同与缓存计数、#37 视觉矩阵及窄屏限制；原有入口齐全不等于全部出口验收 |
| [M4](https://github.com/Quamolit/quamolit/milestone/5) | 开放；可消费 M2 的受限硬件证据，但没有一般 GPU 历史模拟或跨设备发布验收 | #54 的 tick/seed/checkpoint/device recovery、#41 的后端/Use.GPU ADR 与发布材料；其余设备未验证，不以结论替代实现依赖 |

### 能力与后端矩阵

“已实现”仅指所列 API/门禁覆盖的子集。Canvas 证据来自固定 Chromium 的 Node/浏览器与 macOS；GPU 硬件限非软件 Apple/Metal-3，CI 无硬件时必须单列 SKIP。任意分数边缘、字体与全部变换组合不由少量实色样本证明。

| 能力 | Canvas / CPU 已合并基线 | WebGPU 已合并基线 | 证据、候选与限制 |
| --- | --- | --- | --- |
| 声明、Motion、显式时间 | ComponentPlan 与 Presence、标量/Vec2/关键帧及自定义 CPU 函数可采样 | 标准标量/Vec2 的有限子集；任意闭包不能转 WGSL | [保留组件](retained-component.md)、[GPU 标量](gpu-scalar-program.md)、`test:consumer`；mirror 扩展已随[合并 #198](https://github.com/Quamolit/quamolit/pull/198) |
| 保留执行与增量失效 | 同源消费者 1000 时间帧声明/构建各1，绑定/变换采样各1001；版本变化显式失效 | 矩形 BatchPlan、实例参数/位置常驻、局部记录/时间 uniform | [消费者](isolated-consumer.md)、[组件批次](gpu-component-plan.md)；计数不证明完整事件索引、每帧分配或帧率 |
| 基础路径、圆与文字 | rect/circle/polyline/polygon/cubic/text 使用原生 Canvas；图片走资源感知入口 | 组件矩形子集；文字/复杂路径不支持，应整层回退或明确拒绝 | [Curve](curve-restoration.md)、[图表组](layered-dashboard.md)、`test:curve-demo`/`test:icons-demo`/`test:solar-demo`；端点/接头固定为[已合并 #202](https://github.com/Quamolit/quamolit/pull/202)，中文字体加载、失败及版本隔离随 #203 合并，排版/缓存计数仍归 #53 |
| 祖先变换、clip、组 opacity | [已合并 #159](https://github.com/Quamolit/quamolit/pull/159)：嵌套矩形裁剪与隔离 surface，只合成一次组透明度 | 图片图层仅支持规定的轴对齐窗口、组 opacity=1；一般组/旋转 clip 不支持 | [图片支持边界](webgpu-scene-images.md)、`test:webgpu-images`/`test:layered-dashboard`；[已合并 #199](https://github.com/Quamolit/quamolit/pull/199)补独立嵌套消费者与节点诊断，不补一般 GPU 组语义 |
| 10k 同类实例 | `draw-instances!` 原生批次参考；10k 实际 Canvas 调用 | 静态/单脏记录/独立时间动画路径；不物化 10k 组件 | [实例入口](canvas-instances-reference.md)、[GPU 实例](webgpu-instances.md)、[同源报告](consumer-performance.md)；非整数中间帧差异仍归 #144，不宣称已达60 FPS |
| 资源与设备恢复 | 逻辑 identity/generation、共享租约、图片加载与迟到清理 | 实例 buffer、texture runner 与受限 device loss/rebuild 已验证 | [资源注册表](resource-registry.md)、`test:consumer`/`test:webgpu-instances`；font 已接加载队列与迟到隔离，共享宿主、idle重入与精确释放随[已合并 #205](https://github.com/Quamolit/quamolit/pull/205)；glyph/geometry/pipeline 回收及自动运行时接线仍未完整验收 |
| 命中与指针捕获 | 纯 Calcit HitPlan/PointerState；支持基础叶图元、逆变换/clip、Drag 捕获/释放 | 复用逻辑 CPU 路由；没有 GPU picking | [路由合同](scene-pointer.md)、`test:scene-hit`/`test:scene-pointer-browser`；嵌套禁用随[已合并 #200](https://github.com/Quamolit/quamolit/pull/200)，polygon/cubic 描边、版本化矩形 instances 命中及逻辑捕获提交协调随[已合并 #202](https://github.com/Quamolit/quamolit/pull/202)合并；完整应用接线、病态曲线全域及完整 ID 访问计数仍未完成 |
| Canvas UI + GPU 层 | 显式 RenderLayer，统一时间/视口、声明顺序与整层回退 | 单根实例层可与 UI 同屏，不自动拆任意 Scene | [分层契约与门禁](layer-composition.md)；#177 的默认后端/成本决策未完成，跨层 capture 与 GPU 文字不在现有合同 |
| 模块与真实入口 | 单个 Calcit 模块，inline/file 随安装内嵌；主 Snapshot 与独立消费者分工明确 | 同一模块可消费受支持 GPU 入口，无手工宿主 JS 导入 | [FFI](calcit-first-ffi.md)、[消费者](isolated-consumer.md)；[已合并 #201](https://github.com/Quamolit/quamolit/pull/201)贯通普通 compile/release 并隔离演示调度器；语言 named entry 创建仍待 [Calcit #1665](https://github.com/calcit-lang/calcit/issues/1665)，不把 entry 当分发隔离机制 |

当前优先补齐 #34/#53 的图形与交互功能，不扩展性能优化。#217–#222及#224已合并，不再安排为未实现前置。#223仍为候选：扩展同一看板的子树出入、柱图/折线类型替换与干净Calcit消费，rebase保留主线字体/图片实现及原门禁。候选测试证据见PR，不把候选混写成已合并能力或已发布tag。

下一条贯通链路是实际UI的退出/重入、resize/DPR、capture与外部字体/图片租约联合验收，复用上述组件、队列、宿主和既有门禁，不再建立平行demo或资源层。#223使用主线精确端点，保留父子/类型事件意图与字体提交顺序，并检查实际绘制Scene不丢字体描述；不能以解决冲突为由删除任一动画/资源测试。#222多图接口已可用于后续联合场景，但当前看板尚未接图片。精确文字命中、完整类型/重排矩阵、全指针ID访问、排版/路径缓存、GPU文字与栅格化仍未完成，不能关闭#34/#51/#53/M2/M3。性能调优暂缓。

并行于功能主线，#204 首批工程减法已随#207合并，移除24个退役 `quamolit.app.*`，不删除旧库 API、不减少原有11个demo或门禁。替代/删除条件维护在 [API 迁移清单](api-contract.md#历史应用移除范围)，工程面积与本机门禁前后观测随#207提供；仍保留15个旧 namespace，完整逐项登记/发布迁移待后续。新增抽象准入与 PR 粒度使用已有模板/AGENTS，状态证据集中本页与主题文档，不新增状态页或扫描框架。后续功能 PR 更新能力边界，不持续追加逐 PR 历史。

本批工程面积观测（删除前 `5405d53`；删除后为本批候选）：Snapshot 1,195,082→1,122,017字节，减少73,065字节（约6.1%）；项目namespace119→95、legacy39→15，稳定namespace仍为1，11个稳定定义及类型合同不变；脚本、CI job、作品和测试文件数量不变。新抽象/命令数量为0，未削减测试覆盖。验证使用 macOS、Node24、Calcit/runtime0.28.0、js-ffi0.2.1-alpha.11、相同锁定依赖；临时独立worktree保留删除前基线。

| 同一命令，本机预热一次后交替3轮 | 删除前耗时 ms | 删除后耗时 ms |
| --- | --- | --- |
| `yarn compile:bootstrap`（热产物，仅诊断编译） | 1193 / 1190 / 1200 | 1119 / 1094 / 1107 |
| `calcit analyze check-public --ns quamolit.retained-component --ns quamolit.scene-ir --ns quamolit.ui-motion` | 261 / 253 / 263 | 249 / 252 / 237 |
| `yarn check:api-inventory` | 17066 / 8077 / 8046 | 7706 / 7473 / 6936 |

上述为 wall-clock 观测，不是动画性能或稳定加速证明：测量期间存在浏览器回归负载，API门禁首轮有明显波动；bootstrap热编译也不代表完整站点冷编译。普通 `compile/release`、`test:demo-nav`（4项Node、73项Chromium）、`test:visual`（11项Chromium）、runtime、fixtures、Clock、fade迁移和Binary Tree均通过；没有修改像素容差或基线。Actions总时长与候选干净安装结果由PR记录，不把本机耗时替代#179或M3阶段验收。

公共 API 的稳定性仍以[合同](api-contract.md)为准；矩阵中的可运行实验 API 不自动成为稳定接口。#144 的 MSAA/解析覆盖率只有临时硬件实验，不是默认 renderer 或正式 DPR/性能验收，不能用整数参考的零差异掩盖小数/重叠中间帧差异。

三路径正式报告的原始环境为 Calcit/runtime 0.27.0、Apple M1 Pro/Metal-3，并非当前0.28.0新测结果。CPU 全量采样明确不达60 FPS；GPU 时间采样的零位置上传不等于全面帧率达标，供电/刷新率、baseline 与 #144 画质合同仍未完整验收。次要问题登记 issue；不为追求阶段关闭扩展优化或放宽画质。

## 实现顺序与跨阶段边界

1. #50 + #33 + #35 交付最小 Calcit 组件到 Canvas 保留运行路径；#51 按实际需要提供资源切片，#49 收口逻辑生命周期。
2. [#104 独立 Calcit 消费者](https://github.com/Quamolit/quamolit/issues/104)验证安装、调用、可控时间、截图、释放及 1000 帧计数。#39 的现有协议接入真实 Calcit 路径的阶段耗时。
3. #38/#40/#52 用同一声明和输入接 WebGPU；完成非软件 adapter 的画面、上传与端到端测量。WebGPU 接口可提前协同设计，首个 Canvas 切片不等待所有 GPU 功能完成。
4. #36/#53/#34/#37 完成旧应用、复杂绘制和交互；#54/#41 依据实际瓶颈扩展模拟与跨设备发布。

#104 属 M2；完整旧应用仍归 M3。#49 的 M1 关闭依据纯逻辑生命周期、释放通知和可编译示例，真实 GPU/Canvas 资源释放由 #51、指针捕获由 #34 验收，后两项不反向阻塞 M1。转移验收责任不代表对应能力已通过。

#39 在 M0 建立测量协议与参考基线；M2 性能报告由 #50/#40/#52 负责使用该协议生成。已有协议可作为前置产物，不让 #39 等待新渲染器、新渲染器又等待 #39。v2 依赖表是产物依赖，不要求整项 issue 先关闭。

## 公共路径验收

- Calcit 声明组件与 Model；显式传时间/输入/资源版本。生产代码不反向依赖 test/host 或 target/js/motion；调用者不手工创建 JS sampler Map 或导入框架内部 JS。
- 1000 个仅时间更新不重新声明静态结构、不重建静态计划；拓扑、Model、资源/视口变化按契约失效。记录声明/构建/采样、分配/复制/上传及耗时，不以局部计数替代总帧性能。
- 同一个组件、输入日志、seed、时间、视口用于全量 CPU 参考、Canvas 和受支持 GPU 路径。t=[1,0,0.5,0.25,1] 乱序/重复和同时间失效均有独立期望。
- 干净消费者通过候选提交安装与编译，发布后用 tag 再验证；输出搬移仍运行，片段源码实际随模块分发。不把先发版作为测试前提。
- 最终交付单个 Calcit 模块，而不是框架 JS 加 Calcit 转发层；所需 inline/file 源码随模块安装，编译时内嵌，可达产物不得包含测试 namespace、夹具或作者的 target 路径。主 Snapshot 的命名 entry 用于归并 demo/测试配置，不是发布隔离机制；独立消费者保留独立 Snapshot。创建能力未发布前保留现有 CLI 覆盖，待 Calcit #1665 解决后按结构化事务迁移，并重跑既有编译与消费者门禁。
- 功能、运行计数、实际耗时分开报告；软件 GPU skip 不是硬件验收。实际命令由实现 PR 加入 package scripts 与 CI；本文不声称新增测试已经实现。

## inline/file 与上游问题处理

业务语义优先 Calcit；平台能力优先引用 js-ffi 的类型化 Calcit 定义。需要 JS 实现时，优先 :ffi :js :inline（短片段）或 :file（较长单函数表达式）。file 是编译时嵌入的源码载体，不是导入整个 ESM，也不能通过片段之间相对 import 重建宿主模块系统。

有状态、批量和 WGSL 本身并不排除表达式实现；应核对 ABI、异步、句柄生命周期和同一定义/不同定义的求值实例。完整 Fn schema、feature、target 与实际宿主测试不可省略。不得把大量业务 JS 塞进一个 file 来冒充 Calcit 迁移，也不能为追求内嵌而复制共享状态。

当前使用 0.28.0，原始 ABI 的限制和 source 路径要求见 [FFI 规范](calcit-first-ffi.md)。#1359/#1360/#1361/#1363 已在上游关闭，是已交付功能参考，不是等待中的阻塞项。每次实现按实际使用版本核对能力。

遇到 Calcit bug 或缺失能力：先搜重复 issue，记录 CLI/runtime/module 版本、最小复现、预期/实际、受影响 API 和建议契约；可直接向 calcit-lang/calcit 上报。先采用有界的局部适配继续交付，在消费 issue 和源码/文档关联问题、绕过范围、回归测试和撤销条件。下一次升级重新运行复现，再决定移除；不假定新版本必定解决。不为了类型通过放宽整个公共 API 为 Dynamic。

## 开放工作项的当前交付

以下与本轮 GitHub issue 的 v3 修订同步，原 v2 详细范围保留在 [工作项索引](work-items.md)；本页修订优先。

### #50：第一优先：贯通 Calcit 组件与保留计划

公共 `ComponentPlan` 已接通声明、Motion 槽位、时间采样与独立消费者；下一步依据上方矩阵补齐真实应用的完整失效/生命周期链路，不再把首个公共入口列为尚未实现。

- 由 Calcit 定义计划构造、绑定选择、版本失效与生命周期；宿主只处理必要可变句柄/批量操作。
- 生产路径不得导入 target/js/motion 或 test/host；#104 的消费者无需 JS sampler Map 手工拼接。
- 1000 个仅时间帧声明/静态计划构建各一次；模型或拓扑变化分别按契约更新，与全量参考比较。
- 记录采样、分配/复制、上传与阶段耗时；优先修复真实消费者阻塞。

### #35：随主线实现 FFI，而非独立扩大清理范围

当前版本为 Calcit/runtime0.28.0、js-ffi0.2.1-alpha.11；inline/file 分发、重编译与产物搬移已进入 #104，全部片段/公共边界审计与语言 named entry 创建仍未完成。

- 优先使用 js-ffi Calcit API，必要适配采用定义级 :ffi :js :inline/:file；file 是单个函数表达式源码，不是 import 整个 ESM。
- 状态、批量或 shader 不是自动保留整文件模块的理由；逐项核对 ABI、异步和共享状态，避免重复嵌入导致状态分裂。
- 新增整文件宿主导入必须记录最小复现、替代方案、上游 issue（有缺口时）、局部范围及撤销条件；不以 Dynamic 掩盖公共类型。
- 通过 #104 验证模块安装、片段分发、输出搬移与真正的 Calcit 调用；不只直接测 JS。

### M1 阶段验收与展示

M1 阶段整理随 PR #188 合并（7612e57），已于2026-10-02核对验收材料并关闭 milestone；不以 issue 数量代替验收。2026-10-02 在 c4eb358、Calcit/runtime0.28.0-alpha.3、js-ffi0.2.1-alpha.11、Node24 与锁定 Chromium 上复核如下；命令均为既有门禁，不新增文件或框架。

| 阶段要求 | 实现及可定位断言 | 展示/边界 |
| --- | --- | --- |
| 声明式组件、显式 Model、类型化输入与版本 | [公共合同](api-contract.md)、[组件采样](component-sample.md)，component/direct 测试覆盖同时间失效与乱序采样 | Scene/Motion 无 DOM/GPU 句柄；接口仍多数为实验性，不等于稳定发布 |
| Motion 与直接时间 | `motion-smoke.mjs`、`direct.spec.mjs`：标量/Vec2/颜色/组合、循环端点、非法数值与独立参考 | 导航 Motion 分类中的关键帧/颜色/直接采样页面；CPU 任意函数不自动转 WGSL |
| 固定步长与输入重放 | `simulation-smoke.mjs`、`replay-archive.spec.mjs`：不同显示节奏、检查点、倒退与预算拒绝 | 固定 tick 模拟页面；不是 GPU 历史模拟 #54 |
| Scene 身份及逻辑生命周期 | `presence` 原生/Node、`todolist-smoke.mjs`：重排、父级卸载、25/50/75%打断、重入、重复结算、100次装卸回空 | TodoList 退出期间禁交互，终点逻辑释放；真实资源/指针另归 #51/#34 |
| 可打开的应用与停帧 | `todolist.spec.mjs`：实际增删编辑、Canvas命中、两秒空闲、输入唤醒、DPR1/2、独立原生像素 | 原有动画分类 TodoList，固定日志 `t=0.25/1.65/1.7/2.6/4`；动画与绘制不修改 Model |

复现：`yarn test:motion-browser`（原生38、Node44、浏览器31通过）、`yarn test:simulation`（原生2、Node2通过）、`yarn test:todolist`（原生1、Node7、浏览器6通过）。TodoList 的1000时间帧断言静态节点/绑定身份共享、计划构建1次；100次逻辑装卸回空、释放不重复。这些是正确性/计数证据，不是帧率测量；M1无新的GPU性能承诺，M2同源性能见[消费者报告](consumer-performance.md)。

直观展示：[本地TodoList](http://127.0.0.1:5191/demos/index.html?demo=todolist&t=1.65)，先用固定时间按钮看初始进入/退出中间帧/终点，再用行上的完成、编辑、置顶、删除和“恢复”操作。阶段截图来自已成功的[CI run 36942494503](https://github.com/Quamolit/quamolit/actions/runs/36942494503)：`quamolit-todolist-36942494503` artifact 包含 `todo-0.25.png`、`todo-1.65.png`、`todo-1.7.png`、`todo-2.6.png`、`todo-4.png`；下载复核过中间帧，过期后按上述命令重现，不将PNG/JSON入库。

M1仅验收上述逻辑合同和可编译展示，不要求一般隔离组透明度、通用指针捕获、宿主GPU释放或稳定tag。下一阶段继续 #50/#104 的保留组件消费与 #40/#52 的受限GPU路径，完整绘制归 #53，性能验收暂不以功能通过代替。

### #39：测量协议先行，新增后端持续接入

已有 M0 Canvas 参考基线；当前数值不是 Calcit 组件保留执行或 GPU 吞吐。

- M0 退出验收可复现协议、原始样本、环境、反例回归门禁；不等待 M2 GPU 才完成测量工具。
- 随 #50/#104 接入同一真实 Calcit 场景，分别测声明、采样、计划更新、打包、上传、提交；不能用不同输入计算加速比。
- CPU/M2 新路径报告由 #50/#40/#52 提交，硬件矩阵由 #41 汇总；这些产物消费本协议，不构成对 #50 的循环依赖。

### #33：优先提供同源 Canvas 端到端参考

基础叶图元与资源感知 Canvas document 已接通；嵌套消费者/统一节点诊断仍是 #199 候选。完整字体、路径和回退矩阵继续按 #53/#104 验收，不把首个矩形夹具当作全部能力。

- 基础范围和不支持节点明确诊断；Scene 遍历与动画绑定优先 Calcit，原生 Canvas 能力来自 js-ffi。
- 同一输入/时间与全量参考画面一致，覆盖中间帧、打断与同时间失效；不再为每个页面单写 renderer。
- 公共 [Canvas 实例绘制入口](canvas-instances-reference.md)已进入消费者与[帧报告](consumer-performance.md)，10k 单层一次边界调用仍执行10000次原生绘制；资源表已接通，这不是性能达标证据。

### #51：先接真实消费者需要的资源生命周期

ID/version、Presence 共享租约、实际 buffer/texture 宿主与受限设备恢复已接通；下一步补未实现 loader、跨资源恢复组合和 queue-safe 回收。

- 承接 #49 移交的真实资源清理验收：退出终点、共享最后引用、重入、百次装卸后 live 基线。
- device loss/rebuild 复用 Model 与资源版本；记录旧异步结果迟到的处理。
- 已落地公共 [版本化实例源资源表](instance-resource-table.md)（`quamolit.instance-resource`，定义级 `:file` 宿主 + 类型化 Calcit 入口，100 次装卸回到 live 基线）。
- 已落地纯 Calcit [通用资源生命周期](resource-lifecycle.md)及[多资源注册表](resource-registry.md)：图片、纹理、几何、字体、字形、buffer、pipeline 共用 logical identity、loading/ready/error、generation 隔离与动作协议；相同资源共享引用，零引用资源进入有界 LRU 缓存，迟到结果按完整身份安全释放。Folding Fan 与 100 次多资源装卸已进入自动测试。
- 已落地纯 Calcit [Presence 资源连接](presence-resources.md)：唯一实例源按 buffer identity 获取一次 lease，退出转 idle、重入复用、容量换版本驱逐，100 次真实 Presence 出入后 close 回零。
- Calcit [Presence WebGPU 宿主](presence-webgpu-resources.md)、[device/registry 状态机](presence-device-coordinator.md)、[异步 runner](presence-resource-runner.md)与[加载任务队列](resource-load-queue.md)已驱动 batch 创建、上传、绘制和销毁；队列支持优先级、去重、背压与取消。Presence buffer、[Canvas 图片](image-resource-runner.md)、[texture runner](webgpu-texture-runner.md)及[Scene 图片图层](webgpu-scene-images.md)已有实际消费；font loader与共享宿主已随#203/#205合并，不再列为未实现。本切片通过既有字体入口从Presence文字提取共享租约并同步registry，独立消费者承担退出/重入/100次出入验收；实际看板/capture/resize组合、glyph、geometry、pipeline loader及queue-safe回收仍待接线。

### #38：普通组件合批与显式 instances 共享入口

显式 instances 与矩形批次已消费公共计划和测量协议；普通混合组件的一般自动合批仍不能由单根实例层推断为完成。

- #104 同一组件输入对照 Canvas/实例路径，保持透明层序；10k instances 不物化 10k 组件。
- 报告批次、调用、分配、复制/上传及阶段耗时；新 FFI 按 #35 的 inline/file 优先规则。
- [版本化实例源 GPU 上传](instance-gpu-upload.md)与10k常驻参数已有消费者；连续基版单脏记录写入8 B，跳版本恢复80 kB快照。独立动画另有三路径负载，不能混算加速比。

### #40：让同源消费者实际运行 WebGPU

公共组件与独立消费者已有 CPU→GPU / GPU 时间采样、整层回退及受限 Metal 画面/恢复证据；一般组/复杂绘制、完整画质与发布验收仍未完成。

- 复用 #104 的组件声明、Model、时间、输入与尺寸；支持基础节点、完整图层回退及设备恢复。
- 在命名非软件 adapter 实际比较画面与上传/提交；skip 不计完成。按 #39 协议提供端到端测量。

### #52：标准动画 GPU 采样用同一 Calcit 声明验收

标准标量、Vec2、位置/尺寸基础子集已进入同源消费者；mirror 轨道是 #198 候选。扩展应消费实际图表需求，不另增孤立 shader 页面。

- 独立 CPU 数值参考、乱序时间与既定误差阈值；真实 GPU 时间变化只更新必要参数，记录位置上传量。
- 其他算子明确 CPU 回退；扩展 GPU 子集由实际动画或瓶颈决定。

### #36：完整应用迁移保留在 M3

最小下游安装与 Calcit 公共 API 可用性提前到 M2 #104；本项消费其已验证入口。

- 恢复真实应用，按[完整清单与全屏约定](demo-restoration.md)恢复全部 11 个原有示例的动画/交互，不恢复旧门户；为艺术动画预留分类。compile/release 不再只指 bootstrap；收紧 legacy Dynamic 债务。导航准备不等于恢复完成。

### #34：承接真实交互与卸载清理

消费 #49 的逻辑释放通知，不让 #49 等待本项完整实现。

- 在独立命中索引/指针捕获中验证退出禁交互、父级卸载、重排、释放捕获一次；与 #51 资源清理联合验证。

### #37：扩展同源消费者视觉与交互矩阵

以 #104 同一公共入口扩展 #53/#34 的截图、事件、失败 artifact；最小 Canvas/GPU 集成测试不推迟到 M3。

- 真实 GPU 缺失单独报告；固定时间、资源、seed、DPR 与独立参考继续作为门禁。

### #53：在已贯通主路径上补齐绘制语义

复用已有声明与执行入口；Canvas文字/路径/图片、嵌套clip与隔离组opacity已有切片。当前补齐确定描边、中文字体/失败、缓存失效计数及GPU文字/路径决策，不能把已交付基础重新列成待建后端。

- 同源双后端视觉误差和不支持行为逐项声明；不得以重排透明节点换性能。

### #54：按已测瓶颈扩展 GPU 模拟

等待 #40/#52 的同源 GPU 证据及 #39 的基准协议，不将 compute 或新工具链当作独立交付目标。

- 显式 tick、seed、checkpoint、输入日志与设备恢复，按 #104 的公共 Calcit 消费方式验收。

### #41：汇总真实动画路径的发布证据

消费 #104 的干净消费者、#39 的协议及 #40/#52/#54 的实际测量。

- 按命名设备/分辨率/画质报告目标与未达范围；发布材料给出 Calcit 写法、可控时间、迁移与临时上游绕过清单。

## 选择 PR 的规则

每个 milestone 关闭前必须交付可直观看到的成果：阶段验收矩阵和证据链接、可打开的演示入口、固定时间初始/中间/终点截图（交互功能附操作步骤）、实际计数/性能报告及环境、剩余限制和下一阶段入口。截图与报告进入 CI artifact 或稳定文档；用户能独立复现。阶段未达标时只展示已完成切片，不提前关闭 milestone。

公共 Calcit 集成见[保留组件](retained-component.md)与上方矩阵；声明→槽位→采样→Canvas/受限GPU、生命周期与外部消费已有证据，剩余能力按各自出口验收。

#104 的[同一消费者](isolated-consumer.md)已覆盖安装、公共调用、inline/file重编译、搬移、生命周期、资源/设备与阶段测量；继续扩展其实际缺口，不回到测试宿主拼装。发布tag和完整画质/阶段验收尚未完成。

阶段成果统一从[演示导航](../demos/README.md)发现，新增页面须登记并通过静态产物导航门禁。公共路径、旧参考和 GPU 实验分别标注，导航连通不等于生命周期/GPU 集成验收；下一主线仍是 #49/#50/#104 的生命周期与 #39 的同源测量。

每笔主线 PR 至少交付公共 Calcit 动画能力、同源执行集成、实际性能证据或该路径的可测试性之一。版本升级/FFI 归属整理服务具体运行需求；宿主防御性修复有复现或明确消费者影响时穿插处理。不要让易完成的小修长期替代上述主线。

PR 使用中文，给出实际 API 示例或执行入口、命令/环境/产物、尚未满足的验收与下一切片。同源实现没有新测量时不声称加速。文档计划 PR 不替代功能验收。
