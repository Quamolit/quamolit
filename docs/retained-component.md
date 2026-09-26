# Calcit 组件到保留计划：M2 #50 首个集成切片

`quamolit.retained-component` 直接消费 `quamolit.component-sample/ComponentRequest` 与声明函数，返回不可变的 `ComponentPlan`。声明、Motion 查找、槽位编译、采样与版本失效全部由 Calcit 实现；公共实现不导入手写 JS、不依赖测试编译产物，也不要求调用者提供 JS sampler Map。

## 使用合同

- `build-component-plan(request, declare)`：检查身份、时间与六类版本，调用声明函数一次，验证 Scene 和描述符，解析所有标量绑定并生成请求时间的首帧。
- `sample-plan-at(plan, time)`：只有时间变化时使用；支持负时间、乱序、倒放与重复。仅遍历预编译绑定槽位，通过持久列表更新对应节点，未绑定节点继续共享。
- `update-component-plan(plan, request, declare)`：同身份和完整版本下只采样；身份或任一版本变更时保守地重新声明和构建。调用者更换声明函数或 props 时必须提升 `component` 版本，Motion 改变提升 `motion` 版本。
- `(:scene plan)`：可交给现有 Canvas 参考或其他受支持消费者。旧计划/画面可以继续持有；声明、查找或采样失败不会修改旧计划。

以下片段中 `request` 和 `declare` 由应用提供，完整可编译示例见 `quamolit.test.retained-component-fixture/start`、`update-plan` 和 `draw-plan!`。

```cirru.no-check
let
    initial $ retained/build-component-plan request declare
    middle $ retained/sample-plan-at initial 0.5
    changed $ retained/update-component-plan middle next-request declare
  :scene changed
```

采用泛型 `ComponentRequest<P,M,I,R,V>`、具名 Struct 和 `struct-with` 批量字段更新。当前 Calcit 0.22 生成的节点和计划更新是带字段检查的 `withAt`；列表更新是类型化索引更新。它减少通用字段查找与连续更新的中间结构，但本切片不据此声称 FPS 或整帧加速。

## 验证与直观演示

```sh
yarn test:retained-component
yarn compile:retained-component
yarn vite --host 127.0.0.1 --port 5180
```

打开 `/test/retained-component.html`。左右分别使用同一 Calcit 声明的全量参考与保留计划，由现有 `quamolit.canvas-reference` 经 js-ffi 绘制。可以拖时间、按乱序时间按钮、在相同时间改变 Model/资源/视口，或点击“验证 1000 帧”。该按钮同步验证画面，会短暂占用页面线程；它不是实时帧率测试。

Node 验证初始帧加 1000 个更新时间：声明回调实际调用 1 次、计划构建 1 次、绑定采样/节点写入各 1001 次；全部 64 个静态节点和绑定槽位保持对象身份，逐帧与全量 Calcit 参考相等。另测六类版本和身份失效、重复时间跳过、无绑定场景、非法时间及缺失 Motion 时旧帧不受影响。

Chromium 验证两侧全部像素相同，另用独立期望检查 x/y/width、实色像素；1000 帧后参考声明 1001 次、保留声明 1 次。CI 的 `quamolit-retained-component-<run>` artifact 包含演示截图；源码交接不依赖临时本机截图。

## 计数与未完成范围

`declarations` / `plan-builds` 是构建次数；`binding-samples` / `node-writes` 按槽位计数，多字段绑定同一节点会多次写入；`skipped-updates` 记录同一时间和版本的重复请求。它们不统计所有底层分配、实际复制字节、draw call 或 GPU 上传。

本路径是 CPU 标量绑定的首个公共集成，版本变化仍整体重声明。暂未实现逐绑定版本依赖、增量拓扑、完整生命周期联动、GPU 计划和统一调度器。演示只绘制顶层矩形；现有 Canvas 参考不支持完整 group/clip/instances 语义。旧 JS `RetainedScenePlan` 及其夹具仍保留用于已有行为对照，不能称为已全部迁移。

#104 的独立安装与输出搬移已有[消费检验切片](isolated-consumer.md)；#39 的真实阶段耗时和 #49 的进入退出/重排演示仍需后续交付；这些切片不关闭 #50 或 M2。
