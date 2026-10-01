# 编码与性能检验规则

适用于计划 v3；[执行与验收修订](plan-v3.md)补充公共 Calcit 集成、独立消费者和真实路径测量门禁。本文保留的数值/视觉/性能规则继续适用；目标命令不等于已经存在的能力。

#104 已有 `test:consumer` 负责候选模块干净安装、inline/file 源码分发、输出搬移、真实 Calcit 调用、乱序时间、同时间失效和 1000 帧结构复用计数。生产代码不得导入 test/host 或 target/js/motion。M2 的阶段测量必须跑同一个 Calcit 声明输入，M0 参考基准不能替代。

## 关键链路与运行分层

后续优先扩展下列现有门禁；详细合同仍由下文与主题文档维护，不另建脚本登记表或平行测试框架。

| 层级 | 关键链路 / 现有入口 | 判定 |
| --- | --- | --- |
| T0：类型与纯语义 | `check:api-inventory`、`test:ui-motion`、`test:gpu-component` 的严格类型/Node 合同、`check:test-js-format` | 类型、采样、非法输入和接口边界必须通过；Node mock 不算真实 GPU |
| T1：CI 浏览器 | `test:consumer`、`test:demo-nav` 及受改动影响的作品门禁 | 安装→编译→可控时间→Canvas→切换/卸载；保留失败截图与反例，GPU 缺失单列 SKIP |
| T2：本机硬件 | `QUAMOLIT_CONSUMER_HEADED=1 QUAMOLIT_CONSUMER_REQUIRE_GPU=1 yarn test:consumer` | macOS/Metal 实际画面、上传和恢复；无非软件 adapter 必须失败，不能将 SKIP 算通过 |
| T3：阶段测量 | `yarn bench:consumer` | 正式预热 5 s / 采样 30 s / 3 轮；只验收报告实际包含的负载，不进日常 CI |

这不是完整脚本分层盘点，也不替代既有 CI 回归。新增功能尽量沿同一消费者验证成功、回退和释放，底层纯语义保留独立单测；新增命令/job/主题文档须说明现有链路无法承接的原因。计数、画质和帧耗时分开报告，次要边界登记 issue。现有 visual workflow 从消费者报告生成四项硬件专项摘要，分别统计 PASS、SKIP 和未执行，并显示 adapter/原因；报告缺失不记为通过，要求硬件时的失败报告保留已得到的 SKIP。摘要只覆盖这条关键链路，不冒充全部 Playwright 用例的 SKIP 总数。[PR 模板](../.github/PULL_REQUEST_TEMPLATE.md)要求声明硬件、容差及新增复杂度的理由，不替代实际验证。

#179 的耗时按实际 Actions job/step 比较，不用测试条数推算。5fd4a69 的 visual 为7m8s，其中完整导航/构建75s、Chromium安装48s、Motion浏览器30s、干净消费者21s；原始步骤可从 [Actions](https://github.com/Quamolit/quamolit/actions/runs/36921147534)复核。新必跑job/重型测试不得隐式增加；若持续超过这次预算，先比较安装/网络波动与重复准备，附前后数据解释，不靠删除作品覆盖或失败断言降时长。单次观测不是长期缩短证明，全部workflow的稳定成本对比仍待#179验收。

`test:motion-browser`在同一快照下只编译一次motion入口（原来四次），保留原14个namespace、4个原生过滤器、12个Node文件及31个浏览器用例；其他5个编译入口不变，独立测试命令仍自行编译。聚合命令复用第一次产物，不引入缓存、环境跳过开关或新调度器；修改相关独立命令时需同步聚合的检查/用例范围。Node分组可以合并，同一失败仍须使整条命令失败。实际本机单次91.16→58.12s只说明本切片观测，正式Actions成本以干净CI结果和稳定多轮比较为准。

## 当前可执行门禁

`yarn audit:api-types` 本地枚举全部项目定义的显式 schema 与类型声明（含 Trait 方法），逐定义报告 Dynamic/JsObject 路径和缺少 schema 的未知项；原始 JSON 写入忽略目录。见 [类型边界盘点](api-type-boundaries.md) 的范围与限制。完整扫描不加入日常 CI；6 项盘点器负例作为 `check:api-inventory` 的轻量门禁，稳定 namespace 及其引用类型不能有开放/未知边界。它不是类型推断或 JS 对象内容验证。

