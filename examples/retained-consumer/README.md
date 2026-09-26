# 独立 Calcit 消费者

本目录是单独的 Calcit/Yarn 项目，不是 Quamolit workspace 子包。主要源码是 `calcit.cirru` 中的 `app.main`；通过公共 Calcit 模块声明静态横条和带标量 Motion 绑定的矩形，构造保留计划并绘制 Canvas。JS 入口只连接页面按钮、传入 Canvas 原生上下文与展示诊断计数，不实现动画或渲染循环。

使用 Calcit 0.22.0、Node.js 24 和 Yarn 4.12.0：

```sh
cd examples/retained-consumer
yarn install --immutable
yarn compile
calcit query def app.main/declare --raw
calcit query def app.main/update-plan --raw
```

`deps.cirru` 固定已经合并的 #106 提交，便于立即复现；没有引用不存在的新 tag。要验证另一已推送提交或发布 tag，使用 `caps --ci add Quamolit/quamolit -r <ref>`，再编译。不需要 npm 的 Quamolit 包或 `@calcit/js-ffi` 包；当前路径唯一 npm 直接依赖是 `@calcit/procs`。

从 Quamolit 根目录可运行 `yarn vite examples/retained-consumer --host 127.0.0.1 --port 5183` 查看页面。Vite 只是开发服务器，不是 Calcit 消费者的运行时依赖。点击时间按钮可乱序查看中间帧，在相同时间修改 Model、资源 ready 与宽度版本，观察声明次数及画面更新。

## API 调用顺序

`declare(props, model, input, ready, viewport)` 返回 `ComponentDeclaration`，包含带稳定 ID/key 的 Scene 和对应 ID/version 的 Motion 描述。`request` 构造带完整版本的 `ComponentRequest`，`start` 调用 `build-component-plan`，`update-plan` 调用 `update-component-plan`。`draw!` 用 js-ffi 清屏，再交给 Quamolit 的 Calcit Canvas 参考绘制入口。

模型数值在这个小示例中同时充当非负版本；真实应用应把模型内容与单调修订号分开。props/声明变化必须提升 component 版本，不能仅换闭包却保留版本。viewport 参数是逻辑宽度输入，不是完整 DPR/resize 适配。

## 隔离门禁

从仓库根目录运行 `yarn test:consumer`，或 `QUAMOLIT_CONSUMER_REF=<已推送 SHA 或 tag> yarn test:consumer`。完整流程与验收边界见 [独立消费检验](../../docs/isolated-consumer.md)。该命令会新建系统临时目录，联网安装、编译并搬移可达产物；成功/失败都保留临时目录供排查，路径写入报告。模块缓存可以复用，不声称验证冷缓存下载性能。

当前示例只验证顶层矩形、CPU 标量绑定和版本失效，不含进入/退出/重排、真实资源释放、完整调度器或 WebGPU；不能据此关闭 #104 或 M2。
