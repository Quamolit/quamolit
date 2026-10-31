# Calcit 工具链升级与版本合同

## 0.32.1 迁移候选（尚未完成）

候选配对正式 CLI/runtime 0.32.1、js-ffi 0.2.9、touch-control 0.0.35 和 pointed-prompt 0.0.24。官方 formatter 迁移根源码 233 处与独立消费者 5 处旧类型表示；27 个命名 entry 加 default、模块版本和全部既有门禁保留。根与消费者的新 npm 解析均至少等待 60 分钟，无例外。

AST 叶查询不足以证明无 npm 消费者：实际编译产物仍在 typed-arrays / webgpu-capabilities 两处引用 `@calcit/js-ffi`，官方 usages 进一步确认两个 Quamolit 调用，因此保留原 npm 依赖及完整安装断言。npm registry 无此发布包，Yarn 仅允许这一个已有依赖的精确 Git 仓库 URL，无通配符；具体正式 tag 与 immutable lock 继续校验。原 runtime smoke 的 vals 旧名按公开 distinct-values 迁移，原去重集合断言不变。后续以真实 import/消费者验证迁移，不因检查数量删掉必要依赖。

本地当前：全定义 strict 为 **1718/1718**，失败、阻塞和级联均为 0；原 161 项原生测试加三项实际回归共 **164/164** 通过。稳定 API 清单、原 18 项清单测试、README 示例和 bootstrap/runtime 继续按当前候选验收。十处 `case-default` 保留分支顺序和惰性默认值改为 `match`，显式 slice 终点改为 Option；数字列表运算、帧 Ref、回调参数和返回关系补真实类型，不使用兼容开关、取消证明审计或修改质量预算。

旧 Map 字段改为 `get` 并区分缺项与 Some nil/false/0；游标保留 String/Number/Tag 混合 key。淡入淡出保留未知 stage 日志、renderer 返回形状与双参数 dispatch，不把开放回调伪装为固定 Shape/Unit。输入框修正旧多参数 assoc，使用已发布的键盘事件宿主接口；slider 的局部可变值仍是原 JS 单元素数组，不冒充 Calcit Ref。variadic 绘制子项按原 save→变换→children→restore 次序构造列表；Shape/Component 分支先检查真实名义身份再断言。

需要调用方注意：直接读写旧 `*element-tree` Ref 的外部代码须改为匹配 `LegacyRoot` 的 empty/shape/component 三态，并通过 `cache-element-tree!` 写入。普通绘制入口继续接受 Shape/Component/nil；写入先检查名义身份，非法值不会污染缓存。focus/drag 两个 Ref 改为 Option，初始空列表/零坐标仍保留在 Some 内，释放使用 None。Model/Scene/Motion 与 wire 格式不变。

