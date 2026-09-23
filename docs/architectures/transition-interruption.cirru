{}
  :schema-version 1
  :feature 'transition-interruption
  :doc "|M1 #49: explicit position-continuous scalar transition intent and deterministic fixed-event replay. Presence lifecycle remains separate."
  :roots $ #{} 'quamolit.transition/sample-replay 'quamolit.transition/replay-active?
  :definitions $ {}
    'quamolit.transition/TransitionIntent $ {}
      :mode :ensure
      :kind :data
      :doc "|组件 key 与显式 ScalarTween 意图；只保证位置连续的 CPU 过渡模型。"
      :schema $ :: 'StructDef
      :code $ quote $ defstruct TransitionIntent (:key 'String) (:tween 'quamolit.motion/ScalarTween)
    'quamolit.transition/TransitionEvent $ {}
      :mode :ensure
      :kind :data
      :doc "|固定输入日志中的一次目标变更；事件时间必须按非降序排列。"
      :schema $ :: 'StructDef
      :code $ quote $ defstruct TransitionEvent (:at 'Number) (:to 'Number) (:duration 'Number) (:easing 'quamolit.motion/Easing)
    'quamolit.transition/start-transition $ {}
      :mode :ensure
      :kind :fn
      :doc "|构造带 key 的标量过渡意图并验证全部数值。"
      :params $ [] 'key 'from 'to 'start 'duration 'easing
      :schema $ :: 'Fn $ {}
        :args $ [] 'String 'Number 'Number 'Number 'Number 'quamolit.motion/Easing
        :return 'quamolit.transition/TransitionIntent
    'quamolit.transition/interrupt-transition $ {}
      :mode :ensure
      :kind :fn
      :doc "|在打断时间采样旧意图，并以该值作为新意图的 from。"
      :params $ [] 'intent 'to 'at 'duration 'easing
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.transition/TransitionIntent 'Number 'Number 'Number 'quamolit.motion/Easing
        :return 'quamolit.transition/TransitionIntent
    'quamolit.transition/replay-transition $ {}
      :mode :ensure
      :kind :fn
      :doc "|按非降序事件序列重建最终过渡意图。"
      :params $ [] 'initial 'events
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.transition/TransitionIntent (:: 'List 'quamolit.transition/TransitionEvent)
        :return 'quamolit.transition/TransitionIntent
    'quamolit.transition/sample-replay $ {}
      :mode :ensure
      :kind :fn
      :doc "|按固定事件序列在任意绝对时间重放并采样，不依赖上一次绘制帧。"
      :params $ [] 'initial 'events 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.transition/TransitionIntent (:: 'List 'quamolit.transition/TransitionEvent) 'Number
        :return 'Number
    'quamolit.transition/replay-active? $ {}
      :mode :ensure
      :kind :fn
      :doc "|重放到给定时间后判断是否仍需连续过渡帧。"
      :params $ [] 'initial 'events 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.transition/TransitionIntent (:: 'List 'quamolit.transition/TransitionEvent) 'Number
        :return 'Bool
  :edges $ #{}
    :: :call 'quamolit.transition/interrupt-transition 'quamolit.transition/start-transition
    :: :call 'quamolit.transition/sample-replay 'quamolit.transition/replay-transition
