# 固定 tick 输入日志与有界检查点

`quamolit.replay-archive` 是 #31 的 CPU 回放策略切片，建立在 [`SimulationState<S>`](fixed-step-simulation.md) 的显式 tick、固定 `dt` 与 seed 上。它不把模拟混入任意时间 `sample-at`，也不在绘制时推进逻辑状态。

`start-archive(origin, stride, max-checkpoints)` 要求有效的 tick 0 原点，`stride` 为正整数，`max-checkpoints` 为非负整数。`record-input(archive, input, update-state)` 每次只追加下一个 tick 的输入，返回新档案和新状态；不存在隐式跳 tick 或覆盖旧输入的入口。全部输入按 tick 留在 `inputs`，tick 0 原点永久保留。每隔 `stride` tick 保存一次状态，只保留最近 `max-checkpoints` 个额外检查点，旧检查点按时间淘汰；`max-checkpoints=0` 时仍可从原点重放。

档案泛型为 `ReplayArchive<S,I>`；单独创建空日志时，输入类型 `I` 尚无值可推断，调用方应像可编译夹具一样明确标注目标类型，不用 `Dynamic` 抹掉输入/状态关系。

`sample-archive-at(archive, target-tick, max-steps, update-state)` 选择不晚于目标的最近检查点，再调用固定步长推进。目标必须是已记录的非负整数；预算不足、缺输入或试图采样未来 tick 都报错，不能静默丢步。`quamolit.playback/sample-archive-at-host` 先把宿主暂停/seek 的时间映射为 tick，再使用同一档案。较早的检查点被淘汰后，旧时间依然可从原点和完整输入日志重放，但成本会增大；调用方可以增大单次预算、增加检查点容量，或分批重放。`reset-archive` 保留 `dt`、seed 与策略，清空输入和额外检查点，从原点重新开始。

该策略只限制检查点数量，**不限制输入日志内存**。为保留从 tick 0 任意重放的能力，这个 CPU 参考实现不自动删除日志、持久化到磁盘或异步分段。长时间运行的生产宿主需要在 #50/#51 引入明确的持久化/归档策略及资源预算；不能悄悄丢弃早期输入却仍声称可重放。更新函数还必须对同一状态、输入、`dt`、seed 确定性地返回同一状态，框架无法证明任意闭包没有外部捕获。公开结构体被外部伪造或原地篡改输入日志不在此入口的有效性保证内。

可编译夹具使用 `dt=0.25`、seed 7、输入 `2,4,-2,0,6,-2`，手算 tick 0–6 的状态为 `0,0.5,1.5,1,1,2.5,2`。`stride=2`、容量 2 使最后只保留 tick 4 与 6；采样 tick 2 须从原点走 2 步，预算 1 明确失败。`yarn test:replay-archive` 覆盖严格类型、原生与 JS 结果；`yarn test:motion-browser` 在 [固定 tick 页面](../test/replay-archive.html) 核对从 6 倒退到 0/2 的画面、位置和实色像素。该页面的 Canvas 只是测试画布，不代表生产调度器或 GPU 模拟。
