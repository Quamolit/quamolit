# Calcit 工具链升级与版本合同

当前候选采用已发布的预发布工具链 Calcit / `@calcit/procs@0.30.0-alpha.3`；主线基线为 `0.29.3`，旧 Quamolit alpha.4 仍为 `0.28.0`。候选不等于正式发版或 milestone 验收。根项目、独立消费者、deps、npm resolution、锁文件与中英文入口必须同步，不只升级作者本机 CLI。

## 版本与来源

`yarn test:runtime` 检查 CLI、根/消费者的 deps、runtime 声明与实际安装版本，以及从 js-ffi 包位置解析的 runtime，全部必须为 `0.30.0-alpha.3`；同时检查 js-ffi 模块 tag、npm Git tag、包版本与实际模块版本一致。另运行 `caps verify --toolchain`。js-ffi 保持已发布 `0.2.3`，不提前引用未发布接口。

官方 alpha.3 tag 与 npm runtime 的 gitHead 同为 `f8f1e87007b95d4e5c6fa5df89be731c096fc49d`。macOS 缺少该 release 的原生可执行资产，本地从此 tag 用 `cargo build --locked --release --no-default-features --bin calcit` 构建隔离 CLI；这是 JS / native 验证，不是 WASM/WASI 验证。不覆盖用户全局 CLI。CI 的 `setup-calcit@v1.5.0` 读取根 deps 并安装对应 Linux release。

## 本轮迁移范围

- 采用当前规范的 `calcit --check-only --ns …`，保持所有原 namespace scope 与负例断言，不以兼容模式或 Dynamic 掩盖错误。
- 两个本地 namespace（Motion 测试夹具和 Drag）通过结构化事务、dry-run 与 scoped_revision 移除 import rule 的冗余 `[]`，保留别名、引用与顺序；程序 List 构造不变。
- 0.30 的 println/echo Unit 返回、开放 update-in 回调 Option、nominal schema 与 JS FFI fallback 检查变化均通过实际编译/测试验证，不为版本升级改写动画功能。
- pointed-prompt 0.0.17 的同类 import 警告是非阻塞上游规范债，已报告 [pointed-prompt #23](https://github.com/mvc-works/pointed-prompt/issues/23)。不修改共享缓存，待包含修复的发布 tag 后复测升级。
- `calcit.cirru` 仍是源码，不标记 generated；27 个命名 entry、默认 bootstrap 和独立消费者 Snapshot 边界不变。inline/file 自动随模块分发的验收继续复用已有消费者。

## 保留的迁移边界

此前 0.28/0.29 已完成 Option Map 读取、non-nil?、FontFace identity、尾递归位置和显式 Ref 元素类型等迁移，现有语义/非法输入断言继续保留。旧矩形参数维持 nil/false 默认值、0 保留及非法字符串拒绝。

保留名 ref 的 rename-local planner 问题已报 [Calcit #2049](https://github.com/calcit-lang/calcit/issues/2049)；此前已在两处小函数用结构化事务局部绕过。旧 textbox 的原始 keyCode/shiftKey FFI 权限债归 #36，不给整个 namespace 加宽泛 capability，也不把主路径成功声称为全库 canonical preset 通过。Pointer 宿主的临时类型适配待 [js-ffi #149](https://github.com/calcit-lang/js-ffi/issues/149) 对应接口发布后复测移除；不删除现有拒绝、捕获和卸载断言。

## 验证与交付

本轮已通过 CLI/runtime 合同、公共主路径 106/106 严格定义检查、全项目原生测试 154 项、API 清单及 17 项负例、测试 JS 格式检查。完整发布导航、独立候选消费和硬件验证仍需按最终提交验证；不得沿用 0.29 或其他功能分支的绿灯。不修改像素容差或基线。

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

PR 的 Benchmark、Upload、Visual 必须在准确 head 全部成功后才转 Ready。无头 GPU 缺失明确 SKIP，不记作硬件验证；本机硬件用既有 `QUAMOLIT_CONSUMER_HEADED=1 QUAMOLIT_CONSUMER_REQUIRE_GPU=1 yarn test:consumer`，GPU 缺失应失败。报告与截图留在忽略目录/artifact，不入库；不声称性能达标，不自行合并或发版。

Calcit 0.26 的历史背景见 [历史升级记录](calcit-026-upgrade.md)。
