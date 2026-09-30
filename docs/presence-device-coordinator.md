# Presence device 组合状态机：M2 #51 第六切片

`quamolit.presence-device-coordinator` 把 `quamolit.device-recovery` 与 `quamolit.presence-resource-registry` 合并成一个纯 Calcit 公共状态机。调用方不再自行决定“何时 rebuild registry”：只有新的 device generation 成功进入 `ready` 后，组合状态机才在同一个 transition 中先输出 device `install`，再输出资源 `release/load`。

## 状态与动作

`PresenceDeviceState` 同时保存可序列化的 `RecoveryState` 与 `PresenceResources`；不保存 adapter、device、Canvas 或 GPU buffer。`PresenceDeviceAction` 有两类：

- `:device RecoveryAction`：探测、创建、安装、释放及回退诊断。
- `:resource device-generation RegistryAction`：每个资源动作显式携带所属 device generation，避免旧设备完成操作第二代宿主资源。

`sync-presence` 始终更新 Model 对应的 plan/registry。设备尚未 ready 时，逻辑 lease 和版本照常推进，但 GPU 动作被延迟；device 安装成功时统一调用 `rebuild-presence-resources`，清理 idle entry，并为仍有 lease 的资源创建新的单调 resource generation。

恢复顺序为：

```text
device lost
  → release old device/host
  → Canvas fallback + probe/create next device generation
  → install next device
  → rebuild active Presence resources
  → load → resource-ready/resource-failed
  → install resource + wake frame
```

`resource-ready` / `resource-failed` 同时接收 device generation 与 resource generation。只有当前 ready device 可以改变 registry；旧 device 的 ready 只产生带旧 device generation 的幂等 release，旧 failure 不覆盖新 loading 状态。[异步资源任务 runner](presence-resource-runner.md)把 Promise 结果提交给最新 state，避免旧闭包覆盖恢复期间的新状态。

## WebGPU 执行边界

`quamolit.presence-webgpu-resources/execute-presence-device-action!` 消费组合动作：匹配当前 device generation 的资源动作进入实际 `RectBatchHost`；旧 generation 动作保持宿主不变；device `release` 自动关闭该 generation 的全部 Presence batch。device 的 probe/create/install 与原生 device 所有权仍由外层 capability/recovery host 执行。

关闭时先释放 registry 中的实际 batch，再释放 device。该顺序可验证且保持幂等；逻辑状态和宿主句柄仍完全分离。

## 验证

`yarn test:presence-resources` 覆盖：

- device ready 前只推进声明式资源状态，不提前创建 GPU buffer；
- 首次 device 安装后自动重建 deferred lease；
- device loss 保留同一 Model/source identity/version；
- 第二代 device 安装后使用新的 resource generation；
- 旧 device ready/failure 不改变第二代 registry，旧动作不能释放第二代 batch；
- 组合动作执行器实际创建两代 `RectBatchHost`，device release 销毁旧 buffer，最终 `created=2 / released=2 / live=0`。

## 尚未完成

- 浏览器宿主仍需把 `device.lost` Promise、probe/create 的原生结果提交给组合状态机；本模块统一决策，但不持有原生对象。
- 跨资源类型的统一任务队列、取消、优先级与背压尚未实现；当前 runner 覆盖矩形 instances load。
- texture、font/glyph、geometry、pipeline 及 queue 完成后的安全延迟释放仍未接入。