`yarn check:api-inventory` 核对 [API 稳定性清单](api-contract.md)：全部项目 namespace 显式分类、文档表格同步、说明链接存在、稳定 UI 构件 Fn 签名和 Struct/Enum 字段合同。负例覆盖新/已移除 namespace、重复分类、未知状态、旧入口无迁移去向、消费者内部/未分类导入，以及稳定签名/类型变更。它不代替严格类型/动画语义门禁；`yarn test:ui-motion` 继续负责后者。独立 `yarn audit:consumer-api` 当前会报告实验 API 依赖并失败，尚非必需 CI，不宣称 #176 完成。

`yarn test:scene-hit` 检查 [Scene 独立命中内核](scene-ir-core.md)：严格公共类型、90° 旋转逆投影、祖先矩形裁剪、完全透明 group 仍可交互、重叠节点逆绘制层序、group target 后备、奇异矩阵拒绝、多边形填充与折线 stroke，以及编译后的候选计划排除非交互装饰节点。1000 个非交互装饰节点加 1 个 target 的夹具在编译后只保留 1 个候选，命中热路径 `visited=1`；该数字证明事件查询不再全树扫描，不代表当前全量 Scene 校验或计划编译已经优化。测试完全不依赖 Canvas，`HitPlan` 可跨同一 Scene 的多次指针查询复用；便利入口 `hit-test` 每次都会重新编译，实时宿主应缓存计划。该门禁尚不覆盖 cubic-path、instances、指针捕获/冒泡、节点卸载、resize/DPR 或浏览器事件桥，不能据此关闭 #34。

`yarn test:scene-pointer` 检查 [Scene 指针路由](scene-pointer.md)：严格公共类型、叶节点到祖先 target 的冒泡顺序、捕获后移出命中范围仍投递、其他 pointer id 不继承捕获、`up/cancel` 释放、捕获源节点消失、父 target 卸载后叶节点重挂载，以及退出节点仍可见但 interaction 已禁用时的恰好一次清理。它是可乱序重放的纯 Calcit 状态机，不调用 DOM；当前不验证浏览器坐标归一化、DPR/resize、原生 `setPointerCapture`、任意嵌套退出子树屏蔽或 cubic-path/instances 命中，因此仍不能关闭 #34。

`yarn test:scene-pointer-browser` 严格检查临时类型化 PointerEvent/DOM capture adapter：Node 最小宿主替身验证 client 坐标到 CSS px、画布外捕获路由、`setPointerCapture/releasePointerCapture` 各一次、显式 surface dispose 及终点无残留；Chromium 用真实鼠标 PointerEvent 验证移出画布后继续投递、抬起释放、DPR 2 不误乘坐标和 `pointercancel` 清理，并以确定性 DOM `lostpointercapture`、窗口 `blur` 事件验证逻辑所有者与原生 capture 均清空。拖拽中移动并 resize surface 后，第二 pointer id 立即按新边界命中，原捕获 pointer 仍可在画布外完成释放。通用浏览器接口缺口跟踪于 js-ffi #149；实际 demo dispose 由 `yarn test:drag-demo` 覆盖，尚未覆盖 resize 与节点退出并发。

`yarn bench:consumer` 将[同源帧测量](consumer-performance.md)接到独立安装/搬移消费者，默认桌面真实 GPU、预热 5 秒/采样 30 秒/3 次。两矩形三路径、静态 10k Canvas、单脏记录动态 10k Canvas/GPU 分开报告；不能把不同负载计算成加速比，单脏记录不等于 10k 独立动画。CI 的 `test:consumer` 短时模式检查 Canvas 链路/格式/计数，GPU 缺失单独 SKIP。`test:bench` 包含异常上传、热帧资源增长、未释放和结构重建的负例。

`yarn test:gpu-component` 验证[公共计划 GPU 连接](gpu-component-plan.md)：严格类型、原生差量、Node 编译后 file/inline 调用、1000 时间帧缓存身份及六类版本失效、浏览器整层回退、异步 GPU 初始化期间的输入与非软件 GPU 专项。初始化竞态使用 mock，不算硬件验证。硬件不可用时专项明确 skip，不能记为通过；当前不测吞吐或标准动画 shader 采样。`yarn bench:gpu-component` 仅测 CPU 批次准备阶段，不能代替正式端到端验收。

