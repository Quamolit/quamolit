# M1 声明式组件与动画 API 契约

对应 [#30](https://github.com/Quamolit/quamolit/issues/30) 与 [#176](https://github.com/Quamolit/quamolit/issues/176)，以 [计划 v3](plan-v3.md) 为当前执行约定。本文件规定用户可观察的语义和迁移边界；没有标为“已实现”的名称，均不得在下游当作可调用 API。“已实现”不等于稳定；稳定性以本页命名空间清单为准。

## 公共边界与 alpha 变更规则

- **稳定（alpha 合同）**：本轮只选 `quamolit.ui-motion` 的全部 11 个具备 schema 的公开定义。它们有纯函数数值合同、三个实际图表消费者和严格类型门禁；兼容承诺限 API 参数/返回类型与已声明语义，不涵盖未实现的 GPU lowering、完整 Scene 或资源能力。`docs/api-stable-contract.json` 固定真实 Calcit 查询得到的签名/类型；移除、改名、参数/Struct 字段改变均使门禁失败。
- **实验**：有可用切片，但边界仍可能变化；必须读相应文档的支持范围、临时 JsObject/宿主依赖和验收缺口。独立消费者目前大量使用实验接口，这是一项未完成事实，不因为它通过测试就把整个后端面标为稳定。
- **旧（迁移中）**：旧 Shape/on-tick/绘制期事件与早期平行入口，仅作为迁移参考。新的声明/组件不要继续导入它们。
- **内部**：应用/演示、配置、辅助实现与测试夹具不属于面向下游的 API；特别是生产路径不得反向导入 `quamolit.test.*`。

alpha 阶段也不静默破坏稳定合同。稳定 API 的破坏性修改须在独立 PR 说明实际消费者、变更前后签名/语义、迁移方案与新的 alpha 版本计划，并显式审查合同差异；更新合同文件不等于获准发布。增加定义同样须说明稳定性，不自动把 namespace 内的新增辅助函数视为公共保证。实验入口可以调整，但要更新对应文档和调用者；修复已有合同错误不等于允许改变语义测试的阈值。非 alpha 正式稳定承诺仍待后续发布验收，不假称当前版本已是正式发布。

`yarn check:api-inventory` 比对 Calcit 查询、显式分类、文档表格、文档文件和稳定签名。任意新 namespace（包括 examples/test）未标注、旧条目残留、重复分类或签名漂移都会失败，不用通配符自动接受。更新分类后用 `yarn update:api-inventory` 机械更新下表；它不会自动更新稳定合同。`node scripts/api-inventory.mjs --write-contract` 仅供经审查的初始化/合同迁移，必须检查差异及上述发布规则。

`yarn audit:consumer-api` 单独审计独立消费者的实际 import，非稳定入口会明确失败；本轮尚未把它加入必需 CI，因为现有消费者仍使用实验 API。Dynamic/JsObject 的全部显式声明由 [类型边界盘点](api-type-boundaries.md) 单独检查，开放宿主边界与语义迁移仍需逐项审查。#176 的“消费者和 README 只使用稳定入口”仍未完成，不以清单覆盖门禁代替。

产物归属：`docs/api-namespaces.json` 是人工维护的分类源，不标记 generated。`docs/api-stable-contract.json` 是只读 Calcit 查询生成的、刻意入库的兼容性审查基线，已精确标记 `linguist-generated`；否则 CI 没有可比较的已审查合同。本文只有清单标记之间的表格为生成内容，不把整篇人工契约文档或 `calcit.cirru` 标为 generated。测量报告与压缩样本另放被忽略的 `test-results/`，不混入 API 合同。

## 全部命名空间清单

类型合同不仅记录 Fn schema：Struct/Enum/Trait 的 schema 本身可能只是 `StructDef`/`EnumDef`/`Trait` 标签，因此同时冻结其真实字段、枚举或方法声明。`make-stagger` 参数使用的 `quamolit.motion/Easing` 也纳入类型合同；这不把整个 Motion namespace 的采样器升级为稳定。门禁还检查这些签名和类型声明引用的项目类型，包括嵌套引用：新增类型必须加入合同，不能只冻结类型名称而遗漏字段、枚举项或方法签名。

<!-- api-inventory:start -->
全部 118 个项目命名空间（包含旧应用、示例和测试）；分类由 `docs/api-namespaces.json` 显式维护，不按前缀自动批准新增命名空间。

| 命名空间 | 稳定性 | 用途 | 替代入口 | 文档/示例 |
| --- | --- | --- | --- | --- |
| `quamolit.$meta` | 内部 | 项目配置、旧宿主辅助与 bootstrap；不供下游组成新动画运行时 | — | [说明](../AGENTS.md) |
| `quamolit.alias` | 旧（迁移中） | 旧组件/Shape DSL、逐帧更新与绘制期事件；仅保留迁移，不新增依赖 | quamolit.retained-component / quamolit.scene-ir / quamolit.scene-hit（实验） | [说明](../docs/api-contract.md) |
| `quamolit.app.comp.binary-tree` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.clock` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.code-table` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.container` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.digits` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.drag-demo` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.file-card` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.finder` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.folder` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.folding-fan` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.icon-increase` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.icon-play` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.icons-table` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.portal` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.raindrop` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.raining` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.ring` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.solar` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.task` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.task-toggler` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.comp.todolist` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.main` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.schema` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.app.updater` | 旧（迁移中） | 历史应用与原始动画参考；实际恢复入口改用 examples，不代表旧 app 已通过最新类型/浏览器验收 | quamolit.examples.*（内部示例；不是库 API） | [说明](../docs/demo-restoration.md) |
| `quamolit.bootstrap` | 内部 | 项目配置、旧宿主辅助与 bootstrap；不供下游组成新动画运行时 | — | [说明](../AGENTS.md) |
| `quamolit.canvas-images` | 实验 | Canvas 图片 Scene 参考 | — | [说明](../docs/webgpu-scene-images.md) |
| `quamolit.canvas-reference` | 实验 | 受限矩形/实例 Canvas 参考 | — | [说明](../docs/canvas-instances-reference.md) |
| `quamolit.canvas-scene` | 实验 | 完整层 Canvas Scene 遍历与隔离 | — | [说明](../docs/layered-dashboard.md) |
| `quamolit.canvas-strokes` | 实验 | 线段/折线 Canvas 参考 | — | [说明](../docs/binary-tree-restoration.md) |
| `quamolit.comp.debug` | 旧（迁移中） | 旧组件/Shape DSL、逐帧更新与绘制期事件；仅保留迁移，不新增依赖 | quamolit.retained-component / quamolit.scene-ir / quamolit.scene-hit（实验） | [说明](../docs/api-contract.md) |
| `quamolit.comp.fade-in-out` | 旧（迁移中） | 旧组件/Shape DSL、逐帧更新与绘制期事件；仅保留迁移，不新增依赖 | quamolit.retained-component / quamolit.scene-ir / quamolit.scene-hit（实验） | [说明](../docs/api-contract.md) |
| `quamolit.comp.slider` | 旧（迁移中） | 旧组件/Shape DSL、逐帧更新与绘制期事件；仅保留迁移，不新增依赖 | quamolit.retained-component / quamolit.scene-ir / quamolit.scene-hit（实验） | [说明](../docs/api-contract.md) |
| `quamolit.component-sample` | 实验 | 组件请求与全量直接采样声明 | quamolit.retained-component（执行入口，仍实验） | [说明](../docs/component-sample.md) |
| `quamolit.config` | 内部 | 项目配置、旧宿主辅助与 bootstrap；不供下游组成新动画运行时 | — | [说明](../AGENTS.md) |
| `quamolit.controller.resolve` | 旧（迁移中） | 旧组件/Shape DSL、逐帧更新与绘制期事件；仅保留迁移，不新增依赖 | quamolit.retained-component / quamolit.scene-ir / quamolit.scene-hit（实验） | [说明](../docs/api-contract.md) |
| `quamolit.core` | 旧（迁移中） | 旧组件/Shape DSL、逐帧更新与绘制期事件；仅保留迁移，不新增依赖 | quamolit.retained-component / quamolit.scene-ir / quamolit.scene-hit（实验） | [说明](../docs/api-contract.md) |
| `quamolit.cursor` | 旧（迁移中） | 旧组件/Shape DSL、逐帧更新与绘制期事件；仅保留迁移，不新增依赖 | quamolit.retained-component / quamolit.scene-ir / quamolit.scene-hit（实验） | [说明](../docs/api-contract.md) |
| `quamolit.device-recovery` | 实验 | 单层设备恢复 generation 决策 | — | [说明](../docs/device-recovery.md) |
| `quamolit.direct-frame` | 实验 | 显式版本的任意时间直接采样 | — | [说明](../docs/direct-frame-sampling.md) |
| `quamolit.examples.binary-tree` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.clock` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.cohort-pulse` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.curve` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.drag-demo` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.finder` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.folding-fan` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.icons` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.layer-composition` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.layered-dashboard` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.raining` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.signal-weave` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.solar` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.table` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.tidal-bloom` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.examples.todolist` | 内部 | 演示自己的 Model、几何与入口；应导入库 API，不能由库反向依赖 | — | [说明](../demos/README.md) |
| `quamolit.fixed-step` | 实验 | 历史状态固定 tick 推进 | — | [说明](../docs/fixed-step-simulation.md) |
| `quamolit.frame-clock` | 旧（迁移中） | 旧顺序帧的显式时钟 | quamolit.host-clock（实验） | [说明](../docs/frame-evaluation.md) |
| `quamolit.frame-eval` | 旧（迁移中） | initial-frame/evaluate-at 顺序求值桥梁 | quamolit.direct-frame / quamolit.retained-component（实验） | [说明](../docs/frame-evaluation.md) |
| `quamolit.global` | 旧（迁移中） | 旧组件/Shape DSL、逐帧更新与绘制期事件；仅保留迁移，不新增依赖 | quamolit.retained-component / quamolit.scene-ir / quamolit.scene-hit（实验） | [说明](../docs/api-contract.md) |
| `quamolit.gpu-component` | 实验 | 公共计划到 GPU 矩形批次 | — | [说明](../docs/gpu-component-plan.md) |
| `quamolit.gpu-scalar-program` | 实验 | 标量 Motion 参数与 shader 子集 | — | [说明](../docs/gpu-scalar-program.md) |
| `quamolit.gpu-vec2-translation` | 实验 | 二维平移 GPU 采样参数 | — | [说明](../docs/gpu-vec2-motion.md) |
| `quamolit.host-clock` | 实验 | 宿主秒到显式动画时间映射 | — | [说明](../docs/host-clock.md) |
| `quamolit.hud-logs` | 旧（迁移中） | 旧组件/Shape DSL、逐帧更新与绘制期事件；仅保留迁移，不新增依赖 | quamolit.retained-component / quamolit.scene-ir / quamolit.scene-hit（实验） | [说明](../docs/api-contract.md) |
| `quamolit.image-resource-runner` | 实验 | Canvas 图片异步加载执行器 | — | [说明](../docs/image-resource-runner.md) |
| `quamolit.instance-ffi` | 实验 | 类型化实例宿主边界与指标 | — | [说明](../docs/instance-sources.md) |
| `quamolit.instance-gpu` | 实验 | 版本化实例源的 GPU 差量上传 | — | [说明](../docs/instance-gpu-upload.md) |
| `quamolit.instance-resource` | 实验 | 实例源快照与脏区资源表 | — | [说明](../docs/instance-resource-table.md) |
| `quamolit.layers` | 实验 | Canvas UI 与实例层的统一时钟/DPR/层序/命中/后端契约 | — | [说明](../docs/layer-composition.md) |
| `quamolit.math` | 内部 | 项目配置、旧宿主辅助与 bootstrap；不供下游组成新动画运行时 | — | [说明](../AGENTS.md) |
| `quamolit.motion` | 实验 | 标准 Motion 类型和 CPU 数值参考 | — | [说明](../docs/motion-scalar.md) |
| `quamolit.motion-cpu` | 实验 | 泛型 CPU-only 纯函数扩展 | — | [说明](../docs/cpu-motion-extension.md) |
| `quamolit.motion-gpu` | 实验 | GPU Motion 候选能力分类 | — | [说明](../docs/motion-gpu-contract.md) |
| `quamolit.playback` | 实验 | 直接帧与固定 tick 的时钟桥梁 | — | [说明](../docs/playback-boundary.md) |
| `quamolit.presence` | 实验 | Scene 稳定 key 与逻辑进入退出 | — | [说明](../docs/presence-lifecycle.md) |
| `quamolit.presence-component` | 实验 | Presence 到组件声明连接 | — | [说明](../docs/presence-component.md) |
| `quamolit.presence-device-coordinator` | 实验 | 设备安装与 registry rebuild 协调 | — | [说明](../docs/presence-device-coordinator.md) |
| `quamolit.presence-resource-registry` | 实验 | Presence 实例资源 lease | — | [说明](../docs/presence-resources.md) |
| `quamolit.presence-webgpu-resources` | 实验 | Presence GPU batch 队列化执行 | — | [说明](../docs/presence-webgpu-resources.md) |
| `quamolit.render.element` | 旧（迁移中） | 旧组件/Shape DSL、逐帧更新与绘制期事件；仅保留迁移，不新增依赖 | quamolit.retained-component / quamolit.scene-ir / quamolit.scene-hit（实验） | [说明](../docs/api-contract.md) |
| `quamolit.render.paint` | 旧（迁移中） | 旧组件/Shape DSL、逐帧更新与绘制期事件；仅保留迁移，不新增依赖 | quamolit.retained-component / quamolit.scene-ir / quamolit.scene-hit（实验） | [说明](../docs/api-contract.md) |
| `quamolit.replay-archive` | 实验 | 输入日志与有界检查点回放 | — | [说明](../docs/replay-archive.md) |
| `quamolit.resource-lifecycle` | 实验 | 通用资源身份/generation/LRU 状态机 | — | [说明](../docs/resource-lifecycle.md) |
| `quamolit.resource-load-queue` | 实验 | 有界异步加载队列与取消 | — | [说明](../docs/resource-load-queue.md) |
| `quamolit.retained-component` | 实验 | 统一组件保留计划构建/更新/绘制 | — | [说明](../docs/retained-component.md) |
| `quamolit.retained-path` | 旧（迁移中） | 早期独立路径保留计划；不发展平行运行时 | quamolit.retained-component（实验） | [说明](../docs/retained-component.md) |
| `quamolit.retained-scene` | 实验 | Scene 静态编译与按需帧计划 | — | [说明](../docs/retained-scene-plan.md) |
| `quamolit.scene-binding` | 实验 | 标量绑定的全量参考解析 | — | [说明](../docs/scene-binding.md) |
| `quamolit.scene-diff` | 实验 | 逻辑身份索引与参考差分 | — | [说明](../docs/scene-diff.md) |
| `quamolit.scene-hit` | 实验 | 绘制外的命中编译与逆层序查询 | — | [说明](../docs/scene-ir-core.md) |
| `quamolit.scene-ir` | 实验 | 可序列化 Scene/资源/交互类型 | — | [说明](../docs/scene-ir-core.md) |
| `quamolit.scene-pointer` | 实验 | 指针捕获/冒泡纯状态机 | — | [说明](../docs/scene-pointer.md) |
| `quamolit.scene-pointer-browser` | 实验 | 类型化浏览器 PointerEvent 连接 | — | [说明](../docs/scene-pointer.md) |
| `quamolit.test.component-fixture` | 内部 | 测试夹具与独立期望；生产消费者不得导入 | — | [说明](../test/README.md) |
| `quamolit.test.cpu-motion-fixture` | 内部 | 测试夹具与独立期望；生产消费者不得导入 | — | [说明](../test/README.md) |
| `quamolit.test.fade-migration-fixture` | 内部 | 测试夹具与独立期望；生产消费者不得导入 | — | [说明](../test/README.md) |
| `quamolit.test.frame-fixture` | 内部 | 测试夹具与独立期望；生产消费者不得导入 | — | [说明](../test/README.md) |
| `quamolit.test.gpu-component-fixture` | 内部 | 测试夹具与独立期望；生产消费者不得导入 | — | [说明](../test/README.md) |
| `quamolit.test.motion-fixture` | 内部 | 测试夹具与独立期望；生产消费者不得导入 | — | [说明](../test/README.md) |
| `quamolit.test.playback-fixture` | 内部 | 测试夹具与独立期望；生产消费者不得导入 | — | [说明](../test/README.md) |
| `quamolit.test.replay-archive-fixture` | 内部 | 测试夹具与独立期望；生产消费者不得导入 | — | [说明](../test/README.md) |
| `quamolit.test.retained-component-fixture` | 内部 | 测试夹具与独立期望；生产消费者不得导入 | — | [说明](../test/README.md) |
| `quamolit.test.scene-hit-fixture` | 内部 | 测试夹具与独立期望；生产消费者不得导入 | — | [说明](../test/README.md) |
| `quamolit.test.scene-pointer-browser-fixture` | 内部 | 测试夹具与独立期望；生产消费者不得导入 | — | [说明](../test/README.md) |
| `quamolit.transition` | 实验 | 位置连续打断与事件重放 | — | [说明](../docs/transition-interruption.md) |
| `quamolit.types` | 旧（迁移中） | 旧组件/Shape DSL、逐帧更新与绘制期事件；仅保留迁移，不新增依赖 | quamolit.retained-component / quamolit.scene-ir / quamolit.scene-hit（实验） | [说明](../docs/api-contract.md) |
| `quamolit.ui-motion` | 稳定（alpha 合同） | 纯 Calcit UI 渐变构件；alpha 合同限当前 11 个公开定义，不承诺 GPU lowering 或资源生命周期 | — | [说明](../docs/ui-motion-components.md) |
| `quamolit.util.detect` | 内部 | 项目配置、旧宿主辅助与 bootstrap；不供下游组成新动画运行时 | — | [说明](../AGENTS.md) |
| `quamolit.util.keyboard` | 内部 | 项目配置、旧宿主辅助与 bootstrap；不供下游组成新动画运行时 | — | [说明](../AGENTS.md) |
| `quamolit.util.ref` | 内部 | 项目配置、旧宿主辅助与 bootstrap；不供下游组成新动画运行时 | — | [说明](../AGENTS.md) |
| `quamolit.util.string` | 内部 | 项目配置、旧宿主辅助与 bootstrap；不供下游组成新动画运行时 | — | [说明](../AGENTS.md) |
| `quamolit.util.time` | 内部 | 项目配置、旧宿主辅助与 bootstrap；不供下游组成新动画运行时 | — | [说明](../AGENTS.md) |
| `quamolit.webgpu-batches` | 实验 | 矩形实例 GPU 句柄与绘制边界 | — | [说明](../docs/webgpu-instances.md) |
| `quamolit.webgpu-capabilities` | 实验 | 设备获取/丢失能力诊断 | — | [说明](../docs/webgpu-capability-probe.md) |
| `quamolit.webgpu-images` | 实验 | 受限图片层 GPU 与完整回退判定 | — | [说明](../docs/webgpu-scene-images.md) |
| `quamolit.webgpu-texture-runner` | 实验 | WebGPU texture 资源 loader | — | [说明](../docs/webgpu-texture-runner.md) |
<!-- api-inventory:end -->

## 能力状态与边界

| 能力 | 状态 | 当前证据或后续负责项 |
| --- | --- | --- |
| `initial-frame` / `evaluate-at` 和泛型 `EvaluatedFrame<M,S>` | 已实现；顺序帧求值 | [显式帧求值](frame-evaluation.md)、`yarn test:clock`、`yarn compile:visual` |
| `tick-tree` / `paint-tree-only-with` | 已实现；旧树迁移桥梁 | [确定性帧测试](../test/README.md) |
| `defcomp` / `on-tick` / `fade` 缓存 | 兼容旧组件写法；不承诺新架构语义 | 旧入口未恢复，不应据 bootstrap 编译推断可用 |
| `quamolit.direct-frame/sample-at`、`resample-at` | 已实现的实验性泛型 CPU 直接采样；非组件声明入口 | [直接采样](direct-frame-sampling.md)；显式请求与依赖版本，#31 已关闭 |
| `quamolit.component-sample/sample-component-at`、`resample-component-at` 及宿主时间变体 | 已实现的实验性声明式组件 CPU 入口；非保留执行计划 | [组件直接采样](component-sample.md)；纯组件声明返回 Scene 与 Motion 描述；保留执行使用下一行 |
| `quamolit.retained-component/build-execution-plan`、`update-execution-plan`、`sample-plan-at` | 已实现的实验性统一声明/保留执行入口，不另建草案 `sample-at` | [保留组件](retained-component.md)、[Presence 连接](presence-component.md)、[独立消费者](isolated-consumer.md)；完整增量与后端验收仍归 #50/#104 |
| `quamolit.motion/sample-scalar`、`sample-vec2`、`sample-track`、`sample-color`、`sample-scalar-composition` | 已实现的实验性内部 CPU 参考切片；非公共组件入口 | [Motion 数值与浏览器验证](motion-scalar.md)、#48 的局部进展 |
| `CpuScalarDescriptor`、`CpuScalarRegistry`、`register-cpu-scalar`、`sample-cpu-scalar` | 已实现的实验性 CPU-only 标量扩展切片；非组件公共入口 | 描述符仅保存回调 ID，注册表不参与序列化，GPU 明确为 `unsupported`；[Motion 数值与浏览器验证](motion-scalar.md) |
| `quamolit.motion-cpu/CpuFunctionRequest<I>`、`CpuFunctionRegistry<I,O>`、`sample-function`、`resample-function` | 已实现的实验性泛型 CPU-only 扩展切片；非组件公共入口 | 显式输入/输出校验和六类依赖版本；Vec2 浏览器夹具通过，回调本身不序列化；[泛型 CPU 扩展](cpu-motion-extension.md) |
| `step-simulation(state, tick, inputs)` | 拟议独立入口；固定步长历史模拟 | #31；不与 `sample-at` 混用 |
| `quamolit.fixed-step/start-simulation`、`step-simulation`、`advance-simulation` | 已实现的实验性泛型 CPU 状态推进切片；显式 tick/输入日志/追帧预算 | [固定步长模拟](fixed-step-simulation.md)；时间映射由独立时钟提供，尚无组件公共入口 |
| `quamolit.replay-archive/start-archive`、`record-input`、`sample-archive-at`、`reset-archive` | 已实现的实验性 CPU 输入日志与有界检查点策略；非持久化宿主存储 | [固定 tick 回放档案](replay-archive.md)；完整日志保留、旧 tick 重放受预算限制，不是生产调度器 |
| `quamolit.playback/sample-archive-at-host` | 已实现的实验性宿主时间到回放档案桥梁 | 暂停/seek 映射到固定 tick 后从保留检查点重放；不隐式反向积分；[回放档案](replay-archive.md) |
| `quamolit.host-clock/start-clock`、`sample-clock`、暂停/变速/seek 与 `simulation-tick-at` | 已实现的实验性纯函数时间映射切片；非宿主循环 | [宿主时间映射](host-clock.md)；调用方提供单调宿主秒数，模拟倒退仍需检查点 |
| `quamolit.scene-ir/SceneDocument`、`SceneNode`、`validate-scene` | 已实现的实验性可序列化核心切片；非生产绘制入口 | [Scene IR 核心](scene-ir-core.md)；group/rect/实例源、校验和 JSON 夹具；参考变更集见下行 |
| `InstanceSourceRegistry`（JS 宿主适配器） | 已实现的版本化坐标快照边界；非资源表或 GPU 上传器 | [实例数据源边界](instance-sources.md)；js-ffi 0.1.38 保留通用 Float32 快照 |
| `CanvasInstanceBatches`（JS 薄适配器） | 已实现的 Canvas 实例批次正确性路径；非 GPU/自动合批 | [Canvas 实例批次](canvas-instance-batches.md)；Quamolit 自有矩形批次宿主与 Calcit 指标类型，js-ffi 提供原生 Canvas/TypedArray 能力；指标区分 FFI 与 `fillRect` |
| `WebGpuInstanceBatches`（JS 薄适配器） | 已实现的 10k 矩形实例 GPU 切片；非完整 Scene 后端 | [WebGPU 实例切片](webgpu-instances.md)；`quamolit.webgpu-batches` 自有 Calcit 类型与矩形宿主，一次 instanced draw 并支持 [Vec2 时间平移](gpu-vec2-motion.md)，强制无 GPU/软件 adapter 时整层 Canvas 回退 |
| `quamolit.scene-diff/index-scene`、`diff-scene`、`SceneDelta` | 已实现的逻辑身份与 O(n²) 参考差分；非生产调度器 | [Scene diff](scene-diff.md)；重排保身份、重挂载、分类和时间独立标记；#50 执行计划未完成 |
| `quamolit.scene-binding/resolve-scene` | 已实现的绝对时间 CPU 标量绑定参考解析；非增量执行入口 | [Scene 绑定解析](scene-binding.md)；精确 ID/version、输出再校验、浏览器中间帧；#50 执行计划未完成 |
| `quamolit.transition/start-transition`、`interrupt-transition`、`sample-replay` | 已实现的位置连续打断与固定事件重放 CPU 切片；非完整生命周期 | [打断过渡](transition-interruption.md)；25%/50%/75% 打断及浏览器帧；Scene enter/exit 参考见下行 |
| `quamolit.ui-motion/tween-at`、`stagger-at`、`morph-number`、`presence-frame` | 已实现的图表 UI 公共动画构件；纯 Calcit、无宿主状态 | [图表 UI 动画构件](ui-motion-components.md)；三个作品实际消费，Canvas/WebGPU 资源生命周期仍在下层 |
| `quamolit.resource-lifecycle` 的单资源状态机、`ResourceRegistry`、`rebuild-registry` | 已实现的纯 Calcit 通用异步资源状态、共享引用、有界 LRU 与 device rebuild 协议 | [通用资源生命周期](resource-lifecycle.md)、[多资源注册表](resource-registry.md)；支持完整身份动作、迟到结果隔离、active 重建与 idle 清除；非实例资源的实际 GPU 宿主仍待接入 |
| `quamolit.resource-load-queue` | 已实现的纯 Calcit 有界多资源加载调度；非宿主 loader | [多资源加载任务队列](resource-load-queue.md)；支持优先级、FIFO、去重、并发/pending 背压、资源/device 取消与迟到结果判定；实际接入 Presence buffer 与 Canvas 图片 |
| `quamolit.image-resource-runner` | 已实现的 Calcit Canvas 图片宿主 loader | [图片资源任务 runner](image-resource-runner.md)；真实 `ImageHost` 解码、尺寸验证、统一队列、generation 安装/释放和计数；不是 WebGPU texture |
| `quamolit.webgpu-texture-runner` | 已实现的 Calcit WebGPU texture loader | [WebGPU texture 资源 runner](webgpu-texture-runner.md)；真实图片解码、GPUTexture 上传、registry/queue、两代 device 重建、读回与释放；原生 API 临时 inline 等待 js-ffi #151 |
| `quamolit.webgpu-images` | 实验性图片/组变换/轴对齐矩形裁剪、完整图层后端判定与单资源 runtime | [Scene 图片绘制](webgpu-scene-images.md)；Calcit 预检、累计矩阵与嵌套窗口求交、`render-decision` 和资源编排；混合文字/折线图层走 Canvas；仅 macOS/Metal 验证，GPU 混合节点/旋转裁剪/隔离组透明度未支持 |
| `quamolit.presence/start-presence`、`reconcile-presence`、`sample-presence`、`settle-presence` | 已实现的 Scene 逻辑实例生命周期参考；非宿主资源管理器 | [进入退出](presence-lifecycle.md)；重排、fade、重入、一次性逻辑释放通知；#34/#51 宿主清理未完成 |
| `PresenceInstanceResources`（JS 宿主适配器） | 已实现的 instances Float32 快照所有权；非通用资源表 | [Presence 宿主资源跟踪](presence-resources.md)；退出期间保留、终点最后引用释放、100 次装卸计数回基线；GPU/指针捕获未覆盖 |
| `quamolit.presence-resource-registry` / `quamolit.presence-device-coordinator` / `quamolit.presence-webgpu-resources` | 已实现的 Presence 实例资源 lease、device/registry 组合恢复、队列化异步 runner 与 Calcit WebGPU 宿主；当前限矩形 instances | [Presence device 组合状态机](presence-device-coordinator.md)、[异步资源任务 runner](presence-resource-runner.md)、[多资源加载任务队列](resource-load-queue.md)、[Presence WebGPU 资源宿主](presence-webgpu-resources.md)；新 device 安装后自动重建 active lease，Promise 结果先经 token 结算再提交最新 state，异常/迟到 batch 安全清理 |
| `quamolit.device-recovery` 的 `RecoveryState` / `RecoveryTransition` | 已实现的单图层 device generation 恢复协议；非完整资源表 | [device loss 恢复](device-recovery.md)；纯 Calcit 决策、迟到结果隔离、Canvas 回退、同版本自动重建与实际 batch/device 释放 |
| 完整 Scene IR / 完整 Motion IR / 执行计划 | 拟议、尚未实现 | #32/#48/#50；现有切片不持有 DOM/GPU 句柄 |
| 完整 WebGPU/Canvas2D 双后端、资源表、命中索引 | 矩形实例与实验性纯图片 GPU 切片可运行；完整能力尚未实现 | #40/#33/#51/#34 |

`evaluate-at` 不是新的 `quamolit.direct-frame/sample-at`：前者从上一帧按非倒退时间更新模型，相同时间直接复用旧场景；它既不能任意乱序求值，也不会在相同时间但资源/模型改变时自动刷新。新的 Calcit CPU 切片可以直接乱序求值，并通过显式版本使相同时间的依赖变更失效，但还不是组件公共入口。应用不得用“先把历史跑一遍”的隐藏全局状态伪装成直接采样。

## 输入、输出与所有权

声明式组件的拟议形状是纯函数 `component(props, model, resources) -> declaration`。`props` 是父组件显式传入的不可变配置；`model` 是应用拥有的逻辑状态，含目标、起点、过渡参数、模拟 tick/seed 和需要重放的输入；`resources` 是只读的逻辑资源快照，按 ID/version 暴露 `loading|ready|error`。组件不读取墙上时间、Canvas 上下文、GPU 句柄或宿主全局 atom，也不在求值时启动加载。用户事件进入应用 update，先得到新 Model，再请求场景更新。

普通时间动画由 `sample-at` 读取 Motion 描述、显式参数和绝对时间，返回带类型的值。相同三元输入必得相同输出；求值不写 Model。历史相关算法只进入 `step-simulation`：调用方提供固定 `dt`、单调整数 tick、该 tick 的输入与 seed，推进后保存状态/检查点。两个入口可在一帧的不同绑定上并存，但不能把模拟的上次状态藏进直接采样描述。宿主时钟到动画时间的暂停、速度、seek 变换由显式 clock 层完成。

资源加载完成、出错或替换会递增该 ID 的版本并请求新帧；不能只因 `time` 相同而复用旧结果。输入、应用 Model、viewport、DPR、画质、Motion/Scene 描述版本变化也各有可观察的失效信号。缓存键至少覆盖被缓存输出实际读取的依赖；未知 CPU 闭包捕获不得被框架猜成纯缓存依赖。绘制是消费既定场景的操作，不推进逻辑状态、不建事件区域、不隐式触发加载。

例如 `t=0.5` 时字形资源从 `loading@1` 变为 `ready@2`，新画面必须出现字形；`time` 没变化不是跳过更新的理由。反例：同样的完整输入连续请求两次，允许复用场景和宿主资源，但不得多推进一次模拟 tick。

## 数值、空间与颜色语义

- 时间统一为秒。拟议 `sample-at` 接受任意有限实数时间，包括动画开始之前的负时间；标准区间动画在起点前取起点值、终点后取终点值，`duration=0` 作为在 `start` 处瞬时切换。NaN/Infinity、负 duration 和非法关键帧在构造或求值时明确报错，不能悄悄变成零。`step-simulation` 的 tick 是非负整数，倒退必须显式恢复检查点或重置，不在一次调用中隐式逆算。
- 逻辑空间以 CSS px 为单位，原点左上，x 向右、y 向下。viewport 给出逻辑宽高，DPR 决定实际像素尺寸。变换先按声明的父到子矩阵组合；具体矩阵布局由 #32 固定，API 不暴露后端 buffer 布局。Canvas 坐标系中正角度视觉上顺时针；公共角度单位为弧度。例：`π/2` 旋转四分之一圈，传入 90 不会自动当成角度制。
- 颜色输入以带 alpha 的 sRGB 值表达；标准颜色渐变默认在线性 sRGB 中插值，再编码到目标输出色域。透明度统一为 `[0,1]`；非法值报错，不用静默截断掩盖数据错误。合成使用预乘 alpha 的 `source-over`，但 Model 和公共颜色值保持直通道 RGBA，预乘发生在执行边界。例：透明红到透明蓝的中点不能直接把两个预乘零值当成可见紫色；透明端点的隐藏 RGB 仍由描述保留。Canvas2D 与 WebGPU 的颜色/抗锯齿差异按 fixture 容差验证，不承诺逐位相同。
- 子节点声明顺序即默认绘制顺序，后面的节点画在前面；透明节点不能为合批任意重排。组 opacity 对整个子场景隔离后合成一次，不能对子节点逐一相乘冒充；嵌套裁剪取交集。例：组内两个重叠半透明形状，在组 opacity=0.5 时，重叠处不应因为各自又叠加一次而变深。组隔离和复杂裁剪由 #53 完整实现；本条是目标语义，不声称当前 Canvas 参考已经支持。
- 命中测试与绘制分离，以最终可见层序的逆序选择最高的可交互目标，并受变换和裁剪限制。opacity=0 本身不自动取消命中，交互开关需显式声明；退出动画期间是否可交互由生命周期策略显式决定。捕获后的指针事件先交给捕获目标，卸载时释放捕获。此处是 #34 的合同，当前旧绘制时收集事件区域并不满足它。

## 身份、生命周期与扩展

兄弟节点的显式 key 在同一父级作用域内唯一；逻辑身份由父级身份、key 和组件/节点类型共同确定。重排不改变身份；同一父级的重复 key 报可诊断错误；换父级或换类型视为旧节点退出、新节点进入。无 key 的静态单子节点可由实现给局部身份，但可重排列表必须提供稳定 key，不能用当前数组下标代替数据身份。逻辑 key 不等于 GPU buffer slot；后者可以压缩和重用，不改变用户可见生命周期。

过渡 Model 保存 `from/to/start/duration/easing` 等意图。目标在 `t=0.5` 打断时，先按旧意图取 `t=0.5` 的当前值，作为新过渡 `from`，以保证位置连续；[CPU 参考切片](transition-interruption.md)已实现并由浏览器验证。速度连续是另一个需明确声明的模式，不能混称。删除节点进入 `exit`，保留其展示数据直到退出结束再释放资源；同 key 重入、父级卸载与重复退出只执行一次的细则仍由 #49 落实。现有 fade 缓存的 `0.01` 残留 opacity 不应成为新生命周期合同。

标准 Motion 描述是可检查、可序列化的数据，后端可识别其中明确的 GPU 子集。任意 Calcit 纯函数只能经注册的 CPU 扩展点求值，并显式声明输入依赖、输出类型与失败行为；它不能自动转成 WGSL，也不能塞入需要序列化的 Scene IR。普通组件无需了解 GPU；大量同类数据可用一个 `instances` 逻辑图层表达，数据源通过版本化引用或显式脏范围更新。

## 迁移对照与可编译入口

### 旧入口弃用计划

旧 `quamolit.render.paint/paint`、`tick-tree`、`paint-tree-only-with` 不再作为新应用推荐入口，但本轮不删除，也没有凭空设定移除日期。迁移到 `quamolit.retained-component` 的显式 request/build/update/draw，并将时间/Model/资源版本纳入请求；它仍为实验入口，先验证同一画面与交互，再改依赖。绝对时间 UI 渐变优先使用稳定的 `quamolit.ui-motion`，有历史模拟则使用实验 `fixed-step`，不能把两者混用。

移除旧入口的前置条件：#176 给出实际消费者清单与可编译迁移例；#36 完成真实应用/原始示例替代；相关 #34/#51 的事件与释放合同有证据；新的 alpha tag 附迁移说明并让下游先验证。满足条件后另提移除 PR，未满足前不得把旧库删除当作完成迁移。此前 README 的旧 DSL 代码块只作历史参考，不是新的稳定示例。

| 旧写法 | 当前可执行桥梁 | 拟议新位置 |
| --- | --- | --- |
| `defcomp` 生成带 `on-tick` 的 Shape | 保留纯视图；用 `initial-frame` / `evaluate-at` 把模型更新移出绘制 | `component(props, model, resources)` 返回声明，#32 降为 Scene IR |
| `on-tick(elapsed, dispatch!)` 积分 | `evaluate-at` 的 `update-model(model, FrameSample)` 仅按给定顺序推进 | 无历史动画转 `sample-at`；有历史状态转固定步长 `step-simulation` |
| fade 内部 opacity/stage 缓存 | [可编译迁移夹具](fade-migration.md)：Model 保存过渡意图与阶段，Motion 描述绑定 Scene opacity；不依赖画笔调用次数 | #49 的 enter/present/exit 与宿主释放继续分离验收 |
| 在绘制时登记事件区域/资源 | 兼容旧入口仅用于迁移 | Scene IR 事件目标、资源 ID/version，独立命中/资源表 |

下面是**已实现且由仓库入口编译**的最小迁移例子，不是拟议 `sample-at` 的示例。`quamolit.test.frame-fixture/update-progress`、`scene` 和 `main!` 位于 `calcit.cirru`；`yarn compile:visual` 编译该入口，`yarn test:clock` 验证泛型求值及重放，`yarn test:visual` 在 Chromium 检查矩形中间帧：

```cirru
defn update-progress (model sample)
  + model $ :elapsed sample

defn scene (progress)
  rect $ {} (:w 48) (:h 48) (:y 80) (:fill-style |#ec4899)
    :x $ + 48 $ * 160 progress

let
    start $ initial-frame 0 0 scene
    half $ evaluate-at start 0.5 update-progress scene
  :scene half
```

这里用 `let` 展示调用关系；可编译源入口以 `calcit.cirru` 内的函数 schema、namespace import、`reset-fixture!` 和 `step-fixture!` 为准，详见 [显式帧求值](frame-evaluation.md)。上述 `half` 的模型为 `0.5`、矩形中心 `x=128`；在 `t=0.5` 但资源版本变化时，必须显式重建 `initial-frame`，当前 `evaluate-at` 不会自动失效。新的 [直接采样切片](direct-frame-sampling.md) 已支持 `t=[1,0,0.5,0.25,1]` 和同时间版本失效；#48 的完整 Motion IR 和 #49 的 fade 生命周期仍另行按各自 issue 验收。

## 设计选择与不选方案

保留应用 Model 中的动画意图，才能直接采样、截图、重放和跨后端共享；把状态藏在渲染器 hook/Canvas 对象内会破坏这些性质。选择小型显式 Motion IR + CPU 函数扩展，而不是引入 React/Use.GPU Live 运行时作为必要依赖：既保留 Calcit 组件函数，也让 WebGPU 只处理可降低的标准子集。Use.GPU 的数据驱动图层与增量执行思路可在 M2 评估，完整 Live 整合需要单独的 API/性能/迁移证据。Canvas2D 是基础语义参考，WebGPU 在 M2 建立主路径；本契约不以旧版 renderer 的偶然行为锁定两者。
