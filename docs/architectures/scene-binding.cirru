{}
  :schema-version 1
  :feature 'scene-binding
  :doc "|M1 #32: reference resolution of versioned scalar Motion bindings into validated Scene IR; retained incremental execution belongs to #50."
  :roots $ #{} 'quamolit.scene-binding/resolve-scene
  :definitions $ {}
    'quamolit.scene-binding/validate-descriptors $ {}
      :mode :ensure
      :kind :fn
      :doc "|拒绝空 ID、非有限或非整数版本及重复的 ID/version 对；不同版本可以同时存在。"
      :params $ [] 'descriptors
      :schema $ :: 'Fn $ {}
        :args $ [] $ :: 'List 'quamolit.motion/ScalarDescriptor
        :return 'Bool
    'quamolit.scene-binding/resolve-scene $ {}
      :mode :ensure
      :kind :fn
      :doc "|按绝对时间解析 Scene 标量绑定并返回合法的新 SceneDocument；这是全量 CPU 正确性参考，不是保留式执行计划。"
      :params $ [] 'document 'descriptors 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.scene-ir/SceneDocument (:: 'List 'quamolit.motion/ScalarDescriptor) 'Number
        :return 'quamolit.scene-ir/SceneDocument
  :edges $ #{}
    :: :call 'quamolit.scene-binding/resolve-scene 'quamolit.scene-binding/validate-descriptors
