# 演示导航与阶段成果入口

恢复进度：原有 11 项均已有可运行 Canvas 切片，包括 [Binary Tree](../docs/binary-tree-restoration.md)、[TodoList](../docs/todolist-restoration.md)、[Clock](../docs/clock-restoration.md)、[Curve](../docs/curve-restoration.md)、[Solar](../docs/solar-restoration.md)、[Icons](../docs/icons-restoration.md)、[Raining](../docs/raining-restoration.md)、[Finder](../docs/finder-restoration.md)、[Table](../docs/table-restoration.md)、[Drag demo](../docs/drag-demo-restoration.md) 与 [Folding Fan](../docs/folding-fan-restoration.md)。完整功能矩阵和 GPU 集成待补；优先从“原有动画”进入实际动画。

统一入口为 `/demos/index.html`。原有 11 项与图表 UI 动画 [Metric Flow](../docs/tidal-bloom.md) 使用同一个页面、同一块全屏 Canvas；`?demo=curve&t=30` 或 `?demo=tidal-bloom&t=5` 可直接打开固定时间，画廊、上一个/下一个、浏览器前进/后退都通过页面状态切换。切换时舞台和 DOM 控制浮层淡出、卸载旧入口，再挂载并淡入新入口；`prefers-reduced-motion` 会跳过过渡等待。每个入口的 `mountDemo()` 返回清理函数，停止时钟、事件与观察器。旧 `/examples/<id>/index.html` 保留作为兼容和逐项截图测试入口。

页面清单由 `catalog.json` 管理，分为原有动画、艺术动画、公共 Calcit 路径、Motion/时间、组件/生命周期、实例/WebGPU 和参考/验证工具。搜索、分类筛选保存在 URL，刷新可复现。其余技术夹具或工具暂保留独立页面，不混作艺术动画；新增真正的作品应接入统一舞台而不是再建导航后独立页面。

原有 11 项始终保留完整清单，目前均有运行入口；艺术动画分类从 Metric Flow 的组件化 UI 渐变开始，可操作两屏图表界面，并在分析屏反复切换访客／营收系列；两种过渡均可中途反向，不把技术夹具混入作品。未来待实现项不计入现有入口。详见[恢复验收与全屏约定](../docs/demo-restoration.md)。独立消费者默认展示全屏 Canvas 与可收起 DOM 浮层；`?fixture=1` 用于原固定像素诊断。画廊状态保留舞台但用目录浮层覆盖；演示状态显示同一块完整视口的 Canvas。

```sh
# 需要项目 deps.cirru 声明的 Calcit、Node 24、caps 与 Yarn 4.12.0
yarn install --immutable
yarn demo
```

这会安装 Calcit 模块并编译各演示真正使用的入口（包括独立消费者），启动 Vite 并打开导航。已有服务器时可运行 `yarn compile:demos`，然后访问 `/demos/index.html`。原有动画通过统一页顶部按钮返回画廊；兼容独立 URL 和根 bootstrap 仍链接到画廊。独立消费者单独复制或搬移后没有本地导航站点，会显示仓库的导航说明链接；不会因此依赖框架内部 JS。

## 先看什么

1. **Calcit 保留组件**：同源全量参考与公共保留计划对照；改变时间和版本，验证 1000 帧静态结构复用。
2. **独立 Calcit 消费者**：通过 caps 安装公共模块，检验另一项目实际声明和调用。
3. **TodoList**：实际 Canvas 列表操作已消费公共执行入口；目标打断、重排、退出/重入均可用日志重放。通用资源与指针清理仍未完成；独立下游 #104 的生命周期迁移尚待跟进。
4. **万实例 / GPU Vec2**：查看实际后端及回退诊断。参考夹具、候选 GPU 合同、真实 GPU 运行与性能验收是不同证据。

基准驱动宿主页只给 `yarn bench` 使用；根入口仍是编译占位。两者明确标为工具/占位，不伪装成已恢复的动画应用。导航卡片链接到对应说明和检验规则。

## 可发布产物与门禁

```sh
yarn release:demos
yarn test:demo-nav
```

`release:demos` 在独立、被忽略的 `dist-demos/` 构建所有页面，使用相对资源和导航链接，可部署在网站子路径。它不更改原 `release` 的 bootstrap 语义，也不自动部署。

`test:demo-nav` 首先运行 3 项 Node 清单检查，再编译/打包；扫描排除编译目录及 Playwright 自动生成的 HTML 报告。浏览器只能访问 `dist-demos`，在 `/preview/` 子路径下依次从导航打开所有清单入口、检查状态/网络/运行错误并返回。原有动画还验证不整页重载、同一 Canvas、前后 Demo 切换、历史记录和旧入口卸载。另有搜索、分类、刷新、全屏布局与 Binary Tree 动画门禁；TodoList 深度交互另由 `test:todolist` 验证。导航往返强制 GPU 不可用，不替代真实 GPU 验收。根占位/基准宿主页只有加载检查，其余有相应初始化状态断言。

若本地 Vite 长驻 5190，测试可用 `QUAMOLIT_DEMO_TEST_PORT=5192 yarn test:demo-nav` 将发布产物服务器移至独立端口；CI 默认仍用 5190，不会复用开发服务器冒充发布产物。

截图、每页信息与失败 trace 位于 `test-results/demo-nav/`。CI artifact `quamolit-demos-<run>` 包含 `dist-demos` 站点和导航测试证据；下载后可用任何静态 HTTP 服务器打开，不能直接用 file:// 运行 ESM。

全屏检查覆盖 DPR 1/2 的桌面/窄屏、暂停 resize、实际像素、浮层收起和键盘恢复。不同 DPR 分别创建浏览器上下文；跨物理显示器切换和真实 GPU 本轮未验证。Binary Tree 另验证独立几何/画面 oracle、播放暂停、分享时间和早到 rAF 边界。

## 新增演示的规则

- 在 `catalog.json` 登记 path/title/group/summary/status/docs/compile。业务/渲染实现继续按 Calcit 优先约束；此 JSON 仅为站点目录。
- 复用现有编译入口，或在 package scripts 新增实际入口；自动准备流程按清单去重。`consumer` 是独立项目安装编译的明确特殊值。
- 艺术作品与原有动画接入 `demos/main.mjs` 的按需模板/模块映射，提供 `mountDemo()` 与卸载函数；兼容 HTML 仍添加相对导航链接，不硬编码 localhost 端口或站点根路径。技术夹具维持独立入口。
- 新的初始化合同与特殊页面类型需同步浏览器检查。故意漏登记页面会令清单测试失败；页面无法初始化、请求 404、返回链接错误都会令发布产物测试失败。
- 完成 milestone 仍需阶段验收矩阵与实际结果；导航只是让成果可发现、可打开，不改变任何 milestone 关闭条件。
