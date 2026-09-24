# 实例数据源边界

`SceneContent :instances` 保留一个逻辑节点及可序列化的 `InstanceSource` 引用：`id`、`version`、`count`。坐标数据不写入 SceneDocument，也不为每个实例创建组件或 SceneNode。

网页宿主通过根模块 `src/host/instance-sources.mjs` 的 `InstanceSourceRegistry` 登记交错排列的 `Float32Array`：`[x0, y0, x1, y1, ...]`，长度必须等于 `count * 2`。通用 Float32 快照与受控读取现通过 js-ffi 0.1.43 的 Calcit 命名空间 `js-ffi.typed-arrays` 提供，由 Quamolit 的 `quamolit.instance-ffi` 薄适配层引用；底层 JS 只留在上游实现。登记时复制并拒绝非有限值、共享内存、错误长度。调用者之后修改原数组不会改变已登记版本；相同 ID 的下一次登记必须采用更大的整数版本。旧版本可以保留给在途帧，显式 `release` 后才释放登记项，而且旧版本号仍不可复用。

`resolve(source)` 要求 ID、版本和数量完全一致，返回不暴露底层数组的快照 token。上传后端可通过编译后的 `quamolit.instance-ffi/copy-range` 取得独立副本。当前方案每次登记至少复制 O(n) 数据；Canvas 参考页已改用[批量宿主调用](canvas-instance-batches.md)绘制，但 Canvas 内部仍逐矩形执行，**不是生产绘制性能承诺**。同一页面新增 [WebGPU 矩形实例切片](webgpu-instances.md)，但通用资源表、更丰富的局部脏区及生产 GPU 上传策略仍待后续里程碑；本边界不擅自规定 GPU buffer 生命周期。

验证：`yarn test:instance-sources` 检查 1 万实例、数组修改隔离、版本切换和错误输入；`yarn test:motion-browser` 检查同一时间切换版本后的具体像素。已有 `yarn test:scene-diff` 检查资源版本变化的 dirty flag。
