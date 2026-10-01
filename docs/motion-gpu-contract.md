# Motion GPU 降低与执行契约

`quamolit.motion-gpu` 是描述符到受限执行计划的纯数据转换，**不是 GPU 执行器**。输入仍由 `quamolit.motion` 的 CPU 参考采样器校验；计划保留 `id`、`version`，不包含宿主句柄、任意回调或上一帧状态。调用方必须检查 `:supported plan` / `:unsupported reason`，不可把后者当作可编译 WGSL。

当前标准标量子集为常量、`scale * time + offset`、`ScalarTween`（linear、smoothstep，含 `duration=0` 跳变），以及最多 16 个采样点的 `ScalarTrack`。轨道计划原样保留有序帧、重复时间和 clamp/repeat/mirror 模式；超过 16 帧返回 `keyframe-capacity-exceeded`。16 是本阶段的显式计划容量，不是 GPU 性能最优值；未来 #52 仍需决定缓冲布局、索引与数据上传策略。`lower-composition` 支持恰好两片可降低标量叶子的 add、multiply、mix；嵌套组合在原有 IR 结构上不可表示。

`lower-vec2` 支持 Vec2 常量与共享进度的 Vec2 tween，保留同一个 ID/version 与带类型的两个端点。`lower-cpu-scalar` 始终返回描述符里的 CPU-only 诊断，绝不转译注册回调。颜色、资源输入尚未进入此 GPU 子集，仍由 CPU 参考路径处理。计划中的 `:supported` 仅表示已落在受限数据子集内，不表示当前环境能用 WebGPU，也不表示已经执行了 WGSL。

空 ID、非有限/负数/非整数版本、无效持续时间、数值和轨道属于输入错误，会抛错；合法但不受支持的表达式才返回 `:unsupported`。CPU 自定义描述还需非空 callback ID，回退理由不得为空。编译器不得静默改变语义。

## 当前矩形标量执行能力

下表是有效输入且满足[标量参数/精度合同](gpu-scalar-program.md)时的分类，`ready`仍需实际设备可用；候选lowering不等于shader已实现。`test:gpu-component`沿既有Node门禁核对这六行与编译后的Calcit，不增设注册表或测试命令。

| ScalarMotion | CPU | lowering | 矩形标量执行 |
| --- | --- | --- | --- |
| constant | yes | supported | ready |
| tween-linear | yes | supported | ready |
| tween-smoothstep | yes | supported | ready |
| time | yes | supported | fallback |
| keyframes-16 | yes | supported | fallback |
| keyframes-17 | yes | unsupported | fallback |

当前矩形目标为x/y/填充alpha；width/height/group opacity整层回退，alpha不能代替隔离组透明度。颜色、旋转、缩放和任意Calcit闭包不由这个标量执行器处理。已有Vec2 tween实例路径使用同一参数编码，但不自动继承全部候选算子。GPU数值按既定`1e-5+1e-5*abs(expected)`验证；实际硬件证据、乱序时间与支持域见标量合同，不将其他设备或整个数值域视为已验证。

`prepare-program`的逐绑定回退沿用`ProgramResult :fallback String`，在原原因后附加`;key=<逻辑key>;target=<目标>;motion=<算子>`，例如`scalar-kernel-not-supported;key=badge;target=:x;motion=:time`。该文本用于显示诊断，不是分号可解析协议（key可含任意字符）；低层`prepare-slot`仍返回原原因。重复绑定也定位该节点；整层结构、自定义变换或整体精度预算的拒绝仍是计划级原因。调用方必须回退整个计划，不得丢掉失败绑定后绘制其余部分。

运行 `yarn test:motion-gpu` 检查类型、16/17 帧容量边界、支持/回退分类、旧 fade 在 0/0.25/0.5/1 的 CPU 手算值、Vec2、固定组合与 JS 计划序列化。`yarn test:motion-browser` 使用与计划共用的描述符，在 Canvas 页面上检查关键帧和 Vec2 的乱序时间采样及像素。原有候选计划测试不验证 WGSL 或 WebGPU 性能；后续 #52 切片另行增加真实 GPU 采样与读回，不能把本页全部分类当作 #48/#52 整项验收完成。

后续已有 [Vec2 Motion 真实 GPU 时间采样切片](gpu-vec2-motion.md)：受限 Vec2 tween 可映射到 js-ffi 0.1.41 的 vertex shader 时间平移。该切片不改变本页其他 `:supported` 分类的“仅候选”含义，也未完成数值高精度等价验收。
