# M1 #49：Scene 逻辑实例的进入、退出与重入

`quamolit.presence` 用 [Scene diff](scene-diff.md) 的父路径/key/类型作为逻辑身份。`start-presence` 从有效 Scene 建立 `present` 模型；`reconcile-presence(model, document, time, duration, easing)` 接受按事件时间非降序的声明更新，返回新的纯 `PresenceModel`。同 key 重排只改绘制顺序，不重启 alpha；换父或换类型形成旧实例退出与新实例进入。同父重复 key 由 Scene 校验拒绝。

新实例 `enter` 从 alpha 0 渐变到 1。删除后实例进入 `exit`，保留旧 Scene 数据，在渐变期间不再可交互；重复提交删除不会重启退出。若相同逻辑路径在退出完成前重入，取消退出并从当下 alpha 连续渐变回 1，沿用原实例，不发释放通知。退出完成后再重入则先释放旧实例，再创建新实例。父级卸载时后代也退出；`settle-presence` 在终点移除它们，释放通知按子先父后返回。绘制只调用 `sample-presence(model,time)`，不改变 Model。

`PresenceUpdate.released` 是**逻辑释放通知**，携带旧 `SceneEntry`（包括资源 ID/version）。同一模型结算两次，只有第一次返回通知；若从头重放完整事件日志，会重新得到相同逻辑通知，不能把离线重放结果直接当作新的宿主副作用。`presence-needs-frame?` 在 enter/exit 进行中及终点尚待结算时为 true，调用 `settle-presence` 后变为 false。调用方应在终点安排一次结算帧。

新增的 [宿主实例资源跟踪](presence-resources.md) 仅在一个专属 `InstanceSourceRegistry` 上同步**实际提交**的 `PresenceModel`：退出中的 item 仍持有引用，结算移除后最后一个引用才调用 registry `release`；重复同步不会再次释放。离线截图重放应创建隔离的资源上下文，不能把回放模型同步到真实宿主。这个薄适配不销毁 GPU buffer，也不负责指针捕获；#51 的通用资源表及 #34 的捕获释放仍须独立验收。

这是 O(n²) 路径匹配加 Scene 校验的 CPU 正确性参考，不是 #50 的保留执行计划。当前 alpha 是逐逻辑节点的局部参数；浏览器夹具只对固定 group 下的两个矩形做 fade，不能宣称已实现一般嵌套组的隔离透明合成。退出项在新声明之后按旧顺序绘制，属于当前覆盖层策略；更复杂的层叠、裁剪及命中由 #33/#34/#53 统一验收。

[旧 fade 迁移夹具](fade-migration.md)负责展示描述符与 Scene opacity 的直接时间采样；本模块负责逻辑 enter/exit、终点卸载通知与重入。两者尚未在生产执行计划中合并，不能把单子节点 Canvas 淡入淡出当作一般组隔离或宿主资源释放。

`yarn test:presence` 覆盖重排、同 key 重入、换类型、父级卸载顺序、退出禁交互、终点停帧、重复结算、非法 key，以及 100 次 10k 实例逻辑图层装卸后的模型计数和通知数。`yarn test:presence-resources` 进一步检查 100 次真实 Float32 快照登记/释放后的宿主计数回到零。`yarn test:motion-browser` 在 [独立页面](../test/presence.html) 验证 fade、重叠层序、退出/重入的任意时间画面与像素，并在 [资源页面](../test/presence-resources.html) 验证退出中间帧与终点释放。架构约束见 [presence-lifecycle.cirru](architectures/presence-lifecycle.cirru)。指针捕获清理与真实 GPU 资源仍需 #34/#51 的实际实现；不能把本切片当作它们的验收。
