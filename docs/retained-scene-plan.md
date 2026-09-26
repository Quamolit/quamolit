# 保留式 Scene 计划与按需帧：M2 #50 切片

`RetainedScenePlan` 在宿主侧消费一次已经由 Calcit `validate-scene` 检查、序列化后的 `SceneDocument`。它复制文档一次，编译受支持的 group opacity、rect x/y/width/height 绑定槽位；Motion ID/version 只在宿主 sampler 表中查找。失效原因分类、重采样判定与采样值校验规则由 Calcit `quamolit.retained-scene` 提供（`revision-reasons`、`supported-target-field?`、`sampled-value-valid?`）；宿主只保留可变保留帧、sampler 闭包与静态副本。Scene IR 仍是无 DOM/GPU 句柄的纯数据，任意 CPU 采样函数不声称可降低为 WGSL。该层是 Quamolit 专属执行缓存，不属于通用 js-ffi。

调用者把 Model、输入、资源、视图、画质和 Motion 的非负整数版本显式传给 `update(time, revisions, values)`；每个 sampler 同时声明它实际依赖的版本字段。时间变化采样所有绑定，版本变化只采样有关绑定；画质变化可以重绘而不重新采样与画质无关的 Motion。同样的时间与版本跳过。未知闭包捕获无法自动发现，调用者必须给变更的依赖递增版本；场景拓扑、几何或绑定描述变动使用更高的 `sceneRevision` 调用 `replace`，一次性重编译。更新先验证全部采样值，再提交到私有帧；失败不污染旧帧。绘制者用 `forEachNode` 同步借用保留节点，长期保留画面必须显式 `snapshot()`。静态 geometry/pipeline 的独立资源缓存、通用增量 Scene diff 应用与自动绑定依赖分析尚未实现。

`DemandFrameScheduler` 在未暂停时最多挂起一个 rAF，请求原因合并，但输入事件按到达顺序保留；暂停期间入队，恢复后唤醒。绘制回调内再次请求会排下一帧；无新请求就不再提交。它不是墙钟到动画时间的映射器，也不自动判定动画何时完成；宿主需按现有 host clock/Presence 的 `needs-frame` 显式请求下一帧。页面关闭时取消待提交帧并释放实例源。

每个待提交帧带内部代次。暂停或销毁取消帧时使旧代次失效；即使宿主迟到投递了已取消回调，它也不能清除恢复后新帧的句柄、消费排队输入或重复绘制。同一个回调被重复投递时也最多提交一次。

验证：`yarn test:retained-scene` 用同一 Calcit Scene/Motion fixture，1000 个不同时间帧逐一与全量 Calcit 参考比较，`planBuilds=1、staticSceneCopies=1、bindingSamples=1000`；相同时间的 Model/输入/资源/视图/画质/Motion 版本变更触发失效，失败更新/替换不破坏旧帧。浏览器页面在 Canvas 绘制 10k 实例与移动矩形，首帧复制 80,000 字节位置源，后续乱序时间及 DPR=2 绘制复制 0；验证资源 ready、Model、视图、暂停期间三次输入、恢复唤醒与空闲 2 秒无新增提交。应用内浏览器已目视确认 DPR 1/2 的 0.5/0.25 秒画面。这里的 1000 次测试是静态 Scene 副本计数及数值正确性，不是 FPS、真实几何 buffer、GPU pipeline 或完整生产调度器的性能证据。
