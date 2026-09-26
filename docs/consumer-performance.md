# M2：独立 Calcit 消费者的同源帧测量

推进 #39/#50/#40/#52，消费已合并 #118 的公开 Calcit 计划与 GPU 采样。它替代“只测 CPU 批次准备”的证据空白，但首个负载仅两个矩形、一个双轴动画节点，不能外推 1k/10k/100k 吞吐，也不完成 M2。

## 运行

```sh
# 固定工具链和依赖与 test:consumer 一致，需要网络、桌面 Chromium 和非软件 WebGPU。
QUAMOLIT_BENCH_POWER='填写实际供电状态' yarn bench:consumer

# 仅烟测，报告 formalDuration=false，不是正式基线。
QUAMOLIT_BENCH_WARMUP=0.2 QUAMOLIT_BENCH_DURATION=0.6 QUAMOLIT_BENCH_RUNS=1 yarn bench:consumer
```

默认每条路径预热 5 秒、采样 30 秒、独立上下文运行 3 次，轮换路径顺序。先运行独立安装/编译/搬移及正确性门禁，再测搬移后的 `app.main`；没有加载仓库内部 JS 渲染器或 sampler。Calcit 消费者增加 CPU 批次的公共调用，所有声明、动画采样、失效与批次语义仍来自 Calcit。

CI 在原有 `test:consumer` 步骤设置 `QUAMOLIT_CONSUMER_BENCH=1` 和短时参数，验证 Canvas 链路、格式和计数；无硬件的两条 GPU 路径明确 SKIP。桌面 `bench:consumer` 设置 REQUIRE_GPU，SKIP 会失败。`yarn test:bench` 检验配置与异常上传、热帧分配、未释放资源、结构重建等负例。

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

本协议采用当前 verification.md 的正式时长与分位数要求，仍不等于目标性能通过；刷新率校准只是 rAF 代理。下一步扩展到代表负载和公共 instances，并补资源/输入变更、纯打包/编码阶段与同环境基线回归比较。当前不自动计算不同硬件、不同尺寸或不同负载的加速比。

## 本轮实际验证

Calcit/runtime 0.22、Node 24、Chromium 153 / Apple Metal-3：三条路径的 0.2 秒预热、0.6 秒采样烟测均通过，并通过固定帧跨后端校验和、上传量和资源释放断言。headless CI 配置的 Canvas 烟测通过，GPU 明确 SKIP；8 项 `test:bench` 通过。

首次正式长测完成第一轮 Canvas 与 CPU→GPU 后，测试浏览器提前关闭，第三条路径中断；原因未确认，没有生成有效的完整三轮基线，不引用部分 p95 作性能结论。中断后补了 RUNNING/PASS/FAIL 状态和关闭/崩溃诊断，测试确保新一轮失败不会遗留旧 PASS 报告。完整正式基线、10k 负载、目标刷新率及吞吐仍未验收。
