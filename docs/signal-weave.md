# Signal Weave：可打断的折线／面积图

第二件图表 UI 作品，与 Metric Flow 的柱状工作台采用不同构图。统一入口为 `/demos/index.html?demo=signal-weave`；独立截图入口为 `/examples/signal-weave/index.html?t=0.45&position=0`。全屏 Canvas 绘制，DOM 是可收起的控制浮层。

## 组件与时间

Calcit 的 `quamolit.examples.signal-weave` 声明工作台、三张指标卡、主面积图、对照线与逐张进入的洞察卡片。`visible-points` 从显式时间求出曲线当前的完整顶点和分数端点，面积多边形与终点标记使用同一组点；在 `t=0`、`t=0.45`、`t=1.2` 可分别看到初始、路径生长、完整曲线。点值及节点在绘制过程中不由宿主 JS 修改。

「常态流量／活动增长」是用户输入。`SignalModel` 保存初始位置、`TransitionIntent` 与有序事件；`set-mode` 打断时从当前位置重新建立 1.1 秒过渡，`position-at` 可重放较早事件前缀。主曲线的 12 个采样点保持固定索引，活动情境下保留较淡的常态对照线；指标数值与洞察随同一位置采样。入口阶段结束且模式过渡结束后停止连续帧，新的输入再唤醒。

`?t=` 指定任意非负逻辑时间，`?position=` 指定用于分享画面的 0–1 情境位置。分享链接只保存当前视觉状态，不保留完整事件历史；回退到事件前时间并再操作时，会从该时间的视觉位置建立新分支。事件日志上限 2000 条，后续需要有界检查点。Canvas2D 是基础参考；本作品不宣称 WebGPU 绘制或性能提升，也不代表公共组件 enter/exit API 已完成。

## 检验

`yarn test:signal-weave` 检查 Calcit 严格类型和编译、路径端点、面积闭合、节点身份、打断连续性、乱序重放、100 次往返、浏览器按钮与分享链接，并保存初始／中间／终点截图。`yarn test:demo-nav` 检查统一页面、导航往返及卸载。不同图表作品仍要按 [#146](https://github.com/Quamolit/quamolit/issues/146) 增加堆叠重排和热力图筛选，并从多件作品提炼公共 Calcit 图表动画组件。
