# Presence WebGPU 资源宿主：M2 #51 第五切片

`quamolit.presence-webgpu-resources` 是 Calcit 实现的 Quamolit 专用宿主层。它消费 `quamolit.presence-resource-registry` 返回的 `RegistryAction`，直接复用类型化的 `quamolit.webgpu-batches` 与 `quamolit.instance-gpu`，不在 JavaScript 里重新实现 load/install/release、generation 或 device rebuild 判断。

## 所有权

- `PresenceGpuHandle` 绑定完整 buffer identity、资源 generation、device generation、可重建 `InstanceSource` 与一个真实 `RectBatchHost`。
- `load` 从 `InstanceResourceRef` 解析源，预检实例表后创建 batch，并按 `(id,version)` 全量上传当前 Float32 xy 数据。
- `install` 只把相同 identity/generation 的 handle 标为可绘制；未安装句柄不能通过 `draw-presence-buffer!` 取用。
- `release` 幂等销毁相同 identity/generation 的 batch；旧 generation 的迟到 release 不会碰到新句柄。
- `close-presence-gpu-host!` 释放剩余句柄。`PresenceGpuMetrics` 记录 created、released、live、live bytes 与累计上传字节。

外部 device 仍由 `quamolit.device-recovery` 的宿主执行器持有；本模块只释放 batch，不销毁 device。[Presence device 组合状态机](presence-device-coordinator.md) 已统一新 device `install` 与 registry rebuild 的顺序：新资源 generation 单调增加，仍有 lease 的实例源在新设备上重建，idle cache 不会无意义复活。

## Device rebuild

`rebuild-registry` 对每个 entry 执行以下规则：

1. 零引用 idle entry 关闭并从 registry 删除，只输出旧 handle 的 release。
2. 仍有引用的 entry 先关闭旧 generation，再以相同 logical identity 请求新 generation，顺序输出 release/load。
3. Presence plan、Model、源 ID/version 与引用数保持不变；新宿主按当前实例表重新上传。
4. 旧 device 的迟到 ready/failed 只输出旧 generation 的幂等 release。

generation 不重置。例如 ready generation 1 经一次 rebuild 后重新 load generation 3；generation 2 是关闭屏障，可避免旧 device 结果和新 device 句柄碰撞。

## 验证

`yarn test:presence-resources` 使用原生 device/canvas 替身实际执行 Quamolit WebGPU batch 的 pipeline、buffer、80 kB 上传、draw、dispose 与 context unconfigure。单次恢复验证旧两个 GPU buffer 均销毁、新 batch 唯一存活；100 次 device rebuild 始终 `live=1`，最后 close 为 `created=101 / released=101 / live=0 / liveBytes=0`，累计上传 8,080,000 B。组合状态机专项另验证两代 device 的动作顺序、延迟 lease、旧设备 ready/failure 隔离及 generation-aware executor；[异步任务 runner](presence-resource-runner.md)验证上传异常和 device loss 竞态不会泄漏或复活孤立 batch。

`yarn test:webgpu-instances` 新增非软件 adapter 专项：真实创建两个 device，销毁第一代后用同一 Presence Model/source 在第二代重建，恢复前后像素均为 `[234,88,12,255]`，最后资源计数回零。没有 adapter 或只有软件 adapter 时明确 SKIP；这不算硬件通过。

## 尚未完成

- 当前只连接 `SceneContent :instances` 的矩形 buffer/batch；texture、font/glyph、geometry 与 pipeline 的共享宿主仍待接入。
- 真实 device loss Promise 的原生监听仍由宿主提交给组合状态机；矩形实例已有两阶段异步 runner，但跨资源类型的统一调度/取消尚未实现。
- release 在 batch dispose 时立即执行；GPU queue 完成后的延迟回收策略、跨硬件恢复时延和多图层共享 device 尚未完成。
