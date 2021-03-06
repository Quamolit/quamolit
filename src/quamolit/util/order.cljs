
(ns quamolit.util.order )

(defn by-coord [a b]
  (comment .log js/console "comparing" a b)
  (cond
    (= (count a) (count b) 0) 0
    (and (= (count a) 0) (> (count b) 0)) -1
    (and (> (count a) 0) (= (count b) 0)) 1
    :else (case (compare (first a) (first b)) -1 -1 1 1 (recur (rest a) (rest b)))))
