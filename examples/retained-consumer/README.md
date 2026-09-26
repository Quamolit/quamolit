# 独立 Calcit 消费者

本目录是单独的 Calcit/Yarn 项目，不是 Quamolit workspace 子包。主要源码是 `calcit.cirru` 中的 `app.main`；通过统一 Calcit 执行入口声明静态横条、标量 Motion 矩形及 CPU 变换折线，使用同一个 ComponentPlan 绘制 Canvas。JS 入口只连接页面按钮、传入 Canvas 原生上下文与展示诊断计数，不实现动画或渲染循环。

使用 Calcit 0.22.0、Node.js 24 和 Yarn 4.12.0：

```sh
cd examples/retained-consumer
yarn install --immutable
yarn compile
calcit query def app.main/declare --raw
calcit query def app.main/update-plan --raw
```

`deps.cirru` 固定 #118 已推送的候选提交 `12edc27020adf7f9ed55a4ad7adaa7d9e4c123fb`，用于 GPU 公共 API 验证；它不是发布 tag。要验证另一已推送提交或发布 tag，使用 `caps --ci add Quamolit/quamolit -r <完整 SHA 或 tag>`，再编译。不需要 npm 的 Quamolit 包或 `@calcit/js-ffi` 包；当前路径唯一 npm 直接依赖是 `@calcit/procs`。

从 Quamolit 根目录可运行 `yarn vite examples/retained-consumer --host 127.0.0.1 --port 5183` 查看页面。Vite 只是开发服务器，不是 Calcit 消费者的运行时依赖。点击时间按钮可乱序查看中间帧，在相同时间修改 Model、资源 ready 与宽度版本，观察声明次数及画面更新。

## API 调用顺序

`declare` 返回纯 Scene/Motion 声明，`declare-execution` 添加蓝色折线及 CPU 变换提供者，返回 `ExecutionDeclaration`。`request` 构造带完整版本的 `ComponentRequest`，`start` 调用 `build-execution-plan`，`update-plan` 调用 `update-execution-plan`。`draw!` 用 js-ffi 清屏，再调用统一 `draw-plan!`，调用者不选择内部标量/路径计划。

蓝色折线的局部端点是 `(0,140) → (40,140)`，横向变换为 `20 + 10*time + model - 40`。连续时间同时改变粉色矩形的标量绑定和折线变换；同时间 Model 改变会重新声明二者。静态节点、折线局部几何和标量槽位在 1000 个时间更新中保持对象身份，绑定采样与变换采样计数分别显示。

模型数值在这个小示例中同时充当非负版本；真实应用应把模型内容与单调修订号分开。props/声明变化必须提升 component 版本，不能仅换闭包却保留版本。viewport 参数是逻辑宽度输入，不是完整 DPR/resize 适配。

## 隔离门禁

从仓库根目录运行 `yarn test:consumer`，或 `QUAMOLIT_CONSUMER_REF=<已推送 SHA 或 tag> yarn test:consumer`。完整流程与验收边界见 [独立消费检验](../../docs/isolated-consumer.md)。该命令会新建系统临时目录，联网安装、编译并搬移可达产物；成功/失败都保留临时目录供排查，路径写入报告。模块缓存可以复用，不声称验证冷缓存下载性能。

GPU 消费使用同一个 `declare` 的两个矩形：`start-rects` → `prepare-gpu`，成功分支得到参数程序，调用 `create-gpu!` / `install-gpu!` 后，热帧只调用 `draw-gpu! host program time`，不逐帧 CPU 采样。程序必须与 host 当前安装的程序一致；同时间输入变化由 `update-rects` 和 `gpu-reusable?` 判断，不可复用时重新准备和安装；结束调用 `dispose-gpu!`。这些应用函数只导入 Quamolit Calcit 模块，宿主片段在编译时内嵌，没有额外 JS 文件供使用者手动导入。

现有页面仍展示完整混合 Canvas 场景，不因 GPU 支持范围删除折线。门禁额外验证矩形 GPU 子集和完整混合场景的明确回退；浏览器硬件专项无非软件 adapter 时标记 SKIP。独立消费者尚不含进入/退出/重排、真实资源表释放、完整调度器或硬件性能验收，不能据此关闭 #104 或 M2。
