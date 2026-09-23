{}
  :schema-version 1
  :feature 'motion-vec2
  :doc "|M1 #48 typed two-dimensional Motion slice. Pure CPU reference with the same time and easing rules as scalar tween."
  :roots $ #{} 'quamolit.motion/sample-vec2
  :definitions $ {}
    'quamolit.motion/Easing $ {}
      :mode :ensure
      :kind :data
      :doc "|Scalar easing for interpolation."
      :schema $ :: 'EnumDef
      :code $ quote $ defenum Easing (:linear) (:smoothstep)
    'quamolit.motion/ScalarTween $ {}
      :mode :ensure
      :kind :data
      :doc "|A scalar interval in seconds; duration zero switches at start."
      :schema $ :: 'StructDef
      :code $ quote
        defstruct ScalarTween
          :start 'Number
          :duration 'Number
          :from 'Number
          :to 'Number
          :easing 'quamolit.motion/Easing
    'quamolit.motion/finite-number? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Detect NaN and either infinity on native and JS numeric paths."
      :params $ [] 'value
      :schema $ :: 'Fn $ {}
        :args $ [] 'Number
        :return 'Bool
    'quamolit.motion/sample-tween $ {}
      :mode :ensure
      :kind :fn
      :doc "|Reference scalar tween value at arbitrary finite seconds."
      :params $ [] 'tween 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/ScalarTween 'Number
        :return 'Number
    'quamolit.motion/Vec2 $ {}
      :mode :ensure
      :kind :data
      :doc "|Two-dimensional coordinates in caller-defined units; sampling requires finite values."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct Vec2 (:x 'Number) (:y 'Number)
    'quamolit.motion/Vec2Tween $ {}
      :mode :ensure
      :kind :data
      :doc "|A Vec2 interval in seconds with explicit easing."
      :schema $ :: 'StructDef
      :code $ quote
        defstruct Vec2Tween
          :start 'Number
          :duration 'Number
          :from 'quamolit.motion/Vec2
          :to 'quamolit.motion/Vec2
          :easing 'quamolit.motion/Easing
    'quamolit.motion/Vec2Motion $ {}
      :mode :ensure
      :kind :data
      :doc "|Closed two-dimensional expression."
      :schema $ :: 'EnumDef
      :code $ quote
        defenum Vec2Motion
          :constant 'quamolit.motion/Vec2
          :tween 'quamolit.motion/Vec2Tween
    'quamolit.motion/Vec2Descriptor $ {}
      :mode :ensure
      :kind :data
      :doc "|Versioned identity for a serializable Vec2 motion."
      :schema $ :: 'StructDef
      :code $ quote
        defstruct Vec2Descriptor
          :id 'String
          :version 'Number
          :motion 'quamolit.motion/Vec2Motion
    'quamolit.motion/finite-vec2? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Reject non-finite vector coordinates."
      :params $ [] 'value
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/Vec2
        :return 'Bool
    'quamolit.motion/sample-vec2 $ {}
      :mode :ensure
      :kind :fn
      :doc "|Sample a Vec2 descriptor at arbitrary finite seconds without previous-frame state."
      :params $ [] 'descriptor 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/Vec2Descriptor 'Number
        :return 'quamolit.motion/Vec2
  :edges $ #{}
    :: :type 'quamolit.motion/Vec2Tween 'quamolit.motion/Vec2
    :: :type 'quamolit.motion/Vec2Tween 'quamolit.motion/Easing
    :: :type 'quamolit.motion/Vec2Motion 'quamolit.motion/Vec2Tween
    :: :type 'quamolit.motion/Vec2Descriptor 'quamolit.motion/Vec2Motion
    :: :call 'quamolit.motion/finite-vec2? 'quamolit.motion/finite-number?
    :: :call 'quamolit.motion/sample-vec2 'quamolit.motion/finite-vec2?
    :: :call 'quamolit.motion/sample-vec2 'quamolit.motion/sample-tween
