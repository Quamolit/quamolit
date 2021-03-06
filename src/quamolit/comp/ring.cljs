
(ns quamolit.comp.ring
  (:require [hsl.core :refer [hsl]]
            [quamolit.alias :refer [create-comp group path]]
            [quamolit.comp.debug :refer [comp-debug]]))

(defn cos [x] (js/Math.cos (* js/Math.PI (/ x 180))))

(defn sin [x] (js/Math.sin (* js/Math.PI (/ x 180))))

(defn render [timestamp]
  (fn [state mutate! instant tick]
    (let [n 20
          angle (/ 360 n)
          shift 10
          rotation (mod (/ tick 40) 360)
          r 100
          rl 200
          curve-points (map
                        (fn [x]
                          (let [this-angle (* angle (inc x))
                                angle-1 (+ (- this-angle rotation angle) shift)
                                angle-2 (- (+ this-angle rotation) shift)]
                            [(* rl (sin angle-1))
                             (- 0 (* rl (cos angle-1)))
                             (* rl (sin angle-2))
                             (- 0 (* rl (cos angle-2)))
                             (* r (sin this-angle))
                             (- 0 (* r (cos this-angle)))]))
                        (range n))]
      (group
       {}
       (path
        {:style {:points (concat [[0 (- 0 r)]] curve-points),
                 :line-width 2,
                 :stroke-style (hsl 300 80 60)}})
       (comp-debug (js/Math.floor rotation) {})))))

(def comp-ring (create-comp :ring render))
