# 独立 Calcit 消费者

本目录是单独的 Calcit/Yarn 项目，不是 Quamolit workspace 子包。主要源码是 `calcit.cirru` 中的 `app.main`；通过统一 Calcit 执行入口声明静态横条、标量 Motion 矩形及 CPU 变换折线，使用同一个 ComponentPlan 绘制 Canvas。JS 入口只连接页面按钮、传入 Canvas 原生上下文与展示诊断计数，不实现动画或渲染循环。

使用 Calcit 0.28.0、Node.js 24 和 Yarn 4.12.0：

```sh
cd examples/retained-consumer
yarn install --immutable
yarn compile
calcit query def app.main/declare --raw
calcit query def app.main/update-plan --raw
```

`deps.cirru` 固定一个已推送的 Quamolit 候选提交，用于公共 API 验证；它不是发布 tag。要验证另一已推送提交或发布 tag，使用 `caps --ci add Quamolit/quamolit -r <完整 SHA 或 tag>`，再编译。不需要 npm 的 Quamolit 包或 `@calcit/js-ffi` 包；当前路径唯一 npm 直接依赖是 `@calcit/procs`。

从 Quamolit 根目录可运行 `yarn vite examples/retained-consumer --host 127.0.0.1 --port 5183` 查看页面。Vite 只是开发服务器，不是 Calcit 消费者的运行时依赖。点击时间按钮可乱序查看中间帧，在相同时间修改 Model、资源 ready 与宽度版本，观察声明次数及画面更新。

原页面的“矩形透明度渐入”或 `?motion=alpha` 使用 Calcit `declare-alpha` 复用原两矩形 Scene，以两点 clamp 关键帧声明0→1的smoothstep alpha；GPU冷准备归一化到已有tween内核。界面显示Canvas参考，GPU采样/上传/数值和画面对照复用已有双轴硬件专项，多段、repeat 与group opacity仍不支持。五槽布局的冷安装内存/字节变化见[GPU合同](../../docs/gpu-scalar-program.md)，旧性能样本仍属于旧源码。

“往返轨道”或 `?motion=mirror` 复用同一两矩形声明，只在 Calcit 将 x Motion 改为两点 mirror 轨道。时间 0/1/2 对应起点/终点/回到起点，1.5 为返回中间帧；负时间同样周期映射。Canvas 与 GPU 消费同一来源；GPU 门禁嵌在原双轴专项，包含负时间、跨周期乱序、依赖失效、真实 shader 数值读回及1000热帧。时间域受现有精度检查约束，超出时整层回退，不能把循环理解为无限大的 f32 时间都能精确绘制。

## API 调用顺序

字体切片也由本目录的 Calcit 声明：`font-spec` → `load-font!` → 核对当前版本后 `install-font!`，`start-font` / `update-font` 用同一 ComponentPlan 绘制“图表收入”。移动采用已有 CPU transform，文字节点不随时间重建；字体 ready 时显式提升资源版本，同时间也重声明。结束用 `release-font!` 删除确切 FontFace。加载、失败、安装和释放都调用 Quamolit Calcit 模块，两个平台 inline 随模块编译内嵌，无额外 JS loader。它是隔离门禁中的固定尺寸诊断，不新增导航作品或声称原生排版缓存已完成；临时平台接口待 js-ffi #158 替换。

`declare` 返回纯 Scene/Motion 声明，`declare-execution` 添加蓝色折线及 CPU 变换提供者，返回 `ExecutionDeclaration`。`request` 构造带完整版本的 `ComponentRequest`，`start` 调用 `build-execution-plan`，`update-plan` 调用 `update-execution-plan`。`draw!` 用 js-ffi 清屏，再调用统一 `draw-plan!`，调用者不选择内部标量/路径计划。

蓝色折线的局部端点是 `(0,140) → (40,140)`，横向变换为 `20 + 10*time + model - 40`。连续时间同时改变粉色矩形的标量绑定和折线变换；同时间 Model 改变会重新声明二者。静态节点、折线局部几何和标量槽位在 1000 个时间更新中保持对象身份，绑定采样与变换采样计数分别显示。

模型数值在这个小示例中同时充当非负版本；真实应用应把模型内容与单调修订号分开。props/声明变化必须提升 component 版本，不能仅换闭包却保留版本。viewport 参数是逻辑宽度输入，不是完整 DPR/resize 适配。

## 隔离门禁

页面可在“线性矩形 + 折线”、“位置与尺寸渐变”与“Presence 生命周期”之间切换，后两者也可通过 `?motion=dual` / `?motion=presence` 直接进入。位置与尺寸声明仍由 Calcit 的 `declare-dual` 创建，同一参数供 `start-dual` / `update-dual` 的 Canvas 参考和 GPU 程序使用。切换声明时重建计划，保留当前显式时间/Model，不在旧声明的相同版本上错误复用结构。

Presence 模式的 Scene、稳定 key、协调、任意时间采样、是否继续请求帧、显式结算和 ComponentPlan 都在消费方 Calcit 中。页面 JS 只提交“重排 / 移除 / 重入 / 结算”事件并绘制返回计划。移除后橙色卡片继续淡出但立即停止交互；动画中途重入从当前 alpha 继续；退出终点只有显式结算才返回一次释放通知。隔离 Node 合同另用两个实例节点共享同一 `(id,version)`，让 Calcit 计算引用和释放决定，再由公共实例资源表实际释放：连续 100 次单调版本装卸均回到 live=0。

