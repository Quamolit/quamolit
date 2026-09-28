# 图表 UI 动画作品验收矩阵

本文收口 #146 的作品级证据。三个作品共享 `quamolit.ui-motion` 的纯 Calcit 采样语法，但保持不同的业务 Model、布局和视觉结构；它们不是同一布局的换色版本。

## 可打开入口与固定帧

启动 `yarn demo` 后，从统一页面的“艺术作品”分类进入：

| 作品         | 视觉结构                                                 | 初始／中间／终点入口                          | 真实切换与生命周期                                         |
| ------------ | -------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------- |
| Metric Flow  | KPI、队列、活动图、12 根趋势柱和渠道分项组成的复杂双面板 | `?demo=tidal-bloom&t=0` / `1.4` / `3.7` / `7` | 概览／分析视图和访客／营收系列可中途反向；旧面板退场后删除 |
| Signal Weave | 折线、面积、常态对照线、指标与洞察卡片                   | `?demo=signal-weave&t=0` / `0.45` / `1.2`     | 情境切换从当前采样值反向，稳定 12 个数据点身份             |
| Cohort Pulse | 六行留存列表、42 个热力单元、风险筛选和详情面板          | `?demo=cohort-pulse&t=0` / `0.45` / `0.9`     | 筛选时安全行退出、风险行重排，摘要／详情独立交叉渐变       |

完整 URL 形如 `http://127.0.0.1:5191/demos/index.html?demo=cohort-pulse&t=0.45`。页面始终只有一个全屏 Canvas；DOM 只承载可收起导航和控制浮层。

## 自动化证据

| 门禁                     | 覆盖                                                                         | CI artifact                      |
| ------------------------ | ---------------------------------------------------------------------------- | -------------------------------- |
| `yarn test:tidal-bloom`  | 初始/中间/终点、双重中断、数据系列、DPR 2 窄屏、reduced-motion、停帧         | `quamolit-tidal-bloom-<run-id>`  |
| `yarn test:signal-weave` | 路径逐段增长、情境反向、分享位置、DPR 2 窄屏、reduced-motion、停帧           | `quamolit-signal-weave-<run-id>` |
| `yarn test:cohort-pulse` | 错峰热力图、筛选反向、行卸载和重排、独立详情面板、DPR 2 窄屏、reduced-motion | `quamolit-cohort-pulse-<run-id>` |
| `yarn test:ui-motion`    | 公共 tween、stagger、数值渐变、交叉淡化与卸载端点的严格类型和手算值          | Actions 日志                     |
| `yarn test:demo-nav`     | 三作品统一页面往返、同一 Canvas 身份、旧全局 API 卸载和入口截图              | `quamolit-demos-<run-id>`        |

每个作品的 Playwright artifact 都保存初始、中间、终点或交互中间帧；窄屏截图在 DPR 2、390×844 viewport 下生成。`prefers-reduced-motion: reduce` 由浏览器上下文控制：页面保持静止，用户操作仍可触发确定性状态变化。

## Calcit、Canvas 与 WebGPU 边界

- 业务 Model、固定事件日志、节点身份、几何、颜色和动画采样均在 Calcit；宿主 JavaScript 只处理 URL、时钟、Canvas/DOM 生命周期与输入转发。
- `quamolit.ui-motion` 不保存墙上时间或 Canvas/GPU 句柄；相同显式输入可乱序重放。
- 当前作品以 Canvas2D 参考后端验收。没有证据表明文字、折线或复杂面板已经走 WebGPU，也不以软件 adapter 或回退画面冒充 GPU 验收。
- Scene 终点删除和统一页面卸载已有证据；真实 GPU buffer、纹理与设备丢失恢复仍归 #51/#40，不能由本作品矩阵外推。

## 下一阶段入口

#146 收口后，作品库继续允许增加新的图表动效，但 M3 主线转向 #136：对照历史基准逐项完成 Icons、Finder、Curve/Solar 和 Folding Fan 的中间帧保真；其次由 #53/#34 补齐绘制与交互语义。
