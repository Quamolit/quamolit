# 编码与性能检验规则

适用于计划 v3；[执行与验收修订](plan-v3.md)补充公共 Calcit 集成、独立消费者和真实路径测量门禁。本文保留的数值/视觉/性能规则继续适用；目标命令不等于已经存在的能力。

新增 #104 消费者门禁须由实现 PR 提供实际命令并接 CI：候选模块干净安装、inline/file 源码分发、输出搬移、真实 Calcit 调用、乱序时间、同时间失效和 1000 帧结构复用计数。生产代码不得导入 test/host 或 target/js/motion。M2 的阶段测量必须跑同一个 Calcit 声明输入，M0 参考基准不能替代。

## 当前可执行门禁

`yarn test:gpu-component` 验证[公共计划 GPU 连接](gpu-component-plan.md)：严格类型、原生差量、Node 编译后 file/inline 调用、1000 时间帧、浏览器整层回退与非软件 GPU 专项。硬件不可用时专项明确 skip，不能记为通过；当前不测吞吐或标准动画 shader 采样。

`yarn test:todolist` 验证 [TodoList 恢复](todolist-restoration.md)：严格类型、原生日志合同、Node 的重排打断/重入/错峰/100 次装卸/1000 时间帧共享，以及 Chromium 全像素文字参考、实际 Canvas 操作、导入失败隔离、两秒空闲停帧、DPR 1/2 和暂停 resize。文字为基础 monospace，未验证 GPU。

`yarn test:binary-tree` 严格检查 Calcit 线段参考与原有摆动树，执行原生和 3 项 Node 合同；浏览器验证原有递归运动的独立矩阵/画面对照、负例和全屏播放控制。见 [Binary Tree 恢复边界](binary-tree-restoration.md)；不能据此宣称完整 Path IR 或 GPU 已实现。

全屏与恢复导航：`test:demo-nav` 当前为 3 项 Node + 36 项浏览器检查；包括原有 11 项不可遗漏、待恢复不显示运行链接、艺术分类空状态，以及 DPR 1/2、桌面/窄屏、暂停 resize 后状态不变、像素和浮层键盘操作。跨物理显示器 DPR 切换、旧 11 个动画的完整验收与真实 GPU 尚未完成。见[恢复清单](demo-restoration.md)。

`yarn test:demo-nav` 验证[完整演示导航](../demos/README.md)：清单无遗漏、统一编译、全部页面静态构建后在子路径部署、所有已实现入口初始化与导航往返、搜索/分类/刷新/移动端。仅验证 GPU 不可用时的回退，不替代真实 GPU 画面或吞吐；CI 保存站点、导航截图与失败 trace。

`yarn test:consumer` 在独立临时项目安装候选提交，严格检查消费者，搬移入口可达产物后执行 Node/Chromium 合同；覆盖 1000 帧复用、乱序时间、同时间失效与 js-ffi `:file` 分发。详见[独立消费检验](isolated-consumer.md)；尚不包含生命周期、真实资源释放、JS-only 重编译和 GPU 验收。

`yarn test:retained-component` 验证 [Calcit 组件保留计划](retained-component.md)：严格类型、原生乱序采样、Node 的 1000 帧静态对象身份/实际声明次数和六类版本失效、Chromium 同源画面对照及演示截图。另覆盖 [Presence 组件连接](presence-component.md)的叶节点 alpha、重入连续性、显式释放、100 次装卸及独立 Canvas 像素对照。它使用独立 `target/js/retained-component/`，不代表外部消费者安装、完整 TodoList 或 GPU/资源生命周期验收。

使用仓库声明的 Calcit/runtime 版本和 Node.js 24；开始前核对 `calcit -v`、`deps.cirru`、package/lockfile 与 CI。当前 `deps.cirru` 声明 Calcit `0.22.0` 与 js-ffi `0.2.1-alpha.1`；该版本支持定义级 `:ffi :js :inline/:file`，但后续仍可随证据升级。

