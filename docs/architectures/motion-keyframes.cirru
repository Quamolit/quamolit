{}
  :schema-version 1
  :feature 'motion-keyframes
  :doc "|M1 #48 typed scalar keyframes with explicit clamp/repeat/mirror endpoint rules and pure CPU sampling."
  :roots $ #{} 'quamolit.motion/sample-track 'quamolit.motion/sample-scalar
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
          :keyframes 'quamolit.motion/ScalarTrack
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
    'quamolit.motion/sample-scalar $ {}
      :mode :ensure
      :kind :fn
      :doc "|Sample a versioned scalar descriptor without reading previous frames."
      :params $ [] 'descriptor 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/ScalarDescriptor 'Number
        :return 'Number
    'quamolit.motion/ScalarKeyframe $ {}
      :mode :ensure
      :kind :data
      :doc "|A scalar keyframe; sampling requires finite instant/value and easing applies to the following segment."
      :schema $ :: 'StructDef
      :code $ quote
        defstruct ScalarKeyframe
          :at 'Number
          :value 'Number
          :easing 'quamolit.motion/Easing
    'quamolit.motion/TrackLoop $ {}
      :mode :ensure
      :kind :data
      :doc "|Clamp, half-open repeat, or mirrored repeat."
      :schema $ :: 'EnumDef
      :code $ quote $ defenum TrackLoop (:clamp) (:repeat) (:mirror)
    'quamolit.motion/ScalarTrack $ {}
      :mode :ensure
      :kind :data
      :doc "|Keyframes and loop mode; sampling validates non-empty ordered frames."
      :schema $ :: 'StructDef
      :code $ quote
        defstruct ScalarTrack
          :frames $ :: 'List 'quamolit.motion/ScalarKeyframe
          :loop 'quamolit.motion/TrackLoop
    'quamolit.motion/ScalarTrackCursor $ {}
      :mode :ensure
      :kind :data
      :doc "|Private scan state for deterministic keyframe reference sampling."
      :schema $ :: 'StructDef
      :code $ quote
        defstruct ScalarTrackCursor
          :previous 'quamolit.motion/ScalarKeyframe
          :value 'Number
          :done 'Bool
    'quamolit.motion/validate-track $ {}
      :mode :ensure
      :kind :fn
      :doc "|Reject empty, unordered, or non-finite keyframes. Equal timestamps are valid."
      :params $ [] 'track
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/ScalarTrack
        :return 'Bool
    'quamolit.motion/first-keyframe $ {}
      :mode :ensure
      :kind :fn
      :doc "|Return the first keyframe; caller validates a non-empty ordered track."
      :params $ [] 'frames
      :schema $ :: 'Fn $ {}
        :args $ [] $ :: 'List 'quamolit.motion/ScalarKeyframe
        :return 'quamolit.motion/ScalarKeyframe
    'quamolit.motion/last-keyframe $ {}
      :mode :ensure
      :kind :fn
      :doc "|Return the last keyframe; caller validates a non-empty ordered track."
      :params $ [] 'frames
      :schema $ :: 'Fn $ {}
        :args $ [] $ :: 'List 'quamolit.motion/ScalarKeyframe
        :return 'quamolit.motion/ScalarKeyframe
    'quamolit.motion/wrap-track-time $ {}
      :mode :ensure
      :kind :fn
      :doc "|Map finite time into a track according to explicit endpoint semantics."
      :params $ [] 'time 'start 'end 'loop
      :schema $ :: 'Fn $ {}
        :args $ [] 'Number 'Number 'Number 'quamolit.motion/TrackLoop
        :return 'Number
    'quamolit.motion/advance-track $ {}
      :mode :ensure
      :kind :fn
      :doc "|Scan one sorted keyframe; the rightmost duplicate wins at its timestamp."
      :params $ [] 'cursor 'frame 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/ScalarTrackCursor 'quamolit.motion/ScalarKeyframe 'Number
        :return 'quamolit.motion/ScalarTrackCursor
    'quamolit.motion/scan-track $ {}
      :mode :ensure
      :kind :fn
      :doc "|Scan validated keyframes at one explicit time without previous-frame state."
      :params $ [] 'frames 'time
      :schema $ :: 'Fn $ {}
        :args $ [] (:: 'List 'quamolit.motion/ScalarKeyframe) 'Number
        :return 'quamolit.motion/ScalarTrackCursor
    'quamolit.motion/sample-track $ {}
      :mode :ensure
      :kind :fn
      :doc "|Reference scalar keyframe sampler at arbitrary finite seconds."
      :params $ [] 'track 'time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/ScalarTrack 'Number
        :return 'Number
  :edges $ #{}
    :: :type 'quamolit.motion/ScalarKeyframe 'quamolit.motion/Easing
    :: :type 'quamolit.motion/ScalarTrack 'quamolit.motion/ScalarKeyframe
    :: :type 'quamolit.motion/ScalarTrack 'quamolit.motion/TrackLoop
    :: :type 'quamolit.motion/ScalarTrackCursor 'quamolit.motion/ScalarKeyframe
    :: :type 'quamolit.motion/ScalarMotion 'quamolit.motion/ScalarTrack
    :: :type 'quamolit.motion/ScalarDescriptor 'quamolit.motion/ScalarMotion
    :: :call 'quamolit.motion/validate-track 'quamolit.motion/finite-number?
    :: :call 'quamolit.motion/validate-track 'quamolit.motion/first-keyframe
    :: :call 'quamolit.motion/wrap-track-time 'quamolit.motion/finite-number?
    :: :call 'quamolit.motion/advance-track 'quamolit.motion/sample-tween
    :: :call 'quamolit.motion/scan-track 'quamolit.motion/first-keyframe
    :: :call 'quamolit.motion/scan-track 'quamolit.motion/advance-track
    :: :call 'quamolit.motion/sample-track 'quamolit.motion/validate-track
    :: :call 'quamolit.motion/sample-track 'quamolit.motion/wrap-track-time
    :: :call 'quamolit.motion/sample-track 'quamolit.motion/first-keyframe
    :: :call 'quamolit.motion/sample-track 'quamolit.motion/last-keyframe
    :: :call 'quamolit.motion/sample-track 'quamolit.motion/scan-track
    :: :call 'quamolit.motion/sample-scalar 'quamolit.motion/sample-track
