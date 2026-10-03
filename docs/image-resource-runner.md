# 图片资源任务 runner：M2 #51 第九切片

`quamolit.image-resource-runner` 把真实浏览器图片解码接入纯 Calcit 资源协议和[多资源加载任务队列](resource-load-queue.md)。它消费 js-ffi 已提供的类型化 `ImageHost`、`image-create`、`image-src!`、`image-decode!` 与尺寸读取，不增加 Quamolit 专属 JavaScript loader。

## 可恢复描述与所有权

- `ImageResourceDescriptor` 保存 logical identity、URL 和预期原始尺寸；Scene 仍只保存 `ImageSource {id,version,width,height}`，不包含 URL、Promise 或 DOM 句柄。
- `ImageResourceHandle` 只存在于宿主状态，绑定 resource generation、`ImageHost` 与 installed 状态。
- `ImageResourceHost` 记录候选句柄及 `created/released/live/decoded-bytes`；安装、替换和释放均由 Calcit 消费资源动作，不在 Scene 中保存句柄。
- `run-image-load-task!` 创建并解码图片，验证尺寸后返回带 queue token 的 ready/failed 结果。
- `complete-image-load` 先结算 queue token；accepted 才推进当前 `ResourceState`，discarded/unknown 只计入已创建并释放，不能复活迟到图片。

多图与共享租约使用同一个 `ResourceRegistry`、`ResourceLoadQueue` 和 `ImageResourceHost`：

- `enqueue-image-registry-actions` 复用既有队列的去重/背压；只处理 image 动作，其他资源 kind 留给对应 runner。
- `complete-image-registry-load` 校验 token 对应任务的完整 identity/generation，推进 registry 并执行宿主安装/释放；ready 的 `wake-frame` 仍由调用者接入既有调度器。同代不同图片可并存，安装一张不取消另一张的 installed 状态。
- `installed-image-resource(host, identity)` 精确查询图片；`apply-image-registry-actions` 按 `(kind,id,version,generation)` 释放，未知或过期 generation 不误伤其他图片。
- 最后 lease 归零只转 idle，重入复用；容量驱逐或 close 才释放。旧版本、已关闭 registry 或已取消 runtime 的迟到结果不能安装或唤醒；重放仍在 host 中的同一图片结果不重复计数/释放。

旧的单资源入口保留兼容，`release-image-generation` / `apply-image-actions` **只能用于单资源 host**；多图不要混用。release 动作不取消其他 generation 的队列任务：卸载时调用既有 `cancel-stale-device-loads`，版本替换后的旧任务即使完成，也由 registry 拒绝。没有另建资源层或任务队列。

HTMLImageElement 没有显式 destroy；本模块的 release 表示删除框架持有的最后强引用，让浏览器自行回收解码数据。`released` 是逻辑所有权证据，不冒充物理内存已经同步归零。

## Folding Fan 实际接入

Folding Fan 页面不再自行调用 `new Image`、维护 generation Map 或判断 ready/failure。页面只提供图片 URL、视口、时钟和 DOM；Calcit runner 负责队列、解码结果、尺寸合同、安装、错误与释放。原有 24 片 Scene 和历史 Canvas 绘制路径没有改变。

折扇已使用上述 registry 入口（容量为一张原始图片的 RGBA 字节数），不是另一个 loader。页面状态栏与 `window.foldingFanDemo.snapshot()` 暴露图片 host、queue 和 registry 指标。正常图片达到 `live=1 / leased=1`，页面关闭或版本替换后旧 identity/generation 释放；失败图片进入可见 error 且 `live=0`，重试先释放原 lease 再获取，引用不会递增泄漏。原有 24 片和中间帧像素合同保持不变。

## 验证与边界

`yarn test:folding-fan` 覆盖严格公共类型、异步解码 ABI 的 Node 宿主替身、成功、失败、尺寸不符、runtime generation 取消、两张同代图片与共享租约、idle 重入、未知 token、活动结果重放、错误身份/代次，以及单资源和 registry 各100次版本装卸。关闭后 `created=released=100、live=0`。真实 Chromium 保留折扇初始/中间/终点与 DPR1/2 整帧 RGBA 零差异、失败重试、统一 Canvas 卸载后的迟到隔离；不修改像素容差或基线。

当前交付的是 Canvas 图片宿主，不替代已存在的 WebGPU texture runner。实际看板的 font+image 联合出入、glyph/geometry/pipeline 缓存和 GPU fence-safe 释放仍待验收。released 结果的重复投递不保留无界历史去重表；指标按丢弃投递计数，不用它声明浏览器物理内存释放。
