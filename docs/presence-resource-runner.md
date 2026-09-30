# Presence 异步资源任务 runner：M2 #51 第七切片

`quamolit.presence-webgpu-resources` 提供 generation-aware 的两阶段加载任务，解决异步 WebGPU batch 创建期间 Model、资源版本或 device 已变化时的竞态。

## 两阶段协议

1. `presence-load-request` 从完整 `PresenceDeviceAction` 中穷举提取 `PresenceLoadRequest`；install/release/wake/error/device 动作不会误入加载通道。
2. `run-presence-load-request!` 只持有请求中的 device/resource generation 和独立异步结果，不捕获或返回旧 coordinator state。
3. 任务成功返回尚未并入全局 host 的独立 `PresenceGpuHandle`；失败返回规范化错误文本；启动时已过期则返回 `ignored`，不分配 GPU 资源。
4. 事件循环收到结果后，以**当时最新的** `PresenceDeviceState` 和 host 调用 `complete-presence-load!`。
5. 只有最新状态确实产生对应 `install` 动作时，句柄才并入 host；否则 runner 立即 dispose 孤立 batch，并保留当前 host。

任务不返回整个旧 host。这样多个加载任务乱序完成时，不会用较早快照覆盖后来已安装的句柄；device loss 或资源替换期间完成的旧任务也不会让旧 batch 重新出现。

## 失败清理

`load-presence-buffer-safe!` 把创建和上传分开处理：

- pipeline/device 创建失败时返回 `failed`；底层 batch 工厂负责清理部分 buffer。
- batch 已创建但 `upload-source!` 抛错时，先 `dispose!` batch，再返回规范化错误。
- `complete-presence-load!` 把当前 generation 的失败写回 registry，产生 `release / show-error / wake-frame`；旧 generation failure 不覆盖新状态。
- 原有 `load-presence-buffer!` 也改用安全路径，兼容调用方仍收到 rejection，但不再泄漏已创建 batch。

## 验证

`yarn test:presence-resources` 增加三类实际宿主测试：

- 成功任务提交到最新 coordinator 后才安装 batch；
- `queue.writeBuffer` 抛错时两个 GPU buffer 均销毁、context unconfigure、host `live=0`，registry 收到原始错误文本；
- pipeline 等待期间模拟 device loss，随后完成的孤立 handle 被销毁，当前 host 仍为 `live=0`，逻辑状态只产生旧 generation release。

后续的[多资源加载任务队列](resource-load-queue.md)已经接入本 runner：Presence load action 可按 token、优先级和并发额度启动；队列先判定 accepted/discarded，再决定是否把结果提交给 coordinator。取消中的 Promise 仍占用槽位，迟到 batch 会直接销毁。

## 尚未完成

- 通用队列已实现，但实际宿主 loader 仍只有 Presence buffer；尚未形成 texture/font/glyph/geometry/pipeline 的完整执行器集合。
- queue 已提交工作的延迟销毁仍需结合 `onSubmittedWorkDone` 或等价 fence 策略。
- texture、font/glyph、geometry 与 pipeline 仍需各自的类型化 loader 和可恢复描述。
