# Calcit 工具链升级与版本合同

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
