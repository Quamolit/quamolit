# WebGPU device loss 恢复协议：M2 #51/#104 切片

`quamolit.device-recovery` 用纯 Calcit 状态机描述 WebGPU 图层的探测、创建、安装、丢失、回退与释放。它不保存 adapter、device、pipeline 或 buffer；宿主只按 `RecoveryAction` 执行浏览器副作用，再把结果提交回状态机。因此恢复决策可以在 Node 中确定性重放，浏览器接线不会另写一套 generation 规则。

## 状态与动作

`RecoveryState` 保存单调 `generation`、`phase`、最新逻辑 `resource-version`、尝试次数与丢失次数。阶段为 `closed / probing / creating / ready / fallback / failed`；动作是 `probe / create / install / release / show-fallback / show-failure`。`request-open`、`probe-resolved`、`create-resolved`、`device-lost` 与 `close-recovery` 均返回 `RecoveryTransition(state, actions)`，自身不触碰宿主对象。

- 同一资源版本在 `probing / creating / ready` 阶段重复打开时复用当前 generation，不重复创建设备。
- 当前 ready device 丢失时，先释放旧 generation 并显示 Canvas 回退，再以**同一逻辑资源版本**开始下一 generation；Model、Presence 和版本化实例源不随设备销毁。
- 资源版本在正常帧中提升时，`update-resource-version` 只更新可重建依据。已有 batch 继续由 `quamolit.instance-gpu` 按版本上传差量，不错误地把一个实例补丁当作 device 重建。
- 旧 generation 的迟到 probe/create/lost 结果不得安装；若迟到结果可能持有宿主对象，只产生幂等 `release`。
- `close-recovery` 提升 generation、释放当前宿主资源并进入 `closed`；之后旧异步结果仍只能释放。
- 资源版本必须是有限非负整数。错误和软件 adapter 进入可观察的 `failed / fallback`，不会静默假装 GPU 成功。

## 独立消费者接线

`examples/retained-consumer` 的 Calcit `app.main` 只薄封装上述类型化入口。页面 JS 维护按 generation 索引的原生句柄表并执行动作；`instances-gpu` 模式在恢复期间保留用户选择，以同源 Canvas 显示当前 Model，而不是改写成另一个逻辑模式。恢复完成后重新创建 batch，从当前实例源版本全量上传；`device.lost` 的 Promise 和页面“模拟 device loss”按钮都提交同一个 Calcit 转移。

宿主执行顺序是状态机返回的顺序。`release` 同时销毁 batch/device 并从句柄表移除；任意时刻只允许一个已安装 generation。Canvas 与 WebGPU 切换仍复用页面中的单一全屏 Canvas 节点。

## 验证

```sh
yarn test:device-recovery
yarn test:consumer
```

第一条严格检查该 namespace 的 22 个公开定义，并覆盖失败/回退/版本切换、迟到结果、关闭以及连续 100 次丢失重建；最终宿主模型 `live=0`。独立消费者合同再次只经 `app.main` 公共入口执行 100 次丢失并设置反例；浏览器若取得非软件 adapter，则主动模拟一次 loss，断言 generation 加一、资源版本不变、重新 ready 且句柄表仍为 1。没有可用硬件时必须保持 `instances-gpu` 选择、显示 Canvas 回退和失败原因，不能把 SKIP 当作硬件恢复通过。

## 边界

本切片覆盖一个矩形 instances 图层的 device generation 与实际 batch/device 释放，不是完整通用资源表。纹理、字体、图片、多个图层共享 device、容量淘汰、加载取消及失败退避仍由 #51 后续切片处理；跨设备恢复时延和 10k 独立运动也尚未形成性能结论。WebGPU 原生对象仍属于宿主，Calcit 状态只保存可序列化决策。
