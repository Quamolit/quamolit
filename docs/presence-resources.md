# Presence 宿主实例资源跟踪

引用计数与释放决策由 Calcit `quamolit.presence/instance-resource-plan` 计算：输入 `PresenceModel` 与上一次的 `InstanceResourcePlan`，输出新的 `references`、`release`、`live-references` 与 `live-sources`。测试夹具用的 `test/host/presence-resources.mjs` 只是薄宿主适配：持有 `InstanceSourceRegistry`、独占所有权、按计划先校验所有新引用再释放；它不再实现统计逻辑，输入为 Calcit `PresenceModel`（不是 `toJsData` 结果）。每次提交新的正向生命周期状态时调用 `sync(model)`；`exit` item 仍在 Model 中，因此资源仍存活；终点 `settle-presence` 移除 item 后，最后一个引用消失才释放该快照。重复 `sync` 无副作用；`clear()` 用于整个宿主场景销毁。

一个 tracker 独占一个 registry，调用方不得在 tracker 外释放它持有的源，也不得把离线/乱序截图重放结果同步到真实宿主。截图重放须创建隔离的 registry 与 tracker。源数据已经在登记时复制，真实 GPU buffer、图片、字体、异步就绪和 device loss 仍由 #51 的通用资源表处理。本适配仅覆盖 `SceneContent :instances` 的 Float32 坐标快照。

`PresenceUpdate.released` 提供逻辑 SceneEntry，交互层 #34 后续应按逻辑路径/target 在卸载时撤销指针捕获。退出中的 `PresenceSample.interactive=false` 已由 CPU 参考模型定义；当前 tracker 不接管 DOM Pointer Events，也不声称已验证指针捕获。

验证：`yarn test:presence-resources` 使用严格类型的 Calcit fixture，重复 100 次 10k 实例挂载/退出，确认每次结算仅释放一次、模型/宿主 live 数回到基线；另测退出重入、未登记源失败不破坏旧资源、共享源最后引用才释放。`yarn test:motion-browser` 以固定事件日志重放 0/0.25/0.5/0.75/0.875/1 秒，检查退出中间帧像素、资源存活及终点白像素/停帧。Canvas 仅作正确性参考，不是性能数据。

WebGPU 时间帧对照与可重建的归档缓存见 [Presence WebGPU 时间帧](webgpu-presence-time.md)。归档缓存不计入实时 Presence `live`，不能据此延后逻辑资源释放。
