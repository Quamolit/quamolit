# 版本化实例源的 GPU 上传绑定：M2 #51/#38 切片

把[版本化实例源资源表](instance-resource-table.md)接到 WebGPU 矩形批次：`quamolit.instance-gpu/upload-source!` 按 `(id,version)` 只上传一次。新版本若由当前 GPU 基版的局部补丁派生，仅写入相应实例范围；跳过版本或全量登记时回退整层快照上传。版本判断、选择局部/全量路径在 Calcit，宿主只维护 Float32 快照与 WebGPU buffer 写入。

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

当 `previous == (:version source)` 时返回 `{:bytes 0 :uploaded? false}`，**不解析也不上传**。否则读取类型化 `patch-info`：若补丁的 `base-version == previous`，调用 `quamolit.webgpu-batches/upload-patch!` 将片段写入 `start * 8` 字节偏移；否则 `resolve` 完整快照并调用 `upload!`。返回本次实际 GPU 上传字节与新版本。

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
- 全量上传字节等于 `count * 8`（交错 x/y 的 f32），单实例补丁为 8 B；缺失源由资源表显式失败，不产生上传副作用。
- 同尺寸、连续版本的补丁不新建 GPU buffer/pipeline；跳版本回退完整快照，不能把基于错误旧 buffer 的差量当成正确画面。
- 该绑定只做「版本 → 上传」决策；单图层 device generation 与重建已由 [`quamolit.device-recovery`](device-recovery.md) 接到独立消费者，pipeline/bind group 的创建和销毁仍由 `quamolit.webgpu-batches` 执行。

## 测试与边界

`yarn test:instance-gpu` 严格检查 `quamolit.instance-gpu` 与 `quamolit.instance-resource`，编译 Motion 目标并运行 `test/instance-gpu-smoke.mjs`：设备 mock 断言已有全量版本合同及 10k 源首帧 80 kB、单实例补丁 8 B、热帧 0 B、跳版本回退 80 kB。`yarn test:webgpu-instances` 同时验证宿主 writeBuffer 偏移与公共 Calcit 浏览器像素。2026-09-27 本机有窗口 Chromium 的非软件 `apple / metal-3` adapter 上，公共 GPU 路径与同源 Canvas 参考在补丁前后像素一致；无头 CI 仅有软件 adapter 时该硬件专项明确 SKIP。

## 尚未完成

- 公共 `create!`/`draw-source!`/`dispose!` 已成为独立消费者 `instances-gpu` 模式的实际后端，但尚不是完整 Scene 图层调度入口。
- device loss 后基于 Model/实例源版本的同一图层重建已接通；通用 `loading/ready/error` 资源、纹理/字体/图片、多图层共享 device 与 Presence 释放通知仍归 #51 后续切片。
