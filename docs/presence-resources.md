# Presence 宿主实例资源跟踪

引用计数与释放决策由 Calcit `quamolit.presence/instance-resource-plan` 计算：输入 `PresenceModel` 与上一次的 `InstanceResourcePlan`，输出新的 `references`、`release`、`live-references` 与 `live-sources`。每次提交新的正向生命周期状态时同步一次；`exit` item 仍在 Model 中，因此资源仍存活；终点 `settle-presence` 移除 item 后，最后一个引用消失才释放所有权。

## 通用资源注册表连接

`quamolit.presence-resource-registry` 是纯 Calcit 连接层，把上述计划接到 `quamolit.resource-lifecycle/ResourceRegistry`：

- `initial-presence-resources(capacity-bytes)` 建立一个 Presence 所有者与有界资源表。
- `sync-presence-resources(state, model)` 先释放本帧消失的唯一实例源 lease，再获取新源；同一源被多个 Scene item 引用时也只占一个 registry lease。
- 实例源映射为 `ResourceKind :buffer`，身份包含 `id/count/version`，逻辑字节数按 `count * 2 * 4` 估算 Float32 xy 数据。
- `ready-presence-resource` / `fail-presence-resource` 接收宿主异步结果；`close-presence-resources` 清空计划并关闭全部常驻资源。

同步返回的 `RegistryAction` 已带完整资源身份。宿主只负责按动作创建、安装或释放真实句柄；不能用 generation 单独作为全局键。退出终点仅把最后 lease 变为 idle，不立即销毁：相同资源重入可以复用 loading/ready 状态；容量压力按 LRU 淘汰 idle，显式 close 则全部释放。换版本时先在纯数据状态里释放旧 lease，再尝试获取新资源；函数失败不会产生宿主副作用，调用者继续保留旧 state。

## 旧测试宿主边界

`test/host/presence-resources.mjs` 仍是验证 CPU Float32 快照的薄宿主适配：持有 `InstanceSourceRegistry`、独占所有权、按计划先校验所有新引用再立即释放。它不实现通用缓存，输入为 Calcit `PresenceModel`（不是 `toJsData` 结果）。重复 `sync` 无副作用；`clear()` 用于整个测试场景销毁。

一个所有者独占一个 registry，调用方不得在所有者外释放它持有的源，也不得把离线/乱序截图重放结果同步到真实宿主。截图重放须创建隔离的 state。源数据已经在登记时复制；当前连接只生成 buffer 生命周期动作，尚未让真实 WebGPU buffer 执行动作，也未覆盖图片、字体或 device loss 重建。

`PresenceUpdate.released` 提供逻辑 SceneEntry，交互层 #34 后续应按逻辑路径/target 在卸载时撤销指针捕获。退出中的 `PresenceSample.interactive=false` 已由 CPU 参考模型定义；当前 tracker 不接管 DOM Pointer Events，也不声称已验证指针捕获。

验证：`yarn test:presence-resources` 严格检查 Presence、连接层与通用 registry，并使用真实 Calcit Presence fixture 重复 100 次 10k 实例挂载/退出。单个 80 kB 容量下应为 `loads=100`、`evictions=99`，每轮结算保持一个 idle buffer，最终 close 发出第 100 次 release 并让 resident/leased/bytes 回零；另测退出完成前重入、idle 缓存重入、容量换版本和旧测试宿主合同。`yarn test:consumer` 继续验证干净安装与公共实例资源表；`yarn test:motion-browser` 检查退出中间帧像素与终点停帧。Canvas 仅作正确性参考，不是性能数据。

WebGPU 时间帧对照与可重建的归档缓存见 [Presence WebGPU 时间帧](webgpu-presence-time.md)。归档缓存不计入实时 Presence `live`，不能据此延后逻辑资源释放。
