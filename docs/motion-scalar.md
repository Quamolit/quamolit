# Motion IR：首个标量切片

这是 issue #48 的局部实现，不是完整 Motion IR，也不改变现有 `quamolit.core` 绘制 API。目标是先固定一个可类型检查、可序列化、可在任意时间直接采样的 CPU 参考路径；之后向量、颜色、关键帧、循环及 GPU lowering 必须沿用相同的时间和身份语义。

`quamolit.motion` 定义 `ScalarDescriptor { id, version, motion }`。`motion` 是封闭枚举：常量、`scale * time + offset`、或 `ScalarTween { start, duration, from, to, easing }`；easing 目前只有 linear 和 smoothstep。所有时间以秒为单位，结果为标量 `Number`。`sample-scalar descriptor time` 是纯函数，不读取上一帧，也不维护播放状态；调用方可以按 `1, 0, 0.5, 0.25, 1` 的顺序采样。`duration=0` 在 `start` 时刻切换；正时长区间在两端钳制。输入/输出中的 NaN 与无穷值会拒绝，持续时间不能为负。描述可以作为数据传递，里面没有 JS 闭包或 GPU handle。

旧 fade 矩形的过渡可先写成 `from=10, to=20, start=0, duration=1` 的 `ScalarTween`，再由宿主绘制适配器映射为画面位置。本仓库的 [浏览器夹具](../test/motion.html) 使用 Calcit 编译出的 `sample-at` 在 Canvas 上展示这个中间帧；Canvas 只负责夹具绘制，不是新渲染后端。`docs/architectures/motion-scalar.cirru` 保留可重复校验的 Calcit 架构 scaffold，真正定义存于 `calcit.cirru`，后者由 Calcit CLI 修改而非文本生成。

运行 `yarn test:motion`，再运行 `yarn test:motion-browser`。后者需安装锁定的 Chromium；CI 使用 Node 24。浏览器测试检查 0.5→0.75→0.25→1→1 秒、页面重载后的数值和实色像素，失败时非零退出。手工检查可打开 `/test/motion.html?time=0.5` 并拖动时间滑块；即使时间倒退也不依赖累积状态。

尚未实现：向量/颜色和线性 sRGB 语义、关键帧重复、循环模式、自定义曲线注册、组件绑定、目标切换和打断、固定步长模拟、资源生命周期、GPU lowering。此切片的 Canvas 画面与 CPU 数值通过，不可据此关闭 #48 或声称生产场景性能达标。
