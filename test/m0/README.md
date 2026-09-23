# M0 可运行参考场景

这些夹具推进 [#46](https://github.com/Quamolit/quamolit/issues/46)。它们使用独立的 Canvas2D 参考绘制器，不依赖仍在迁移的旧应用入口，也不声称已有 Scene IR 或 WebGPU 后端。`fixtures.mjs` 只负责可序列化输入与参考模型；后续渲染器应消费同一份 manifest，并和参考画面比较。

在项目根目录运行：

```sh
yarn install --immutable
yarn test:fixtures
yarn vite --host 127.0.0.1
```

打开 `http://127.0.0.1:5173/test/m0/?fixture=ui-transition&time=0.75&seed=7&dpr=1`。场景 ID 为 `ui-transition`、`instances`、`text-path`；实例数量用 `count=1000|10000|100000` 指定。固定逻辑尺寸为 640×360，DPR 只接受 1 或 2。`glyph=loading|ready|error` 显式设置字形资源状态。时间单位为秒；0、0.5、0.75、1.4 分别适合初始、中间、打断后和终点画面。页面显示实际像素尺寸和参考模型；`window.quamolitM0.renderAt(t)` 可精确采样任意非负有限时间，`getManifest()`、`getReferenceModel()`、`getFramePng()` 供截图工具读取。

UI 夹具的默认输入记录：0.15 秒进入 `detail-card`，0.65 秒将运动目标从 500 打断到 220，0.9 秒开始退出。拖动时间条和播放使用同一模型；“此刻改目标”把事件写入 URL 的 `events` 参数，刷新后可重放。重置按钮恢复默认输入。`instances` 以 seed/index 生成可索引的实例数据，不生成 100k 个组件节点；三个数量档共用同一规则。`text-path` 使用内置固定 5×7 字形与三次贝塞尔路径，不依赖系统字体或网络资源。所有资源版本及 ready 状态写入 manifest。

本阶段的参考模型可乱序采样；这是 M0 夹具本身的确定性数学实现，并非 Quamolit 公共动画 API。当前画面不包含真实 Canvas 文字排版、图片、嵌套裁剪、事件命中或 GPU 绘制；这些由后续 milestones 处理。`yarn test:fixtures` 验证模型数值和重放；`yarn test:visual` 执行 Chromium 浏览器检查。

`evidence/` 保存同一浏览器会话、1280×720 视口、DPR 1、seed 7 的页面截图。UI 的 0/0.5/0.75/1.4 秒以及实例和文字路径的 0.5 秒均有样本；这是人工审查证据，不能作为跨浏览器自动像素基线。同样输入的 UI、实例和文字路径画面分别冷加载 3 次，截图字节哈希一致。浏览器版本由 #47 的 CI 环境固定。

参考图：[UI 初始](evidence/ui-initial.png)、[UI 中间](evidence/ui-middle.png)、[UI 打断后](evidence/ui-interrupted.png)、[UI 终点](evidence/ui-end.png)、[1k 实例](evidence/instances-1k.png)、[固定字形与路径](evidence/text-path.png)。

## 自动视觉检查与基线维护

先用 `yarn playwright install chromium` 安装锁定版本配套的浏览器，再运行 `yarn test:visual`。命令先由 `caps --ci` 安装 Calcit 模块，再编译旧版帧夹具、启动独立 Vite 服务，检查 UI 的四个固定时刻、1k 实例、文字路径以及旧版矩形中间帧；同时验证实色内区精确 RGBA、顺序帧重放、乱序采样与手动打断刷新后重放。浏览器缺失、页面异常、资源非 ready 或快照缺失都报错。

快照存于 `snapshots/`，按浏览器项目和操作系统区分。截图包含画布的 1px CSS 边框；画布原始像素仍由 manifest 固定为 640×360。M0 的逐像素阈值为 `0.04`；允许差异像素数分别是 UI 40、实例 100、文字路径 180、旧版矩形 40，且 UI 实色内区必须完全相等。阈值只处理边缘抗锯齿差异；明显位移或漏绘应失败。CI 的 Ubuntu/Chromium 是主验收环境，Mac 快照仅供本机运行。Linux 初始快照来自 [Actions #35888330727](https://github.com/Quamolit/quamolit/actions/runs/35888330727) 的 actual 图，按 manifest 核对了 7 张场景、时间和浏览器 153.0.8010.12 后入库；该次失败仅因快照缺失。

更新基线时在相同 Playwright/Chromium/系统版本运行 `yarn compile:visual` 和 `yarn playwright test --config test/m0/playwright.config.mjs --update-snapshots`，人工审查 before、after 和 diff 后提交图片及原因。普通 `yarn test:visual` 设置 `updateSnapshots: none`，不会自动接受新画面。失败的 `test-results/visual/` 包含 actual/expected/diff 和请求及实际 manifest；Actions 自动上传这些文件及 HTML 报告。`QUAMOLIT_VISUAL_MUTATION=color yarn test:visual` 用于负例验证，应以非零退出并产生差异图；不要把变异条件加入正常基线。

云端证据：[正常 PR 运行 #35888862214](https://github.com/Quamolit/quamolit/actions/runs/35888862214) 全部通过；[改色负例 #35888993300](https://github.com/Quamolit/quamolit/actions/runs/35888993300) 只有 `ui-middle` 失败，识别 1155 个差异像素。已下载检查该次失败 artifact，包含实际图、期望图、差异图、请求输入及实际 manifest。

## 性能基准（#39）

先运行 `yarn playwright install chromium`，再从项目根目录执行 `yarn bench --fixture ui-transition --warmup 5 --duration 30 --runs 3`。`yarn bench --help` 列出全部选项。`instances` 场景用 `--count 1000|10000|100000` 指定档位；后端目前仅支持 `canvas2d`，传入 `webgpu` 会明确失败，不会冒充已测试。`--seed`、`--dpr`、`--power`、`--gpu` 和 `--out` 可固定输入与报告目录；无法确认的供电/GPU 应保留 `unknown`。默认输出在忽略的 `test-results/bench/`，每次运行独立创建浏览器 context，生成 `report.json` 与 `run-1.json` 等原始逐帧样本。输出目录由调用者自行选择，请勿让两条并行命令写同一目录。

每次记录页面加载、首帧、约 1 秒空闲 rAF 校准、5 秒预热、30 秒采样。逐帧 `sampleMs` 是参考模型求值耗时，`canvasCallMs` 是调用 Canvas2D 绘制的主线程耗时，`cpuFrameMs` 是两者总和；它们都**不是** GPU 执行或实际呈现延迟。`rafIntervalMs` 仅作为浏览器帧节奏代理；`longIntervalFraction` 用空闲 rAF 间隔中位数的 1.5 倍作为诊断阈值，避免重负载自身重新定义“刷新周期”。它仍不证明显示器物理刷新率或真实掉帧。GPU timestamp、实际上传字节、驱动 draw call、逐帧分配、live 资源与输入到可见帧延迟当前不可测，在报告中明确标为 unavailable。画面正确性由独立的 `yarn test:visual` 检验。

只有同一 fixture、count、seed、DPR、后端、浏览器版本、操作系统架构与供电说明，且双方至少 3 次运行，才能使用 `--baseline <report.json>` 比较。CPU 帧耗时的各次 p95 中位数同时增加超过 10% 和 0.5ms 时，命令以非零退出；这提示人工复测并解释，不能把共享 CI 的吞吐当成硬件性能门禁。CI 只做 0.2/0.6 秒的短时浏览器烟测与报告上传，不能视作正式基线。正式基线和目标记录在 [M0 性能基线](../../docs/performance-m0.md)。
