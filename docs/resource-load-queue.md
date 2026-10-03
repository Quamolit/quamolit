# 多资源加载任务队列：M2 #51 第八切片

`quamolit.resource-load-queue` 是纯 Calcit 的异步资源调度状态机。它只保存逻辑任务、generation、优先级和 token，不保存 Promise、DOM 或 GPU 句柄，因此 texture、font/glyph、geometry、buffer 与 pipeline loader 可以共用同一调度协议。

## 队列合同

- `initial-load-queue` 显式设置并发上限与 pending 上限；pending 满时返回 `backpressured`，不会偷偷丢弃已有请求。
- `enqueue-load` 对相同 device/resource generation 的未取消任务去重；pending 重复请求可提升优先级，但保持原 token 与 FIFO sequence。已取消的 running 任务不再作为去重目标：同身份/generation重入创建新token，仍须等旧槽位结算后才可启动。
- 同一逻辑资源的新版请求会替换旧 pending，并把已经运行的旧任务标记为 cancelled。运行中的 Promise 无法可靠中止，因此 cancelled slot 在结果返回前仍占并发额度，避免逻辑取消后继续无限启动。
- `take-load` 按 `interactive > normal > background` 选择任务；同优先级保持 FIFO。达到并发上限时返回 `none`。
- `cancel-resource-loads` 与 `cancel-stale-device-loads` 删除尚未启动的请求，并标记运行中任务。
- `finish-load` 返回 `accepted`、`discarded` 或 `unknown`。只有 `accepted` 可以进入资源 registry；`discarded` 的宿主结果必须清理，不能安装。

队列的背压是可观察状态，不是性能结论。调用方在任务完成、资源释放或优先级变化后决定何时重试被拒请求。

## Presence 接入

`enqueue-presence-load` 把现有 `PresenceDeviceAction :load` 送入统一队列；其他动作返回 `none`。`run-presence-load-task!` 为 token 绑定两阶段 GPU 结果；`complete-queued-presence-load!` 先结算队列，再把 accepted 结果提交给最新 coordinator。

若 device generation 在 Promise 等待期间变化，任务会被标记 cancelled；迟到的独立 batch 被立即销毁，host 与 registry 均不改变。这样队列取消语义和原有 coordinator generation 检查形成两道独立防线。

## 验证与边界

`yarn test:presence-resources` 覆盖三种资源种类的优先级、FIFO、去重提升、pending 背压、运行中替换、显式取消、device 切换、accepted 安装和 discarded 孤儿清理。`yarn test:folding-fan` 另验证同一队列驱动真实 Canvas 图片解码、失败、尺寸不符、runtime generation 取消和 100 次装卸。`yarn test:webgpu-instances` 再验证 texture 上传、迟到销毁、两代 device 像素读回与 100 次 rebuild。

当前实际 loader 包括 Presence buffer、Canvas `ImageHost`、WebGPU texture，以及[字体任务与共享宿主](scene-ir-core.md#文字基础语义)。字体完成复用同一队列/generation判定；可显式消费单资源结果，也可用`complete-font-registry-load!`接入现有registry的共享、idle与容量驱逐，再由应用提升Scene可用性修订。glyph、geometry与pipeline仍需宿主创建器。已提交 GPU 工作的 fence-safe 释放仍需 `queue.onSubmittedWorkDone` 或等价策略。队列不冒充这些能力已经完成。
