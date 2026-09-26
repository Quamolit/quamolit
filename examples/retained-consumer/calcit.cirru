
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
          :schema $ :: 'Fn $ {} (:return 'JsObject)
            :args $ [] 'JsObject 'js-ffi.webgpu/DeviceHost 'String 'Number
            :features $ #{} :js-ffi
        'create-gpu! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn create-gpu! (canvas device format capacity) (gpu/create-renderer! canvas device format capacity)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'JsObject)
            :args $ [] 'JsObject 'js-ffi.webgpu/DeviceHost 'String 'Number
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
                  scene/SceneContent :rect $ scene/RectNode :x 80 :y (+ props model input) :width (/ viewport 10) :height 20 :fill color
                  , :bindings
                    []
                      scene/ScalarBinding :target (scene/ScalarTarget :x) :motion-id |x :version 1
                      scene/ScalarBinding :target (scene/ScalarTarget :y) :motion-id |y :version 1
                    , :interaction $ scene/SceneInteraction :none
                descriptor $ motion/ScalarDescriptor :id |x :version 1 :motion $ motion/ScalarMotion :tween
                  motion/ScalarTween :start 0 :duration 1 :from 80 :to 144 :easing $ motion/Easing :smoothstep
                vertical $ motion/ScalarDescriptor :id |y :version 1 :motion $ motion/ScalarMotion :tween
                  motion/ScalarTween :start 0 :duration 1 :from (+ props model input) :to (+ props model input 32) :easing $ motion/Easing :smoothstep
              component/ComponentDeclaration :scene
                scene/SceneDocument :nodes $ [] fixed moving
                , :motions $ [] descriptor vertical
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
            :args $ [] 'JsObject
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
            :args $ [] 'JsObject 'quamolit.gpu-scalar-program/ScalarProgram 'Number
            :features $ #{} :js-ffi
        'gpu-reusable? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-reusable? (program plan) (gpu/reusable? program plan)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.gpu-scalar-program/ScalarProgram 'quamolit.retained-component/ComponentPlan
        'install-gpu! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn install-gpu! (host program) (gpu/install-program! host program)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject 'quamolit.gpu-scalar-program/ScalarProgram
            :features $ #{} :js-ffi
        'main! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn main! () &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ []
        'prepare-gpu $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn prepare-gpu (plan) (gpu/prepare-program plan)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-scalar-program/ProgramResult)
            :args $ [] 'quamolit.retained-component/ComponentPlan
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
        'start $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn start (time model ready viewport)
            retained/build-execution-plan (request time model ready viewport) declare-execution
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
            :args $ [] 'JsObject 'quamolit.gpu-component/BatchPlan
            :features $ #{} :js-ffi
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
          :require (quamolit.component-sample :as component) (quamolit.direct-frame :as direct) (quamolit.scene-ir :as scene) (quamolit.motion :as motion) (quamolit.retained-component :as retained) (js-ffi.canvas-batches :as platform) (js-ffi.browser :as browser) (quamolit.gpu-scalar-program :as gpu) (quamolit.gpu-component :as batch)
