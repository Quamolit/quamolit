# Quamolit vNext：核心约定（草案）

> 本文保留早期设计背景与迁移记录。2026-09-23 的[技术路线 v2](roadmap.md)、[工作项规格](work-items.md)和[检验规则](verification.md)已替代原三阶段计划；有差异时以 v2 为准。默认动画需要任意时间直接采样，顺序更新模型仅覆盖历史相关动画的一部分。

本文记录 M1 阶段关于 [API 设计](https://github.com/Quamolit/quamolit/issues/30)、[确定性时间](https://github.com/Quamolit/quamolit/issues/31) 和 [Scene IR](https://github.com/Quamolit/quamolit/issues/32) 的方向。它是设计草案；下文提出的 API 并非都已实现。

## 保留原有理念

Quamolit 仍是声明式 Canvas 动画库。应用状态和动画状态应是显式的应用数据，而不是渲染器内部的私有状态。组件根据状态描述场景；更新函数接收事件或帧采样，产生下一份状态。最终的渲染过程不应推进时钟、派发更新，也不应在绘制时创建事件处理器。

目标流程：

```text
输入 + 绝对时间 → 更新模型 → 纯视图 → Scene IR → 渲染器
                                         └────→ 命中索引
```

现有的 `defcomp`/`Shape` 树是迁移输入，尚不是新的 IR。旧版 `paint` 入口目前先执行独立的 `tick-tree` 遍历，再绘制；`paint-tree-only-with` 只遍历并绘制，不调用 `on-tick`。旧版 tick 回调仍会派发应用更新。新入口 `initial-frame` / `evaluate-at` 已将模型更新与视图求值作为显式函数参数，不依赖旧版 tick。命中区域仍在旧版绘制过程中收集；#32、#33 和 #34 将继续落实 Scene IR、渲染器与独立命中索引。

## 时间约定

框架中的时间单位统一为秒。`step-frame(previous, current)` 是纯函数，返回 `FrameSample {time, elapsed}`。重复时间戳产生零间隔；时间倒退则报错。旧代码如需回退，应显式调用 `reset-frame-clock!`。`advance-frame-clock!` 复用同一套纯计算，使现有命令式入口与未来求值器具有相同的时间单调性语义。

现已提供 `EvaluatedFrame<M, S>`，保存 `sample`、`model`、`scene`。`initial-frame(time, model, view)` 建立起点；`evaluate-at(previous, time, update-model, view)` 根据绝对时间先更新模型再计算场景。相同时间只将 `elapsed` 置零，复用模型和场景，不调用更新与视图函数；时间倒退则报错。求值器本身不依赖 Canvas、浏览器或全局时钟，调用方负责提供纯函数。完整语义、重放限制和示例见[显式帧求值](frame-evaluation.md)。

可视化测试先重置模型和时间，再重放所需采样点并渲染目标场景。对同一结果重复渲染，不应再次触发更新，也不应改变像素。若动画包含随机性，种子或生成器状态应属于模型；异步资源应在截图断言前明确处于就绪或失败状态。

对旧版组件树，`tick-tree(tree, dispatch!, elapsed)` 按父节点先于子节点的顺序调用回调，不访问 Canvas；`paint-tree-only-with` 随后绘制该树，不执行 tick。兼容入口 `paint-tree-with` 和 `paint` 在要求 tick 时依次调用这两个阶段。这只是迁移边界，并非最终的模型纯函数求值器。

## 拟议的公共 API 边界

- **组件／视图：** props 和模型数据的纯函数，返回声明式节点。重复子节点由稳定 key 标识，单靠组件名称不足以确定身份。
- **更新：** 事件更新与帧更新函数负责修改模型数据。关键帧、缓动、循环与镜像可以作为便捷描述，但采样值应由显式时间计算，而非由渲染器内部 hook 管理。
- **场景：** 用不可变、带类型的节点表示分组、图元、变换、裁剪，以及未来的批量绘制／实例化；其中不含 DOM、Canvas2D、WebGPU 或 JavaScript 句柄。
- **渲染器：** 消费场景与资源。Canvas2D 提供参考实现和回退路径；最终首选后端由平台支持情况及实测结果决定。WebGPU 可以处理选定的批量图层，而不替换组件／模型 API。
- **交互：** 从场景生成命中索引，明确层叠顺序、变换、裁剪和指针捕获语义，且无需绘制即可测试。GPU picking 是可选方案，不是普通 2D 事件路径的默认实现。
- **宿主边界：** 通用浏览器 FFI 放在 `calcit-lang/js-ffi`；Quamolit 只保留库专用的薄适配层。

Scene IR 需要明确坐标与角度单位、颜色、透明度合成、裁剪、图片／文本资源身份、绘制顺序和命中顺序。首版不必暴露所有 GPU 概念。批量节点可以引用类型化数组和脏数据范围，但普通组件不应了解 GPU 缓冲区布局。

## 迁移顺序与兼容性

迁移顺序已调整为 M0 基线、M1 动画函数与组件契约、M2 增量执行与 WebGPU 主路径、M3 完整 2D 功能与应用迁移、M4 GPU 模拟与性能发布。具体依赖和退出条件见 [roadmap.md](roadmap.md)，不再把性能基准与批处理推迟到末期。

M1 期间，旧版 `on-tick` 回调和 `defcomp` 形状语法仍作为迁移输入。其替代方案与弃用窗口留待 #30 决定。现有 `yarn compile` 只验证 bootstrap 入口，不能证明原应用功能正常。
