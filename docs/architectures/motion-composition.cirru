{}
  :schema-version 1
  :feature 'motion-composition
  :doc "|M1 #48 fixed two-input scalar composition without recursive expression trees."
  :roots $ #{} 'quamolit.motion/sample-scalar-composition
  :definitions $ {}
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
    'quamolit.motion/ScalarComposeOp $ {}
      :mode :ensure
      :kind :data
      :doc "|Unitless scalar operations; mix has a normalized right-hand weight."
      :schema $ :: 'EnumDef
      :code $ quote $ defenum ScalarComposeOp (:add) (:multiply) (:mix 'Number)
    'quamolit.motion/ScalarComposition $ {}
      :mode :ensure
      :kind :data
      :doc "|Versioned, non-recursive composition of exactly two scalar descriptors."
      :schema $ :: 'StructDef
      :code $ quote
        defstruct ScalarComposition
          :id 'String
          :version 'Number
          :left 'quamolit.motion/ScalarDescriptor
          :right 'quamolit.motion/ScalarDescriptor
          :operation 'quamolit.motion/ScalarComposeOp
    'quamolit.motion/sample-scalar $ {}
      :mode :ensure
      :kind :fn
      :doc "|Sample a versioned scalar descriptor without reading previous frames."
      :params $ [] 'descriptor 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/ScalarDescriptor 'Number
        :return 'Number
    'quamolit.motion/sample-scalar-composition $ {}
      :mode :ensure
      :kind :fn
      :doc "|Sample a fixed two-input composition at arbitrary finite seconds."
      :params $ [] 'composition 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/ScalarComposition 'Number
        :return 'Number
  :edges $ #{}
    :: :type 'quamolit.motion/ScalarComposition 'quamolit.motion/ScalarDescriptor
    :: :type 'quamolit.motion/ScalarComposition 'quamolit.motion/ScalarComposeOp
    :: :call 'quamolit.motion/sample-scalar-composition 'quamolit.motion/sample-scalar
