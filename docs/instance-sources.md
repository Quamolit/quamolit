# 实例数据源边界

`SceneContent :instances` 保留一个逻辑节点及可序列化的 `InstanceSource` 引用：`id`、`version`、`count`。坐标数据不写入 SceneDocument，也不为每个实例创建组件或 SceneNode。

网页宿主通过根模块 `instance-sources.mjs` 的 `InstanceSourceRegistry` 登记交错排列的 `Float32Array`：`[x0, y0, x1, y1, ...]`，长度必须等于 `count * 2`。通用 Float32 快照与受控读取位于 js-ffi 0.1.37；Quamolit 模块只约束坐标布局和 Scene 引用。登记时复制并拒绝非有限值、共享内存、错误长度。调用者之后修改原数组不会改变已登记版本；相同 ID 的下一次登记必须采用更大的整数版本。旧版本可以保留给在途帧，显式 `release` 后才释放登记项，而且旧版本号仍不可复用。

`resolve(source)` 要求 ID、版本和数量完全一致，返回不暴露底层数组的快照 token。上传后端可用 js-ffi 的 `float32CopyRange` 取得独立副本。当前方案每次登记至少复制 O(n) 数据，Canvas 参考页逐实例循环仅为可重复像素验证，**不是生产绘制性能承诺**。未来资源表、局部脏区和 GPU 上传策略分别在后续里程碑实现；本边界不擅自规定 GPU buffer 生命周期。

验证：`yarn test:instance-sources` 检查 1 万实例、数组修改隔离、版本切换和错误输入；`yarn test:motion-browser` 检查同一时间切换版本后的具体像素。已有 `yarn test:scene-diff` 检查资源版本变化的 dirty flag。
