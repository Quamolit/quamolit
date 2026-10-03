# M2 #104：独立 Calcit 消费者安装与执行切片

前置产物是已合并 #114 的统一 `quamolit.retained-component` 执行入口。源码见 [examples/retained-consumer](../examples/retained-consumer/README.md)。消费者现在自己声明标量矩形和变换折线，使用同一 ComponentPlan。本切片不修改框架运行语义，重点检验新公共 API 能被另一个 Calcit 项目安装、编译、搬移并实际绘制，而非只证明旧接口兼容。

## 可复现门禁

```sh
yarn test:consumer
# 默认安装当前 HEAD；尚未推送时可先指定已发布/已推送的前置产物：
QUAMOLIT_CONSUMER_REF=12edc27020adf7f9ed55a4ad7adaa7d9e4c123fb yarn test:consumer
# 桌面硬件专项：出现 SKIP 也会失败，不可用普通 PASS 替代真实 GPU 证据。
QUAMOLIT_CONSUMER_HEADED=1 QUAMOLIT_CONSUMER_REQUIRE_GPU=1 yarn test:consumer
```

前提：Calcit/runtime 0.28.0、js-ffi 0.2.1-alpha.11、caps、Node.js 24、仓库依赖及固定 Chromium 已安装，有 GitHub/npm 网络访问权限。CI 对 PR head SHA 安装，不把先发布 alpha 当作验证前提；发布后应显式传入新 tag 重跑。

门禁由 `test/isolated-consumer.mjs` 执行：

1. 在系统临时目录创建独立消费者，只复制示例的源码/配置/锁文件，不复制作者 `.calcit`、`node_modules` 或编译输出。
2. 使用 `caps --ci add` 安装指定候选提交及递归依赖，`caps verify` 验证存储，Yarn immutable + node-modules 安装唯一直接 npm 依赖 `@calcit/procs`。
3. 对消费者 `app.main` 全部定义严格检查并编译。它不引用 `quamolit.test.*`、手写框架 JS 或 JS sampler Map；候选提交必须包含公共组件、Presence、版本化实例资源表、WebGPU 脏区上传与 device recovery 接口，不能用更早版本运行完整门禁。
   随后在同一临时模块副本依次验证 `:file` 绘制与 `:inline` 释放片段：未重编译仍是旧行为，显式重编译后注入故障经公共 Calcit 调用可见。每次使用新 Node 进程；file阶段不改Snapshot，inline阶段只经CLI事务改库副本的FFI元数据（dry-run/revision保护），函数体/schema不变。消费者Snapshot、作者源码与共享缓存不变；共用同一准备流程，只增加一次编译，不新增命令或CI job。
4. 根据当前 Calcit 单行静态 ESM import/export 收集入口可达文件；门禁拒绝动态 import、测试/演示 namespace、原始文件路径与额外 npm 包。先用测试与演示 namespace 反例确认拒绝发生在读文件之前且不污染闭包，再验证实际消费者。把这个闭包与标准 runtime 移到同级运行目录，原编译目录改名；运行目录不含 Calcit 源码、模块链接或 `src/host`。这不是通用 JS bundler，生成器格式变化时需更新并重新验证门禁。
5. 从搬移目录执行 Node 合同和 Chromium 页面，检查固定时间、同时间失效、像素及页面按钮。Vite/Playwright 由测试工程提供，仅用于驱动，不进入消费模块；请求记录中 Vite 开发客户端来自测试工具是预期行为。

## 实际断言与成果