`yarn test:todolist` 验证 [TodoList 恢复](todolist-restoration.md)：严格类型、原生日志合同、Node 的重排打断/重入/错峰/100 次装卸/1000 时间帧共享，以及 Chromium 全像素文字参考、实际 Canvas 操作、导入失败隔离、两秒空闲停帧、DPR 1/2 和暂停 resize。文字为基础 monospace，未验证 GPU。

`yarn test:binary-tree` 严格检查 Calcit 线段参考与原有摆动树，执行原生和 3 项 Node 合同；浏览器验证原有递归运动的独立矩阵/画面对照、负例和全屏播放控制。见 [Binary Tree 恢复边界](binary-tree-restoration.md)；不能据此宣称完整 Path IR 或 GPU 已实现。

`yarn test:tidal-bloom` 检查[图表 UI 出入场作品](tidal-bloom.md)：Calcit 概览与分析两屏组件、旧节点渐出后卸载、新 KPI/柱图/渠道列表错峰加入、绝对时间乱序重放；视图与访客／营收数据系列 Model 分别覆盖中途反向、事件前缀重放、100 次往返及终点停帧。Chromium 保存 t=0/1.4/3.7/5/7 固定画面、交互中间帧与系列渐变帧，并验证 DPR 2 窄屏、暂停 resize 与全屏 Canvas 浮层。它使用现有 Canvas 参考路径，不证明 GPU 绘制、真实宿主资源释放或新的性能目标。

`yarn test:signal-weave` 检查[折线／面积图作品](signal-weave.md)：Calcit 逐段增长的路径与填充面积、12 个稳定采样点、活动情境的对照线和指标／洞察卡片；Node 检查打断、乱序重放与 100 次往返，Chromium 检查按钮、分享视觉位置、初始／中间／终点截图、DPR 2 暂停 resize 和停帧。Canvas2D 是参考，不证明 GPU 或性能目标。

`yarn test:cohort-pulse` 检查[留存热力图作品](cohort-pulse.md)：Calcit 筛选模型驱动 6 个群组和 42 个热力单元的错峰进入、退出与重排，终点卸载安全行；独立面板模型在摘要和事件详情间交叉渐变。Node 检查稳定 key、打断、乱序重放、事件前缀分支及 100 次往返，Chromium 检查分享视觉位置、固定画面、DPR 2、浮层收起和终点停帧。它仍使用 Canvas2D 参考路径，不证明 WebGPU 或新的性能目标。

`yarn test:ui-motion` 检查[图表 UI 动画构件](ui-motion-components.md)：严格检查公共 API 及三个实际消费者，再以独立手算值验证稳定索引错峰、数值渐变、交叉淡化、进入／退出合成、卸载端点与非法输入。它只证明纯 Calcit 采样语义；三个作品的固定帧画面仍由各自命令验证，不证明 GPU lowering 或宿主资源释放。

三个图表作品的入口、固定帧、窄屏/reduced-motion、统一 Canvas 卸载和 CI artifact 对照汇总在[图表 UI 动画作品验收矩阵](chart-ui-showcase-evidence.md)。Actions 必须分别执行并上传三个作品，不能只用公共数值测试或 Metric Flow 的画面代表整个作品库。

`yarn test:raining-demo` 检查 [Raining 恢复](raining-restoration.md)的严格类型、Calcit→JS 编译、Node 固定 seed/tick 乱序重放及 48 节点上界、Chromium 全屏中间帧/水花截图与 DPR 2 暂停 resize。它是解析式固定 tick 采样和 Canvas2D 参考，不证明 GPU 历史模拟或吞吐。

`yarn test:finder-demo` 检查 [Finder 恢复](finder-restoration.md)的严格类型、Calcit 点击日志/Scene/命中，以及 5 个文件夹和 18 张卡片各自意图的连续打断；Node 验证跨文件夹／卡片和连续 A→B→C 切换的事件帧 Scene 相等与并行出入，Chromium 以真实画布点击保存切换开始／中间／终点的浮层和纯 Canvas 截图，并继续覆盖分享像素重放与 DPR 2 暂停 resize。它不证明 #34 通用命中/指针捕获或 WebGPU 绘制。

