# 图片资源任务 runner：M2 #51 第九切片

`quamolit.image-resource-runner` 把真实浏览器图片解码接入纯 Calcit 资源协议和[多资源加载任务队列](resource-load-queue.md)。它消费 js-ffi 已提供的类型化 `ImageHost`、`image-create`、`image-src!`、`image-decode!` 与尺寸读取，不增加 Quamolit 专属 JavaScript loader。

## 可恢复描述与所有权

- `ImageResourceDescriptor` 保存 logical identity、URL 和预期原始尺寸；Scene 仍只保存 `ImageSource {id,version,width,height}`，不包含 URL、Promise 或 DOM 句柄。
- `ImageResourceHandle` 只存在于宿主状态，绑定 resource generation、`ImageHost` 与 installed 状态。
- `ImageResourceHost` 记录候选句柄及 `created/released/live/decoded-bytes`；安装、替换和释放均由 Calcit 消费 `ResourceAction`。
- `run-image-load-task!` 创建并解码图片，验证尺寸后返回带 queue token 的 ready/failed 结果。
- `complete-image-load` 先结算 queue token；accepted 才推进当前 `ResourceState`，discarded/unknown 只计入已创建并释放，不能复活迟到图片。

HTMLImageElement 没有显式 destroy；本模块的 release 表示删除框架持有的最后强引用，让浏览器自行回收解码数据。`released` 是逻辑所有权证据，不冒充物理内存已经同步归零。

## Folding Fan 实际接入

Folding Fan 页面不再自行调用 `new Image`、维护 generation Map 或判断 ready/failure。页面只提供图片 URL、视口、时钟和 DOM；Calcit runner 负责队列、解码结果、尺寸合同、安装、错误与释放。原有 24 片 Scene 和历史 Canvas 绘制路径没有改变。

页面状态栏与 `window.foldingFanDemo.snapshot()` 暴露图片 host 和 queue 指标。正常图片达到 `live=1`，页面关闭或版本替换后旧 generation 释放；失败图片进入可见 error 且 `live=0`。

## 验证与边界

`yarn test:folding-fan` 覆盖 109/109 严格公共定义、真实异步解码 ABI 的 Node 宿主替身、成功、失败、尺寸不符、runtime generation 取消、100 次装卸，以及原有 5 项 Chromium 动画和逐像素回归。100 次装卸最终 `created=released=100、live=0`。

当前交付的是 Canvas 图片宿主，不是 WebGPU texture。texture 上传、sampler/bind group、device rebuild、font/glyph、geometry、pipeline 和 GPU fence-safe 释放仍由后续切片完成。