第三、第四个模式分别是 10k Canvas 参考与 10k WebGPU 图层，可用 `?motion=instances` / `?motion=instances-gpu` 进入。初始 80 kB 网格输入由页面提供；Calcit 的 `instances-declaration`、`instance-frame-at`、资源表与 `draw-resolved-instances!` / `draw-instances-gpu!` 决定声明、任意时间的一个实例位置、版本与上传。页面只把 Calcit 帧的两个数值装入原生 Float32Array。连续时间变更复制/上传 8 B，同版本重绘上传 0 B；GPU 不可用或恢复中时页面可见地使用同源 Canvas。WebGPU 的 generation、迟到结果、回退和重建动作由纯 Calcit [`quamolit.device-recovery`](../../docs/device-recovery.md) 决定；按钮可以主动模拟 device loss，沿用当前 Model/资源版本重建，任意时刻只保留一代 GPU 句柄。Canvas 仍逐实例调用 10k 次 `fillRect`，GPU 是单次实例 draw。两个模式切换时只保留一个 Canvas 节点。网格为 125×80、2×2 整数无重叠矩形，用于同源精确像素对照；小数重叠的画质差异另见 [#144](https://github.com/Quamolit/quamolit/issues/144)。这不代表 10k 实例各自独立运动。

勾选“全部 10k 实例独立动画”，或使用 `?motion=instances&independent=1`，即可复用同一舞台演示全部实例运动。消费方 Calcit 一次声明 10000 个有独立 ID、from/to/start/duration/easing 的现有 `Vec2Descriptor`，乱序时间直接调用 Quamolit `sample-vec2`；JS 仅把采样结果装入 Float32Array。Canvas 与 CPU→GPU 都消费同一全量快照，每次变化登记/上传 80 kB，同时间 GPU 重绘为 0 B。切回单脏记录模式会恢复原网格，不保留其他实例的偏移。

“10k GPU 时间采样”按钮或 `?motion=instances-scalar` 使用同一份动画声明。Calcit `quamolit.gpu-scalar-program/prepare-instance-program` 将一个逻辑 InstanceNode 和 Motion 列表降为冷执行帧，不创建 10k ComponentPlan；`InstanceProgramResult` 显式返回 ready/fallback。`install-instance-program!` 复用既有 scalar renderer，冷安装记录 640 kB、参数清零及写入 1280 kB；`draw-instance-at!` 检查共用精度预算后仅写 16 B 时间/视口，不进行 CPU 位置采样。常量、linear/smoothstep tween 共享既有参数编码和 WGSL；非法身份/数量立即拒绝，超出 f32/精度域整层回退 Canvas。实例程序只保存纯来源与执行记录，GPU 句柄仍由宿主拥有；设备重建重新安装，不沿用旧句柄。该 API 仍为实验入口，调用者维护 host 当前安装的 program。

三路径功能与关键上传计数已接入同一个 `test:consumer`；真实 GPU 专项复用现有 shader 读回 3 个代表索引 × 5 个乱序时间，与独立公式核对既定数值误差。对同一 Float32 CPU 快照还比较两条 GPU 路径的完整画面，五个时间帧均零差异；Canvas 整数起点/终点也保持全图零差异。中间帧另输出差异图、通道差与覆盖像素计数，标为 `PENDING_RASTERIZATION_CONTRACT_144`，不以诊断产物替代画质通过。两档尺寸正式时长测量已记录在[消费者帧报告](../../docs/consumer-performance.md)，目标判定、基线比较与跨后端中间帧合同仍未验收，不宣称 60 FPS 达标。

`QUAMOLIT_CONSUMER_BENCH=1` 默认保留原负载；加 `QUAMOLIT_BENCH_LOAD=independent-10k` 与 `QUAMOLIT_BENCH_SIZE=320x180|1920x1080` 切到同源独立动画三路径，不另建命令。正式时长为每路径预热 5 秒、采样 30 秒、独立运行 3 次；短时参数只用于门禁烟测，不把不同负载混算加速比。

从仓库根目录运行 `yarn test:consumer`，或 `QUAMOLIT_CONSUMER_REF=<已推送 SHA 或 tag> yarn test:consumer`。完整流程与验收边界见 [独立消费检验](../../docs/isolated-consumer.md)。该命令会新建系统临时目录，联网安装、编译并搬移可达产物；成功/失败都保留临时目录供排查，路径写入报告。模块缓存可以复用，不声称验证冷缓存下载性能。

GPU 消费使用同一个 `declare` 的两个矩形：`start-rects` → `prepare-gpu`，成功分支得到参数程序，调用 `create-gpu!` / `install-gpu!` 后，热帧只调用 `draw-gpu! host program time`，不逐帧 CPU 采样。程序必须与 host 当前安装的程序一致；同时间输入变化由 `update-rects` 和 `gpu-reusable?` 判断，不可复用时重新准备和安装；结束调用 `dispose-gpu!`。这些应用函数只导入 Quamolit Calcit 模块，宿主片段在编译时内嵌，没有额外 JS 文件供使用者手动导入。

现有页面仍展示完整混合 Canvas 场景，不因 GPU 支持范围删除折线。门禁额外验证矩形 GPU 子集、10k 动态实例 GPU 和完整混合场景的明确回退；浏览器硬件专项无非软件 adapter 时标记 SKIP。实例表验证 100 次变更只保留一个公开版本，Presence 已接入真实 CPU 实例资源表释放；恢复协议另验证 100 次 loss/rebuild、迟到结果隔离与最终 GPU live=0，并在可用硬件上主动恢复一次。纹理/字体/图片、多图层共享 device、10k 独立运动和跨设备性能尚未验收，不能据此关闭 #51/#104 或 M2。
