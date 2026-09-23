{}
  :schema-version 1
  :feature 'scene-diff
  :doc "|M1 #32: stable logical paths and a conservative typed Scene IR change reference, independent from physical buffer slots."
  :roots $ #{} 'quamolit.scene-diff/diff-scene
  :definitions $ {}
    'quamolit.scene-diff/IdentitySegment $ {}
      :mode :ensure
      :kind :data
      :doc "|One stable path segment uses sibling key and content kind, never buffer slot or temporary node ID."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct IdentitySegment (:key 'String) (:kind 'String)
    'quamolit.scene-diff/SceneEntry $ {}
      :mode :ensure
      :kind :data
      :doc "|Indexed node with resolved logical path and sibling position."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct SceneEntry
        :path $ :: 'List 'quamolit.scene-diff/IdentitySegment
        :sibling-index 'Number
        :node 'quamolit.scene-ir/SceneNode
    'quamolit.scene-diff/GeometrySignature $ {}
      :mode :ensure
      :kind :data
      :doc "|Closed geometry-only projection of supported Scene content."
      :schema $ :: 'EnumDef
      :code $ quote $ defenum GeometrySignature (:group 'quamolit.scene-ir/Matrix2D 'quamolit.scene-ir/ClipSpec) (:rect 'Number 'Number 'Number 'Number) (:instances 'Number 'Number)
    'quamolit.scene-diff/PropertySignature $ {}
      :mode :ensure
      :kind :data
      :doc "|Closed visual-property projection; separate from geometry and resource versions."
      :schema $ :: 'EnumDef
      :code $ quote $ defenum PropertySignature (:group 'Number) (:rect 'quamolit.motion/ColorRgba) (:instances 'quamolit.motion/ColorRgba)
    'quamolit.scene-diff/ResourceSignature $ {}
      :mode :ensure
      :kind :data
      :doc "|Versioned external instance source, or none for non-resource nodes."
      :schema $ :: 'EnumDef
      :code $ quote $ defenum ResourceSignature (:none) (:instances 'quamolit.scene-ir/InstanceSource)
    'quamolit.scene-diff/DirtyFlags $ {}
      :mode :ensure
      :kind :data
      :doc "|Independent reference flags; execution plan chooses actual work later."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct DirtyFlags (:reference 'Bool) (:order 'Bool) (:geometry 'Bool) (:resources 'Bool) (:properties 'Bool) (:bindings 'Bool) (:interaction 'Bool)
    'quamolit.scene-diff/SceneChange $ {}
      :mode :ensure
      :kind :data
      :doc "|Add/remove or retained-node update; no host handle or mutable cache."
      :schema $ :: 'EnumDef
      :code $ quote $ defenum SceneChange (:added 'quamolit.scene-diff/SceneEntry) (:removed 'quamolit.scene-diff/SceneEntry) (:updated 'quamolit.scene-diff/SceneEntry 'quamolit.scene-diff/DirtyFlags)
    'quamolit.scene-diff/SceneDelta $ {}
      :mode :ensure
      :kind :data
      :doc "|Logical changes plus an independent animation-time invalidation bit."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct SceneDelta
        :changes $ :: 'List 'quamolit.scene-diff/SceneChange
        :time-changed 'Bool
    'quamolit.scene-diff/index-scene $ {}
      :mode :ensure
      :kind :fn
      :doc "|Validate and resolve stable paths from preorder parent IDs."
      :params $ [] 'document
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.scene-ir/SceneDocument
        :return $ :: 'List 'quamolit.scene-diff/SceneEntry
    'quamolit.scene-diff/diff-scene $ {}
      :mode :ensure
      :kind :fn
      :doc "|Conservative O(n²) logical reference diff; time-only requests leave structural changes empty."
      :params $ [] 'previous 'current 'previous-time 'current-time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.scene-ir/SceneDocument 'quamolit.scene-ir/SceneDocument 'Number 'Number
        :return 'quamolit.scene-diff/SceneDelta
  :edges $ #{}
    :: :type 'quamolit.scene-diff/SceneChange 'quamolit.scene-diff/DirtyFlags
    :: :call 'quamolit.scene-diff/diff-scene 'quamolit.scene-diff/index-scene
