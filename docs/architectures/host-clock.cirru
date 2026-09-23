{}
  :schema-version 1
  :feature 'host-clock
  :doc "|M1 #31: explicit host-wall-time to animation-time mapping; pause, rate and seek are pure re-anchoring operations."
  :roots $ #{} 'quamolit.host-clock/simulation-tick-at
  :definitions $ {}
    'quamolit.host-clock/HostClock $ {}
      :mode :ensure
      :kind :data
      :doc "|Immutable mapping from a monotonic host timestamp to animation seconds. Negative speed is allowed for direct playback, not implicit reverse simulation."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct HostClock (:host-anchor 'Number) (:animation-anchor 'Number) (:speed 'Number) (:paused 'Bool)
    'quamolit.host-clock/valid-host-clock? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Check that all clock anchors and the signed playback rate are finite."
      :params $ [] 'clock
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.host-clock/HostClock
        :return 'Bool
    'quamolit.host-clock/start-clock $ {}
      :mode :ensure
      :kind :fn
      :doc "|Create an unpaused clock at explicit host and animation seconds with a signed rate."
      :params $ [] 'host-time 'animation-time 'speed
      :schema $ :: 'Fn $ {}
        :args $ [] 'Number 'Number 'Number
        :return 'quamolit.host-clock/HostClock
    'quamolit.host-clock/sample-clock $ {}
      :mode :ensure
      :kind :fn
      :doc "|Map a finite host timestamp at or after the anchor to finite animation seconds."
      :params $ [] 'clock 'host-time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.host-clock/HostClock 'Number
        :return 'Number
    'quamolit.host-clock/pause-clock $ {}
      :mode :ensure
      :kind :fn
      :doc "|Freeze animation at the value sampled at this host timestamp."
      :params $ [] 'clock 'host-time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.host-clock/HostClock 'Number
        :return 'quamolit.host-clock/HostClock
    'quamolit.host-clock/resume-clock $ {}
      :mode :ensure
      :kind :fn
      :doc "|Resume at the stored rate without counting paused host time."
      :params $ [] 'clock 'host-time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.host-clock/HostClock 'Number
        :return 'quamolit.host-clock/HostClock
    'quamolit.host-clock/set-clock-speed $ {}
      :mode :ensure
      :kind :fn
      :doc "|Change signed playback rate without jumping animation time; retain pause state."
      :params $ [] 'clock 'host-time 'speed
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.host-clock/HostClock 'Number 'Number
        :return 'quamolit.host-clock/HostClock
    'quamolit.host-clock/seek-clock $ {}
      :mode :ensure
      :kind :fn
      :doc "|Set animation time explicitly at this host timestamp, retaining rate and pause state."
      :params $ [] 'clock 'host-time 'animation-time
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.host-clock/HostClock 'Number 'Number
        :return 'quamolit.host-clock/HostClock
    'quamolit.host-clock/simulation-tick-at $ {}
      :mode :ensure
      :kind :fn
      :doc "|Map nonnegative animation seconds to a bounded target tick with explicit near-integer float snapping; never advance simulation state."
      :params $ [] 'clock 'host-time 'dt
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.host-clock/HostClock 'Number 'Number
        :return 'Number
  :edges $ #{}
    :: :call 'quamolit.host-clock/sample-clock 'quamolit.host-clock/valid-host-clock?
    :: :call 'quamolit.host-clock/pause-clock 'quamolit.host-clock/sample-clock
    :: :call 'quamolit.host-clock/resume-clock 'quamolit.host-clock/sample-clock
    :: :call 'quamolit.host-clock/set-clock-speed 'quamolit.host-clock/sample-clock
    :: :call 'quamolit.host-clock/seek-clock 'quamolit.host-clock/sample-clock
    :: :call 'quamolit.host-clock/simulation-tick-at 'quamolit.host-clock/sample-clock
