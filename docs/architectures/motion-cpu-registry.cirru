{}
  :schema-version 1
  :feature 'motion-cpu-registry
  :doc "|M1 #48 CPU-only custom scalar sampling: serializable descriptor holds an ID; runtime callbacks live in a separate typed registry."
  :roots $ #{} 'quamolit.motion/sample-cpu-scalar
  :definitions $ {}
    'quamolit.motion/finite-number? $ {}
      :mode :ensure
      :kind :fn
      :doc "|Detect NaN and either infinity on native and JS numeric paths."
      :params $ [] 'value
      :schema $ :: 'Fn $ {}
        :args $ [] 'Number
        :return 'Bool
    'quamolit.motion/CpuScalarDescriptor $ {}
      :mode :ensure
      :kind :data
      :doc "|Versioned serializable reference to a CPU sampler; never embeds a closure or GPU handle."
      :schema $ :: 'StructDef
      :code $ quote
        defstruct CpuScalarDescriptor
          :id 'String
          :version 'Number
          :callback-id 'String
          :gpu-status 'quamolit.motion/CpuGpuStatus
    'quamolit.motion/CpuGpuStatus $ {}
      :mode :ensure
      :kind :data
      :doc "|CPU callbacks cannot lower to GPU; retain a diagnostic reason."
      :schema $ :: 'EnumDef
      :code $ quote $ defenum CpuGpuStatus (:unsupported 'String)
    'quamolit.motion/CpuScalarRegistry $ {}
      :mode :ensure
      :kind :data
      :doc "|Runtime-only immutable map of CPU scalar callbacks; excluded from Motion IR serialization and GPU lowering."
      :schema $ :: 'StructDef
      :code $ quote
        defstruct CpuScalarRegistry
          :samplers $ :: 'Map 'String $ :: 'Fn $ {}
            :args $ [] 'Number
            :return 'Number
    'quamolit.motion/register-cpu-scalar $ {}
      :mode :ensure
      :kind :fn
      :doc "|Add one uniquely named, typed CPU sampler to a new registry value."
      :params $ [] 'registry 'callback-id 'sampler
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/CpuScalarRegistry 'String $ :: 'Fn $ {}
          :args $ [] 'Number
          :return 'Number
        :return 'quamolit.motion/CpuScalarRegistry
    'quamolit.motion/sample-cpu-scalar $ {}
      :mode :ensure
      :kind :fn
      :doc "|Resolve and sample one CPU-only custom function at arbitrary finite seconds."
      :params $ [] 'descriptor 'time 'registry
      :schema $ :: 'Fn $ {}
        :args $ [] 'quamolit.motion/CpuScalarDescriptor 'Number 'quamolit.motion/CpuScalarRegistry
        :return 'Number
  :edges $ #{}
    :: :type 'quamolit.motion/CpuScalarDescriptor 'quamolit.motion/CpuGpuStatus
    :: :type 'quamolit.motion/sample-cpu-scalar 'quamolit.motion/CpuScalarRegistry
    :: :call 'quamolit.motion/sample-cpu-scalar 'quamolit.motion/finite-number?
