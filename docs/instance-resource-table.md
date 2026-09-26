# 版本化实例源资源表：M2 #51 切片

推进 #51，为 #38/#40 的公共实例负载提供逻辑 `InstanceSource (id/version/count)` 到宿主 Float32 快照的版本化所有权；它是 Canvas/WebGPU 实例缓冲复用的前置。表逻辑为 Calcit 公共入口，Float32 复制与所有权计数由定义级 `:file` 宿主片段承担。

## API（`quamolit.instance-resource`）

```cirru
let
    table $ resource/create-table!
    _ $ resource/register! table source positions
    snapshot $ resource/resolve table source
    released? $ resource/release! table source
  resource/live-count table
```

| 定义 | 语义 |
| --- | --- |
| `create-table! () -> JsObject` | 新建空表；由 `:file` 宿主片段返回句柄 |
| `register! (table, source, positions) -> JsObject` | 校验 `id/version/count` 与交错 Float32，复制快照并登记；同 id 版本必须递增 |
| `resolve (table, source) -> JsObject` | 返回已登记快照；缺失或计数不符显式失败 |
| `release! (table, source) -> Bool` | 删除该版本；不存在返回 `false` |
| `live-count (table) -> Number` | 当前 live 的 `(id,version)` 条目数 |

`source` 是 `quamolit.scene-ir/InstanceSource`；`positions` 是 `JsObject` 的交错 `[x0, y0, x1, y1, ...]` Float32 数组，长度必须为 `count * 2`。

## 归属与实现

- 版本递增、计数校验、复制隔离、释放与 live 计数都在 `src/host/instance-resource-table.mjs` 中；该文件是 Calcit `:ffi :js :file` 单函数表达式，返回一个带方法的句柄，不含 `import`/`export`/`require` 词元。
- Calcit 侧：`raw-create-table!` 走 `:file`，其余 `raw-*` 方法走 `:inline`；`create-table!`/`register!`/`resolve`/`release!`/`live-count` 是类型化 wrapper。
- 该命名空间只依赖 host-free 的 `quamolit.scene-ir`，不引入 `@calcit/js-ffi` 或裸宿主文件，可被独立消费者直接引用。

## 语义

- 登记时复制并校验有限数值；调用者之后修改原数组不会改变已登记快照。
- 同一 `id` 的版本号必须严格递增（即使旧版本已释放）；`resolve` 要求 `(id,version,count)` 完全匹配。
- 释放只影响该版本；`live-count` 随登记/释放回到基线，用于泄漏趋势判断，不承诺物理显存立即归零。

## 测试与边界

`yarn test:instance-resource` 严格检查 `quamolit.instance-resource`，编译 Motion 目标并运行 `test/instance-resource-smoke.mjs`；CI 的 `visual.yaml` 在 Canvas 实例入口后执行同一命令。命令覆盖复制隔离、解析身份、重复释放、版本递增、计数/类型非法与 100 次装卸回到 live 基线。

## 尚未完成

- 与 #49 生命周期和 Presence 释放通知的实际接线、真实 GPU buffer 的 `ready/error/loading` 与 device loss 重建仍待办；本表只提供逻辑 `(id,version)` 到宿主快照的版本化所有权。
- #38/#40 的 GPU 实例消费（顶点/参数常驻、按版本更新上传）尚未接入本表；当前仅验证表本身的所有权与基线。
