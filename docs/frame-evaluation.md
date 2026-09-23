# 显式帧求值

`quamolit.frame-eval` 提供不依赖浏览器的帧求值入口。调用方保存返回值，并将其中的场景交给渲染器。更新函数和视图函数应保持纯粹：不读取墙上时间、全局 atom 或浏览器状态，不派发事件，也不修改外部数据。

## API 与时间语义

`EvaluatedFrame<M, S>` 是泛型结构，包含 `sample: FrameSample`、`model: M`、`scene: S`；`FrameSample` 中的 `time` 与 `elapsed` 单位均为秒。模型和场景的类型关系由 Calcit schema 保留。当前场景可以是旧版 `Shape` 或测试数据，后续由 #32 定义 Scene IR。

- `initial-frame(time, model, view)`：用显式模型建立起点，调用一次 `view(model)`，采样间隔为零。不调用模型更新函数。
- `evaluate-at(previous, time, update-model, view)`：时间前进时调用 `update-model(previous.model, sample)`，再将新模型传给 `view`，返回完整的新帧。
- 重复时间：返回零间隔采样并复用上一帧模型与场景，不调用两个回调，可用于暂停时的重复请求。
- 倒退时间：在调用回调前报错。调用方可以用 `initial-frame` 显式建立较早的起点，再重放采样序列。

时间由调用方转换为模拟时间；暂停期间维持同一个模拟时间，恢复后按期望的步长推进。求值器不会自动扣除墙上时间中的暂停时长。若模型因输入事件改变，或视图函数发生变化，可以在当前模拟时间用新的模型和视图建立初始帧，再继续推进；重复时间请求本身不会刷新视图。

## 可编译的迁移示例

仓库中的 `quamolit.test.frame-fixture/update-progress` 和 `scene` 就是下面两个函数，已纳入 `yarn compile:visual`。它们分别接收明确的模型和时间采样，不再通过组件的 `on-tick` 修改全局进度。

```cirru
defn update-progress (model sample)
  hint-fn $ {} (:return 'Number)
    :args $ [] 'Number 'quamolit.frame-clock/FrameSample
  + model $ :elapsed sample

defn scene (progress)
  hint-fn $ {} (:return 'quamolit.types/Shape)
    :args $ [] 'Number
  rect $ {} (:w 48) (:h 48) (:y 80) (:fill-style |#ec4899)
    :x $ + 48 $ * 160 progress
```

从 `quamolit.frame-eval` 引入 `initial-frame` 和 `evaluate-at`，从 `quamolit.alias` 引入 `rect` 后，可以指定中间帧：

```cirru
let
    start $ initial-frame 0 0 scene
    frame $ evaluate-at start 0.5 update-progress scene
  :scene frame
```

此时模型为 `0.5`，矩形中心为 `x=128`。框架的 `paint-tree-only-with` 消费 `(:scene frame)`；重绘直接复用它，无需再次调用 `evaluate-at`。测试夹具中的 atom 只负责保存最新返回值，求值器本身没有隐含可变状态。

## 重放与截图

确定性保证针对相同的初始模型、纯函数和采样序列。依赖 `elapsed` 积分的动画可能受采样步长影响，因此应保存并重放完整序列，不能假定一次跳到终点与多个小步总是相同。直接根据 `sample.time` 计算关键帧插值的动画，可以由应用定义与步长无关的采样逻辑。

随机动画应把种子或生成器状态放入模型，并由纯更新函数返回下一份随机状态。异步资源也应先转为显式的就绪／失败数据与稳定资源标识，再进入模型；截图前固定这份输入，求值过程中不发起加载。

`yarn test:clock` 覆盖单步、相同输入重放、暂停时的重复请求、倒退拒绝、显式重置，以及不同模型／场景类型。浏览器夹具检查五个固定时间的像素、重绘和重复时间的像素一致性；具体命令见[确定性帧测试](../test/README.md)。