| 检验 | 本切片证据 |
| --- | --- |
| 原生圆弧消费 #212 | 消费者以 Calcit `ArcNode` 声明带透明描边的开口圆弧，随父组淡入；与其他图元一起安装、编译并搬移。能力枚举和合法 payload 覆盖同步，九种 Canvas document 图元在乱序时间通过独立原生 Canvas 全 RGBA 零差异对照。圆弧 GPU、命中及标量绑定不在此验收范围；DPR 1/2 的方向、跨零、整圈和零跨度合同复用 Scene 核心浏览器测试 |
| 字体 Calcit 消费 | 消费方 FontSpec / 中文文字声明 / transform / 资源修订；1000 移动帧共享文字节点，同时间版本变化计划构建1→2。真实 FontFace 不自动安装，过期版本拒绝，精确句柄释放且重复释放为false；中文五个乱序帧与独立原生全RGBA参考零差异，缺失首选字体走原生monospace回退。每个汉字非空且区别缺字字形。共享租约由同一声明生成的 Presence 驱动：退出中间帧持有、快速重入不重载、两个所有者逐一释放、100次出入只加载一次，close后 accepted=released=1/live=0；Calcit 内断言，浏览器核对 FontFaceSet 回到基线。不是实际看板/capture组合、字体文件覆盖分析或排版缓存证据。inline 不增加下游 npm 或原始 JS 文件请求，复用原安装/搬移门禁与artifact |
| 声明与版本行为 | 消费者独立 Calcit 声明；时间 `[1,0,0.5,0.25,1]` 对应 x `[120,80,100,90,120]`；同时间 Model/资源/视口分别更新 y/颜色/宽度 |
| 保留执行 | Node 连续 1000 帧，声明/计划构建各 1，绑定与变换采样分别 1001；静态矩形、局部折线与编译槽位身份不变；旧帧不受影响 |
| 下游曲线绘制与命中 | 消费方 Calcit `curve-document` 声明绝对时间曲线、90°旋转/2倍缩放/祖先clip；公共 `compile-hit-plan` / `hit-test-plan` 验证乱序/重复时间、butt端点、空洞和裁剪。Node 6次计划构建/21次查询；搬移后的Chromium t=0/0.5/3通过公共Canvas入口绘制，每帧230400通道与独立原生隔离group参考零差异；直接CPU Canvas另报（Apple/Metal-3三帧分别626/542/372通道不同，见#144），不扩大阈值；命中失效与空绘制负例被检出。不是GPU路径或性能验收 |
| 反例 | 刻意停止时间采样，合同必须失败；NaN/±Infinity 请求必须抛错 |
| Presence 生命周期 | 消费方 Calcit 声明两张卡片并调用公共协调/采样/保留计划；稳定 key 重排不重启 alpha，退出 0.25/0.5/0.75 为 0.84375/0.5/0.15625，退出立即禁交互，中途重入连续，结算后只释放一次并停止请求帧 |
| Presence 真实资源释放 | 两个逻辑实例共享一个版本化源；退出期间 2 引用，第一项终点后 1 引用且不释放，最后引用终点后 Calcit 产生一个释放决定。公共实例资源表执行决定，100 次单调版本装卸产生 100 次释放且最终 live=0；停掉资源同步的反例被检出 |
| Device loss 恢复 | 消费者只经 Calcit `RecoveryTransition` 决定 generation 与动作；Node 连续 100 次丢失/重建后只留一代，关闭后 live=0，停掉 loss 转移的反例被检出。非软件 GPU 浏览器主动丢失一次后沿用当前 Model/资源版本重建；无硬件时显示同源 Canvas 回退 |
| 片段分发 | js-ffi 0.2.1-alpha.1 的 `document-available?` 使用依赖中的 `:file`；确认片段已安装、已嵌入，并在搬移后 Node 返回 false、Chromium 返回 true，无原始 JS 请求 |
| GPU 片段消费 | Quamolit 的 `gpu-component-create.mjs` 以定义级 `:file` 嵌入；搬移后的消费者仅通过 `app.main` 创建、安装、绘制及释放 GPU 计划，无原始宿主文件依赖 |
| JS-only 显式重编译 | file：只改副本 `canvas-rect-batches.mjs`，未编译仍绘制10000次，编译后故障可见且零提交。inline：CLI只改副本 `gpu-component/raw-dispose!` 的JS元数据，旧产物仍执行四项释放且重复调用幂等；编译后故障在释放前被检出。两阶段均比较生成模块哈希，消费者Snapshot/共享缓存不变；结果集中于 `ffiRecompile.file/inline`，替代旧报告的 `fileRecompile` 字段 |
| GPU 实例片段消费 | `quamolit.webgpu-batches/raw-create!` 以定义级 `:file` 嵌入 `webgpu-rect-batch-create.js` 单函数表达式；消费者编译产物搬移后不含 `src/host`，仍可创建、绘制、释放 10k 图层 |
| GPU ABI 计数 | 原生设备 mock：两个矩形单绑定冷启动上传128B records、352B parameters（五槽布局）；1000时间帧只上传16000B uniform，records/parameters均0B；1 pipeline、3 buffers，重复释放只销毁一次；不执行shader，不算硬件验收 |
| GPU 反例与失效 | 停止时间 uniform 写入会失败；同时间 Model/资源/视口变化不能复用旧程序；无效时间没有上传副作用；原混合折线场景明确返回 `cpu-transform-required`，不静默漏绘 |
| GPU 浏览器专项 | 搬移后的同一矩形声明在非软件 adapter 比较 8 帧 × 230400 通道，默认精确像素；覆盖乱序/重复及同时间三类失效和上传量。无 GPU/软件 adapter 明确 SKIP，单独写入报告 |
| 画面 | 实际画布 320×180、DPR=1；矩形内部粉色/绿色、静态横条灰色、变换折线蓝色与外部透明像素精确比较；另保存 Presence 退出中间帧与结算后画面 |
| 公共 10k 动态实例 | 消费者 Calcit `instance-frame-at` 在绝对时间生成一个实例位置；`register-patch!` 仅复制 8 B。Node 连续 100 次更新、释放旧公开版本后 live 恒为 1，最终卸载为 0。页面 Canvas/GPU 模式保留同一 `(id,version)` 源、单 Canvas 舞台和可见的 GPU 不可用回退 |
| 版本化实例命中与逻辑捕获候选 #202 | 下游Calcit `instances-hit-plan` 从公共资源表解析并复制10k位置，调用 `compile-hit-plan-with-positions`；`instances-hit-index` 返回Option索引。既有Node合同检查3次命中计划构建/版本1、2、3：重叠最高索引9999、移动实例5050、旧计划不受补丁/源释放影响、已释放版本不能创建新计划。消费者另经公共薄桥构建2次计划，换版本保留逻辑节点capture，卸载提交恰好释放一次；原生宿主是mock，不算真实PointerEvent。恒定none与跳过Calcit捕获/协调的反例必须失败。不包含单个源索引的稳定capture、GPU picking或吞吐验收，实际安装/搬移结果以candidate/harness报告为准 |
| 独立 10k 三路径 | 同一 Calcit 源驱动 Canvas / CPU→GPU / GPU 时间采样。Node 核对全部 CPU 坐标与 20000 个 GPU 参数；参数常驻的 1000 帧只写 uniform 16000 B，records/parameters 不上传，1 pipeline/3 buffers；非法数量、重复身份、精度域及伪造程序在上传前拒绝。页面复用已有 generation 恢复协议。硬件专项对 3 个索引 × 5 个乱序时间共读回 120 B，使用实际 WGSL、独立公式和既定 `1e-5+1e-5*abs(expected)`；两条 GPU 完整帧和 Canvas 整数端点零差异。Canvas 中间帧单列差异图/统计及 #144 待验收状态；无硬件单独 SKIP。未验收完整跨后端画质合同或正式性能 |
| 真实 GPU 动态画面 | Apple/Metal-3 上独立消费者的像素对齐 10k 源，初始/补丁/同版本/跳版本位置上传为 80000/8/0/80000 B；四个时间点采样像素和终点整幅 320×180 RGBA 均与 Canvas 参考精确一致，差异图全零。headless 无 adapter 单独 SKIP |

