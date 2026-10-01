# M2：独立 Calcit 消费者的同源帧测量

另有 [#177 分层消费者成本入口](layer-composition.md#分层成本测量入口)：全屏 Canvas UI 与 10k 静态实例同时显示，比较 Canvas+Canvas 和 WebGPU+Canvas，使用当前主仓库的实际 Calcit 声明。该示例尚不是独立安装/搬移消费者，也不是本页三路径或 #175 的独立实例动画；数据分别归档，不能混用来关闭 #104/#175。

推进 #39/#50/#40/#52，消费已合并 #118 的公开 Calcit 计划与 GPU 采样。它替代“只测 CPU 批次准备”的证据空白，但首个负载仅两个矩形、一个双轴动画节点，不能外推 1k/10k/100k 吞吐，也不完成 M2。

## 运行

```sh
# 固定工具链和依赖与 test:consumer 一致，需要网络、桌面 Chromium 和非软件 WebGPU。
QUAMOLIT_BENCH_POWER='填写实际供电状态' yarn bench:consumer

# 仅烟测，报告 formalDuration=false，不是正式基线。
QUAMOLIT_BENCH_WARMUP=0.2 QUAMOLIT_BENCH_DURATION=0.6 QUAMOLIT_BENCH_RUNS=1 yarn bench:consumer
```

默认每条路径预热 5 秒、采样 30 秒、独立浏览器进程运行 3 次，轮换两矩形路径顺序。每次关闭进程以隔离 GPU device 与渲染器生命周期；上一版连续复用 Chromium 进程的正式长测曾在中途出现页面提前关闭，不能把未完成样本算入正式报告。先运行独立安装/编译/搬移及正确性门禁，再测搬移后的 `app.main`；没有加载仓库内部 JS 渲染器或 sampler。Calcit 消费者增加 CPU 批次的公共调用，所有声明、动画采样、失效与批次语义仍来自 Calcit。

CI 在原有 `test:consumer` 步骤设置 `QUAMOLIT_CONSUMER_BENCH=1` 和短时参数，验证 Canvas 链路、格式和计数，以及独立的静态 10k Canvas、单脏记录动态 10k Canvas/GPU 负载；无硬件的 GPU 路径明确 SKIP。桌面 `bench:consumer` 设置 REQUIRE_GPU，SKIP 会失败。`yarn test:bench` 检验配置与异常上传、热帧分配、未释放资源、结构重建等负例。

## 同源输入与比较边界

三条路径使用相同的 `declare-dual`、Model=40、ready=false、viewport=100、320×180 实际像素、DPR=1、白底、相同矩形层序与 alpha。时间为 `abs((frameIndex % 120) / 60 - 1)`，按帧序号给定，不根据某一后端耗时改变运动输入；不同运行的帧数可以不同，原始样本记录每帧 time。固定 t=.5 的像素校验和必须跨后端/跨运行相同。

| 路径 | 每帧工作 |
| --- | --- |
| canvas | Calcit 更新/采样 ComponentPlan → Canvas 参考绘制 |
| gpu-cpu | 同样更新/采样 → Calcit 缓存批次差量 → GPU 记录上传/绘制 |
| gpu-scalar | 冷安装相同 Motion 参数；每帧仅精度预算检查、时间 uniform 和绘制 |

GPU 通过原生 device/queue 方法包装测实际调用量，热帧禁止新增 buffer/pipeline；scalar 禁止记录/参数上传，cpu 模式允许单个动态矩形 0/64 B 更新。计数包含测量包装开销，不能把这一小负载用于有意义的 GPU 加速倍数宣传。普通帧没有 GPU 读回；测量结束后的固定帧校验和单独读回，不纳入耗时。隐藏页面会中止，不把后台节流当正常成绩。

## 报告与阶段

`test-results/consumer/bench-report.json` 保存环境、候选库 SHA、测试源码 revision/dirty/hash、供电说明、分位数、rAF 节奏代理、cold/hot 上传和资源计数；`bench-<backend>-<run>.json` 保存逐帧原始样本。校验和或核心计数失败即失败；CI artifact 包含这些文件。

- `declarationMs`：实际 Calcit 初始声明和建计划；`rendererSetupMs` 包含 adapter/device/renderer/冷程序准备；`firstDrawMs` 为首次安装/绘制。
- `samplePlanMs`：组件计划更新和 CPU 采样；`batchMs`：CPU 缓存批次更新。
- `drawBoundaryMs`：Calcit 验证/打包、原生命令编码、上传和提交的合并边界。`queueWriteMs` / `queueSubmitMs` 是它的子区间，不能再加一次。尚未单独测纯打包和纯编码。
- `cpuFrameMs`：从计划更新开始到绘制调用返回的完整 CPU 区间；不含浏览器内部 GPU 执行/呈现，也不包含测试记录样本的对象分配。rAF 间隔另报，不与 CPU 区间相加。
- GPU timestamp、真实输入到显示延迟、Calcit/JS 每帧分配暂不可用；Canvas 实际上传量为 null，不假报 0。GPU live buffer 释放后必须回到 0。

本协议采用当前 verification.md 的正式时长与分位数要求，仍不等于目标性能通过；刷新率校准只是 rAF 代理。`instances` 独立段继续记录静态 10k Canvas；`dynamicInstances` 段和 `bench-<canvas|gpu>-instances-dynamic-<run>.json` 记录同源 10k 单脏记录负载的 `sampleMs`、`patchMs`、`drawBoundaryMs`、完整 CPU 帧、rAF、每帧复制/上传字节、draw 次数、live 版本与终点校验和。GPU 冷帧 80 kB、热帧 8 B，Canvas 每帧重绘 10k；测量期间不读回 GPU，终点提交后立即捕获，避免浏览器呈现纹理轮换造成空帧。网格使用 125×80、2×2 整数无重叠矩形；小数重叠的栅格化差异另见 [#144](https://github.com/Quamolit/quamolit/issues/144)。不同负载不混算加速倍数；这不是 10k 个独立动画，也不证明设备恢复、输入到显示延迟或 GPU 执行时间。

## 本轮实际验证

Calcit/runtime 0.22、Node 24、Chromium 153 / Apple Metal-3：三条路径的 0.2 秒预热、0.6 秒采样烟测均通过，并通过固定帧跨后端校验和、上传量和资源释放断言。headless CI 配置的 Canvas 烟测通过，GPU 明确 SKIP；8 项 `test:bench` 通过。

首次正式长测完成第一轮 Canvas 与 CPU→GPU 后，测试浏览器提前关闭；下一次复用同一 Chromium 进程的正式长测在第二轮再次发生页面关闭。原因未确认，两个不完整报告均标 FAIL，不引用部分 p95。改为每条路径独立浏览器进程后，3 轮短时回归及正式长测全部通过。

2026-09-27 正式报告：macOS arm64 / Apple M1 Pro、Chromium 153.0.8010.12、Calcit 0.24.3、非软件 `apple / metal-3`、DPR=1、320×180、供电状态 `unknown`；每路径预热 5 秒、采样 30 秒、独立运行 3 次，18 份逐帧原始样本，`formalDuration=true`。动态 10k 单脏记录的 CPU 完整帧 p95 三轮中位数：Canvas 1.5 ms，WebGPU 0.7 ms；rAF 间隔 p95 中位数分别 17.6/18.3 ms。两后端三轮终点 checksum 均为 `2349720069`，硬件画面专项四帧全图 RGBA 零差异。GPU 每个测量帧上传 8 B 位置（另有 64 B uniform），一层一次 draw，Canvas 每帧 10k 次 `fillRect`。这些是该夹具的 CPU 调用边界数据；未知供电、320×180、只有一个实例运动、无 GPU timestamp/显示延迟，不宣称达到 M2 的 10k 独立动画 60 FPS 目标，也不据此关闭 #38/#40/#51。
