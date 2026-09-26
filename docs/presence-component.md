# Presence 接入统一组件执行计划

推进 #49/#50，为 #36 TodoList 提供生命周期基础。全部新增运行逻辑在 Calcit；没有新 JS 宿主模块或平行执行器。

`quamolit.presence-component/declare-flat(model, descriptors)` 返回普通 `ComponentDeclaration`，可直接放入 `ExecutionDeclaration.component`。变换仍用已有 `TransformSampler`，构建、更新、采样和绘制仍用 `quamolit.retained-component`。

调用顺序：事件发生时 `reconcile-presence` 更新应用 Model；组件重新声明时调用 `declare-flat`；仅时间变化用 `sample-plan-at`；动画终点由应用显式 `settle-presence`，消费释放通知，再更新 Model 版本并重建计划。绘制和乱序采样不做结算，不修改 Model。`presence-needs-frame?` 在未结算终点仍为 true；结算后才能停帧。该信号不等于已经接好宿主调度器。

## 支持范围与责任

- 仅顶层矩形与折线叶节点。原色 alpha 乘 Presence alpha，编译为 ScalarTween；底层 `ScalarTarget :alpha` 本身是替换语义。
- 保留项顺序沿用 Presence：当前声明在前，退出项随后。退出项仍绘制，interaction 置 none；重入恢复原事件目标。
- 渲染 ID/key 使用 `presence/<content-kind>/<原 key>`，同 key 换类型时新旧节点可共存。原始逻辑 ID/path 仍保留在 PresenceModel 和释放通知中；调用者不能把渲染 ID 当作原始业务 ID。
- 原有非 alpha 绑定保留。调用者传入它们所需的描述符，退出期间也必须保留这些描述符。生成的生命周期描述符固定 version=0；Model/过渡变化必须递增 ComponentRequest 的 model（或对应依赖）版本，不能只依赖时间或描述符版本。
- 拒绝已有 alpha 绑定、重复描述符 ID/version、group/instances 和非顶层节点，不静默降级。不支持把多个独立模型直接拼入同一个 Scene；需要先形成统一逻辑 Model。
- 这不是嵌套组隔离透明度，也不实现文字、真实资源释放或指针捕获。TodoList 的行级 Model、文字、错峰/重排、输入日志、全屏操作页面还未完成。

## 可复现验证

`yarn test:retained-component` 已包含严格类型、原生连续性、Node 的 1000 帧几何共享、25/50/75% 重入连续性、100 次装卸及终点释放一次；Chromium 在 t=0/0.25/0.5/0.75/1/0.5 对照独立原生 Canvas 全部像素，并保存各时刻图片附件。该夹具不计为恢复后的 TodoList demo。

计划、输入和时间可在内存中重放；离线回放的逻辑释放通知不得重复发送到真实宿主资源表。资源验收由 #51 承接，交互索引与捕获由 #34 承接。未测 GPU，未给出 FPS 或性能加速结论。
