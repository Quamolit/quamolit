
{} (:package |quamolit)
  :configs $ {} (:init-fn |quamolit.app.main/main!) (:reload-fn |quamolit.app.main/reload!) (:version |0.0.17)
    :modules $ [] |pointed-prompt/ |touch-control/
  :entries $ {}
  :files $ {}
    |quamolit.alias $ {}
      :defs $ {}
        |>> $ quote
          defn >> (states k)
            let
                parent-cursor $ either (&map:get states :cursor) ([])
                branch $ &map:get states k
              &map:assoc
                either branch $ {}
                , :cursor $ append parent-cursor k
        |arc $ quote
          defn arc (props & children) (create-shape :arc props children)
        |arrange-children $ quote
          defn arrange-children (children)
            if (every? children some?)
              -> children $ map-indexed
                fn (idx x) ([] idx x)
              -> children
                map-indexed $ fn (idx x) ([] idx x)
                filter $ fn (entry)
                  some? $ last entry
        |bezier $ quote
          defn bezier (props & children) (create-shape :bezier props children)
        |create-list-shape $ quote
          defn create-list-shape (shape-name props children)
            if
              not $ map? props
              raise $ new js/Error "|Props expeced to be a map!"
            %{} Shape (:name shape-name)
              :style $ :style props
              :event $ :event props
              :children children
        |create-shape $ quote
          defn create-shape (shape-name props children)
            if
              not $ map? props
              raise $ new js/Error "|Props expeced to be a map!"
            %{} Shape (:name shape-name)
              :style $ &map:dissoc props :event
              :event $ &map:get props :event
              :children $ arrange-children children
        |defcomp $ quote
          defmacro defcomp (comp-name args & body)
            quasiquote $ defn ~comp-name ~args
              let
                  ret $ do ~@body
                cond
                    record? ret
                    %{} Component
                      :name $ ~ (turn-tag comp-name)
                      :on-tick nil
                      :tree ret
                  (list? ret)
                    do
                      assert "\"expected on-tick and tree" $ = 2 (count ret)
                      %{} Component
                        :name $ ~ (turn-tag comp-name)
                        :on-tick $ first ret
                        :tree $ last ret
                  (map? ret)
                    %{} Component
                      :name $ ~ (turn-tag comp-name)
                      :on-tick $ :on-tick ret
                      :tree $ :tree ret
                  true $ raise "\"unknown component"
        |group $ quote
          defn group (props & children) (create-shape :group props children)
        |image $ quote
          defn image (props & children) (create-shape :image props children)
        |line $ quote
          defn line (props & children) (create-shape :line props children)
        |list-> $ quote
          defn list-> (props children) (create-list-shape :group props children)
        |native-alpha $ quote
          defn native-alpha (props & children) (create-shape :native-alpha props children)
        |native-clip $ quote
          defn native-clip (props & children) (create-shape :native-clip props children)
        |native-restore $ quote
          defn native-restore (props & children) (create-shape :native-restore props children)
        |native-rotate $ quote
          defn native-rotate (props & children) (create-shape :native-rotate props children)
        |native-save $ quote
          defn native-save (props & children) (create-shape :native-save props children)
        |native-scale $ quote
          defn native-scale (props & children) (create-shape :native-scale props children)
        |native-transform $ quote
          defn native-transform (props & children) (create-shape :native-transform props children)
        |native-translate $ quote
          defn native-translate (props & children) (create-shape :native-translate props children)
        |path $ quote
          defn path (props & children) (create-shape :path props children)
        |rect $ quote
          defn rect (props & children) (create-shape :rect props children)
        |text $ quote
          defn text (props & children) (create-shape :text props children)
      :ns $ quote
        ns quamolit.alias $ :require
          quamolit.types :refer $ Component Shape
    |quamolit.app.comp.binary-tree $ {}
      :defs $ {}
        |comp-binary-tree $ quote
          defcomp comp-binary-tree (timestamp level)
            let
                r1 0.6
                r2 0.9
                r3 0.5
                r4 0.6
                x1 80
                y1 -220
                x1-2 10
                y1-2 -80
                x2 -140
                y2 -100
                shift-a $ *
                  + 0.02 $ * 0.001 r1
                  js/Math.sin $ / timestamp
                    + 8 $ * r2 11
                shift-b $ *
                  + 0.031 $ * 0.001 r3
                  js/Math.sin $ / timestamp
                    + 13 $ * 6 r4
              ; hud-log timestamp level
              group ({})
                path $ {}
                  :points $ [] ([] x1 y1) ([] 0 0) ([] x2 y2)
                  :stroke-style $ hsl 200 80 50
                if (> level 0)
                  translate (&{} :x x1 :y y1)
                    scale
                      &{} :ratio $ + 0.6 (* 1.3 shift-a)
                      rotate
                        &{} :angle $ + (* 30 shift-a) 10
                        comp-binary-tree timestamp $ dec level
                if (> level 0)
                  translate (&{} :x x2 :y y2)
                    scale
                      &{} :ratio $ + 0.73 (* 2 shift-b)
                      rotate
                        &{} :angle $ + (* 20 shift-b) 10
                        comp-binary-tree timestamp $ dec level
        |comp-tree-waving $ quote
          defcomp comp-tree-waving (states)
            let
                cursor $ :cursor states
                state $ or (:data states) 0
              []
                fn (elapsed d!)
                  d! cursor $ + state (* 10 elapsed)
                comp-binary-tree state 5
      :ns $ quote
        ns quamolit.app.comp.binary-tree $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp line group path
          quamolit.render.element :refer $ rotate scale translate
          quamolit.comp.debug :refer $ comp-debug
          quamolit.hud-logs :refer $ hud-log
    |quamolit.app.comp.clock $ {}
      :defs $ {}
        |comp-clock $ quote
          defcomp comp-clock (states)
            let
                now $ new js/Date
                hrs $ .getHours now
                mins $ .getMinutes now
                secs $ .getSeconds now
                get-ten $ fn (x)
                  js/Math.floor $ / x 10
                get-one $ fn (x) (.rem x 10)
              ; js/console.log secs
              ; hud-log hrs mins secs
              []
                fn $ elapsed d!
                group (&{})
                  comp-digit (>> states :h1) (get-ten hrs) (&{} :x -280)
                  comp-digit (>> states :h) (get-one hrs) (&{} :x -200)
                  comp-digit (>> states :m1) (get-ten mins) (&{} :x -80)
                  comp-digit (>> states :m) (get-one mins) (&{} :x 0)
                  comp-digit (>> states :s1) (get-ten secs) (&{} :x 120)
                  comp-digit (>> states :s) (get-one secs) (&{} :x 200)
                  ; comp-debug now $ &{} :y -60
      :ns $ quote
        ns quamolit.app.comp.clock $ :require
          quamolit.alias :refer $ defcomp group >>
          quamolit.render.element :refer $ translate
          quamolit.app.comp.digits :refer $ comp-digit
          quamolit.comp.debug :refer $ comp-debug
          quamolit.hud-logs :refer $ hud-log
    |quamolit.app.comp.code-table $ {}
      :defs $ {}
        |comp-code-table $ quote
          defcomp comp-code-table (states) (; js/console.log state)
            let
                cursor $ :cursor states
                state $ either (:data states) ([])
              translate (&{} :x -160 :y -160) & $ ->
                repeat (repeat "\"edit" 3) 3
                map-indexed $ fn (i row)
                  group ({}) & $ -> row
                    map-indexed $ fn (j content)
                      let
                          move-x $ * i 100
                          move-y $ * j 60
                        translate (&{} :x move-x :y move-y)
                          textbox
                            >> states $ str i "\":" j
                            &{} :w 80 :h 40 :text content
      :ns $ quote
        ns quamolit.app.comp.code-table $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp group rect >>
          quamolit.render.element :refer $ input translate textbox
          quamolit.util.keyboard :refer $ keycode->key
    |quamolit.app.comp.container $ {}
      :defs $ {}
        |comp-container $ quote
          defcomp comp-container (store)
            let
                states $ :states store
                state $ either (:data states)
                  {} $ :tab :portal
                cursor $ []
                tab $ :tab state
              group ({})
                comp-fade-in-out (>> states :fade-portal) ({})
                  if (= tab :portal) (comp-portal cursor)
                comp-fade-fn (>> states :fade-todolist) ({})
                  fn (renderer-states opacity stage)
                    if (= tab :todolist)
                      comp-todolist renderer-states (:tasks store) opacity stage
                comp-fade-in-out (>> states :fade-clock) ({})
                  if (= tab :clock)
                    translate (&{} :x 0 :y -100)
                      comp-clock $ >> states :clock
                comp-fade-in-out (>> states :fade-solar) ({})
                  if (= tab :solar)
                    translate (&{} :x 0 :y 0)
                      comp-solar (>> states :solar) 4
                comp-fade-in-out (>> states :fade-binary-tree) ({})
                  if (= tab :binary-tree)
                    translate (&{} :x 0 :y 240)
                      comp-tree-waving $ >> states :binary-tree
                comp-fade-in-out (>> states :fade-code-table) ({})
                  if (= tab :code-table)
                    translate (&{} :x 0 :y 40)
                      comp-code-table $ >> states :code-table
                comp-fade-in-out (>> states :fade-finder) ({})
                  if (= tab :finder)
                    translate (&{} :x 0 :y 40)
                      comp-finder $ >> states :finder
                comp-fade-in-out (>> states :fade-raining) ({})
                  if (= tab :raining)
                    translate (&{} :x 0 :y 40)
                      comp-raining $ >> states :raining
                comp-fade-in-out (>> states :fade-curve) ({})
                  if (= tab :curve)
                    translate (&{} :x 0 :y 40)
                      comp-ring $ >> states :ring
                comp-fade-in-out (>> states :fade-icons) ({})
                  if (= tab :icons)
                    translate (&{} :x 0 :y 40)
                      comp-icons-table $ >> states :icons
                comp-fade-in-out (>> states :fade-folding-fan) ({})
                  if (= tab :folding-fan)
                    translate
                      {} (:x 0) (:y 40)
                      comp-folding-fan $ >> states :folding-fan
                comp-fade-in-out (>> states :fade-drag-demo) ({})
                  if (= tab :drag-demo)
                    translate
                      {} (:x 0) (:y 40)
                      comp-drag-demo $ >> states :drag-demo
                comp-fade-in-out (>> states :fade-back) ({})
                  if (not= tab :portal)
                    translate (&{} :x -400 :y -140)
                      button $ assoc (style-button |Back) :event
                        {} $ :click
                          fn (e d!)
                            d! cursor $ assoc state :tab :portal
        |style-button $ quote
          defn style-button (guide-text)
            {} (:text guide-text)
              :surface-color $ hsl 200 80 50
              :text-color $ hsl 200 80 100
              :font-size 16
              :w 80
              :h 32
      :ns $ quote
        ns quamolit.app.comp.container $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp group >>
          quamolit.render.element :refer $ translate button
          quamolit.comp.fade-in-out :refer $ comp-fade-in-out comp-fade-fn
          quamolit.app.comp.todolist :refer $ comp-todolist
          quamolit.app.comp.digits :refer $ comp-digit
          quamolit.app.comp.portal :refer $ comp-portal
          quamolit.app.comp.clock :refer $ comp-clock
          quamolit.app.comp.solar :refer $ comp-solar
          quamolit.app.comp.binary-tree :refer $ comp-tree-waving
          quamolit.app.comp.code-table :refer $ comp-code-table
          quamolit.app.comp.finder :refer $ comp-finder
          quamolit.app.comp.raining :refer $ comp-raining
          quamolit.app.comp.icons-table :refer $ comp-icons-table
          quamolit.app.comp.ring :refer $ comp-ring
          quamolit.app.comp.folding-fan :refer $ comp-folding-fan
          quamolit.app.comp.drag-demo :refer $ comp-drag-demo
          quamolit.app.comp.debug :refer $ comp-debug
          quamolit.hud-logs :refer $ hud-log
    |quamolit.app.comp.digits $ {}
      :defs $ {}
        |comp-0 $ quote
          defcomp comp-0 (states props)
            translate props
              comp-fade-fn (>> states 0) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 1) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 1 1 0)
              comp-fade-fn (>> states 2) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 0 0 0)
              comp-fade-fn (>> states 3) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 0 0 1)
              comp-fade-fn (>> states 4) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 1 0 2)
              comp-fade-fn (>> states 5) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 2 1 2)
              comp-fade-fn (>> states 6) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 2 1 1)
        |comp-1 $ quote
          defcomp comp-1 (states props)
            translate props
              comp-fade-fn (>> states 0) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 1) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 1 1 0)
              comp-fade-fn (>> states 2) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 3) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 4) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 5) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 6) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 2 1 1)
        |comp-2 $ quote
          defcomp comp-2 (states props)
            translate props
              comp-fade-fn (>> states 0) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 1 1 1)
              comp-fade-fn (>> states 1) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 1 1 0)
              comp-fade-fn (>> states 2) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 0 0 0)
              comp-fade-fn (>> states 3) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 4) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 1 0 2)
              comp-fade-fn (>> states 5) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 2 1 2)
              comp-fade-fn (>> states 6) ({})
                fn (states opacity stage) nil
        |comp-3 $ quote
          defcomp comp-3 (states props)
            translate props
              comp-fade-fn (>> states 0) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 1 1 1)
              comp-fade-fn (>> states 1) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 1 1 0)
              comp-fade-fn (>> states 2) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 0 0 0)
              comp-fade-fn (>> states 3) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 4) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 5) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 2 1 2)
              comp-fade-fn (>> states 6) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 2 1 1)
        |comp-4 $ quote
          defcomp comp-4 (states props)
            translate props
              comp-fade-fn (>> states 0) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 1 1 1)
              comp-fade-fn (>> states 1) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 1 1 0)
              comp-fade-fn (>> states 2) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 3) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 0 0 1)
              comp-fade-fn (>> states 4) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 5) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 6) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 2 1 1)
        |comp-5 $ quote
          defcomp comp-5 (states props)
            translate props
              comp-fade-fn (>> states 0) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 1 1 1)
              comp-fade-fn (>> states 1) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 2) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 0 0 0)
              comp-fade-fn (>> states 3) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 0 0 1)
              comp-fade-fn (>> states 4) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 5) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 2 1 2)
              comp-fade-fn (>> states 6) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 2 1 1)
        |comp-6 $ quote
          defcomp comp-6 (states props)
            translate props
              comp-fade-fn (>> states 0) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 1 1 1)
              comp-fade-fn (>> states 1) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 2) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 0 0 0)
              comp-fade-fn (>> states 3) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 0 0 1)
              comp-fade-fn (>> states 4) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 1 0 2)
              comp-fade-fn (>> states 5) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 2 1 2)
              comp-fade-fn (>> states 6) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 2 1 1)
        |comp-7 $ quote
          defcomp comp-7 (states props)
            translate props
              comp-fade-fn (>> states 0) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 1) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 1 1 0)
              comp-fade-fn (>> states 2) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 0 0 0)
              comp-fade-fn (>> states 3) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 4) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 5) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 6) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 2 1 1)
        |comp-8 $ quote
          defcomp comp-8 (states props)
            translate props
              comp-fade-fn (>> states 0) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 1 1 1)
              comp-fade-fn (>> states 1) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 1 1 0)
              comp-fade-fn (>> states 2) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 0 0 0)
              comp-fade-fn (>> states 3) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 0 0 1)
              comp-fade-fn (>> states 4) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 1 0 2)
              comp-fade-fn (>> states 5) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 2 1 2)
              comp-fade-fn (>> states 6) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 2 1 1)
        |comp-9 $ quote
          defcomp comp-9 (states props)
            translate props
              comp-fade-fn (>> states 0) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 1 1 1)
              comp-fade-fn (>> states 1) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 1 1 0)
              comp-fade-fn (>> states 2) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 0 0 0)
              comp-fade-fn (>> states 3) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 0 0 1)
              comp-fade-fn (>> states 4) ({})
                fn (states opacity stage) nil
              comp-fade-fn (>> states 5) ({})
                fn (states opacity stage) (comp-stroke states opacity 0 2 1 2)
              comp-fade-fn (>> states 6) ({})
                fn (states opacity stage) (comp-stroke states opacity 1 2 1 1)
        |comp-digit $ quote
          defcomp comp-digit (states n props)
            case-default n (comp-0 states props)
              0 $ comp-0 states props
              1 $ comp-1 states props
              2 $ comp-2 states props
              3 $ comp-3 states props
              4 $ comp-4 states props
              5 $ comp-5 states props
              6 $ comp-6 states props
              7 $ comp-7 states props
              8 $ comp-8 states props
              9 $ comp-9 states props
        |comp-stroke $ quote
          defcomp comp-stroke (states opacity x0 y0 x1 y1)
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {} (:x0 0) (:y0 0) (:x1 0) (:y1 0)
                    :dx0 $ rand-shift 0 120
                    :dy0 $ rand-shift 0 160
                    :dx1 $ rand-shift 0 120
                    :dy1 $ rand-shift 0 160
                h 100
                w 60
                tranparency $ - 1 opacity
              []
                fn (elapsed d!)
                  when-not
                    and
                      = x0 $ &map:get state :x0
                      = y0 $ &map:get state :y0
                      = x1 $ &map:get state :x1
                      = y1 $ &map:get state :y1
                    let
                        v $ * elapsed 4
                      d! cursor $ -> state
                        update :x0 $ fn (n)
                          bound-x n x0 $ + n
                            * v $ - x0 n
                        update :y0 $ fn (n)
                          bound-x n y0 $ + n
                            * v $ - y0 n
                        update :x1 $ fn (n)
                          bound-x n x1 $ + n
                            * v $ - x1 n
                        update :y1 $ fn (n)
                          bound-x n y1 $ + n
                            * v $ - y1 n
                group ({})
                  alpha (&{} :opacity 1)
                    line $ {}
                      :x0 $ +
                        * w $ &map:get state :x0
                        * tranparency $ &map:get state :dx0
                      :y0 $ +
                        * h $ &map:get state :y0
                        * tranparency $ &map:get state :dy0
                      :x1 $ +
                        * w $ &map:get state :x1
                        * tranparency $ &map:get state :dx1
                      :y1 $ +
                        * h $ &map:get state :y1
                        * tranparency $ &map:get state :dy1
                      :line-width 3
                      :stroke-style $ if (> tranparency 0) (hsl 190 90 80) (hsl 240 90 70)
        |h-place? $ quote
          defn h-place? (x)
            cond
                < x 0
                , false
              (> x 1) false
              true true
        |rand-shift $ quote
          defn rand-shift (x y)
            &+ (&- x y)
              rand $ &* 2 y
        |v-place? $ quote
          defn v-place? (x)
            cond
                < x 0
                , false
              (> x 2) false
              true true
      :ns $ quote
        ns quamolit.app.comp.digits $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp rect group line >>
          quamolit.render.element :refer $ alpha translate
          quamolit.comp.fade-in-out :refer $ comp-fade-in-out comp-fade-fn
          quamolit.math :refer $ bound-01 bound-x
          "\"@calcit/std" :refer $ rand
    |quamolit.app.comp.drag-demo $ {}
      :defs $ {}
        |comp-drag-demo $ quote
          defcomp comp-drag-demo (states)
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {} (:x 0) (:y 0)
                    :local $ new-ref
                      {} (:x 0) (:y 0)
                    :v 10
              group ({})
                rect $ {} (:w 100) (:h 60)
                  :x $ :x state
                  :y $ :y state
                  :fill-style $ hsl 200 80 80
                  :event $ {}
                    :mousedown $ fn (e d!) (; js/console.log "\"down" e)
                      ref-set! (:local state)
                        {}
                          :x $ - (.-clientX e) (:x state)
                          :y $ - (.-clientY e) (:y state)
                    :mouseup $ fn (e d!) (; js/console.log "\"up" e)
                      ; d! cursor $ -> state (assoc :x0 0) (assoc :y0 0)
                    :mousemove $ fn (e d!) (; js/console.log "\"move" e)
                      let
                          local $ ref-get (:local state)
                          dx $ - (.-clientX e) (:x local)
                          dy $ - (.-clientY e) (:y local)
                        d! cursor $ -> state (assoc :x dx) (assoc :y dy)
                comp-slider (>> states :v)
                  {}
                    :value $ :v state
                    :unit 0.2
                    :on-change $ fn (v d!)
                      d! cursor $ assoc state :v v
                    :position $ [] 100 40
                    :min -4
                    :max 40
                    :title "\"long long title"
      :ns $ quote
        ns quamolit.app.comp.drag-demo $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp rect group line >>
          quamolit.render.element :refer $ alpha translate
          quamolit.comp.fade-in-out :refer $ comp-fade-in-out comp-fade-fn
          quamolit.math :refer $ bound-01 bound-x
          "\"@calcit/std" :refer $ rand
          quamolit.util.ref :refer $ new-ref ref-get ref-set!
          quamolit.comp.slider :refer $ comp-slider
    |quamolit.app.comp.file-card $ {}
      :defs $ {}
        |comp-file-card $ quote
          defcomp comp-file-card (states card-name position index parent-ratio popup? on-select)
            let
                cursor $ :cursor states
                state $ or (:data states)
                  {} $ :popup 0
              let
                  popup-ratio $ :popup state
                  shift-x $ first position
                  shift-y $ last position
                  move-x $ * shift-x
                    + 0.1 $ * 0.9 (- 1 popup-ratio)
                  move-y $ * shift-y
                    + 0.1 $ * 0.9 (- 1 popup-ratio)
                  scale-ratio $ /
                    + 0.2 $ * 0.8 popup-ratio
                    , parent-ratio
                  v 4
                []
                  fn (elapsed d!)
                    if popup?
                      if
                        < (:popup state) 1
                        d! cursor $ update state :popup
                          fn (x)
                            bound-01 $ + x (* v elapsed)
                      if
                        > (:popup state) 0
                        d! cursor $ update state :popup
                          fn (x)
                            bound-01 $ - x (* v elapsed)
                  translate
                    {} (:x 10) (:y 10)
                    alpha (&{} :opacity 1)
                      translate (&{} :x move-x :y move-y)
                        scale (&{} :ratio scale-ratio)
                          rect
                            &{} :w 520 :h 360 :fill-style (hsl 200 80 80) :event $ &{} :click
                              fn (e d!) (on-select d!)
                            text $ &{} :fill-style (hsl 0 0 100) :text card-name :size 60
      :ns $ quote
        ns quamolit.app.comp.file-card $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp group rect text
          quamolit.render.element :refer $ translate alpha scale
          quamolit.math :refer $ bound-01
    |quamolit.app.comp.finder $ {}
      :defs $ {}
        |card-collection $ quote
          def card-collection $ [] ([] "|喷雪花" "|檵木" "|石楠" "|文竹") ([] "|紫云英" "|绣球花" "|蔷薇") ([] "|金银花" "|栗树" "|婆婆纳" "|鸡爪槭") ([] "|卷柏" "|稻" "|马尾松" "|五角星花" "|苔藓") ([] "|芍药" "|木棉")
        |comp-finder $ quote
          defcomp comp-finder (states)
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {} $ :selected nil
                selected $ :selected state
              rect
                &{} :w 1000 :h 600 :fill-style (hsl 100 40 90) :event $ {}
                  :click $ fn (e d!) (d! cursor nil)
                group ({}) & $ -> card-collection
                  map-indexed $ fn (index folder) (; js/console.log folder)
                    let
                        ix $ .rem index 4
                        iy $ js/Math.floor (/ index 4)
                        position $ []
                          - (* ix 200) 200
                          - (* iy 200) 100
                      comp-fade-in-out
                        >> states $ str "\"fade-" index
                        {}
                        if
                          or (nil? selected) (= selected index)
                          comp-folder (>> states index) folder position (= index selected)
                            fn (d!)
                              d! cursor $ assoc state :selected index
      :ns $ quote
        ns quamolit.app.comp.finder $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp rect group >>
          quamolit.app.comp.folder :refer $ comp-folder
          quamolit.comp.fade-in-out :refer $ comp-fade-in-out comp-fade-fn
    |quamolit.app.comp.folder $ {}
      :defs $ {}
        |comp-folder $ quote
          defcomp comp-folder (states cards position popup? select-this) (; js/console.log state)
            let
                cursor $ :cursor states
                state $ or (:data states)
                  {} (:popup 0) (:selected nil)
              let
                  selected $ :selected state
                  shift-x $ first position
                  shift-y $ last position
                  popup-ratio $ :popup state
                  place-x $ * shift-x (- 1 popup-ratio)
                  place-y $ * shift-y (- 1 popup-ratio)
                  ratio $ + 0.2 (* 0.8 popup-ratio)
                  bg-light $ + 60 (* 22 popup-ratio)
                  v 4
                []
                  fn (elapsed d!)
                    if popup?
                      if
                        < (:popup state) 1
                        d! cursor $ update state :popup
                          fn (x)
                            bound-01 $ + x (* v elapsed)
                      if
                        > (:popup state) 0
                        d! cursor $ update state :popup
                          fn (x)
                            bound-01 $ - x (* v elapsed)
                  translate (&{} :x place-x :y place-y)
                    scale (&{} :ratio ratio)
                      alpha
                        &{} :opacity $ * 0.6 1
                        rect $ &{} :w 600 :h 400 :fill-style (hsl 0 80 bg-light) :event
                          &{} :click $ fn (e d!) (select-this d!)
                            d! cursor $ assoc state :selected nil
                      group (&{}) & $ -> cards
                        map-indexed $ fn (index card-name)
                          let
                              jx $ .rem index 4
                              jy $ js/Math.floor (/ index 4)
                              card-x $ * (- jx 1.5)
                                * 200 $ + 0.1 (* 0.9 popup-ratio)
                              card-y $ * (- jy 1.5)
                                * 100 $ + 0.1 (* 0.9 popup-ratio)
                            comp-fade-in-out
                              >> states $ str "\"fade-" index
                              {}
                              if
                                or (nil? selected) (= index selected)
                                comp-file-card (>> states index) card-name ([] card-x card-y) index ratio
                                  and popup? $ = (:selected state) index
                                  fn (d!)
                                    d! cursor $ assoc state :selected index
                      if (not popup?)
                        rect $ &{} :w 600 :h 400 :fill-style (hsl 0 80 0 0) :event
                          &{} :click $ fn (e d!) (select-this d!)
      :ns $ quote
        ns quamolit.app.comp.folder $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp rect text group >>
          quamolit.render.element :refer $ translate scale alpha
          quamolit.app.comp.file-card :refer $ comp-file-card
          quamolit.comp.fade-in-out :refer $ comp-fade-in-out
          quamolit.math :refer $ bound-01
    |quamolit.app.comp.folding-fan $ {}
      :defs $ {}
        |comp-folding-fan $ quote
          defcomp comp-folding-fan (states)
            let
                cursor $ :cursor states
                state $ or (:data states)
                  {} (:folding-value 0) (:folded? false)
              let
                  n 24
                  image-w 650
                  image-h 432
                  image-unit $ / image-w n
                  dest-w 650
                  dest-h 432
                  dest-unit $ / dest-w n
                  v 4
                  fv $ wo-log (:folding-value state)
                []
                  fn (elapsed d!)
                    if (:folded? state)
                      if (< fv 1)
                        d! cursor $ update state :folding-value
                          fn (x)
                            bound-opacity $ + x (* v elapsed)
                      if (> fv 0)
                        d! cursor $ update state :folding-value
                          fn (x)
                            bound-opacity $ - x (* v elapsed)
                  group ({})
                    translate (&{} :x 0 :y 160) & $ -> (range n)
                      map $ fn (i)
                        rotate
                          &{} :angle $ * 6 (:folding-value state)
                            + 0.5 $ - i (/ n 2)
                          image $ {} (:src |assets/lotus.jpg)
                            :sx $ * i image-unit
                            :sy 0
                            :sw image-unit
                            :sh image-h
                            :dx $ - 0 (/ image-unit 2)
                            :dy $ - 10 dest-h
                            :dw dest-unit
                            :dh dest-h
                    button $ {} (:text |Toggle) (:x 160) (:y 200)
                      :surface-color $ hsl 30 80 60
                      :text-color $ hsl 0 0 100
                      :event $ {}
                        :click $ fn (e d!)
                          d! cursor $ update state :folded? not
      :ns $ quote
        ns quamolit.app.comp.folding-fan $ :require
          quamolit.alias :refer $ text defcomp group image
          quamolit.render.element :refer $ button translate rotate
          quamolit.util.string :refer $ hsl
          quamolit.math :refer $ bound-opacity
    |quamolit.app.comp.icon-increase $ {}
      :defs $ {}
        |comp-icon-increase $ quote
          defcomp comp-icon-increase (states)
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {} (:n-value 0) (:n 0)
                n-value $ :n-value state
                n $ :n state
                v 4
                frac $ - n n-value
              []
                fn (elapsed d!)
                  if (< n-value n)
                    d! cursor $ update state :n-value
                      fn (x)
                        bound-x 0 n $ + x (* elapsed v)
                rect
                  {} (:w 60) (:h 60)
                    :fill-style $ hsl 300 80 95
                    :event $ {}
                      :click $ fn (e d!)
                        d! cursor $ update state :n inc
                  translate
                    {} $ :x -14
                    rotate
                      {} $ :angle (* 90 n-value)
                      line $ {}
                        :stroke-style $ hsl 200 60 60
                        :x0 -7
                        :y0 0
                        :x1 7
                        :y1 0
                        :line-width 2
                      line $ {}
                        :stroke-style $ hsl 200 60 60
                        :x0 0
                        :y0 -7
                        :x1 0
                        :y1 7
                        :line-width 2
                  translate
                    {} $ :x 10
                    translate
                      {} $ :y
                        -
                          * 20 $ - 1 frac
                          , 20
                      alpha
                        {} $ :opacity (- 1 frac)
                        text $ {}
                          :text $ str (+ n 1)
                          :fill-style $ hsl 200 60 60
                          :font-family "|Helvetica Neue"
                    translate
                      {} $ :y
                        -
                          * 20 $ - 1 frac
                          , 0
                      alpha
                        {} $ :opacity frac
                        text $ {}
                          :text $ str n
                          :fill-style $ hsl 200 60 60
                          :font-family "|Helvetica Neue"
      :ns $ quote
        ns quamolit.app.comp.icon-increase $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp line text group rect
          quamolit.render.element :refer $ translate rotate alpha
          quamolit.types :refer $ Component
          quamolit.math :refer $ bound-x
    |quamolit.app.comp.icon-play $ {}
      :defs $ {}
        |comp-icon-play $ quote
          defcomp comp-icon-play (states)
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {} (:playing? false) (:play-value 0)
                play? $ :playing? state
                pv $ :play-value state
                tw $ fn (a0 a1)
                  + a0 $ * (- a1 a0) pv
                v 6
              []
                fn (elapsed d!)
                  if play?
                    if (< pv 1)
                      d! cursor $ update state :play-value
                        fn (pv)
                          bound-opacity $ + pv (* elapsed v)
                    if (> pv 0)
                      d! cursor $ update state :play-value
                        fn (pv)
                          bound-opacity $ - pv (* elapsed v)
                rect
                  {} (:w 60) (:h 60)
                    :fill-style $ hsl 40 80 90
                    :event $ &{} :click
                      fn (e d!)
                        d! cursor $ update state :playing? not
                  path $ {}
                    :points $ [] ([] -20 -20) ([] -20 20)
                      [] (tw -5 0) (tw 20 10)
                      [] (tw -5 0) (tw -20 -10)
                    :fill-style $ hsl 120 50 60
                  path $ {}
                    :points $ []
                      [] (tw 5 0) (tw -20 -10)
                      [] 20 $ tw -20 0
                      [] 20 $ tw 20 0
                      [] (tw 5 0) (tw 20 10)
                    :fill-style $ hsl 120 50 60
                  ; comp-debug state $ {}
      :ns $ quote
        ns quamolit.app.comp.icon-play $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp path group rect
          quamolit.comp.debug :refer $ comp-debug
          quamolit.math :refer $ bound-opacity
    |quamolit.app.comp.icons-table $ {}
      :defs $ {}
        |comp-icons-table $ quote
          defcomp comp-icons-table (states)
            group ({})
              translate (&{} :x -200)
                comp-icon-increase $ >> states :increase
              translate (&{} :x 0)
                comp-icon-play $ >> states :play
      :ns $ quote
        ns quamolit.app.comp.icons-table $ :require
          quamolit.alias :refer $ defcomp text line group >>
          quamolit.render.element :refer $ translate
          quamolit.app.comp.icon-increase :refer $ comp-icon-increase
          quamolit.app.comp.icon-play :refer $ comp-icon-play
    |quamolit.app.comp.portal $ {}
      :defs $ {}
        |comp-portal $ quote
          defcomp comp-portal (cursor)
            group ({})
              button $ style-button 0 0 |Todolist (hsl 0 120 60) (handle-navigate cursor :todolist)
              button $ style-button 1 0 |Clock (hsl 300 80 80) (handle-navigate cursor :clock)
              button $ style-button 2 0 |Solar (hsl 140 80 80) (handle-navigate cursor :solar)
              button $ style-button 3 0 "|Binary Tree" (hsl 140 20 30) (handle-navigate cursor :binary-tree)
              button $ style-button 0 1 |Table (hsl 340 80 80) (handle-navigate cursor :code-table)
              button $ style-button 1 1 |Finder (hsl 60 80 45) (handle-navigate cursor :finder)
              button $ style-button 2 1 |Raining (hsl 260 80 80) (handle-navigate cursor :raining)
              button $ style-button 3 1 |Icons (hsl 30 80 80) (handle-navigate cursor :icons)
              button $ style-button 0 2 |Curve (hsl 100 80 80) (handle-navigate cursor :curve)
              button $ style-button 1 2 "|Folding fan" (hsl 200 80 80) (handle-navigate cursor :folding-fan)
              button $ style-button 2 2 "|Drag demo" (hsl 340 80 70) (handle-navigate cursor :drag-demo)
        |handle-navigate $ quote
          defn handle-navigate (cursor next-page)
            fn (e d!)
              d! cursor $ {} (:tab next-page)
        |style-button $ quote
          defn style-button (x y page-name bg-color handler)
            {} (:w 180) (:h 60)
              :x $ - (* x 240) 400
              :y $ - (* y 100) 200
              :surface-color bg-color
              :text page-name
              :text-color $ hsl 0 0 100
              :event $ {} (:click handler)
      :ns $ quote
        ns quamolit.app.comp.portal $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp group rect text
          quamolit.render.element :refer $ alpha translate button
    |quamolit.app.comp.raindrop $ {}
      :defs $ {}
        |comp-raindrop $ quote
          defcomp comp-raindrop (states key position on-earth)
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {}
                    :birth-tick $ get-tick
                    :opacity 0
                    :dy 0
                earth 200
              []
                fn (elapsed d!)
                  d! cursor $ update state :dy
                    fn (dy)
                      + dy $ * elapsed 100
                  if
                    >
                      + (:y position) (:dy state)
                      , earth
                    on-earth key d!
                let
                    dy $ :dy state
                    y $ + (:y position) dy
                    dropped? $ >= y (- earth 40)
                  alpha
                    {} $ :opacity
                      cond
                        dropped? $ rand 0.5
                        (>= y (- earth 80))
                          / (- earth y) 80
                        (< dy 100) (/ dy 100)
                        true 1
                    rect $ {}
                      :fill-style $ hsl 200 80 80
                      :w $ if dropped? (rand 200) 3
                      :h $ if dropped? (rand 6) 30
                      :x $ :x position
                      :y y
      :ns $ quote
        ns quamolit.app.comp.raindrop $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp rect
          quamolit.render.element :refer $ translate alpha
          quamolit.util.time :refer $ get-tick
          "\"@calcit/std" :refer $ rand
    |quamolit.app.comp.raining $ {}
      :defs $ {}
        |comp-raining $ quote
          defcomp comp-raining (states)
            let
                cursor $ :cursor states
                state $ either (:data states) (random-rains 40)
                on-earth $ fn (key d!)
                  d! cursor $ -> state
                    .filter $ fn (pair)
                      not= (first pair) key
              ; js/console.log $ pr-str state
              []
                fn (elapsed d!)
                  if
                    nil? $ :data states
                    d! cursor state
                    if
                      > (rand 10) 7
                      let
                          new-state $ concat state (random-rains 3)
                        d! cursor new-state
                        d! :gc-states $ [] cursor (.map new-state first)
                list-> ({})
                  -> state $ map
                    fn (entry)
                      let
                          child-key $ first entry
                          position $ last entry
                        [] child-key $ comp-raindrop (>> states child-key) child-key position on-earth
        |random-rains $ quote
          defn random-rains (n)
            -> (range n)
              .map $ fn (x)
                [] (rand 1000)
                  {}
                    :x $ - (rand 1000) 500
                    :y $ - (rand 200) 400
      :ns $ quote
        ns quamolit.app.comp.raining $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp rect group >> list->
          quamolit.app.comp.raindrop :refer $ comp-raindrop
          quamolit.hud-logs :refer $ hud-log
          "\"@calcit/std" :refer $ rand
    |quamolit.app.comp.ring $ {}
      :defs $ {}
        |comp-ring $ quote
          defcomp comp-ring (states)
            let
                cursor $ :cursor states
                state $ or (:data states) 0
                n 32
                unit $ * 2 (/ &PI n)
                shift 10
                rotation $ .rem state 360
                r 60
                rl 360
                curve-points $ -> (range n)
                  map $ fn (x)
                    let
                        this-angle $ * unit (inc x)
                        angle-1 $ + (- this-angle rotation unit) shift
                        angle-2 $ - (+ this-angle rotation) shift
                      []
                        * rl $ sin angle-1
                        negate $ * rl (cos angle-1)
                        * rl $ sin angle-2
                        negate $ * rl (cos angle-2)
                        * r $ sin this-angle
                        negate $ * r (cos this-angle)
              ; hud-log state
              []
                fn (elapsed d!)
                  d! cursor $ + state (* elapsed 0.3)
                group ({})
                  path $ {}
                    :points $ concat
                      [] $ [] 0 (- 0 r)
                      , curve-points
                    :line-width 1
                    :stroke-style $ hsl 300 80 60
                  comp-debug (js/Math.floor rotation) ({})
        |cos $ quote
          defn cos (x)
            js/Math.cos $ * js/Math.PI (/ x 180)
        |sin $ quote
          defn sin (x)
            js/Math.sin $ * js/Math.PI (/ x 180)
      :ns $ quote
        ns quamolit.app.comp.ring $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp group path
          quamolit.comp.debug :refer $ comp-debug
          quamolit.hud-logs :refer $ hud-log
    |quamolit.app.comp.solar $ {}
      :defs $ {}
        |comp-solar $ quote
          defcomp comp-solar (states level)
            ; js/console.log :tick $ / tick 10
            let
                cursor $ :cursor states
                state $ or (:data states) 0
              []
                fn (elapsed d!)
                  d! cursor $ + state (* elapsed 100)
                rotate
                  &{} :angle $ .rem state 360
                  arc style-large
                  translate (&{} :x 100 :y -40) (arc style-small)
                  if (> level 0)
                    scale (&{} :ratio 0.6)
                      translate (&{} :x 260 :y 40)
                        comp-solar (>> states :next) (- level 1)
        |style-large $ quote
          def style-large $ {}
            :fill-style $ hsl 80 80 80
            :stroke-style $ hsl 200 50 60 0.5
            :line-width 1
            :r 60
        |style-small $ quote
          def style-small $ {}
            :fill-style $ hsl 200 80 80
            :r 30
      :ns $ quote
        ns quamolit.app.comp.solar $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp group rect arc >>
          quamolit.render.element :refer $ rotate translate scale
    |quamolit.app.comp.task $ {}
      :defs $ {}
        |comp-task $ quote
          defcomp comp-task (states task idx shift-x presence stage add-orphin rm-orphin)
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {} (:left 0) (:idx 0)
                v 5
              []
                fn (elapsed d!)
                  let
                      old-idx $ :idx state
                      new-idx $ cond
                          > idx old-idx
                          bound-x 0 idx $ + old-idx (* elapsed v)
                        (< idx old-idx)
                          bound-x idx 100 $ - old-idx (* elapsed v)
                        true old-idx
                      new-left $ case-default stage 0 (:show 0) (:hidden -40)
                        :showing $ bound-x -40 0
                          - (* 40 presence) 40
                        :hiding $ bound-x -40 0
                          - (* 40 presence) 40
                    if
                      or (not= old-idx new-idx)
                        not= new-left $ :left state
                      d! cursor $ -> state (assoc :left new-left) (assoc :idx new-idx)
                    if
                      and (= stage :hiding) (= new-left -40)
                      do (; println "\"removed")
                        rm-orphin (:id task) d!
                translate
                  &{} :x
                    + shift-x $ :left state
                    , :y $ -
                      * 60 $ :idx state
                      , 140
                  alpha (&{} :opacity 1)
                    translate (&{} :x -200)
                      comp-toggler (>> states :toggler) (:done? task) (:id task)
                    input $ assoc
                      style-input $ :text task
                      , :event
                        &{} :click $ handle-input (:id task) (:text task)
                    translate (&{} :x 280)
                      rect $ assoc style-remove :event
                        {} $ :click
                          fn (e d!)
                            add-orphin (:id task) d!
                            d! :rm $ :id task
                    ; comp-debug task $ {} (:y 20)
        |handle-input $ quote
          defn handle-input (task-id task-text)
            fn (e dispatch)
              prompt-at!
                [] (.-pageX e) (.-pageY e)
                {} $ :initial task-text
                fn (new-text)
                  dispatch :update $ [] task-id new-text
        |style-block $ quote
          def style-block $ {} (:w 300) (:h 40)
            :fill-style $ hsl 40 80 80
        |style-input $ quote
          defn style-input (text)
            {} (:w 400) (:h 40) (:x 40) (:y 0)
              :fill-style $ hsl 0 0 60
              :text text
        |style-remove $ quote
          def style-remove $ {} (:w 40) (:h 40)
            :fill-style $ hsl 0 80 40
      :ns $ quote
        ns quamolit.app.comp.task $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp group rect >>
          quamolit.render.element :refer $ translate alpha input
          quamolit.app.comp.task-toggler :refer $ comp-toggler
          quamolit.comp.debug :refer $ comp-debug
          quamolit.math :refer $ bound-x bound-opacity
          pointed-prompt.core :refer $ prompt-at!
    |quamolit.app.comp.task-toggler $ {}
      :defs $ {}
        |comp-toggler $ quote
          defcomp comp-toggler (states done? task-id)
            let
                cursor $ :cursor states
                state $ or (:data states) 0
                v 4
              ; js/console.log |done: done? state
              []
                fn (elapsed d!)
                  if done?
                    if (< state 1)
                      d! cursor $ bound-opacity
                        + state $ * v elapsed
                    if (> state 0)
                      d! cursor $ bound-opacity
                        - state $ * v elapsed
                rect $ {} (:w 40) (:h 40)
                  :fill-style $ hsl
                    + 240 $ * 120 state
                    , 80 60
                  :event $ {}
                    :click $ fn (e d!) (d! :toggle task-id)
      :ns $ quote
        ns quamolit.app.comp.task-toggler $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp group rect
          quamolit.math :refer $ bound-x bound-opacity
    |quamolit.app.comp.todolist $ {}
      :defs $ {}
        |comp-todolist $ quote
          defcomp comp-todolist (states tasks presence stage) (; js/console.info |todolist: states)
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {} (:draft "\"")
                    :orphins $ []
                add-orphin $ fn (task-id d!)
                  d! cursor $ update state :orphins
                    fn (xs) (conj xs task-id)
                rm-orphin $ fn (task-id d!)
                  d! cursor $ update state :orphins
                    fn (xs)
                      -> xs $ filter
                        fn (x) (not= x task-id)
              [] nil $ alpha (&{} :opacity 0.8)
                translate position-header
                  translate (&{} :x -20 :y 40)
                    input $ &{} :w 400 :h 40 :text (:draft state) :event
                      &{} :click $ fn (e d!)
                        prompt-at!
                          [] (.-pageX e) (.-pageY e)
                          {} $ :initial (:draft state)
                          fn (user-text)
                            d! cursor $ assoc state :draft user-text
                  translate (&{} :x 240 :y 40)
                    button $ assoc style-button :event
                      {} $ :click
                        fn (e d!)
                          d! :add $ :draft state
                          d! cursor $ -> state (assoc :draft |)
                translate position-body
                  group ({}) & $ -> tasks (.reverse)
                    map-indexed $ fn (idx task)
                      let
                          shift-x $ case-default stage 0 (:hidden -40) (:show 0)
                            :showing $ bound-x -40 0
                              -> presence (* 3) (- 1)
                                - $ * idx
                                  / 2 $ count tasks
                                * 40
                            :hiding $ bound-x -40 0
                              -> presence (* 3) (- 1)
                                - $ *
                                  - (count tasks) idx 1
                                  / 2 $ count tasks
                                * 40
                        comp-fade-fn
                          >> states $ :id task
                          {}
                          fn (renderer-states opacity stage) (comp-task renderer-states task idx shift-x opacity stage add-orphin rm-orphin)
                  group ({}) & $ -> (:orphins state)
                    map $ fn (task-id)
                      comp-fade-fn (>> states task-id) ({})
                        fn (opacity stage renderer-states) nil
                ; comp-debug state $ {}
        |handle-click $ quote
          defn handle-click (simple-event dispatch set-state) (.log js/console simple-event)
        |position-body $ quote
          def position-body $ {} (:x 0) (:y 0)
        |position-header $ quote
          def position-header $ {} (:x 0) (:y -240)
        |style-button $ quote
          def style-button $ {} (:w 80) (:h 40) (:text |add)
      :ns $ quote
        ns quamolit.app.comp.todolist $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp group rect text >>
          quamolit.render.element :refer $ translate button input alpha
          quamolit.app.comp.task :refer $ comp-task
          quamolit.app.comp.debug :refer $ comp-debug
          quamolit.math :refer $ bound-x
          quamolit.comp.fade-in-out :refer $ comp-fade-fn
          pointed-prompt.core :refer $ prompt-at!
    |quamolit.app.main $ {}
      :defs $ {}
        |*raq-loop $ quote (defatom *raq-loop nil)
        |*render-loop $ quote (defatom *render-loop nil)
        |*store $ quote
          defatom *store $ {}
            :states $ {}
            :tasks $ []
        |dispatch! $ quote
          defn dispatch! (op op-data)
            if (list? op)
              recur :states $ [] op op-data
              do (; println "\"dispatch" op op-data) (; js/console.log @*store)
                let
                    new-tick $ get-tick
                    new-store $ updater @*store op op-data new-tick
                  reset! *store new-store
        |main! $ quote
          defn main! () (load-console-formatter!)
            let
                target $ js/document.querySelector |#app
              configure-canvas target
              setup-events target dispatch!
              render-loop!
              render-control!
              start-control-loop! 8 on-control-event
        |mount-target $ quote
          def mount-target $ js/document.querySelector |#app
        |reload! $ quote
          defn reload! () $ if (nil? build-errors)
            do (js/clearTimeout @*render-loop) (js/cancelAnimationFrame @*raq-loop) (render-loop!) (replace-control-loop! 8 on-control-event) (js/console.log "|code updated.") (hud! "\"ok~" "\"Ok")
            hud! "\"error" build-errors
        |render-loop! $ quote
          defn render-loop! (? t) (; js/console.log "\"store" @*store)
            render-page (comp-container @*store) mount-target dispatch!
            if config/dev?
              reset! *render-loop $ flipped js/setTimeout 9
                fn () reset! *raq-loop $ js/requestAnimationFrame render-loop!
              reset! *raq-loop $ js/requestAnimationFrame render-loop!
            ; reset! *raq-loop $ js/requestAnimationFrame render-loop!
      :ns $ quote
        ns quamolit.app.main $ :require
          quamolit.app.comp.container :refer $ comp-container
          quamolit.core :refer $ render-page configure-canvas setup-events on-control-event
          quamolit.util.time :refer $ get-tick
          quamolit.app.updater :refer $ updater
          "\"./calcit.build-errors" :default build-errors
          "\"bottom-tip" :default hud!
          quamolit.config :as config
          touch-control.core :refer $ render-control! start-control-loop! replace-control-loop!
    |quamolit.app.schema $ {}
      :defs $ {}
        |task $ quote
          def task $ {} (:text |) (:id nil) (:done? false)
      :ns $ quote (ns quamolit.app.schema)
    |quamolit.app.updater $ {}
      :defs $ {}
        |task-add $ quote
          defn task-add (store op-data tick)
            update store :tasks $ fn (tasks)
              conj tasks $ merge schema/task
                {} (:id tick) (:text op-data)
        |task-rm $ quote
          defn task-rm (store op-data tick)
            update store :tasks $ fn (tasks)
              -> tasks $ filter
                fn (task)
                  not= op-data $ :id task
        |task-toggle $ quote
          defn task-toggle (store op-data tick)
            update store :tasks $ fn (tasks)
              -> tasks $ map
                fn (task)
                  if
                    = op-data $ :id task
                    update task :done? not
                    , task
        |task-update $ quote
          defn task-update (store op-data tick)
            update store :tasks $ fn (tasks)
              let[] (task-id text) op-data $ -> tasks
                map $ fn (task)
                  if
                    = task-id $ :id task
                    assoc task :text text
                    , task
        |updater $ quote
          defn updater (store op op-data tick) (; js/console.log "|store update:" op op-data tick)
            case-default op
              do (js/console.log "\"unknown op" op) store
              :states $ update-states store op-data
              :gc-states $ gc-states store op-data
              :add $ task-add store op-data tick
              :rm $ task-rm store op-data tick
              :update $ task-update store op-data tick
              :toggle $ task-toggle store op-data tick
      :ns $ quote
        ns quamolit.app.updater $ :require (quamolit.app.schema :as schema)
          quamolit.cursor :refer $ update-states gc-states
    |quamolit.comp.debug $ {}
      :defs $ {}
        |comp-debug $ quote
          defcomp comp-debug (data more-style)
            let
                style $ -> default-style (merge more-style)
                  assoc :text $ if (instance? js/Date data) (js/JSON.stringify data) (pr-str data)
              text style
        |default-style $ quote
          def default-style $ {} (:x 0) (:y 0)
            :fill-style $ hsl 0 0 0 0.5
            :font-family |Menlo
            :size 12
            :max-width 600
      :ns $ quote
        ns quamolit.comp.debug $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp rect text
          quamolit.render.element :refer $ alpha translate button
    |quamolit.comp.fade-in-out $ {}
      :defs $ {}
        |*nodes-cache $ quote
          defatom *nodes-cache $ {}
        |comp-fade-fn $ quote
          defcomp comp-fade-fn (states props f1)
            let
                cursor $ :cursor states
                v 4
                state $ either (:data states)
                  {} (:stage :hidden) (:opacity 0)
                p1 $ f1 (>> states :renderer) (:opacity state)
                  wo-log $ :stage state
              []
                fn (elapsed d!)
                  case-default (:stage state)
                    println "\"unknown stage" $ :stage state
                    :hidden $ when (some? p1)
                      d! cursor $ merge state
                        {} (:stage :showing)
                          :opacity $ + (* elapsed v) 0
                      write-node-cache! cursor f1
                    :showing $ do
                      if
                        >= (:opacity state) 1
                        d! cursor $ {} (:stage :show) (:opacity 1)
                        d! cursor $ -> state
                          update :opacity $ fn (x)
                            + x $ * elapsed v
                      write-node-cache! cursor f1
                    :show $ if (nil? p1)
                      d! cursor $ {} (:stage :hiding)
                        :opacity $ - 1 (* elapsed v)
                      write-node-cache! cursor f1
                    :hiding $ if
                      <= (:opacity state) 0
                      do
                        d! cursor $ {} (:stage :hidden) (:opacity 0.01)
                        delete-node-cache! cursor
                      d! cursor $ update state :opacity
                        fn (x)
                          - x $ * elapsed v
                alpha
                  {} $ :opacity (:opacity state)
                  case-default (:stage state)
                    either p1 $ &let
                      old-f $ get-node! cursor
                      if (some? old-f)
                        old-f (>> states :renderer) (:opacity state) (:stage state)
                    :hidden nil
        |comp-fade-in-out $ quote
          defcomp comp-fade-in-out (states props p1)
            let
                cursor $ :cursor states
                v 4
                state $ either (:data states)
                  {} (:stage :hidden) (:opacity 0)
              []
                fn (elapsed d!)
                  case-default (:stage state)
                    println "\"unknown stage" $ :stage state
                    :hidden $ when (some? p1)
                      d! cursor $ merge state
                        {} (:stage :showing)
                          :opacity $ + (* elapsed v) 0
                      write-node-cache! cursor p1
                    :showing $ if
                      >= (:opacity state) 1
                      do
                        d! cursor $ {} (:stage :show) (:opacity 1)
                        write-node-cache! cursor p1
                      d! cursor $ update state :opacity
                        fn (x)
                          + x $ * elapsed v
                    :show $ if (nil? p1)
                      d! cursor $ {} (:stage :hiding)
                        :opacity $ - 1 (* elapsed v)
                      write-node-cache! cursor p1
                    :hiding $ if
                      <= (:opacity state) 0
                      do
                        d! cursor $ {} (:stage :hidden) (:opacity 0.01)
                        delete-node-cache! cursor
                      d! cursor $ update state :opacity
                        fn (x)
                          - x $ * elapsed v
                alpha
                  {} $ :opacity (:opacity state)
                  case-default (:stage state)
                    either p1 $ get-node! cursor
                    :hidden nil
        |delete-node-cache! $ quote
          defn delete-node-cache! (path)
            swap! *nodes-cache $ fn (nodes) (dissoc nodes path)
        |get-node! $ quote
          defn get-node! (path) (get @*nodes-cache path)
        |write-node-cache! $ quote
          defn write-node-cache! (path node)
            swap! *nodes-cache $ fn (nodes) (assoc nodes path node)
      :ns $ quote
        ns quamolit.comp.fade-in-out $ :require
          quamolit.alias :refer $ defcomp >>
          quamolit.render.element :refer $ alpha
    |quamolit.comp.slider $ {}
      :defs $ {}
        |comp-slider $ quote
          defcomp comp-slider (states options)
            let
                cursor $ :cursor states
                unit $ :unit options
                position $ or (:position options) ([] 0 0)
                state $ :data states
                v-max $ either (:max options) 1000
                v-min $ either (:min options) 1000
              []
                fn (elapsed d!)
                  if
                    nil? $ :data states
                    d! cursor $ {}
                      :local $ new-ref
                        {}
                          :v0 $ :value options
                          :x0 0
                translate
                  {}
                    :x $ nth position 0
                    :y $ nth position 1
                  rect $ {} (:w 72) (:h 20)
                    :fill-style $ hsl 200 70 80
                    :event $ {}
                      :mousedown $ fn (e d!)
                        ref-set! (:local state)
                          {}
                            :v0 $ :value options
                            :x0 $ .-clientX e
                      :mousemove $ fn (e d!)
                        let
                            local $ ref-get (:local state)
                            dx $ - (.-clientX e) (:x0 local)
                            on-change $ :on-change options
                          if (fn? on-change)
                            let
                                next-v $ bound-x v-min v-max
                                  + (:v0 local) (* dx unit)
                              if
                                not= next-v $ :v options
                                on-change next-v d!
                  text $ {} (:x -36) (:y -20) (:text-align :left) (:size 14)
                    :fill-style $ hsl 330 90 70
                    :text $ str
                      or (:title options) "\"Val"
                      , "\": "
                        .!toFixed
                          either (:value options) 0
                          , 2
      :ns $ quote
        ns quamolit.comp.slider $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp rect group line >> text
          quamolit.render.element :refer $ alpha translate
          quamolit.comp.fade-in-out :refer $ comp-fade-in-out comp-fade-fn
          quamolit.math :refer $ bound-01 bound-x
          "\"@calcit/std" :refer $ rand
          quamolit.util.ref :refer $ new-ref ref-get ref-set!
          quamolit.math :refer $ bound-x
    |quamolit.config $ {}
      :defs $ {}
        |dev? $ quote
          def dev? $ = "\"dev" (get-env "\"mode" "\"release")
      :ns $ quote (ns quamolit.config)
    |quamolit.controller.resolve $ {}
      :defs $ {}
        |locate-target $ quote
          defn locate-target (tree coord) (; js/console.log |locating coord tree)
            if (.empty? coord) tree $ let
                first-pos $ first coord
              if (.matches? Component tree)
                if
                  = first-pos $ :name tree
                  recur (:tree tree) (slice coord 1)
                  , nil
                let
                    picked-pair $ -> (:children tree)
                      find $ fn (child-pair)
                        = (first child-pair) first-pos
                    picked $ if (some? picked-pair) (last picked-pair) nil
                  if (some? picked)
                    recur picked $ slice coord 1
                    , nil
        |resolve-target $ quote
          defn resolve-target (tree event-name coord)
            let
                maybe-target $ locate-target tree coord
              ; .log js/console |target maybe-target event-name coord
              if (nil? maybe-target) nil $ let
                  maybe-listener $ if
                    and (record? maybe-target) (.matches? maybe-target Shape)
                    get-in maybe-target $ [] :event event-name
                ; .log js/console |listener maybe-listener maybe-target
                if (some? maybe-listener) maybe-listener $ if
                  = 0 $ count coord
                  , nil
                    recur tree event-name $ slice coord 0
                      - (count coord) 1
      :ns $ quote
        ns quamolit.controller.resolve $ :require
          quamolit.types :refer $ Component Shape
    |quamolit.core $ {}
      :defs $ {}
        |*clicked-focus $ quote
          defatom *clicked-focus $ []
        |*drag-moving-cache $ quote
          defatom *drag-moving-cache $ [] 0 0
        |*element-tree $ quote (defatom *element-tree nil)
        |*last-tick $ quote
          defatom *last-tick $ get-tick
        |call-paint $ quote
          defn call-paint (tree target dispatch! elapsed) (; js/console.log tree)
            let
                ctx $ .!getContext target |2d
                w js/window.innerWidth
                h js/window.innerHeight
                viewer-shift $ :move @*stage-config
                viewer-scale $ :scale @*stage-config
              reset! *touch-event-areas nil
              .!clearRect ctx 0 0 w h
              ; .!save ctx
              .!translate ctx
                &+ (* 0.5 w) (first viewer-shift)
                &+ (* 0.5 h) (nth viewer-shift 1)
              .!scale ctx viewer-scale viewer-scale
              swap! *tracked-transform update :offset $ fn (point) (point-add point viewer-shift)
              swap! *tracked-transform update :transform $ fn (point)
                point-times point $ [] viewer-scale 0
              paint ctx tree ([]) dispatch! elapsed
              let
                  scale-back $ &/ 1 viewer-scale
                .!scale ctx scale-back scale-back
              swap! *tracked-transform update :transform $ fn (point)
                point-times point $ [] (&/ 1 viewer-scale) 0
              swap! *tracked-transform update :offset $ fn (point) (point-minus point viewer-shift)
              .!translate ctx
                &- (* -0.5 w) (first viewer-shift)
                &- (* -0.5 h) (nth viewer-shift 1)
              ; .!restore ctx
              when
                not $ empty? @*hud-logs
                paint-logs! ctx @*hud-logs
                clear-hud-logs!
        |configure-canvas $ quote
          defn configure-canvas (app-container)
            let
                dpr $ or js/window.devicePixelRatio 1
              set! (.-width app-container) (* dpr js/window.innerWidth)
              set! (.-height app-container) (* dpr js/window.innerHeight)
              -> app-container .-style .-width $ set! (str js/window.innerWidth "\"px")
              -> app-container .-style .-height $ set! (str js/window.innerHeight "\"px")
              -> app-container (.!getContext "\"2d") (.!scale dpr dpr)
        |find-hit-area $ quote
          defn find-hit-area (point areas)
            if (nil? areas) nil $ let
                x $ nth areas 0
                transform $ :transform x
                p $ point-minus point
                  point-add (:offset x)
                    point-times (:position x) transform
                delta $ point-divide p transform
              ; println "\"looking" (:offset x) delta
              if
                case-default (:kind x)
                  do (js/console.warn "\"invalid area data" x) false
                  :rect $ and
                    &<=
                      js/Math.abs $ nth delta 0
                      :half-w x
                    &<=
                      js/Math.abs $ nth delta 1
                      :half-h x
                  :arc $ &<=
                    &+
                      js/Math.pow (nth delta 0) 2
                      js/Math.pow (nth delta 1) 2
                    js/Math.pow (:r x) 2
                , x $ recur point (nth areas 1)
        |handle-event $ quote
          defn handle-event (coord event-name event dispatch) (; js/console.log "|handle event" maybe-listener coord event-name @*element-tree)
            if-let
              maybe-listener $ resolve-target @*element-tree event-name
                either coord $ []
              do (.!preventDefault event) (maybe-listener event dispatch)
              ; js/console.log "|no target"
        |on-control-event $ quote
          defn on-control-event (elapsed states delta)
            if
              and $ :left-b? states
              reset-stage-config!
              let
                  move $ :left-move states
                  scales $ :right-move delta
                update-stage-config!
                  map move $ fn (x)
                    * x (js/Math.abs x) 0.02
                  nth scales 1
        |paint-logs! $ quote
          defn paint-logs! (ctx logs)
            set! (.-fillStyle ctx) "\"hsla(0,0%,0%,0.5)"
            set! (.-textAlign ctx) |left
            set! (.-textBaseline ctx) |middle
            set! (.-font ctx) "|12px Monlo, monospace"
            if
              > (count logs) 80
              .!fillText ctx
                str (count logs) "\" logs, showing 80 of them"
                , 10 10 1000
            -> logs (take 80)
              map-indexed $ fn (idx log)
                .!fillText ctx log 10
                  + 24 $ * 10 idx
                  , 1000
        |render-page $ quote
          defn render-page (tree target dispatch!)
            let
                new-tick $ get-tick
                elapsed $ &- new-tick @*last-tick
              ; js/console.info "|render page:" tree
              reset! *element-tree tree
              reset! *last-tick new-tick
              call-paint tree target dispatch! elapsed
              ; js/console.log |tree tree
        |reset-stage-config! $ quote
          defn reset-stage-config! () $ let
              move0 $ :move @*stage-config
              scale0 $ :scale @*stage-config
            when
              or
                not= ([] 0 0) move0
                not= 1 scale0
              if
                not= ([] 0 0) move0
                swap! *stage-config update :move $ fn (prev)
                  &let
                    l $ vec-length prev
                    if (< l 4) ([] 0 0)
                      &let
                        move-back $ point-times prev
                          [] (&/ -4 l) 0
                        point-add prev move-back
              if (not= scale0 1)
                swap! *stage-config update :scale $ fn (prev)
                  let
                      delta $ - scale0 1
                    if
                      > 0.01 $ js/Math.abs delta
                      , 1 $ + prev
                        if (> delta 0) -0.01 0.01
        |setup-events $ quote
          defn setup-events (root-element dispatch)
            let
                ctx $ .!getContext root-element |2d
              .!addEventListener root-element "\"mousedown" $ fn (event)
                reset! *drag-moving-cache $ [] (.-clientX event) (.-clientY event)
                when-let
                  target $ find-hit-area
                    []
                      &- (.-offsetX event) (&* js/window.innerWidth 0.5)
                      &- (.-offsetY event) (&* js/window.innerHeight 0.5)
                    , @*touch-event-areas
                  ; js/console.log "\"target" target
                  let
                      coord $ :coord target
                    reset! *clicked-focus coord
                    handle-event coord :mousedown event dispatch
              .!addEventListener root-element "\"mousemove" $ fn (event)
                if
                  and
                    or (.-metaKey event) (.-ctrlKey event) (.-shiftKey event)
                    some? @*drag-moving-cache
                  let
                      prev @*drag-moving-cache
                      current $ [] (.-clientX event) (.-clientY event)
                      delta $ point-minus current prev
                    reset! *drag-moving-cache current
                    swap! *stage-config update :move $ fn (prev) (point-add prev delta)
                  if-let (coord @*clicked-focus) (handle-event coord :mousemove event dispatch)
              .!addEventListener root-element "\"mouseup" $ fn (event) (reset! *drag-moving-cache nil)
                let
                    coord @*clicked-focus
                  when (some? coord) (handle-event coord :mouseup event dispatch) (reset! *clicked-focus nil)
                    when-let
                      target $ find-hit-area
                        []
                          &- (.-offsetX event) (&* js/window.innerWidth 0.5)
                          &- (.-offsetY event) (&* js/window.innerHeight 0.5)
                        , @*touch-event-areas
                      if
                        = coord $ :coord target
                        handle-event coord :click event dispatch
              .!addEventListener root-element "\"mouseleave" $ fn (event)
                when-let (coord @*clicked-focus) (handle-event coord :click event dispatch) (handle-event coord :mouseup event dispatch) (reset! *clicked-focus nil)
              .!addEventListener js/window |keypress $ fn (event)
                let
                    coord @*clicked-focus
                  handle-event coord :keypress event dispatch
              .!addEventListener js/window |keydown $ fn (event)
                let
                    coord @*clicked-focus
                  handle-event coord :keydown event dispatch
              .!addEventListener js/window |click $ fn (event) (clear-prompt!)
              .!addEventListener js/window |resize $ fn (event) (configure-canvas root-element)
              .!addEventListener js/window "\"wheel" $ fn (event)
                if
                  or (.-metaKey event) (.-ctrlKey event) (.-shiftKey event)
                  let
                      dy $ * 0.001 (.-deltaY event)
                      scale $ :scale @*stage-config
                      pointer $ point-minus
                        [] (.-clientX event) (.-clientY event)
                        [] (* 0.5 js/window.innerWidth) (* 0.5 js/window.innerHeight)
                    when
                      not
                        and (<= scale 0.1)
                          < (.-deltaY event) 0
                        and (>= scale 4)
                          > (.-deltaY event) 0
                      swap! *stage-config update :move $ fn (pos)
                        let
                            shift $ point-minus pointer pos
                          point-minus pos $ point-times shift
                            [] (/ dy scale) 0
                      swap! *stage-config update :scale $ fn (x) (+ x dy)
        |update-stage-config! $ quote
          defn update-stage-config! (move scale-change)
            let
                scale0 $ :scale @*stage-config
              when
                and
                  or
                    not= ([] 0 0) move
                    not= 0 scale-change
                  not $ and (> scale-change 0) (>= scale0 8)
                swap! *stage-config update :move $ fn (prev)
                  point-add
                    point-minus prev $ point-scale
                      [] (nth move 0)
                        negate $ nth move 1
                      , 0.05
                    point-scale prev $ / (* 0.01 scale-change) scale0
                swap! *stage-config update :scale $ fn (prev)
                  let
                      next $ &+ prev (* 0.01 scale-change)
                    &max 0.2 $ &min next 8
        |update-viewer! $ quote
          defn update-viewer! (move scale-change)
            when
              or
                not= ([] 0 0) move
                not= 0 scale-change
              swap! *viewer-config update :move $ fn (prev)
                point-add prev $ point-times
                  []
                    negate $ first move
                    nth move 1
                  [] 0.05 0
              swap! *viewer-config update :scale $ fn (prev)
                let
                    next $ &+ prev (* 0.01 scale-change)
                  &max 0.2 $ &min next 8
      :ns $ quote
        ns quamolit.core $ :require
          quamolit.types :refer $ Component
          quamolit.util.time :refer $ get-tick
          quamolit.render.paint :refer $ paint
          quamolit.controller.resolve :refer $ resolve-target locate-target
          quamolit.hud-logs :refer $ clear-hud-logs! *hud-logs
          pointed-prompt.core :refer $ clear-prompt!
          quamolit.global :refer $ *touch-event-areas *tracked-transform *stage-config
          quamolit.math :refer $ point-minus point-divide point-add point-times vec-length point-scale
    |quamolit.cursor $ {}
      :defs $ {}
        |gc-states $ quote
          defn gc-states (store op-data)
            let
                cursor $ first op-data
                fields $ last op-data
              update-in store
                concat ([] :states) cursor
                fn (dict)
                  ; println $ count dict
                  select-keys dict $ conj fields :data
        |update-states $ quote
          defn update-states (store op-data)
            let
                cursor $ first op-data
                data $ last op-data
              assoc-in store
                concat ([] :states) cursor $ [] :data
                , data
      :ns $ quote (ns quamolit.cursor)
    |quamolit.global $ {}
      :defs $ {}
        |*stage-config $ quote
          defatom *stage-config $ {}
            :move $ [] 0 0
            :scale 1
        |*touch-event-areas $ quote (defatom *touch-event-areas nil)
        |*tracked-transform $ quote
          defatom *tracked-transform $ {}
            :offset $ [] 0 0
            :transform $ [] 1 0
            :alpha 1
        |*transforms-memory $ quote
          defatom *transforms-memory $ []
      :ns $ quote (ns quamolit.global)
    |quamolit.hud-logs $ {}
      :defs $ {}
        |*hud-logs $ quote
          defatom *hud-logs $ []
        |clear-hud-logs! $ quote
          defn clear-hud-logs! () $ reset! *hud-logs ([])
        |hud-log $ quote
          defn hud-log (& xs)
            swap! *hud-logs conj $ join-str xs "\", "
      :ns $ quote (ns quamolit.hud-logs)
    |quamolit.math $ {}
      :defs $ {}
        |bound-01 $ quote
          defn bound-01 (x)
            cond
                nil? x
                , 1
              (not (number? x))
                do $ js/console.warn "\"invalid value to bound:" x
              (< x 0) 0
              (> x 1) 1
              true x
        |bound-opacity $ quote
          defn bound-opacity (x) (bound-01 x)
        |bound-x $ quote
          defn bound-x (left right x)
            if (> left right)
              js/Math.min (js/Math.max right x) x
              js/Math.min (js/Math.max left x) right
        |pi-ratio $ quote
          def pi-ratio $ / js/Math.PI 180
        |point-add $ quote
          defn point-add (a b)
            []
              &+ (nth a 0) (nth b 0)
              &+ (nth a 1) (nth b 1)
        |point-divide $ quote
          defn point-divide (x y)
            let-sugar
                  [] a b
                  , x
                ([] c d) y
                length2 $ &+ (js/Math.pow c 2) (js/Math.pow d 2)
              []
                &/
                  &+ (&* a c) (&* b d)
                  , length2
                &/
                  &- (&* b c) (&* a d)
                  , length2
        |point-minus $ quote
          defn point-minus (a b)
            []
              &- (nth a 0) (nth b 0)
              &- (nth a 1) (nth b 1)
        |point-negate $ quote
          defn point-negate (a)
            []
              netate $ nth a 0
              negate $ nth a 1
        |point-scale $ quote
          defn point-scale (pair v)
            map pair $ fn (x) (* v x)
        |point-times $ quote
          defn point-times (a b)
            []
              &-
                &* (nth a 0) (nth b 0)
                &* (nth a 1) (nth b 1)
              &+
                &* (nth a 0) (nth b 1)
                &* (nth a 1) (nth b 0)
        |vec-length $ quote
          defn vec-length (point)
            let[] (x y) point $ js/Math.sqrt
              &+ (&* x x) (&* y y)
      :ns $ quote (ns quamolit.math)
    |quamolit.render.element $ {}
      :defs $ {}
        |alpha $ quote
          defcomp alpha (props & children)
            {} $ :tree
              group ({})
                native-save $ {}
                native-alpha $ merge (&{} :opacity 0.01) props
                , & children $ native-restore ({})
        |button $ quote
          defcomp button (style) (; js/console.log "\"button" style)
            let
                guide-text $ or (:text style) |button
                x $ or (:x style) 0
                y $ or (:y style) 0
                w $ or (:w style) 100
                h $ or (:h style) 40
                style-bg $ {} (:x x) (:y y)
                  :fill-style $ or (:surface-color style) (hsl 0 80 80)
                  :w w
                  :h h
                  :event $ :event style
                style-text $ {}
                  :fill-style $ or (:text-color style) (hsl 0 0 10)
                  :text guide-text
                  :size $ or (:font-size style) 20
                  :font-family $ or (:font-family style) |Optima
                  :text-align |center
                  :x x
                  :y y
              group ({}) (rect style-bg) (text style-text)
        |input $ quote
          defcomp input (style)
            let
                w $ :w style
                h $ :h style
                style-bg $ {}
                  :fill-style $ hsl 0 50 80
                  :stroke-style $ hsl 0 0 50
                  :line-width 2
                  :x $ or (:x style) 0
                  :y $ or (:y style) 0
                  :w w
                  :h h
                  :event $ :event style
                style-place-text $ {}
                style-text $ {} (:text-align |center)
                  :text $ :text style
                  :font-family |Optima
                  :size 20
                  :fill-style $ hsl 0 0 0
                  :x 0
                  :y 0
                  :max-width w
              group ({}) (rect style-bg)
                translate style-place-text $ text style-text
        |rotate $ quote
          defcomp rotate (props & children)
            let
                style props
                angle $ * pi-ratio
                  or (:angle style) 30
              ; js/console.log "|actual degree:" angle
              group ({})
                native-save $ {}
                native-rotate $ &{} :angle angle
                , & children $ native-restore ({})
        |scale $ quote
          defcomp scale (props & children)
            group ({})
              native-save $ {}
              native-scale $ merge (&{} :ratio 1) props
              , & children $ native-restore ({})
        |textbox $ quote
          defcomp textbox (states props)
            let
                cursor $ :cursor states
                state $ or (:data states)
                  {} $ :text (&map:get props :text)
                text $ :text state
              [] nil $ input
                assoc props :text text :event $ &{} :keydown
                  fn (event d!)
                    let
                        next-text $ case-default (.-keyCode event)
                          str text $ keycode->key (.-keyCode event) (.-shiftKey event)
                          32 $ str text "\" "
                          8 $ if
                            <= (count text) 1
                            , "\""
                              .slice text 0 $ dec (.count text)
                      d! cursor $ assoc state :text next-text
        |translate $ quote
          defcomp translate (props & children)
            group ({})
              native-save $ {}
              native-translate $ merge (&{} :x 0 :y 0) props
              , & children $ native-restore ({})
      :ns $ quote
        ns quamolit.render.element $ :require
          quamolit.util.string :refer $ hsl
          quamolit.alias :refer $ defcomp native-translate native-alpha native-save native-restore native-rotate native-scale group rect text arrange-children
          quamolit.util.keyboard :refer $ keycode->key
          quamolit.math :refer $ pi-ratio
    |quamolit.render.paint $ {}
      :defs $ {}
        |*image-pool $ quote
          defatom *image-pool $ {}
        |get-image $ quote
          defn get-image (src)
            if (contains? @*image-pool src) (get @*image-pool src)
              let
                  image $ .!createElement js/document |img
                .!setAttribute image |src src
                swap! *image-pool assoc src image
                , image
        |paint $ quote
          defn paint (ctx tree coord dispatch! elapsed) (; js/console.log "\"paint" tree)
            if (nil? tree) nil $ if
              and (record? tree) (&record:matches? Component tree)
              let
                  on-tick $ &record:get tree :on-tick
                if (fn? on-tick) (on-tick elapsed dispatch!)
                recur ctx (&record:get tree :tree)
                  conj coord $ &record:get tree :name
                  , dispatch! elapsed
              do (paint-one ctx tree coord)
                &doseq
                  cursor $ &record:get tree :children
                  paint ctx (last cursor)
                    append coord $ first cursor
                    , dispatch! elapsed
        |paint-alpha $ quote
          defn paint-alpha (ctx style)
            let
                base-alpha $ &map:get @*tracked-transform :alpha
                opacity $ * base-alpha
                  bound-opacity $ :opacity style
              set! (.-globalAlpha ctx) opacity
              swap! *tracked-transform assoc :alpha opacity
        |paint-arc $ quote
          defn paint-arc (ctx style coord event)
            let
                x $ or (:x style) 0
                y $ or (:y style) 0
                r $ or (:r style) 40
                s-angle $ * pi-ratio
                  or (:s-angle style) 0
                e-angle $ * pi-ratio
                  or (:e-angle style) 300
                line-width $ or (:line-width style) 4
                counterclockwise $ or (:counterclockwise style) false
                line-cap $ or (:line-cap style) |round
                line-join $ or (:line-join style) |round
                miter-limit $ or (:miter-limit style) 8
              .!beginPath ctx
              .!arc ctx x y r s-angle e-angle counterclockwise
              when (some? event)
                reset! *touch-event-areas $ ::
                  {} (:kind :arc) (:r r)
                    :transform $ :transform @*tracked-transform
                    :offset $ :offset @*tracked-transform
                    :coord coord
                    :position $ [] x y
                  , @*touch-event-areas
              when
                some? $ :fill-style style
                set! (.-fillStyle ctx) (:fill-style style)
                .!fill ctx
              when
                some? $ :stroke-style style
                set! (.-lineWidth ctx) line-width
                set! (.-strokeStyle ctx) (:stroke-style style)
                set! (.-lineCap ctx) line-cap
                set! (.-miterLimit ctx) miter-limit
                .!stroke ctx
        |paint-image $ quote
          defn paint-image (ctx style coord)
            let
                sx $ or (:sx style) 0
                sy $ or (:sy style) 0
                sw $ or (:sw style) 40
                sh $ or (:sh style) 40
                dx $ or (:dx style) 0
                dy $ or (:dy style) 0
                dw $ or (:dw style) 40
                dh $ or (:dh style) 40
                image $ get-image (:src style)
              .!drawImage ctx image sx sy sw sh dx dy dw dh
        |paint-line $ quote
          defn paint-line (ctx style)
            let
                x0 $ either (&map:get style :x0) 0
                y0 $ either (&map:get style :y0) 0
                x1 $ either (&map:get style :x1) 40
                y1 $ either (&map:get style :y1) 40
                line-width $ or (&map:get style :line-width) 4
                stroke-style $ or (&map:get style :stroke-style) (hsl 200 70 50)
                line-cap $ or (&map:get style :line-cap) |round
                line-join $ or (&map:get style :line-join) |round
                miter-limit $ or (&map:get style :miter-limit) 8
              .!beginPath ctx
              .!moveTo ctx x0 y0
              .!lineTo ctx x1 y1
              set! (.-lineWidth ctx) line-width
              set! (.-strokeStyle ctx) stroke-style
              set! (.-lineCap ctx) line-cap
              set! (.-miterLimit ctx) miter-limit
              .!stroke ctx
        |paint-one $ quote
          defn paint-one (ctx directive coord)
            let
                op $ &record:get directive :name
                style $ &record:get directive :style
                event $ &record:get directive :event
              ; js/console.log :paint-one op style
              cond
                  identical? op :line
                  paint-line ctx style
                (identical? op :text) (paint-text ctx style)
                (identical? op :rect) (paint-rect ctx style coord event)
                (identical? op :native-save) (paint-save ctx style)
                (identical? op :native-restore) (paint-restore ctx style)
                (identical? op :native-translate) (paint-translate ctx style)
                (identical? op :native-alpha) (paint-alpha ctx style)
                (identical? op :native-rotate) (paint-rotate ctx style)
                (identical? op :native-scale) (paint-scale ctx style)
                (identical? op :path) (paint-path ctx style)
                (identical? op :arc) (paint-arc ctx style coord event)
                (identical? op :image) (paint-image ctx style coord)
                (identical? op :group) nil
                true $ do (js/console.log "|painting not implemented" directive)
        |paint-path $ quote
          defn paint-path (ctx style)
            let
                points $ :points style
                first-point $ first points
              .!beginPath ctx
              .!moveTo ctx (first first-point) (last first-point)
              &doseq
                coords $ rest points
                case-default (count coords) (raise "|not supported coords")
                  2 $ .!lineTo ctx (nth coords 0) (nth coords 1)
                  4 $ .!quadraticCurveTo ctx (nth coords 0) (nth coords 1) (nth coords 2) (nth coords 3)
                  6 $ .!bezierCurveTo ctx (nth coords 0) (nth coords 1) (nth coords 2) (nth coords 3) (nth coords 4) (nth coords 5)
              when (&map:contains? style :stroke-style)
                set! (.-lineWidth ctx)
                  or (:line-width style) 4
                set! (.-strokeStyle ctx) (:stroke-style style)
                set! (.-lineCap ctx)
                  or (:line-cap style) |round
                set! (.-lineJoin ctx)
                  or (:line-join style) |round
                set! (.-milterLimit ctx)
                  or (:milter-limit style) 8
                .!stroke ctx
              when (&map:contains? style :fill-style)
                set! (.-fillStyle ctx) (:fill-style style)
                .!closePath ctx
                .!fill ctx
        |paint-rect $ quote
          defn paint-rect (ctx style coord event)
            let
                w $ or (&map:get style :w) 100
                h $ or (&map:get style :h) 40
                x $ -
                  or (&map:get style :x) 0
                  / w 2
                y $ -
                  or (&map:get style :y) 0
                  / h 2
                line-width $ or (&map:get style :line-width) 2
              .!beginPath ctx
              .!rect ctx x y w h
              when (some? event)
                reset! *touch-event-areas $ ::
                  {} (:kind :rect)
                    :half-w $ &* 0.5 w
                    :half-h $ &* 0.5 h
                    :transform $ :transform @*tracked-transform
                    :offset $ :offset @*tracked-transform
                    :coord coord
                    :position $ []
                      &+ x $ &* 0.5 w
                      &+ y $ &* 0.5 h
                  , @*touch-event-areas
              when (&map:contains? style :fill-style)
                set! (.-fillStyle ctx) (&map:get style :fill-style)
                .!fill ctx
              when (&map:contains? style :stroke-style)
                set! (.-strokeStyle ctx) (&map:get style :stroke-style)
                set! (.-lineWidth ctx) line-width
                .!stroke ctx
        |paint-restore $ quote
          defn paint-restore (ctx style) (.!restore ctx)
            if (empty? @*transforms-memory) (js/console.warn "\"no thing to restore")
              do
                reset! *tracked-transform $ last @*transforms-memory
                swap! *transforms-memory butlast
        |paint-rotate $ quote
          defn paint-rotate (ctx style)
            let
                angle $ or (:angle style) 30
                radius $ / (* angle js/Math 2) 180
              .!rotate ctx angle
              swap! *tracked-transform update :transform $ fn (point)
                point-times point $ [] (js/Math.cos radius)
                  negate $ js/Math.cos radius
        |paint-save $ quote
          defn paint-save (ctx style) (.!save ctx) (swap! *transforms-memory conj @*tracked-transform)
        |paint-scale $ quote
          defn paint-scale (ctx style)
            let
                ratio $ or (:ratio style) 1.2
              .!scale ctx ratio ratio
              swap! *tracked-transform update :transform $ fn (point)
                point-times point $ [] ratio 0
        |paint-text $ quote
          defn paint-text (ctx style)
            set! (.-fillStyle ctx)
              or (:fill-style style) (hsl 0 0 0)
            set! (.-textAlign ctx)
              or (:text-align style) |center
            set! (.-textBaseline ctx)
              or (:base-line style) |middle
            set! (.-font ctx)
              str
                or (:size style) 20
                , "|px " $ or (:font-family style) |Optima
            when (contains? style :fill-style)
              .!fillText ctx (:text style)
                or (:x style) 0
                or (:y style) 0
                or (:max-width style) 400
            when (contains? style :stroke-style)
              .!strokeText ctx (:text style)
                or (:x style) 0
                or (:y style) 0
                or (:max-width style) 400
        |paint-translate $ quote
          defn paint-translate (ctx style)
            let
                x $ or (:x style) 0
                y $ or (:y style) 0
                transform $ :transform @*tracked-transform
                delta $ point-times transform ([] x y)
              .!translate ctx x y
              swap! *tracked-transform update :offset $ fn (point) (point-add point delta)
        |pi-ratio $ quote
          def pi-ratio $ / js/Math.PI 180
      :ns $ quote
        ns quamolit.render.paint $ :require
          quamolit.util.string :refer $ hsl
          quamolit.types :refer $ Component
          quamolit.util.string :refer $ gen-id!
          quamolit.math :refer $ bound-opacity point-times point-add
          quamolit.global :refer $ *transforms-memory *tracked-transform *touch-event-areas
    |quamolit.types $ {}
      :defs $ {}
        |Component $ quote (defrecord Component :name :on-tick :tree)
        |Shape $ quote (defrecord Shape :name :style :event :children)
      :ns $ quote (ns quamolit.types)
    |quamolit.util.detect $ {}
      :defs $ {}
        |=seq $ quote
          defn =seq (xs ys)
            let
                xs-empty? $ empty? xs
                ys-empty? $ empty? ys
              if (and xs-empty? ys-empty?) true $ if (or xs-empty? ys-empty?) false
                if
                  identical? (first xs) (first ys)
                  recur (rest xs) (rest ys)
                  , false
        |compare-more $ quote
          defn compare-more (x y)
            let
                tx $ type-as-int x
                ty $ type-as-int y
              if (identical? tx ty) (compare-number x y) (compare-number tx ty)
        |compare-number $ quote
          defn compare-number (x y)
            cond
                &< x y
                , -1
              (&> x y) 1
              true 0
        |type-as-int $ quote
          defn type-as-int (x)
            cond
                number? x
                , 0
              (keyword? x) 1
              (string? x) 2
              :else 3
      :ns $ quote (ns quamolit.util.detect)
    |quamolit.util.keyboard $ {}
      :defs $ {}
        |keycode->key $ quote
          defn keycode->key (k shift?)
            if
              and (<= k 90) (>= k 65)
              if shift? (js/String.fromCharCode k)
                -> k js/String.fromCharCode $ .!toLowerCase
              , "\""
      :ns $ quote (ns quamolit.util.keyboard)
    |quamolit.util.ref $ {}
      :defs $ {}
        |new-ref $ quote
          defn new-ref (x) (js-array x)
        |ref-get $ quote
          defn ref-get (o) (.-0 o)
        |ref-set! $ quote
          defn ref-set! (o v)
            set! (.-0 o) v
      :ns $ quote (ns quamolit.util.ref)
    |quamolit.util.string $ {}
      :defs $ {}
        |*counter $ quote (defatom *counter 0)
        |gen-id! $ quote
          defn gen-id! () $ do (swap! *counter inc) @*counter
        |hsl $ quote
          defn hsl (h s l ? a)
            if (some? a) (str "\"hsl(" h "\"," s "\"%," l "\"%," a "\")") (str "\"hsl(" h "\"," s "\"%," l "\"%)")
      :ns $ quote (ns quamolit.util.string)
    |quamolit.util.time $ {}
      :defs $ {}
        |get-tick $ quote
          defn get-tick () (; "\"return value in seconds")
            &* 0.001 $ js/performance.now
      :ns $ quote (ns quamolit.util.time)
