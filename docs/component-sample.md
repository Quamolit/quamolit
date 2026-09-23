# 声明式组件的直接采样入口

M1 #31 的 `quamolit.component-sample` 把 [组件 API 契约](api-contract.md)接到已验证的直接帧、Scene 标量绑定和宿主时间映射上。组件声明函数接收 `props, model, input, resources, viewport` 五份显式快照，返回 `ComponentDeclaration {scene, motions}`；它不读取墙上时间，也不在绘制时修改 Model。`scene` 是可序列化的 Scene IR，`motions` 是版本化标量 Motion 描述。`sample-component-at` 在任意有限绝对秒数解析绑定并返回 `DirectFrame<SceneDocument>`；`sample-component-at-host` 先映射暂停、速度或 seek 后的宿主时间。两者均不推进固定步长模拟。

`ComponentRequest<P,M,I,R,V>` 携带组件 ID、绝对时间、六类版本和上述五份快照。组件声明可能由 props、Model、输入、资源或视口改变，因此调用方必须为所有实际变化递增相应版本；Motion 内容变化也必须递增 Motion 版本。完整身份、时间和版本相同才允许 `resample-component-at` / `resample-component-at-host` 复用上一帧。未经声明的闭包或全局状态不在缓存合同内；需要读取它们时应显式纳入快照与版本，或使用每次重新求值的入口。

可编译的最小样例在 `quamolit.test.component-fixture/declare-badge`：组件生成一个矩形 Scene 与 `badge-x@1` 的 tween 描述，矩形的 y 来自 props、Model 和输入，颜色来自资源 ready，宽度来自视口。`scene-at` 是浏览器页面使用的实际 Calcit 入口。t=[1,0,0.5,0.25,1] 的 x 分别为 `[120,80,100,90,120]`；t=0.5 固定时 Model 40→41 使 y 从 62→63，资源 false→true 把像素由粉色改成绿色，视口 100→110 使宽度从 10→11。重新加载又回到相同初始画面。

运行 `yarn test:component-sample` 检查全部公共定义的严格类型、原生与 JS 数值/序列化；`yarn test:motion-browser` 检查 Chromium 中间帧、像素和同时间输入变化。[交互页面](../test/component.html)可手动切换时间、Model、资源与视口。编译输出隔离于 `js-out-component/`，避免不同 Calcit 入口覆盖同名导出。

当前实现是逐次声明和全量 Scene 绑定解析的 CPU **正确性参考**，不是保留式执行计划；它没有把大型组件树的静态结构每帧复用，也没有自动处理实例源或资源生命周期。这些属于 #32/#50/#51。历史状态仍走独立的 [固定步长模拟](fixed-step-simulation.md)，不能藏进组件声明或 paint。生产迁移与长期输入日志/检查点策略尚未完成，不能据此关闭 #31 或 M1。

旧 `comp-fade-in-out` 已有[进入/退出透明度的可编译迁移夹具](fade-migration.md)，展示过渡意图留在 Model、Scene opacity 引用 Motion 的具体用法；它尚未替代旧应用入口或实现保留执行计划。
