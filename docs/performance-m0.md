# M0 性能基线与测量边界

本页记录 [#39](https://github.com/Quamolit/quamolit/issues/39) 在当前 Canvas2D 参考夹具上的初始基线。所有数值只对应具名环境与输入；它们不是 Quamolit 新架构的吞吐承诺。旧应用主入口仍为 bootstrap，因此没有可比的旧路径，也不计算虚构的加速比。完整原始逐帧样本由 `yarn bench` 输出，在 PR 的 Actions artifact 或本机 `test-results/bench/` 查看。

## 测量协议

```sh
yarn install --immutable
yarn playwright install chromium
yarn test:fixtures
yarn test:bench
yarn bench --fixture ui-transition --warmup 5 --duration 30 --runs 3 --out test-results/bench-ui
yarn bench --fixture mixed-ui --count 1000 --warmup 5 --duration 30 --runs 3 --out test-results/bench-mixed-1k
yarn bench --fixture instances --count 10000 --warmup 5 --duration 30 --runs 3 --out test-results/bench-10k
yarn bench --fixture instances --count 100000 --warmup 5 --duration 30 --runs 3 --out test-results/bench-100k
yarn bench --fixture text-path --warmup 5 --duration 30 --runs 3 --out test-results/bench-text-path
```

每个独立运行新建浏览器 context；固定 640×360 逻辑画布、DPR 1、无透明背景、内置字形、seed 7、默认事件序列。`instances` 以索引生成数据，不创建 100k 个组件节点。CPU 计时使用浏览器 `performance.now()`；rAF 时间戳与 CPU 工作分别保存。Canvas2D 浏览器实现可能用 GPU 加速，但此 API 不提供 GPU timestamp、真实上传字节或驱动 draw call，因此报告中不得将 CPU 调用耗时解释成 GPU 时间。`--power` 是操作者声明值，未知时保持 `unknown`。

## 初始测量

本机初始环境：Apple M1 Pro / macOS Darwin 25.6.0 / arm64，Node 24.4.1，Playwright Chromium 153.0.8010.12，仓库基线提交 `a5f2e367afe78722c66a3c886fd34b523fa4beca` 加本 PR 的基准代码。供电和实际 Canvas 底层 GPU/驱动未被可靠探测，均记 `unknown`/`unavailable`。每场景独立 3 次、每次 5 秒预热和 30 秒采样；空闲 rAF 中位数都是约 16.7 ms。浏览器页面也实际打开核查了 UI 中间帧、打断、推进时间及刷新重放。

| 参考场景 | 各次 CPU p95 中位数（区间） | rAF 间隔 p95 中位数 | 超过空闲周期 1.5 倍的间隔占比中位数 | 采样帧数/次 |
| --- | ---: | ---: | ---: | ---: |
| UI 过渡 | 0.20 ms（0.20–0.20） | 16.80 ms | 0% | 1801 |
| 1k 同类实例 | 0.90 ms（0.60–0.90） | 16.70 ms | 0% | 1800–1801 |
| 10k 同类实例 | 1.80 ms（1.80–1.80） | 16.71 ms | 0% | 1801 |
| 100k 压力档 | 32.07 ms（31.90–32.10） | 33.40 ms | 99.4% | 886–890 |
| 固定字形/路径 | 0.30 ms（0.30–0.40） | 16.70 ms | 0% | 1801 |

100k 档在此环境明显低于约 60 Hz 的回调节奏，不能称为达到 60 FPS；其他行的 rAF 结果也不等于真实呈现或跨设备验收。上表的 1k 夹具是简单同类实例，**不是**下节补充的 1k 混合 UI 参考节点，更不是尚未实现的 Calcit 组件树。目标来自 [路线](roadmap.md)：1k 混合 UI 和 10k 简单实例 60 FPS，100k 为压力档；120 FPS 为扩展目标。M0 不声称已达到最终产品目标。后续换后端、改 DPR/覆盖率、浏览器或设备必须新建基线，不沿用本页数值比较。

本机初始五档完整原始样本位于忽略的 `test-results/bench-{ui,1k,10k,100k,text}-calibrated/`，每个目录有 `report.json` 和三份 `run-N.json`；CI `Benchmark format` 工作流支持手动选择 `full` 生成包含下节混合 UI 在内的六档可下载 artifact。CI 机器的数值只供结构与噪声观察，不能替代上述本机数据或外推到用户设备。

## 追加：1k 混合 UI 参考负载

在干净提交 `5b3bfd32d4fa1e4643ae0bcf47c6d18ef880255c` 上补充 `mixed-ui`：一次建立 20 个裁剪组、每组 50 个可序列化节点，共 250 个矩形、250 个圆、250 条线和 250 个固定字形，其中 250 个节点随绝对时间移动且分布在四种图元。它是 Canvas2D 参考绘制负载，**不是**已有的 Calcit 组件树或 Scene IR 执行计划，不能把下面的耗时外推成新架构的组件求值性能。

同一 Apple M1 Pro / macOS Darwin 25.6.0 / arm64 上，以 Node 24.19.0、Playwright Chromium 153.0.8010.12、640×360 实际像素、DPR 1、seed 7 运行；供电与实际 GPU/驱动仍为 `unknown`/`unavailable`。三次独立 context 均预热 5 秒、采样 30 秒，各记录 1801 帧。CPU p95 分别为 1.2、1.0、1.1 ms，中位数 1.1 ms、区间 1.0–1.2 ms；rAF 间隔 p95 中位数 16.8 ms，超过空闲周期 1.5 倍的比例中位数为 0%。manifest 建立约 1.0–1.1 ms，首次绘制约 1.8–1.9 ms。三次在固定 `t=0.5` 读取完整画布得到相同 FNV-1a 校验和 `3860001321`。

原始逐帧数据位于忽略的 `test-results/bench-mixed-1k-committed/`（`report.json`、`run-1.json`、`run-2.json`、`run-3.json`）；短时预跑和未提交源码上的预跑另存，不用于正式结论。该结果仅说明本机参考场景的测量，不证明实际显示帧率、WebGPU 性能或跨设备目标。它与上表的简单 1k 实例不同负载，不能直接用两个 p95 声称改进或回归。

## 回归规则

同环境的 3 次运行与已审查基线比较，CPU `cpuFrameMs.p95` 各次中位数同时增加超过 10% 且超过 0.5ms 时，需复测并解释。`--baseline` 对环境关键字段不符或运行不足 3 次拒绝比较；不能依赖共享 CI 的短时烟测做硬件吞吐门禁。资源/上传计数在未来执行路径可用后，同样按 [检验规则](verification.md) 设门禁。视觉正确性始终由独立的截图测试验证。
