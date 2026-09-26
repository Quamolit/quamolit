
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
        'draw! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw! (context plan) (platform/clear-canvas! context 320 180)
            canvas/draw-reference-rects! context $ :scene plan
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.retained-component/ComponentPlan
            :features $ #{} :js-ffi
        'main! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn main! () &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ []
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
            retained/build-component-plan (request time model ready viewport) declare
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'Number 'Number 'Bool 'Number
        'update-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-plan (plan time model ready viewport)
            retained/update-component-plan plan (request time model ready viewport) declare
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'Number 'Number 'Bool 'Number
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns app.main
          :require (quamolit.component-sample :as component) (quamolit.direct-frame :as direct) (quamolit.scene-ir :as scene) (quamolit.motion :as motion) (quamolit.retained-component :as retained) (quamolit.canvas-reference :as canvas) (js-ffi.canvas-batches :as platform) (js-ffi.browser :as browser)
