{}
  :schema-version 1
  :feature 'fixed-step-simulation
  :doc "|M1 #31: generic, explicit fixed-dt state advancement, distinct from absolute-time Motion sampling."
  :roots $ #{} 'quamolit.fixed-step/advance-simulation
  :definitions $ {}
    'quamolit.fixed-step/SimulationState $ {}
      :mode :ensure
      :kind :data
      :doc "|Immutable simulation checkpoint; tick is an integer, dt is fixed seconds, seed and state are explicit."
      :schema $ :: 'StructDef
      :code $ quote $ defstruct SimulationState ([] 'S) (:tick 'Number) (:dt 'Number) (:seed 'Number) (:state 'S)
    'quamolit.fixed-step/start-simulation $ {}
      :mode :ensure
      :kind :fn
      :doc "|Construct or reset a simulation at tick zero; rejects invalid dt or seed."
      :params $ [] 'dt 'seed 'state
      :schema $ :: 'Fn $ {}
        :args $ [] 'Number 'Number 'S
        :generics $ [] 'S
        :return $ :: 'quamolit.fixed-step/SimulationState 'S
    'quamolit.fixed-step/valid-simulation-state? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Validate a checkpoint constructed externally before advancing or restoring it."
      :params $ [] 'simulation
      :schema $ :: 'Fn $ {}
        :args $ [] $ :: 'quamolit.fixed-step/SimulationState 'S
        :generics $ [] 'S
        :return 'Bool
    'quamolit.fixed-step/step-simulation $ {}
      :mode :ensure
      :kind :fn
      :doc "|Advance exactly one explicitly numbered tick with one input; no display-clock reads."
      :params $ [] 'previous 'next-tick 'input 'update-state
      :schema $ :: 'Fn $ {}
        :args $ [] (:: 'quamolit.fixed-step/SimulationState 'S) 'Number 'I
          :: 'Fn $ {}
            :args $ [] 'S 'I 'Number 'Number
            :return 'S
        :generics $ [] 'S 'I
        :return $ :: 'quamolit.fixed-step/SimulationState 'S
    'quamolit.fixed-step/advance-simulation $ {}
      :mode :ensure
      :kind :fn
      :doc "|Advance through logged inputs up to target tick within an explicit catch-up budget."
      :params $ [] 'previous 'target-tick 'input-log 'max-steps 'update-state
      :schema $ :: 'Fn $ {}
        :args $ [] (:: 'quamolit.fixed-step/SimulationState 'S) 'Number (:: 'Map 'Number 'I) 'Number
          :: 'Fn $ {}
            :args $ [] 'S 'I 'Number 'Number
            :return 'S
        :generics $ [] 'S 'I
        :return $ :: 'quamolit.fixed-step/SimulationState 'S
  :edges $ #{}
    :: :type 'quamolit.fixed-step/start-simulation 'quamolit.fixed-step/SimulationState
    :: :type 'quamolit.fixed-step/step-simulation 'quamolit.fixed-step/SimulationState
    :: :call 'quamolit.fixed-step/advance-simulation 'quamolit.fixed-step/step-simulation
    :: :call 'quamolit.fixed-step/advance-simulation 'quamolit.fixed-step/valid-simulation-state?
    :: :call 'quamolit.fixed-step/step-simulation 'quamolit.fixed-step/valid-simulation-state?
