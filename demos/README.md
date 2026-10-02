# 演示导航与阶段成果入口

恢复进度：原有 11 项均已有可运行 Canvas 切片，包括 [Binary Tree](../docs/binary-tree-restoration.md)、[TodoList](../docs/todolist-restoration.md)、[Clock](../docs/clock-restoration.md)、[Curve](../docs/curve-restoration.md)、[Solar](../docs/solar-restoration.md)、[Icons](../docs/icons-restoration.md)、[Raining](../docs/raining-restoration.md)、[Finder](../docs/finder-restoration.md)、[Table](../docs/table-restoration.md)、[Drag demo](../docs/drag-demo-restoration.md) 与 [Folding Fan](../docs/folding-fan-restoration.md)。完整功能矩阵和 GPU 集成待补；优先从“原有动画”进入实际动画。

统一入口为 `/demos/index.html`。原有 11 项与图表 UI 动画 [Metric Flow](../docs/tidal-bloom.md)、[Signal Weave](../docs/signal-weave.md) 使用同一个页面、同一块全屏 Canvas；`?demo=curve&t=30`、`?demo=tidal-bloom&t=5` 或 `?demo=signal-weave&t=0.45` 可直接打开固定时间，画廊、上一个/下一个、浏览器前进/后退都通过页面状态切换。切换时舞台和 DOM 控制浮层淡出、卸载旧入口，再挂载并淡入新入口；`prefers-reduced-motion` 会跳过过渡等待。每个入口的 `mountDemo()` 返回清理函数，停止时钟、事件与观察器。旧 `/examples/<id>/index.html` 保留作为兼容和逐项截图测试入口。

页面清单由 `catalog.json` 管理，分为原有动画、艺术动画、公共 Calcit 路径、Motion/时间、组件/生命周期、实例/WebGPU 和参考/验证工具。搜索、分类筛选保存在 URL，刷新可复现。其余技术夹具或工具暂保留独立页面，不混作艺术动画；新增真正的作品应接入统一舞台而不是再建导航后独立页面。

原有 11 项始终保留完整清单，目前均有运行入口；艺术动画分类已有 Metric Flow 的柱状工作台与 Signal Weave 的折线／面积图两种构图，均提供可操作的数据状态渐变，不把技术夹具混入作品。未来待实现项不计入现有入口。详见[恢复验收与全屏约定](../docs/demo-restoration.md)。独立消费者默认展示全屏 Canvas 与可收起 DOM 浮层；`?fixture=1` 用于原固定像素诊断。画廊状态保留舞台但用目录浮层覆盖；演示状态显示同一块完整视口的 Canvas。

```sh
# 需要项目 deps.cirru 声明的 Calcit、Node 24、caps 与 Yarn 4.12.0
yarn install --immutable
yarn demo
```

这会安装 Calcit 模块并编译各演示真正使用的入口（包括独立消费者），启动 Vite 并打开导航。已有服务器时可运行 `yarn compile`（`compile:demos` 为兼容别名），然后访问 `/` 或 `/demos/index.html`。旧根 URL 保留 demo/time/seed 等参数转入统一页面，不再运行空 bootstrap；后续 demo 切换不整页重载。独立消费者单独搬移后仍不依赖框架内部 JS。

## 先看什么

1. **Calcit 保留组件**：同源全量参考与公共保留计划对照；改变时间和版本，验证 1000 帧静态结构复用。
2. **独立 Calcit 消费者**：通过 caps 安装公共模块，检验另一项目实际声明和调用。
3. **TodoList**：实际 Canvas 列表操作已消费公共执行入口；目标打断、重排、退出/重入均可用日志重放。通用资源与指针清理仍未完成；独立下游 #104 的生命周期迁移尚待跟进。
4. **万实例 / GPU Vec2**：查看实际后端及回退诊断。参考夹具、候选 GPU 合同、真实 GPU 运行与性能验收是不同证据。

基准驱动宿主页只给 `yarn bench` 使用，仍明确标为工具。根 URL 是统一应用的兼容入口，不再标为编译占位。Calcit Snapshot default 的 bootstrap 仅通过 `compile:bootstrap` 为 runtime smoke 生成 core；命名 entry 创建仍待上游 #1665，不声称已迁移语言入口。

## 可发布产物与门禁

```sh
yarn compile && yarn release
yarn test:demo-nav
```

普通 `release` 在被忽略的 `dist/` 构建所有页面，使用相对资源与导航，可部署到网站子路径，不自动部署。`release:demos` 保留为同一配置的 `dist-demos/` 兼容输出；只有输出目录不同，不再维护另一套 bootstrap 发布语义。

`test:demo-nav` 首先运行 4 项 Node 清单/构建图检查，再执行普通 `compile/release`；扫描排除产物与 Playwright HTML 报告。浏览器只能访问 `dist`，在 `/preview/` 子路径下从根 URL 与目录打开清单入口、检查状态/网络/运行错误并返回。根 `/` 与 `index.html` 的 DPR 1/2 用例保留分享参数、实际新增 TodoList 行、返回同一画布并验证卸载；原有导航、历史、全屏与 Binary Tree 门禁保留。TodoList 深度交互另由 `test:todolist` 验证。导航往返强制 GPU 不可用，不替代真实 GPU 验收；基准宿主页仅做加载检查。

若本地 Vite 长驻 5190，测试可用 `QUAMOLIT_DEMO_TEST_PORT=5192 yarn test:demo-nav` 将发布产物服务器移至独立端口；CI 默认仍用 5190，不会复用开发服务器冒充发布产物。

截图、每页信息与失败 trace 位于 `test-results/demo-nav/`。CI artifact `quamolit-demos-<run>` 包含普通 `dist` 站点和导航证据（含根入口 TodoList DPR 截图）；下载后可用静态 HTTP 服务器打开，不能用 file:// 运行 ESM。

全屏检查覆盖 DPR 1/2 的桌面/窄屏、暂停 resize、实际像素、浮层收起和键盘恢复。不同 DPR 分别创建浏览器上下文；跨物理显示器切换和真实 GPU 本轮未验证。Binary Tree 另验证独立几何/画面 oracle、播放暂停、分享时间和早到 rAF 边界。

## 新增演示的规则

- 在 `catalog.json` 登记 path/title/group/summary/status/docs/compile。业务/渲染实现继续按 Calcit 优先约束；此 JSON 仅为站点目录。
- 复用现有编译入口，或在 package scripts 新增实际入口；自动准备流程按清单去重。`consumer` 是独立项目安装编译的明确特殊值。
- 艺术作品与原有动画接入 `demos/main.mjs` 的按需模板/模块映射，提供 `mountDemo()` 与卸载函数；兼容 HTML 仍添加相对导航链接，不硬编码 localhost 端口或站点根路径。技术夹具维持独立入口。
- 新的初始化合同与特殊页面类型需同步浏览器检查。故意漏登记页面会令清单测试失败；页面无法初始化、请求 404、返回链接错误都会令发布产物测试失败。
- 完成 milestone 仍需阶段验收矩阵与实际结果；导航只是让成果可发现、可打开，不改变任何 milestone 关闭条件。
