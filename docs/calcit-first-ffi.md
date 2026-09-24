# Calcit 优先的浏览器 FFI 边界

Quamolit 的目标是增强 Calcit 动画生态：声明式组件与显式时间产生 Scene/Motion IR，增量执行与绘制逻辑由 Calcit 实现。JavaScript 是浏览器宿主互操作手段，不是另一个 Quamolit 运行时。

## 归属规则

| 内容 | 归属 | 验收依据 |
| --- | --- | --- |
| Canvas2D/WebGPU 原生对象、方法、常量的类型和最薄调用边界 | `js-ffi` 的 Calcit 命名空间 | Calcit 公共 API 可直接导入、严格类型检查；无整场景命令格式 |
| Scene/Motion 遍历、矩阵/颜色/透明度语义、批次编排、失效、资源版本和后端选择 | Quamolit 的 `calcit.cirru` | 相同输入与绝对时间可在 Calcit 测试复现；下游只引用 Calcit 模块 |
| 尚无法用 Calcit 表达的浏览器对象生命周期、GPU buffer/typed array 原生操作 | Quamolit 的 `src/host/`，确有跨项目通用性才考虑上游最小实现 | 每个 JS 文件写清不可替代的宿主能力；不接收 Scene IR 或应用模型 |
| 测试页面、浏览器夹具、构建入口 | `test/`、根目录 `main.mjs` 和 `vite.config.mjs` | 不对下游暴露为框架 API |

禁止以“减少跨语言调用次数”为唯一理由，把 Scene IR 序列化成大包交给 JS 命令解释器。若性能测量显示逐图元调用不可接受，先用 Calcit 编排 retained plan、脏范围和 typed array，随后只将确需原生执行的批量提交操作放在宿主边界。比较必须记录帧时间、复制字节、调用次数、画面语义与设备。

## 当前债务与迁移顺序

`js-ffi` 的 0.1.45 曾加入 Canvas Scene 的 JS 命令解释器。这是与上述方向不符的实验接口，Quamolit 已回到 0.1.44，不再继续消费它；已发布 tag 不改写历史。后续上游 PR 应新增基础 Canvas2D/WebGPU 的 Calcit 类型化原语，明确哪些调用必须留 JS，再考虑废弃该实验接口。

本仓库 `src/host/` 目前仍有 JS 实现，并非架构目标。优先迁移纯逻辑：`gpu-vec2-translation`、`retained-scene-plan`、`demand-frame-scheduler`、`presence-resources`；然后迁移实例源/画布批次的决策逻辑。WebGPU device、buffer、pipeline 的原生句柄与浏览器事件桥保留最窄 JS 边界。每迁移一项，删除对应的宿主业务代码，而不是保留 Calcit 转发层；同一测试应继续检验乱序时间、资源版本、DPR、失败与释放。切换到生产入口之前，不把现有 JS 夹具称作最终 Calcit API。

## PR 退出检查

1. 新增宿主调用先列出所需浏览器 API、Calcit 里可表达的部分及必须保留 JS 的具体原因；评审新增 JS 行数及是否触碰 Scene/Motion 业务决策。
2. `js-ffi` 的公共接口由 Calcit 定义，Quamolit 下游示例不直接导入它的 `.mjs`；任何跨项目 JS 包装须证明是不可替代的原生能力。
3. 运行受影响命名空间的 `calcit analyze check-public`、原生测试、JS 编译、Node/Chromium 固定时间与像素回归；有 GPU 结论时必须实际用非软件 adapter 验证。
4. 记录迁移前后相同 fixture 的语义和性能数据；没有测量就只称为代码归属重构，不宣称加速。
