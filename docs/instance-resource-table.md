# 版本化实例源资源表：M2 #51 切片

推进 #51，为 #38/#40 的公共实例负载提供逻辑 `InstanceSource (id/version/count)` 到宿主 Float32 快照的版本化所有权；它是 Canvas/WebGPU 实例缓冲复用的前置。表逻辑为 Calcit 公共入口，Float32 复制与所有权计数由定义级 `:file` 宿主片段承担。

## API（`quamolit.instance-resource`）

```cirru
let
    table $ resource/create-table!
    _ $ resource/register! table source positions
    snapshot $ resource/resolve table source
    copied $ resource/register-patch! table next-source (:version source) 5000 $ positions-patch
    patch $ resource/patch-info table next-source
    released? $ resource/release! table source
  resource/live-count table
```

| 定义 | 语义 |
| --- | --- |
| `create-table! () -> InstanceTableHost` | 新建空表；由 `:file` 宿主片段返回专属句柄 |
| `register! (table, source, positions) -> Float32ArrayHost` | 校验 `id/version/count` 与交错 Float32，复制快照并登记；同 id 版本必须递增 |
| `register-patch! (table, new-source, base-version, start, positions-patch) -> Number` | 同一 id/count 的新版本只复制从 `start` 开始的连续实例片段，返回实际复制字节数；片段为交错 Float32，`base-version` 必须仍可解析 |
| `patch-info (table, source) -> PatchInfo` | 返回类型化 `available?/base-version/start/count/positions`；补丁数据再次复制，调用方修改不会污染表。全量版本返回 `available?=false` |
| `resolve (table, source) -> Float32ArrayHost` | 返回已登记快照；缺失或计数不符显式失败 |
| `release! (table, source) -> Bool` | 删除该版本；不存在返回 `false` |
| `live-count (table) -> Number` | 当前 live 的 `(id,version)` 条目数 |

`table` 统一为本项目的 `InstanceTableHost`，`source` 是 `quamolit.scene-ir/InstanceSource`；全量及补丁 `positions` 都是 `js-ffi.typed-arrays/Float32ArrayHost`，交错 `[x0, y0, x1, y1, ...]`，全量长度必须为 `count * 2`，补丁长度必须为偶数。公共 API 不接受裸 JsObject 作为表或位置数组。

此句柄用 `deftrait` + `:ffi (:kind :external-object)` 声明实际宿主方法，不新增 JS 包装对象或序列化表。`create-table!` 仅在可信的本项目 `raw-create-table!` 返回位置收窄；GPU/Presence 及独立消费者同步使用专属表类型。`patch-info` 的原生 DTO 仍是一个局部 JsObject 边界，进入 Calcit 后通过已有字段校验转换为 `PatchInfo`；不宣称整个 Trait/框架已消除 JsObject。表仍属实验接口，不提升稳定性标签。

## 归属与实现

- 版本递增、计数校验、复制隔离、释放与 live 计数都在 `src/host/instance-resource-table.mjs` 中；该文件是 Calcit `:ffi :js :file` 单函数表达式，返回一个带方法的句柄，不含 `import`/`export`/`require` 词元。
- Calcit 侧：`raw-create-table!` 走 `:file`，公共操作通过 `InstanceTableHost` 的类型化方法调用同一个宿主；历史 `raw-*` inline 原始 ABI 保留为内部实现兼容，不作为新应用推荐入口。
- 类型引用 `quamolit.scene-ir` 与 `js-ffi.typed-arrays/Float32ArrayHost`，不新增裸宿主文件导入。独立消费者必须检查实际入口可达的编译模块和 npm 依赖，不能把类型化本身视为分发验证。

## 语义

- 全量登记与补丁登记都复制并校验有限数值、拒绝共享内存；调用者之后修改原数组不会改变已登记版本。
- 补丁版保留基版引用，只复制脏段；`resolve` 第一次请求连续快照时从最近已物化版本复制整层、按版本顺序应用补丁。仅走 GPU 连续增量路径时不触发整层物化；Canvas 参考或跳过版本的 GPU 全量回退会触发一次整层复制。返回的 `resolve` 快照沿用旧 API 的可变宿主数组约定，调用方不得修改它。
- `register-patch!` 的返回值只计登记时复制的脏段；`patch-info` 对外返回又复制一段，GPU 上传指标另计，三者不可合并当成一次 CPU 拷贝。
- 同一 `id` 的版本号必须严格递增（即使旧版本已释放）；`resolve` 要求 `(id,version,count)` 完全匹配。
- 释放只影响该版本的公开查找；尚存补丁版本仍持有构造正确快照所需的基版引用。最后一个后代释放后可由 GC 回收；`live-count` 随登记/释放回到基线，不承诺物理显存立即归零。

## 测试与边界

`yarn test:instance-resource` 严格检查 `quamolit.instance-resource`，编译 Motion 目标并运行 `test/instance-resource-smoke.mjs` 和 `test/instance-resource-types.test.mjs`；CI 的 `visual.yaml` 在 Canvas 实例入口后执行同一命令。命令覆盖复制隔离、解析身份、重复释放、版本递增、10k 源的 8 B 单实例补丁、跳版本解析、计数/类型非法与 100 次装卸回到 live 基线。独立负例 Snapshot 验证数字、GPU 句柄不能冒充实例表，Calcit List 不能冒充 Float32Array；三个负例都须被严格公共检查拒绝。

## 尚未完成

- 与 #49 生命周期和 Presence 释放通知的实际接线、真实 GPU buffer 的 `ready/error/loading` 与 device loss 重建仍待办；本表只提供逻辑 `(id,version)` 到宿主快照的版本化所有权。
- #38/#40 的公共 GPU 上传已可消费此表的连续版本补丁，但普通组件自动合批、动画源、脏字段（尺寸/颜色/变换）、容量变化与生产调度仍未贯通。长时间补丁链的压缩/内存上界尚未验收。
