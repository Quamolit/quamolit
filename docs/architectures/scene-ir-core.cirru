{}
  :schema-version 1
  :feature 'scene-ir-core
  :doc "|M1 #32: flat typed Scene IR with stable node IDs, scoped sibling keys, ordered drawing and no host handles."
  :roots $ #{} 'quamolit.scene-ir/validate-scene
  :definitions $ {}
    'quamolit.scene-ir/Matrix2D $ {}
      :mode :ensure
      :kind :data
      :doc "|CSS-pixel affine matrix [a c e; b d f; 0 0 1]."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct Matrix2D (:a 'Number) (:b 'Number) (:c 'Number) (:d 'Number) (:e 'Number) (:f 'Number)
    'quamolit.scene-ir/ClipRect $ {}
      :mode :ensure
      :kind :data
      :doc "|Group-local rectangular clip in CSS pixels."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct ClipRect (:x 'Number) (:y 'Number) (:width 'Number) (:height 'Number)
    'quamolit.scene-ir/ClipSpec $ {}
      :mode :ensure
      :kind :data
      :doc "|Closed clip declaration; no Canvas path or host resource handle."
      :schema $ :: 'EnumDef
      :code $ quote $ defenum ClipSpec (:none) (:rect 'quamolit.scene-ir/ClipRect)
    'quamolit.scene-ir/GroupNode $ {}
      :mode :ensure
      :kind :data
      :doc "|Group transform, clip and isolated opacity declaration."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct GroupNode (:transform 'quamolit.scene-ir/Matrix2D) (:clip 'quamolit.scene-ir/ClipSpec) (:opacity 'Number)
    'quamolit.scene-ir/RectNode $ {}
      :mode :ensure
      :kind :data
      :doc "|Solid rectangle geometry and straight-alpha sRGB color."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct RectNode (:x 'Number) (:y 'Number) (:width 'Number) (:height 'Number) (:fill 'quamolit.motion/ColorRgba)
    'quamolit.scene-ir/InstanceSource $ {}
      :mode :ensure
      :kind :data
      :doc "|Versioned external typed-array source; count does not create child nodes."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct InstanceSource (:id 'String) (:version 'Number) (:count 'Number)
    'quamolit.scene-ir/InstanceNode $ {}
      :mode :ensure
      :kind :data
      :doc "|One logical instance layer referencing external positions and shared geometry/color."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct InstanceNode (:source 'quamolit.scene-ir/InstanceSource) (:width 'Number) (:height 'Number) (:fill 'quamolit.motion/ColorRgba)
    'quamolit.scene-ir/SceneContent $ {}
      :mode :ensure
      :kind :data
      :doc "|Closed primitive/group/instance-layer union, independent from execution plans."
      :schema $ :: 'EnumDef
      :code $ quote $ defenum SceneContent (:group 'quamolit.scene-ir/GroupNode) (:rect 'quamolit.scene-ir/RectNode) (:instances 'quamolit.scene-ir/InstanceNode) (:polyline 'quamolit.scene-ir/PolylineNode)
    'quamolit.scene-ir/ScalarTarget $ {}
      :mode :ensure
      :kind :data
      :doc "|Scalar animation binding target; supported per content kind by validator."
      :schema $ :: 'EnumDef
      :code $ quote $ defenum ScalarTarget (:x) (:y) (:width) (:height) (:opacity)
    'quamolit.scene-ir/ScalarBinding $ {}
      :mode :ensure
      :kind :data
      :doc "|Versioned reference to a Motion descriptor, never an executable closure."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct ScalarBinding (:target 'quamolit.scene-ir/ScalarTarget) (:motion-id 'String) (:version 'Number)
    'quamolit.scene-ir/SceneInteraction $ {}
      :mode :ensure
      :kind :data
      :doc "|Logical event target reference; hit testing is not performed during paint."
      :schema $ :: 'EnumDef
      :code $ quote $ defenum SceneInteraction (:none) (:target 'String)
    'quamolit.scene-ir/SceneNode $ {}
      :mode :ensure
      :kind :data
      :doc "|Flat node: stable unique id, parent id, sibling key, typed content and metadata."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct SceneNode (:id 'String) (:parent 'String) (:key 'String) (:content 'quamolit.scene-ir/SceneContent)
        :bindings $ :: 'List 'quamolit.scene-ir/ScalarBinding
        :interaction 'quamolit.scene-ir/SceneInteraction
    'quamolit.scene-ir/SceneDocument $ {}
      :mode :ensure
      :kind :data
      :doc "|Preorder node list; order is paint order, parent appears before child."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct SceneDocument $ :nodes $ :: 'List 'quamolit.scene-ir/SceneNode
    'quamolit.scene-ir/content-kind $ {}
      :mode :ensure
      :kind :fn
      :doc "|Stable content kind for identity and diagnostics."
      :params $ [] 'content
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.scene-ir/SceneContent
        :return 'String
    'quamolit.scene-ir/valid-node? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Check local numeric, resource, binding and interaction invariants."
      :params $ [] 'node
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.scene-ir/SceneNode
        :return 'Bool
    'quamolit.scene-ir/conflicts-with-earlier? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Reject duplicate ID or sibling key in a preorder prefix."
      :params $ [] 'node 'earlier
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.scene-ir/SceneNode $ :: 'List 'quamolit.scene-ir/SceneNode
        :return 'Bool
    'quamolit.scene-ir/parent-group? $ {}
      :mode :ensure
      :kind :fn
      :doc "|A non-root parent must already exist in the prefix and be a group."
      :params $ [] 'parent-id 'earlier
      :schema $ :: 'Fn $ {}
        :args $ [] 'String $ :: 'List 'quamolit.scene-ir/SceneNode
        :return 'Bool
    'quamolit.scene-ir/validate-scene $ {}
      :mode :ensure
      :kind :fn
      :doc "|Validate the serializable preorder Scene IR before any drawing."
      :params $ [] 'document
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.scene-ir/SceneDocument
        :return 'Bool
    'quamolit.scene-ir/valid-unit? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Validate a finite normalized channel."
      :params $ [] 'value
      :schema $ :: 'Fn $ {}
        :args $ [] 'Number
        :return 'Bool
    'quamolit.scene-ir/valid-color? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Validate straight-alpha sRGB channels."
      :params $ [] 'color
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/ColorRgba
        :return 'Bool
    'quamolit.scene-ir/valid-content? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Validate the numeric and resource payload of one content variant."
      :params $ [] 'content
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.scene-ir/SceneContent
        :return 'Bool
    'quamolit.scene-ir/valid-binding? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Validate one versioned scalar motion binding and its legal target."
      :params $ [] 'binding 'content
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.scene-ir/ScalarBinding 'quamolit.scene-ir/SceneContent
        :return 'Bool
    'quamolit.scene-ir/first-binding $ {}
      :mode :ensure
      :kind :fn
      :doc "|Typed first element helper for a nonempty binding list."
      :params $ [] 'bindings
      :schema $ :: 'Fn $ {}
        :args $ [] $ :: 'List 'quamolit.scene-ir/ScalarBinding
        :return 'quamolit.scene-ir/ScalarBinding
    'quamolit.scene-ir/target-in? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Check for another binding of the same target."
      :params $ [] 'target 'bindings
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.scene-ir/ScalarTarget $ :: 'List 'quamolit.scene-ir/ScalarBinding
        :return 'Bool
    'quamolit.scene-ir/valid-bindings? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Reject duplicate or unsupported scalar targets."
      :params $ [] 'bindings 'content
      :schema $ :: 'Fn $ {}
        :args $ [] (:: 'List 'quamolit.scene-ir/ScalarBinding) 'quamolit.scene-ir/SceneContent
        :return 'Bool
    'quamolit.scene-ir/first-node $ {}
      :mode :ensure
      :kind :fn
      :doc "|Typed first element helper for a nonempty node list."
      :params $ [] 'nodes
      :schema $ :: 'Fn $ {}
        :args $ [] $ :: 'List 'quamolit.scene-ir/SceneNode
        :return 'quamolit.scene-ir/SceneNode
    'quamolit.scene-ir/empty-scene-nodes $ {}
      :mode :ensure
      :kind :fn
      :doc "|Typed empty node prefix."
      :params $ []
      :schema $ :: 'Fn $ {}
        :args $ []
        :return $ :: 'List 'quamolit.scene-ir/SceneNode
    'quamolit.scene-ir/valid-prefix? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Walk preorder nodes and reject invalid topology or duplicate identities."
      :params $ [] 'remaining 'earlier
      :schema $ :: 'Fn $ {}
        :args $ [] (:: 'List 'quamolit.scene-ir/SceneNode) (:: 'List 'quamolit.scene-ir/SceneNode)
        :return 'Bool
  :edges $ #{}
    :: :type 'quamolit.scene-ir/SceneNode 'quamolit.scene-ir/SceneContent
    :: :type 'quamolit.scene-ir/SceneDocument 'quamolit.scene-ir/SceneNode
    :: :call 'quamolit.scene-ir/validate-scene 'quamolit.scene-ir/valid-node?
    :: :call 'quamolit.scene-ir/validate-scene 'quamolit.scene-ir/parent-group?
    :: :call 'quamolit.scene-ir/validate-scene 'quamolit.scene-ir/conflicts-with-earlier?
    :: :call 'quamolit.scene-ir/validate-scene 'quamolit.scene-ir/valid-prefix?
    :: :call 'quamolit.scene-ir/valid-prefix? 'quamolit.scene-ir/first-node
    :: :call 'quamolit.scene-ir/valid-node? 'quamolit.scene-ir/valid-content?
    :: :call 'quamolit.scene-ir/valid-node? 'quamolit.scene-ir/valid-bindings?
    :: :call 'quamolit.scene-ir/valid-content? 'quamolit.scene-ir/valid-color?
