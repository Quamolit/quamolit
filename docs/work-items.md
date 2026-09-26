# 工作项规格与依赖索引

计划版本：v3，2026-09-26。当前优先级、逐 issue 交付与验收责任见 [计划 v3](plan-v3.md)，优先于下方保留的 v2 详细规格。进度以 GitHub 为准；不能按历史未勾选框重新实施已完成工作。

## 推荐开始顺序

当前从 #50/#33/#35 的 Calcit 公共运行集成开始，随后用新增 [#104 独立 Calcit 消费者](https://github.com/Quamolit/quamolit/issues/104)在 M2 验证调用、分发、可控时间与计数；#39 接实际阶段测量，再完成同源 WebGPU。#49 的宿主资源/指针验收分别移交 #51/#34；具体边界以 [v3](plan-v3.md) 为准。下面的顺序与阶段表作为 v2 依赖来源保留，不是当前待办队列。

先实现 [#46](https://github.com/Quamolit/quamolit/issues/46) 的三个可运行夹具，然后交付 [#47](https://github.com/Quamolit/quamolit/issues/47) 最小视觉 CI 和 [#39](https://github.com/Quamolit/quamolit/issues/39) 基准。M1 从 [#30](https://github.com/Quamolit/quamolit/issues/30)、[#48](https://github.com/Quamolit/quamolit/issues/48) 的 API/动画契约开始，接 [#31](https://github.com/Quamolit/quamolit/issues/31)/[#32](https://github.com/Quamolit/quamolit/issues/32)，再处理 [#49](https://github.com/Quamolit/quamolit/issues/49)。M2 在这些前置产物之上落实 [#35](https://github.com/Quamolit/quamolit/issues/35)/[#51](https://github.com/Quamolit/quamolit/issues/51)/[#50](https://github.com/Quamolit/quamolit/issues/50)、[#33](https://github.com/Quamolit/quamolit/issues/33)/[#38](https://github.com/Quamolit/quamolit/issues/38)/[#40](https://github.com/Quamolit/quamolit/issues/40) 和 [#52](https://github.com/Quamolit/quamolit/issues/52)。后续依赖如下表。已经完成的工具链升级 [#42](https://github.com/Quamolit/quamolit/issues/42) 归档在 M0，不重新打开。

## 阶段映射

| Milestone | 工作项 | 前置 issue |
| --- | --- | --- |
| [M2](https://github.com/Quamolit/quamolit/milestone/2) | [#104 独立 Calcit 消费者贯通声明动画与保留渲染](https://github.com/Quamolit/quamolit/issues/104) | #50/#33/#35 的已验证最小切片；资源接 #51，随后接 #38/#40/#52 |
| [M0](https://github.com/Quamolit/quamolit/milestone/4) | [#46 M0：建立三类可运行的动画与绘制基准场景](https://github.com/Quamolit/quamolit/issues/46) | 无 |
| [M0](https://github.com/Quamolit/quamolit/milestone/4) | [#47 M0：把最小固定时间像素与截图检查接入 CI](https://github.com/Quamolit/quamolit/issues/47) | [#46](https://github.com/Quamolit/quamolit/issues/46) |
| [M0](https://github.com/Quamolit/quamolit/milestone/4) | [#39 M0：建立可复现性能基准、预算与回归规则](https://github.com/Quamolit/quamolit/issues/39) | [#46](https://github.com/Quamolit/quamolit/issues/46) |
| [M1](https://github.com/Quamolit/quamolit/milestone/1) | [#48 M1：定义可直接采样并可降低为 WGSL 的动画描述](https://github.com/Quamolit/quamolit/issues/48) | [#30](https://github.com/Quamolit/quamolit/issues/30) |
| [M1](https://github.com/Quamolit/quamolit/milestone/1) | [#49 M1：实现过渡打断、稳定身份与进入退出生命周期](https://github.com/Quamolit/quamolit/issues/49) | [#30](https://github.com/Quamolit/quamolit/issues/30)、[#31](https://github.com/Quamolit/quamolit/issues/31)、[#48](https://github.com/Quamolit/quamolit/issues/48)、[#32](https://github.com/Quamolit/quamolit/issues/32) |
| [M1](https://github.com/Quamolit/quamolit/milestone/1) | [#30 M1：确定声明式组件、动画 Model 与迁移 API 契约](https://github.com/Quamolit/quamolit/issues/30) | [#46](https://github.com/Quamolit/quamolit/issues/46) |
| [M1](https://github.com/Quamolit/quamolit/milestone/1) | [#31 M1：实现任意时间采样与独立固定步长模拟](https://github.com/Quamolit/quamolit/issues/31) | [#30](https://github.com/Quamolit/quamolit/issues/30)、[#48](https://github.com/Quamolit/quamolit/issues/48) |
| [M1](https://github.com/Quamolit/quamolit/milestone/1) | [#32 M1：定义 Scene IR、动画绑定、稳定身份与执行边界](https://github.com/Quamolit/quamolit/issues/32) | [#30](https://github.com/Quamolit/quamolit/issues/30)、[#48](https://github.com/Quamolit/quamolit/issues/48) |
| [M2](https://github.com/Quamolit/quamolit/milestone/2) | [#50 M2：实现保留执行计划、增量失效与按需帧调度](https://github.com/Quamolit/quamolit/issues/50) | [#32](https://github.com/Quamolit/quamolit/issues/32)、[#31](https://github.com/Quamolit/quamolit/issues/31)、[#48](https://github.com/Quamolit/quamolit/issues/48)、[#39](https://github.com/Quamolit/quamolit/issues/39) |
| [M2](https://github.com/Quamolit/quamolit/milestone/2) | [#51 M2：建立版本化资源表、缓存失效与设备恢复协议](https://github.com/Quamolit/quamolit/issues/51) | [#32](https://github.com/Quamolit/quamolit/issues/32)、[#35](https://github.com/Quamolit/quamolit/issues/35) |
| [M2](https://github.com/Quamolit/quamolit/milestone/2) | [#52 M2：实现标准动画的 GPU 采样与 CPU 等价验证](https://github.com/Quamolit/quamolit/issues/52) | [#48](https://github.com/Quamolit/quamolit/issues/48)、[#40](https://github.com/Quamolit/quamolit/issues/40)、[#51](https://github.com/Quamolit/quamolit/issues/51) |
| [M2](https://github.com/Quamolit/quamolit/milestone/2) | [#33 M2：实现基础 Scene IR 的 Canvas2D 参考与回退](https://github.com/Quamolit/quamolit/issues/33) | [#32](https://github.com/Quamolit/quamolit/issues/32)、[#51](https://github.com/Quamolit/quamolit/issues/51)、[#47](https://github.com/Quamolit/quamolit/issues/47) |
| [M2](https://github.com/Quamolit/quamolit/milestone/2) | [#35 M2：建立 js-ffi 的批量宿主边界与能力探测](https://github.com/Quamolit/quamolit/issues/35) | [#32](https://github.com/Quamolit/quamolit/issues/32) |
| [M2](https://github.com/Quamolit/quamolit/milestone/2) | [#38 M2：实现自动合批与数据驱动的 instances 图层](https://github.com/Quamolit/quamolit/issues/38) | [#32](https://github.com/Quamolit/quamolit/issues/32)、[#50](https://github.com/Quamolit/quamolit/issues/50)、[#51](https://github.com/Quamolit/quamolit/issues/51)、[#39](https://github.com/Quamolit/quamolit/issues/39) |
| [M2](https://github.com/Quamolit/quamolit/milestone/2) | [#40 M2：实现首个 WebGPU 渲染主路径及基础回退](https://github.com/Quamolit/quamolit/issues/40) | [#32](https://github.com/Quamolit/quamolit/issues/32)、[#38](https://github.com/Quamolit/quamolit/issues/38)、[#35](https://github.com/Quamolit/quamolit/issues/35)、[#51](https://github.com/Quamolit/quamolit/issues/51)、[#47](https://github.com/Quamolit/quamolit/issues/47)、[#33](https://github.com/Quamolit/quamolit/issues/33) |
| [M3](https://github.com/Quamolit/quamolit/milestone/3) | [#53 M3：补齐文字、路径、裁剪与组透明度的跨后端语义](https://github.com/Quamolit/quamolit/issues/53) | [#33](https://github.com/Quamolit/quamolit/issues/33)、[#40](https://github.com/Quamolit/quamolit/issues/40)、[#51](https://github.com/Quamolit/quamolit/issues/51) |
| [M3](https://github.com/Quamolit/quamolit/milestone/3) | [#34 M3：实现独立命中索引、事件层序与指针捕获](https://github.com/Quamolit/quamolit/issues/34) | [#32](https://github.com/Quamolit/quamolit/issues/32)、[#50](https://github.com/Quamolit/quamolit/issues/50)、[#49](https://github.com/Quamolit/quamolit/issues/49) |
| [M3](https://github.com/Quamolit/quamolit/milestone/3) | [#36 M3：恢复真实应用入口并迁移代表性组件](https://github.com/Quamolit/quamolit/issues/36) | [#33](https://github.com/Quamolit/quamolit/issues/33)、[#40](https://github.com/Quamolit/quamolit/issues/40)、[#34](https://github.com/Quamolit/quamolit/issues/34)、[#49](https://github.com/Quamolit/quamolit/issues/49)、[#53](https://github.com/Quamolit/quamolit/issues/53) |
| [M3](https://github.com/Quamolit/quamolit/milestone/3) | [#37 M3：扩展完整视觉回归 CI 与跨后端诊断](https://github.com/Quamolit/quamolit/issues/37) | [#47](https://github.com/Quamolit/quamolit/issues/47)、[#53](https://github.com/Quamolit/quamolit/issues/53)、[#34](https://github.com/Quamolit/quamolit/issues/34) |
| [M4](https://github.com/Quamolit/quamolit/milestone/5) | [#54 M4：实现显式状态的 GPU 常驻模拟与重放](https://github.com/Quamolit/quamolit/issues/54) | [#31](https://github.com/Quamolit/quamolit/issues/31)、[#40](https://github.com/Quamolit/quamolit/issues/40)、[#52](https://github.com/Quamolit/quamolit/issues/52)、[#51](https://github.com/Quamolit/quamolit/issues/51)、[#39](https://github.com/Quamolit/quamolit/issues/39) |
| [M4](https://github.com/Quamolit/quamolit/milestone/5) | [#41 M4：完成跨设备性能验收、后端决策与发布资料](https://github.com/Quamolit/quamolit/issues/41) | [#36](https://github.com/Quamolit/quamolit/issues/36)、[#37](https://github.com/Quamolit/quamolit/issues/37)、[#39](https://github.com/Quamolit/quamolit/issues/39)、[#40](https://github.com/Quamolit/quamolit/issues/40)、[#52](https://github.com/Quamolit/quamolit/issues/52)、[#54](https://github.com/Quamolit/quamolit/issues/54) |

本依赖图无环；可以按已合并前置产物拆小 PR，但不得提前关闭未完成的整项。PR [#45](https://github.com/Quamolit/quamolit/pull/45) 只推进 [#31](https://github.com/Quamolit/quamolit/issues/31) 的顺序求值部分，不能自动关闭 [#31](https://github.com/Quamolit/quamolit/issues/31)。

## M0 · 代表场景与性能基线

### [#46 M0：建立三类可运行的动画与绘制基准场景](https://github.com/Quamolit/quamolit/issues/46)

把 Quamolit 的原有组件/过渡理念变成可测场景，作为后续 CPU、Canvas2D 和 WebGPU 的共同输入。

依赖：无。

实现范围：

- 新增独立开发入口，保留真实状态输入：UI 场景覆盖渐变、目标中断、进入/退出；实例场景支持 1k/10k/100k 同类小图元；文字/路径场景固定字体、内容和几何。
- 初版可以先基于现有 Canvas2D 和明确的数学参考值；不依赖新 Scene IR，后续由同一 fixture 数据接入新后端。不能等待 [#36](https://github.com/Quamolit/quamolit/issues/36) 才建立基线。
- 统一 fixture ID、seed、采样时间、输入事件记录、尺寸、DPR、实例数量和资源 ready/error 状态；README 写清启动方式和仍未支持的场景。

验收：

- [ ] 三个场景都能从独立入口实际运行，连续操作和固定时间截图可复现；给出初始/中间/终点以及打断后画面证据。
- [ ] 在冷启动和重新加载后，同一 fixture 数据产生同一参考模型；旧版帧依赖动画使用固定采样序列，明确局限。
- [ ] 无需先恢复整个旧应用，且不能用 bootstrap 或空场景作为成功证据。

边界：本项建立输入与参考画面，不实现通用时间 API 或完整渲染器。

### [#47 M0：把最小固定时间像素与截图检查接入 CI](https://github.com/Quamolit/quamolit/issues/47)

让早期 API 和渲染重构拥有可执行的浏览器回归门禁。

依赖：[#46](https://github.com/Quamolit/quamolit/issues/46)。

实现范围：

- 新增 yarn test:visual，固定浏览器版本、字体/资源、视口、DPR、时间与 seed；CI 安装所需浏览器并执行，而不只 compile:visual。
- 最小覆盖矩形/变换/渐变中间帧、重复绘制、固定序列重放；保存实际图、期望图、diff 与输入 manifest。
- 记录基线生成和人工审查流程，失败后不得自动接受新基线；浏览器缺失或页面异常必须报错。

验收：

- [ ] 相同环境连续运行至少 3 次结果稳定；故意改变一个位置或颜色能导致失败并上传可诊断产物。
- [ ] 精确像素区域与抗锯齿容差区域分开声明；字体/资源未就绪时明确失败或等待有界超时。
- [ ] 在真实 GitHub Actions 运行 yarn test:visual 并检查失败 artifact 的产生；扩展覆盖归 [#37](https://github.com/Quamolit/quamolit/issues/37)。

边界：M0 使用基础 Canvas fixture，不要求云端提供真实 GPU；不得把 WebGPU 缺失的 skip 当成 GPU 验收。

### [#39 M0：建立可复现性能基准、预算与回归规则](https://github.com/Quamolit/quamolit/issues/39)

从第一阶段量化完整帧成本，后续每项优化都能回到相同输入和环境验证。

依赖：[#46](https://github.com/Quamolit/quamolit/issues/46)。

实现范围：

- 新增 yarn bench 及 fixture 参数，记录 setup/组件求值/采样/变更计算/打包/上传/提交/可用 GPU 时间、rAF 帧间隔和掉帧；区分已测/不可用指标。
- 固定 seed、事件、实际像素尺寸、DPR、抗锯齿、alpha/混合、设备/GPU、浏览器/驱动、供电模式；记录 git SHA、命令和原始数据。
- 预热 5 秒、采样 30 秒、独立运行至少 3 次；输出 p50/p95/p99、draw/上传/分配/资源计数、初始化与首次使用成本。
- 建立 1k 混合节点、10k 简单实例和 100k 压力档；60/120 FPS 是验证目标，不能作为未测性能宣传。该基准完成后继续被所有阶段使用。

验收：

- [ ] 从干净构建用一条命令生成报告和原始样本；同设备复跑并说明噪声，不把 CI 软件 GPU 的吞吐外推到用户设备。
- [ ] 回归规则遵循 docs/verification.md：同环境重复确认；新代码时间、上传或资源增长异常能触发可诊断失败。
- [ ] 首次提交同时记录当前基线和待达目标；没有可用旧运行路径的项目写明不可比较，不构造虚假加速比。

边界：GPU timestamp 不是整帧耗时；禁止用 queue.submit 的 CPU 时间冒充 GPU 执行时间。

## M1 · 动画函数与组件契约

### [#48 M1：定义可直接采样并可降低为 WGSL 的动画描述](https://github.com/Quamolit/quamolit/issues/48)

让 tween、keyframes、周期运动等标准动画表达为可检查的数据，同时保留任意 Calcit 纯函数的 CPU 扩展。

依赖：[#30](https://github.com/Quamolit/quamolit/issues/30)。

实现范围：

- 定义带类型的 Motion IR：常量、时间、标量/向量插值、显式 easing、关键帧和有界组合；以最小集合起步，算子与单位有明确 schema。
- 定义 begin/end、duration=0、负时间、重复关键帧、非法数值、循环端点与 mirror 语义；颜色空间、角度单位和透明度规则与 [#30](https://github.com/Quamolit/quamolit/issues/30) 一致。
- 提供 CPU 参考求值器及 descriptor ID/version；可序列化节点不包含闭包或 GPU 句柄，CPU 自定义函数放在单独注册表并标记不可 GPU 降低。
- 为 GPU 子集规定数值容差与不支持算子的可诊断回退；WGSL 实现在 [#52](https://github.com/Quamolit/quamolit/issues/52)，不在此构造通用 Calcit→WGSL 编译器。

验收：

- [ ] 用手算结果验证 0/0.25/0.5/1 和端点左右邻域；乱序采样同一输入得到同一结果。
- [ ] 非法 duration/NaN/Infinity 等行为有测试；类型检查阻止不匹配的插值端点。
- [ ] 至少一个旧渐变组件可用描述符表示，CPU 自定义函数仍可用且不会被静默转成 GPU 代码。

边界：任意用户闭包不得声称自动在 GPU 执行；CPU/GPU 不承诺浮点逐位一致。

### [#49 M1：实现过渡打断、稳定身份与进入退出生命周期](https://github.com/Quamolit/quamolit/issues/49)

保留 Quamolit 原有动画 Model 及函数生成过渡帧的理念，使删除、重排和交互打断可重放。

依赖：[#30](https://github.com/Quamolit/quamolit/issues/30)、[#31](https://github.com/Quamolit/quamolit/issues/31)、[#48](https://github.com/Quamolit/quamolit/issues/48)、[#32](https://github.com/Quamolit/quamolit/issues/32)。

实现范围：

- 显式保存 from/to/start/duration/easing、组件 key 和过渡状态；打断时从当前采样值建立新过渡，要求位置连续；需要速度连续的模式单独规定。
- 实现 enter/present/exit 生命周期：退出期间保留展示数据，完成后卸载并释放资源；同 key 重入的取消/复用规则明确。
- 定义父级卸载、兄弟重排、重复 key 报错、类型改变后的身份处理，以及退出节点是否仍可交互。
- 完成 fade 与可重排列表示例，消除依赖绘制副作用的退出缓存逻辑。

验收：

- [ ] 在动画 25%/50%/75% 打断后无位置跳变；重复打断、退出后重入、父级退出和兄弟重排有独立测试。
- [ ] 移除一百次再重建后，组件/过渡/资源计数回到基线；卸载只发生一次，指针捕获清理与 [#34](https://github.com/Quamolit/quamolit/issues/34) 协同。
- [ ] 固定输入事件序列可逐帧重放，动画结束不再请求连续帧。

边界：不同连续性模式不能混用；任何资源缓存不得成为未记录的逻辑动画状态。

### [#30 M1：确定声明式组件、动画 Model 与迁移 API 契约](https://github.com/Quamolit/quamolit/issues/30)

声明式定义组件，通过函数/动画描述产生中间帧；应用拥有逻辑动画 Model，框架优化求值与执行。

本项的具体语义、能力状态和迁移对照见 [M1 API 契约](api-contract.md)；实现进度仍以 issue/PR 为准。

依赖：[#46](https://github.com/Quamolit/quamolit/issues/46)。

实现范围：

- 约定 props/应用状态/动画参数/资源状态的边界；分别定义直接时间采样与历史模拟，草案名称 sample-at/step-simulation 可在此确定。
- 明确空间单位、角度、颜色空间、预乘 alpha、组透明度、层叠顺序、交互顺序以及同一时间输入变化的规则。
- 定义稳定 key、组件身份和扩展点；标准 Motion IR 可被后端识别，任意 Calcit 纯函数保持 CPU 路径。
- 给出旧 defcomp/on-tick/fade 缓存到新 API 的迁移表；用已有可执行能力提供最小入口样例，未来 API 明确标成草案。标准动画和完整生命周期的实现示例分别由 [#48](https://github.com/Quamolit/quamolit/issues/48)/[#49](https://github.com/Quamolit/quamolit/issues/49) 验收，不作为本项关闭的反向依赖。

验收：

- [ ] 文档对每项语义给出正常/边界例子，示例可由明确入口严格编译；不能只有概念图。
- [ ] 显式列出 API 已实现/拟议/兼容状态；审阅者可区分 [#45](https://github.com/Quamolit/quamolit/issues/45) 的顺序求值与任意时间采样。
- [ ] 下游无需 React/Live 运行时；技术选择若改变路线，先在同一 PR 的设计记录中给出证据。

边界：本项规定接口，不重复实现 [#48](https://github.com/Quamolit/quamolit/issues/48)、[#31](https://github.com/Quamolit/quamolit/issues/31)、[#49](https://github.com/Quamolit/quamolit/issues/49) 或 [#32](https://github.com/Quamolit/quamolit/issues/32)；部分 PR 不自动关闭整项。

### [#31 M1：实现任意时间采样与独立固定步长模拟](https://github.com/Quamolit/quamolit/issues/31)

将直接求动画帧和依赖历史的状态推进分开，支持截图、scrub、暂停、倒放与重放。

依赖：[#30](https://github.com/Quamolit/quamolit/issues/30)、[#48](https://github.com/Quamolit/quamolit/issues/48)。

实现范围：

- 提供 sample-at 一类入口，给定动画描述/模型/资源快照和任意有限时间直接求值；允许乱序、倒放和同一时间的新输入。
- 保留或重命名 [#45](https://github.com/Quamolit/quamolit/issues/45) 的顺序求值作为迁移基础，新增固定步长模拟：dt、tick index、输入队列、重置与检查点；模拟不可隐式时间倒退。
- 将 host wall time 与 simulation time 分离；暂停/速度/seek 显式变换，错误时间与超量追帧策略可测试。
- 重绘不推进任何逻辑状态；同一时间缓存须同时验证输入/资源/视口版本，不能只看 time。

验收：

- [ ] sample-at 对 t=[1,0,0.5,0.25,1] 的输出与逐个从头采样一致；0/边界/无效数值有测试。
- [ ] 同一时间变更模型、资源 ready 状态或视口后产生新结果；未变化的完整输入可复用。
- [ ] 固定 dt 模拟在不同显示帧节奏下、输入映射到相同 tick 时得到相同结果；覆盖暂停、单步、重置、检查点恢复和倒退拒绝。
- [ ] 现有 yarn test:clock 持续通过，并引入可执行的 motion 测试和固定时间浏览器示例。

边界：PR [#45](https://github.com/Quamolit/quamolit/issues/45) 只提供顺序求值基础，不得自动关闭本 issue。不同积分步长不承诺相同结果。

### [#32 M1：定义 Scene IR、动画绑定、稳定身份与执行边界](https://github.com/Quamolit/quamolit/issues/32)

Scene IR 表达场景语义及动画绑定，后端执行计划独立承载缓存、批次和宿主资源。

依赖：[#30](https://github.com/Quamolit/quamolit/issues/30)、[#48](https://github.com/Quamolit/quamolit/issues/48)。

实现范围：

- 定义图元/group/transform/clip、Motion 引用、资源 ID/version、事件目标和 batch 数据源；核心不保存 DOM/GPU 句柄或任意闭包。
- 明确逻辑节点 key 与物理 buffer slot 分离，插入/删除/重排/类型改变时身份如何继承；重复 key 是可诊断错误。
- 区分结构、几何/资源、属性、仅时间的变更；typed array 外部数据通过版本化资源引用进入，不能原地修改后无失效信号。
- 写出序列化边界、绘制顺序和命中顺序，以及几何和资源复用规则；执行计划实现归 [#50](https://github.com/Quamolit/quamolit/issues/50)。

验收：

- [ ] 不使用 Canvas 即可构造/检查/序列化受支持 IR；类型检查拒绝无效节点数据。
- [ ] 同 key 重排保留身份，不同父级或类型按规则处理；删除/新增与动画绑定变化的变更集有测试。
- [ ] 实例图层可在一个逻辑节点表达大量数据，且不强制物化一个组件/对象树节点对应一个实例。

边界：不得把 Scene IR 设计成 Canvas 命令逐条翻译；不要把每帧全量树 diff 固定成唯一执行方案。

## M2 · 增量执行与 WebGPU 主路径

### [#50 M2：实现保留执行计划、增量失效与按需帧调度](https://github.com/Quamolit/quamolit/issues/50)

时间前进时更新必要动画绑定和批次，避免把整个声明式组件树每帧重建。

依赖：[#32](https://github.com/Quamolit/quamolit/issues/32)、[#31](https://github.com/Quamolit/quamolit/issues/31)、[#48](https://github.com/Quamolit/quamolit/issues/48)、[#39](https://github.com/Quamolit/quamolit/issues/39)。

实现范围：

- 从逻辑 Scene/Motion IR 建立后端执行计划；区分拓扑、几何/资源、属性、时间变化，记录依赖及稳定输出。
- 缓存键包含实际依赖的模型/资源/视口/画质/动画版本；同一时间输入变化必须刷新。普通纯组件可显式声明依赖，不能猜测任意闭包捕获。
- 缓存与缓冲区可变，但对用户可观察的模型/时间/生命周期语义保持不变；建立 resource/geometry/plan revision 和可观测失效原因。
- 实现按需绘制、空闲停帧、暂停/恢复、resize、资源 ready 与输入事件唤醒；合并一帧内重复请求，避免无限积压。

验收：

- [ ] 静态部分在 1000 个仅时间变化的帧中不重建几何/pipeline；用计数器验证而非仅比较 FPS。
- [ ] 同一时间更换模型、资源版本、DPR 或视图依赖，结果正确刷新；增量结果与全量参考一致。
- [ ] 空闲至少 2 秒没有连续绘制提交，输入可重新唤醒；可调度场景不会丢弃必须处理的输入事件。

边界：不得以每帧全树深比较替代依赖失效；具体缓存策略可变更，但需保持参考结果与提交量证据。

### [#51 M2：建立版本化资源表、缓存失效与设备恢复协议](https://github.com/Quamolit/quamolit/issues/51)

将逻辑资源身份与 Canvas/WebGPU 宿主句柄分开，支持复用、释放和设备丢失后重建。

依赖：[#32](https://github.com/Quamolit/quamolit/issues/32)、[#35](https://github.com/Quamolit/quamolit/issues/35)。

实现范围：

- 为 geometry、texture、font/glyph、buffer、pipeline 定义资源 ID/version、ready/error/loading、所有权和释放规则；逻辑 IR 只保存引用。
- 后台资源完成通过显式版本更新触发新帧；缓存记录依赖与容量，支持有界回收，不在绘制中隐式创建未跟踪资源。
- GPU device lost 后根据可恢复描述重建资源；不可恢复来源显式失败或进入已声明的回退路径。
- 记录 allocated/live/released、上传字节和缓存命中；释放在 GPU 使用完成后安全进行。

验收：

- [ ] 重复装卸 100 次后 live 资源回到稳定基线；稳定动画中 buffer/texture/pipeline 不逐帧增长。
- [ ] 资源延迟成功/失败/替换、resize/DPR 变化和模拟 device loss 都有测试；恢复后资源版本与画面正确。
- [ ] 同一 logical scene 可跨后端重新建立宿主资源，不含不可序列化 GPU/DOM 句柄。

边界：不要求物理显存立刻归零；用逻辑所有权、计数与持续趋势判断泄漏。

### [#52 M2：实现标准动画的 GPU 采样与 CPU 等价验证](https://github.com/Quamolit/quamolit/issues/52)

让动画描述和实例参数长期保留在 GPU，每帧优先更新时间与必要输入，减少 CPU 求值和上传。

依赖：[#48](https://github.com/Quamolit/quamolit/issues/48)、[#40](https://github.com/Quamolit/quamolit/issues/40)、[#51](https://github.com/Quamolit/quamolit/issues/51)。

实现范围：

- 将最小 Motion IR 子集降低为 WGSL；独立、无历史的位移/旋转/颜色/透明度优先在 vertex shader 中采样，compute 仅在复用或成本证据需要时引入。
- 共享实例参数与时间 uniform；参数变化更新对应范围，禁止每帧把整份实例结果从 CPU 再上传。
- CPU 自定义函数走显式 CPU 更新批次；不支持的算子报告能力与 fallback，不静默丢失动画。
- 定义 f32 误差、关键帧边界、颜色/alpha 与角度规则；CPU/GPU 对比可读回小样本，正常动画不能同步读回全量结果。

验收：

- [ ] 同一描述在固定、乱序时间及随机但固定 seed 的样本点，数值满足 docs/verification.md 容差且关键帧端点正确。
- [ ] 同一场景 CPU/GPU 画面满足已审查视觉容差；日志列出哪些绑定在 CPU/GPU 执行。
- [ ] 10k 标准实例稳定播放时 CPU 上传量随变更参数而非全部实例数增长；报告实际上传字节/批次数/耗时，不以 shader 编译成功代替验收。

边界：这是标准描述符子集的双后端实现；有历史模拟单独由 [#54](https://github.com/Quamolit/quamolit/issues/54) 跟踪。

### [#33 M2：实现基础 Scene IR 的 Canvas2D 参考与回退](https://github.com/Quamolit/quamolit/issues/33)

为 WebGPU 主路径提供可运行的基础语义参考和明确回退，不阻塞早期 GPU 验证。

依赖：[#32](https://github.com/Quamolit/quamolit/issues/32)、[#51](https://github.com/Quamolit/quamolit/issues/51)、[#47](https://github.com/Quamolit/quamolit/issues/47)。

实现范围：

- 先覆盖 group、transform、矩形/圆、基础图片、alpha 和基础裁剪，消费 IR 而非旧 native-save/restore 指令树。
- 绘制只读场景和资源；不推进动画、不派发更新、不建立事件区域。处理清屏、resize、DPR 和资源未就绪/失败。
- 定义基础能力表和按完整子场景/图层的回退粒度，避免每个图元跨后端上传/回读。
- 文字、复杂路径与隔离层语义扩展归 [#53](https://github.com/Quamolit/quamolit/issues/53)，本项明确当前支持边界。

验收：

- [ ] 固定时间基础场景通过精确内区像素与边缘容差测试；连续绘制同一场景不改变模型。
- [ ] 强制禁用 WebGPU 时基础场景仍可运行；不支持的高级能力必须显式报错/降级。
- [ ] 与 [#40](https://github.com/Quamolit/quamolit/issues/40) 共享同一 fixture 和画质设置，记录跨后端差异。

边界：Canvas2D 基础参考不是完整旧应用迁移前置，不要求在实现 [#40](https://github.com/Quamolit/quamolit/issues/40) 前完成全部高级图形。

### [#35 M2：建立 js-ffi 的批量宿主边界与能力探测](https://github.com/Quamolit/quamolit/issues/35)

可跨项目复用的 JS 生态基础 API 在 calcit-lang/js-ffi 封装，以 Calcit 类型化公共入口和版本化接口供 Quamolit 使用；必要的通用 JS 实现仍属上游。Quamolit 专属的 Scene/Motion 语义及编排留在本仓库，优先用 Calcit 实现。

依赖：[#32](https://github.com/Quamolit/quamolit/issues/32)。

实现范围：

- 盘点 DOM、Canvas2D、GPU、TypedArray、帧调度与资源 API；按是否跨项目复用划分通用封装与 Quamolit 专属策略。通用 FFI PR 提交到解析后的 js-ffi 仓库并发布/引用所需 tag，既可包含 Calcit 类型定义，也可包含必要的通用 JS 实现。同步、无状态、原始 ABI 的小适配器优先用 Calcit 0.22 起定义级 `:ffi :js :inline/:file` 嵌入；有状态/async/shader/trait/Struct 宿主才保留独立 `.mjs`，测试夹具桥接放 `test/host/`；约束见 [Calcit 优先的 FFI 边界](calcit-first-ffi.md)。
- 定义按资源/批次调用的 API，避免每个属性或每个实例跨越宿主边界；在关键路径记录调用次数与传输字节。
- 为能力探测、设备失败、资源释放、无浏览器 native 测试提供明确返回契约；Quamolit 保留场景到后端的 Calcit 编排和专属适配，不把业务格式交给通用包解释。
- 采用当前已发布且适用的新版本，保持 Calcit/runtime/deps/lockfile/CI 对齐；版本回退需最小复现和上游问题链接。

验收：

- [ ] 新主路径无散落的直接 JS FFI；通用封装即使使用 JS 仍归上游，Quamolit 专属 JS 只留本仓库；模块归属、上游 PR、tag 和调用方依赖可追踪。
- [ ] 严格 Calcit 编译、JS runtime 烟测与浏览器 fixture 均通过；不以宽泛 Dynamic 擦除可以表达的类型关系。
- [ ] 10k 实例路径的 FFI 调用随批次/脏范围变化，给出计数，而非随每个标量字段线性增长。

边界：跨仓库变更需先确认路径和 remote；测试夹具的浏览器驱动代码与生产库 FFI 分开审查。

### [#38 M2：实现自动合批与数据驱动的 instances 图层](https://github.com/Quamolit/quamolit/issues/38)

普通组件自动利用批处理，大规模场景直接提交结构化数据源，避免每实例一个 Calcit 组件。

依赖：[#32](https://github.com/Quamolit/quamolit/issues/32)、[#50](https://github.com/Quamolit/quamolit/issues/50)、[#51](https://github.com/Quamolit/quamolit/issues/51)、[#39](https://github.com/Quamolit/quamolit/issues/39)。

实现范围：

- 定义 positions/sizes/colors/transforms/可选 pick ID 的 schema、typed-array layout 与版本/脏范围；按字段更新冷热分离。
- 实现普通图元的合法合批与显式 instances，遵守层叠、混合、裁剪与资源边界；逻辑 key 不等于可复用 buffer slot。
- 复用稳定几何和缓冲区；定义容量扩展、稀疏更新、删除和回收，不每帧创建 GPU 对象。
- 以至少 10k 实例和一个真实样式场景比较组件路径/实例数据路径，输出可供 Canvas2D 与 WebGPU 消费的批次协议；实际 GPU 消费由 [#40](https://github.com/Quamolit/quamolit/issues/40) 接入，不作为本项的反向依赖。

验收：

- [ ] 一个实例图层容纳 10k 数据，不生成 10k 组件；局部变更只更新对应字段/范围，日志给出字节数。
- [ ] 透明对象交错顺序、裁剪和不同资源不能被错误合并；增量输出与全量参考一致。
- [ ] 静态资源稳定、无逐帧增长；CPU 时间、提交数与上传量对比 [#39](https://github.com/Quamolit/quamolit/issues/39) 基线。

边界：不承诺任意透明场景一次 draw；结构布局选择必须有测量依据。

### [#40 M2：实现首个 WebGPU 渲染主路径及基础回退](https://github.com/Quamolit/quamolit/issues/40)

尽早用真实 WebGPU 路径验证 Scene/instances/资源契约，并比较 Use.GPU 底层复用成本。

依赖：[#32](https://github.com/Quamolit/quamolit/issues/32)、[#38](https://github.com/Quamolit/quamolit/issues/38)、[#35](https://github.com/Quamolit/quamolit/issues/35)、[#51](https://github.com/Quamolit/quamolit/issues/51)、[#47](https://github.com/Quamolit/quamolit/issues/47)、[#33](https://github.com/Quamolit/quamolit/issues/33)。

实现范围：

- 消费同一 Scene IR/instances，实现矩形/圆/图片的实例化与基础 transform/clip/alpha；不要求先完成全部 Canvas2D 功能。
- 采用稳定 pipeline/bind group/geometry，按批次提交；记录失效原因，保留基础 Canvas2D 回退能力与显式 capability 路径。
- 测试 adapter/device 获取失败、device loss、resize/DPR、资源重建；切换发生在完整图层/子场景边界，避免每图元跨后端复制。
- 小范围比较原生 WebGPU 与 @use-gpu/core、shader 等当前版本的适配、包体和维护成本；完整 Live 运行时采纳需独立设计证据。

验收：

- [ ] 在具备真实 WebGPU 的设备上运行同源 fixture，与 CPU/Canvas 参考比较画面并输出 [#39](https://github.com/Quamolit/quamolit/issues/39) 指标；提交 adapter 和能力记录。
- [ ] 强制无 GPU、设备丢失和重新初始化可验证；支持范围外的功能不会静默漏绘。
- [ ] 稳定场景不逐帧新建 pipeline/texture/buffer，绘制无逻辑模型更新副作用。

边界：本项是可使用的最小主路径，不只是 API 探测 demo；GPU 动画采样在 [#52](https://github.com/Quamolit/quamolit/issues/52)，历史模拟在 [#54](https://github.com/Quamolit/quamolit/issues/54)。

## M3 · 完整 2D 功能与应用迁移

### [#53 M3：补齐文字、路径、裁剪与组透明度的跨后端语义](https://github.com/Quamolit/quamolit/issues/53)

让真实 2D 应用能复用同一场景描述，明确高成本图形的实现和画质边界。

依赖：[#33](https://github.com/Quamolit/quamolit/issues/33)、[#40](https://github.com/Quamolit/quamolit/issues/40)、[#51](https://github.com/Quamolit/quamolit/issues/51)。

实现范围：

- 文本区分排版/字形缓存与 transform 动画，覆盖中文、字体回退和加载失败；先验证正确性，再按工作负载选择 glyph atlas/SDF 或纹理缓存。
- 路径区分几何不变的变换与拓扑/控制点变化，缓存细分或栅格结果并记录失效；明确填充规则、描边接头和缩放质量。
- 实现嵌套裁剪、图片采样、组透明度隔离层与混合顺序；不能把组 opacity 简单下推到所有重叠子节点。
- 为每个图元列出 Canvas2D/WebGPU 支持情况、精确/容差差异和回退/错误行为，控制离屏目标与缓存容量。

验收：

- [ ] 中文文本、路径变换/形变、嵌套裁剪、重叠透明子节点和图片缩放的固定时间场景通过 [#37](https://github.com/Quamolit/quamolit/issues/37)。
- [ ] 文字仅移动时不逐帧重新排版或重建 atlas；几何不变时不重新细分，计数器和基准可证实。
- [ ] 任何不支持的功能有显式报告与可验证回退；不能悄悄忽略样式或以关闭抗锯齿冒充加速。

边界：完整 SVG/CSS 排版不是本项目标；新增范围需明确需求与基准，不构建通用浏览器渲染器。

### [#34 M3：实现独立命中索引、事件层序与指针捕获](https://github.com/Quamolit/quamolit/issues/34)

交互从场景及动画语义独立生成，适用于增量执行与不同渲染后端。

依赖：[#32](https://github.com/Quamolit/quamolit/issues/32)、[#50](https://github.com/Quamolit/quamolit/issues/50)、[#49](https://github.com/Quamolit/quamolit/issues/49)。

实现范围：

- 定义变换逆映射、嵌套裁剪、层序、隐藏/透明节点、冒泡和退出节点交互策略。
- 实现有界的 CPU 候选索引；普通交互在同一时间采样候选节点，不因 GPU 动画要求逐帧全量读回。
- 处理 pointer capture、节点卸载/退出、resize、拖拽、坐标/DPR 和资源变化。
- GPU picking 仅为单独声明的密集图层选项，需规定异步延迟、过期结果和排序。

验收：

- [ ] 无 Canvas 单元测试覆盖重叠、旋转、裁剪、重排；与同一时间可见图元命中一致。
- [ ] 浏览器拖拽跨出画布、捕获节点被移除、快速切换目标均按规则结束；不会留下捕获状态。
- [ ] 大量非交互图元不导致每次指针事件全树扫描，用访问节点计数和基准证明。

边界：不得让 paint 决定是否能命中；GPU readback 不进入普通 UI 事件的必经同步路径。

### [#36 M3：恢复真实应用入口并迁移代表性组件](https://github.com/Quamolit/quamolit/issues/36)

使普通 compile/release 对应真正可用的 Quamolit 应用，而非编译占位入口。

依赖：[#33](https://github.com/Quamolit/quamolit/issues/33)、[#40](https://github.com/Quamolit/quamolit/issues/40)、[#34](https://github.com/Quamolit/quamolit/issues/34)、[#49](https://github.com/Quamolit/quamolit/issues/49)、[#53](https://github.com/Quamolit/quamolit/issues/53)。

实现范围：

- 按[恢复清单](demo-restoration.md)迁移全部 11 个原有动画/交互，不恢复旧门户；采用全屏 Canvas 与可收起 DOM 浮层，逐项提供行为和中间帧证据。此要求替代“只迁移代表性组件”。
- 接通新动画描述、IR 和执行计划；默认 Vite 入口改为真实应用，保留单独 bootstrap smoke 用途。
- 清理这些路径的旧类型/API/FFI 问题；记录其余下游项目迁移状态与新旧用法。
- README 中英文同步描述可用功能、后端能力和启动方式。

验收：

- [ ] yarn compile && yarn release 构建真实入口；从构建产物加载页面并执行交互用例。
- [ ] 固定时间画面、输入事件、资源失败与基础回退通过 [#37](https://github.com/Quamolit/quamolit/issues/37)；浏览器没有未解释 runtime 错误。
- [ ] 不能只证明 bundle 生成；给出实际入口及场景证据、仍未迁移清单。

边界：本项不自动授权合并、发版或批量修改所有下游仓库；按用户既有授权及具体任务继续。

### [#37 M3：扩展完整视觉回归 CI 与跨后端诊断](https://github.com/Quamolit/quamolit/issues/37)

在 M0 最小测试基础上覆盖真实图形和交互语义，并提供可审查的跨后端差异。

依赖：[#47](https://github.com/Quamolit/quamolit/issues/47)、[#53](https://github.com/Quamolit/quamolit/issues/53)、[#34](https://github.com/Quamolit/quamolit/issues/34)。

实现范围：

- 扩展文字/transform/path/image/透明组/clip/enter-exit/事件区域用例，固定资源与输入日志。
- CPU 数值参考、同后端图像回归、跨后端容差检查分开；GPU 设备不可用时明确 skip，另设真实 GPU 验证记录。
- 失败上传 actual/expected/diff、fixture manifest、浏览器/adapter/版本、时间/seed/能力路径和错误日志。
- 将基线修改与代码修改一起审阅，禁止失败后静默扩大容差或重录全部基线。

验收：

- [ ] 每个覆盖类都有可人为破坏而被检测到的断言；固定环境重复 3 次稳定。
- [ ] 云端基础视觉检查为必需检查；真实 GPU 样本按指定设备可复现，缺失不能声称跨后端全部通过。
- [ ] 阈值调整附差异图与原因；功能回归不能被大面积容差吞掉。

边界：截图一致性不替代命中、资源生命周期和数值边界测试。

## M4 · GPU 模拟与性能发布

### [#54 M4：实现显式状态的 GPU 常驻模拟与重放](https://github.com/Quamolit/quamolit/issues/54)

为经基准确认值得迁移的粒子/流场等历史相关动画增加 compute 路径，保留可测试的状态与生命周期。

依赖：[#31](https://github.com/Quamolit/quamolit/issues/31)、[#40](https://github.com/Quamolit/quamolit/issues/40)、[#52](https://github.com/Quamolit/quamolit/issues/52)、[#51](https://github.com/Quamolit/quamolit/issues/51)、[#39](https://github.com/Quamolit/quamolit/issues/39)。

实现范围：

- 先选一个真实或代表性模拟，规定固定 dt、seed、输入记录、步数、容量和状态资源 ID；根据证据确定 compute 数据布局。
- GPU 状态常驻并直接参与绘制；检查点和读回仅用于重放/调试，正常帧不回读全部状态。
- 定义 reset、检查点恢复、事件时间映射、暂停、后台恢复和积压步数上限；追帧超限行为必须可观察。
- 对 device loss 明确从检查点/起点重建或报告不可恢复；剔除和 indirect draw 仅在该负载证明有益时增加。

验收：

- [ ] 同设备同输入重放一致到规定容差；跨设备只承诺经定义的数值/视觉容差，不承诺浮点逐位一致。
- [ ] 对小规模 CPU 参考比较若干步，验证暂停/重置/恢复和 device loss；检查资源计数。
- [ ] 报告 compute+render 的完整帧吞吐、上传/读回量和内存，相比 CPU 基线给出采纳或暂缓结论。

边界：不得为了使用 compute 而迁移无历史 tween；若试验无收益，完成设计记录并将实现范围明确调整，不能伪报达标。

### [#41 M4：完成跨设备性能验收、后端决策与发布资料](https://github.com/Quamolit/quamolit/issues/41)

基于可复现结果确定 Quamolit 后端及 Use.GPU 采纳范围，交付真实可用且边界明确的版本。

依赖：[#36](https://github.com/Quamolit/quamolit/issues/36)、[#37](https://github.com/Quamolit/quamolit/issues/37)、[#39](https://github.com/Quamolit/quamolit/issues/39)、[#40](https://github.com/Quamolit/quamolit/issues/40)、[#52](https://github.com/Quamolit/quamolit/issues/52)、[#54](https://github.com/Quamolit/quamolit/issues/54)。

实现范围：

- 在命名的现代集成 GPU、独立 GPU 和至少一类移动设备上记录环境；未覆盖平台显式列为未验证，不能宣称全平台达标。
- 按相同画质比较 CPU 动画/实例上传/GPU 采样/有历史模拟的完整成本，报告 p95/p99、掉帧、内存、首次使用和持续运行。
- 形成后端默认选择、能力探测、Canvas 基础回退与 Use.GPU 包采纳 ADR；compute 等试验若暂缓也记录证据及范围。
- 编写中文迁移/发布说明、双语 README、tag/下游升级清单及已知限制；保持当前已发布工具链/runtime 一致。

验收：

- [ ] 性能证据满足 docs/verification.md；1k 混合/10k 简单实例的目标在指定设备得到报告，100k/120 FPS 明确是已达或未达的扩展目标。
- [ ] 真实入口、视觉 CI、类型检查、runtime smoke、资源恢复和持续运行均有链接；所有缺失/skip 如实披露。
- [ ] 发布资料可审阅，实际 tag/release/合并按用户授权执行；未完成依赖不得仅写结论就关闭 milestone。

边界：不把框架升级、纯编译通过、未经验证的吞吐数字当作性能发布完成。
