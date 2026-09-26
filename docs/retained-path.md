# 保留折线动画：静态 Scene + 时间变换

后续统一：Binary Tree 默认播放已切到 `retained-component/build-execution-plan`、`sample-plan-at`、`update-execution-plan` 和 `draw-plan!`，与标量组件使用同一个 ComponentPlan。下文 PathPlan 是早期兼容/参考 API；不再作为独立主线扩展，详见 [统一组件入口](retained-component.md)。

推进 #50/#33/#53。`quamolit.retained-path` 是 Calcit 的 CPU 自定义几何动画执行路径，不新增 JS renderer。首个实际消费者为 Binary Tree，页面默认使用此路径，可切换全量参考并改变深度。

## 公共接口

- `build-plan(document, props, time, sample)`：检查静态 Scene，调用一次 `sample(props, time)`，返回泛型 `PathPlan<P>`。仅接受顶层、无标量绑定的 polyline。Scene 保持纯数据，CPU 采样闭包仅保存在运行计划。
- `sample-plan-at(plan, time)`：共享原 Scene、节点、局部点列表及 props，只更新每节点的 `Matrix2D`。相同时间跳过采样；时间允许有限负值与乱序。变换数量必须等于节点数，所有分量必须有限。
- `draw-plan!(context, plan)`：按 Scene 顺序，将变换复合到调用者当前 Canvas 坐标系后描边；视口/DPR/清屏由调用者负责。不修改动画状态。

采样器需为确定性的纯函数。props、采样器或 Scene 任一改变，调用者必须显式重新 `build-plan`，即使时间相同。不要修改计划字段来绕过构造器验证。计划不可变，失败的采样不改变旧计划；宿主绘制异常不保证 Canvas 状态自动恢复。这里只支持仿射变换的开放圆头/圆连接折线，不包括组裁剪、隔离透明度、路径形变或任意 GPU 闭包编译。

## 摆动树的实现

`quamolit.examples.binary-tree/build-plan(time, depth)` 一次建立父索引拓扑、稳定 ID 和局部三点折线。全部节点共享同一个局部 PolylineNode；世界位置、角度和尺度通过父索引顺序求值。每帧只求两种全局摆动频率，然后生成各分支姿态与矩阵，不再生成世界坐标点、节点 ID 和 SceneNode。

这保留的是 Scene、拓扑与局部几何，不是“缓存最终帧”。每帧仍分配姿态和矩阵记录，Canvas 仍逐路径提交三点和描边，不是缓存 Path2D 或合批。默认深度 5 是 63 次 stroke；深度 3/7 是 15/255 次。没有 FPS 或 GPU 提速结论。

## 检验与展示

运行 `yarn test:binary-tree` 和 `yarn test:demo-nav`。从原有动画导航打开 Binary Tree：

1. 默认“保留几何”；播放或拖动时间时结构构建次数保持 1。
2. 暂停在 2.5 秒，切换“全量参考”，对照原来的构图。
3. 同一时间将深度改为 3 或 7，立即重建对应拓扑；时间不推进。
4. 改变窗口大小或 DPR，复用现有计划，只重绘。

Node 运行 1000 个交替正负的绝对时间；逐帧核对 63 条路径的全部点、宽度和 ID，保留 Scene 与 props 的对象身份，并用包装采样器核对实际调用次数。基准是原 `scene-at` 全量树，后者另有历史矩阵 oracle。重复时间不调用采样器；非法时间/变换长度不污染旧计划。

浏览器保留历史独立矩阵画面对照与原 alpha 阈值；局部仿射描边在极少重叠像素上的 RGB 量化例外按 [#113](https://github.com/Quamolit/quamolit/issues/113) 限定为最大 2/255，超过 1/255 的像素占比不超过 0.1%（至少允许 1 个）。新增全量/保留切换和同时间深度失效测试，保存新参考/差异截图到 demo-nav artifact，不以本机临时地址作为唯一证据。

## 后续优先级

按探索性项目策略，先交付可用链路，不在本 PR 细化所有内部优化。当前与 `retained-component` 的标量槽位计划分开，后续由 #50 统一组件入口、版本失效与混合节点；#40/#52 承接标准变换的 GPU 表达及批量提交。重复几何校验、每帧姿态/矩阵分配、Path2D 缓存与阶段耗时留待实测后优化。不得用本例计数外推完整应用性能，也不据此关闭 M2。
