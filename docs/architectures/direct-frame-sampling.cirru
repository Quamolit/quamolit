{}
  :schema-version 1
  :feature 'direct-frame-sampling
  :doc "|M1 #31: typed absolute-time request with explicit descriptor/model/input/resource/viewport snapshots and complete caller-owned revisions."
  :roots $ #{} 'quamolit.direct-frame/resample-at
  :definitions $ {}
    'quamolit.direct-frame/FrameVersions $ {}
      :mode :ensure
      :kind :data
      :doc "|Explicit nonnegative integer revisions for every declared direct-sampling dependency."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct FrameVersions (:component 'Number) (:motion 'Number) (:model 'Number) (:input 'Number) (:resources 'Number) (:viewport 'Number)
    'quamolit.direct-frame/DirectRequest $ {}
      :mode :ensure
      :kind :data
      :doc "|Typed, complete logical input for one arbitrary-time direct sample."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct DirectRequest ([] 'D 'M 'I 'R 'V) (:id 'String) (:time 'Number) (:versions 'quamolit.direct-frame/FrameVersions) (:motion 'D) (:model 'M) (:input 'I) (:resources 'R) (:viewport 'V)
    'quamolit.direct-frame/DirectFrame $ {}
      :mode :ensure
      :kind :data
      :doc "|A sampled value plus the exact identity, time and revisions used to produce it."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct DirectFrame ([] 'S) (:id 'String) (:time 'Number) (:versions 'quamolit.direct-frame/FrameVersions) (:scene 'S)
    'quamolit.direct-frame/valid-frame-versions? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Reject negative, fractional or non-finite dependency revisions."
      :params $ [] 'versions
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.direct-frame/FrameVersions
        :return 'Bool
    'quamolit.direct-frame/valid-version? $ {}
      :mode :ensure
      :kind :fn
      :doc "|A single dependency revision must be finite, nonnegative and integral."
      :params $ [] 'value
      :schema $ :: 'Fn $ {}
        :args $ [] 'Number
        :return 'Bool
    'quamolit.direct-frame/valid-direct-request? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Validate request identity, finite absolute seconds and every revision."
      :params $ [] 'request
      :schema $ :: 'Fn $ {}
        :args $ [] $ :: 'quamolit.direct-frame/DirectRequest 'D 'M 'I 'R 'V
        :generics $ [] 'D 'M 'I 'R 'V
        :return 'Bool
    'quamolit.direct-frame/sample-at $ {}
      :mode :ensure
      :kind :fn
      :doc "|Evaluate from explicit snapshots at arbitrary finite time without reading an earlier frame."
      :params $ [] 'request 'evaluate
      :schema $ :: 'Fn $ {}
        :args $ [] (:: 'quamolit.direct-frame/DirectRequest 'D 'M 'I 'R 'V)
          :: 'Fn $ {}
            :args $ [] 'D 'M 'I 'R 'V 'Number
            :return 'S
        :generics $ [] 'D 'M 'I 'R 'V 'S
        :return $ :: 'quamolit.direct-frame/DirectFrame 'S
    'quamolit.direct-frame/resample-at $ {}
      :mode :ensure
      :kind :fn
      :doc "|Reuse a previous frame only when id, time and all declared dependency revisions match."
      :params $ [] 'previous 'request 'evaluate
      :schema $ :: 'Fn $ {}
        :args $ [] (:: 'quamolit.direct-frame/DirectFrame 'S) (:: 'quamolit.direct-frame/DirectRequest 'D 'M 'I 'R 'V)
          :: 'Fn $ {}
            :args $ [] 'D 'M 'I 'R 'V 'Number
            :return 'S
        :generics $ [] 'D 'M 'I 'R 'V 'S
        :return $ :: 'quamolit.direct-frame/DirectFrame 'S
  :edges $ #{}
    :: :type 'quamolit.direct-frame/DirectRequest 'quamolit.direct-frame/FrameVersions
    :: :type 'quamolit.direct-frame/DirectFrame 'quamolit.direct-frame/FrameVersions
    :: :call 'quamolit.direct-frame/valid-direct-request? 'quamolit.direct-frame/valid-frame-versions?
    :: :call 'quamolit.direct-frame/valid-frame-versions? 'quamolit.direct-frame/valid-version?
    :: :call 'quamolit.direct-frame/sample-at 'quamolit.direct-frame/valid-direct-request?
    :: :call 'quamolit.direct-frame/resample-at 'quamolit.direct-frame/sample-at
