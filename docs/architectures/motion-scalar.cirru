{}
  :schema-version 1
  :feature 'motion-scalar
  :doc "|M1 #48 first typed, serializable scalar Motion slice. Pure CPU reference; no GPU handles or arbitrary closures. Later slices add vector/color, keyframes and cycle without changing time or identity semantics."
  :roots $ #{} 'quamolit.motion/sample-scalar
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
    'quamolit.motion/ScalarMotion $ {}
      :mode :ensure
      :kind :data
      :doc "|Closed scalar expression; no arbitrary closure in serializable data."
      :schema $ :: 'EnumDef
      :code $ quote
        defenum ScalarMotion
          :constant 'Number
          :time 'Number 'Number
          :tween 'quamolit.motion/ScalarTween
    'quamolit.motion/ScalarDescriptor $ {}
      :mode :ensure
      :kind :data
      :doc "|Versioned identity for a serializable scalar motion."
      :schema $ :: 'StructDef
      :code $ quote
        defstruct ScalarDescriptor
          :id 'String
          :version 'Number
          :motion 'quamolit.motion/ScalarMotion
    'quamolit.motion/finite-number? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Detect NaN and either infinity on native and JS numeric paths."
      :params $ [] 'value
      :schema $ :: 'Fn $ {} (:args ([] 'Number)) (:return 'Bool)
    'quamolit.motion/sample-tween $ {}
      :mode :ensure
      :kind :fn
      :doc "|Reference scalar tween value at arbitrary finite seconds."
      :params $ [] 'tween 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/ScalarTween 'Number
        :return 'Number
    'quamolit.motion/sample-scalar $ {}
      :mode :ensure
      :kind :fn
      :doc "|Sample a versioned scalar descriptor without reading previous frames."
      :params $ [] 'descriptor 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/ScalarDescriptor 'Number
        :return 'Number
  :edges $ #{}
    :: :type 'quamolit.motion/ScalarTween 'quamolit.motion/Easing
    :: :type 'quamolit.motion/ScalarMotion 'quamolit.motion/ScalarTween
    :: :type 'quamolit.motion/ScalarDescriptor 'quamolit.motion/ScalarMotion
    :: :call 'quamolit.motion/sample-tween 'quamolit.motion/finite-number?
    :: :call 'quamolit.motion/sample-scalar 'quamolit.motion/finite-number?
    :: :call 'quamolit.motion/sample-scalar 'quamolit.motion/sample-tween
