# 图表 UI 动画构件

`quamolit.ui-motion` 是面向声明式图表和交互 UI 的第一层公共动画语法。它把多个作品里重复出现的绝对时间 tween、错峰进入、数值渐变和进入／退出合成收敛为严格类型的 Calcit API；它不持有宿主状态，也不直接调用 Canvas 或 WebGPU。

## 公共 API

- `tween-at(start, duration, from, to, time)`：使用 `smoothstep` 按绝对时间采样标量。
- `smooth-stagger(start, gap, duration)`：创建错峰参数；`stagger-at(spec, index, time)` 以稳定索引采样 `0..1` 进度。
- `morph-number(from, to, position)` 与 `morph-integer(...)`：对已经归一化的进度做数值渐变。
- `crossfade-in(position)` 与 `crossfade-out(position)`：生成互补透明度。
- `presence-frame(enter, exit, enter-distance, exit-distance)`：合成 `alpha`、位移 `offset` 和卸载信号 `mounted`。

```cirru
let
    stagger $ ui/smooth-stagger 0.12 0.065 0.3
    enter $ ui/stagger-at stagger stable-index time
    exit $ if removed? exit-position 0
    frame $ ui/presence-frame enter exit -16 24
  if
    not $ :mounted frame
    []
    render-row (:alpha frame) (:offset frame)
```

`time`、`start`、`gap`、`duration` 均以秒为单位。索引必须来自稳定数据身份的排序结果，不能因为当前可见数组删除了一项就让后续项目重新编号。`mounted=false` 只表示 Scene 应移除该节点；资源引用计数、GPU buffer 与指针捕获仍由现有 Presence/宿主资源层负责。

## 已迁移作品

Metric Flow、Signal Weave 与 Cohort Pulse 已共同使用 `ui/tween-at`。Cohort Pulse 进一步以 `stagger-at` 控制行和热力单元，以 `morph-number` 重排行位置，以 `presence-frame` 合成安全群组退出过程。这样公共构件不是孤立样例，同时保留每个作品自己的业务几何和视图 Model。

这层 API 当前走 Canvas2D 参考渲染，但返回值与后端无关。未来 WebGPU 只需要消费相同 Scene/Motion 描述；本切片不声称已经完成 GPU lowering、资源释放或吞吐优化。

## 检验

```sh
yarn test:ui-motion
yarn test:tidal-bloom
yarn test:signal-weave
yarn test:cohort-pulse
```

`test:ui-motion` 检查四个公共命名空间的严格类型，并用独立手算值验证错峰、数值渐变、交叉淡化、卸载端点和非法输入。三个作品命令继续负责 Node 重放合同和 Chromium 固定帧截图。