`yarn test:icons-demo` 检查 [Icons 恢复](icons-restoration.md)的严格类型、历史数字交叉位移、1/4 秒线性数字过渡与 1/6 秒线性播放图标变形；Node 使用独立手算中间值检查快速打断和命中区域，Chromium 使用真实 Canvas 点击并保存初始／中间／终点的浮层与纯画布截图，同时覆盖 DPR 2、暂停 resize 和空闲停帧。它只恢复该作品的历史语义与 Canvas2D 参考效果，不证明通用事件系统或 WebGPU 绘制。

`yarn test:table-demo` 检查 [Table 恢复](table-restoration.md)的严格 Calcit 九格数据/命中/Scene、Node 中文写入与非法索引、Chromium 画布点击与临时输入框、Enter/Esc/失焦、分享重放和 DPR 2 resize。它不证明 #34 通用命中索引或 WebGPU 文字能力。

`yarn test:drag-demo` 检查 [Drag demo 恢复](drag-demo-restoration.md)的严格 Calcit 指针 Model、Scene HitPlan、统一 PointerState、Node 锚点和滑块边界，以及 Chromium 的真实指针捕获、跨图形边界拖动、取消、DPR 2 resize、浮层、空闲停帧和实际页面卸载。卸载后原生捕获必须释放、全局 API 必须移除、后续 pointer 事件不得再修改 Model。它不证明 #34 的任意退出子树/cubic-path/instances 或 WebGPU 绘制。

`yarn test:folding-fan` 检查 [Folding Fan 恢复](folding-fan-restoration.md)的严格 Calcit 24 片裁剪/层序/时间采样、纯数据图片 Scene 与几何差分、Node 打断与乱序、100 条有界输入日志的前缀重放/历史分支、资源预检零绘制；同时检查[通用资源生命周期](resource-lifecycle.md)、[多资源加载任务队列](resource-load-queue.md)、[图片资源 runner](image-resource-runner.md)与[多资源注册表](resource-registry.md)的 loading/ready/error、共享引用、版本替换、LRU 容量、活跃资源保护、异步解码、尺寸不符、runtime generation 取消、带完整身份的迟到完成释放，以及 100 次图片宿主和多资源装卸后关闭回零。Chromium 初始/中间/终点分别保存带浮层与纯 Canvas 截图，并在 DPR 1/2 下把当前 Scene 路径与历史直接绘制路径做整帧 RGBA 零差异比较，锁定浏览器默认图片平滑设置；另覆盖 URL 刷新像素一致、真实图片失败重试、暂停 resize 与全屏浮层。图片已接公共 Scene IR、窄 Canvas 参考入口和 Calcit 宿主 runner；跨浏览器采样矩阵及 WebGPU 纹理路径仍未实现。

全屏与恢复导航：`test:demo-nav` 检查 3 项 Node 清单及全部浏览器入口；原有 11 项均可从导航打开，艺术分类保持明确空状态，并覆盖 DPR 1/2、桌面/窄屏、暂停 resize 后状态不变、像素和浮层键盘操作。跨物理显示器 DPR 切换、旧 11 个动画的完整验收与真实 GPU 尚未完成。见[恢复清单](demo-restoration.md)。

`yarn test:demo-nav` 验证[完整演示导航](../demos/README.md)：清单无遗漏、统一编译、全部页面静态构建后在子路径部署、所有已实现入口初始化与导航往返、搜索/分类/刷新/移动端。原有 11 项须在同一页面切换、Canvas 节点保持唯一，旧入口的计时器与 DOM 监听卸载；固定时间直链、历史记录和 reduced-motion 下过渡行为也需可回归。当前自动化已覆盖同页入口、前后切换和历史记录；全部入口的资源释放计数与过渡逐帧截图仍待补，不以本门禁冒充完成。GPU 不可用时的回退不替代真实 GPU 画面或吞吐；CI 保存站点、导航截图与失败 trace。