```sh
yarn install --immutable
yarn compile
yarn release
yarn test:clock
yarn test:simulation
yarn test:replay-archive
yarn test:direct
yarn test:host-clock
yarn test:playback
yarn test:component-sample
yarn test:fade-migration
yarn test:scene-core
yarn test:instance-sources
yarn test:canvas-batches
yarn test:webgpu-instances
yarn test:scene-diff
yarn test:scene-binding
yarn test:retained-scene
yarn test:transition
yarn test:presence
yarn test:presence-resources
yarn test:motion
yarn test:cpu-motion
yarn test:motion-gpu
yarn test:motion-browser
yarn test:runtime
yarn test:fixtures
yarn compile:visual
yarn test:visual
yarn test:bench
yarn bench
```

不同 Calcit 入口编译到被忽略的 `target/js/<entry>/`；`compile:visual` 与 `compile:motion` 共用 `target/js/motion/`，普通应用入口独立在 `target/js/app/`。当前普通入口仍是 bootstrap，以上成功不证明旧主应用可用。新增公共命名空间还需运行实际范围的 `calcit analyze check-public --ns <namespace>`；所有新代码严格检查通过，不通过兼容模式掩盖错误。

`yarn bench --help` 列出 #39 的 Canvas2D 参考基准参数；正式运行默认每次预热 5 秒、采样 30 秒、独立运行 3 次。六档包含 1k 混合 UI 参考节点、1k/10k/100k 简单实例、UI 过渡与固定文字路径；混合节点不等于 Calcit 组件树。报告记录干净/脏 Git 状态，三次固定时间画布校验和不一致时失败。短时 CI 仅检查浏览器运行、报告格式和原始文件产出，不是硬件吞吐门禁。首份基线见 [M0 性能基线](performance-m0.md)。

`yarn compile:visual` 只编译；`yarn test:visual` 先编译该入口，再启动固定 Chromium 执行浏览器断言和截图比较。浏览器需先通过 `yarn playwright install chromium` 安装，Linux CI 使用 `--with-deps`。固定版本见 `package.json`/`yarn.lock`，快照与逐场景容差见 `test/m0/`。PR #45 已合并；`evaluate-at` 仍是顺序帧求值基础。

`yarn test:motion` 对实验性标量、二维向量、关键帧、颜色、两输入组合与 CPU-only 自定义标量 Motion 做严格类型检查、原生测试、JS 编译与数值测试；还检验所有描述的非空 ID/整数版本边界。`yarn test:motion-browser` 再验证 Chromium 中间帧、循环端点、颜色/位置像素、GPU 不支持诊断和时间倒退/重复。两者目前只覆盖 [受限 Motion IR](motion-scalar.md)，不能代表 #31 生命周期或 #52 真实 GPU 执行已完成。

`yarn test:cpu-motion` 验证[泛型 CPU Motion 扩展](cpu-motion-extension.md)的 `Vec2` 输出类型、显式依赖、版本失效、非法请求、输出校验及 JS 数值；`yarn test:motion-browser` 追加固定 Chromium 的位置与实色像素验证。CPU 回调不可自动转 WGSL。

`yarn test:motion-gpu` 验证[受限 GPU 候选计划](motion-gpu-contract.md)的类型、容量边界、显式回退和 JS 数据序列化；追加 [Vec2 GPU 时间采样](gpu-vec2-motion.md)的 Calcit 参数准备、时间帧、异常/越界诊断和 CPU 数值对照。Vec2 tween 以外的“候选”仍不代表已在 GPU 执行；真实 WGSL 高精度数值等价与性能测量仍待 #52。

`yarn test:simulation` 验证 [固定步长 CPU 状态推进](fixed-step-simulation.md) 的类型、手算数值、不同显示帧节奏、检查点/重置、追帧预算和非法 tick；`yarn test:motion-browser` 同时运行固定 tick 的 Canvas 画面测试。该切片没有 host time 变换或资源版本失效，不能据此关闭 #31。

`yarn test:replay-archive` 验证[完整输入日志与有界最近检查点](replay-archive.md)的严格类型、旧 tick 重放、预算不足、重置及原生/JS 手算；`yarn test:motion-browser` 补充浏览器倒退后的画面与实色像素。此策略未持久化输入，也未限制日志长期内存。

`yarn test:direct` 验证 [绝对时间 CPU 直接采样](direct-frame-sampling.md) 的类型、乱序/重复采样、六类依赖的相同时间失效、完整键复用与非法时间/版本；`yarn test:motion-browser` 同时运行 Canvas 截图和像素断言。调用方仍须维护完整版本，测试不代表通用组件公共入口或 #31 已完成。

