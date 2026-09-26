{}
  :schema-version 1
  :feature 'binary-tree-restoration
  :doc "|恢复原二叉树动画。Calcit 纯函数生成每个分叉的三点 RoundPolyline，复用 direct-frame；Canvas 通过 js-ffi 原生路径描边恢复圆头和圆连接。仍是 CPU 全量参考，不代表 Scene IR 或 GPU。"
  :roots $ #{} 'quamolit.examples.binary-tree/frame-at 'quamolit.canvas-strokes/draw-polylines!
  :definitions $ {}
    'quamolit.examples.binary-tree/frame-at $ {}
      :doc "|绝对秒数到可重放的二叉树线段帧。"
      :mode :ensure
      :kind :fn
      :params $ [] 'time 'depth
      :schema $ :: 'Fn $ {}
        :args $ [] 'Number 'Number
        :return $ :: 'quamolit.direct-frame/DirectFrame $ :: 'List 'quamolit.canvas-strokes/RoundPolyline
    'quamolit.canvas-strokes/draw-polylines! $ {}
      :doc "|开放圆头/圆连接折线参考；整批预检后绘制，零宽不绘制；当前路径不恢复。"
      :mode :ensure
      :kind :fn
      :params $ [] 'context 'segments
      :schema $ :: 'Fn $ {}
        :args $ [] 'js-ffi.canvas-batches/CanvasContextHost (:: 'List 'quamolit.canvas-strokes/RoundPolyline)
        :return 'Unit
        :features $ #{} :js-ffi
