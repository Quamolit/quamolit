# 通用资源生命周期：M2 #51 第二切片

`quamolit.resource-lifecycle` 用纯 Calcit 定义图片、纹理、几何、字体、字形、buffer 与 pipeline 共用的异步资源协议。它不保存 `Image`、GPU buffer 或 Promise 等宿主对象，只对可序列化的 logical identity、状态、generation 与动作负责；浏览器或渲染后端执行动作并在异步完成后回传结果。

## 数据与转换

- `ResourceIdentity {kind,id,version}`：稳定逻辑身份；`kind` 支持 `image/texture/geometry/font/glyph/buffer/pipeline`。
- `ResourcePhase`：`idle → loading → ready`，失败进入 `error(message)`，销毁进入 `closed`。
- `ResourceState`：保存当前 identity、generation、phase 与 attempts，可直接进入快照和测试报告。
- `request-resource`：相同 identity 的 `loading/ready` 幂等复用；失败重试或版本替换创建新 generation。替换时先发 `release(old)`，再发 `load(new)`。
- `resource-ready`：只有当前 `loading` generation 可进入 `ready`，依次发出 `install` 与 `wake-frame`。
- `resource-failed`：当前 generation 进入 `error`，发出 `release/show-error/wake-frame`。
- `close-resource`：使当前 generation 失效并释放宿主资源；重复关闭不重复释放。

迟到的成功或失败不会覆盖新版本和关闭状态，只产生幂等 `release(stale-generation)`。因此宿主无需用布尔量猜测哪个 Promise 最后完成。

## 宿主边界

宿主维护 `generation → native handle` 的表，并按顺序执行 `ResourceAction`：

1. `load` 创建/解码或上传候选资源；完成后调用 `resource-ready` 或 `resource-failed`。
2. `install` 把候选 generation 设为当前可绘制资源。
3. `release` 删除图片、buffer、pipeline 或后端组合资源；必须允许重复调用。
4. `wake-frame` 请求一次绘制；`show-error` 更新可见诊断。

协议刻意不规定 URL、缓存容量和原生句柄类型。URL 到 logical identity 的映射属于应用；宿主句柄绝不能进入 Calcit Scene/Model。

## 首个真实消费者

Folding Fan 不再用页面 JavaScript 的 `resource = "loading"` 布尔状态决定图片生命周期。`resource-initial` 从 Calcit 建立 `lotus@1`，页面仅通过 js-ffi 创建和解码 `ImageHost`、保存 generation 表，并执行 Calcit 动作。图片成功、失败、重试、卸载都会回到统一状态机；原有 24 切片与历史参考渲染保持逐像素一致。

验证命令：

```bash
yarn test:folding-fan
```

该命令覆盖严格 public schema、loading/ready/error、版本替换、迟到完成、失败重试、close、100 次替换 live generation 上界、真实图片失败重试，以及 DPR 1/2 历史像素零差异。

## 后续切片

- 在多资源 registry 上加入引用计数、容量与淘汰策略；本切片先固定单条资源请求的确定性协议。
- 将 WebGPU texture/buffer/pipeline 的创建与 device recovery 接到同一 logical identity；device generation 与资源 generation 仍需保持两个正交维度。
- 为字体和 glyph atlas 增加真实消费者，验证多个资源共同 ready 后只唤醒必要帧。
