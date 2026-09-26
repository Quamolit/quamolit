# 公共 Canvas 实例绘制入口：M2 #33/#38 切片

推进 #33/#38，为 #104 的公共 10k 实例负载提供第一个 Canvas 参考入口。`quamolit.canvas-reference/draw-instances!` 消费已由 `validate-scene` 检查的 Scene IR `InstanceNode` 与一个宿主 Float32 位置数组，一次提交内嵌的 Canvas2D 批次循环。

## API

```cirru
perm $ canvas/draw-instances! context instances positions
```

- `context`：`js-ffi.canvas-batches/CanvasContextHost`（host-free，消费者可直接使用）。
- `instances`：`quamolit.scene-ir/InstanceNode`，即 `SceneContent :instances` 的载荷；`count` 取自 `(:source instances)`，绘制尺寸取自 `:width`/`:height`，颜色取自 `:fill`。
- `positions`：`JsObject`，宿主交错 `[x0, y0, x1, y1, ...]` 的 `Float32Array`，长度必须是 `count * 2`。这里用 `JsObject` 而不是 `js-ffi.typed-arrays/Float32ArrayHost`：`typed-arrays` 传递依赖 `@calcit/js-ffi` npm 包，而独立消费者只允许直接依赖 `@calcit/procs`；`JsObject` 边界由定义级 `:file` 片段中的 `instanceof Float32Array` 校验。
- 返回本地 `quamolit.canvas-reference/InstancesMetrics`：`boundary-calls`、`canvas-calls`、`instances`、`position-bytes-read`。

## 实现与归属

- `canvas-reference/raw-draw-instances!` 用定义级 `:ffi :js :file |src/host/canvas-rect-batches.mjs` 把批次循环嵌入 `quamolit.canvas-reference` 的生成模块；宿主文件是单个箭头函数表达式，不含 `import`/`export`/`require` 词元。
- 同一份 `canvas-rect-batches.mjs` 也替换了 `quamolit.instance-ffi` 原有的 `:require |../../../src/host/...`，`instance-ffi` 的通用调用方不再依赖裸宿主路径。
- 消费者的可达闭包因此保持全部 `./*.mjs`：不再出现 `src/host/*.mjs` 或 `@calcit/js-ffi`。`canvas-reference` 自身只依赖 host-free 的 `js-ffi.canvas-batches`、`js-ffi.contract` 与 `quamolit.scene-ir`。

## 语义与计数

- 一次 JavaScript 边界调用处理整个实例层，不存在逐实例跨 FFI。
- Canvas 参考仍逐实例 `fillRect`：10k 实例为 `boundary-calls=1`、`canvas-calls=10000`、`instances=10000`、`position-bytes-read=80000`。这是画质/正确性参考，不是 GPU draw-call 或吞吐证据。
- 零实例返回 0 调用，不产生绘制副作用；非 `Float32Array`、交错长度不整、非有限坐标、越界范围都会显式失败，不静默漏绘。
- 绘制保存并恢复调用者的 `fillStyle`/`globalAlpha`；不读回像素，也不修改 Scene 或 Model。
- 纯 Scene `draw-content!` 仍对 `:instances` 显式 `unsupported-reference-instances`：逻辑 IR 不携带宿主资源，资源感知绘制必须走 `draw-instances!`。

## 测试与边界

`yarn test:canvas-instances-reference` 严格检查 `quamolit.canvas-reference`，编译 Motion 目标并运行 `test/canvas-instances-reference-smoke.mjs`；CI 的 `visual.yaml` 在 Canvas 批次步骤后执行同一命令。命令覆盖 10k 与零实例计数、非法源类型与样式恢复。

## 尚未完成

- **消费者接入**：`examples/retained-consumer` 的 `deps.cirru` 已提升到包含本入口的已推送提交，并新增 `instances-declaration` 与 `draw-instances!`；`yarn test:consumer` 的 Node 合同断言 10k 实例 1 次边界调用、10000 次 `fillRect`、80000 字节与非法源失败，反例伪造计数被检出。页面模式与三路径 bench 仍未接入。
- **资源表**：`InstanceSource` 的 `id/version` 到宿主快照（GPU buffer、图片、字体）仍由 #51 负责；本入口要求调用方提供同步 Float32 位置。
- **GPU 实例与标准动画采样**：实例顶点/参数常驻与时间采样归 #38/#40/#52。
