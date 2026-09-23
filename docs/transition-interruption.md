# M1 #49：打断过渡与固定事件重放切片

`quamolit.transition/TransitionIntent` 保存组件 `key` 与显式 `ScalarTween {from,to,start,duration,easing}`。`interrupt-transition` 在事件时刻先采样旧意图，再把该值设为新意图的 `from`；因此承诺**位置连续**，不声称速度连续。时间与数值必须有限、duration 非负；追溯到当前意图起点之前的打断被拒绝。`duration=0` 在事件时刻直接切换。绘制过程只读意图，不修改 Model。

`TransitionEvent` 记录 `at/to/duration/easing`；`replay-transition` 要求事件非降序，同一时刻的重复事件按列表顺序处理。`sample-replay(initial, events, time)` 先验证完整日志，再仅应用采样时刻之前（含当时）的事件；同一日志可在 1.25、0、0.75、0.25 秒乱序采样而得到相同画面。`replay-active?` 只表示当前过渡是否需要连续请求帧：终点后为 false；未来事件本身应由输入/时间调度单独唤醒。此参考实现每次从初始意图重放事件，不是生产缓存或保留执行计划。

`yarn test:transition` 覆盖在 25%/50%/75% 打断的手算位置、重复打断、零时长、非法输入、事件重放和编译后 JS。`yarn test:motion-browser` 在 [独立页面](../test/transition.html) 绘制两次打断后的 Canvas 中间帧，核对像素、乱序跳转、刷新及完成后的停帧信号。架构约束见 [transition-interruption.cirru](architectures/transition-interruption.cirru)。

Scene 层的 enter/present/exit、同 key 重入、父级卸载以及 fade/可重排列表示例已有 [CPU 参考实现](presence-lifecycle.md)。宿主资源释放、指针捕获清理及生产执行计划仍未完成，不能仅凭这两个切片关闭 #49。速度连续若需要，应另定义模式和导数条件，不能把这里的结果当成速度连续。
