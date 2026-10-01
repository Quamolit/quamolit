# Calcit 工具链升级与版本合同

当前候选使用已发布的 Calcit `0.28.0-alpha.3`、匹配的 `@calcit/procs@0.28.0-alpha.3` 和 js-ffi `0.2.1-alpha.11`。这是配套 prerelease，不冒称最新稳定版。根项目、独立消费者、`deps.cirru`、npm runtime、Yarn resolution、锁文件和中英文入口同步；不接受仅升级本机 CLI。沿用本页与现有门禁，不另建升级测试体系。

## 版本合同

`yarn test:runtime` 同时检查当前 `calcit --version`、根项目与消费者的 `:calcit-version`、两处 `@calcit/procs` 声明和实际安装版本，以及从 js-ffi 包位置解析到的 runtime。全部必须为 `0.28.0-alpha.3`；另用 `caps verify --toolchain` 检查模块与 runtime。

js-ffi alpha.11 已同步 CLI/runtime，不再沿用 alpha.10 的旧版 runtime 说明。根 `resolutions` 继续约束消费者安装为同一 runtime 单例，不改变平台 API 与 Quamolit 业务代码的归属。

升级预检复用 GPU 公共入口（80 个定义）、Motion/保留组件/三个图表 demo（169 个定义）、GPU Node 合同（23 项）及 Motion Chromium（31 项）。这些不是全项目类型验收或真实 GPU 验收。选定主路径的 `core-api-0.28-v1` 预览为空，不为“升级”制造无必要的源码改写。

## 升级原则

- `calcit.cirru` 仍是 canonical source snapshot，不标记为 generated，也不以文本替换修改业务定义。
- 先以严格 public schema、编译、Node、浏览器和独立消费者门禁暴露问题；不增加全局 allow 或宽泛 `Dynamic` 绕过。
- 新版本若暴露编译器缺口，向 Calcit 仓库提交最小复现，同时采用局部、可撤销的适配继续推进。
- Pointer 浏览器入口的两处旧 `assert-type` 改为显式宿主 `unsafe-coerce`，保留 `expect-object` 的拒绝与对象身份；它们信任真实浏览器提供的字段/方法，不是假装运行时 shape decoder。原有捕获/卸载合同与同文件的非法值断言覆盖此边界。[js-ffi #149](https://github.com/calcit-lang/js-ffi/issues/149) 发布通用入口后删除本地适配，不新增 JS wrapper。
- 全项目 preset 预览会在旧 `quamolit.render.element/textbox` 的原始 `keyCode/shiftKey` 访问处报告 `E_JS_FFI_FEATURE_REQUIRED`；这是 legacy 宿主边界迁移债，不是编译器缺陷，归入 #36。主路径编译成功不能冒充该预览通过，不给整个组件补宽泛 capability 来隐藏它。

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

CI 的 `setup-calcit@v1` 读取根 `deps.cirru`，日志必须显示 `calcit version: 0.28.0-alpha.3`，且 `test`、`bench-smoke`、`visual` 全部通过。无头环境没有非软件 WebGPU adapter 时仍明确 SKIP，不冒充硬件验收。

Calcit 0.26 的迁移背景和当时诊断见 [历史升级记录](calcit-026-upgrade.md)。
