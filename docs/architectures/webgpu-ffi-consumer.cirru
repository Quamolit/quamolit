{}
  :schema-version 1
  :feature 'webgpu-ffi-consumer
  :doc "|M2 #35/#52：Quamolit 自有矩形图层类型与宿主实现；通过 js-ffi 的 Calcit 类型化入口消费原生浏览器能力。"
  :roots $ #{} 'quamolit.webgpu-batches/draw! 'quamolit.webgpu-batches/create!
  :definitions $ {}
    'quamolit.webgpu-batches/create! $ {}
      :mode :ensure
      :kind :fn
      :doc "|创建保留式 GPU 实例图层，所有权留给调用者。"
      :params $ [] 'canvas 'device 'format 'capacity
      :schema $ :: 'Fn $ {} (:async true) (:return 'quamolit.webgpu-batches/RectBatchHost)
        :args $ [] 'js-ffi.browser/DomElementHost 'js-ffi.webgpu/DeviceHost 'String 'Number
        :features $ #{} :js-ffi
    'quamolit.webgpu-batches/upload! $ {}
      :mode :ensure
      :kind :fn
      :doc "|上传当前版本实例位置，调用次数按资源版本而非帧数增长。"
      :params $ [] 'batch 'positions 'instance-count
      :schema $ :: 'Fn $ {} (:return 'Number)
        :args $ [] 'quamolit.webgpu-batches/RectBatchHost 'js-ffi.typed-arrays/Float32ArrayHost 'Number
        :features $ #{} :js-ffi
    'quamolit.webgpu-batches/color $ {}
      :mode :ensure
      :kind :fn
      :doc "|把 Scene 颜色数值构造成 Quamolit 的类型化 RGBA。"
      :params $ [] 'r 'g 'b 'a
      :schema $ :: 'Fn $ {} (:return 'quamolit.webgpu-batches/RectColor)
        :args $ [] 'Number 'Number 'Number 'Number
    'quamolit.webgpu-batches/translation $ {}
      :mode :ensure
      :kind :fn
      :doc "|把已验证的 Vec2 tween 参数构造成绝对时间 GPU 位移。"
      :params $ [] 'from-x 'from-y 'to-x 'to-y 'time 'start 'duration 'easing
      :schema $ :: 'Fn $ {} (:return 'quamolit.webgpu-batches/RectTranslation)
        :args $ [] 'Number 'Number 'Number 'Number 'Number 'Number 'Number 'String
    'quamolit.webgpu-batches/draw! $ {}
      :mode :ensure
      :kind :fn
      :doc "|提交一个实例图层帧；缺省 count 复用活跃实例，count=0 清空画布。"
      :params $ [] 'batch 'width 'height 'fill 'alpha 'motion 'instance-count
      :schema $ :: 'Fn $ {} (:return 'quamolit.webgpu-batches/RectMetrics)
        :args $ [] 'quamolit.webgpu-batches/RectBatchHost 'Number 'Number 'quamolit.webgpu-batches/RectColor 'Number (:: 'calcit.core/Option 'quamolit.webgpu-batches/RectTranslation) (:: 'calcit.core/Option 'Number)
        :features $ #{} :js-ffi
    'quamolit.webgpu-batches/clear! $ {}
      :mode :ensure
      :kind :fn
      :doc "|提交零实例帧，在完整图层边界清屏。"
      :params $ [] 'batch
      :schema $ :: 'Fn $ {} (:return 'quamolit.webgpu-batches/RectMetrics)
        :args $ [] 'quamolit.webgpu-batches/RectBatchHost
        :features $ #{} :js-ffi
    'quamolit.webgpu-batches/read-pixel! $ {}
      :mode :ensure
      :kind :fn
      :doc "|测试诊断读回；生产帧不得调用。"
      :params $ [] 'batch 'x 'y
      :schema $ :: 'Fn $ {} (:async true) (:return 'quamolit.webgpu-batches/RectPixel)
        :args $ [] 'quamolit.webgpu-batches/RectBatchHost 'Number 'Number
        :features $ #{} :js-ffi
    'quamolit.webgpu-batches/read-translation! $ {}
      :mode :ensure
      :kind :fn
      :doc "|测试诊断 GPU f32 时间位移；生产帧不得调用。"
      :params $ [] 'batch
      :schema $ :: 'Fn $ {} (:async true) (:return 'quamolit.webgpu-batches/RectTranslationSample)
        :args $ [] 'quamolit.webgpu-batches/RectBatchHost
        :features $ #{} :js-ffi
    'quamolit.webgpu-batches/dispose! $ {}
      :mode :ensure
      :kind :fn
      :doc "|幂等释放图层宿主资源，不释放调用者持有的 device。"
      :params $ [] 'batch
      :schema $ :: 'Fn $ {} (:return 'Bool)
        :args $ [] 'quamolit.webgpu-batches/RectBatchHost
        :features $ #{} :js-ffi
  :edges $ #{}
    :: :call 'quamolit.webgpu-batches/clear! 'quamolit.webgpu-batches/draw!
    :: :call 'quamolit.webgpu-batches/clear! 'quamolit.webgpu-batches/color