当前切片使用 Calcit 0.28.0；搬移后的可达编译闭包按每次报告的 `modules` 列表核对，不沿用旧候选的数量。唯一 npm 直接依赖是 Calcit runtime。不声称这是最小体积，namespace 级依赖仍可能引入未使用的函数。

当前 10k 独立源在 Apple/Metal-3、320×180/DPR 1：两条 GPU 路径 `[1,0,0.5,0.25,1]` 的整帧均为零差异；Canvas 的整数端点也是零差异。读回参考显式使用 `willReadFrequently: true`，避免不同读回顺序影响参考统计。t=0.5/0.25 相对该 Canvas 参考分别有 32299/31249 个差异像素，最大通道差 210/205、平均通道差 12.8672/14.2957（0–255），非白覆盖像素差 -9772/-7599。这不是 sampler 数值失败，也不是可忽略的 1 LSB；中间帧仍按 #144 等待合同决策，不设新容差。`independent-frame-<序号>-{scalarPng,cpuGpuPng,canvasPng,diffPng}.png` 与全部统计复用同一忽略报告/CI artifact。

连续时间数值对比采用独立 `80 + 40*t`，而运行时 lerp 使用不同计算顺序。首次精确比较出现 `80.16000000000001` 对 `80.16` 的 IEEE754 舍入差异，因此连续数值采用 `8 * Number.EPSILON * abs(expected)` 的舍入预算；整数时间点与实色像素仍严格相等，不放宽截图阈值。

