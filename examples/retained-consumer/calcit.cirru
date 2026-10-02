
{}
  :about "|Machine-generated snapshot. Do not edit directly — changes will be overwritten. Use `calcit query` to inspect and `calcit edit`/`calcit tree` to modify. Run `calcit docs agents --contract` before mutations; use `--full` for first orientation or changed contract digest. Manual edits must follow format and schema conventions, then run `calcit edit format`."
  :package |app
  :entries $ {} $ :default
    {} (:description "|独立 Calcit 消费者：显式时间与保留组件") (:init-fn 'app.main/main!) (:mode :js) (:reload-fn 'app.main/reload!) (:target :browser)
      :feature-policy $ {}
      :modules $ [] |quamolit/ |js-ffi/
      :type-slots $ {}
  :files $ {} $ 'app.main
    %{} 'FileEntry
      :defs $ {}
        'InstanceFrame $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct InstanceFrame (:index 'Number) (:x 'Number) (:y 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'browser-available? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn browser-available? () (browser/document-available?)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ []
            :features $ #{} :js-ffi
        'build-batch $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn build-batch (plan) (batch/build-batch plan)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/BatchPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan
        'create-batch-gpu! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn create-batch-gpu! (canvas device format capacity) (batch/create-renderer! canvas device format capacity)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/RectRendererHost)
            :args $ [] 'JsObject 'js-ffi.webgpu/DeviceHost 'String 'Number
            :features $ #{} :js-ffi
        'create-gpu! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn create-gpu! (canvas device format capacity) (gpu/create-renderer! canvas device format capacity)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/RectRendererHost)
            :args $ [] 'JsObject 'js-ffi.webgpu/DeviceHost 'String 'Number
            :features $ #{} :js-ffi
        'create-instances-gpu! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn create-instances-gpu! (canvas device format)
            js-await $ webgpu/create! canvas device format 10000
          :examples $ []
          :schema $ :: 'Fn $ {} (:async true) (:return 'quamolit.webgpu-batches/RectBatchHost)
            :args $ [] 'js-ffi.browser/DomElementHost 'js-ffi.webgpu/DeviceHost 'String
            :features $ #{} :js-ffi
        'create-instances-table! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn create-instances-table! () (resource/create-table!)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.instance-resource/InstanceTableHost)
            :args $ []
            :features $ #{} :js-ffi
        'declare $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn declare (props model input ready viewport)
            let
                color $ if ready
                  motion/ColorRgba :r 0 :g 0.7 :b 0.4 :a 1
                  motion/ColorRgba :r 0.92 :g 0.28 :b 0.6 :a 1
                fixed $ scene/SceneNode :id |static :parent | :key |static :content
                  scene/SceneContent :rect $ scene/RectNode :x 16 :y 100 :width 288 :height 12 :fill $ motion/ColorRgba :r 0.4 :g 0.4 :b 0.4 :a 1
                  , :bindings ([]) :interaction $ scene/SceneInteraction :none
                moving $ scene/SceneNode :id |badge :parent | :key |badge :content
                  scene/SceneContent :rect $ scene/RectNode :x 80 :y (+ props model input) :width (/ viewport 10) :height 20 :fill color
                  , :bindings
                    [] $ scene/ScalarBinding :target (scene/ScalarTarget :x) :motion-id |x :version 1
                    , :interaction $ scene/SceneInteraction :none
                descriptor $ motion/ScalarDescriptor :id |x :version 1 :motion $ motion/ScalarMotion :tween
                  motion/ScalarTween :start 0 :duration 1 :from 80 :to 120 :easing $ motion/Easing :linear
              component/ComponentDeclaration :scene
                scene/SceneDocument :nodes $ [] fixed moving
                , :motions $ [] descriptor
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.component-sample/ComponentDeclaration)
            :args $ [] 'Number 'Number 'Number 'Bool 'Number
        'declare-alpha $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn declare-alpha (props model input ready viewport)
            let
                declaration $ declare props model input ready viewport
                document $ :scene declaration
                nodes $ :nodes document
                badge $ &list:nth nodes 1
              struct-with declaration
                :scene $ struct-with document $ :nodes
                  assoc nodes 1 $ struct-with badge $ :bindings
                    [] $ scene/ScalarBinding :target (scene/ScalarTarget :alpha) :motion-id |alpha :version 1
                :motions $ [] $ motion/ScalarDescriptor :id |alpha :version 1 :motion
                  motion/ScalarMotion :keyframes $ motion/ScalarTrack :frames
                    []
                      motion/ScalarKeyframe :at 0 :value 0 :easing $ motion/Easing :smoothstep
                      motion/ScalarKeyframe :at 1 :value 1 :easing $ motion/Easing :linear
                    , :loop $ motion/TrackLoop :clamp
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.component-sample/ComponentDeclaration)
            :args $ [] 'Number 'Number 'Number 'Bool 'Number
        'declare-dual $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn declare-dual (props model input ready viewport)
            let
                color $ if ready
                  motion/ColorRgba :r 0 :g 0.7 :b 0.4 :a 1
                  motion/ColorRgba :r 0.92 :g 0.28 :b 0.6 :a 1
                fixed $ scene/SceneNode :id |static :parent | :key |static :content
                  scene/SceneContent :rect $ scene/RectNode :x 16 :y 100 :width 288 :height 12 :fill $ motion/ColorRgba :r 0.4 :g 0.4 :b 0.4 :a 1
                  , :bindings ([]) :interaction $ scene/SceneInteraction :none
                moving $ scene/SceneNode :id |badge :parent | :key |badge :content
                  scene/SceneContent :rect $ scene/RectNode :x 80 :y (+ props model input) :width
                    + 30 $ / viewport 10
                    , :height 20 :fill color
                  , :bindings
                    []
                      scene/ScalarBinding :target (scene/ScalarTarget :x) :motion-id |x :version 1
                      scene/ScalarBinding :target (scene/ScalarTarget :y) :motion-id |y :version 1
                      scene/ScalarBinding :target (scene/ScalarTarget :width) :motion-id |width :version 1
                      scene/ScalarBinding :target (scene/ScalarTarget :height) :motion-id |height :version 1
                    , :interaction $ scene/SceneInteraction :none
                descriptor $ motion/ScalarDescriptor :id |x :version 1 :motion $ motion/ScalarMotion :tween
                  motion/ScalarTween :start 0 :duration 1 :from 80 :to 144 :easing $ motion/Easing :smoothstep
                vertical $ motion/ScalarDescriptor :id |y :version 1 :motion $ motion/ScalarMotion :tween
                  motion/ScalarTween :start 0 :duration 1 :from (+ props model input) :to (+ props model input 32) :easing $ motion/Easing :smoothstep
                width $ motion/ScalarDescriptor :id |width :version 1 :motion $ motion/ScalarMotion :tween
                  motion/ScalarTween :start 0 :duration 1 :from
                    + 30 $ / viewport 10
                    , :to
                      +
                        + 30 $ / viewport 10
                        , 64
                      , :easing $ motion/Easing :smoothstep
                height $ motion/ScalarDescriptor :id |height :version 1 :motion $ motion/ScalarMotion :tween
                  motion/ScalarTween :start 0 :duration 1 :from 20 :to 52 :easing $ motion/Easing :smoothstep
              component/ComponentDeclaration :scene
                scene/SceneDocument :nodes $ [] fixed moving
                , :motions $ [] descriptor vertical width height
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.component-sample/ComponentDeclaration)
            :args $ [] 'Number 'Number 'Number 'Bool 'Number
        'declare-execution $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn declare-execution (props model input ready viewport)
            let
                base $ declare props model input ready viewport
                path $ scene/SceneNode :id |ribbon :key |ribbon :parent | :bindings ([]) :interaction (scene/SceneInteraction :none) :content $ scene/SceneContent :polyline
                  scene/PolylineNode :width 6 :stroke
                    motion/ColorRgba :r 0 :g 0.5 :b 1 :a 1
                    , :points $ [] (motion/Vec2 :x 0 :y 140) (motion/Vec2 :x 40 :y 140)
                nodes $ conj
                  :nodes $ :scene base
                  , path
              retained/ExecutionDeclaration :component
                struct-with base $ :scene $ scene/SceneDocument :nodes nodes
                , :transforms $ retained/TransformSampler :cpu $ fn (time)
                  map nodes $ fn (node)
                    scene/Matrix2D :a 1 :b 0 :c 0 :d 1 :e
                      if
                        = |ribbon $ :id node
                        + 20 (* 10 time) (- model 40)
                        , 0
                      , :f 0
          :examples $ []
          :schema $ :: 'Fn $ {}
            :return 'quamolit.retained-component/ExecutionDeclaration
            :args $ [] 'Number 'Number 'Number 'Bool 'Number
        'dispose-gpu! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn dispose-gpu! (host) (batch/dispose-renderer! host)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'quamolit.gpu-component/RectRendererHost
            :features $ #{} :js-ffi
        'dispose-instances-gpu! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn dispose-instances-gpu! (batch) (webgpu/dispose! batch)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.webgpu-batches/RectBatchHost
            :features $ #{} :js-ffi
        'draw! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw! (context plan) (platform/clear-canvas! context 320 180) (retained/draw-plan! context plan)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.retained-component/ComponentPlan
            :features $ #{} :js-ffi
        'draw-gpu! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-gpu! (host program time) (gpu/draw-at! host program time)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'quamolit.gpu-component/RectRendererHost 'quamolit.gpu-scalar-program/ScalarProgram 'Number
            :features $ #{} :js-ffi
        'draw-independent-gpu! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-independent-gpu! (host program time) (gpu/draw-instance-at! host program time)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'quamolit.gpu-component/RectRendererHost 'quamolit.gpu-scalar-program/InstanceProgram 'Number
            :features $ #{} :js-ffi
        'draw-instances! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-instances! (context positions)
            canvas/draw-instances! context (instances-declaration) positions
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.canvas-reference/InstancesMetrics)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'js-ffi.typed-arrays/Float32ArrayHost
        'draw-instances-gpu! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-instances-gpu! (previous batch table version)
            instance-gpu/draw-source! previous batch table $ instances-for-version version
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.instance-gpu/SourceDraw)
            :args $ [] 'Number 'quamolit.webgpu-batches/RectBatchHost 'quamolit.instance-resource/InstanceTableHost 'Number
        'draw-resolved-instances! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-resolved-instances! (context table version)
            let
                node $ instances-for-version version
              canvas/draw-instances! context node $ resource/resolve table $ :source node
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.canvas-reference/InstancesMetrics)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.instance-resource/InstanceTableHost 'Number
            :features $ #{} :js-ffi
        'empty-presence-resource-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-presence-resource-plan () (presence/empty-instance-resource-plan)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/InstanceResourcePlan)
            :args $ []
        'gpu-recovery-close $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-recovery-close (state) (recovery/close-recovery state)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.device-recovery/RecoveryTransition)
            :args $ [] 'quamolit.device-recovery/RecoveryState
        'gpu-recovery-create-failed $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-recovery-create-failed (state generation message)
            recovery/create-resolved state generation $ recovery/create-failed message
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.device-recovery/RecoveryTransition)
            :args $ [] 'quamolit.device-recovery/RecoveryState 'Number 'String
        'gpu-recovery-create-ready $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-recovery-create-ready (state generation)
            recovery/create-resolved state generation $ recovery/create-ready
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.device-recovery/RecoveryTransition)
            :args $ [] 'quamolit.device-recovery/RecoveryState 'Number
        'gpu-recovery-initial $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-recovery-initial (version) (recovery/initial-state version)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.device-recovery/RecoveryState)
            :args $ [] 'Number
        'gpu-recovery-lost $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-recovery-lost (state generation message) (recovery/device-lost state generation message)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.device-recovery/RecoveryTransition)
            :args $ [] 'quamolit.device-recovery/RecoveryState 'Number 'String
        'gpu-recovery-open $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-recovery-open (state version) (recovery/request-open state version)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.device-recovery/RecoveryTransition)
            :args $ [] 'quamolit.device-recovery/RecoveryState 'Number
        'gpu-recovery-probe-failed $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-recovery-probe-failed (state generation message)
            recovery/probe-resolved state generation $ recovery/probe-failed message
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.device-recovery/RecoveryTransition)
            :args $ [] 'quamolit.device-recovery/RecoveryState 'Number 'String
        'gpu-recovery-probe-fallback $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-recovery-probe-fallback (state generation message)
            recovery/probe-resolved state generation $ recovery/probe-fallback message
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.device-recovery/RecoveryTransition)
            :args $ [] 'quamolit.device-recovery/RecoveryState 'Number 'String
        'gpu-recovery-probe-ready $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-recovery-probe-ready (state generation)
            recovery/probe-resolved state generation $ recovery/probe-ready
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.device-recovery/RecoveryTransition)
            :args $ [] 'quamolit.device-recovery/RecoveryState 'Number
        'gpu-recovery-update-version $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-recovery-update-version (state version) (recovery/update-resource-version state version)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.device-recovery/RecoveryState)
            :args $ [] 'quamolit.device-recovery/RecoveryState 'Number
        'gpu-reusable? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-reusable? (program plan) (gpu/reusable? program plan)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.gpu-scalar-program/ScalarProgram 'quamolit.retained-component/ComponentPlan
        'independent-instance-motions $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn independent-instance-motions ()
            map (range 10000)
              fn (index)
                let
                    x $ + 8 $ * 2 (&number:rem index 125)
                    y $ + 10 $ * 2
                      floor $ / index 125
                    dx $ + 1 $ &number:rem index 7
                    dy $ - (&number:rem index 5) 2
                  quamolit.motion/Vec2Descriptor :id (str |independent- index) :version 1 :motion $ quamolit.motion/Vec2Motion :tween $ quamolit.motion/Vec2Tween :start
                    * 0.012 $ &number:rem index 13
                    , :duration
                      + 0.45 $ * 0.02 $ &number:rem index 17
                      , :from (quamolit.motion/Vec2 :x x :y y) :to
                        quamolit.motion/Vec2 :x (+ x dx) :y $ + y dy
                        , :easing
                          if
                            = 0 $ &number:rem index 2
                            quamolit.motion/Easing :linear
                            quamolit.motion/Easing :smoothstep
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.motion/Vec2Descriptor
        'independent-instance-positions $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn independent-instance-positions (motions time)
            mapcat motions $ fn (descriptor)
              let
                  point $ quamolit.motion/sample-vec2 descriptor time
                [] (:x point) (:y point)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.motion/Vec2Descriptor) 'Number
            :return $ :: 'List 'Number
        'install-gpu! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn install-gpu! (host program) (gpu/install-program! host program)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'quamolit.gpu-component/RectRendererHost 'quamolit.gpu-scalar-program/ScalarProgram
            :features $ #{} :js-ffi
        'install-independent-gpu! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn install-independent-gpu! (host program time) (gpu/install-instance-program! host program time)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'quamolit.gpu-component/RectRendererHost 'quamolit.gpu-scalar-program/InstanceProgram 'Number
            :features $ #{} :js-ffi
        'instance-frame-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn instance-frame-at (time)
            InstanceFrame :index 5050 :x
              * 108 $ - 1 time
              , :y $ * 90 $ - 1 time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'app.main/InstanceFrame)
            :args $ [] 'Number
        'instances-declaration $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn instances-declaration ()
            scene/InstanceNode :source (scene/InstanceSource :id |consumer-particles :version 1 :count 10000) :width 2 :height 2 :fill $ motion/ColorRgba :r 0.917 :g 0.345 :b 0.047 :a 1
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/InstanceNode)
            :args $ []
        'instances-for-version $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn instances-for-version (version)
            scene/InstanceNode :source (scene/InstanceSource :id |consumer-particles :version version :count 10000) :width 2 :height 2 :fill $ motion/ColorRgba :r 0.917 :g 0.345 :b 0.047 :a 1
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/InstanceNode)
            :args $ [] 'Number
        'instances-live-count $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn instances-live-count (table) (resource/live-count table)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.instance-resource/InstanceTableHost
            :features $ #{} :js-ffi
        'main! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn main! () &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ []
        'patch-instances! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn patch-instances! (table previous version frame positions)
            resource/register-patch! table
              :source $ instances-for-version version
              , previous (:index frame) positions
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.instance-resource/InstanceTableHost 'Number 'Number 'app.main/InstanceFrame 'js-ffi.typed-arrays/Float32ArrayHost
            :features $ #{} :js-ffi
        'prepare-gpu $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn prepare-gpu (plan) (gpu/prepare-program plan)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-scalar-program/ProgramResult)
            :args $ [] 'quamolit.retained-component/ComponentPlan
        'prepare-independent-gpu $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn prepare-independent-gpu (motions time)
            gpu/prepare-instance-program (instances-declaration) motions time
          :examples $ []
          :schema $ :: 'Fn $ {}
            :return 'quamolit.gpu-scalar-program/InstanceProgramResult
            :args $ [] (:: 'List 'quamolit.motion/Vec2Descriptor) 'Number
        'presence-document $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-document (phase)
            let
                blue $ motion/ColorRgba :r 0.18 :g 0.5 :b 0.92 :a 1
                orange $ motion/ColorRgba :r 0.98 :g 0.42 :b 0.12 :a 1
                a-content $ scene/SceneContent :rect $ scene/RectNode :x 72 :y 54 :width 72 :height 72 :fill orange
                b-content $ scene/SceneContent :rect $ scene/RectNode :x 176 :y 54 :width 72 :height 72 :fill blue
                a $ scene/SceneNode :id |a :parent | :key |a :content a-content :bindings ([]) :interaction $ scene/SceneInteraction :target |open-a
                b $ scene/SceneNode :id |b :parent | :key |b :content b-content :bindings ([]) :interaction $ scene/SceneInteraction :target |open-b
              if (= phase |full)
                scene/SceneDocument :nodes $ [] a b
                if (= phase |reordered)
                  scene/SceneDocument :nodes $ [] b a
                  if (= phase |without-a)
                    scene/SceneDocument :nodes $ [] b
                    raise |unknown-consumer-presence-phase
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'String
        'presence-initial $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-initial ()
            presence/start-presence $ presence-document |full
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceModel)
            :args $ []
        'presence-needs-frame? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-needs-frame? (model time) (presence/presence-needs-frame? model time)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.presence/PresenceModel 'Number
        'presence-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-plan (model time version)
            retained/build-execution-plan (request time version false 100)
              fn (props ignored input resources viewport)
                retained/ExecutionDeclaration :component
                  presence-component/declare-flat model $ binding/empty-descriptors
                  , :transforms $ retained/TransformSampler :none
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.presence/PresenceModel 'Number 'Number
        'presence-reconcile $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-reconcile (model phase time)
            presence/reconcile-presence model (presence-document phase) time 1 $ motion/Easing :smoothstep
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceUpdate)
            :args $ [] 'quamolit.presence/PresenceModel 'String 'Number
        'presence-resource-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-resource-plan (model previous) (presence/instance-resource-plan model previous)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/InstanceResourcePlan)
            :args $ [] 'quamolit.presence/PresenceModel 'quamolit.presence/InstanceResourcePlan
        'presence-sample $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-sample (model time) (presence/sample-presence model time)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.presence/PresenceModel 'Number
            :return $ :: 'List 'quamolit.presence/PresenceSample
        'presence-settle $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-settle (model time) (presence/settle-presence model time)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceUpdate)
            :args $ [] 'quamolit.presence/PresenceModel 'Number
        'presence-update-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-update-plan (previous model time version)
            retained/update-execution-plan previous (request time version false 100)
              fn (props ignored input resources viewport)
                retained/ExecutionDeclaration :component
                  presence-component/declare-flat model $ binding/empty-descriptors
                  , :transforms $ retained/TransformSampler :none
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'quamolit.presence/PresenceModel 'Number 'Number
        'register-instances! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn register-instances! (table positions)
            resource/register! table
              :source $ instances-for-version 1
              , positions
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'js-ffi.typed-arrays/Float32ArrayHost)
            :args $ [] 'quamolit.instance-resource/InstanceTableHost 'js-ffi.typed-arrays/Float32ArrayHost
            :features $ #{} :js-ffi
        'register-instances-version! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn register-instances-version! (table version positions)
            resource/register! table
              :source $ instances-for-version version
              , positions
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'js-ffi.typed-arrays/Float32ArrayHost)
            :args $ [] 'quamolit.instance-resource/InstanceTableHost 'Number 'js-ffi.typed-arrays/Float32ArrayHost
            :features $ #{} :js-ffi
        'release-instances! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn release-instances! (table version)
            resource/release! table $ :source $ instances-for-version version
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.instance-resource/InstanceTableHost 'Number
            :features $ #{} :js-ffi
        'reload! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reload! () &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ []
        'request $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn request (time model ready viewport)
            component/ComponentRequest :id |consumer :time time :versions
              direct/FrameVersions :component 0 :motion 0 :model model :input 0 :resources (if ready 1 0) :viewport viewport
              , :props 20 :model model :input 2 :resources ready :viewport viewport
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'Number 'Bool 'Number
            :return $ :: 'quamolit.component-sample/ComponentRequest 'Number 'Number 'Number 'Bool 'Number
        'resource-presence-document $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn resource-presence-document (phase version)
            let
                color $ motion/ColorRgba :r 0.18 :g 0.5 :b 0.92 :a 1
                content $ scene/SceneContent :instances $ scene/InstanceNode :source (scene/InstanceSource :id |consumer-particles :version version :count 10000) :width 2 :height 2 :fill color
                a $ scene/SceneNode :id |resource-a :parent | :key |resource-a :content content :bindings ([]) :interaction $ scene/SceneInteraction :none
                b $ scene/SceneNode :id |resource-b :parent | :key |resource-b :content content :bindings ([]) :interaction $ scene/SceneInteraction :none
              if (= phase |full)
                scene/SceneDocument :nodes $ [] a b
                if (= phase |reordered)
                  scene/SceneDocument :nodes $ [] b a
                  if (= phase |without-a)
                    scene/SceneDocument :nodes $ [] b
                    if (= phase |empty)
                      scene/SceneDocument :nodes $ []
                      raise |unknown-consumer-resource-phase
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'String 'Number
        'resource-presence-initial $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn resource-presence-initial (version)
            presence/start-presence $ resource-presence-document |full version
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceModel)
            :args $ [] 'Number
        'resource-presence-reconcile $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn resource-presence-reconcile (model phase time version)
            presence/reconcile-presence model (resource-presence-document phase version) time 1 $ motion/Easing :smoothstep
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceUpdate)
            :args $ [] 'quamolit.presence/PresenceModel 'String 'Number 'Number
        'start $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn start (time model ready viewport)
            retained/build-execution-plan (request time model ready viewport) declare-execution
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'Number 'Number 'Bool 'Number
        'start-alpha $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn start-alpha (time model ready viewport)
            retained/build-component-plan (request time model ready viewport) declare-alpha
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'Number 'Number 'Bool 'Number
        'start-dual $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn start-dual (time model ready viewport)
            retained/build-component-plan (request time model ready viewport) declare-dual
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'Number 'Number 'Bool 'Number
        'start-rects $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn start-rects (time model ready viewport)
            retained/build-component-plan (request time model ready viewport) declare
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'Number 'Number 'Bool 'Number
        'submit-batch! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn submit-batch! (host prepared)
            batch/submit-update! host $ :delta prepared
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'quamolit.gpu-component/RectRendererHost 'quamolit.gpu-component/BatchPlan
            :features $ #{} :js-ffi
        'update-alpha $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-alpha (plan time model ready viewport)
            retained/update-component-plan plan (request time model ready viewport) declare-alpha
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'Number 'Number 'Bool 'Number
        'update-batch $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-batch (previous plan) (batch/update-batch previous plan)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/BatchPlan)
            :args $ [] 'quamolit.gpu-component/BatchPlan 'quamolit.retained-component/ComponentPlan
        'update-dual $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-dual (plan time model ready viewport)
            retained/update-component-plan plan (request time model ready viewport) declare-dual
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'Number 'Number 'Bool 'Number
        'update-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-plan (plan time model ready viewport)
            retained/update-execution-plan plan (request time model ready viewport) declare-execution
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'Number 'Number 'Bool 'Number
        'update-rects $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-rects (plan time model ready viewport)
            retained/update-component-plan plan (request time model ready viewport) declare
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'Number 'Number 'Bool 'Number
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns app.main
          :require (quamolit.component-sample :as component) (quamolit.direct-frame :as direct) (quamolit.scene-ir :as scene) (quamolit.motion :as motion) (quamolit.retained-component :as retained) (js-ffi.canvas-batches :as platform) (js-ffi.browser :as browser) (quamolit.gpu-scalar-program :as gpu) (quamolit.gpu-component :as batch) (quamolit.canvas-reference :as canvas) (quamolit.instance-resource :as resource) (quamolit.instance-gpu :as instance-gpu) (quamolit.webgpu-batches :as webgpu) (quamolit.presence :as presence) (quamolit.presence-component :as presence-component) (quamolit.scene-binding :as binding) (quamolit.device-recovery :as recovery)
