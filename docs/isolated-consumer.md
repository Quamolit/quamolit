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

前提：Calcit 0.22.0、caps、Node.js 24、仓库依赖及固定 Chromium 已安装，有 GitHub/npm 网络访问权限。CI 对 PR head SHA 安装，不把先发布 alpha 当作验证前提；发布后应显式传入新 tag 重跑。

门禁由 `test/isolated-consumer.mjs` 执行：

1. 在系统临时目录创建独立消费者，只复制示例的源码/配置/锁文件，不复制作者 `.calcit`、`node_modules` 或编译输出。
2. 使用 `caps --ci add` 安装指定候选提交及递归依赖，`caps verify` 验证存储，Yarn immutable + node-modules 安装唯一直接 npm 依赖 `@calcit/procs`。
3. 对消费者 `app.main` 全部 17 个定义严格检查并编译。它不引用 `quamolit.test.*`、手写框架 JS 或 JS sampler Map；GPU 切片依赖 #118 中已推送的 `12edc27` 公共接口，不能用更早版本运行本门禁。
4. 根据 Calcit 0.22 单行静态 ESM import/export 收集入口可达文件；门禁拒绝动态 import、测试 namespace、原始文件路径与额外 npm 包。把这个闭包与标准 runtime 移到同级运行目录，原编译目录改名；运行目录不含 Calcit 源码、模块链接或 `src/host`。这不是通用 JS bundler，生成器格式变化时需更新并重新验证门禁。
5. 从搬移目录执行 Node 合同和 Chromium 页面，检查固定时间、同时间失效、像素及页面按钮。Vite/Playwright 由测试工程提供，仅用于驱动，不进入消费模块；请求记录中 Vite 开发客户端来自测试工具是预期行为。

## 实际断言与成果

| 检验 | 本切片证据 |
| --- | --- |
| 声明与版本行为 | 消费者独立 Calcit 声明；时间 `[1,0,0.5,0.25,1]` 对应 x `[120,80,100,90,120]`；同时间 Model/资源/视口分别更新 y/颜色/宽度 |
| 保留执行 | Node 连续 1000 帧，声明/计划构建各 1，绑定与变换采样分别 1001；静态矩形、局部折线与编译槽位身份不变；旧帧不受影响 |
| 反例 | 刻意停止时间采样，合同必须失败；NaN/±Infinity 请求必须抛错 |
| 片段分发 | js-ffi 0.2.1-alpha.1 的 `document-available?` 使用依赖中的 `:file`；确认片段已安装、已嵌入，并在搬移后 Node 返回 false、Chromium 返回 true，无原始 JS 请求 |
| GPU 片段消费 | Quamolit 的 `gpu-component-create.mjs` 以定义级 `:file` 嵌入；搬移后的消费者仅通过 `app.main` 创建、安装、绘制及释放 GPU 计划，无原始宿主文件依赖 |
| GPU ABI 计数 | 原生设备 mock：两个矩形冷启动上传 128 B records、160 B parameters；1000 时间帧只上传 16000 B uniform，records/parameters 均 0 B；1 pipeline、3 buffers，重复释放只销毁一次；不执行 shader，不算硬件验收 |
| GPU 反例与失效 | 停止时间 uniform 写入会失败；同时间 Model/资源/视口变化不能复用旧程序；无效时间没有上传副作用；原混合折线场景明确返回 `cpu-transform-required`，不静默漏绘 |
| GPU 浏览器专项 | 搬移后的同一矩形声明在非软件 adapter 比较 8 帧 × 230400 通道，默认精确像素；覆盖乱序/重复及同时间三类失效和上传量。无 GPU/软件 adapter 明确 SKIP，单独写入报告 |
| 画面 | 实际画布 320×180、DPR=1；矩形内部粉色/绿色、静态横条灰色、变换折线蓝色与外部透明像素精确比较；初始/中间/终点截图 |

本地首次通过环境：Node 24.19.0、Calcit 0.22.0、Chromium 153.0.8010.12。加入 GPU 消费后可达编译闭包 22 个模块，唯一 npm 直接依赖是 Calcit runtime；并不声称这是最小体积，namespace 级依赖仍可能引入未使用的函数。

连续时间数值对比采用独立 `80 + 40*t`，而运行时 lerp 使用不同计算顺序。首次精确比较出现 `80.16000000000001` 对 `80.16` 的 IEEE754 舍入差异，因此连续数值采用 `8 * Number.EPSILON * abs(expected)` 的舍入预算；整数时间点与实色像素仍严格相等，不放宽截图阈值。

`test-results/consumer/report.json` 保存 PASS/FAIL、候选版本、模块路径、可达文件、计数、环境、请求日志与限制；`commands.json` 保存安装/编译日志。截图为 `frame-0.png`、`frame-0.5.png`、`frame-1.png`，失败时尽可能保存 `failure.png`。CI 上传 `quamolit-consumer-<run>` artifact。临时目录保留用于排查，不影响仓库目录层级。

## 未完成验收与下一步

固定提交 `533b50b` 的[硬件运行报告](evidence/isolated-consumer-gpu.json)保存实际 adapter、8 帧差异/上传量与 mock 计数，二者分别标注。报告中的 PNG 文件名相对于该次 `test-results/consumer`；重跑会更新本地 artifact，不将这些文件名视为永久图片链接。

新增硬件专项在桌面 Chromium 153 / Apple `metal-3` 通过：8 帧各 230400 通道零差异，前 5 个时间帧 records/parameters 上传都是 0 B，后 3 个版本失效帧各重新上传 128/160 B。GPU 现有合同是白色清屏，测试将透明 Canvas 参考以 destination-over 合成相同白底，不改变任何几何或像素容差；首次背景未对齐被断言检出。`gpu-frame-<序号>-gpu.png` / `-canvas.png` 保存实际/参考画面。headless 在本机无 adapter，报告仍明确 SKIP。

- #104 尚未完整满足：进入/退出、目标打断、稳定 key 重排与真实资源表释放未接入此消费者；已测矩形 GPU 像素和上传计数，尚未测完整 CPU/GPU 阶段耗时与端到端性能。
- 尚未验证“仅修改 `:file` JS 源码后的显式重编译”；这次只验证发布片段安装、嵌入和产物搬移，不声称热更新能力。没有修改 caps 的共享不可变缓存。
- 本例仍需页面提供原生 Canvas context；统一的挂载/调度/卸载入口仍属于后续公共 API 工作。它不需要框架内部 JS，却不等于完整应用迁移已经完成。
- 后续应把 #49 的生命周期接入同一 Calcit 消费路径，依据 #39 协议加入真实阶段测量，再推进 #38/#40/#52 的同源 WebGPU。当前保留模型/拓扑变化时整体重声明的合同。

本切片展示安装可用性与固定时间画面，未关闭任何 milestone；M2 结束仍需阶段验收矩阵、资源/回退/恢复及命名真实 GPU 的画面与性能证据。