`yarn test:host-clock` 验证 [宿主时间映射](host-clock.md) 的暂停、恢复、变速、倒放、seek、固定 dt tick、浮点边界与非法输入；`yarn test:motion-browser` 在 Canvas 上核对各时间点中间帧、像素与刷新。该切片不推进模拟状态，也不负责检查点与输入日志策略。

`yarn test:playback` 验证[同一宿主时间轴上的直接帧与固定 tick 边界](playback-boundary.md)，包括暂停、资源 ready 的同时间失效、seek 后从旧检查点重放、预算超限与 JS 数值；`yarn test:motion-browser` 在 Canvas 上核对两条路径的固定时间画面。它是 CPU 参考适配，不是生产调度器。

`yarn test:component-sample` 验证[声明式组件直接采样入口](component-sample.md)的泛型输入、严格类型、乱序绝对时间、六类版本复用及同时间 Model/资源/视口变更；`yarn test:motion-browser` 在固定 Chromium 页面核对可编译组件声明的中间帧和像素。该入口会全量重新声明/解析 Scene，不是保留式执行计划。

`yarn test:fade-migration` 验证[旧 fade 的可编译迁移](fade-migration.md)：显式 Model 中的 0.25 秒进入/退出意图、打断时透明度连续、版本化 Scene opacity 绑定及受限 GPU 候选分类；`yarn test:motion-browser` 在 Chromium 检查单子节点中间帧像素。一般组隔离、真实 GPU 执行与退出资源释放不在此命令覆盖范围。

`yarn test:scene-core` 验证 [Scene IR 核心切片](scene-ir-core.md) 的类型、构造/校验、重复 ID/兄弟 key、错误父级、非法数值/资源/绑定以及 JSON 往返；`calcit analyze check-public --ns quamolit.canvas-reference` 验证新增 Calcit 参考绘制入口。`yarn test:motion-browser` 额外验证 Scene IR 的固定时间 Canvas 中间帧、实色/背景像素及样式恢复。该命令不等于下方拟议的完整 `yarn test:scene`，目前尚无完整组/实例参考后端或双后端验收。

`yarn test:instance-sources` 先严格检查 `quamolit.instance-ffi`，再验证 [实例数据源边界](instance-sources.md) 的 10k 位置、拷贝隔离、严格版本与错误输入；`yarn test:motion-browser` 还核对同一时间切换资源版本的像素。其 Canvas 循环仅是验证夹具，不是生产渲染性能结果。

`yarn test:canvas-batches` 严格检查 `quamolit.instance-ffi` 并验证 [Canvas 实例批次边界](canvas-instance-batches.md) 的冷/热调用次数、拷贝和读取字节、脏范围及失效；`yarn test:motion-browser` 检查两处 10k 实例页面的像素和指标。Canvas 仍逐实例调用 `fillRect`；调用次数不是 GPU draw-call 数或吞吐证据。

`yarn test:webgpu-instances` 先严格检查 `quamolit.instance-ffi`、`quamolit.webgpu-batches` 与 `quamolit.webgpu-capabilities` Calcit 公共定义，再验证 [WebGPU 矩形实例同源路径](webgpu-instances.md)、[Presence WebGPU 时间帧](webgpu-presence-time.md)、[Vec2 GPU 时间采样](gpu-vec2-motion.md)及[图层租约](webgpu-layer-lease.md)：Node 检查能力探测的不可用/失败/ready/loss/release、100 次图层装卸、并发与迟到资源清理、版本切换、空帧后旧源复用的 CPU 副本与 GPU 上传决策；Chromium 专项尝试真实 10k GPU 绘制、固定时间帧像素对照、乱序 seek 的 0 位置上传、完整图层回退和重建，并在 0.37/0.81 秒诊断读取 GPU f32 位移，对照独立线性公式与既定数值阈值。非整数时间只检查数值，不以边缘像素作精确内区断言。只有非软件 adapter 实际完成 GPU 断言才是 GPU 正确性证据；无 adapter/软件 adapter 的 SKIP 仅证明诊断和 Canvas 回退，不满足 #40/#52 验收。常规 `test:motion-browser` 仍覆盖无 GPU/强制禁用时的 Canvas 路径。

