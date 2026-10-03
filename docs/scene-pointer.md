# Scene 指针路由：纯 Calcit 状态机

`quamolit.scene-pointer` 在 `HitPlan` 上定义不依赖 DOM、Canvas 或 WebGPU 的指针路由状态。宿主只负责把浏览器输入归一化为 CSS px 坐标和 `PointerInput`；命中、逻辑冒泡、捕获归属、释放与 Scene 变更后的协调均由 Calcit 决定，因此同一事件日志可以在 Node、浏览器截图和未来 WebGPU 后端中重放。

一次未捕获输入先调用 `hit-test-plan`。命中的叶节点是 `source-node`，事件目标链从该叶节点开始，沿父链收集显式 `SceneInteraction :target`，顺序固定为由内向外。装饰节点不产生目标；若只有祖先 group 声明 target，叶图元仍会把事件交给该祖先。`PointerDispatch :none` 明确表示这次没有逻辑投递，不用空字符串或宿主 `null` 混入核心状态。

`capture-target` 只允许捕获刚才路由链中实际出现的目标，并同时保存 pointer id、逻辑 target 与原始叶节点 ID。被捕获的同一 pointer 即使移出画布或当前几何，也继续按原 source 的最新父链投递；其他 pointer id 仍执行普通命中。`up` 与 `cancel` 在完成本次投递后清理捕获，并通过 `capture-released=true` 发出一次性宿主释放信号。

`SceneInteraction :none` 是装饰语义，仍允许继承祖先 target；新增的 `:disabled` 则屏蔽节点及其全部后代，后代自己的 target 和屏蔽边界外的祖先 target 都不能绕过它。该子树不进入 HitPlan 候选，也不会遮挡背后的可交互节点；它仍可绘制，几何、裁剪、opacity 和资源生命周期不变。完全透明不会自动禁用交互。退出开始时显式设置 `:disabled`，不要以视觉 opacity 推断交互状态。

每次 Scene 提交新 `HitPlan` 后，调用 `reconcile-pointer-state` 并保存返回的 state。若原 source 已卸载、被 disabled 子树屏蔽，或捕获 target 已不在最新目标链，会清空捕获并只报告一次释放；无效 hover 引用也立即清空，不等待下一次输入。协调只检查引用有效性，不重新根据指针位置计算几何变化后的 hover。重新启用子树不恢复旧捕获，需要新的按下输入。Presence 平叶组件的现有 `:none` 退出策略不变；通用嵌套退出须显式设置 `:disabled`，当前尚未自动接入 Presence group。`PresenceUpdate.released` 保留资源层终点释放语义，不能延后指针禁用。

`quamolit.scene-pointer-browser` 提供第一版类型化薄桥：把 `clientX/clientY` 减去 `getBoundingClientRect().left/top`，得到与 Scene 一致的 CSS px，不乘 DPR；DOM `setPointerCapture/releasePointerCapture` 只执行纯 Calcit 返回的捕获与一次性释放决策。临时 external-object trait 只覆盖当前需要的原始字段和方法，并明确关联 [js-ffi #149](https://github.com/calcit-lang/js-ffi/issues/149)；上游发布等价接口后删除本地声明。Node 宿主替身验证原生捕获各调用一次，Chromium 进一步验证真实 PointerEvent 从画布内按下、移到画布外仍投递、抬起释放，以及 DPR 2 下按 CSS px 命中和 `pointercancel` 清理。测试夹具与 Drag demo 的监听器均由 Calcit 安装；后者还把 Canvas 视图逆变换显式同步为 CSS 坐标尺度。

浏览器桥还监听 `lostpointercapture`：只有事件 pointer id 与当前所有者一致才清理；窗口 `blur` 则主动释放元素仍持有的原生 capture，再幂等清空纯状态。两条路径都复用 `PointerReconcile` 的一次性信号。Scene 提交时使用 `reconcile-pointer-surface!(surface, next-plan, state)`，保存返回的 state；它执行纯协调，并在需要时立即释放原生 capture，重复协调不会重复释放。`dispose-pointer-surface!` 是 canvas/surface 真正卸载前的显式协议；调用方不得直接移除仍持有 capture 的元素。坐标边界不缓存，每个 PointerEvent 都重新读取 `getBoundingClientRect()`，因此移动/resize surface 后按新 CSS 边界命中。Drag demo 已接通实际页面卸载；浏览器夹具另覆盖 DPR 1/2 下 resize 与嵌套子树禁用同次提交、无新输入即释放、兄弟节点仍可交互、重入后重新捕获。该夹具不是完整 Presence 退出动画或 Canvas 像素验收。

验证命令为 `yarn test:scene-hit`、`yarn test:scene-pointer`、`yarn test:scene-pointer-browser` 与 `yarn test:drag-demo`。覆盖冒泡、画布外捕获、pointer id 隔离、快速目标切换、`up/cancel`、删除/重挂载、嵌套禁用、hover 清理、边界外祖先捕获释放、兄弟不受影响、重入、背后命中和重复协调；1000 个装饰节点的命中仍 `visited=1`。Node 与 Chromium 验证上述宿主捕获/resize 协议。自动 Presence group 退出接线、实际应用的 resize/退出动画组合、cubic-path、instances 和 GPU picking 尚未覆盖，不以本切片关闭 #34。

这些入口均由公共 Calcit namespace 暴露，新增桥接没有 JS 实现文件或测试依赖。`SceneInteraction` 仍是实验协议；下游若穷举匹配原来的 `:none/:target`，需要增加 `:disabled` 分支。稳定 UI-motion 合同不因此扩大。
