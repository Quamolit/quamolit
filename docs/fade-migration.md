# 旧 fade 组件迁移：显式 Model、Motion 与 Scene

此可编译迁移示例对应 M1 #48/#49。旧 `quamolit.comp.fade-in-out/comp-fade-in-out` 在 `on-tick` 中用 `v=4` 按 elapsed 积分 opacity，以 `:hidden/:showing/:show/:hiding` 阶段及节点缓存决定展示；它在隐藏后留 `0.01` opacity 并在绘制中读取缓存。新示例 `quamolit.test.fade-migration-fixture` 不沿用这些隐式状态：`FadeModel` 保存有 key 的 `TransitionIntent`、描述修订号及阶段，组件声明生成一个 group、一个矩形与 group opacity 的 `ScalarDescriptor` 引用，`sample-component-at` 按绝对秒数直接解析 Scene。绘制只消费结果。

在旧速度 `4/s` 下，完整的 0→1 或 1→0 线性变化需要 `1/4=0.25s`。示例的进入意图为 `{from:0,to:1,start:0,duration:0.25,easing:linear}`：t=0/0.0625/0.125/0.25 的 alpha 分别为 0/0.25/0.5/1。退出从 t=0.5 的当前值 1 建立到 0 的 0.25 秒意图；t=0.5/0.5625/0.625/0.75 的 alpha 为 1/0.75/0.5/0。若在进入途中 t=0.125 打断，先采样旧值 0.5 作为新 `from`，于是该点无跳变，t=0.25 为 0.25，t=0.375 为 0。时间可以乱序查询，不回放 `on-tick` 积分。

`fade-alpha@1` / `fade-alpha@2` 的 ID/version 同时用于 Scene 绑定与受限 GPU 候选计划；后者 `:supported tween` 仅证明描述落在数据子集，**不是 WGSL 执行或性能结果**。Canvas 页面只画 group 下的**一个**矩形，所以 `globalAlpha` 能验证该夹具的中间帧；多个重叠子节点的隔离组透明度仍须由 #53 的后端实现。内区像素按白底黑形与 alpha 的 8-bit 合成参考值检查，逐 RGB 通道容差为 ±1、alpha 精确为 255；该容差在测试运行前声明，不对边缘放宽。

旧组件的退出缓存与 `0.01` 残留不属于新语义。逻辑退出期间保留与终点卸载由 [presence 生命周期](presence-lifecycle.md)处理；本夹具仅证明 Motion 描述和 Scene 绑定可表达原渐变以及打断连续性，不声称完成宿主资源释放或指针捕获。

运行 `yarn test:fade-migration` 检查 19 个公共定义的严格类型、4 项原生手算、2 项 JS 数值与序列化；`yarn test:motion-browser` 检查[交互页面](../test/fade-migration.html)的固定时间、乱序/重载和 Canvas 内区像素。该页面的 Calcit 产物隔离在 `js-out-fade/`，不覆盖 Motion/Scene 其他入口。
