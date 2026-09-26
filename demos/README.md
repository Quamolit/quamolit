# 演示导航与阶段成果入口

恢复进度：已有 [Binary Tree](../docs/binary-tree-restoration.md) 与 [TodoList](../docs/todolist-restoration.md) Canvas 切片；前者保留递归几何，后者提供完整列表操作、生命周期和输入重放。其余 9 项仍待恢复，GPU 集成待补。优先从“原有动画”进入实际动画。

统一入口为 `/demos/index.html`。页面清单由 `catalog.json` 管理，分为原有动画、公共 Calcit 路径、Motion/时间、组件/生命周期、实例/WebGPU 和参考/验证工具。可以搜索、分类筛选，筛选条件保存在 URL，刷新可复现。

原有 11 项始终保留完整清单，其中 9 项尚无运行入口，艺术动画分类也尚无作品；待实现项不计入现有入口。详见[恢复验收与全屏约定](../docs/demo-restoration.md)。独立消费者默认展示全屏 Canvas 与可收起 DOM 浮层；`?fixture=1` 用于原固定像素诊断。Gallery 本身是作品目录，不需要背景画布；动画页面需要完整视口的舞台。

```sh
# 需要 Calcit 0.22.0、Node 24、caps 与 Yarn 4.12.0
yarn install --immutable
yarn demo
```

这会安装 Calcit 模块并编译各演示真正使用的入口（包括独立消费者），启动 Vite 并打开导航。已有服务器时可运行 `yarn compile:demos`，然后访问 `/demos/index.html`。根 bootstrap 页和各演示右上角都能返回导航。独立消费者单独复制或搬移后没有本地导航站点，会显示仓库的导航说明链接；不会因此依赖框架内部 JS。

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

`test:demo-nav` 首先运行 3 项 Node 清单检查，再编译/打包；扫描排除编译目录及 Playwright 自动生成的 HTML 报告。浏览器只能访问 `dist-demos`，在 `/preview/` 子路径下依次从导航打开所有清单入口、检查状态/网络/运行错误并返回。额外验证搜索、分类、刷新、全屏布局与 Binary Tree 动画；TodoList 深度交互另由 `test:todolist` 验证。导航往返强制 GPU 不可用，不替代真实 GPU 验收。根占位/基准宿主页只有加载检查，其余有相应初始化状态断言。

截图、每页信息与失败 trace 位于 `test-results/demo-nav/`。CI artifact `quamolit-demos-<run>` 包含 `dist-demos` 站点和导航测试证据；下载后可用任何静态 HTTP 服务器打开，不能直接用 file:// 运行 ESM。

全屏检查覆盖 DPR 1/2 的桌面/窄屏、暂停 resize、实际像素、浮层收起和键盘恢复。不同 DPR 分别创建浏览器上下文；跨物理显示器切换和真实 GPU 本轮未验证。Binary Tree 另验证独立几何/画面 oracle、播放暂停、分享时间和早到 rAF 边界。

## 新增演示的规则

- 在 `catalog.json` 登记 path/title/group/summary/status/docs/compile。业务/渲染实现继续按 Calcit 优先约束；此 JSON 仅为站点目录。
- 复用现有编译入口，或在 package scripts 新增实际入口；自动准备流程按清单去重。`consumer` 是独立项目安装编译的明确特殊值。
- HTML 添加返回导航链接，采用相对于该页面的路径，不硬编码 localhost 端口或站点根路径。
- 新的初始化合同与特殊页面类型需同步浏览器检查。故意漏登记页面会令清单测试失败；页面无法初始化、请求 404、返回链接错误都会令发布产物测试失败。
- 完成 milestone 仍需阶段验收矩阵与实际结果；导航只是让成果可发现、可打开，不改变任何 milestone 关闭条件。
