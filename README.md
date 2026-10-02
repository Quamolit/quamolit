# Quamolit / Calcit 声明式动画

用 Calcit 声明组件，以显式 Model 和时间生成动画帧。应用决定动画意图，框架负责执行与绘制；没有历史依赖的动画可以直接 seek、倒放和截图，有历史的模拟另走固定 tick。

## 从哪里开始

- **看效果**：`yarn demo` 打开[统一导航](demos/README.md)。原有动画与图表 UI 作品使用全屏 Canvas、可收起 DOM 浮层；[恢复清单](docs/demo-restoration.md)说明原有11个示例的验收边界。
- **写动画**：稳定 alpha 入口目前只有 [`quamolit.ui-motion`](docs/ui-motion-components.md)。下面的代码可直接执行，不是拟议 API。
- **声明和绘制组件**：[独立 Calcit 消费者](examples/retained-consumer/README.md)贯通安装、组件、可控时间、Canvas 与受限 WebGPU。它仍使用实验 API，不代表完整渲染面已稳定。
- **迁移旧项目**：[API 清单与迁移合同](docs/api-contract.md)区分稳定、实验、旧入口和内部实现。旧 `paint` / `tick-tree` 的迁移说明集中在那里；不再以旧 DSL 作为首页教程，历史示例仍可查 Git 历史，旧实现不在本轮删除。

## 最小动画 / Minimal animation

第3个柱条延迟0.2秒进入，动画持续0.4秒；在绝对时间0.4秒采样，进度为0.5，宽度由40变到104的中点是72。下列代码仅调用稳定入口，返回动画数据，不创建 Canvas、GPU 或隐藏时钟。

```cirru
let
    stagger $ quamolit.ui-motion/smooth-stagger 0 0.1 0.4
    progress $ quamolit.ui-motion/stagger-at stagger 2 0.4
    width $ quamolit.ui-motion/morph-number 40 104 progress
  assert |midpoint-width $ = width 72
  println width
```

在仓库根目录执行 `calcit eval --dep ./calcit.cirru --stdin`，粘贴代码后结束输入。`yarn check:api-inventory` 会执行 README 的全部 Cirru 示例，并检查它们仅引用稳定合同内的定义；现有 `yarn test:ui-motion` 检查数值、非法输入和出入场语义。不把这段纯动画采样当作完整组件或 GPU 教程。

## 开发与验证

需要 Calcit **0.28.0**、Node.js **24**、Yarn **4**；依赖以 `deps.cirru` 和 lockfile 为准，使用 node-modules linker。

```sh
corepack enable
yarn install --immutable
caps --ci
yarn check:api-inventory
yarn test:ui-motion
yarn demo
```

`yarn release:demos` 构建完整演示站点。`yarn compile` / `yarn release` 目前仍以 bootstrap 为迁移基线，不能代替应用验收。关键链路测试、截图与硬件范围集中在[检验规则](docs/verification.md)；不要把无 GPU 的 SKIP 算作通过，也不要把编译通过或上传计数当作性能达标。

M1 动画与组件逻辑合同已验收；M2 的保留执行与 WebGPU、M3 的完整绘制/交互、M4 的性能发布仍在推进。当前状态与下一项只在[计划 v3](docs/plan-v3.md)维护；编码前读 [AGENTS.md](AGENTS.md)。暂不扩展性能优化，复用现有公共入口、消费者与门禁。

## English

Quamolit is a declarative animation library written in Calcit. Components describe the scene; explicit models and time determine animation values. Stateless motion supports direct seeking and deterministic frames; stateful simulation uses fixed ticks.

Start with the [demo gallery](demos/README.md) (`yarn demo`) and the [API stability inventory](docs/api-contract.md). Only `quamolit.ui-motion` currently has a guarded alpha contract. The executable example above staggers the third bar, samples its midpoint at 0.4 seconds, and prints a width of 72. It is pure animation data—not a complete renderer—and uses only stable definitions. `yarn check:api-inventory` validates and executes every Cirru example in this README.

The [standalone consumer](examples/retained-consumer/README.md) demonstrates component declarations, retained execution, Canvas and a supported WebGPU subset through Calcit imports. Those renderer/resource interfaces remain experimental. See the [verification rules](docs/verification.md) for actual coverage and hardware limits; passing compilation is not proof of application behavior or performance. The [migration contract](docs/api-contract.md#旧入口弃用计划) replaces the old homepage DSL tutorial; historical code remains in Git history and is not removed here.

Use Calcit 0.28.0 and Node.js 24, then run the development commands above. `yarn release:demos` builds the demo site; `compile`/`release` still target the migration bootstrap. Follow [plan v3](docs/plan-v3.md) for milestone status. Reuse existing interfaces and tests before adding more layers.

## History and license

Quamolit began as a CoffeeScript experiment in 2014, was rewritten in [ClojureScript](https://github.com/Quamolit/quamolit.cljs) in 2016, and is now developed in Calcit. The goal remains declarative components with explicit, controllable animation state.

MIT
