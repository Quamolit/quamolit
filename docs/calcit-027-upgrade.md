# Calcit 工具链升级与版本合同

2026-10-14 升级候选使用已发布的 Calcit 稳定版 `0.29.3`、匹配的 `@calcit/procs@0.29.3` 和 js-ffi `0.2.2`。根项目、独立消费者、`deps.cirru`、npm runtime、Yarn resolution、锁文件和中英文入口同步；不接受仅升级本机 CLI。沿用本页与现有门禁，不另建升级测试体系。主线及旧alpha仍为0.28.0，不能把候选声明当作已完成验收。

本机全局CLI为0.29.0-alpha.17，不用于正式0.29.3验收；官方release的两个可执行资产均为Linux，因此macOS从官方0.29.3 crate构建隔离CLI（`--locked --no-default-features`，本项目使用JS目标，非WASM验收）。不覆盖用户全局安装。named entry 创建的上游#1665已经关闭，工具链门禁通过后另做入口归并，不混入本升级PR。

## 版本合同

`yarn test:runtime` 同时检查当前 `calcit --version`、根项目与消费者的 `:calcit-version`、两处 `@calcit/procs` 声明和实际安装版本，以及从 js-ffi 包位置解析到的 runtime。全部必须为 `0.29.3`；另用 `caps verify --toolchain` 检查模块与 runtime。

js-ffi 0.2.2声明Calcit0.29.1；根 `resolutions` 统一到兼容稳定runtime0.29.3，保持单例，不改变平台API与Quamolit业务代码的归属。pointed-prompt更新到正式0.0.17，修复旧版本已退役的join-str引用；不是无依据的依赖批量升级。

本轮局部迁移：普通nil谓词改为non-nil?，保留Option.some?；FontFace采用identical?而非值比较；旧矩形夹具显式检查尺寸数值，nil/false仍取原默认值、0保留，非法字符串拒绝；tracked-transform的Map读取显式匹配Option，不伪装成Struct。看板两处defref由core-api-0.29-v1的machine-applicable证明迁移，重复预览为空。

资源循环旧局部名ref与新版构造器冲突。rename-local planner在改名之前就因保留名预处理失败，已上报[Calcit #2049](https://github.com/calcit-lang/calcit/issues/2049)；仅在两个完整读取的小函数中用结构化事务重放相同控制流并改名，不文本编辑Snapshot。全项目preset仍因旧textbox的FFI债务失败，不给整个namespace添加宽泛权限，也不宣称全库规范迁移已完成。

升级预检复用 GPU 公共入口（80 个定义）、Motion/保留组件/三个图表 demo（169 个定义）、GPU Node 合同（23 项）及 Motion Chromium（31 项）。这些不是全项目类型验收或真实 GPU 验收。选定主路径的 `core-api-0.28-v1` 预览为空，不为“升级”制造无必要的源码改写。

## 升级原则

- `calcit.cirru` 仍是 canonical source snapshot，不标记为 generated，也不以文本替换修改业务定义。
- 先以严格 public schema、编译、Node、浏览器和独立消费者门禁暴露问题；不增加全局 allow 或宽泛 `Dynamic` 绕过。
- 新版本若暴露编译器缺口，向 Calcit 仓库提交最小复现，同时采用局部、可撤销的适配继续推进。
- 0.28.0 的 motion 编译拒绝 `valid-bindings?` 把 `recur` 作为 `and` 操作数；该定义改为显式 `if`，通过当前 binding 与重复目标检查后再尾递归，失败分支返回 false。按结构化事务修改，继续复用 Scene 原生/JS 合同验证合法、重复与非法绑定。
- Pointer 浏览器入口的两处旧 `assert-type` 改为显式宿主 `unsafe-coerce`，保留 `expect-object` 的拒绝与对象身份；它们信任真实浏览器提供的字段/方法，不是假装运行时 shape decoder。原有捕获/卸载合同与同文件的非法值断言覆盖此边界。[js-ffi #149](https://github.com/calcit-lang/js-ffi/issues/149) 发布通用入口后删除本地适配，不新增 JS wrapper。
- alpha.11 的浏览器 adapter 在下游严格检查中仍有 12 项 assertion proof 错误，已上报 [js-ffi #155](https://github.com/calcit-lang/js-ffi/issues/155)。Drag listener 已提供 `EventHost`，因此 Calcit 路由 callback 声明精确参数/Unit/FFI capability 并直接调用 `.prevent-default!`，删除重复 `event-host` 转换。该局部绕过不证明整个上游 browser 模块通过；新 tag 发布后复测。
- 全项目 preset 预览会在旧 `quamolit.render.element/textbox` 的原始 `keyCode/shiftKey` 访问处报告 `E_JS_FFI_FEATURE_REQUIRED`；这是 legacy 宿主边界迁移债，不是编译器缺陷，归入 #36。主路径编译成功不能冒充该预览通过，不给整个组件补宽泛 capability 来隐藏它。

## 验收

本机0.29.3已构建完成；关键本地结果：CLI/runtime合同、稳定API17项、TodoList13项、看板16项、原视觉11项、保留组件Node9/浏览器4项、完整编译/构建与静态导航76项通过。旧矩形数值边界另复核5项正负例；不改像素阈值或基线。最初两个浏览器命令争用5180导致TodoList末项连接失败，串行重跑13项全部通过，不跳过用例。

首轮Upload暴露附带测试把空Ref推断为List<never>后写入Tag的旧写法；仅给原parent-before-child测试初始化显式List<Tag>，保留原顺序断言/标签，使用ref首选构造器。frame-clock13项及全项目原生145项全部通过；没有放宽Ref类型或删除测试。

随后Visual在二叉树Node测试中拒绝把裸JS回调动态写入类型化PathPlan.sample；这是测试构造方式不再满足Fn字段证据，而非动画采样失败。计数采样器与故障计划构造移入已有Calcit测试夹具，显式保留BranchSlot/Matrix2D类型，生产公共模块不引用该夹具。原1000帧/63条共享几何/重复时间跳过断言不变；负例先构造计划，再断言实际采样的invalid-path-time/invalid-path-transforms，避免字段赋值错误造成假阳性。本地原生2项及Node8项通过，不改图像阈值、artifact要求或公共API。

干净消费安装451f6e4升级源码、37个可达模块搬移、inline/file显式重编译和生命周期通过。导航里的独立消费者也固定该候选，避免只升级runtime却展示旧库；最终head的消费及Actions须再核对。无头GPU为adapter-unavailable的SKIP，不计硬件或性能通过。整库legacy规范债务、命名entry归并与后续发版仍未完成。

f34899b的candidate=harness、dirty=false消费复测通过；headed/REQUIRE_GPU同head的真实Apple/Metal四项专项全部PASS（非软件adapter），覆盖矩形、双轴、10k实例更新/恢复与独立时间采样。该结果不是吞吐基准，#144的小数栅格化差异仍按原诊断记录。后续仅附带测试类型初始化修复，不把旧head绿灯替代新head的Actions。

最低门禁：

```bash
yarn install
yarn compile
yarn test:runtime
yarn test:device-recovery
yarn test:folding-fan
yarn test:consumer
yarn test:demo-nav
```

CI 的 `setup-calcit@v1.5.0` 显式读取根 `deps.cirru`，日志必须显示 `calcit version: 0.29.3`，且 `test`、`bench-smoke`、`visual` 全部通过。无头环境没有非软件 WebGPU adapter 时仍明确 SKIP，不冒充硬件验收。

Calcit 0.26 的迁移背景和当时诊断见 [历史升级记录](calcit-026-upgrade.md)。
