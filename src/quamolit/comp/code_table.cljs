
(ns quamolit.comp.code-table
  (:require [hsl.core :refer [hsl]]
            [quamolit.alias :refer [create-comp group rect]]
            [quamolit.render.element :refer [input translate textbox]]
            [quamolit.util.keyboard :refer [keycode->key]]))

(defn init-state [] (into [] (repeat 3 (into [] (repeat 3 "edit")))))

(defn render []
  (fn [state mutate! instant tick]
    (comment .log js/console state)
    (translate
     {:style {:x -160, :y -160}}
     (->> state
          (map-indexed
           (fn [i row]
             [i
              (group
               {}
               (->> row
                    (map-indexed
                     (fn [j content]
                       [j
                        (let [move-x (* i 100), move-y (* j 60)]
                          (translate
                           {:style {:x move-x, :y move-y}}
                           (textbox {:style {:w 80, :h 40, :text content}})))]))))]))))))

(def comp-code-table (create-comp :code-table init-state nil render))
