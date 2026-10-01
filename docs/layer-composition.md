# Canvas UI 与 WebGPU 实例分层组合（开发中）

推进 #177，尚未满足其完整验收条件；不关闭 M2。导航的 GPU 分类提供 `Layer Composition · UI 与实例同屏`，入口仍在同一页面通过状态切换。

## 层契约

`quamolit.layers` 提供 `LayerFrame`、`LayerViewport`、`RenderLayer`、`LayerPolicy`、`LayerBackend`。层数组顺序是从底到顶，不因后端重新排序；层 ID 唯一且非空。各层 Scene 的节点身份限于该层。帧只有一个有限绝对时间和视口，不允许每层保存不同的时钟或 DPR。

`viewport(css-width, css-height, dpr)` 验证正有限输入，将实际像素尺寸统一舍入一次，最小 1 像素。`validate-frame!` 拒绝伪造尺寸、重复 ID、非法时间和 Scene；`plan-for` 在任何绘制之前校验全部层，再按原顺序返回后端选择。

`:canvas` 层保持 Canvas。`:gpu-instances` 当前只接受无绑定的单根 instances Scene；不可用或不支持时整层选择 Canvas，不抽取部分节点绘制。该选择不是对任意混合 Scene 的 Canvas 支持承诺：调用者仍须执行 Canvas 能力预检，不支持时明确失败，不能漏绘。

`quamolit.webgpu-batches/draw-cleared!` 接收明确清屏色。透明层使用 `(color 0 0 0 0)`，宿主保持 premultiplied alpha。旧 `draw!` 签名与白色清屏默认值不变。

`compile-hit-layers(frame)` 按逆绘制顺序生成独立 `LayerHitPlan`，`hit-test-layers` 查询实际像素坐标，`hit-at` 把 CSS 指针坐标按统一 DPR 换算一次。结果是 `Option<LayerHit>`，包含 layer-id 与原 Scene 的 HitResult。不同层可以有相同节点 ID；事件所有者必须同时带层 ID。绘制不建立命中区域；示例在声明变化时重建命中计划，事件只查询计划。密集 instances picking、跨层冒泡/捕获仍不在本接口范围，不宣称 #34 完成。

## 实际消费者

示例的实例布局、声明、文字/图表 Scene 和绘制选择由 Calcit 定义。JS 只管理 DOM、时钟、TypedArray 搬运及设备生命周期。底层是 125×80 个静态实例，不是 10k 独立运动；时间驱动上层看板缩放、淡入、裁剪揭示。CSS px 坐标的 UI 使用根 DPR 矩阵，实例数据使用实际像素坐标。

两个 Canvas 全屏覆盖同一视口，下层 `pointer-events:none`，不作为逻辑命中源。切换后端只替换底层 Canvas，UI Canvas、逻辑时间和实例资源仍保留。导航卸载移除底层、观察器、计时器与资源；出入场透明度同时作用两层。

层 Scene 使用实际像素坐标；UI 的 CSS 单位通过根矩阵转换，不应再在指针适配中重复乘 DPR。ACTIVE FLOW 卡片使用 Scene target 控制暂停/继续，不根据 Canvas 层数决定交互。DPR 监听同时包含媒体查询、窗口 resize，以及每 250 ms 的值变化兜底；兜底仅在 DPR 变化时重绘，不维持空闲绘制循环，卸载后取消。自动化用 Chromium CDP 的真实 deviceScaleFactor 模拟 1→2，不等于跨物理显示器测试。

## 当前决策与成本边界

推荐作为**显式、实验性的分层选择**：大量同类实例需要 GPU、文字/复杂 UI 仍走 Canvas 时，由 Calcit 声明两个完整 Scene。当前不更改框架默认后端、不自动拆分任意 Scene，也不把一个隔离透明度 group 拆到两层。独立 Canvas 元素增加浏览器合成和 backing-store 成本；透明度、裁剪只能在各层自己的 Scene 内求值，跨层效果需要另行设计。

`snapshot().costs` 记录声明/计划/命中编译的 CPU 时间、实例绘制边界时间、UI 绘制边界时间。GPU submission 的 CPU 时间不是 GPU 时间；浏览器 compositor 无精确测量，因此 `compositorMs=null`，不能把这些值相加作为帧时延或宣称 60 FPS。正式重复测量和合成成本判定仍待补，之后才决定是否作为默认方案。

## 当前验证与待办

- `yarn test:layers`：公共类型、视口舍入、不可变时间/层序、完整层能力判定、非法输入，以及透明清屏 ABI；这些不是浏览器合成验收。
- `yarn compile:layer-composition`：独立示例入口。
- `yarn test:layer-composition`：DPR 1/2 的两层同步、暂停 resize、模拟 adapter 失败；实例使用独立原生循环参考，UI bitmap 复用上层画面，因此它是层合成验收，不替代现有看板自身的文字/裁剪验收。Canvas 合成整帧 RGBA 零差异。
- 本机硬件命令：`QUAMOLIT_LAYER_REQUIRE_GPU=1 yarn playwright test --config test/layer-composition.playwright.config.mjs --headed -g '真实 GPU'`。Apple / Metal-3，DPR 1/2 通过；整图最大 RGB 差值 2、alpha 差值 0。该像素对齐、alpha=0.5 的矩形夹具预先规定 RGB≤2/alpha≤1，来源是 8-bit 预乘/反预乘量化；不能外推到任意分数几何。诊断在同一浏览器任务内重绘并读取，因为呈现后的 WebGPU drawing buffer 不是持久快照；直接跨任务 `drawImage` 会读到清空后的 buffer，并非实际页面漏绘。
- 已补：运行中 DPR 1→2、独立卡片命中、Metal device loss 整层 Canvas 回退与同版本重建（重传 80 kB）、统一导航往返、实例资源卸载回零。`test:demo-nav` 完整静态产物的 59 项浏览器检查通过，包括异步 adapter 迟到后不创建设备、不复活画布。Actions 已接入，结果须按 PR 实际运行确认；正式成本报告仍待补，其他 GPU 平台未验证。

浏览器门禁完成前不提交完成声明，不把本示例加入艺术作品验收，也不以结构测试替代 #177 的截图或硬件证据。
