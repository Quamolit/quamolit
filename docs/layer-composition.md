# Canvas UI 与 WebGPU 实例分层组合（开发中）

推进 #177，尚未满足其完整验收条件；不关闭 M2。导航的 GPU 分类提供 `Layer Composition · UI 与实例同屏`，入口仍在同一页面通过状态切换。

## 层契约

`quamolit.layers` 提供 `LayerFrame`、`LayerViewport`、`RenderLayer`、`LayerPolicy`、`LayerBackend`。层数组顺序是从底到顶，不因后端重新排序；层 ID 唯一且非空。各层 Scene 的节点身份限于该层。帧只有一个有限绝对时间和视口，不允许每层保存不同的时钟或 DPR。

`viewport(css-width, css-height, dpr)` 验证正有限输入，将实际像素尺寸统一舍入一次，最小 1 像素。`validate-frame!` 拒绝伪造尺寸、重复 ID、非法时间和 Scene；`plan-for` 在任何绘制之前校验全部层，再按原顺序返回后端选择。

`:canvas` 层保持 Canvas。`:gpu-instances` 当前只接受无绑定的单根 instances Scene；不可用或不支持时整层选择 Canvas，不抽取部分节点绘制。该选择不是对任意混合 Scene 的 Canvas 支持承诺：调用者仍须执行 Canvas 能力预检，不支持时明确失败，不能漏绘。

`quamolit.webgpu-batches/draw-cleared!` 接收明确清屏色。透明层使用 `(color 0 0 0 0)`，宿主保持 premultiplied alpha。旧 `draw!` 签名与白色清屏默认值不变。

## 实际消费者

示例的实例布局、声明、文字/图表 Scene 和绘制选择由 Calcit 定义。JS 只管理 DOM、时钟、TypedArray 搬运及设备生命周期。底层是 125×80 个静态实例，不是 10k 独立运动；时间驱动上层看板缩放、淡入、裁剪揭示。CSS px 坐标的 UI 使用根 DPR 矩阵，实例数据使用实际像素坐标。

两个 Canvas 全屏覆盖同一视口，下层 `pointer-events:none`，不作为逻辑命中源。切换后端只替换底层 Canvas，UI Canvas、逻辑时间和实例资源仍保留。导航卸载移除底层、观察器、计时器与资源；出入场透明度同时作用两层。

## 当前验证与待办

- `yarn test:layers`：公共类型、视口舍入、不可变时间/层序、完整层能力判定、非法输入，以及透明清屏 ABI；这些不是浏览器合成验收。
- `yarn compile:layer-composition`：独立示例入口。
- `yarn test:layer-composition`：DPR 1/2 的两层同步、暂停 resize、模拟 adapter 失败；实例使用独立原生循环参考，UI bitmap 复用上层画面，因此它是层合成验收，不替代现有看板自身的文字/裁剪验收。Canvas 合成整帧 RGBA 零差异。
- 本机硬件命令：`QUAMOLIT_LAYER_REQUIRE_GPU=1 yarn playwright test --config test/layer-composition.playwright.config.mjs --headed -g '真实 GPU'`。Apple / Metal-3，DPR 1/2 通过；整图最大 RGB 差值 2、alpha 差值 0。该像素对齐、alpha=0.5 的矩形夹具预先规定 RGB≤2/alpha≤1，来源是 8-bit 预乘/反预乘量化；不能外推到任意分数几何。诊断在同一浏览器任务内重绘并读取，因为呈现后的 WebGPU drawing buffer 不是持久快照；直接跨任务 `drawImage` 会读到清空后的 buffer，并非实际页面漏绘。
- 待完成：DPR 运行中改变、device loss 与异步卸载、统一导航往返、独立命中交互、两层成本记录、Actions 接入和正式推荐决策。其他 GPU 平台未验证。

浏览器门禁完成前不提交完成声明，不把本示例加入艺术作品验收，也不以结构测试替代 #177 的截图或硬件证据。
