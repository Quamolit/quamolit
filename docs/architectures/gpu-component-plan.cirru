{} (:purpose |公共Calcit组件计划连接有序WebGPU矩形提交)
  :flow $ [] |ComponentPlan |Calcit整层能力判定 |RectFrame |Calcit差量RectWrite |inline/file原始GPU提交
  :constraints $ [] |不解释第二套Scene |保持透明层序 |不支持节点整层回退 |CPU闭包不转WGSL |设备与计划分离 |首次及重建全量上传
  :verification $ [] |严格类型 |1000时间帧差量 |编译后宿主调用 |Canvas回退 |非软件GPU同源像素
  :remaining $ [] |GPU标准动画采样 |静态批次缓存 |独立消费者 |资源自动恢复 |端到端性能
