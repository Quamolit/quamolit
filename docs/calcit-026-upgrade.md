# Calcit 0.26 工具链升级

本切片把 Quamolit 的编译器、生成代码 runtime 与独立消费者统一到 Calcit `0.26.0`。升级不是只改 `deps.cirru`：根项目与消费者的 `@calcit/procs`、锁文件、CI 安装输入和中英文文档使用同一版本。

## 版本合同

`yarn test:runtime` 在执行生成代码的同时检查以下六个值完全相等：

- 当前 `calcit --version`；
- 根项目 `deps.cirru` 的 `:calcit-version`；
- 根项目声明与实际安装的 `@calcit/procs`；
- 独立消费者的 CLI/runtime 声明；
- 从 `@calcit/js-ffi` 包位置实际解析到的 `@calcit/procs`。

js-ffi `0.2.1-alpha.10` 自身仍声明 `@calcit/procs@0.24.3`。根项目暂用 Yarn `resolutions` 将整个依赖图统一到 `0.26.0`，避免 nominal 类型或 runtime 单例跨版本。上游由 [calcit-lang/js-ffi#150](https://github.com/calcit-lang/js-ffi/issues/150) 跟踪；新 tag 对齐后应删除 resolution 并重跑本页全部门禁。

## 严格诊断对照

在同一 `calcit.cirru` revision 上分别用 0.24.3 与 0.26.0 执行：

```sh
calcit analyze weak-types --ffi-evidence --summary-only --format json
```

两版结果相同，因此本次版本升级没有通过放宽类型来消除诊断：192 个定义、53 个 namespace、540 个命中，其中 `schema-dynamic=467`、`code-nil=45`、`unsafe-coerce=28`、FFI evidence 500。`unresolved=324`、`intentional-js-ffi=188`、`explicit-unsafe=28`。这些是当前源码的迁移债务，不是通过条件；新代码仍按 [Calcit-first FFI 规则](calcit-first-ffi.md)收紧。

Calcit 0.26 会阻断 nominal enum 的旧式谓词用法。本次依赖的前置修复已把 `quamolit.alias/arrange-children` 的 `some?` 改成 Option nominal 判定；没有增加全局 allow、宽泛 `Dynamic` 或忽略 warning 的参数。WebGPU 外部宿主导出通过 Calcit 可达引用保留，空位移使用具名 `Option<RectTranslation>`，不依赖 JS 侧补丁。

## 本地验收矩阵

| 门禁 | 结果 | 覆盖范围 |
| --- | --- | --- |
| `yarn compile` | PASS | caps 依赖选择、Calcit 0.26 主入口代码生成 |
| `yarn test:runtime` | PASS | 六处版本一致性与生成 core/runtime 实际调用 |
| `yarn compile:demos` | PASS | 全部 demo 入口、视觉夹具、独立消费者编译 |
| `yarn test:consumer` | PASS | 干净临时目录安装、严格检查、Node/Chromium、1000 帧与 10k 实例；无硬件 adapter 的 GPU 项明确 SKIP |
| `yarn test:visual` | 11/11 PASS | Chromium 固定时间画面、重放、资源失败反例 |
| `yarn release` | PASS | Vite 生产构建 |
| `yarn test:clock` | 13/13 PASS | 定义测试、重复时间与回退 |
| `yarn test:fixtures` | 5/5 PASS | 固定输入、打断重放和 1k 混合场景 |

CI 仍以 `.github/workflows` 中的 `setup-calcit@v1` 安装工具；它读取仓库 `deps.cirru`，日志必须显示 `calcit version: 0.26.0` 且不再出现根项目版本 mismatch。PR 只有在 `test`、`bench-smoke`、`visual` 全部通过后才满足升级验收。

## 保留限制

- js-ffi 的 npm manifest 尚未原生对齐 0.26，当前 resolution 是有 issue 的临时绕过。
- touch-control 仍请求较旧 js-ffi `0.1.35`，caps 按 SemVer 选择根项目的 `0.2.1-alpha.10`；编译与现有测试已验证该选择，但上游依赖范围尚未更新。
- 当前严格诊断债务没有在工具链 PR 内批量改写；后续按功能 namespace 分批消除，避免把升级与行为重构混在一起。
- 无头 Chromium 没有非软件 WebGPU adapter，独立消费者硬件专项继续以 SKIP 报告，不能把它写成 GPU 通过。
