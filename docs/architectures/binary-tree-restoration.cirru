{}
  :schema-version 1
  :feature 'binary-tree-restoration
  :doc "|恢复原二叉树动画。Calcit 纯函数生成带类型线段，复用 direct-frame 显式时间入口；Canvas 通过 js-ffi 原生矩形/变换 API 绘制。当前是 CPU 全量参考，不假称 Scene IR path 或 GPU 已完成。"
  :roots $ #{} 'quamolit.examples.binary-tree/frame-at 'quamolit.canvas-strokes/draw-segments!
  :definitions $ {}
    'quamolit.examples.binary-tree/frame-at $ {}
      :doc "|绝对秒数到可重放的二叉树线段帧。"
      :mode :ensure
      :kind :fn
      :params $ [] 'time 'depth
      :schema $ :: 'Fn $ {}
        :args $ [] 'Number 'Number
        :return $ :: 'quamolit.direct-frame/DirectFrame $ :: 'List 'quamolit.canvas-strokes/StrokeSegment
    'quamolit.canvas-strokes/draw-segments! $ {}
      :doc "|通用有界线段参考绘制，不包含动画或组件逻辑。"
      :mode :ensure
      :kind :fn
      :params $ [] 'context 'segments
      :schema $ :: 'Fn $ {}
        :args $ [] 'js-ffi.canvas-batches/CanvasContextHost (:: 'List 'quamolit.canvas-strokes/StrokeSegment)
        :return 'Unit
        :features $ #{} :js-ffi