`yarn test:scene-diff` 验证 [逻辑身份与参考差分](scene-diff.md) 的严格类型、变更分类、重排/重挂载、仅时间变化和 JS 序列化；`yarn test:motion-browser` 也会在 Chromium 校验 Scene diff 与 Canvas 中间帧一致。仍未实现 #50 保留执行计划和双后端验收。

`yarn test:scene-binding` 验证 [Scene 标量绑定解析](scene-binding.md) 的 ID/version 契约、绝对时间采样、非法输入/输出、Calcit 类型与 JS JSON 边界；`yarn test:motion-browser` 实际绘制绑定解析结果，并与独立直接采样参考比对。它不证明生产增量执行或 GPU lowering。

`yarn test:retained-scene` 验证 [保留式 Scene 计划与按需帧](retained-scene-plan.md)：1000 个时间帧只建立一次计划与静态结构，逐帧对照全量 Calcit 参考；同时间六类版本失效、非法更新保持旧帧和按需调度输入队列。浏览器验证 Canvas 中间帧、DPR=2、暂停/恢复、2 秒空闲停帧。这里尚无通用 GPU pipeline 或完整资源表，不能据此关闭 #50。

`yarn test:transition` 验证 [位置连续打断过渡](transition-interruption.md) 的严格类型、25%/50%/75% 手算连续性、重复/非法事件、固定日志乱序重放与 JS 数值；`yarn test:motion-browser` 在 Chromium 核对两次打断后的 Canvas 中间帧、像素和终点停帧信号。它不等于 #49 完整的进入/退出生命周期。

`yarn test:presence` 验证 [Scene 逻辑实例生命周期](presence-lifecycle.md) 的严格类型、重排/换类型/退出/重入、父级释放顺序、重复结算、100 次 10k 实例图层逻辑装卸与 JS JSON 边界；`yarn test:motion-browser` 核对 fade、重叠层序和时间跳转画面。逻辑释放通知不等于真实 GPU/Canvas 资源或指针捕获释放。

`yarn test:presence-resources` 验证 [宿主实例资源跟踪](presence-resources.md)：Calcit 严格类型、100 次 10k Float32 快照挂载/退出、共享源最后引用、重入取消释放及错误输入不破坏现有资源；浏览器还验证退出中间帧与终点像素和停帧。此命令仍不验证 GPU buffer 或指针捕获。

`yarn test:motion-browser` 还验证 [WebGPU 能力探测诊断夹具](webgpu-capability-probe.md)：通过 js-ffi 0.1.44 的 Calcit 公共 API，分别模拟 adapter 失败、ready 和设备丢失，并确认 Canvas 参考时间帧仍可绘制、探测设备被释放。真实浏览器的 `ready` 仅代表可获取 device，不是 GPU 画面或吞吐验收。

## 待实现的统一命令

| 命令 | 负责工作项 | 完成条件 |
| --- | --- | --- |
| 完整 Motion/过渡测试 | #48、#31 | 在现有标量/二维向量/关键帧/颜色/两输入组合/CPU 标量注册切片之上补齐依赖与输出类型契约、标准 GPU 子集 lowering 诊断及过渡生命周期，覆盖模拟/打断边界 |
| `yarn test:scene` | #32、增量执行、资源/交互 | 验证身份、变更、缓存失效、资源和命中语义 |

引入命令的 PR 同步 package scripts、说明、CI 及退出码行为。实现前不得在报告中声称运行过它们；暂缺测试或硬件写“未验证”，而不是通过。

## 必测语义

- 直接采样：正序、乱序、重复、倒放，以及同时间模型/资源/视口变化；覆盖 duration=0、关键帧重复、边界前后、非法/非有限数值。
- 模拟：固定 dt 与 tick index，不同显示帧节奏映射到相同 tick/input 后相同结果；暂停、单步、重置、追帧上限、检查点恢复和 device loss 行为明确。
- 生命周期：中途改目标的位置连续性、声明过的速度连续性、重排、退出重入、父级卸载、重复 key、退出结束释放。
- 渲染：透明层序、预乘 alpha、隔离组 opacity、嵌套 clip、文字/路径/图片；同一场景重复绘制不改变逻辑 Model。
- 增量：与全量参考比较；同一时间不同输入不得复用过期结果。1000 个仅时间变化的帧不得重建未变化的几何/pipeline。
- 资源：100 次装卸后 live 计数返回稳定基线；记录延迟释放，检查持续增长而非要求宿主显存立即归零。

