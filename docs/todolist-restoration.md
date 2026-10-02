# TodoList 恢复：事件、Model 与中间帧

推进 #36/#49/#50/#53。历史行为依据为原 `quamolit.app.comp.todolist` / `task`：新增、编辑、完成切换、删除、进入退出位移及列表位置过渡。本示例恢复这些操作，新增置顶/倒序、退出中恢复和终点后的重新进入；不恢复旧门户或绘制中修改状态的 `orphins` 缓存。

入口：`examples/todolist/index.html`，从导航“原有动画”可达。Canvas 占满视口，DOM 仅提供输入、时间与日志浮层。点击行左方块完成、文字编辑、↑ 置顶、× 删除；窄屏可先收起浮层。24 行上限是示例容量，不是框架吞吐承诺；超过 8 行缩小构图。每条最多 28 字符。

## 可复用实现与边界

- `quamolit.examples.todolist` 定义 Row/Model/Event/Session。`dispatch` 在显式事件时间修改意图，重排从当前 y 采样值接续；完成按钮宽度同样可中途反转。
- `advance` 按日志游标应用到达的事件并显式结算；`replay` 从初始模型恢复任意时刻。时间采样与绘制不修改 Model，离线日志的释放计数不能作为宿主释放副作用重复执行。
- Scene/Motion 由 Calcit 声明，Presence 再接统一 ExecutionDeclaration/ComponentPlan。事件与终点阶段变化才重建声明；时间更新只采样标量与位移，保留原文字和几何。行级状态和事件命中不在 JS 中重写。
- 进入按行错峰，退出反向错峰；删除立即禁交互，延迟期间仍保留画面。清空也有退出位移/alpha；这不是一般嵌套父级/子树的绘制支持。
- `hit-at` 对示例行的逻辑区域按绘制逆序命中，不是 #34 的通用命中索引或指针捕获。编辑通过浮层输入，而非恢复旧 prompt UI。
- `SceneContent :text` 是基础单行、左对齐、中线、monospace 文字；支持位置、字号、颜色及叶节点 alpha，尚无复杂 shaping、字体资源表、文字裁剪或 GPU 字形缓存。diff 把文字/字号/位置视为几何，颜色视为属性。
- 原生文字使用 js-ffi `0.2.1-alpha.2` 的类型化 `CanvasContextHost.fill-text!`；`draw-text!` 在 Calcit 中设置字体、对齐和颜色，并在异常路径恢复 Canvas 状态。已移除本地 `raw-fill-text!` inline 适配；保留原生 Canvas 像素对照和浏览器回归测试。参见上游 [js-ffi #124](https://github.com/calcit-lang/js-ffi/issues/124)。

## 时钟与日志

默认播放示范日志：3 次新增、完成切换、删除后打断恢复、置顶后反向重排、编辑和删除。`?t=1.6` 等链接直接暂停在固定时间。自由操作保留初始 3 行；历史时刻新增操作会丢弃未来分支。导出 JSON `{version:1,events:[...]}`，导入先检查字段、容量、顺序和整段状态机合法性；失败不替换当前日志。

播放、resize/DPR 与未来日志复用现有 `DemandFrameScheduler`。Calcit 的 `needs-frame?` 和 `next-event-at` 决定是否继续运动/何时唤醒：当前无运动时只保留一个延迟唤醒，不安排连续 rAF；到期再请求帧，事件应用与动画仍由 Calcit 执行。宿主截止时间按播放锚点计算，resize 不会把剩余等待重新计时。立即失效取代旧 deadline，绘制后重新计算；暂停/卸载取消帧与计时器，迟到或重复回调不能复活页面。`requestAfter` 在暂停时不排队，恢复播放后按新锚点重新计算；超长延迟分段等待，避免浏览器 32 位定时上限溢出为空转。

没有未来事件且所有过渡结算后停止。隐藏页面暂停，不在恢复可见时自动追帧。resize/DPR 在暂停时只重绘，不推进 Model；同步 seek/快照保持不变。现有浏览器门禁使用可控宿主时钟验证两秒以上空闲、resize 后原截止时间触发、暂停与导航卸载；底层迟到计时器负例放在原调度单测中，不新增测试入口。JS 的 Model JSON 诊断按 Model 对象缓存，逐帧不重新序列化完整 Model；截图调试 snapshot 的开销不计入框架性能结论。

## 检验

`yarn test:todolist`：严格类型、原生合同、Node 输入日志/乱序时间/打断/重入/100 次装卸/1000 时间帧，以及浏览器交互、空闲停帧、全屏/DPR、文字像素与错误路径。`yarn test:demo-nav` 验证静态产物导航往返。结果与固定时间截图进入 CI artifact。

仍未完成：真实宿主资源释放、通用指针捕获、嵌套父级/子树绘制、同源 WebGPU 和端到端性能测量。窄屏采用 contain，文字和点击目标偏小，由 [#117](https://github.com/Quamolit/quamolit/issues/117) 跟踪响应式布局，不阻塞本次功能恢复。该示例提供 #49 的逻辑生命周期证据，不自动关闭 M1/M2 或全部 11 个示例恢复项。
