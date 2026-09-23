{}
  :schema-version 1
  :feature 'presence-lifecycle
  :doc "|M1 #49: keyed Scene presence, pure enter/exit sampling, one-shot logical release notices. Host resource ownership stays outside the model."
  :roots $ #{} 'quamolit.presence/reconcile-presence 'quamolit.presence/sample-presence 'quamolit.presence/settle-presence
  :definitions $ {}
    'quamolit.presence/PresencePhase $ {}
      :mode :ensure
      :kind :data
      :doc "|Scene 逻辑实例的进入、稳定展示与退出阶段。"
      :schema $ :: 'EnumDef
      :code $ quote $ defenum PresencePhase (:enter) (:present) (:exit)
    'quamolit.presence/PresenceItem $ {}
      :mode :ensure
      :kind :data
      :doc "|稳定 Scene 路径、保留展示数据、阶段和局部 alpha 意图。"
      :schema $ :: 'StructDef
      :code $ quote $ defstruct PresenceItem (:entry 'quamolit.scene-diff/SceneEntry) (:phase 'quamolit.presence/PresencePhase) (:alpha 'quamolit.motion/ScalarTween)
    'quamolit.presence/PresenceUpdate $ {}
      :mode :ensure
      :kind :data
      :doc "|返回新纯模型与恰好一次的逻辑释放通知，不持有宿主句柄。"
      :schema $ :: 'StructDef
      :code $ quote $ defstruct PresenceUpdate (:model 'quamolit.presence/PresenceModel) (:released (:: 'List 'quamolit.scene-diff/SceneEntry))
    'quamolit.presence/start-presence $ {}
      :mode :ensure
      :kind :fn
      :doc "|从已验证 Scene 建立全部为 present 的初始逻辑实例。"
      :params $ [] 'document
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.scene-ir/SceneDocument
        :return 'quamolit.presence/PresenceModel
    'quamolit.presence/reconcile-presence $ {}
      :mode :ensure
      :kind :fn
      :doc "|按稳定路径协调声明：重排复用，退出保留，重入取消退出，换父/类型重挂载。"
      :params $ [] 'model 'document 'time 'duration 'easing
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.presence/PresenceModel 'quamolit.scene-ir/SceneDocument 'Number 'Number 'quamolit.motion/Easing
        :return 'quamolit.presence/PresenceUpdate
    'quamolit.presence/settle-presence $ {}
      :mode :ensure
      :kind :fn
      :doc "|在时间终点完成 enter/exit，移除退出项并按子先父后的顺序返回释放通知。"
      :params $ [] 'model 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.presence/PresenceModel 'Number
        :return 'quamolit.presence/PresenceUpdate
    'quamolit.presence/sample-presence $ {}
      :mode :ensure
      :kind :fn
      :doc "|在任意有限时间纯采样展示顺序、局部 alpha 与退出禁交互标记。"
      :params $ [] 'model 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.presence/PresenceModel 'Number
        :return $ :: 'List 'quamolit.presence/PresenceSample
    'quamolit.presence/presence-needs-frame? $ {}
      :mode :ensure
      :kind :fn
      :doc "|活跃或尚待终点结算的生命周期需要后续帧；结算后停止。"
      :params $ [] 'model 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.presence/PresenceModel 'Number
        :return 'Bool
  :edges $ #{}
    :: :call 'quamolit.presence/reconcile-presence 'quamolit.presence/settle-presence
