
(ns quamolit.render.element
  (:require [hsl.core :refer [hsl]]
            [quamolit.alias
             :refer
             [create-comp
              native-translate
              native-alpha
              native-save
              native-restore
              native-rotate
              native-scale
              group
              rect
              text
              arrange-children]]
            [quamolit.util.keyboard :refer [keycode->key]]))

(defn render-alpha [props & children]
  (let [style (merge {:opacity 0.5} (:style props))]
    (fn [state mutate! instant tick]
      (group
       {}
       (native-save {})
       (native-alpha (assoc props :style style))
       (group {} (arrange-children children))
       (native-restore {})))))

(def alpha (create-comp :alpha render-alpha))

(defn render-button [props]
  (comment .log js/console (:style props))
  (let [style (:style props)
        guide-text (or (:text style) "button")
        x (or (:x style) 0)
        y (or (:y style) 0)
        w (or (:w style) 100)
        h (or (:h style) 40)
        style-bg {:x x,
                  :y y,
                  :fill-style (or (:surface-color style) (hsl 0 80 80)),
                  :w w,
                  :h h}
        event-button (:event props)
        style-text {:fill-style (or (:text-color style) (hsl 0 0 10)),
                    :text guide-text,
                    :size (or (:font-size style) 20),
                    :font-family (or (:font-family style) "Optima"),
                    :text-align "center",
                    :x x,
                    :y y}]
    (fn [state mutate! instant tick]
      (group {} (rect {:style style-bg, :event event-button}) (text {:style style-text})))))

(def button (create-comp :button render-button))

(defn handle-keydown [mutate!]
  (fn [event dispatch] (mutate! (.-keyCode event) (.-shiftKey event))))

(defn init-textbox [props] (:text (:style props)))

(defn render-translate [props & children]
  (let [style (merge {:x 0, :y 0} (:style props))]
    (fn [state mutate! instant tick]
      (group
       {}
       (native-save {})
       (native-translate (assoc props :style style))
       (group {} (arrange-children children))
       (native-restore {})))))

(def translate (create-comp :translate render-translate))

(defn render-input [props]
  (let [style (:style props)
        event-collection (:event props)
        w (:w style)
        h (:h style)
        style-bg {:fill-style (hsl 0 50 80),
                  :stroke-style (hsl 0 0 50),
                  :line-width 2,
                  :x (or (:x style) 0),
                  :y (or (:y style) 0),
                  :w w,
                  :h h}
        style-place-text {}
        style-text {:text-align "center",
                    :text (:text style),
                    :font-family "Optima",
                    :size 20,
                    :fill-style (hsl 0 0 0),
                    :x 0,
                    :y 0,
                    :max-width w}]
    (fn [state mutate! instant tick]
      (group
       {}
       (rect {:style style-bg, :event event-collection})
       (translate {:style style-place-text} (text {:style style-text}))))))

(def input (create-comp :input render-input))

(def pi-ratio (/ js/Math.PI 180))

(defn render-rotate [props & children]
  (fn [state mutate! instant tick]
    (let [style (:style props), angle (* pi-ratio (or (:angle style) 30))]
      (comment .log js/console "actual degree:" angle)
      (group
       {}
       (native-save {})
       (native-rotate {:style {:angle angle}})
       (group {} (arrange-children children))
       (native-restore {})))))

(defn render-scale [props & children]
  (let [style (merge {:x 0, :y 0} (:style props))]
    (fn [state mutate! instant tick]
      (group
       {}
       (native-save {})
       (native-scale (assoc props :style style))
       (group {} (map-indexed vector children))
       (native-restore {})))))

(defn render-textbox [props]
  (fn [state mutate! instant tick]
    (let [style (assoc (:style props) :text state)]
      (input {:style style, :event {:keydown (handle-keydown mutate!)}}))))

(def rotate (create-comp :rotate render-rotate))

(def scale (create-comp :scale render-scale))

(defn update-textbox [state keycode shift?]
  (comment .log js/console keycode)
  (let [guess (keycode->key keycode shift?)]
    (if (some? guess)
      (str state guess)
      (case keycode 8 (if (= state "") "" (subs state 0 (- (count state) 1))) state))))

(def textbox (create-comp :textbox init-textbox update-textbox render-textbox))