Canvas/事件宿主改用实际 `js-cast` 检查，nullable 2D context 不再声明成必定存在。图片缓存保留对象身份；鼠标释放、键盘无焦点回退、缩放边界与实际旋转命中已通过当前生成 JS 的合成回放。旧旋转将弧度重复换算且丢失 sin 分量的问题按 [#254](https://github.com/Quamolit/quamolit/issues/254) 修复；高层角度仍只换算一次。这些 Node 合成宿主结果不算真实浏览器像素或 GPU 证据。

候选版本为 **0.0.18（尚未发布 tag）**。独立示例依赖该正式版本，移除历史 hash；正式版本发布前，本地画廊可显式使用 `QUAMOLIT_CONSUMER_REF=<已推送的候选提交> yarn compile`。原准备脚本在临时目录从 Git 安装该候选并编译到示例既有产物目录，不改写示例 deps、不引用作者工作树或 test 产物。Visual/Upload 沿用原 job、断言和预览路径，以 PR 精确 head 作为候选；未指定候选时仍消费正式 tag。

精确提交 `37b9f9e` 的原独立消费者已通过：干净目录安装、完整 strict、file/inline 显式重编译、37 个模块闭包搬移、1000 帧复用、真实 Canvas/字体/曲线/分层与恢复验收。四个 GPU 硬件专项均因 adapter-unavailable 明确 SKIP，不算硬件通过；Canvas 回退和 viewport/DPR 路径通过。版本元数据及画廊准备后续改动仍需用最终 head 重跑。原 Benchmark/Upload/Visual、27 个入口和浏览器验收以本轮实际结果为准，不引用旧候选绿灯。临时事务与回放不进入日常源码，不新增 namespace、runner、CI job 或重复 COS 校验。未合并、部署或发版。

旧 `bound-x` 的反向区间公式已通过实际生成 JS 确认可能超界，另报 [#257](https://github.com/Quamolit/quamolit/issues/257)。当前只验证数字 FFI 返回，不悄悄改算法；既有反向区间合同与消费者须单独审查。这属于模块算法问题，不新增编译器固定改写规则。

## 既有 0.30.1 历史记录

以下记录保留旧版本的验收范围，不作为 0.32.1 候选已通过的证据。

主线已随[#247](https://github.com/Quamolit/quamolit/pull/247)从 #242 的 alpha.5 配套升级到正式 Calcit / `@calcit/procs@0.30.1`；旧 Quamolit alpha.4仍为0.28.0。工具链升级不等于 Quamolit 正式发版或milestone验收，模块自身的版本元数据暂不改。根项目、独立消费者、deps、npm resolution、锁文件、API查询版本门禁与中英文入口同步，不只升级作者本机CLI。

## 版本与来源

`yarn test:runtime` 检查CLI、根/消费者的deps、runtime声明与实际安装版本，以及从js-ffi包位置解析的runtime，全部必须为 `0.30.1`；同时检查js-ffi模块tag、npm Git tag、包版本与实际模块版本一致。另运行 `caps verify --toolchain`。js-ffi升级到已发布0.2.5，touch-control到0.0.32、pointed-prompt到0.0.20，递归依赖同步正式0.30.1，不修改共享缓存或引用未发布接口。

CI的 `setup-calcit@v1.5.0` 读取根deps并安装官方0.30.1 Linux release，与锁定的 npm runtime 配对。这轮不在本机安装或构建编译器，不运行本地 Caps，也不拿 alpha 编译结果作为正式工具链证据；编译、模块安装和原验收命令由现有 Linux CI 执行。WASM/WASI与实际GPU硬件不在本轮工具链验收范围。

## 本轮迁移范围

- 保持 `calcit --check-only --ns …` 的原scope、schema和负例，不使用兼容模式或新增Dynamic/unsafe来通过检查。
- 0.30.1的十三个缺失值原语改为Option。HSL在已证明alpha列表非空的分支调用公开first并解包，保留原格式与零alpha断言；67处 `&list:nth` 不属于此次改签，不做无意义改写。
- 13个保留的legacy定义通过CLI事务、dry-run和scoped_revision显式匹配56处Map/first/last结果。旧Shape事件字段、样式默认值、缓存和宏展开仍遵守原nil/FFI ABI，保留Some nil、false、0、函数身份及惰性fallback；这不是把主要公共API改成nil，也不声称legacy弱类型债已清零。全库自动fix预览受原有legacy开放类型阻断，未强制应用或放宽门禁；兼容桥随旧入口退役，不增namespace/runner/JS宿主。
- 既有runtime smoke新增HSL、Shape事件和矩形样式回归。旧编译产物真实触发Option泄漏反例，显式重编译后通过，未改期望值或像素容差。
- pointed-prompt旧import警告的上游记录为 [#23](https://github.com/mvc-works/pointed-prompt/issues/23)，本轮使用已发布0.0.20，不修改依赖缓存。
- `calcit.cirru` 仍是源码，不标记 generated；27 个命名 entry、默认 bootstrap 和独立消费者 Snapshot 边界不变。inline/file 自动随模块分发的验收继续复用已有消费者。

## 保留的迁移边界

此前 0.28/0.29 已完成 Option Map 读取、non-nil?、FontFace identity、尾递归位置和显式 Ref 元素类型等迁移，现有语义/非法输入断言继续保留。旧矩形参数维持 nil/false 默认值、0 保留及非法字符串拒绝。

保留名 ref 的 rename-local planner 问题已报 [Calcit #2049](https://github.com/calcit-lang/calcit/issues/2049)；此前已在两处小函数用结构化事务局部绕过。旧 textbox 的原始 keyCode/shiftKey FFI 权限债归 #36，不给整个 namespace 加宽泛 capability，也不把主路径成功声称为全库 canonical preset 通过。Pointer 宿主的临时类型适配待 [js-ffi #149](https://github.com/calcit-lang/js-ffi/issues/149) 对应接口发布后复测移除；不删除现有拒绝、捕获和卸载断言。

## 集合长度维护

在正式 0.30.1 和原依赖图上，将 131 处源码和 27 个原附带测试中的 52 处集合/字符串计数改为 `.len`。126 处源码已有 `query type-at` 的具体 List/String/Set 和零参数 Number 返回证据；另 5 处由实际生产者、List/Map 字段及 `.filter` 合同逐项核对，不用外层预期类型或新增强转冒充推断。字符串仍按 Unicode 标量计数，Map 仍计成员，不改变原参数求值、阈值、断言期望、生命周期和资源计数。

旧 `textbox` 的 2 处和 `paint-path` 的 1 处开放值计数暂不改写，沿现有 legacy API/类型迁移处理；`count` 本身并未整体弃用。全库官方 fix 预览仍被 `comp-fade-fn` 原有 Dynamic 算术合同阻断，不强制 preset、不加权限或放宽类型。其他 Option/Ref/构造器和旧宿主边界不因本次长度维护被宣称清零。

本次 canonical 仍提示 82 个本地定义中的 177 个动态/未绑定类型槽；原 schema、预算和检查不放宽。五处嵌套字段/调用查询的证据可用性已补充到[上游 #1906](https://github.com/calcit-lang/calcit/issues/1906#issuecomment-6381949665)，尚未认定同根因或编译语义错误，不为这些调用新增固定规则。

源码只由官方 Linux CLI 的受审事务、dry-run 和 scoped revision 生成；全部 1711 个定义视图、namespace/config、schema 与测试名称/标签受守卫，原测试只改计数调用头。临时证据和事务不进入日常源码，也不增加 namespace、runner、job 或重复 COS 校验。准确候选的原 Benchmark/Upload/Visual、独立消费与实际页面结果集中 PR，未验证硬件仍标未验证，不据此关闭 #204 或 M2/M3。

## Ref、Option 与旧 API 维护

对使用者，本轮不改动画时间、绘制层序、Model/Scene/Motion、资源生命周期或旧存档格式，也不发布新的模块 tag。需要注意：`mode=dev` 现在会正确启用开发模式；此前把环境变量 Option 与字符串直接比较，会错误地禁用该分支。未设置 mode 仍按 release 处理。Ref 的初始化和重载规则、Option 的 Some nil / false / 0 载荷与原 fallback 求值方式保持不变；这不是旧渲染 API 的退役或全库严格类型验收。

在同一正式 0.30.1 图上，104 处旧入口改为当前写法：`defatom` / `atom` 使用 `defref` / `ref`，`%some` / `%none` 使用 `Option :some` / `Option :none`，三个 `option:*` helper 使用对应接收者方法。两项原有附带测试只改三处 Ref 构造头，其他断言、测试名称和标签保留。

另外修正两处实际旧 API 错误：`dev?` 对单参数 `get-env` 返回的 Option 显式使用 `release` 缺省值，并声明 Bool；`type-as-int` 使用 `tag?` 和 `cond` 的最终 true 分支，以泛型输入和 Number 返回表达真实的分类合同，不把输入类型与返回值虚构为同一类型。后者在原附带测试中增加一项六断言回归，覆盖数字、Tag、中文字符串及其他值，未增加测试 runner。

源码仍由官方 Linux CLI 的完整前后视图、事务 dry-run 和本次 scoped revision 生成。原测试、API 清单、bootstrap/runtime、演示构建与发布继续执行；最终准确提交的 Benchmark/Upload/Visual、独立消费、浏览器与硬件边界以 PR 证据为准。旧 legacy 定义的全库检查仍有真实失败，不以迁移前后同错冒充通过；问题已补充到 [#204](https://github.com/Quamolit/quamolit/issues/204#issuecomment-6405578540)，继续按真实调用合同处理，不增加编译器固定改写规则或放宽类型预算。临时迁移工作流、事务和诊断接收脚本不进入项目。

## 旧透明度 clamp 的数字分支

`bound-01` 改为在显式 `number?` 分支中执行原数字比较，避免正式 0.30.1 无法从负向排除分支证明后续参数类型；公开 schema 仍为 Dynamic 输入/输出，不伪装成 Number。`nil` 仍返回 1，数字仍按原顺序限制到 0–1；非数字保留一次 console.warn 和原 JS 返回行为，不新增强转、默认值或 raise。实际修后 native 数字/nil 与生成 JS 的 NaN、无穷、负零及非法输入回归通过；修前无法严格编译，不宣称已实际执行前后等价对照。

该单 cond 事务保留完整 1711 定义视图中的其他代码、schema、161 项原附带测试与 429 个普通文件。原测试及 API/bootstrap/runtime/compile/release 前后通过；`bound-01`、`bound-opacity` 现在通过，但未修改的 `paint-alpha` 从依赖阻塞中显露真实 Dynamic 乘法错误，仍算失败。完整 strict 仍原样失败，不放宽项目门禁或基线；真实旧消费者合同继续归 [#204](https://github.com/Quamolit/quamolit/issues/204#issuecomment-6410390152) / #176，不把局部迁移当作旧 API 或 M2/M3 验收完成。临时 fixture、迁移 CI 和接收脚本不入库。

## 验证与交付

此前 alpha.5 迁移的110项公共定义和158项原生测试结果仅是历史证据，不作为本轮正式版通过结论。CLI/runtime与旧ABI合同、API清单、完整发布导航、独立候选消费均按本轮准确提交重新验收，最终结果集中PR；不借旧版本或其他分支绿灯，不修改像素容差或基线。复用现有CI artifact，不新建验证体系。

复用现有门禁，不新增 runner、namespace、CI job 或生成报告源码：

```sh
yarn install --immutable
caps verify --toolchain
yarn compile:bootstrap
yarn test:runtime
calcit test --require-match
yarn check:api-inventory
yarn test:device-recovery
yarn test:folding-fan
yarn test:consumer
yarn test:demo-nav
```

PR的Benchmark、Upload、Visual必须在准确head全部成功后才转Ready。无头GPU缺失明确SKIP，不记作硬件验证；本机硬件用既有 `QUAMOLIT_CONSUMER_HEADED=1 QUAMOLIT_CONSUMER_REQUIRE_GPU=1 yarn test:consumer`，GPU缺失应失败。用户已授权合并自身全绿且无冲突PR，但未授权发版；不声称性能达标。

Calcit 0.26 的历史背景见 [历史升级记录](calcit-026-upgrade.md)。
