# Calcit 0.27 工具链升级

本切片把 Quamolit 从 Calcit `0.26.0` 升级到最新稳定版 `0.27.0`。根项目、独立消费者、`deps.cirru`、npm runtime、Yarn resolution、锁文件和中英文文档使用同一版本，不接受“本机编译器较新但仓库仍声明旧版”的隐式兼容状态。

## 版本合同

`yarn test:runtime` 同时检查当前 `calcit --version`、根项目与消费者的 `:calcit-version`、两处 `@calcit/procs` 声明和实际安装版本，以及从 js-ffi 包位置解析到的 runtime。六处必须全部为 `0.27.0`。

js-ffi `0.2.1-alpha.10` 尚未把 npm runtime 声明更新到 0.27，因此根项目继续使用 Yarn `resolutions` 统一 runtime 单例；上游仍由 [calcit-lang/js-ffi#150](https://github.com/calcit-lang/js-ffi/issues/150) 跟踪。resolution 是明确的兼容适配，不改变 Calcit 业务代码归属。

同一源码在 0.27 下的 `weak-types --ffi-evidence` 基线为：192 个定义、53 个 namespace、501 个 FFI boundary evidence、467 个 `schema-dynamic`、45 个 `code-nil`、28 个 `unsafe-coerce`。本次没有用放宽 schema 消除升级错误；这些数字用于后续逐 namespace 收紧，不是完成指标。

## 升级原则

- `calcit.cirru` 仍是 canonical source snapshot，不标记为 generated，也不以文本替换修改业务定义。
- 先以 0.27 的严格 public schema、编译、Node、浏览器和独立消费者门禁暴露问题；不增加全局 allow 或宽泛 `Dynamic` 绕过。
- 新版本若暴露编译器缺口，向 Calcit 仓库提交最小复现，同时采用局部、可撤销的适配继续推进。

## 验收

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

CI 的 `setup-calcit@v1` 读取根 `deps.cirru`，日志必须显示 `calcit version: 0.27.0`，且 `test`、`bench-smoke`、`visual` 全部通过。无头环境没有非软件 WebGPU adapter 时仍明确 SKIP，不冒充硬件验收。

Calcit 0.26 的迁移背景和当时诊断见 [历史升级记录](calcit-026-upgrade.md)。