`yarn test:consumer` 在独立临时项目安装候选提交，严格检查消费者，搬移入口可达产物后执行 Node/Chromium 合同；覆盖 1000 帧复用、乱序时间、同时间失效与 js-ffi/Quamolit GPU `:file` 分发。同一门禁在模块副本中验证 JS-only 修改：未编译的旧产物保持旧行为，显式编译后的公共调用使用新片段，Snapshot 与共享缓存不变。GPU 原生设备 mock 验证两个矩形的 1000 时间帧；非软件 adapter 的矩形专项与 10k 动态实例专项分别验证。后者检查 80 kB→8 B→0 B→跳版本 80 kB、单 Canvas 后端切换、100 次版本推进、device loss 重建与终点全图零差异；10k 独立运动再比较 CPU→GPU / GPU 时间采样的五个乱序整帧，并诊断 Canvas 中间帧栅格差异（#144 待定，不作为通过的跨后端像素合同）。无设备时单独 SKIP，不能记为硬件通过。详见[独立消费检验](isolated-consumer.md)；尚不包含通用 Presence GPU 资源集成、正式独立运动吞吐、watch 或 inline 热更新。

实例脏区专项：`yarn test:instance-resource` 检查 10k 实例连续补丁、复制隔离、跳版本解析、千次版本推进与释放；`yarn test:instance-gpu` 检查 Calcit 的 80 kB→8 B→0 B 上传决策及跳版本全量回退；`yarn test:webgpu-instances` 检查原生 writeBuffer 偏移、WebGPU 回退和公共 Calcit→GPU 与 Canvas 的像素一致性。无头软件 adapter 的浏览器专项为 SKIP；本机可加 `--headed -g '公共 Calcit 10k 实例脏区'` 在非软件 adapter 上运行，日志输出实际 adapter 和字节数。该合同不等于完整动态 10k 帧性能基准。

`yarn test:retained-component` 验证 [Calcit 组件保留计划](retained-component.md)：严格类型、原生乱序采样、Node 的 1000 帧静态对象身份/实际声明次数和六类版本失效、Chromium 同源画面对照及演示截图。另覆盖 [Presence 组件连接](presence-component.md)的叶节点 alpha、重入连续性、显式释放、100 次装卸及独立 Canvas 像素对照。它使用独立 `target/js/retained-component/`，不代表外部消费者安装、完整 TodoList 或 GPU/资源生命周期验收。

使用仓库声明的 Calcit/runtime 版本和 Node.js 24；开始前核对 `calcit -v`、`deps.cirru`、package/lockfile 与 CI。当前主项目与独立消费者夹具均声明 Calcit `0.28.0-alpha.3`，npm runtime 同步使用 `@calcit/procs@0.28.0-alpha.3`，主项目使用 js-ffi `0.2.1-alpha.11`；`yarn test:runtime` 会自动拒绝版本漂移，完整说明见 [工具链版本合同](calcit-027-upgrade.md)。Folding Fan 已改用 js-ffi 类型化图片绘制 API，Canvas 当前路径填充改用 `.fill!`。独立消费者夹具仍固定历史 Quamolit 候选提交，用于复现该候选的行为，不代表主项目源码版本。

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
yarn test:scene-hit
yarn test:scene-pointer
yarn test:scene-pointer-browser
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

测试目录中的手写 JS/MJS/CJS 使用 Prettier：提交前运行 `yarn format:test-js`，CI 以 `yarn check:test-js-format` 检查。范围限于 `test/**/*.{js,mjs,cjs}`；`js-out*`、`target/` 等生成产物不格式化。主代码、Calcit snapshot 和 demo 页面暂不纳入这条格式门禁。

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

`yarn test:presence-resources` 验证 [宿主实例资源跟踪](presence-resources.md)、[Presence device 组合状态机](presence-device-coordinator.md)、[异步资源任务 runner](presence-resource-runner.md)、[多资源加载任务队列](resource-load-queue.md)与 [Presence WebGPU 资源宿主](presence-webgpu-resources.md)：严格检查 Presence、纯 Calcit registry、有界优先级/FIFO/去重/取消队列、device/registry 自动重建和 generation-aware WebGPU executor；覆盖 pending 背压、运行中替换、accepted 安装、discarded 孤儿清理、ready 前延迟 GPU load、两代 device 动作顺序、旧 ready/failure 隔离、上传异常清理、load 等待期间 device loss、退出/idle 重入、80 kB 容量替换、100 次出入回零，以及 100 次实际 `RectBatchHost` 重建始终 `live=1`、最终 `created=released=101`、GPU buffer 全销毁。

