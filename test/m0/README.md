# M0 可运行参考场景

这些夹具推进 [#46](https://github.com/Quamolit/quamolit/issues/46)。它们使用独立的 Canvas2D 参考绘制器，不依赖仍在迁移的旧应用入口，也不声称已有 Scene IR 或 WebGPU 后端。`fixtures.mjs` 只负责可序列化输入与参考模型；后续渲染器应消费同一份 manifest，并和参考画面比较。

在项目根目录运行：

```sh
yarn install --immutable
yarn test:fixtures
yarn vite --host 127.0.0.1
```

打开 `http://127.0.0.1:5173/test/m0/?fixture=ui-transition&time=0.75&seed=7&dpr=1`。场景 ID 为 `ui-transition`、`instances`、`text-path`；实例数量用 `count=1000|10000|100000` 指定。固定逻辑尺寸为 640×360，DPR 只接受 1 或 2。`glyph=loading|ready|error` 显式设置字形资源状态。时间单位为秒；0、0.5、0.75、1.4 分别适合初始、中间、打断后和终点画面。页面显示实际像素尺寸和参考模型；`window.quamolitM0.renderAt(t)` 可精确采样任意非负有限时间，`getManifest()`、`getReferenceModel()`、`getFramePng()` 供截图工具读取。

UI 夹具的默认输入记录：0.15 秒进入 `detail-card`，0.65 秒将运动目标从 500 打断到 220，0.9 秒开始退出。拖动时间条和播放使用同一模型；“此刻改目标”把事件写入 URL 的 `events` 参数，刷新后可重放。重置按钮恢复默认输入。`instances` 以 seed/index 生成可索引的实例数据，不生成 100k 个组件节点；三个数量档共用同一规则。`text-path` 使用内置固定 5×7 字形与三次贝塞尔路径，不依赖系统字体或网络资源。所有资源版本及 ready 状态写入 manifest。

本阶段的参考模型可乱序采样；这是 M0 夹具本身的确定性数学实现，并非 Quamolit 公共动画 API。当前画面不包含真实 Canvas 文字排版、图片、嵌套裁剪、事件命中或 GPU 绘制；这些由后续 milestones 处理。`yarn test:fixtures` 验证模型数值和重放，浏览器实际截图是单独的验收证据；自动像素 CI 属于 #47。

`evidence/` 保存同一浏览器会话、1280×720 视口、DPR 1、seed 7 的页面截图。UI 的 0/0.5/0.75/1.4 秒以及实例和文字路径的 0.5 秒均有样本；这是人工审查证据，不能作为跨浏览器自动像素基线。同样输入的 UI、实例和文字路径画面分别冷加载 3 次，截图字节哈希一致。浏览器版本由 #47 的 CI 环境固定。

参考图：[UI 初始](evidence/ui-initial.png)、[UI 中间](evidence/ui-middle.png)、[UI 打断后](evidence/ui-interrupted.png)、[UI 终点](evidence/ui-end.png)、[1k 实例](evidence/instances-1k.png)、[固定字形与路径](evidence/text-path.png)。
