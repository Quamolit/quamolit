
(ns quamolit.comp.portal
  (:require [hsl.core :refer [hsl]]
            [quamolit.alias :refer [create-comp group rect text]]
            [quamolit.render.element :refer [alpha translate button]]
            [quamolit.util.iterate :refer [iterate-instant tween]]))

(defn handle-navigate [mutate-navigate next-page]
  (fn [event dispatch] (mutate-navigate next-page)))

(defn style-button [x y page-name bg-color]
  {:w 180,
   :h 60,
   :x (- (* x 240) 400),
   :y (- (* y 100) 200),
   :surface-color bg-color,
   :text page-name,
   :text-color (hsl 0 0 100)})

(defn render [mutate-navigate]
  (fn [state mutate! instant tick]
    (group
     {}
     (button
      {:style (style-button 0 0 "Todolist" (hsl 0 120 60)),
       :event {:click (handle-navigate mutate-navigate :todolist)}})
     (button
      {:style (style-button 1 0 "Clock" (hsl 300 80 80)),
       :event {:click (handle-navigate mutate-navigate :clock)}})
     (button
      {:style (style-button 2 0 "Solar" (hsl 140 80 80)),
       :event {:click (handle-navigate mutate-navigate :solar)}})
     (button
      {:style (style-button 3 0 "Binary Tree" (hsl 140 20 30)),
       :event {:click (handle-navigate mutate-navigate :binary-tree)}})
     (button
      {:style (style-button 0 1 "Table" (hsl 340 80 80)),
       :event {:click (handle-navigate mutate-navigate :code-table)}})
     (button
      {:style (style-button 1 1 "Finder" (hsl 60 80 45)),
       :event {:click (handle-navigate mutate-navigate :finder)}})
     (button
      {:style (style-button 2 1 "Raining" (hsl 260 80 80)),
       :event {:click (handle-navigate mutate-navigate :raining)}})
     (button
      {:style (style-button 3 1 "Icons" (hsl 30 80 80)),
       :event {:click (handle-navigate mutate-navigate :icons)}})
     (button
      {:style (style-button 0 2 "Curve" (hsl 100 80 80)),
       :event {:click (handle-navigate mutate-navigate :curve)}})
     (button
      {:style (style-button 1 2 "Folding fan" (hsl 200 80 80)),
       :event {:click (handle-navigate mutate-navigate :folding-fan)}}))))

(def comp-portal (create-comp :portal render))