`yarn test:webgpu-instances` 同时验证 [WebGPU texture 资源 runner](webgpu-texture-runner.md)：严格 Calcit API、Node 成功/解码/尺寸/上传失败与迟到清理、100 次 texture device rebuild，以及 Chromium 把 2×2 红色图片上传到两代真实 `GPUTexture` 后分别读回 `[255,0,0,255]`，最终 `created=released=2、live=0`。软件 adapter 可以证明 API 正确性，不算硬件性能或恢复时延证据；Presence 非软件 adapter 像素恢复仍会在软件环境明确 SKIP。尚未覆盖 Scene texture 采样、font/glyph/geometry/pipeline loader、queue/fence 延迟释放或指针捕获。

`yarn test:motion-browser` 还验证 [WebGPU 能力探测诊断夹具](webgpu-capability-probe.md)：通过 js-ffi 0.1.44 的 Calcit 公共 API，分别模拟 adapter 失败、ready 和设备丢失，并确认 Canvas 参考时间帧仍可绘制、探测设备被释放。真实浏览器的 `ready` 仅代表可获取 device，不是 GPU 画面或吞吐验收。

`yarn test:webgpu-images` 验证[公共 Scene 图片图层](webgpu-scene-images.md)：30 项严格类型、初始化失败的纹理释放、Calcit 仿射矩阵合成、原有 24 片裁剪参数、祖先组矩阵与嵌套窗口求交、镜像边界，以及绘制开始前的全资源/容量/f32 数值预检。旋转 clip 和非 1 的组透明度必须在 begin 前拒绝，不允许半帧。Chromium 按独立手算和同源 Canvas 检查图片裁剪、90° 旋转、源透明度、声明层序和整数嵌套窗口内外像素；1000 帧保持一个 pipeline/buffer 和两个 bind group，首帧 uniform=192 B、热帧=0 B。Folding Fan GPU/Canvas 状态切换、窗口开关不改变 Model、乱序时间、固定帧截图与暂停 resize 也被覆盖。新增混合文字/折线的完整图层回退、移除标注后复用 GPU、adapter 获取失败仍无漏绘；Canvas 全像素参考独立使用声明的隔离 surface。无 adapter/软件 adapter 的两项图片硬件专项明确 SKIP，不算硬件通过；adapter 失败的 Canvas 用例仍必须通过。硬件仅在 macOS/Metal 验证，其他设备未验证。分数裁剪/旋转边缘仍由 #144 跟踪，不以实色样本宣称全帧等价。

`yarn test:folding-fan` 的可选父组窗口另在 Canvas DPR 2 下检查窗口外全图无残留、暂停 resize、分享刷新与 Model 不变。混合文字/折线 Scene 对照独立原生隔离层，分数缩放/暂停 resize/分享刷新均全像素零差异。默认历史效果和 DPR 1/2 整帧 RGBA 零差异阈值保持不变。

`yarn test:layer-composition` 检查 [Calcit 分层契约与同屏示例](layer-composition.md)：严格公共类型、层 ID/视口/时间校验、整层后端选择、透明清屏 ABI、逆层序独立命中；Chromium DPR 1/2 全像素 Canvas 合成、暂停 resize、CDP 模拟运行中 DPR 1→2、卡片交互和 adapter 失败的完整实例占用。真实 GPU 专项仅由 `QUAMOLIT_LAYER_REQUIRE_GPU=1 ... --headed -g '真实 GPU'` 执行，验证 Apple/Metal-3 透明合成、device loss 整层回退与同版本重传；云端明确 SKIP，不冒充硬件通过。导航卸载和 adapter 迟到由 `test:demo-nav` 对完整静态产物验证。成本字段仅是 CPU 阶段计时，浏览器合成时间未知，不证明吞吐或 #177 全部完成。

分层成本的实际命令为 `yarn bench:layer-composition`，默认静态产物、独立 Chromium 进程、双后端各 5 秒预热/30 秒采样/3 轮；原始样本和边界见 [分层测量](layer-composition.md#分层成本测量入口)。`test:layer-composition` 同时执行报告负例检查；GPU 缺失时正式命令失败，不用回退成绩替代。浏览器合成/GPU 执行时间未知，不构成性能达标或分层默认化证据。

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
