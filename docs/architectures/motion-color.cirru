{}
  :schema-version 1
  :feature 'motion-color
  :doc "|M1 #48 straight-alpha sRGB color values sampled in linear sRGB on the pure CPU reference path."
  :roots $ #{} 'quamolit.motion/sample-color
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
    'quamolit.motion/ColorRgba $ {}
      :mode :ensure
      :kind :data
      :doc "|Straight-alpha sRGB channels in [0,1]; sampling validates their range."
      :schema $ :: 'StructDef
      :code $ quote
        defstruct ColorRgba
          :r 'Number
          :g 'Number
          :b 'Number
          :a 'Number
    'quamolit.motion/ColorTween $ {}
      :mode :ensure
      :kind :data
      :doc "|Color interval in seconds, interpolated in linear sRGB with separate alpha."
      :schema $ :: 'StructDef
      :code $ quote
        defstruct ColorTween
          :start 'Number
          :duration 'Number
          :from 'quamolit.motion/ColorRgba
          :to 'quamolit.motion/ColorRgba
          :easing 'quamolit.motion/Easing
    'quamolit.motion/ColorMotion $ {}
      :mode :ensure
      :kind :data
      :doc "|Closed color motion without host handles or closures."
      :schema $ :: 'EnumDef
      :code $ quote
        defenum ColorMotion
          :constant 'quamolit.motion/ColorRgba
          :tween 'quamolit.motion/ColorTween
    'quamolit.motion/ColorDescriptor $ {}
      :mode :ensure
      :kind :data
      :doc "|Versioned identity for serializable color motion."
      :schema $ :: 'StructDef
      :code $ quote
        defstruct ColorDescriptor
          :id 'String
          :version 'Number
          :motion 'quamolit.motion/ColorMotion
    'quamolit.motion/unit-channel? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Finite normalized channel predicate."
      :params $ [] 'value
      :schema $ :: 'Fn $ {}
        :args $ [] 'Number
        :return 'Bool
    'quamolit.motion/valid-color? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Check all straight-alpha sRGB channels."
      :params $ [] 'color
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/ColorRgba
        :return 'Bool
    'quamolit.motion/srgb-to-linear $ {}
      :mode :ensure
      :kind :fn
      :doc "|Decode normalized sRGB channel to linear light."
      :params $ [] 'channel
      :schema $ :: 'Fn $ {}
        :args $ [] 'Number
        :return 'Number
    'quamolit.motion/linear-to-srgb $ {}
      :mode :ensure
      :kind :fn
      :doc "|Encode a normalized linear-light channel to sRGB."
      :params $ [] 'channel
      :schema $ :: 'Fn $ {}
        :args $ [] 'Number
        :return 'Number
    'quamolit.motion/interpolate-color-channel $ {}
      :mode :ensure
      :kind :fn
      :doc "|Interpolate one sRGB channel in linear light."
      :params $ [] 'from 'to 'ratio
      :schema $ :: 'Fn $ {}
        :args $ [] 'Number 'Number 'Number
        :return 'Number
    'quamolit.motion/interpolate-color $ {}
      :mode :ensure
      :kind :fn
      :doc "|Interpolate straight-alpha colors; hidden RGB is not premultiplied away."
      :params $ [] 'from 'to 'ratio
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/ColorRgba 'quamolit.motion/ColorRgba 'Number
        :return 'quamolit.motion/ColorRgba
    'quamolit.motion/sample-color $ {}
      :mode :ensure
      :kind :fn
      :doc "|Sample a versioned color descriptor at arbitrary finite seconds."
      :params $ [] 'descriptor 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/ColorDescriptor 'Number
        :return 'quamolit.motion/ColorRgba
  :edges $ #{}
    :: :type 'quamolit.motion/ColorTween 'quamolit.motion/ColorRgba
    :: :type 'quamolit.motion/ColorTween 'quamolit.motion/Easing
    :: :type 'quamolit.motion/ColorMotion 'quamolit.motion/ColorTween
    :: :type 'quamolit.motion/ColorDescriptor 'quamolit.motion/ColorMotion
    :: :call 'quamolit.motion/unit-channel? 'quamolit.motion/finite-number?
    :: :call 'quamolit.motion/valid-color? 'quamolit.motion/unit-channel?
    :: :call 'quamolit.motion/interpolate-color-channel 'quamolit.motion/srgb-to-linear
    :: :call 'quamolit.motion/interpolate-color-channel 'quamolit.motion/linear-to-srgb
    :: :call 'quamolit.motion/interpolate-color 'quamolit.motion/interpolate-color-channel
    :: :call 'quamolit.motion/sample-color 'quamolit.motion/sample-tween
    :: :call 'quamolit.motion/sample-color 'quamolit.motion/interpolate-color