## 数值与图像规则

CPU 纯采样首先使用手算样例或独立参考，不只用被测函数自身生成期望值。GPU 数值初始阈值为 `abs(actual - expected) <= 1e-5 + 1e-5 * abs(expected)`，适用于测试定义域内的基础 f32 运算；三角函数、长时间或累积模拟可按算子/误差分析设置不同阈值，必须在实现前写入 fixture，并附依据。不能为了让失败测试变绿临时扩大阈值。

视觉规则按 fixture 明确：实色内区可精确 RGBA；抗锯齿边缘、字形和跨后端差异使用声明的逐通道阈值与最大差异像素比例。不存在全项目统一的宽松阈值。未声明容差的测试默认严格比较；禁止对整幅图忽略差异来掩盖错位、漏绘或层序错误。

固定实际像素尺寸、DPR、浏览器版本、字体文件、资源 ready 状态、seed、时间和输入记录。同环境连续运行 3 次应稳定。基线更新 PR 必须包含原因及 before/after/diff；用故意改变位置/颜色/层序的反例确认检查能失败。运行异常、缺失字体或截图失败不能输出 PASS。

云端必需检查覆盖 CPU/基础 Canvas 路径。真实 GPU 不可用时，GPU 测试可以显式 skip，但这不是 GPU 验收；WebGPU 实现 PR 需附指定设备的运行证据。软件 adapter 的正确性结果和硬件吞吐结果分开。

## 性能测量与回归

报告保存 git SHA、命令、fixture 参数、OS、设备/GPU、浏览器/驱动（可获得时）、供电模式、实际像素尺寸/DPR、抗锯齿、alpha、纹理/字体、资源冷暖状态、seed 和输入序列。不能通过降低画质、少画内容或换 GPU 制造加速比。

默认每次预热 5 秒、采样 30 秒、独立运行至少 3 次；另外记录初始化和首次使用成本。比较各次 p50/p95/p99 及其离散程度，保留原始样本。阶段耗时包含组件求值、动画采样、变更计算、打包、上传与命令提交；GPU timestamp 可用时独立记录并异步读取。queue.submit 的 CPU 耗时不是 GPU 执行时间，CPU/GPU 阶段也不能直接相加等同呈现延迟。

同时报告 rAF 帧间隔、错过显示周期的比例、输入到下一可见帧的可测延迟、draw call、上传/读回字节、每帧分配和 live 资源计数。帧间隔只能作为呈现节奏的代理，精确呈现结论需相应 trace 支持。

初始回归规则：相同设备/画质下，3 次运行的 p95 中位数相对已审查基线增加超过 10% 且绝对增加超过 0.5 ms，必须复测并解释；不是自动扩大预算的理由。稳定资源/上传量出现未解释增长，即使 FPS 未降低也视为回归。共享 CI 上不使用不可控的硬件吞吐作绝对门禁，但可验证结构、提交/上传计数和结果格式。

60 FPS 目标在锁定 60 Hz/等效调度的验收场景中，以预热后至少 99% 帧间隔不超过 1.5 个刷新周期作为初始节奏门槛，同时报告全部分位数；120 FPS 使用对应周期。测试需确认真实刷新率，不可在 60 Hz 设备声称验证 120 FPS。该规则是可复现实用指标，不是对所有浏览器呈现的严格保证。

M0 记录初始基线，M2 对 10k 实例比较 CPU 上传与 GPU 采样，M4 在命名设备矩阵完成目标验证。100k 实例和 120 FPS 为扩展目标，未达或未测必须注明。性能协议若因实测需要调整，单独说明原因并更新本规则及相关 issue，不能更换输入后沿用旧结论。

## PR 与关闭条件

PR 描述至少包含：目标 issue 与依赖产物；实际行为改变；命令/版本/结果；正确性或性能 artifact；剩余范围及未验证硬件。纯文档改动无需重复写功能测试，检查链接/计划映射与 Actions 即可。

每个 issue 的全部验收框都有可定位证据才允许关闭。部分实现不能用 `Closes`；milestone 只有在阶段退出条件都满足后才能关闭。计划更改、关闭 issue、合并和发版分别遵循用户授权，不能把一项授权扩大成另一项。
