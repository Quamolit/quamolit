
(ns quamolit.alias (:require [quamolit.types :refer [Component Shape]]))

(def children-xfrom (comp (map-indexed vector) (filter (fn [entry] (some? (last entry))))))

(defn arrange-children [children]
  (if (seq? (first children))
    (sort-by first (first children))
    (seq (transduce children-xfrom conj [] children))))

(defn create-shape [shape-name props children]
  (if (not (map? props)) (throw (js/Error. "Props expeced to be a map!")))
  (Shape. shape-name (:style props) (:event props) (arrange-children children)))

(defn arc [props & children] (create-shape :arc props children))

(defn bezier [props & children] (create-shape :bezier props children))

(defn default-init-instant [args state] {:numb? false})

(defn default-init-state [& args] {})

(defn default-on-tick [instant tick elapsed] instant)

(defn default-on-unmount [instant tick] (assoc instant :numb? true))

(defn default-on-update [instant old-args args old-state state] instant)

(defn default-remove? [instant] (:numb? instant))

(defn create-comp
  ([comp-name render] (create-comp comp-name nil nil nil nil nil nil nil render))
  ([comp-name init-state update-state render]
   (create-comp comp-name init-state update-state nil nil nil nil nil render))
  ([comp-name init-instant on-tick on-update on-unmount remove? render]
   (create-comp comp-name nil nil init-instant on-tick on-update on-unmount remove? render))
  ([comp-name
    init-state
    update-state
    init-instant
    on-tick
    on-update
    on-unmount
    remove?
    render]
   (fn [& args]
     (Component.
      comp-name
      nil
      args
      nil
      nil
      (or init-state default-init-state)
      (or update-state merge)
      (or init-instant default-init-instant)
      (or on-tick default-on-tick)
      (or on-update default-on-update)
      (or on-unmount default-on-unmount)
      (or remove? default-remove?)
      render
      nil
      false))))

(defn group [props & children] (create-shape :group props children))

(defn image [props & children] (create-shape :image props children))

(defn line [props & children] (create-shape :line props children))

(defn native-alpha [props & children] (create-shape :native-alpha props children))

(defn native-clip [props & children] (create-shape :native-clip props children))

(defn native-restore [props & children] (create-shape :native-restore props children))

(defn native-rotate [props & children] (create-shape :native-rotate props children))

(defn native-save [props & children] (create-shape :native-save props children))

(defn native-scale [props & children] (create-shape :native-scale props children))

(defn native-transform [props & children] (create-shape :native-transform props children))

(defn native-translate [props & children] (create-shape :native-translate props children))

(defn path [props & children] (create-shape :path props children))

(defn rect [props & children] (create-shape :rect props children))

(defn text [props & children] (create-shape :text props children))
