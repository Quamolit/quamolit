# 版本化实例源的 GPU 上传绑定：M2 #51/#38 切片

把[版本化实例源资源表](instance-resource-table.md)接到 WebGPU 矩形批次：`quamolit.instance-gpu/upload-source!` 按 `(id,version)` 只上传一次，版本变化后才把新快照写入 GPU buffer，配合 #38「调用次数按资源版本而非帧数增长」。

## API（`quamolit.instance-gpu`）

```cirru
let
    upload $ gpu/upload-source! previous batch table source
  ; upload.bytes / upload.version / upload.uploaded?
```

```cirru
defstruct SourceUpload (:version 'Number) (:bytes 'Number) (:uploaded? 'Bool)
```

`upload-source! (previous, batch, table, source) -> SourceUpload`：

- `previous`：调用方记录的该源上次已上传版本；首次传 `-1`。
- `batch`：`quamolit.webgpu-batches/RectBatchHost`。
- `table`：`quamolit.instance-resource` 资源表句柄。
- `source`：`quamolit.scene-ir/InstanceSource`。

当 `previous == (:version source)` 时返回 `{:bytes 0 :uploaded? false}`，**不解析也不上传**；否则从表中 `resolve` 快照，`unsafe-coerce` 为 `Float32ArrayHost` 后调用 `quamolit.webgpu-batches/upload!`，返回该次上传字节与版本。

## 整层绘制入口

```cirru
defstruct SourceDraw (:version 'Number) (:uploaded? 'Bool) (:upload-bytes 'Number) (:instances 'Number) (:draw-calls 'Number)

gpu/draw-source! previous batch table instances
```

`draw-source! (previous, batch, table, instances) -> SourceDraw` 消费 Scene `InstanceNode`：

1. 用 `upload-source!` 按 `(id,version)` 决定是否上传 `(:source instances)`；
2. 用 `(:width)`/`(:height)`/`(:fill)` 与 `(:count source)` 调用 `quamolit.webgpu-batches/draw!`，无位移（`%none`）绘制整层。

返回组合计数：`uploaded?`、`upload-bytes`、`instances`、`draw-calls`。同版本热帧 `upload-bytes=0` 但仍绘制一层；版本变化才重新上传。

## 语义与计数

- 同一版本的热帧不新增上传，也不重复解析；调用次数按资源版本增长。
- 上传字节等于 `count * 8`（交错 x/y 的 f32）；缺失源由资源表显式失败，不产生上传副作用。
- 该绑定只做「版本 → 上传」决策；device loss 后重建、pipeline/bind group 生命周期仍由 `quamolit.webgpu-batches` 与 #51 的后续切片负责。

## 测试与边界

`yarn test:instance-gpu` 严格检查 `quamolit.instance-gpu` 与 `quamolit.instance-resource`，编译 Motion 目标并运行 `test/instance-gpu-smoke.mjs`：设备 mock 断言版本 1 首次上传 16 B、同版本热帧 0 B、版本 2 上传 24 B、累计 40 B，以及缺失源失败不产生上传。CI 的 `visual.yaml` 在资源表步骤后执行同一命令。

## 尚未完成

- 尚未接入真实 WebGPU 设备与 `create!`/`draw!`/`dispose!` 的整链路；本切片只验证版本化上传决策与计数。
- device loss 重建、`ready/error/loading`、与 Presence/#49 释放通知的实际接线归 #51 的后续切片。
