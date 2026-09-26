{}
  :schema-version 1
  :feature 'scene-polyline
  :doc "|摆动树接入正式 Scene IR：开放圆头折线、身份/几何/颜色差分、统一 Canvas 平面参考。此切片不承诺动态几何保留或 GPU。"
  :roots $ #{} 'quamolit.examples.binary-tree/scene-at 'quamolit.canvas-reference/draw-reference!
  :definitions $ {}
    'quamolit.scene-ir/PolylineNode $ {}
      :doc "|开放圆头/圆连接折线；至少两点，有限非负宽度，直通道 sRGB 颜色，不含宿主句柄。"
      :mode :ensure
      :kind :data
      :schema $ :: 'StructDef
      :code $ quote $ defstruct PolylineNode
        :points $ :: 'List 'quamolit.motion/Vec2
        :width 'Number
        :stroke 'quamolit.motion/ColorRgba
    'quamolit.examples.binary-tree/scene-at $ {}
      :doc "|绝对时间全量采样为正式 SceneDocument；保持旧 frame-at 的身份、顺序和几何，不承诺跨帧结构复用。"
      :mode :ensure
      :kind :fn
      :params $ [] 'time 'depth
      :schema $ :: 'Fn $ {} (:args $ [] 'Number 'Number) (:return 'quamolit.scene-ir/SceneDocument)
    'quamolit.canvas-reference/draw-reference! $ {}
      :doc "|整场景预检后按声明顺序绘制顶层 rect/polyline；group、子节点和 instances 明确拒绝。调用方负责清屏、视口与绑定求值。"
      :mode :ensure
      :kind :fn
      :params $ [] 'context 'document
      :schema $ :: 'Fn $ {}
        :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.scene-ir/SceneDocument
        :return 'Unit
        :features $ #{} :js-ffi