`test-results/consumer/report.json` 保存 PASS/FAIL、候选版本、模块路径、可达文件、计数、环境、请求日志与限制；`commands.json` 保存安装/编译日志。截图包括 `frame-0.png`、`frame-0.5.png`、`frame-1.png`、`presence-exit-0.5.png`、`presence-settled.png`，失败时尽可能保存 `failure.png`。CI 上传 `quamolit-consumer-<run>` artifact。临时目录保留用于排查，不影响仓库目录层级。

## 未完成验收与下一步

同一个独立消费者已接 [帧测量](consumer-performance.md)：`bench:consumer` 对两矩形使用 Canvas、CPU 采样后 GPU 绘制、GPU 标准采样；另报静态 10k Canvas，以及同源单脏记录动态 10k Canvas/GPU 的逐帧样本。GPU 动态模式只更新一个实例，不能作为 10k 独立运动或完整性能验收。

线性/双轴专项各比较 8 帧完整画面；位置与尺寸专项另在 .37/.81/.4999999/-.1/1.1/0/1 读回 WGSL x/y/width/height，遵循 `1e-5+1e-5*abs(expected)`，不外推整个精度域。GPU 合同使用白底，Canvas 参考合成相同白底，不修改几何或像素阈值。历史审查基线：[线性](evidence/isolated-consumer-gpu.json)、[双轴](evidence/isolated-consumer-dual-gpu.json)；当前结果以 `test-results/consumer/report.json` 的 candidate/harness、adapter 与各专项状态为准，候选库和测试源码版本不得混淆。读回 probe 仅在测试中，消费者运行时无新增文件依赖。Actions 摘要分别列出四项 GPU 专项的 PASS、SKIP 原因与未执行；mock、缺失报告和 Canvas 中间帧诊断都不记为硬件画质通过。

- #104 已接入生命周期、实际资源释放、device loss 重建、`:file/:inline` JS-only 显式重编译和独立运动三路径；两档尺寸正式时长报告见[同源帧测量](consumer-performance.md)。发布tag重跑、跨后端中间帧合同、基线比较和完整目标判定仍未验收。
- 重编译门禁验证显式编译，不声称watch、热更新或任意构建缓存行为已经验证；inline释放使用原生句柄mock，不冒充GPU硬件测试。没有修改caps的共享不可变缓存。
- 本例仍需页面提供原生 Canvas context；统一的挂载/调度/卸载入口仍属于后续公共 API 工作。它不需要框架内部 JS，却不等于完整应用迁移已经完成。
- 后续应把通用纹理/字体/图片和多图层共享资源接到 device loss/rebuild 协议，并补发布 tag；当前保留模型/拓扑变化时整体重声明的合同。

本切片展示安装可用性与固定时间画面，未关闭任何 milestone；M2 结束仍需阶段验收矩阵、资源/回退/恢复及命名真实 GPU 的画面与性能证据。
