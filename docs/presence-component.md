# Presence 接入统一组件执行计划

推进 #49/#50，为 #36 TodoList 提供生命周期基础。全部新增运行逻辑在 Calcit；没有新 JS 宿主模块或平行执行器。

`quamolit.presence-component/declare-flat(model, descriptors)` 返回普通 `ComponentDeclaration`，可直接放入 `ExecutionDeclaration.component`。变换仍用已有 `TransformSampler`，构建、更新、采样和绘制仍用 `quamolit.retained-component`。

调用顺序：事件发生时 `reconcile-presence` 更新应用 Model；组件重新声明时调用 `declare-flat`；仅时间变化用 `sample-plan-at`；动画终点由应用显式 `settle-presence`，消费释放通知，再更新 Model 版本并重建计划。绘制和乱序采样不做结算，不修改 Model。`presence-needs-frame?` 在未结算终点仍为 true；结算后才能停帧。该信号不等于已经接好宿主调度器。

## declare-flat 的支持范围与责任

- 仅顶层矩形、折线及基础文字叶节点。原色 alpha 乘 Presence alpha，编译为 ScalarTween；底层 `ScalarTarget :alpha` 本身是替换语义。present 项不创建生命周期绑定，避免静态节点逐帧重写。
- 保留项顺序沿用 Presence：当前声明在前，退出项随后。退出项仍绘制，interaction 置 none；重入恢复原事件目标。
- 渲染 ID/key 使用 `presence/<content-kind>/<原 key>`，同 key 换类型时新旧节点可共存。原始逻辑 ID/path 仍保留在 PresenceModel 和释放通知中；调用者不能把渲染 ID 当作原始业务 ID。
- 原有非 alpha 绑定保留。调用者传入它们所需的描述符，退出期间也必须保留这些描述符。生成的生命周期描述符固定 version=0；Model/过渡变化必须递增 ComponentRequest 的 model（或对应依赖）版本，不能只依赖时间或描述符版本。
- 拒绝已有 alpha 绑定、重复描述符 ID/version、group/instances 和非顶层节点，不静默降级。不支持把多个独立模型直接拼入同一个 Scene；需要先形成统一逻辑 Model。
- 这不是嵌套组隔离透明度，也不实现真实资源释放或指针捕获。[TodoList](todolist-restoration.md)已消费此连接，提供行级 Model、文字、错峰/重排、输入日志及全屏操作页面。

## 嵌套声明与实际看板

`declare-tree(model, descriptors, fade-ids)` 同样返回普通 `ComponentDeclaration`，但保留逻辑父路径，并支持 group 的 `opacity` 生命周期绑定。`fade-ids` 是原始 Scene 节点 ID 列表，显式指定哪些节点承担淡化：整组出入只选择父 group，后代保留原始 alpha；选择父子两项意味着有意叠加两项局部动画，不自动猜测或去重。未选择的节点仍遵守逻辑进入/退出/结算，但不新增淡化绑定。静态后代可包含其他合法 Scene 图元；淡化目标当前限 group/rect/polyline/text，已有对应 alpha/opacity 绑定会明确报错。

`declare-tree-coalesced(model, descriptors, fade-ids)` 是显式选择的组合入口，旧 `declare-tree` 的有意叠加合同不变。选择父子作为潜在动画所有者时，若选中的严格祖先具有**完全相同的 phase 和 ScalarTween（from/to/start/duration/easing）**，后代不再增加该次生命周期绑定，整组移除只合成一次。只比较完整逻辑路径，不按物理 ID 或当前采样值判断；同值但不同开始时间/目标/阶段不会被合并。子节点原始颜色/组透明度、非生命周期绑定仍保留；既有 alpha/opacity 绑定冲突继续拒绝。不同路径的兄弟不会互相消掉淡化，Model/Scene 数据不被修改。

已有独立子动画与随后发生的父动画继续相乘：子图表 t=1 开始退出、父级 t=1.3 才退出时，子图表仍在自己的 t=1.6 完成，不因父级删除重新计时。只在组件声明时决定所有权；时间采样不重新猜测。此入口是保留相同意图的组合策略，不是“所有父子透明度只能相乘一次”的普遍规则，也不证明GPU/性能。

渲染 ID/key 按完整逻辑 path 的 kind/key 长度编码，不使用物理节点 ID；父引用也由父路径生成。同 key 换父/换类型的新旧节点可共存，不与 `declare-flat` 的历史 ID 混用。声明将退出项归回各自父组，保持合法前序树、裁剪和组内层序；不能沿用平面模型的全局尾部退出排列，导致旧子项跑出父组。重复渲染 ID、缺父或不连通路径明确拒绝。所有退出节点使用 `SceneInteraction :disabled`，阻止子树内目标及祖先目标后备；资源释放仍等显式结算。时间采样不结算，也不改变 Model。

嵌套声明可通过普通计划采样 Scene；绘制需使用支持组隔离的 `canvas-scene/draw-document!`，不能把既有平面 `draw-plan!` 参考入口当作嵌套 renderer。`fade-ids` 应属于应用声明配置，不随时间逐帧猜测；非淡化节点如果单独出入，应用须为其明确选择额外的淡化目标或其他动画，否则只是保留到结算。

Layered Signals 的 `presence-scene-at` 使用组合入口，选 `dashboard/chart`：整个看板删除的相同意图只由dashboard淡化，图表独立删除则由chart淡化。页面显隐、重放与真实指针接线见[看板说明](layered-dashboard.md#显隐生命周期与捕获)。既有 `test:layered-dashboard` 保留原28节点整帧像素/0.55隔离组/重入/释放/换父回归，新增图表19↔28节点的100次往返、父子独立日志增量/乱序/历史分支、旧入口有意双乘与新入口合并、DPR1/2子组件退出+resize立即释放捕获、重入当帧全Canvas像素不变。没有新demo、renderer或测试命令。

这不证明资源租约、GPU组语义、所有换类型/病态路径组合或完整#34已验收。实现是CPU正确性路径，节点归序/ID核对可有二次复杂度，不声称指针全路由扫描或时间帧分配已优化；旧叶节点的1000帧保留计数也不能外推到这个应用。

既有独立消费者的 `nested-presence-at` 由Calcit代码直接调用公共 `declare-tree`，使用自己的5节点图表、显式panel淡化目标和公共绑定解析；`test:consumer` 在候选干净安装/编译/产物搬移后检查乱序alpha、子组0.5透明度、退出禁用和ID唯一性。不需要下游导入框架内部JS或本仓库demo。

## 既有叶节点验证

`yarn test:retained-component` 已包含严格类型、原生连续性、Node 的 1000 帧几何共享、25/50/75% 重入连续性、100 次装卸及终点释放一次；Chromium 在 t=0/0.25/0.5/0.75/1/0.5 对照独立原生 Canvas 全部像素，并保存各时刻图片附件。该夹具不计为恢复后的 TodoList demo。

计划、输入和时间可在内存中重放；离线回放的逻辑释放通知不得重复发送到真实宿主资源表。资源验收由 #51 承接，交互索引与捕获由 #34 承接。未测 GPU，未给出 FPS 或性能加速结论。
