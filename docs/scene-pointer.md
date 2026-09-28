# Scene 指针路由：纯 Calcit 状态机

`quamolit.scene-pointer` 在 `HitPlan` 上定义不依赖 DOM、Canvas 或 WebGPU 的指针路由状态。宿主只负责把浏览器输入归一化为 CSS px 坐标和 `PointerInput`；命中、逻辑冒泡、捕获归属、释放与 Scene 变更后的协调均由 Calcit 决定，因此同一事件日志可以在 Node、浏览器截图和未来 WebGPU 后端中重放。

一次未捕获输入先调用 `hit-test-plan`。命中的叶节点是 `source-node`，事件目标链从该叶节点开始，沿父链收集显式 `SceneInteraction :target`，顺序固定为由内向外。装饰节点不产生目标；若只有祖先 group 声明 target，叶图元仍会把事件交给该祖先。`PointerDispatch :none` 明确表示这次没有逻辑投递，不用空字符串或宿主 `null` 混入核心状态。

`capture-target` 只允许捕获刚才路由链中实际出现的目标，并同时保存 pointer id、逻辑 target 与原始叶节点 ID。被捕获的同一 pointer 即使移出画布或当前几何，也继续按原 source 的最新父链投递；其他 pointer id 仍执行普通命中。`up` 与 `cancel` 在完成本次投递后清理捕获，并通过 `capture-released=true` 发出一次性宿主释放信号。

每次 Scene 提交新 `HitPlan` 后，宿主必须先调用 `reconcile-pointer-state`。若原 source 已卸载，或者捕获 target 已不在该 source 的最新目标链，状态机会清空捕获并只报告一次释放；对已经清空的状态重复协调是幂等的。Presence 平叶组件在 `:exit` 开始时把 interaction 改为 `:none`，因此用该帧重新编译计划并协调即可立即禁用命中；`PresenceUpdate.released` 仍保留资源层终点释放语义，不能延后指针禁用。

`quamolit.scene-pointer-browser` 提供第一版类型化薄桥：把 `clientX/clientY` 减去 `getBoundingClientRect().left/top`，得到与 Scene 一致的 CSS px，不乘 DPR；DOM `setPointerCapture/releasePointerCapture` 只执行纯 Calcit 返回的捕获与一次性释放决策。临时 external-object trait 只覆盖当前需要的原始字段和方法，并明确关联 [js-ffi #149](https://github.com/calcit-lang/js-ffi/issues/149)；上游发布等价接口后删除本地声明。Node 宿主替身验证原生捕获各调用一次，Chromium 进一步验证真实 PointerEvent 从画布内按下、移到画布外仍投递、抬起释放，以及 DPR 2 下按 CSS px 命中和 `pointercancel` 清理。测试监听器由 Calcit 安装，HTML 只加载编译入口。

浏览器桥还监听 `lostpointercapture`：只有事件 pointer id 与当前所有者一致才清理；窗口 `blur` 则主动释放元素仍持有的原生 capture，再幂等清空纯状态。两条路径都复用 `PointerReconcile` 的一次性信号。后续还须覆盖 canvas 真正卸载、resize 中途拖拽与节点退出的组合，并将它们统一转为可重放输入或协调步骤。通用嵌套退出子树的完整屏蔽仍待 Scene interaction 协议扩展，不能只把叶节点 target 改为 `:none` 后声称完成。

验证命令为 `yarn test:scene-pointer` 与 `yarn test:scene-pointer-browser`。当前覆盖冒泡、画布外捕获投递、pointer id 隔离、快速 A→B→空白切换、`up/cancel`、节点删除、父 target 卸载后重挂载、退出禁用、重复协调、1000 个装饰节点下 `visited=1`，以及真实 Chromium 捕获、释放、取消、确定性 `lostpointercapture`、窗口 blur 和 DPR 2 CSS 坐标；不覆盖 resize 中途拖拽、canvas 真正卸载、任意嵌套退出子树、cubic-path、instances 和 GPU picking。以上剩余项继续归入 #34，不以本切片关闭 issue。
