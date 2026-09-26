
{}
  :about "|Machine-generated snapshot. Do not edit directly — changes will be overwritten. Use `calcit query` to inspect and `calcit edit`/`calcit tree` to modify. Run `calcit docs agents --contract` before mutations; use `--full` for first orientation or changed contract digest. Manual edits must follow format and schema conventions, then run `calcit edit format`."
  :package |quamolit
  :entries $ {} $ :default
    {} (:description |) (:init-fn 'quamolit.bootstrap/main!) (:mode :js) (:reload-fn 'quamolit.bootstrap/reload!) (:target :browser)
      :feature-policy $ {}
      :modules $ [] |pointed-prompt/ |touch-control/ |js-ffi/
      :type-slots $ {}
  :files $ {}
    'quamolit.alias $ %{} 'FileEntry
      :defs $ {}
        '>> $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn >> (states k)
            let
                parent-cursor $ either (&map:get states :cursor) ([])
                branch $ &map:get states k
              &map:assoc
                either branch $ {}
                , :cursor $ append parent-cursor k
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'arc $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn arc (props & children) (create-shape :arc props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'arrange-children $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn arrange-children (children)
            if (every? children some?)
              -> children $ map-indexed $ fn (idx x) ([] idx x)
              -> children
                map-indexed $ fn (idx x) ([] idx x)
                filter $ fn (entry)
                  some? $ last entry
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] $ :: 'List 'Dynamic
            :return $ :: 'List 'Dynamic
        'bezier $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn bezier (props & children) (create-shape :bezier props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'create-list-shape $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn create-list-shape (shape-name props children)
            if
              not $ map? props
              raise $ new js/Error |Props-expected-to-be-a-map
            %{} Shape (:name shape-name)
              :style $ &map:get props :style
              :event $ &map:get props :event
              :children children
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'create-shape $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn create-shape (shape-name props children)
            if
              not $ map? props
              raise $ new js/Error "|Props expeced to be a map!"
            %{} Shape (:name shape-name)
              :style $ &map:dissoc props :event
              :event $ &map:get props :event
              :children $ arrange-children children
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'defcomp $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defmacro defcomp (comp-name args & body)
            quasiquote $ defn ~comp-name ~args $ let
                ret $ do ~@body
              cond
                  &struct:matches? Shape ret
                  %{} Component
                    :name $ ~ $ turn-tag comp-name
                    :on-tick nil
                    :tree ret
                (list? ret)
                  do
                    assert |expected-on-tick-and-tree $ = 2 $ count ret
                    %{} Component
                      :name $ ~ $ turn-tag comp-name
                      :on-tick $ &list:first ret
                      :tree $ &list:last ret
                (map? ret)
                  %{} Component
                    :name $ ~ $ turn-tag comp-name
                    :on-tick $ &map:get ret :on-tick
                    :tree $ &map:get ret :tree
                true $ raise |unknown-component
          :examples $ []
          :schema $ :: 'Macro $ {} (:rest 'Syntax)
            :capabilities $ #{}
            :expansion $ :: 'Definition 'Fn
            :required $ [] 'SyntaxSymbol 'SyntaxList
        'group $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn group (props & children) (create-shape :group props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'image $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn image (props & children) (create-shape :image props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'line $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn line (props & children) (create-shape :line props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'list-> $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn list-> (props children) (create-list-shape :group props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'native-alpha $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn native-alpha (props & children) (create-shape :native-alpha props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'native-clip $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn native-clip (props & children) (create-shape :native-clip props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'native-restore $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn native-restore (props & children) (create-shape :native-restore props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'native-rotate $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn native-rotate (props & children) (create-shape :native-rotate props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'native-save $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn native-save (props & children) (create-shape :native-save props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'native-scale $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn native-scale (props & children) (create-shape :native-scale props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'native-transform $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn native-transform (props & children) (create-shape :native-transform props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'native-translate $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn native-translate (props & children) (create-shape :native-translate props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'path $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn path (props & children) (create-shape :path props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'rect $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn rect (props & children) (create-shape :rect props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
        'text $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn text (props & children) (create-shape :text props children)
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.alias
          :require $ quamolit.types :refer $ Component Shape
    'quamolit.app.comp.binary-tree $ %{} 'FileEntry
      :defs $ {}
        'comp-binary-tree $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-binary-tree (timestamp level)
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
                  js/Math.sin $ / timestamp $ + 8 (* r2 11)
                shift-b $ *
                  + 0.031 $ * 0.001 r3
                  js/Math.sin $ / timestamp $ + 13 (* 6 r4)
              ; hud-log timestamp level
              group ({})
                path $ {}
                  :points $ [] ([] x1 y1) ([] 0 0) ([] x2 y2)
                  :stroke-style $ hsl 200 80 50
                if (> level 0)
                  translate (&{} :x x1 :y y1)
                    scale
                      &{} :ratio $ + 0.6 $ * 1.3 shift-a
                      rotate
                        &{} :angle $ + (* 30 shift-a) 10
                        comp-binary-tree timestamp $ dec level
                if (> level 0)
                  translate (&{} :x x2 :y y2)
                    scale
                      &{} :ratio $ + 0.73 $ * 2 shift-b
                      rotate
                        &{} :angle $ + (* 20 shift-b) 10
                        comp-binary-tree timestamp $ dec level
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'comp-tree-waving $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-tree-waving (states)
            let
                cursor $ :cursor states
                state $ or (:data states) 0
              []
                fn (elapsed d!)
                  d! cursor $ + state $ * 10 elapsed
                comp-binary-tree state 5
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.binary-tree
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp line group path
            quamolit.render.element :refer $ rotate scale translate
            quamolit.comp.debug :refer $ comp-debug
            quamolit.hud-logs :refer $ hud-log
    'quamolit.app.comp.clock $ %{} 'FileEntry
      :defs $ {} $ 'comp-clock
        %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-clock (states)
            let
                now $ js-ffi.shared/now-ms
                hrs $ &number:rem
                  floor $ / now 3600000
                  , 24
                mins $ &number:rem
                  floor $ / now 60000
                  , 60
                secs $ &number:rem
                  floor $ / now 1000
                  , 60
                get-ten $ fn (x)
                  floor $ / x 10
                get-one $ fn (x) (&number:rem x 10)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.clock
          :require
            quamolit.alias :refer $ defcomp group >>
            quamolit.render.element :refer $ translate
            quamolit.app.comp.digits :refer $ comp-digit
            quamolit.comp.debug :refer $ comp-debug
            quamolit.hud-logs :refer $ hud-log
    'quamolit.app.comp.code-table $ %{} 'FileEntry
      :defs $ {} $ 'comp-code-table
        %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-code-table (states) (; js/console.log state)
            let
                cursor $ :cursor states
                state $ either (:data states) ([])
              translate (&{} :x -160 :y -160) & $ ->
                repeat (repeat |edit 3) 3
                map-indexed $ fn (i row)
                  group ({}) & $ -> row $ map-indexed
                    fn (j content)
                      let
                          move-x $ * i 100
                          move-y $ * j 60
                        translate (&{} :x move-x :y move-y)
                          textbox
                            >> states $ str i |: j
                            &{} :w 80 :h 40 :text content
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.code-table
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp group rect >>
            quamolit.render.element :refer $ input translate textbox
            quamolit.util.keyboard :refer $ keycode->key
    'quamolit.app.comp.container $ %{} 'FileEntry
      :defs $ {}
        'comp-container $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-container (store)
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
                      button $ assoc (style-button |Back) :event $ {}
                        :click $ fn (e d!)
                          d! cursor $ assoc state :tab :portal
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
        'style-button $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn style-button (guide-text)
            {} (:text guide-text)
              :surface-color $ hsl 200 80 50
              :text-color $ hsl 200 80 100
              :font-size 16
              :w 80
              :h 32
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.container
          :require
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
    'quamolit.app.comp.digits $ %{} 'FileEntry
      :defs $ {}
        'comp-0 $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-0 (states props)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'comp-1 $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-1 (states props)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'comp-2 $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-2 (states props)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'comp-3 $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-3 (states props)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'comp-4 $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-4 (states props)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'comp-5 $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-5 (states props)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'comp-6 $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-6 (states props)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'comp-7 $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-7 (states props)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'comp-8 $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-8 (states props)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'comp-9 $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-9 (states props)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'comp-digit $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-digit (states n props)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic
        'comp-stroke $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-stroke (states opacity x0 y0 x1 y1)
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
                          bound-x n x0 $ + n $ * v (- x0 n)
                        update :y0 $ fn (n)
                          bound-x n y0 $ + n $ * v (- y0 n)
                        update :x1 $ fn (n)
                          bound-x n x1 $ + n $ * v (- x1 n)
                        update :y1 $ fn (n)
                          bound-x n y1 $ + n $ * v (- y1 n)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic 'Dynamic 'Dynamic 'Dynamic
        'h-place? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn h-place? (x)
            cond
                < x 0
                , false
              (> x 1) false
              true true
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
        'rand-shift $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn rand-shift (x y)
            &+ (&- x y)
              rand $ &* 2 y
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'v-place? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn v-place? (x)
            cond
                < x 0
                , false
              (> x 2) false
              true true
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.digits
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp rect group line >>
            quamolit.render.element :refer $ alpha translate
            quamolit.comp.fade-in-out :refer $ comp-fade-in-out comp-fade-fn
            quamolit.math :refer $ bound-01 bound-x
            |@calcit/std :refer $ rand
    'quamolit.app.comp.drag-demo $ %{} 'FileEntry
      :defs $ {} $ 'comp-drag-demo
        %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-drag-demo (states)
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {} (:x 0) (:y 0)
                    :local $ new-ref $ {} (:x 0) (:y 0)
                    :v 10
              group ({})
                rect $ {} (:w 100) (:h 60)
                  :x $ :x state
                  :y $ :y state
                  :fill-style $ hsl 200 80 80
                  :event $ {}
                    :mousedown $ fn (e d!) (; js/console.log |down e)
                      ref-set! (:local state)
                        {}
                          :x $ - (.-clientX e) (:x state)
                          :y $ - (.-clientY e) (:y state)
                    :mouseup $ fn (e d!) (; js/console.log |up e)
                      ; d! cursor $ -> state (assoc :x0 0) (assoc :y0 0)
                    :mousemove $ fn (e d!) (; js/console.log |move e)
                      let
                          local $ ref-get $ :local state
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
                    :title "|long long title"
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.drag-demo
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp rect group line >>
            quamolit.render.element :refer $ alpha translate
            quamolit.comp.fade-in-out :refer $ comp-fade-in-out comp-fade-fn
            quamolit.math :refer $ bound-01 bound-x
            |@calcit/std :refer $ rand
            quamolit.util.ref :refer $ new-ref ref-get ref-set!
            quamolit.comp.slider :refer $ comp-slider
    'quamolit.app.comp.file-card $ %{} 'FileEntry
      :defs $ {} $ 'comp-file-card
        %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-file-card (states card-name position index parent-ratio popup? on-select)
            let
                cursor $ :cursor states
                state $ or (:data states)
                  {} $ :popup 0
              let
                  popup-ratio $ :popup state
                  shift-x $ first position
                  shift-y $ last position
                  move-x $ * shift-x $ + 0.1
                    * 0.9 $ - 1 popup-ratio
                  move-y $ * shift-y $ + 0.1
                    * 0.9 $ - 1 popup-ratio
                  scale-ratio $ /
                    + 0.2 $ * 0.8 popup-ratio
                    , parent-ratio
                  v 4
                []
                  fn (elapsed d!)
                    if popup?
                      if
                        < (:popup state) 1
                        d! cursor $ update state :popup $ fn (x)
                          bound-01 $ + x $ * v elapsed
                      if
                        > (:popup state) 0
                        d! cursor $ update state :popup $ fn (x)
                          bound-01 $ - x $ * v elapsed
                  translate
                    {} (:x 10) (:y 10)
                    alpha (&{} :opacity 1)
                      translate (&{} :x move-x :y move-y)
                        scale (&{} :ratio scale-ratio)
                          rect
                            &{} :w 520 :h 360 :fill-style (hsl 200 80 80) :event $ &{} :click $ fn (e d!) (on-select d!)
                            text $ &{} :fill-style (hsl 0 0 100) :text card-name :size 60
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic 'Dynamic 'Dynamic 'Dynamic 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.file-card
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp group rect text
            quamolit.render.element :refer $ translate alpha scale
            quamolit.math :refer $ bound-01
    'quamolit.app.comp.finder $ %{} 'FileEntry
      :defs $ {}
        'card-collection $ %{} 'CodeEntry (:doc |)
          :code $ quote $ def card-collection
            [] ([] "|喷雪花" "|檵木" "|石楠" "|文竹") ([] "|紫云英" "|绣球花" "|蔷薇") ([] "|金银花" "|栗树" "|婆婆纳" "|鸡爪槭") ([] "|卷柏" "|稻" "|马尾松" "|五角星花" "|苔藓") ([] "|芍药" "|木棉")
          :examples $ []
          :schema $ :: 'Dynamic
        'comp-finder $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-finder (states)
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {} $ :selected nil
                selected $ :selected state
              rect
                &{} :w 1000 :h 600 :fill-style (hsl 100 40 90) :event $ {} $ :click
                  fn (e d!) (d! cursor nil)
                group ({}) & $ -> card-collection $ map-indexed
                  fn (index folder) (; js/console.log folder)
                    let
                        ix $ &number:rem index 4
                        iy $ js/Math.floor $ / index 4
                        position $ []
                          - (* ix 200) 200
                          - (* iy 200) 100
                      comp-fade-in-out
                        >> states $ str |fade- index
                        {}
                        if
                          or (nil? selected) (= selected index)
                          comp-folder (>> states index) folder position (= index selected)
                            fn (d!)
                              d! cursor $ assoc state :selected index
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.finder
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp rect group >>
            quamolit.app.comp.folder :refer $ comp-folder
            quamolit.comp.fade-in-out :refer $ comp-fade-in-out comp-fade-fn
    'quamolit.app.comp.folder $ %{} 'FileEntry
      :defs $ {} $ 'comp-folder
        %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-folder (states cards position popup? select-this) (; js/console.log state)
            let
                cursor $ :cursor states
                state $ or (:data states)
                  {} (:popup 0) (:selected nil)
              let
                  selected $ :selected state
                  shift-x $ first position
                  shift-y $ last position
                  popup-ratio $ :popup state
                  place-x $ * shift-x $ - 1 popup-ratio
                  place-y $ * shift-y $ - 1 popup-ratio
                  ratio $ + 0.2 $ * 0.8 popup-ratio
                  bg-light $ + 60 $ * 22 popup-ratio
                  v 4
                []
                  fn (elapsed d!)
                    if popup?
                      if
                        < (:popup state) 1
                        d! cursor $ update state :popup $ fn (x)
                          bound-01 $ + x $ * v elapsed
                      if
                        > (:popup state) 0
                        d! cursor $ update state :popup $ fn (x)
                          bound-01 $ - x $ * v elapsed
                  translate (&{} :x place-x :y place-y)
                    scale (&{} :ratio ratio)
                      alpha
                        &{} :opacity $ * 0.6 1
                        rect $ &{} :w 600 :h 400 :fill-style (hsl 0 80 bg-light) :event $ &{} :click
                          fn (e d!) (select-this d!)
                            d! cursor $ assoc state :selected nil
                      group (&{}) & $ -> cards $ map-indexed
                        fn (index card-name)
                          let
                              jx $ &number:rem index 4
                              jy $ js/Math.floor $ / index 4
                              card-x $ * (- jx 1.5)
                                * 200 $ + 0.1 $ * 0.9 popup-ratio
                              card-y $ * (- jy 1.5)
                                * 100 $ + 0.1 $ * 0.9 popup-ratio
                            comp-fade-in-out
                              >> states $ str |fade- index
                              {}
                              if
                                or (nil? selected) (= index selected)
                                comp-file-card (>> states index) card-name ([] card-x card-y) index ratio
                                  and popup? $ = (:selected state) index
                                  fn (d!)
                                    d! cursor $ assoc state :selected index
                      if (not popup?)
                        rect $ &{} :w 600 :h 400 :fill-style (hsl 0 80 0 0) :event $ &{} :click
                          fn (e d!) (select-this d!)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] (:: 'Map 'Tag 'Dynamic) (:: 'List 'String) (:: 'List 'Number) 'Bool 'Dynamic
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.folder
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp rect text group >>
            quamolit.render.element :refer $ translate scale alpha
            quamolit.app.comp.file-card :refer $ comp-file-card
            quamolit.comp.fade-in-out :refer $ comp-fade-in-out
            quamolit.math :refer $ bound-01
    'quamolit.app.comp.folding-fan $ %{} 'FileEntry
      :defs $ {} $ 'comp-folding-fan
        %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-folding-fan (states)
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
                  fv $ wo-log $ :folding-value state
                []
                  fn (elapsed d!)
                    if (:folded? state)
                      if (< fv 1)
                        d! cursor $ update state :folding-value $ fn (x)
                          bound-opacity $ + x $ * v elapsed
                      if (> fv 0)
                        d! cursor $ update state :folding-value $ fn (x)
                          bound-opacity $ - x $ * v elapsed
                  group ({})
                    translate (&{} :x 0 :y 160) & $ -> (range n)
                      map $ fn (i)
                        rotate
                          &{} :angle $ * 6 (:folding-value state)
                            + 0.5 $ - i $ / n 2
                          image $ {} (:src |assets/lotus.jpg)
                            :sx $ * i image-unit
                            :sy 0
                            :sw image-unit
                            :sh image-h
                            :dx $ - 0 $ / image-unit 2
                            :dy $ - 10 dest-h
                            :dw dest-unit
                            :dh dest-h
                    button $ {} (:text |Toggle) (:x 160) (:y 200)
                      :surface-color $ hsl 30 80 60
                      :text-color $ hsl 0 0 100
                      :event $ {} $ :click
                        fn (e d!)
                          d! cursor $ update state :folded? not
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.folding-fan
          :require
            quamolit.alias :refer $ text defcomp group image
            quamolit.render.element :refer $ button translate rotate
            quamolit.util.string :refer $ hsl
            quamolit.math :refer $ bound-opacity
    'quamolit.app.comp.icon-increase $ %{} 'FileEntry
      :defs $ {} $ 'comp-icon-increase
        %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-icon-increase (states)
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
                    d! cursor $ update state :n-value $ fn (x)
                      bound-x 0 n $ + x $ * elapsed v
                rect
                  {} (:w 60) (:h 60)
                    :fill-style $ hsl 300 80 95
                    :event $ {} $ :click
                      fn (e d!)
                        d! cursor $ update state :n inc
                  translate
                    {} $ :x -14
                    rotate
                      {} $ :angle $ * 90 n-value
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
                      {} $ :y $ -
                        * 20 $ - 1 frac
                        , 20
                      alpha
                        {} $ :opacity $ - 1 frac
                        text $ {}
                          :text $ str $ + n 1
                          :fill-style $ hsl 200 60 60
                          :font-family "|Helvetica Neue"
                    translate
                      {} $ :y $ -
                        * 20 $ - 1 frac
                        , 0
                      alpha
                        {} $ :opacity frac
                        text $ {}
                          :text $ str n
                          :fill-style $ hsl 200 60 60
                          :font-family "|Helvetica Neue"
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.icon-increase
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp line text group rect
            quamolit.render.element :refer $ translate rotate alpha
            quamolit.types :refer $ Component
            quamolit.math :refer $ bound-x
    'quamolit.app.comp.icon-play $ %{} 'FileEntry
      :defs $ {} $ 'comp-icon-play
        %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-icon-play (states)
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
                      d! cursor $ update state :play-value $ fn (pv)
                        bound-opacity $ + pv $ * elapsed v
                    if (> pv 0)
                      d! cursor $ update state :play-value $ fn (pv)
                        bound-opacity $ - pv $ * elapsed v
                rect
                  {} (:w 60) (:h 60)
                    :fill-style $ hsl 40 80 90
                    :event $ &{} :click $ fn (e d!)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.icon-play
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp path group rect
            quamolit.comp.debug :refer $ comp-debug
            quamolit.math :refer $ bound-opacity
    'quamolit.app.comp.icons-table $ %{} 'FileEntry
      :defs $ {} $ 'comp-icons-table
        %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-icons-table (states)
            group ({})
              translate (&{} :x -200)
                comp-icon-increase $ >> states :increase
              translate (&{} :x 0)
                comp-icon-play $ >> states :play
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.icons-table
          :require
            quamolit.alias :refer $ defcomp text line group >>
            quamolit.render.element :refer $ translate
            quamolit.app.comp.icon-increase :refer $ comp-icon-increase
            quamolit.app.comp.icon-play :refer $ comp-icon-play
    'quamolit.app.comp.portal $ %{} 'FileEntry
      :defs $ {}
        'comp-portal $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-portal (cursor)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
        'handle-navigate $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn handle-navigate (cursor next-page)
            fn (e d!)
              d! cursor $ {} $ :tab next-page
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'style-button $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn style-button (x y page-name bg-color handler)
            {} (:w 180) (:h 60)
              :x $ - (* x 240) 400
              :y $ - (* y 100) 200
              :surface-color bg-color
              :text page-name
              :text-color $ hsl 0 0 100
              :event $ {} $ :click handler
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic 'Dynamic 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.portal
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp group rect text
            quamolit.render.element :refer $ alpha translate button
    'quamolit.app.comp.raindrop $ %{} 'FileEntry
      :defs $ {} $ 'comp-raindrop
        %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-raindrop (states key position on-earth)
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
                  d! cursor $ update state :dy $ fn (dy)
                    + dy $ * elapsed 100
                  if
                    >
                      + (:y position) (:dy state)
                      , earth
                    on-earth key d!
                let
                    dy $ :dy state
                    y $ + (:y position) dy
                    dropped? $ >= y $ - earth 40
                  alpha
                    {} $ :opacity $ cond
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.raindrop
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp rect
            quamolit.render.element :refer $ translate alpha
            quamolit.util.time :refer $ get-tick
            |@calcit/std :refer $ rand
    'quamolit.app.comp.raining $ %{} 'FileEntry
      :defs $ {}
        'comp-raining $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-raining (states)
            let
                cursor $ :cursor states
                state $ assert-type
                    get states :data
                    , .unwrap-or $ random-rains 40
                  :: 'List 'Dynamic
                on-earth $ fn (key d!)
                  d! cursor $ -> state $
                    filter
                    fn (pair)
                      not=
                        assert-type
                            first pair
                            , .unwrap-or -1
                          , 'Number
                        assert-type key 'Number
              ; js/console.log $ pr-str state
              []
                fn (elapsed d!)
                  if
                    nil? $ :data states
                    d! cursor state
                    if
                      > (rand 10) 7
                      let
                          new-state $ concat state $ random-rains 3
                        d! cursor new-state
                        d! :gc-states $ [] cursor $
                          map
                          , new-state first
                list-> ({})
                  -> state $ map $ fn (entry)
                    let
                        child-key $ first entry
                        position $ last entry
                      [] child-key $ comp-raindrop (>> states child-key) child-key position on-earth
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] $ :: 'Map 'Tag 'Dynamic
            :features $ #{} :js-ffi
        'random-rains $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn random-rains (n)
            map (range n)
              fn (x)
                [] (rand 1000)
                  {}
                    :x $ - (rand 1000) 500
                    :y $ - (rand 200) 400
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number
            :return $ :: 'List 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.raining
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp rect group >> list->
            quamolit.app.comp.raindrop :refer $ comp-raindrop
            quamolit.hud-logs :refer $ hud-log
            |@calcit/std :refer $ rand
    'quamolit.app.comp.ring $ %{} 'FileEntry
      :defs $ {}
        'comp-ring $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-ring (states)
            let
                cursor $ :cursor states
                state $ or (:data states) 0
                n 32
                unit $ * 2 $ / &PI n
                shift 10
                rotation $ &number:rem state 360
                r 60
                rl 360
                curve-points $ -> (range n)
                  map $ fn (x)
                    let
                        this-angle $ * unit $ inc x
                        angle-1 $ + (- this-angle rotation unit) shift
                        angle-2 $ - (+ this-angle rotation) shift
                      []
                        * rl $ sin angle-1
                        negate $ * rl $ cos angle-1
                        * rl $ sin angle-2
                        negate $ * rl $ cos angle-2
                        * r $ sin this-angle
                        negate $ * r $ cos this-angle
              ; hud-log state
              []
                fn (elapsed d!)
                  d! cursor $ + state $ * elapsed 0.3
                group ({})
                  path $ {}
                    :points $ concat
                      [] $ [] 0 $ - 0 r
                      , curve-points
                    :line-width 1
                    :stroke-style $ hsl 300 80 60
                  comp-debug (js/Math.floor rotation) ({})
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
            :features $ #{} :js-ffi
        'cos $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn cos (x)
            js/Math.cos $ * js/Math.PI $ / x 180
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
            :features $ #{} :js-ffi
        'sin $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sin (x)
            js/Math.sin $ * js/Math.PI $ / x 180
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.ring
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp group path
            quamolit.comp.debug :refer $ comp-debug
            quamolit.hud-logs :refer $ hud-log
    'quamolit.app.comp.solar $ %{} 'FileEntry
      :defs $ {}
        'comp-solar $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-solar (states level)
            ; js/console.log :tick $ / tick 10
            let
                cursor $ :cursor states
                state $ assert-type
                    get states :data
                    , .unwrap-or 0
                  , 'Number
              []
                fn (elapsed d!)
                  d! cursor $ + state $ * elapsed 100
                rotate
                  &{} :angle $ &number:rem state 360
                  arc style-large
                  translate (&{} :x 100 :y -40) (arc style-small)
                  if (> level 0)
                    scale (&{} :ratio 0.6)
                      translate (&{} :x 260 :y 40)
                        comp-solar (>> states :next) (- level 1)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] (:: 'Map 'Tag 'Dynamic) 'Number
            :features $ #{} :js-ffi
        'style-large $ %{} 'CodeEntry (:doc |)
          :code $ quote $ def style-large
            {}
              :fill-style $ hsl 80 80 80
              :stroke-style $ hsl 200 50 60 0.5
              :line-width 1
              :r 60
          :examples $ []
          :schema $ :: 'Dynamic
        'style-small $ %{} 'CodeEntry (:doc |)
          :code $ quote $ def style-small
            {}
              :fill-style $ hsl 200 80 80
              :r 30
          :examples $ []
          :schema $ :: 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.solar
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp group rect arc >>
            quamolit.render.element :refer $ rotate translate scale
    'quamolit.app.comp.task $ %{} 'FileEntry
      :defs $ {}
        'comp-task $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-task (states task idx shift-x presence stage add-orphin rm-orphin)
            let
                cursor $ :cursor states
                state $ assert-type
                    get states :data
                    , .unwrap-or $ {} (:left 0) (:idx 0)
                  :: 'Map 'Tag 'Dynamic
                v 5
              []
                fn (elapsed d!)
                  let
                      old-idx $ assert-type
                          get state :idx
                          , .unwrap-or 0
                        , 'Number
                      new-idx $ cond
                          > idx old-idx
                          bound-x 0 idx $ + old-idx $ * elapsed v
                        (< idx old-idx)
                          bound-x idx 100 $ - old-idx $ * elapsed v
                        true old-idx
                      new-left $ case-default stage 0 (:show 0) (:hidden -40)
                        :showing $ bound-x -40 0 $ - (* 40 presence) 40
                        :hiding $ bound-x -40 0 $ - (* 40 presence) 40
                    if
                      or (not= old-idx new-idx)
                        not= new-left $ assert-type
                            get state :left
                            , .unwrap-or 0
                          , 'Number
                      d! cursor $ -> state (assoc :left new-left) (assoc :idx new-idx)
                    if
                      and (= stage :hiding) (= new-left -40)
                      do (; println |removed)
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
                      , :event $ &{} :click
                        handle-input (:id task) (:text task)
                    translate (&{} :x 280)
                      rect $ assoc style-remove :event $ {}
                        :click $ fn (e d!)
                          add-orphin (:id task) d!
                          d! :rm $ :id task
                    ; comp-debug task $ {} $ :y 20
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] (:: 'Map 'Tag 'Dynamic) (:: 'Map 'Tag 'Dynamic) 'Number 'Number 'Number 'Tag 'Dynamic 'Dynamic
        'handle-input $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn handle-input (task-id task-text)
            fn (e dispatch)
              let
                  event $ unsafe-coerce e js-ffi.browser/MouseEventHost
                prompt-at!
                  [] (:page-x event) (:page-y event)
                  {} $ :initial task-text
                  fn (new-text)
                    dispatch :update $ [] task-id new-text
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'style-block $ %{} 'CodeEntry (:doc |)
          :code $ quote $ def style-block
            {} (:w 300) (:h 40)
              :fill-style $ hsl 40 80 80
          :examples $ []
          :schema $ :: 'Dynamic
        'style-input $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn style-input (text)
            {} (:w 400) (:h 40) (:x 40) (:y 0)
              :fill-style $ hsl 0 0 60
              :text text
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
        'style-remove $ %{} 'CodeEntry (:doc |)
          :code $ quote $ def style-remove
            {} (:w 40) (:h 40)
              :fill-style $ hsl 0 80 40
          :examples $ []
          :schema $ :: 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.task
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp group rect >>
            quamolit.render.element :refer $ translate alpha input
            quamolit.app.comp.task-toggler :refer $ comp-toggler
            quamolit.comp.debug :refer $ comp-debug
            quamolit.math :refer $ bound-x bound-opacity
            pointed-prompt.core :refer $ prompt-at!
            js-ffi.browser :as js-browser
    'quamolit.app.comp.task-toggler $ %{} 'FileEntry
      :defs $ {} $ 'comp-toggler
        %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-toggler (states done? task-id)
            let
                cursor $ :cursor states
                state $ or (:data states) 0
                v 4
              ; js/console.log |done: done? state
              []
                fn (elapsed d!)
                  if done?
                    if (< state 1)
                      d! cursor $ bound-opacity $ + state (* v elapsed)
                    if (> state 0)
                      d! cursor $ bound-opacity $ - state (* v elapsed)
                rect $ {} (:w 40) (:h 40)
                  :fill-style $ hsl
                    + 240 $ * 120 state
                    , 80 60
                  :event $ {} $ :click
                    fn (e d!) (d! :toggle task-id)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.task-toggler
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp group rect
            quamolit.math :refer $ bound-x bound-opacity
    'quamolit.app.comp.todolist $ %{} 'FileEntry
      :defs $ {}
        'comp-todolist $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-todolist (states tasks presence stage) (; js/console.info |todolist: states)
            let
                cursor $ :cursor states
                state $ assert-type
                    get states :data
                    , .unwrap-or $ {} (:draft |)
                      :orphins $ []
                  :: 'Map 'Tag 'Dynamic
                add-orphin $ fn (task-id d!)
                  d! cursor $ update state :orphins $ fn (xs)
                    conj
                      assert-type xs $ :: 'List 'Dynamic
                      , task-id
                rm-orphin $ fn (task-id d!)
                  d! cursor $ update state :orphins $ fn (xs)
                    ->
                      assert-type xs $ :: 'List 'Dynamic
                      filter $ fn (x) (not= x task-id)
              [] nil $ alpha (&{} :opacity 0.8)
                translate position-header
                  translate (&{} :x -20 :y 40)
                    input $ &{} :w 400 :h 40 :text (:draft state) :event $ &{} :click
                      fn (e d!)
                        prompt-at!
                          [] (.-pageX e) (.-pageY e)
                          {} $ :initial $ :draft state
                          fn (user-text)
                            d! cursor $ assoc state :draft user-text
                  translate (&{} :x 240 :y 40)
                    button $ assoc style-button :event $ {}
                      :click $ fn (e d!)
                        d! :add $ :draft state
                        d! cursor $ -> state $ assoc :draft |
                translate position-body
                  group ({}) & $ -> (tasks) (reverse)
                    map-indexed $ fn (idx task)
                      let
                          shift-x $ case-default stage 0 (:hidden -40) (:show 0)
                            :showing $ bound-x -40 0 $ -> presence (* 3) (- 1)
                              - $ * idx $ / 2 (count tasks)
                              * 40
                            :hiding $ bound-x -40 0 $ -> presence (* 3) (- 1)
                              - $ *
                                - (count tasks) idx 1
                                / 2 $ count tasks
                              * 40
                        comp-fade-fn
                          >> states $ :id task
                          {}
                          fn (renderer-states opacity stage)
                            comp-task renderer-states task idx shift-x opacity stage add-orphin rm-orphin
                  group ({}) & $ -> (:orphins state)
                    map $ fn (task-id)
                      comp-fade-fn (>> states task-id) ({})
                        fn (opacity stage renderer-states) nil
                ; comp-debug state $ {}
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] (:: 'Map 'Tag 'Dynamic) (:: 'List 'Dynamic) 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'handle-click $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn handle-click (simple-event dispatch set-state) (.log js/console simple-event)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'position-body $ %{} 'CodeEntry (:doc |)
          :code $ quote $ def position-body
            {} (:x 0) (:y 0)
          :examples $ []
          :schema $ :: 'Dynamic
        'position-header $ %{} 'CodeEntry (:doc |)
          :code $ quote $ def position-header
            {} (:x 0) (:y -240)
          :examples $ []
          :schema $ :: 'Dynamic
        'style-button $ %{} 'CodeEntry (:doc |)
          :code $ quote $ def style-button
            {} (:w 80) (:h 40) (:text |add)
          :examples $ []
          :schema $ :: 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.comp.todolist
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp group rect text >>
            quamolit.render.element :refer $ translate button input alpha
            quamolit.app.comp.task :refer $ comp-task
            quamolit.app.comp.debug :refer $ comp-debug
            quamolit.math :refer $ bound-x
            quamolit.comp.fade-in-out :refer $ comp-fade-fn
            pointed-prompt.core :refer $ prompt-at!
    'quamolit.app.main $ %{} 'FileEntry
      :defs $ {}
        '*raq-loop $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *raq-loop nil
          :examples $ []
          :schema $ :: 'Dynamic
        '*render-loop $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *render-loop nil
          :examples $ []
          :schema $ :: 'Dynamic
        '*store $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *store
            schema/Store :states ({}) :tasks $ []
          :examples $ []
          :schema $ :: 'Dynamic
        'dispatch! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn dispatch! (op op-data)
            if (list? op)
              recur :states $ [] op op-data
              do (; println |dispatch op op-data) (; js/console.log @*store)
                let
                    new-tick $ get-tick
                    new-store $ updater @*store op op-data new-tick
                  reset! *store new-store
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'main! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn main! () (load-console-formatter!)
            let
                maybe-target $ js/document.querySelector |#app
              if (js-present? maybe-target)
                let
                    target $ unsafe-coerce maybe-target JsObject
                  configure-canvas target
                  setup-events target dispatch!
                  render-loop! 0
                  render-control!
                  start-control-loop! 8 on-control-event
                raise |missing-#app-canvas
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ []
            :features $ #{} :js-ffi
        'mount-target $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn mount-target ()
            unsafe-coerce (js/document.querySelector |#app) JsObject
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'JsObject)
            :args $ []
            :features $ #{} :js-ffi
        'reload! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reload! ()
            if (nil? build-errors)
              do (js/clearTimeout @*render-loop) (js/cancelAnimationFrame @*raq-loop) (render-loop! 0) (replace-control-loop! 8 on-control-event) (js/console.log "|code updated.") (hud! |ok~ |Ok)
              hud! |error build-errors
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ []
            :features $ #{} :js-ffi
        'render-loop! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn render-loop! (t) (; js/console.log |store @*store)
            render-page (comp-container @*store) (mount-target) dispatch!
            if config/dev?
              reset! *render-loop $ js/setTimeout
                fn () $ reset! *raq-loop $ js/requestAnimationFrame render-loop!
                , 9
              reset! *raq-loop $ js/requestAnimationFrame render-loop!
            ; reset! *raq-loop $ js/requestAnimationFrame render-loop!
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'Number
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.main
          :require
            quamolit.app.comp.container :refer $ comp-container
            quamolit.core :refer $ render-page configure-canvas setup-events on-control-event
            quamolit.util.time :refer $ get-tick
            quamolit.app.updater :refer $ updater
            |./calcit.build-errors :default build-errors
            |bottom-tip :default hud!
            quamolit.config :as config
            touch-control.core :refer $ render-control! start-control-loop! replace-control-loop!
            quamolit.app.schema :as schema
    'quamolit.app.schema $ %{} 'FileEntry
      :defs $ {}
        'Store $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct Store (:states 'Dynamic)
            :tasks $ :: 'List 'Task
          :examples $ []
          :schema $ :: 'StructDef
        'Task $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct Task (:id 'Dynamic) (:text 'String) (:done? 'Bool)
          :examples $ []
          :schema $ :: 'StructDef
        'task $ %{} 'CodeEntry (:doc |)
          :code $ quote $ def task (Task :id nil :text | :done? false)
          :examples $ []
          :schema $ :: 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.schema
    'quamolit.app.updater $ %{} 'FileEntry
      :defs $ {}
        'task-add $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn task-add (store op-data tick)
            assoc store :tasks $ conj (:tasks store) (schema/Task :id tick :text op-data :done? false)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.app.schema/Store)
            :args $ [] 'quamolit.app.schema/Store 'String 'Number
        'task-rm $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn task-rm (store op-data tick)
            assoc store :tasks $ filter (:tasks store)
              fn (task)
                not= op-data $ :id task
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.app.schema/Store)
            :args $ [] 'quamolit.app.schema/Store 'Dynamic 'Number
        'task-toggle $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn task-toggle (store op-data tick)
            assoc store :tasks $ map (:tasks store)
              fn (task)
                if
                  = op-data $ :id task
                  update task :done? not
                  , task
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.app.schema/Store)
            :args $ [] 'quamolit.app.schema/Store 'Dynamic 'Number
        'task-update $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn task-update (store op-data tick)
            let[] (task-id text) op-data $ &map:assoc store :tasks $ map (&map:get store :tasks)
              fn (task)
                if
                  = task-id $ &map:get task :id
                  &map:assoc task :text text
                  , task
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic
        'updater $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn updater (store op op-data tick) (; js/console.log "|store update:" op op-data tick)
            case-default op
              do (js/console.log "|unknown op" op) store
              :states $ update-states store op-data
              :gc-states $ gc-states store op-data
              :add $ task-add store op-data tick
              :rm $ task-rm store op-data tick
              :update $ task-update store op-data tick
              :toggle $ task-toggle store op-data tick
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.app.updater
          :require (quamolit.app.schema :as schema)
            quamolit.cursor :refer $ update-states gc-states
    'quamolit.bootstrap $ %{} 'FileEntry
      :defs $ {}
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
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.bootstrap
    'quamolit.canvas-reference $ %{} 'FileEntry
      :defs $ {}
        'InstancesMetrics $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct InstancesMetrics (:boundary-calls 'Number) (:canvas-calls 'Number) (:instances 'Number) (:position-bytes-read 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'color-css $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn color-css (color)
            hint-fn $ {}
              :args $ [] 'quamolit.motion/ColorRgba
              :return 'String
            str "|rgba("
              round $ * 255 $ :r color
              , |,
                round $ * 255 $ :g color
                , |,
                  round $ * 255 $ :b color
                  , |, (:a color) "|)"
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'String)
            :args $ [] 'quamolit.motion/ColorRgba
        'draw-content! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-content! (context content)
            match content
              (:rect rect)
                canvas/fill-solid-rect! context (:x rect) (:y rect) (:width rect) (:height rect)
                  color-css $ :fill rect
              (:polyline path) (draw-round-path! context path)
              (:group group) (raise |unsupported-reference-group)
              (:instances instances) (raise |unsupported-reference-instances)
              (:text text) (draw-text! context text)
            , &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.scene-ir/SceneContent
            :features $ #{} :js-ffi
        'draw-instances! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-instances! (context instances positions)
            hint-fn $ {}
              :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.scene-ir/InstanceNode 'JsObject
              :return 'quamolit.canvas-reference/InstancesMetrics
              :features $ #{} :js-ffi
            let
                result $ raw-draw-instances! (unsafe-coerce context JsObject) positions 0
                  :count $ :source instances
                  :width instances
                  :height instances
                  color-css $ :fill instances
                  , 1
                boundary-calls $ contract/expect-number |InstancesMetrics.boundaryCalls $ contract/object-field |InstancesMetrics.draw result |boundaryCalls
                canvas-calls $ contract/expect-number |InstancesMetrics.canvasCalls $ contract/object-field |InstancesMetrics.draw result |canvasCalls
                instances-count $ contract/expect-number |InstancesMetrics.instances $ contract/object-field |InstancesMetrics.draw result |instances
                bytes-read $ contract/expect-number |InstancesMetrics.positionBytesRead $ contract/object-field |InstancesMetrics.draw result |positionBytesRead
              InstancesMetrics :boundary-calls boundary-calls :canvas-calls canvas-calls :instances instances-count :position-bytes-read bytes-read
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.canvas-reference/InstancesMetrics)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.scene-ir/InstanceNode 'JsObject
            :features $ #{} :js-ffi
        'draw-reference! $ %{} 'CodeEntry
          :doc "|整场景预检后按声明顺序绘制顶层 rect/polyline；group、子节点和 instances 明确拒绝。调用方负责清屏、视口与绑定求值。"
          :code $ quote $ defn draw-reference! (context document)
            assert |invalid-reference-scene $ scene/validate-scene document
            assert |unsupported-reference-scene $ every? (:nodes document) supported-flat-node?
            each (:nodes document)
              fn (node)
                draw-content! context $ :content node
            , &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.scene-ir/SceneDocument
            :features $ #{} :js-ffi
        'draw-reference-rects! $ %{} 'CodeEntry
          :doc "|仅供基础 Scene IR 的纯色矩形参考画面使用；按节点顺序绘制矩形，当前不处理 group 语义或 instances。Quamolit 负责 Scene 遍历，js-ffi 只提供通用 Canvas 方法。"
          :code $ quote $ defn draw-reference-rects! (context document)
            hint-fn $ {}
              :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.scene-ir/SceneDocument
              :return 'Unit
              :features $ #{} :js-ffi
            each (:nodes document)
              fn (node)
                match (:content node)
                  (:rect rect)
                    canvas/fill-solid-rect! context (:x rect) (:y rect) (:width rect) (:height rect)
                      color-css $ :fill rect
                  (:group group) &unit
                  (:instances instances) &unit
                  (:polyline path) (raise |polyline-requires-draw-reference)
                  (:text text) (raise |text-requires-draw-reference)
            , &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.scene-ir/SceneDocument
            :features $ #{} :js-ffi
        'draw-round-path! $ %{} 'CodeEntry (:doc "|共享原生开放圆头/圆连接描边原语；零宽不绘制，保存样式但不保留当前 path。")
          :code $ quote $ defn draw-round-path! (context path)
            assert |invalid-scene-polyline $ scene/valid-polyline? path
            when
              > (:width path) 0
              context .save!
              js-set context :stroke-style $ color-css $ :stroke path
              js-set context :line-width $ :width path
              js-set context :line-cap |round
              js-set context :line-join |round
              context .begin-path!
              let
                  start $ &list:nth (:points path) 0
                context .move-to! (:x start) (:y start)
              each
                rest $ :points path
                fn (point)
                  context .line-to! (:x point) (:y point)
              context .stroke!
              context .restore!
            , &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.scene-ir/PolylineNode
            :features $ #{} :js-ffi
        'draw-text! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-text! (context text)
            do
              assert |invalid-scene-text $ scene/valid-content? $ scene/SceneContent :text text
              raw-fill-text! (unsafe-coerce context 'JsObject) (:text text) (:x text) (:y text) (:size text)
                color-css $ :fill text
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.scene-ir/TextNode
            :features $ #{} :js-ffi
        'raw-draw-instances! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn raw-draw-instances! (context positions start amount width height fill-style alpha) (raise |js-only-canvas-instances)
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
            :js $ {} $ :file |src/host/canvas-rect-batches.mjs
          :schema $ :: 'Fn $ {} (:return 'JsObject)
            :args $ [] 'JsObject 'JsObject 'Number 'Number 'Number 'Number 'String 'Number
            :features $ #{} :js-ffi
        'raw-fill-text! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn raw-fill-text! (context text x y size color) &unit
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
            :js $ {} $ :inline "|(ctx,text,x,y,size,color)=>{ctx.save();try{ctx.font=size+\"px monospace\";ctx.textAlign=\"left\";ctx.textBaseline=\"middle\";ctx.direction=\"ltr\";ctx.fillStyle=color;ctx.fillText(text,x,y);}finally{ctx.restore();}}"
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject 'String 'Number 'Number 'Number 'String
            :features $ #{} :js-ffi
        'supported-flat-node? $ %{} 'CodeEntry (:doc "|声明基础 Canvas 参考的支持集合；不能静默丢弃不支持的 Scene 节点。")
          :code $ quote $ defn supported-flat-node? (node)
            and
              empty? $ :parent node
              match (:content node)
                (:rect rect) true
                (:polyline path) true
                (:group group) false
                (:instances instances) false
                (:text text) true
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.scene-ir/SceneNode
      :ns $ %{} 'NsEntry
        :doc "|Calcit 编写的基础 Canvas2D 参考绘制；Scene 解释保留在 Quamolit，不在 js-ffi 宿主层。"
        :code $ quote $ ns quamolit.canvas-reference
          :require (js-ffi.canvas-batches :as canvas) (quamolit.scene-ir :as scene) (js-ffi.contract :as contract)
    'quamolit.canvas-strokes $ %{} 'FileEntry
      :defs $ {}
        'RoundPolyline $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct RoundPolyline (:id 'String)
            :points $ :: 'List 'quamolit.motion/Vec2
            :width 'Number
            :color 'quamolit.motion/ColorRgba
          :examples $ []
          :schema $ :: 'StructDef
        'StrokeSegment $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct StrokeSegment (:id 'String) (:x0 'Number) (:y0 'Number) (:x1 'Number) (:y1 'Number) (:width 'Number) (:color 'quamolit.motion/ColorRgba)
          :examples $ []
          :schema $ :: 'StructDef
        'draw-polyline! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-polyline! (context path)
            assert |invalid-round-polyline $ valid-polyline? path
            draw-round-path! context $ scene/PolylineNode :points (:points path) :width (:width path) :stroke $ :color path
            , &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.canvas-strokes/RoundPolyline
            :features $ #{} :js-ffi
        'draw-polylines! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-polylines! (context paths)
            assert |invalid-round-polylines $ every? paths valid-polyline?
            each paths $ fn (path) (draw-polyline! context path)
            , &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost $ :: 'List 'quamolit.canvas-strokes/RoundPolyline
            :features $ #{} :js-ffi
        'draw-segment! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-segment! (context segment)
            let
                dx $ - (:x1 segment) (:x0 segment)
                dy $ - (:y1 segment) (:y0 segment)
                length $ sqrt $ + (* dx dx) (* dy dy)
              when (> length 0) (context .save!)
                context .transform! (/ dx length) (/ dy length)
                  - 0 $ / dy length
                  / dx length
                  :x0 segment
                  :y0 segment
                canvas/fill-solid-rect! context 0
                  - 0 $ / (:width segment) 2
                  , length (:width segment)
                    color-css $ :color segment
                context .restore!
              , &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.canvas-strokes/StrokeSegment
            :features $ #{} :js-ffi
        'draw-segments! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-segments! (context segments)
            assert |invalid-stroke-segment $ every? segments valid-segment?
            each segments $ fn (segment) (draw-segment! context segment)
            , &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost $ :: 'List 'quamolit.canvas-strokes/StrokeSegment
            :features $ #{} :js-ffi
        'valid-polyline? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn valid-polyline? (path)
            and
              >=
                count $ :points path
                , 2
              every? (:points path) motion/finite-vec2?
              motion/finite-number? $ :width path
              >= (:width path) 0
              motion/valid-color? $ :color path
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.canvas-strokes/RoundPolyline
        'valid-segment? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn valid-segment? (segment)
            and
              motion/finite-number? $ :x0 segment
              motion/finite-number? $ :y0 segment
              motion/finite-number? $ :x1 segment
              motion/finite-number? $ :y1 segment
              motion/finite-number? $ :width segment
              >= (:width segment) 0
              motion/valid-color? $ :color segment
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.canvas-strokes/StrokeSegment
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.canvas-strokes
          :require (js-ffi.canvas-batches :as canvas)
            quamolit.canvas-reference :refer $ color-css draw-round-path!
            quamolit.motion :as motion
            quamolit.scene-ir :as scene
    'quamolit.comp.debug $ %{} 'FileEntry
      :defs $ {}
        'comp-debug $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-debug (data more-style)
            let
                style $ -> default-style (merge more-style)
                  assoc :text $ if (instance? js/Date data) (js/JSON.stringify data) (to-lispy-string data)
              text style
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic $ :: 'Map 'Tag 'Dynamic
            :features $ #{} :js-ffi
        'default-style $ %{} 'CodeEntry (:doc |)
          :code $ quote $ def default-style
            {} (:x 0) (:y 0)
              :fill-style $ hsl 0 0 0 0.5
              :font-family |Menlo
              :size 12
              :max-width 600
          :examples $ []
          :schema $ :: 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.comp.debug
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp rect text
            quamolit.render.element :refer $ alpha translate button
    'quamolit.comp.fade-in-out $ %{} 'FileEntry
      :defs $ {}
        '*nodes-cache $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *nodes-cache ({})
          :examples $ []
          :schema $ :: 'Ref $ :: 'Map 'Dynamic 'Dynamic
        'comp-fade-fn $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-fade-fn (states props f1)
            let
                cursor $ :cursor states
                v 4
                state $ assert-type
                    get states :data
                    , .unwrap-or $ {} (:stage :hidden) (:opacity 0)
                  :: 'Map 'Tag 'Dynamic
                p1 $ f1 (>> states :renderer) (:opacity state)
                  wo-log $ :stage state
              []
                fn (elapsed d!)
                  case-default (:stage state)
                    println "|unknown stage" $ :stage state
                    :hidden $ when (some? p1)
                      d! cursor $ merge state $ {} (:stage :showing)
                        :opacity $ + (* elapsed v) 0
                      write-node-cache! cursor f1
                    :showing $ do
                      if
                        >= (:opacity state) 1
                        d! cursor $ {} (:stage :show) (:opacity 1)
                        d! cursor $ -> state $ update :opacity
                          fn (x)
                            + x $ * elapsed v
                      write-node-cache! cursor f1
                    :show $ if (nil? p1)
                      d! cursor $ {} (:stage :hiding)
                        :opacity $ - 1 $ * elapsed v
                      write-node-cache! cursor f1
                    :hiding $ if
                      <= (:opacity state) 0
                      do
                        d! cursor $ {} (:stage :hidden) (:opacity 0.01)
                        delete-node-cache! cursor
                      d! cursor $ update state :opacity $ fn (x)
                        - x $ * elapsed v
                alpha
                  {} $ :opacity $ :opacity state
                  case-default (:stage state)
                    either p1 $ &let
                      old-f $ get-node! cursor
                      if (some? old-f)
                        old-f (>> states :renderer) (:opacity state) (:stage state)
                    :hidden nil
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] (:: 'Map 'Tag 'Dynamic) 'Dynamic 'Dynamic
        'comp-fade-in-out $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-fade-in-out (states props p1)
            let
                cursor $ :cursor states
                v 4
                state $ assert-type
                    get states :data
                    , .unwrap-or $ {} (:stage :hidden) (:opacity 0)
                  :: 'Map 'Tag 'Dynamic
              []
                fn (elapsed d!)
                  case-default (:stage state)
                    println "|unknown stage" $ :stage state
                    :hidden $ when (some? p1)
                      d! cursor $ merge state $ {} (:stage :showing)
                        :opacity $ + (* elapsed v) 0
                      write-node-cache! cursor p1
                    :showing $ if
                      >= (:opacity state) 1
                      do
                        d! cursor $ {} (:stage :show) (:opacity 1)
                        write-node-cache! cursor p1
                      d! cursor $ update state :opacity $ fn (x)
                        + x $ * elapsed v
                    :show $ if (nil? p1)
                      d! cursor $ {} (:stage :hiding)
                        :opacity $ - 1 $ * elapsed v
                      write-node-cache! cursor p1
                    :hiding $ if
                      <= (:opacity state) 0
                      do
                        d! cursor $ {} (:stage :hidden) (:opacity 0.01)
                        delete-node-cache! cursor
                      d! cursor $ update state :opacity $ fn (x)
                        - x $ * elapsed v
                alpha
                  {} $ :opacity $ :opacity state
                  case-default (:stage state)
                    either p1 $ get-node! cursor
                    :hidden nil
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] (:: 'Map 'Tag 'Dynamic) 'Dynamic 'Dynamic
        'delete-node-cache! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn delete-node-cache! (path)
            swap! *nodes-cache $ fn (nodes) (dissoc nodes path)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
        'get-node! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn get-node! (path) (get @*nodes-cache path)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
        'write-node-cache! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn write-node-cache! (path node)
            swap! *nodes-cache $ fn (nodes) (assoc nodes path node)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.comp.fade-in-out
          :require
            quamolit.alias :refer $ defcomp >>
            quamolit.render.element :refer $ alpha
    'quamolit.comp.slider $ %{} 'FileEntry
      :defs $ {} $ 'comp-slider
        %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp comp-slider (states options)
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
                    d! cursor $ {} $ :local
                      new-ref $ {}
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
                            local $ ref-get $ :local state
                            dx $ - (.-clientX e) (:x0 local)
                            on-change $ :on-change options
                          if (fn? on-change)
                            let
                                next-v $ bound-x v-min v-max $ + (:v0 local) (* dx unit)
                              if
                                not= next-v $ :v options
                                on-change next-v d!
                  text $ {} (:x -36) (:y -20) (:text-align :left) (:size 14)
                    :fill-style $ hsl 330 90 70
                    :text $ str
                      or (:title options) |Val
                      , "|: " $ .!toFixed
                        either (:value options) 0
                        , 2
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.comp.slider
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp rect group line >> text
            quamolit.render.element :refer $ alpha translate
            quamolit.comp.fade-in-out :refer $ comp-fade-in-out comp-fade-fn
            quamolit.math :refer $ bound-01 bound-x
            |@calcit/std :refer $ rand
            quamolit.util.ref :refer $ new-ref ref-get ref-set!
    'quamolit.component-sample $ %{} 'FileEntry
      :defs $ {}
        'ComponentDeclaration $ %{} 'CodeEntry
          :doc "|声明式组件返回的 Scene 与版本化 Motion 描述列表；纯逻辑数据，不含宿主句柄或闭包。"
          :code $ quote $ defstruct ComponentDeclaration (:scene 'quamolit.scene-ir/SceneDocument)
            :motions $ :: 'List 'quamolit.motion/ScalarDescriptor
          :examples $ []
          :schema $ :: 'StructDef
        'ComponentRequest $ %{} 'CodeEntry (:doc "|组件一次采样的显式身份、时间、六类依赖版本以及 props/Model/输入/资源/视口快照。")
          :code $ quote $ defstruct ComponentRequest ([] 'P 'M 'I 'R 'V) (:id 'String) (:time 'Number) (:versions 'quamolit.direct-frame/FrameVersions) (:props 'P) (:model 'M) (:input 'I) (:resources 'R) (:viewport 'V)
          :examples $ []
          :schema $ :: 'StructDef
        'resample-component-at $ %{} 'CodeEntry (:doc "|仅当组件身份、绝对时间与六类版本全相同时复用上一帧；调用方负责真实依赖版本。")
          :code $ quote $ defn resample-component-at (previous request declare)
            direct/resample-at previous (to-direct-request request)
              fn (props model input resources viewport time)
                resolve-declaration (declare props model input resources viewport) time
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.direct-frame/DirectFrame 'quamolit.scene-ir/SceneDocument) (:: 'quamolit.component-sample/ComponentRequest 'P 'M 'I 'R 'V)
              :: 'Fn $ {} (:return 'quamolit.component-sample/ComponentDeclaration)
                :args $ [] 'P 'M 'I 'R 'V
            :generics $ [] 'P 'M 'I 'R 'V
            :return $ :: 'quamolit.direct-frame/DirectFrame 'quamolit.scene-ir/SceneDocument
        'resample-component-at-host $ %{} 'CodeEntry (:doc "|宿主时钟映射后按完整版本判断可否复用组件帧；同时间资源 ready 必须更新版本。")
          :code $ quote $ defn resample-component-at-host (previous timeline host-time request declare)
            playback/resample-at-host previous timeline host-time (to-direct-request request)
              fn (props model input resources viewport time)
                resolve-declaration (declare props model input resources viewport) time
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.direct-frame/DirectFrame 'quamolit.scene-ir/SceneDocument) 'quamolit.host-clock/HostClock 'Number (:: 'quamolit.component-sample/ComponentRequest 'P 'M 'I 'R 'V)
              :: 'Fn $ {} (:return 'quamolit.component-sample/ComponentDeclaration)
                :args $ [] 'P 'M 'I 'R 'V
            :generics $ [] 'P 'M 'I 'R 'V
            :return $ :: 'quamolit.direct-frame/DirectFrame 'quamolit.scene-ir/SceneDocument
        'resolve-declaration $ %{} 'CodeEntry (:doc "|按绝对时间解析组件声明中的 Scene 标量绑定；CPU 全量正确性参考。")
          :code $ quote $ defn resolve-declaration (declaration time)
            binding/resolve-scene (:scene declaration) (:motions declaration) time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'quamolit.component-sample/ComponentDeclaration 'Number
        'sample-component-at $ %{} 'CodeEntry (:doc "|从完整组件输入重新声明并直接采样任意有限时间，不读取上一帧或推进模拟。")
          :code $ quote $ defn sample-component-at (request declare)
            direct/sample-at (to-direct-request request)
              fn (props model input resources viewport time)
                resolve-declaration (declare props model input resources viewport) time
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.component-sample/ComponentRequest 'P 'M 'I 'R 'V)
              :: 'Fn $ {} (:return 'quamolit.component-sample/ComponentDeclaration)
                :args $ [] 'P 'M 'I 'R 'V
            :generics $ [] 'P 'M 'I 'R 'V
            :return $ :: 'quamolit.direct-frame/DirectFrame 'quamolit.scene-ir/SceneDocument
        'sample-component-at-host $ %{} 'CodeEntry (:doc "|先映射显式宿主时钟再直接采样声明式组件；暂停和 seek 不会推进模拟。")
          :code $ quote $ defn sample-component-at-host (timeline host-time request declare)
            playback/sample-at-host timeline host-time (to-direct-request request)
              fn (props model input resources viewport time)
                resolve-declaration (declare props model input resources viewport) time
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.host-clock/HostClock 'Number (:: 'quamolit.component-sample/ComponentRequest 'P 'M 'I 'R 'V)
              :: 'Fn $ {} (:return 'quamolit.component-sample/ComponentDeclaration)
                :args $ [] 'P 'M 'I 'R 'V
            :generics $ [] 'P 'M 'I 'R 'V
            :return $ :: 'quamolit.direct-frame/DirectFrame 'quamolit.scene-ir/SceneDocument
        'to-direct-request $ %{} 'CodeEntry (:doc "|把组件 props 映射到通用直接采样请求的描述输入；只做不可变数据转换。")
          :code $ quote $ defn to-direct-request (request)
            direct/DirectRequest :id (:id request) :time (:time request) :versions (:versions request) :motion (:props request) :model (:model request) :input (:input request) :resources (:resources request) :viewport $ :viewport request
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] $ :: 'quamolit.component-sample/ComponentRequest 'P 'M 'I 'R 'V
            :generics $ [] 'P 'M 'I 'R 'V
            :return $ :: 'quamolit.direct-frame/DirectRequest 'P 'M 'I 'R 'V
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.component-sample
          :require (quamolit.direct-frame :as direct) (quamolit.scene-ir :as scene-ir) (quamolit.scene-binding :as binding) (quamolit.motion :as motion) (quamolit.host-clock :as clock) (quamolit.playback :as playback)
            calcit.test :refer $ is= is-throws
    'quamolit.config $ %{} 'FileEntry
      :defs $ {} $ 'dev?
        %{} 'CodeEntry (:doc |)
          :code $ quote $ def dev?
            = |dev $ get-env |mode |release
          :examples $ []
          :schema $ :: 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.config
    'quamolit.controller.resolve $ %{} 'FileEntry
      :defs $ {}
        'locate-target $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn locate-target (tree coord)
            if (empty? coord) (%some tree)
              let
                  first-pos $ option:unwrap-or (first coord) nil
                if (&struct:matches? Component tree)
                  if
                    = first-pos $ :name tree
                    recur (:tree tree) (slice coord 1)
                    %none
                  let
                      picked-pair $ find (:children tree)
                        fn (child-pair)
                          =
                            option:unwrap-or (first child-pair) nil
                            , first-pos
                      picked $ picked-pair.map $ fn (pair)
                        option:unwrap-or (last pair) nil
                    match picked
                      (:some value)
                        recur value $ slice coord 1
                      (:none) (%none)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Dynamic $ :: 'List 'Dynamic
            :return $ :: 'Option 'Dynamic
        'resolve-target $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn resolve-target (tree event-name coord)
            match (locate-target tree coord)
              (:some target)
                let
                    maybe-listener $ if
                      and (&struct:matches? Shape target)
                        some? $ :event target
                      get-in target $ [] :event event-name
                      %none
                  match maybe-listener
                    (:some listener) (%some listener)
                    (:none)
                      if
                        = 0 $ count coord
                        %none
                        recur tree event-name $ slice coord 0 $ - (count coord) 1
              (:none) (%none)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Dynamic 'Tag $ :: 'List 'Dynamic
            :return $ :: 'Option 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.controller.resolve
          :require $ quamolit.types :refer $ Component Shape
    'quamolit.core $ %{} 'FileEntry
      :defs $ {}
        '*clicked-focus $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *clicked-focus ([])
          :examples $ []
          :schema $ :: 'Dynamic
        '*drag-moving-cache $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *drag-moving-cache ([] 0 0)
          :examples $ []
          :schema $ :: 'Dynamic
        '*element-tree $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *element-tree nil
          :examples $ []
          :schema $ :: 'Dynamic
        '*last-tick $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *last-tick (get-tick)
          :examples $ []
          :schema $ :: 'Dynamic
        'CanvasContextHost $ %{} 'CodeEntry (:doc |)
          :code $ quote $ deftrait CanvasContextHost
            .scale $ :: 'Fn $ {}
              :args $ [] 'CanvasContextHost 'Number 'Number
              :return 'Unit
            .translate $ :: 'Fn $ {}
              :args $ [] 'CanvasContextHost 'Number 'Number
              :return 'Unit
            .clearRect $ :: 'Fn $ {}
              :args $ [] 'CanvasContextHost 'Number 'Number 'Number 'Number
              :return 'Unit
          :examples $ []
          :ffi $ {} (:backend :js) (:kind :external-object) (:target :browser)
          :schema $ :: 'Trait
        'CanvasHost $ %{} 'CodeEntry (:doc |)
          :code $ quote $ deftrait CanvasHost (:width 'Number) (:height 'Number)
            .style $ :: 'Fn $ {}
              :args $ [] 'CanvasHost
              :return 'CanvasStyleHost
            .get-context $ :: 'Fn $ {}
              :args $ [] 'CanvasHost 'String
              :return 'CanvasContextHost
          :examples $ []
          :ffi $ {} (:backend :js) (:kind :external-object) (:target :browser)
            :writable $ #{} :height :width
          :schema $ :: 'Trait
        'CanvasStyleHost $ %{} 'CodeEntry (:doc |)
          :code $ quote $ deftrait CanvasStyleHost (:width 'String) (:height 'String)
          :examples $ []
          :ffi $ {} (:backend :js) (:kind :external-object) (:target :browser)
            :writable $ #{} :height :width
          :schema $ :: 'Trait
        'EventHost $ %{} 'CodeEntry (:doc |)
          :code $ quote $ deftrait EventHost (:clientX 'Number) (:clientY 'Number) (:offsetX 'Number) (:offsetY 'Number) (:deltaY 'Number) (:metaKey 'Bool) (:ctrlKey 'Bool) (:shiftKey 'Bool)
            .preventDefault $ :: 'Fn $ {}
              :args $ [] 'EventHost
              :return 'Unit
          :examples $ []
          :ffi $ {} (:backend :js) (:kind :external-object) (:target :browser)
          :schema $ :: 'Trait
        'EventTargetHost $ %{} 'CodeEntry (:doc |)
          :code $ quote $ deftrait EventTargetHost
            .addEventListener $ :: 'Fn $ {}
              :args $ [] 'EventTargetHost 'String $ :: 'Fn
                {}
                  :args $ [] 'EventHost
                  :return 'Dynamic
              :return 'Unit
          :examples $ []
          :ffi $ {} (:backend :js) (:kind :external-object) (:target :browser)
          :schema $ :: 'Trait
        'advance-frame-clock! $ %{} 'CodeEntry
          :doc "|Advance the absolute animation clock in seconds and return elapsed seconds. Reject backward time; use reset-frame-clock! to seek."
          :code $ quote $ defn advance-frame-clock! (seconds)
            let
                elapsed $ :elapsed $ step-frame @*last-tick seconds
              reset! *last-tick seconds
              , elapsed
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'call-paint $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn call-paint (tree target dispatch! elapsed tick?) (; js/console.log tree)
            let
                ctx $ unsafe-coerce (.!getContext target |2d) 'CanvasContextHost
                w js/window.innerWidth
                h js/window.innerHeight
                viewer-shift $ :move @*stage-config
                viewer-scale $ :scale @*stage-config
              reset! *touch-event-areas nil
              .clearRect ctx 0 0 w h
              ; .!save ctx
              .translate ctx
                &+ (* 0.5 w) (first viewer-shift)
                &+ (* 0.5 h) (nth viewer-shift 1)
              .scale ctx viewer-scale viewer-scale
              swap! *tracked-transform update :offset $ fn (point) (point-add point viewer-shift)
              swap! *tracked-transform update :transform $ fn (point)
                point-times point $ [] viewer-scale 0
              paint ctx tree ([]) dispatch! elapsed tick?
              let
                  scale-back $ &/ 1 viewer-scale
                .scale ctx scale-back scale-back
              swap! *tracked-transform update :transform $ fn (point)
                point-times point $ [] (&/ 1 viewer-scale) 0
              swap! *tracked-transform update :offset $ fn (point) (point-minus point viewer-shift)
              .translate ctx
                &- (* -0.5 w) (first viewer-shift)
                &- (* -0.5 h) (nth viewer-shift 1)
              ; .!restore ctx
              when
                not $ empty? @*hud-logs
                paint-logs! ctx @*hud-logs
                clear-hud-logs!
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic 'Number 'Bool
            :features $ #{} :js-ffi
        'configure-canvas $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn configure-canvas (app-container)
            let
                canvas $ unsafe-coerce app-container 'CanvasHost
                raw-dpr js/window.devicePixelRatio
                dpr $ if (js-present? raw-dpr) (unsafe-coerce raw-dpr Number) 1
                width $ unsafe-coerce js/window.innerWidth Number
                height $ unsafe-coerce js/window.innerHeight Number
                style $ canvas .style
                ctx $ unsafe-coerce (canvas .get-context |2d) 'CanvasContextHost
              js-set canvas :width $ * dpr width
              js-set canvas :height $ * dpr height
              js-set style :width $ str width |px
              js-set style :height $ str height |px
              ctx .scale dpr dpr
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject
            :features $ #{} :js-ffi
        'find-hit-area $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn find-hit-area (point areas)
            if (empty? areas) (%none)
              let
                  x $ nth areas 0
                  transform $ :transform x
                  p $ point-minus point $ point-add (:offset x)
                    point-times (:position x) transform
                  delta $ point-divide p transform
                if
                  case-default (:kind x)
                    do (js/console.warn |invalid-area-data x) false
                    :rect $ and
                      <=
                        js/Math.abs $ nth delta 0
                        :half-w x
                      <=
                        js/Math.abs $ nth delta 1
                        :half-h x
                    :arc $ <=
                      +
                        js/Math.pow (nth delta 0) 2
                        js/Math.pow (nth delta 1) 2
                      js/Math.pow (:r x) 2
                  %some x
                  recur point $ nth areas 1
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
            :return $ :: 'Option 'Dynamic
        'handle-event $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn handle-event (coord event-name event dispatch) (; js/console.log "|handle event" coord event-name @*element-tree)
            if-let
              maybe-listener $ resolve-target @*element-tree event-name $ either coord ([])
              do (.!preventDefault event) (maybe-listener event dispatch)
              ; js/console.log "|no target"
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'on-control-event $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn on-control-event (elapsed states delta)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'paint-context-at $ %{} 'CodeEntry
          :doc "|Paint directly to a Canvas 2D context at an explicit absolute time in seconds, advancing on-tick callbacks once. Useful for visual fixtures."
          :code $ quote $ defn paint-context-at (tree ctx dispatch! seconds)
            let
                elapsed $ advance-frame-clock! seconds
              reset! *element-tree tree
              paint ctx tree ([]) dispatch! elapsed true
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic 'Number
            :features $ #{} :js-ffi
        'paint-logs! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-logs! (ctx logs)
            set! (.-fillStyle ctx) "|hsla(0,0%,0%,0.5)"
            set! (.-textAlign ctx) |left
            set! (.-textBaseline ctx) |middle
            set! (.-font ctx) "|12px Monlo, monospace"
            if
              > (count logs) 80
              .!fillText ctx
                str (count logs) "| logs, showing 80 of them"
                , 10 10 1000
            -> logs (take 80)
              map-indexed $ fn (idx log)
                .!fillText ctx log 10
                  + 24 $ * 10 idx
                  , 1000
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic $ :: 'List 'Dynamic
            :features $ #{} :js-ffi
        'redraw-context $ %{} 'CodeEntry
          :doc "|Paint the current scene on a Canvas 2D context without advancing on-tick callbacks; use after a deterministic step for screenshots."
          :code $ quote $ defn redraw-context (tree ctx dispatch!) (reset! *element-tree tree)
            paint ctx tree ([]) dispatch! 0 false
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'redraw-page $ %{} 'CodeEntry
          :doc "|Repaint a browser canvas without advancing on-tick callbacks; pass a freshly constructed scene after a deterministic step."
          :code $ quote $ defn redraw-page (tree target dispatch!) (reset! *element-tree tree) (call-paint tree target dispatch! 0 false)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'render-page $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn render-page (tree target dispatch!)
            render-page-at tree target dispatch! $ get-tick
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'render-page-at $ %{} 'CodeEntry
          :doc "|Render a browser canvas at an explicit absolute time in seconds, advancing component on-tick callbacks once."
          :code $ quote $ defn render-page-at (tree target dispatch! seconds)
            let
                elapsed $ advance-frame-clock! seconds
              reset! *element-tree tree
              call-paint tree target dispatch! elapsed true
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic 'Number
            :features $ #{} :js-ffi
        'reset-frame-clock! $ %{} 'CodeEntry
          :doc "|Set the absolute animation clock in seconds before deterministic stepping. This does not paint or tick components."
          :code $ quote $ defn reset-frame-clock! (seconds) (reset! *last-tick seconds) &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'Number
        'reset-stage-config! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reset-stage-config! ()
            let
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
                          move-back $ point-times prev $ [] (&/ -4 l) 0
                          point-add prev move-back
                if (not= scale0 1)
                  swap! *stage-config update :scale $ fn (prev)
                    let
                        delta $ - scale0 1
                      if
                        > 0.01 $ js/Math.abs delta
                        , 1 $ + prev $ if (> delta 0) -0.01 0.01
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ []
            :features $ #{} :js-ffi
        'setup-events $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn setup-events (root-element dispatch)
            let
                root $ unsafe-coerce root-element 'EventTargetHost
                window $ unsafe-coerce js/window 'EventTargetHost
              .addEventListener root |mousedown $ fn (event)
                reset! *drag-moving-cache $ [] (.-clientX event) (.-clientY event)
                when-let
                  target $ find-hit-area
                    []
                      &- (.-offsetX event) (&* js/window.innerWidth 0.5)
                      &- (.-offsetY event) (&* js/window.innerHeight 0.5)
                    , @*touch-event-areas
                  ; js/console.log |target target
                  let
                      coord $ :coord target
                    reset! *clicked-focus coord
                    handle-event coord :mousedown event dispatch
              .addEventListener root |mousemove $ fn (event)
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
              .addEventListener root |mouseup $ fn (event) (reset! *drag-moving-cache nil)
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
              .addEventListener root |mouseleave $ fn (event)
                when-let (coord @*clicked-focus) (handle-event coord :click event dispatch) (handle-event coord :mouseup event dispatch) (reset! *clicked-focus nil)
              .addEventListener window |keypress $ fn (event)
                let
                    coord @*clicked-focus
                  handle-event coord :keypress event dispatch
              .addEventListener window |keydown $ fn (event)
                let
                    coord @*clicked-focus
                  handle-event coord :keydown event dispatch
              .addEventListener window |click $ fn (event) (clear-prompt!)
              .addEventListener window |resize $ fn (event) (configure-canvas root-element)
              .addEventListener window |wheel $ fn (event)
                if
                  or (.-metaKey event) (.-ctrlKey event) (.-shiftKey event)
                  let
                      dy $ * 0.001 $ .-deltaY event
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
                          point-minus pos $ point-times shift $ [] (/ dy scale) 0
                      swap! *stage-config update :scale $ fn (x) (+ x dy)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject 'Dynamic
            :features $ #{} :js-ffi
        'update-stage-config! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-stage-config! (move scale-change)
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
                      next $ &+ prev $ * 0.01 scale-change
                    &max 0.2 $ &min next 8
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.core
          :require
            quamolit.types :refer $ Component
            quamolit.util.time :refer $ get-tick
            quamolit.render.paint :refer $ paint
            quamolit.controller.resolve :refer $ resolve-target locate-target
            quamolit.hud-logs :refer $ clear-hud-logs! *hud-logs
            pointed-prompt.core :refer $ clear-prompt!
            quamolit.global :refer $ *touch-event-areas *tracked-transform *stage-config
            quamolit.math :refer $ point-minus point-divide point-add point-times vec-length point-scale
            quamolit.frame-clock :refer $ step-frame
    'quamolit.cursor $ %{} 'FileEntry
      :defs $ {}
        'gc-states $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gc-states (store op-data)
            let
                cursor $ unsafe-coerce (&list:first op-data) (:: 'List 'Tag)
                fields $ unsafe-coerce (&list:last op-data) (:: 'List 'Tag)
              update-in store
                concat ([] :states) cursor
                fn (maybe-dict)
                  select-keys
                    maybe-dict.unwrap-or $ {}
                    conj fields :data
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic $ :: 'List 'Dynamic
            :features $ #{} :js-ffi
        'update-states $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-states (store op-data)
            let
                cursor $ unsafe-coerce (&list:first op-data) (:: 'List 'Tag)
                data $ &list:last op-data
              assoc-in store
                concat ([] :states) cursor $ [] :data
                , data
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic $ :: 'List 'Dynamic
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.cursor
    'quamolit.direct-frame $ %{} 'FileEntry
      :defs $ {}
        'DirectFrame $ %{} 'CodeEntry
          :doc "|A sampled value plus the exact identity, time and revisions used to produce it."
          :code $ quote $ defstruct DirectFrame ([] 'S) (:id 'String) (:time 'Number) (:versions 'quamolit.direct-frame/FrameVersions) (:scene 'S)
          :examples $ []
          :schema $ :: 'StructDef
        'DirectRequest $ %{} 'CodeEntry
          :doc "|Typed, complete logical input for one arbitrary-time direct sample."
          :code $ quote $ defstruct DirectRequest ([] 'D 'M 'I 'R 'V) (:id 'String) (:time 'Number) (:versions 'quamolit.direct-frame/FrameVersions) (:motion 'D) (:model 'M) (:input 'I) (:resources 'R) (:viewport 'V)
          :examples $ []
          :schema $ :: 'StructDef
        'FrameVersions $ %{} 'CodeEntry
          :doc "|Explicit nonnegative integer revisions for every declared direct-sampling dependency."
          :code $ quote $ defstruct FrameVersions (:component 'Number) (:motion 'Number) (:model 'Number) (:input 'Number) (:resources 'Number) (:viewport 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'resample-at $ %{} 'CodeEntry
          :doc "|Reuse a previous frame only when id, time and all declared dependency revisions match."
          :code $ quote $ defn resample-at (previous request evaluate)
            assert |invalid-direct-request $ valid-direct-request? request
            if
              and
                = (:id previous) (:id request)
                = (:time previous) (:time request)
                = (:versions previous) (:versions request)
              , previous $ sample-at request evaluate
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.direct-frame/DirectFrame 'S) (:: 'quamolit.direct-frame/DirectRequest 'D 'M 'I 'R 'V)
              :: 'Fn $ {} (:return 'S)
                :args $ [] 'D 'M 'I 'R 'V 'Number
            :generics $ [] 'D 'M 'I 'R 'V 'S
            :return $ :: 'quamolit.direct-frame/DirectFrame 'S
          :tests $ []
            %{} 'TestEntry (:name |absolute-time-and-dependency-revisions)
              :code $ quote $ let
                  descriptor $ ScalarDescriptor :id |fade :version 1 :motion $ ScalarMotion :tween
                    ScalarTween :start 0 :duration 1 :from 10 :to 20 :easing $ Easing :linear
                  next-descriptor $ ScalarDescriptor :id |fade :version 2 :motion $ ScalarMotion :tween
                    ScalarTween :start 0 :duration 1 :from 20 :to 30 :easing $ Easing :linear
                  versions $ FrameVersions :component 0 :motion 0 :model 0 :input 0 :resources 0 :viewport 0
                  make-versions $ fn (component motion model input resources viewport)
                    hint-fn $ {}
                      :args $ [] 'Number 'Number 'Number 'Number 'Number 'Number
                      :return 'quamolit.direct-frame/FrameVersions
                    FrameVersions :component component :motion motion :model model :input input :resources resources :viewport viewport
                  make-request $ fn (id time revisions motion model input resources viewport)
                    hint-fn $ {}
                      :args $ [] 'String 'Number 'quamolit.direct-frame/FrameVersions 'quamolit.motion/ScalarDescriptor 'Number 'Number 'Bool 'Number
                      :return $ :: 'quamolit.direct-frame/DirectRequest 'quamolit.motion/ScalarDescriptor 'Number 'Number 'Bool 'Number
                    DirectRequest :id id :time time :versions revisions :motion motion :model model :input input :resources resources :viewport viewport
                  request $ make-request |badge 0.5 versions descriptor 0 0 false 100
                  evaluate $ fn (motion model input resources viewport time)
                    hint-fn $ {}
                      :args $ [] 'quamolit.motion/ScalarDescriptor 'Number 'Number 'Bool 'Number 'Number
                      :return 'Number
                    +
                      +
                        +
                          + (sample-scalar motion time) model
                          , input
                        if resources 20 0
                      / viewport 10
                  baseline $ sample-at request evaluate
                  reused $ resample-at baseline request $ fn (motion model input resources viewport time)
                    hint-fn $ {}
                      :args $ [] 'quamolit.motion/ScalarDescriptor 'Number 'Number 'Bool 'Number 'Number
                      :return 'Number
                    raise |unexpected-re-evaluation
                  model-request $ make-request |badge 0.5 (make-versions 0 0 1 0 0 0) descriptor 5 0 false 100
                  resource-request $ make-request |badge 0.5 (make-versions 0 0 0 0 1 0) descriptor 0 0 true 100
                  viewport-request $ make-request |badge 0.5 (make-versions 0 0 0 0 0 1) descriptor 0 0 false 150
                  input-request $ make-request |badge 0.5 (make-versions 0 0 0 1 0 0) descriptor 0 2 false 100
                  motion-request $ make-request |badge 0.5 (make-versions 0 1 0 0 0 0) next-descriptor 0 0 false 100
                  component-request $ make-request |badge 0.5 (make-versions 1 0 0 0 0 0) descriptor 0 0 false 100
                  other-request $ make-request |other-badge 0.5 versions descriptor 0 0 false 100
                is= ([] 30 20 25 22.5 30)
                  map ([] 1 0 0.5 0.25 1)
                    fn (time)
                      :scene $ sample-at
                        make-request |badge time versions descriptor 0 0 false 100
                        , evaluate
                is= 25 $ :scene baseline
                is= baseline reused
                is= 30 $ :scene $ resample-at baseline model-request evaluate
                is= 45 $ :scene $ resample-at baseline resource-request evaluate
                is= 30 $ :scene $ resample-at baseline viewport-request evaluate
                is= 27 $ :scene $ resample-at baseline input-request evaluate
                is= 35 $ :scene $ resample-at baseline motion-request evaluate
                is= 25 $ :scene $ resample-at baseline component-request evaluate
                is= 25 $ :scene $ resample-at baseline other-request evaluate
                is= 30 $ :scene $ sample-at
                  make-request |badge 0.5 versions descriptor 5 0 false 100
                  , evaluate
              :tags $ #{} :direct-frame :unit
            %{} 'TestEntry (:name |reject-invalid-request)
              :code $ quote $ let
                  descriptor $ ScalarDescriptor :id |fade :version 1 :motion $ ScalarMotion :constant 10
                  versions $ FrameVersions :component 0 :motion 0 :model 0 :input 0 :resources 0 :viewport 0
                  make-request $ fn (id time revisions)
                    hint-fn $ {}
                      :args $ [] 'String 'Number 'quamolit.direct-frame/FrameVersions
                      :return $ :: 'quamolit.direct-frame/DirectRequest 'quamolit.motion/ScalarDescriptor 'Number 'Number 'Bool 'Number
                    DirectRequest :id id :time time :versions revisions :motion descriptor :model 0 :input 0 :resources false :viewport 100
                  evaluate $ fn (motion model input resources viewport time)
                    hint-fn $ {}
                      :args $ [] 'quamolit.motion/ScalarDescriptor 'Number 'Number 'Bool 'Number 'Number
                      :return 'Number
                    sample-scalar motion time
                  baseline $ sample-at (make-request |badge 0 versions) evaluate
                is-throws $ sample-at (make-request | 0 versions) evaluate
                is-throws $ sample-at
                  make-request |badge (sqrt -1) versions
                  , evaluate
                is-throws $ sample-at
                  make-request |badge (/ 1 0) versions
                  , evaluate
                is-throws $ sample-at
                  make-request |badge 0 $ FrameVersions :component 0 :motion 0 :model -1 :input 0 :resources 0 :viewport 0
                  , evaluate
                is-throws $ sample-at
                  make-request |badge 0 $ FrameVersions :component 0 :motion 0 :model 0 :input 0 :resources 0.5 :viewport 0
                  , evaluate
                is-throws $ resample-at baseline
                  make-request |badge 0 $ FrameVersions :component 0 :motion 0 :model 0 :input 0 :resources 0 :viewport $ / 1 0
                  , evaluate
              :tags $ #{} :direct-frame :unit
        'sample-at $ %{} 'CodeEntry
          :doc "|Evaluate from explicit snapshots at arbitrary finite time without reading an earlier frame."
          :code $ quote $ defn sample-at (request evaluate)
            assert |invalid-direct-request $ valid-direct-request? request
            DirectFrame :id (:id request) :time (:time request) :versions (:versions request) :scene $ evaluate (:motion request) (:model request) (:input request) (:resources request) (:viewport request) (:time request)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.direct-frame/DirectRequest 'D 'M 'I 'R 'V)
              :: 'Fn $ {} (:return 'S)
                :args $ [] 'D 'M 'I 'R 'V 'Number
            :generics $ [] 'D 'M 'I 'R 'V 'S
            :return $ :: 'quamolit.direct-frame/DirectFrame 'S
        'valid-direct-request? $ %{} 'CodeEntry
          :doc "|Validate request identity, finite absolute seconds and every revision."
          :code $ quote $ defn valid-direct-request? (request)
            and
              not $ empty? $ :id request
              finite-number? $ :time request
              valid-frame-versions? $ :versions request
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] $ :: 'quamolit.direct-frame/DirectRequest 'D 'M 'I 'R 'V
            :generics $ [] 'D 'M 'I 'R 'V
        'valid-frame-versions? $ %{} 'CodeEntry
          :doc "|Reject negative, fractional or non-finite dependency revisions."
          :code $ quote $ defn valid-frame-versions? (versions)
            and
              valid-version? $ :component versions
              valid-version? $ :motion versions
              valid-version? $ :model versions
              valid-version? $ :input versions
              valid-version? $ :resources versions
              valid-version? $ :viewport versions
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.direct-frame/FrameVersions
        'valid-version? $ %{} 'CodeEntry
          :doc "|A single dependency revision must be finite, nonnegative and integral."
          :code $ quote $ defn valid-version? (value)
            and (finite-number? value) (>= value 0)
              = value $ floor value
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'Number
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.direct-frame
          :require
            quamolit.motion :refer $ finite-number? Easing ScalarTween ScalarMotion ScalarDescriptor sample-scalar
            calcit.test :refer $ is= is-throws
    'quamolit.examples.binary-tree $ %{} 'FileEntry
      :defs $ {}
        'BranchPose $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct BranchPose (:x 'Number) (:y 'Number) (:angle 'Number) (:scale 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'BranchSlot $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct BranchSlot (:parent 'Number) (:left? 'Bool)
          :examples $ []
          :schema $ :: 'StructDef
        'branches $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn branches (time depth id x y angle scale)
            let
                left $ segment (str id |L) x y angle scale 80 -220
                right $ segment (str id |R) x y angle scale -140 -100
                path $ strokes/RoundPolyline :id id :width (:width left) :color (:color left) :points $ []
                  motion/Vec2 :x (:x1 left) :y $ :y1 left
                  motion/Vec2 :x x :y y
                  motion/Vec2 :x (:x1 right) :y $ :y1 right
                shift-a $ * 0.0206 $ sin
                  / (* 10 time) 17.9
                shift-b $ * 0.0315 $ sin
                  / (* 10 time) 16.6
                degree $ / &PI 180
              if (= depth 0) ([] path)
                concat ([] path)
                  branches time (dec depth) (str id |L) (:x1 left) (:y1 left)
                    + angle $ * degree $ + 10 (* 30 shift-a)
                    * scale $ + 0.6 $ * 1.3 shift-a
                  branches time (dec depth) (str id |R) (:x1 right) (:y1 right)
                    + angle $ * degree $ + 10 (* 20 shift-b)
                    * scale $ + 0.73 $ * 2 shift-b
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'Number 'String 'Number 'Number 'Number 'Number
            :return $ :: 'List 'quamolit.canvas-strokes/RoundPolyline
        'build-plan $ %{} 'CodeEntry (:doc "|声明一次树拓扑与共享局部几何；绝对时间仅采样姿态/仿射矩阵。深度变化显式重新构建。")
          :code $ quote $ defn build-plan (time depth)
            let
                source $ scene-at time depth
                geometry $ scene/PolylineNode :width 4 :stroke
                  motion/ColorRgba :r 0.1 :g (/ 19 30) :b 0.9 :a 1
                  , :points $ [] (motion/Vec2 :x 80 :y -220) (motion/Vec2 :x 0 :y 0) (motion/Vec2 :x -140 :y -100)
                document $ scene/SceneDocument :nodes $ map (:nodes source)
                  fn (node)
                    struct-with node $ :content $ scene/SceneContent :polyline geometry
                slots $ build-slots depth -1 false $ empty-branch-slots
              retained/build-plan document slots time sample-transforms
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'Number
            :return $ :: 'quamolit.retained-path/PathPlan $ :: 'List 'quamolit.examples.binary-tree/BranchSlot
          :tests $ [] $ %{} 'TestEntry (:name |retained-path-replay)
            :code $ quote $ let
                initial $ build-plan 0 5
                middle $ retained/sample-plan-at initial 2.5
              is= 63 $ count $ :transforms middle
              is= (:scene initial) (:scene middle)
              is= 2 $ :samples middle
              is= 2 $ :samples $ retained/sample-plan-at middle 2.5
            :tags $ #{} :retained-path :unit
        'build-slots $ %{} 'CodeEntry (:doc "|前序父索引拓扑；父索引 -1 是根。内部调用须先验证深度。")
          :code $ quote $ defn build-slots (depth parent left? slots)
            let
                index $ count slots
                next $ conj slots $ BranchSlot :parent parent :left? left?
              if (= depth 0) next $ build-slots (dec depth) index false $ build-slots (dec depth) index true next
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'Number 'Bool $ :: 'List 'quamolit.examples.binary-tree/BranchSlot
            :return $ :: 'List 'quamolit.examples.binary-tree/BranchSlot
        'component-request $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn component-request (time depth)
            component/ComponentRequest :id |binary-tree :time time :versions
              direct/FrameVersions :component depth :motion 0 :model 0 :input 0 :resources 0 :viewport 0
              , :props depth :model 0 :input 0 :resources 0 :viewport 0
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'Number
            :return $ :: 'quamolit.component-sample/ComponentRequest 'Number 'Number 'Number 'Number 'Number
        'declare-execution $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn declare-execution (depth model input resources viewport)
            let
                initial $ build-plan 0 depth
                slots $ :props initial
              execution/ExecutionDeclaration :component
                component/ComponentDeclaration :scene (:scene initial) :motions $ []
                , :transforms $ execution/TransformSampler :cpu $ fn (time) (sample-transforms slots time)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :return 'quamolit.retained-component/ExecutionDeclaration
            :args $ [] 'Number 'Number 'Number 'Number 'Number
        'draw! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw! (context time depth)
            reference/draw-reference! context $ scene-at time depth
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'Number 'Number
            :features $ #{} :js-ffi
        'empty-branch-slots $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-branch-slots () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.examples.binary-tree/BranchSlot
        'empty-poses $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-poses () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.examples.binary-tree/BranchPose
        'evaluate $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn evaluate (depth model input resources viewport time) (branches time depth |root 0 240 0 1)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'Number 'Number 'Number 'Number 'Number
            :return $ :: 'List 'quamolit.canvas-strokes/RoundPolyline
        'frame-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn frame-at (time depth)
            assert |invalid-tree-depth $ and (motion/finite-number? depth)
              = depth $ floor depth
              >= depth 0
              <= depth 8
            direct/sample-at
              direct/DirectRequest :id |binary-tree :time time :versions
                direct/FrameVersions :component 0 :motion depth :model 0 :input 0 :resources 0 :viewport 0
                , :motion depth :model 0 :input 0 :resources 0 :viewport 0
              , evaluate
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'Number
            :return $ :: 'quamolit.direct-frame/DirectFrame $ :: 'List 'quamolit.canvas-strokes/RoundPolyline
          :tests $ [] $ %{} 'TestEntry (:name |original-depth-and-replay)
            :code $ quote $ do
              is= 63 $ count $ :scene (frame-at 0 5)
              is=
                :scene $ frame-at 1 5
                :scene $ frame-at 1 5
              is= 1 $ count $ :scene (frame-at 0 0)
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
        'sample-poses $ %{} 'CodeEntry (:doc "|按保留父索引求解世界姿态；摆动频率每帧各求值一次，仍分配每分支姿态。")
          :code $ quote $ defn sample-poses (slots time)
            let
                sa $ * 0.0206 $ sin
                  / (* 10 time) 17.9
                sb $ * 0.0315 $ sin
                  / (* 10 time) 16.6
                degree $ / &PI 180
              foldl slots (empty-poses)
                fn (poses slot)
                  hint-fn $ {}
                    :args $ [] (:: 'List BranchPose) BranchSlot
                    :return $ :: 'List BranchPose
                  conj poses $ if
                    = -1 $ :parent slot
                    BranchPose :x 0 :y 240 :angle 0 :scale 1
                    let
                        p $ &list:nth poses $ :parent slot
                        dx $ if (:left? slot) 80 -140
                        dy $ if (:left? slot) -220 -100
                        c $ cos $ :angle p
                        s $ sin $ :angle p
                      BranchPose :x
                        + (:x p)
                          * (:scale p)
                            - (* c dx) (* s dy)
                        , :y
                          + (:y p)
                            * (:scale p)
                              + (* s dx) (* c dy)
                          , :angle
                            + (:angle p)
                              * degree $ + 10 $ if (:left? slot) (* 30 sa) (* 20 sb)
                            , :scale $ * (:scale p)
                              if (:left? slot)
                                + 0.6 $ * 1.3 sa
                                + 0.73 $ * 2 sb
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.examples.binary-tree/BranchSlot) 'Number
            :return $ :: 'List 'quamolit.examples.binary-tree/BranchPose
        'sample-transforms $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-transforms (slots time)
            map (sample-poses slots time)
              fn (pose)
                let
                    c $ * (:scale pose)
                      cos $ :angle pose
                    s $ * (:scale pose)
                      sin $ :angle pose
                  scene/Matrix2D :a c :b s :c (- 0 s) :d c :e (:x pose) :f $ :y pose
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.examples.binary-tree/BranchSlot) 'Number
            :return $ :: 'List 'quamolit.scene-ir/Matrix2D
        'scene-at $ %{} 'CodeEntry
          :doc "|绝对时间全量采样为正式 SceneDocument；保持旧 frame-at 的身份、顺序和几何，不承诺跨帧结构复用。"
          :code $ quote $ defn scene-at (time depth)
            scene/SceneDocument :nodes $ map
              :scene $ frame-at time depth
              fn (path)
                scene/SceneNode :id (:id path) :key (:id path) :parent | :bindings ([]) :interaction (scene/SceneInteraction :none) :content $ scene/SceneContent :polyline $ scene/PolylineNode :points (:points path) :width (:width path) :stroke (:color path)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'Number 'Number
        'segment $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn segment (id x y angle scale dx dy)
            let
                c $ cos angle
                s $ sin angle
              strokes/StrokeSegment :id id :x0 x :y0 y :x1
                + x $ * scale $ - (* c dx) (* s dy)
                , :y1
                  + y $ * scale $ + (* s dx) (* c dy)
                  , :width (* 4 scale) :color $ motion/ColorRgba :r 0.1 :g (/ 19 30) :b 0.9 :a 1
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.canvas-strokes/StrokeSegment)
            :args $ [] 'String 'Number 'Number 'Number 'Number 'Number 'Number
        'start-component $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn start-component (time depth)
            execution/build-execution-plan (component-request time depth) declare-execution
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'Number 'Number
        'update-component $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-component (plan time depth)
            execution/update-execution-plan plan (component-request time depth) declare-execution
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'Number 'Number
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.examples.binary-tree
          :require (quamolit.canvas-strokes :as strokes) (quamolit.motion :as motion) (quamolit.direct-frame :as direct)
            calcit.test :refer $ is=
            quamolit.scene-ir :as scene
            quamolit.canvas-reference :as reference
            quamolit.retained-path :as retained
            quamolit.retained-component :as execution
            quamolit.component-sample :as component
    'quamolit.examples.todolist $ %{} 'FileEntry
      :defs $ {}
        'Event $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct Event (:at 'Number) (:kind 'String) (:id 'String) (:text 'String)
          :examples $ []
          :schema $ :: 'StructDef
        'Hit $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct Hit (:id 'String) (:action 'String) (:text 'String)
          :examples $ []
          :schema $ :: 'StructDef
        'Model $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct Model
            :rows $ :: 'List 'quamolit.examples.todolist/Row
            :presence 'quamolit.presence/PresenceModel
            :revision 'Number
            :next-id 'Number
            :at 'Number
            :released 'Number
            :undo-id 'String
            :undo-text 'String
            :undo-done 'Bool
          :examples $ []
          :schema $ :: 'StructDef
        'Row $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct Row (:id 'String) (:text 'String) (:done 'Bool) (:present 'Bool) (:y 'quamolit.transition/TransitionIntent) (:progress 'quamolit.transition/TransitionIntent)
          :examples $ []
          :schema $ :: 'StructDef
        'Session $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct Session (:model 'quamolit.examples.todolist/Model) (:cursor 'Number) (:time 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'advance $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn advance (session log time)
            assert |invalid-todo-advance $ and (motion/finite-number? time)
              >= time $ :time session
              <= (:cursor session) (count log)
            if
              < (:cursor session) (count log)
              let
                  event $ &list:nth log $ :cursor session
                if
                  <= (:at event) time
                  recur
                    Session :model
                      dispatch (:model session) (:at event) (:kind event) (:id event) (:text event)
                      , :cursor
                        inc $ :cursor session
                        , :time $ :at event
                    , log time
                  Session :model
                    settle (:model session) time
                    , :cursor (:cursor session) :time time
              Session :model
                settle (:model session) time
                , :cursor (:cursor session) :time time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.examples.todolist/Session)
            :args $ [] 'quamolit.examples.todolist/Session (:: 'List 'quamolit.examples.todolist/Event) 'Number
        'append-event $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn append-event (log at kind id label)
            do
              assert |todo-log-capacity $ < (count log) 2000
              do
                assert |invalid-todo-event-time $ and (motion/finite-number? at) (>= at 0)
                assert |unknown-todo-event $ includes?
                  [] |add |toggle |edit |remove |restore |front |reverse |clear
                  , kind
                assert |invalid-todo-label $ or
                  not $ includes? ([] |add |edit) kind
                  valid-label? label
            assert |nonmonotonic-todo-log $ or (empty? log)
              >= at $ :at $ &list:nth log
                dec $ count log
            conj log $ Event :at at :kind kind :id id :text label
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.examples.todolist/Event) 'Number 'String 'String 'String
            :return $ :: 'List 'quamolit.examples.todolist/Event
        'color $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn color (r g b a)
            motion/ColorRgba :r r :g g :b b :a a
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/ColorRgba)
            :args $ [] 'Number 'Number 'Number 'Number
        'commit-rows $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn commit-rows (model rows at)
            let
                arranged $ reflow rows at
                presence-update $ presence/reconcile-presence (:presence model) (desired-scene arranged) at 0.4 $ motion/Easing :smoothstep
                next $ struct-with model (:rows arranged)
                  :presence $ :model presence-update
                  :at at
                  :revision $ inc $ :revision model
                  :released $ + (:released model)
                    count $ :released presence-update
              struct-with next $ :presence $ delay-entries next at
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.examples.todolist/Model)
            :args $ [] 'quamolit.examples.todolist/Model (:: 'List 'quamolit.examples.todolist/Row) 'Number
        'declare-execution $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn declare-execution (props model input resources viewport)
            let
                descriptors $ map (:rows model)
                  fn (row)
                    motion/ScalarDescriptor :id
                      str (:id row) |/done
                      , :version 0 :motion $ motion/ScalarMotion :tween $ :tween (:progress row)
                component $ lifecycle/declare-flat (:presence model) descriptors
                items $ :items $ :presence model
                rows $ :rows model
              retained/ExecutionDeclaration :component component :transforms $ retained/TransformSampler :cpu $ fn (time)
                map items $ fn (item)
                  let
                      row $ row-for-node rows $ :node (:entry item)
                    scene/Matrix2D :a 1 :b 0 :c 0 :d 1 :e
                      * -40 $ - 1 $ presence/alpha-at item time
                      , :f $ transition/sample-transition (:y row) time
          :examples $ []
          :schema $ :: 'Fn $ {}
            :return 'quamolit.retained-component/ExecutionDeclaration
            :args $ [] 'Number 'quamolit.examples.todolist/Model 'Number 'Number 'Number
        'delay-entries $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn delay-entries (model at)
            struct-with (:presence model)
              :items $ map
                :items $ :presence model
                fn (item)
                  let
                      tween $ :alpha item
                      row $ row-for-node (:rows model)
                        :node $ :entry item
                      delay $ * 0.001 $ + 160
                        :to $ :tween $ :y row
                    if
                      and
                        >= (:start tween) at
                        = 0 $ :from tween
                      struct-with item $ :alpha $ struct-with tween
                        :start $ + at delay
                      if
                        and
                          = at $ :start tween
                          = (presence/PresencePhase :exit) (:phase item)
                        struct-with item $ :alpha $ struct-with tween
                          :start $ + at $ if
                            >
                              -
                                * 0.064 $ dec $ count (:rows model)
                                , delay
                              , 0
                            -
                              * 0.064 $ dec $ count (:rows model)
                              , delay
                            , 0
                        , item
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceModel)
            :args $ [] 'quamolit.examples.todolist/Model 'Number
        'demo-log $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn demo-log ()
            -> (empty-events) (append-event 0 |add | |Sketch) (append-event 0 |add | |Animate) (append-event 0 |add | |Explore) (append-event 1 |toggle |2 |) (append-event 1.5 |remove |3 |) (append-event 1.7 |restore | |) (append-event 2.3 |front |1 |) (append-event 2.45 |reverse | |) (append-event 3 |edit |2 |Create) (append-event 3.5 |remove |1 |)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.examples.todolist/Event
        'desired-scene $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn desired-scene (rows)
            scene/SceneDocument :nodes $ mapcat
              filter rows $ fn (row) (:present row)
              , row-nodes
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] $ :: 'List 'quamolit.examples.todolist/Row
        'dispatch $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn dispatch (model at kind id label)
            assert |invalid-todo-event-time $ and (motion/finite-number? at)
              >= at $ :at model
            let
                current $ settle model at
                rows $ :rows current
              case-default kind (raise |unknown-todo-event)
                |add $ do
                  assert |invalid-todo-label $ valid-label? label
                  assert |todo-capacity $ < (count rows) 24
                  let
                      row $ new-row
                        str $ :next-id current
                        , label false at
                    commit-rows
                      struct-with current $ :next-id $ inc (:next-id current)
                      prepend rows row
                      , at
                |toggle $ let
                    row $ find-row current id
                    done $ not $ :done row
                  replace-row current
                    struct-with row (:done done)
                      :progress $ transition/interrupt-transition (:progress row) (if done 28 0) at 0.4 $ motion/Easing :smoothstep
                    , at
                |edit $ do
                  assert |invalid-todo-label $ valid-label? label
                  replace-row current
                    struct-with (find-row current id) (:text label)
                    , at
                |remove $ let
                    row $ find-row current id
                  replace-row
                    struct-with current (:undo-id id)
                      :undo-text $ :text row
                      :undo-done $ :done row
                    struct-with row $ :present false
                    , at
                |restore $ do
                  assert |nothing-to-restore $ not $ empty? (:undo-id current)
                  let
                      restored $ restore-row current at
                      remaining $ filter rows $ fn (row)
                        not= (:id row) (:id restored)
                    commit-rows
                      struct-with current $ :undo-id |
                      prepend remaining restored
                      , at
                |front $ let
                    row $ find-row current id
                    remaining $ filter rows $ fn (old)
                      not= (:id old) id
                  commit-rows current (prepend remaining row) at
                |reverse $ commit-rows current
                  concat
                    reverse $ filter rows $ fn (row) (:present row)
                    filter rows $ fn (row)
                      not $ :present row
                  , at
                |clear $ commit-rows current
                  map rows $ fn (row)
                    struct-with row $ :present false
                  , at
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.examples.todolist/Model)
            :args $ [] 'quamolit.examples.todolist/Model 'Number 'String 'String 'String
        'empty-events $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-events () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.examples.todolist/Event
        'empty-hit $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-hit () (Hit :id | :action | :text |)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.examples.todolist/Hit)
            :args $ []
        'empty-rows $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-rows () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.examples.todolist/Row
        'events-through $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn events-through (log time)
            filter log $ fn (event)
              <= (:at event) time
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.examples.todolist/Event) 'Number
            :return $ :: 'List 'quamolit.examples.todolist/Event
        'find-row $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn find-row (model id)
            match
              find (:rows model)
                fn (row)
                  hint-fn $ {}
                    :args $ [] 'quamolit.examples.todolist/Row
                    :return 'Bool
                  and (:present row)
                    = id $ :id row
              (:some row) row
              (:none) (raise |missing-active-todo-row)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.examples.todolist/Row)
            :args $ [] 'quamolit.examples.todolist/Model 'String
        'hit-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn hit-at (model time x y)
            assert |invalid-todo-hit $ and (motion/finite-number? time) (motion/finite-number? x) (motion/finite-number? y)
            foldl
              reverse $ :rows model
              empty-hit
              fn (hit row)
                hint-fn $ {}
                  :args $ [] 'quamolit.examples.todolist/Hit 'quamolit.examples.todolist/Row
                  :return 'quamolit.examples.todolist/Hit
                if
                  not $ empty? $ :id hit
                  , hit $ let
                      alpha $ row-alpha model row time
                      local-x $ + x $ * 40 (- 1 alpha)
                      local-y $ - y $ transition/sample-transition (:y row) time
                    if
                      and (:present row) (> alpha 0) (>= local-y -25) (<= local-y 25) (>= local-x -282) (<= local-x 292)
                      Hit :id (:id row) :text (:text row) :action $ cond
                          < local-x -248
                          , |toggle
                        (< local-x 200) |edit
                        (< local-x 250) |front
                        true |remove
                      , hit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.examples.todolist/Hit)
            :args $ [] 'quamolit.examples.todolist/Model 'Number 'Number 'Number
        'initial $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn initial ()
            Model :rows (empty-rows) :presence
              presence/start-presence $ scene/SceneDocument :nodes $ scene/empty-scene-nodes
              , :revision 0 :next-id 1 :at 0 :released 0 :undo-id | :undo-text | :undo-done false
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.examples.todolist/Model)
            :args $ []
        'initial-session $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn initial-session ()
            Session :model (initial) :cursor 0 :time 0
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.examples.todolist/Session)
            :args $ []
        'intent $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn intent (id from to at)
            transition/start-transition id from to at 0.4 $ motion/Easing :smoothstep
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.transition/TransitionIntent)
            :args $ [] 'String 'Number 'Number 'Number
        'main! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn main! ()
            = 3 $ count $ :rows
              replay (demo-log) 0
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ []
          :tests $ [] $ %{} 'TestEntry (:name |todo-replay-and-release)
            :code $ quote $ let
                log $ demo-log
                end $ replay log 4
                begin $ replay log 0
              is= 3 $ count $ :rows begin
              is= 2 $ count $ :rows end
              is= 6 $ :released end
              is= false $ needs-frame? end 4
              is= end $ replay log 4
              is= begin $ replay log 0
              is-throws $ append-event (empty-events) 0 |bad | |
              is-throws $ dispatch (initial) -1 |add | |wrong
              is-throws $ dispatch (initial) 0 |add | |
              is-throws $ replay log $ / 1 0
            :tags $ #{} :todolist
        'needs-frame? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn needs-frame? (model time)
            or
              presence/presence-needs-frame? (:presence model) time
              any?
                :items $ :presence model
                fn (item)
                  >
                    :start $ :alpha item
                    , time
              any? (:rows model)
                fn (row)
                  or
                    transition/transition-active? (:y row) time
                    transition/transition-active? (:progress row) time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.examples.todolist/Model 'Number
        'new-row $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn new-row (id text done at)
            Row :id id :text text :done done :present true :y (intent id -120 -160 at) :progress $ intent (str id |/done) (if done 28 0) (if done 28 0) at
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.examples.todolist/Row)
            :args $ [] 'String 'String 'Bool 'Number
        'next-event-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn next-event-at (session log)
            if
              < (:cursor session) (count log)
              :at $ &list:nth log $ :cursor session
              , -1
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.examples.todolist/Session $ :: 'List 'quamolit.examples.todolist/Event
        'node $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn node (row role content)
            let
                id $ str (:id row) |/ role
              scene/SceneNode :id id :key id :parent | :content content :bindings ([]) :interaction $ scene/SceneInteraction :target id
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneNode)
            :args $ [] 'quamolit.examples.todolist/Row 'String 'quamolit.scene-ir/SceneContent
        'rect $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn rect (x y w h fill)
            scene/SceneContent :rect $ scene/RectNode :x x :y y :width w :height h :fill fill
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneContent)
            :args $ [] 'Number 'Number 'Number 'Number 'quamolit.motion/ColorRgba
        'reflow $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reflow (rows at)
            concat
              map-indexed
                filter rows $ fn (row) (:present row)
                fn (index row)
                  let
                      target $ - (* 64 index) 160
                      old $ :y row
                    if
                      = target $ :to $ :tween old
                      , row $ struct-with row $ :y
                        transition/interrupt-transition old target at 0.4 $ motion/Easing :smoothstep
              filter rows $ fn (row)
                not $ :present row
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.examples.todolist/Row) 'Number
            :return $ :: 'List 'quamolit.examples.todolist/Row
        'reload! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reload! () (main!)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ []
        'replace-row $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn replace-row (model row at)
            commit-rows model
              map (:rows model)
                fn (old)
                  if
                    = (:id old) (:id row)
                    , row old
              , at
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.examples.todolist/Model)
            :args $ [] 'quamolit.examples.todolist/Model 'quamolit.examples.todolist/Row 'Number
        'replay $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn replay (log time)
            assert |invalid-todo-time $ and (motion/finite-number? time) (>= time 0)
            :model $ advance (initial-session) log time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.examples.todolist/Model)
            :args $ [] (:: 'List 'quamolit.examples.todolist/Event) 'Number
        'request $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn request (model time)
            component/ComponentRequest :id |todolist :time time :versions
              direct/FrameVersions :component 0 :motion 0 :model (:revision model) :input 0 :resources 0 :viewport 0
              , :props 0 :model model :input 0 :resources 0 :viewport 0
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.examples.todolist/Model 'Number
            :return $ :: 'quamolit.component-sample/ComponentRequest 'Number 'quamolit.examples.todolist/Model 'Number 'Number 'Number
        'restore-row $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn restore-row (model at)
            match
              find (:rows model)
                fn (row)
                  hint-fn $ {}
                    :args $ [] 'quamolit.examples.todolist/Row
                    :return 'Bool
                  = (:id row) (:undo-id model)
              (:some row)
                struct-with row $ :present true
              (:none)
                do
                  assert |todo-capacity $ <
                    count $ :rows model
                    , 24
                  new-row (:undo-id model) (:undo-text model) (:undo-done model) at
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.examples.todolist/Row)
            :args $ [] 'quamolit.examples.todolist/Model 'Number
        'row-alpha $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn row-alpha (model row time)
            match
              find
                :items $ :presence model
                fn (item)
                  hint-fn $ {}
                    :args $ [] 'quamolit.presence/PresenceItem
                    :return 'Bool
                  =
                    :id $ :node $ :entry item
                    str (:id row) |/card
              (:some item) (presence/alpha-at item time)
              (:none) 0
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.examples.todolist/Model 'quamolit.examples.todolist/Row 'Number
        'row-for-node $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn row-for-node (rows node)
            match
              find rows $ fn (row)
                hint-fn $ {}
                  :args $ [] 'quamolit.examples.todolist/Row
                  :return 'Bool
                starts-with? (:id node)
                  str (:id row) |/
              (:some row) row
              (:none) (raise |missing-todo-row)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.examples.todolist/Row)
            :args $ [] (:: 'List 'quamolit.examples.todolist/Row) 'quamolit.scene-ir/SceneNode
        'row-nodes $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn row-nodes (row)
            []
              node row |card $ rect -300 -25 600 50 $ color 0.10 0.16 0.23 1
              node row |toggle $ rect -282 -14 28 28 $ color 0.20 0.30 0.42 1
              struct-with
                node row |checked $ rect -282 -14
                  :to $ :tween $ :progress row
                  , 28 $ color 0.25 0.82 0.66 1
                :bindings $ if
                  =
                    :from $ :tween $ :progress row
                    :to $ :tween $ :progress row
                  []
                  [] $ scene/ScalarBinding :target (scene/ScalarTarget :width) :motion-id
                    str (:id row) |/done
                    , :version 0
              node row |edit $ text -234 (:text row) 18 $ color 0.88 0.93 0.98 1
              node row |front $ text 215 "|↑" 22 $ color 0.52 0.70 0.88 1
              node row |remove $ text 260 "|×" 24 $ color 0.98 0.52 0.52 1
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.examples.todolist/Row
            :return $ :: 'List 'quamolit.scene-ir/SceneNode
        'settle $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn settle (model time)
            assert |invalid-todo-time $ and (motion/finite-number? time)
              >= time $ :at model
            let
                presence-update $ presence/settle-presence (:presence model) time
                next $ :model presence-update
              if
                = next $ :presence model
                , model $ struct-with model (:presence next)
                  :revision $ inc $ :revision model
                  :released $ + (:released model)
                    count $ :released presence-update
                  :rows $ filter (:rows model)
                    fn (row)
                      or (:present row)
                        any? (:items next)
                          fn (item)
                            starts-with?
                              :id $ :node $ :entry item
                              str (:id row) |/
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.examples.todolist/Model)
            :args $ [] 'quamolit.examples.todolist/Model 'Number
        'start-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn start-plan (model time)
            retained/build-execution-plan (request model time) declare-execution
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.examples.todolist/Model 'Number
        'text $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn text (x value size fill)
            scene/SceneContent :text $ scene/TextNode :x x :y 0 :size size :text value :fill fill
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneContent)
            :args $ [] 'Number 'String 'Number 'quamolit.motion/ColorRgba
        'update-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-plan (plan model time)
            retained/update-execution-plan plan (request model time) declare-execution
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'quamolit.examples.todolist/Model 'Number
        'valid-label? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn valid-label? (label)
            and
              >
                count $ trim label
                , 0
              <= (count label) 28
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'String
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.examples.todolist
          :require (quamolit.scene-ir :as scene) (quamolit.motion :as motion) (quamolit.transition :as transition) (quamolit.presence :as presence) (quamolit.presence-component :as lifecycle) (quamolit.component-sample :as component) (quamolit.direct-frame :as direct) (quamolit.retained-component :as retained)
            calcit.test :refer $ is= is-throws
    'quamolit.fixed-step $ %{} 'FileEntry
      :defs $ {}
        'SimulationState $ %{} 'CodeEntry
          :doc "|Immutable simulation checkpoint; tick is an integer, dt is fixed seconds, seed and state are explicit."
          :code $ quote $ defstruct SimulationState ([] 'S) (:tick 'Number) (:dt 'Number) (:seed 'Number) (:state 'S)
          :examples $ []
          :schema $ :: 'StructDef
        'advance-simulation $ %{} 'CodeEntry
          :doc "|Advance through logged inputs up to target tick within an explicit catch-up budget."
          :code $ quote $ defn advance-simulation (previous target-tick input-log max-steps update-state)
            assert |invalid-simulation-checkpoint $ valid-simulation-state? previous
            assert |invalid-target-tick $ finite-number? target-tick
            assert |non-integer-target-tick $ = target-tick $ floor target-tick
            assert |simulation-cannot-rewind $ >= target-tick $ :tick previous
            assert |invalid-catch-up-budget $ finite-number? max-steps
            assert |negative-catch-up-budget $ >= max-steps 0
            assert |non-integer-catch-up-budget $ = max-steps $ floor max-steps
            assert |catch-up-budget-exceeded $ <=
              - target-tick $ :tick previous
              , max-steps
            if
              = target-tick $ :tick previous
              , previous $ let
                  next-tick $ + 1 $ :tick previous
                assert |missing-simulation-input $ contains? input-log next-tick
                let
                    input $
                      get input-log next-tick
                      , .unwrap
                  recur (step-simulation previous next-tick input update-state) target-tick input-log (- max-steps 1) update-state
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.fixed-step/SimulationState 'S) 'Number (:: 'Map 'Number 'I) 'Number $ :: 'Fn
              {} (:return 'S)
                :args $ [] 'S 'I 'Number 'Number
            :generics $ [] 'S 'I
            :return $ :: 'quamolit.fixed-step/SimulationState 'S
          :tests $ []
            %{} 'TestEntry (:name |cadence-checkpoint-replay)
              :code $ quote $ let
                  update-state $ fn (state input dt seed)
                    hint-fn $ {}
                      :args $ [] 'Number 'Number 'Number 'Number
                      :return 'Number
                    + state $ * input dt
                  inputs $ {} (1 2) (2 4) (3 -2) (4 0)
                  initial $ start-simulation 0.25 7 0
                  direct $ advance-simulation initial 4 inputs 4 update-state
                  first-step $ advance-simulation initial 1 inputs 1 update-state
                  checkpoint $ advance-simulation first-step 2 inputs 1 update-state
                  staged $ advance-simulation checkpoint 4 inputs 2 update-state
                  paused $ advance-simulation checkpoint 2 inputs 0 update-state
                  reset $ start-simulation 0.25 7 0
                  replay $ advance-simulation reset 4 inputs 4 update-state
                  single $ step-simulation initial 1 2 update-state
                is= 1 $ :state direct
                is= 4 $ :tick direct
                is= direct staged
                is= direct replay
                is= checkpoint paused
                is= 0.5 $ :state single
                is= 7 $ :seed checkpoint
                is= 0.25 $ :dt checkpoint
              :tags $ #{} :simulation :unit
            %{} 'TestEntry (:name |reject-invalid-steps)
              :code $ quote $ let
                  update-state $ fn (state input dt seed)
                    hint-fn $ {}
                      :args $ [] 'Number 'Number 'Number 'Number
                      :return 'Number
                    + state $ * input dt
                  inputs $ {} (1 2) (2 4)
                  initial $ start-simulation 0.25 7 0
                  first-step $ step-simulation initial 1 2 update-state
                  bad-checkpoint $ SimulationState :tick -1 :dt 0.25 :seed 7 :state 0
                  bad-duration-checkpoint $ SimulationState :tick 0 :dt 0 :seed 7 :state 0
                is-throws $ start-simulation 0 7 0
                is-throws $ start-simulation -0.25 7 0
                is-throws $ start-simulation (sqrt -1) 7 0
                is-throws $ start-simulation 0.25 (/ 1 0) 0
                is-throws $ start-simulation 0.25 1.5 0
                is-throws $ step-simulation initial 0 2 update-state
                is-throws $ step-simulation initial 2 2 update-state
                is-throws $ step-simulation initial (sqrt -1) 2 update-state
                is-throws $ advance-simulation first-step 0 inputs 1 update-state
                is-throws $ advance-simulation initial 2 inputs 1 update-state
                is-throws $ advance-simulation initial 2
                  {} $ 1 2
                  , 2 update-state
                is-throws $ advance-simulation initial 1 inputs -1 update-state
                is-throws $ advance-simulation initial 1 inputs 0.5 update-state
                is-throws $ step-simulation bad-checkpoint 0 2 update-state
                is-throws $ advance-simulation bad-checkpoint 0 inputs 0 update-state
                is-throws $ advance-simulation bad-duration-checkpoint 1 inputs 1 update-state
              :tags $ #{} :simulation :unit
        'start-simulation $ %{} 'CodeEntry
          :doc "|Construct or reset a simulation at tick zero; rejects invalid dt or seed."
          :code $ quote $ defn start-simulation (dt seed state)
            assert |invalid-simulation-dt $ finite-number? dt
            assert |non-positive-simulation-dt $ > dt 0
            assert |invalid-simulation-seed $ finite-number? seed
            assert |non-integer-simulation-seed $ = seed $ floor seed
            SimulationState :tick 0 :dt dt :seed seed :state state
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'Number 'S
            :generics $ [] 'S
            :return $ :: 'quamolit.fixed-step/SimulationState 'S
        'step-simulation $ %{} 'CodeEntry
          :doc "|Advance exactly one explicitly numbered tick with one input; no display-clock reads."
          :code $ quote $ defn step-simulation (previous next-tick input update-state)
            assert |invalid-simulation-checkpoint $ valid-simulation-state? previous
            assert |invalid-simulation-tick $ finite-number? next-tick
            assert |non-integer-simulation-tick $ = next-tick $ floor next-tick
            assert |simulation-tick-must-advance-once $ = next-tick $ + 1 (:tick previous)
            SimulationState :tick next-tick :dt (:dt previous) :seed (:seed previous) :state $ update-state (:state previous) input (:dt previous) (:seed previous)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.fixed-step/SimulationState 'S) 'Number 'I $ :: 'Fn
              {} (:return 'S)
                :args $ [] 'S 'I 'Number 'Number
            :generics $ [] 'S 'I
            :return $ :: 'quamolit.fixed-step/SimulationState 'S
        'valid-simulation-state? $ %{} 'CodeEntry
          :doc "|Validate a checkpoint constructed externally before advancing or restoring it."
          :code $ quote $ defn valid-simulation-state? (simulation)
            and
              finite-number? $ :tick simulation
              >= (:tick simulation) 0
              = (:tick simulation)
                floor $ :tick simulation
              finite-number? $ :dt simulation
              > (:dt simulation) 0
              finite-number? $ :seed simulation
              = (:seed simulation)
                floor $ :seed simulation
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] $ :: 'quamolit.fixed-step/SimulationState 'S
            :generics $ [] 'S
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.fixed-step
          :require
            quamolit.motion :refer $ finite-number?
            calcit.test :refer $ is= is-throws
    'quamolit.frame-clock $ %{} 'FileEntry
      :defs $ {}
        'FrameSample $ %{} 'CodeEntry
          :doc "|Pure absolute-time frame sample in seconds; elapsed is zero for a repeated timestamp."
          :code $ quote $ defstruct FrameSample (:time 'Number) (:elapsed 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'elapsed-between $ %{} 'CodeEntry
          :doc "|Return elapsed seconds for a monotonic absolute clock; reject rewinds. Reset the clock before seeking backward in tests."
          :code $ quote $ defn elapsed-between (previous current)
            if (< current previous) (raise |frame-time-must-be-monotonic) (- current previous)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number 'Number
          :tests $ []
            %{} 'TestEntry (:name |fixed-and-repeated)
              :code $ quote $ do
                is= 0.25 $ elapsed-between 1 1.25
                is= 0 $ elapsed-between 1 1
              :tags $ #{} :frame-clock :unit
            %{} 'TestEntry (:name |rejects-rewind)
              :code $ quote $ is-throws (elapsed-between 2 1)
              :tags $ #{} :frame-clock :unit
        'sample-times $ %{} 'CodeEntry
          :doc "|Generate inclusive sample times from start through end with a fixed number of intervals; useful for deterministic animation screenshots."
          :code $ quote $ defn sample-times (start end steps)
            if
              or (< end start) (<= steps 0)
                not= steps $ floor steps
              raise |invalid-frame-sampling
              map
                range 0 $ + steps 1
                fn (index)
                  + start $ * (- end start) (/ index steps)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'Number 'Number
            :return $ :: 'List 'Number
          :tests $ []
            %{} 'TestEntry (:name |inclusive-quarter-frames)
              :code $ quote $ is= ([] 0 0.25 0.5 0.75 1) (sample-times 0 1 4)
              :tags $ #{} :frame-clock :unit
            %{} 'TestEntry (:name |rejects-invalid-samples)
              :code $ quote $ do
                is-throws $ sample-times 1 0 4
                is-throws $ sample-times 0 1 0
                is-throws $ sample-times 0 1 2.5
              :tags $ #{} :frame-clock :unit
        'step-frame $ %{} 'CodeEntry
          :doc "|Calculate a pure frame sample from two absolute times in seconds; reject rewinds."
          :code $ quote $ defn step-frame (previous current)
            %{} FrameSample (:time current)
              :elapsed $ elapsed-between previous current
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.frame-clock/FrameSample)
            :args $ [] 'Number 'Number
          :tests $ []
            %{} 'TestEntry (:name |fixed-and-repeated)
              :code $ quote $ do
                let
                    first-frame $ step-frame 0 0.25
                    repeated $ step-frame 0.25 0.25
                  is= 0.25 $ :time first-frame
                  is= 0.25 $ :elapsed first-frame
                  is= 0.25 $ :time repeated
                  is= 0 $ :elapsed repeated
              :tags $ #{} :frame-clock :unit
            %{} 'TestEntry (:name |rejects-rewind)
              :code $ quote $ is-throws (step-frame 2 1)
              :tags $ #{} :frame-clock :unit
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.frame-clock
          :require $ calcit.test :refer $ is= is-throws
    'quamolit.frame-eval $ %{} 'FileEntry
      :defs $ {}
        'EvaluatedFrame $ %{} 'CodeEntry (:doc "|一次显式求值的时间采样、模型和场景；泛型保留模型与场景的类型。")
          :code $ quote $ defstruct EvaluatedFrame ([] 'M 'S) (:sample 'quamolit.frame-clock/FrameSample) (:model 'M) (:scene 'S)
          :examples $ []
          :schema $ :: 'StructDef
        'evaluate-at $ %{} 'CodeEntry
          :doc "|以绝对秒数推进显式帧，先更新模型再求场景；重复时间复用模型与场景且 elapsed 为零，倒退报错。调用方提供纯函数。"
          :code $ quote $ defn evaluate-at (previous time update-model view)
            let
                sample $ step-frame
                  :time $ :sample previous
                  , time
              if
                = 0 $ :elapsed sample
                %{} EvaluatedFrame (:sample sample)
                  :model $ :model previous
                  :scene $ :scene previous
                let
                    model $ update-model (:model previous) sample
                  %{} EvaluatedFrame (:sample sample) (:model model)
                    :scene $ view model
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.frame-eval/EvaluatedFrame 'M 'S) 'Number
              :: 'Fn $ {} (:return 'M)
                :args $ [] 'M 'quamolit.frame-clock/FrameSample
              :: 'Fn $ {} (:return 'S)
                :args $ [] 'M
            :generics $ [] 'M 'S
            :return $ :: 'quamolit.frame-eval/EvaluatedFrame 'M 'S
          :tests $ []
            %{} 'TestEntry (:name |replay-and-step)
              :code $ quote $ let
                  update-model $ fn (model sample)
                    hint-fn $ {}
                      :args $ [] 'Number 'quamolit.frame-clock/FrameSample
                      :return 'Number
                    + model $ :elapsed sample
                  view $ fn (model)
                    hint-fn $ {}
                      :args $ [] 'Number
                      :return 'Number
                    + 48 $ * 160 model
                  start $ initial-frame 0 0 view
                  first-frame $ evaluate-at start 0.25 update-model view
                  second-frame $ evaluate-at first-frame 0.5 update-model view
                  replay $ evaluate-at (evaluate-at start 0.25 update-model view) 0.5 update-model view
                is= 0 $ :model start
                is= 48 $ :scene start
                is= 0.5 $ :model second-frame
                is= 128 $ :scene second-frame
                is= 0.25 $ :elapsed $ :sample second-frame
                is= second-frame replay
                is= second-frame $ evaluate-at first-frame 0.5 update-model view
              :tags $ #{} :frame-clock :unit
            %{} 'TestEntry (:name |repeated-time-skips-callbacks)
              :code $ quote $ let
                  update-model $ fn (model sample)
                    hint-fn $ {}
                      :args $ [] 'Number 'quamolit.frame-clock/FrameSample
                      :return 'Number
                    + model $ :elapsed sample
                  view $ fn (model)
                    hint-fn $ {}
                      :args $ [] 'Number
                      :return 'Number
                    + 48 $ * 160 model
                  advanced $ evaluate-at (initial-frame 0 0 view) 0.5 update-model view
                  repeated $ evaluate-at advanced 0.5
                    fn (model sample)
                      hint-fn $ {}
                        :args $ [] 'Number 'quamolit.frame-clock/FrameSample
                        :return 'Number
                      raise |unexpected-update
                    fn (model)
                      hint-fn $ {}
                        :args $ [] 'Number
                        :return 'Number
                      raise |unexpected-view
                is= 0.5 $ :model repeated
                is= 128 $ :scene repeated
                is= 0 $ :elapsed $ :sample repeated
              :tags $ #{} :frame-clock :unit
            %{} 'TestEntry (:name |rewind-and-explicit-reset)
              :code $ quote $ let
                  update-model $ fn (model sample)
                    hint-fn $ {}
                      :args $ [] 'Number 'quamolit.frame-clock/FrameSample
                      :return 'Number
                    + model $ :elapsed sample
                  view $ fn (model)
                    hint-fn $ {}
                      :args $ [] 'Number
                      :return 'Number
                    + 48 $ * 160 model
                  advanced $ evaluate-at (initial-frame 0 0 view) 1 update-model view
                  restarted $ initial-frame 0 0 view
                is-throws $ evaluate-at advanced 0.5 update-model view
                is= 128 $ :scene $ evaluate-at restarted 0.5 update-model view
                is= 1 $ :model advanced
              :tags $ #{} :frame-clock :unit
            %{} 'TestEntry (:name |model-and-scene-types)
              :code $ quote $ let
                  update-model $ fn (model sample)
                    hint-fn $ {}
                      :args $ [] 'Number 'quamolit.frame-clock/FrameSample
                      :return 'Number
                    + model $ :elapsed sample
                  view $ fn (model)
                    hint-fn $ {}
                      :args $ [] 'Number
                      :return 'String
                    str |position: model
                  frame $ evaluate-at (initial-frame 2 10 view) 2.5 update-model view
                is= 10.5 $ :model frame
                is= |position:10.5 $ :scene frame
                is= 2.5 $ :time $ :sample frame
              :tags $ #{} :frame-clock :unit
        'initial-frame $ %{} 'CodeEntry (:doc "|从给定时间和模型建立起点，调用纯视图一次；可用于显式重置或重放。")
          :code $ quote $ defn initial-frame (time model view)
            %{} EvaluatedFrame
              :sample $ step-frame time time
              :model model
              :scene $ view model
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'M $ :: 'Fn
              {} (:return 'S)
                :args $ [] 'M
            :generics $ [] 'M 'S
            :return $ :: 'quamolit.frame-eval/EvaluatedFrame 'M 'S
        'tick-tree $ %{} 'CodeEntry
          :doc "|Invoke component on-tick callbacks in tree order without drawing; callers rebuild the scene after updates."
          :code $ quote $ defn tick-tree (tree dispatch! elapsed)
            if (nil? tree) &unit $ if
              and (struct? tree) (&struct:matches? tree Component)
              let
                  component $ assert-type tree Component
                  on-tick $ :on-tick component
                when (fn? on-tick) (on-tick elapsed dispatch!)
                tick-tree (:tree component) dispatch! elapsed
              let
                  shape $ assert-type tree Shape
                &doseq
                  cursor $ :children shape
                  tick-tree
                      last cursor
                      , .unwrap-or nil
                    , dispatch! elapsed
                , &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'Dynamic 'Dynamic 'Number
          :tests $ [] $ %{} 'TestEntry (:name |parent-before-child)
            :code $ quote $ let
                seen $ atom $ []
                child $ %{} Component (:name :child) (:tree nil)
                  :on-tick $ fn (elapsed dispatch!) (swap! seen conj :child)
                parent $ %{} Component (:name :parent)
                  :on-tick $ fn (elapsed dispatch!) (swap! seen conj :parent)
                  :tree $ %{} Shape (:name :group)
                    :style $ {}
                    :event nil
                    :children $ [] $ [] 0 child
              tick-tree parent
                fn (op data) &unit
                , 0.25
              is= ([] :parent :child) @seen
            :tags $ #{} :frame-clock :unit
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.frame-eval
          :require
            quamolit.types :refer $ Component Shape
            calcit.test :refer $ is= is-throws
            quamolit.frame-clock :refer $ FrameSample step-frame
    'quamolit.global $ %{} 'FileEntry
      :defs $ {}
        '*stage-config $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *stage-config
            {}
              :move $ [] 0 0
              :scale 1
          :examples $ []
          :schema $ :: 'Dynamic
        '*touch-event-areas $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *touch-event-areas ([])
          :examples $ []
          :schema $ :: 'Ref $ :: 'List 'Dynamic
        '*tracked-transform $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *tracked-transform
            {}
              :offset $ [] 0 0
              :transform $ [] 1 0
              :alpha 1
          :examples $ []
          :schema $ :: 'Ref $ :: 'Map 'Tag 'Dynamic
        '*transforms-memory $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *transforms-memory ([])
          :examples $ []
          :schema $ :: 'Ref $ :: 'List (:: 'Map 'Tag 'Dynamic)
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.global
    'quamolit.gpu-component $ %{} 'FileEntry
      :defs $ {}
        'BatchPlan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct BatchPlan (:source 'quamolit.retained-component/ComponentPlan) (:prepared 'quamolit.gpu-component/PreparedFrame) (:delta 'quamolit.gpu-component/RectUpdate)
            :indices $ :: 'List 'Number
            :full-builds 'Number
            :candidates 'Number
          :examples $ []
          :schema $ :: 'StructDef
        'FastResult $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct FastResult (:prepared 'quamolit.gpu-component/PreparedFrame)
            :writes $ :: 'List 'quamolit.gpu-component/RectWrite
            :candidates 'Number
          :examples $ []
          :schema $ :: 'StructDef
        'PreparedFrame $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defenum PreparedFrame (:rects 'quamolit.gpu-component/RectFrame) (:fallback 'String)
          :examples $ []
          :schema $ :: 'EnumDef
        'RectFrame $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct RectFrame
            :records $ :: 'List 'quamolit.gpu-component/RectRecord
          :examples $ []
          :schema $ :: 'StructDef
        'RectRecord $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct RectRecord (:id 'String) (:rect 'quamolit.scene-ir/RectNode) (:matrix 'quamolit.scene-ir/Matrix2D)
          :examples $ []
          :schema $ :: 'StructDef
        'RectUpdate $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct RectUpdate (:frame 'quamolit.gpu-component/RectFrame)
            :writes $ :: 'List 'quamolit.gpu-component/RectWrite
            :uploaded-bytes 'Number
            :instances 'Number
          :examples $ []
          :schema $ :: 'StructDef
        'RectWrite $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct RectWrite (:index 'Number) (:record 'quamolit.gpu-component/RectRecord)
          :examples $ []
          :schema $ :: 'StructDef
        'build-batch $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn build-batch (plan)
            let
                prepared $ prepare-plan plan
              BatchPlan :source plan :prepared prepared :delta
                update-frame (empty-frame) (frame-of prepared)
                , :indices
                  unique-indices (:slots plan) ([])
                  , :full-builds 1 :candidates $ count $ :nodes (:scene plan)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/BatchPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan
        'canvas-channel $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn canvas-channel (value)
            /
              round $ * value 255
              , 255
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'collect-writes $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn collect-writes (before after index result)
            if
              >= index $ count after
              , result $ let
                  record $ &list:nth after index
                  unchanged? $ if
                    < index $ count before
                    = record $ &list:nth before index
                    , false
                recur before after (inc index)
                  if unchanged? result $ conj result $ RectWrite :index index :record record
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.gpu-component/RectRecord) (:: 'List 'quamolit.gpu-component/RectRecord) 'Number $ :: 'List 'quamolit.gpu-component/RectWrite
            :return $ :: 'List 'quamolit.gpu-component/RectWrite
        'create-renderer! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn create-renderer! (canvas device format capacity)
            raw-create! canvas (unsafe-coerce device 'JsObject) format capacity
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'JsObject)
            :args $ [] 'JsObject 'js-ffi.webgpu/DeviceHost 'String 'Number
            :features $ #{} :js-ffi
        'dispose-renderer! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn dispose-renderer! (host) &unit
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
            :js $ {} $ :inline "|h=>{if(h.disposed)return;h.disposed=true;try{h.context.unconfigure();}finally{try{h.vertices.destroy();}finally{try{h.params.destroy();}finally{h.motions?.destroy();}}}}"
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject
            :features $ #{} :js-ffi
        'empty-frame $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-frame ()
            RectFrame :records $ []
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/RectFrame)
            :args $ []
        'empty-writes $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-writes () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.gpu-component/RectWrite
        'finite-corner? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn finite-corner? (m x y)
            and
              <=
                +
                  +
                    abs $ * (:a m) x
                    abs $ * (:c m) y
                  abs $ :e m
                , 1e37
              <=
                +
                  +
                    abs $ * (:b m) x
                    abs $ * (:d m) y
                  abs $ :f m
                , 1e37
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.scene-ir/Matrix2D 'Number 'Number
        'first-reason $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn first-reason (plan index)
            if
              >= index $ count $ :nodes (:scene plan)
              , | $ let
                  reason $ node-reason plan index
                if (= reason |)
                  recur plan $ inc index
                  , reason
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'String)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'Number
        'frame-of $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn frame-of (prepared)
            match prepared
              (:rects frame) frame
              (:fallback reason) (empty-frame)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/RectFrame)
            :args $ [] 'quamolit.gpu-component/PreparedFrame
        'identity-matrix $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn identity-matrix ()
            scene/Matrix2D :a 1 :b 0 :c 0 :d 1 :e 0 :f 0
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/Matrix2D)
            :args $ []
        'matrix-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn matrix-at (plan index)
            if
              retained/transform-active? $ :transform-sampler plan
              &list:nth (:transforms plan) index
              identity-matrix
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/Matrix2D)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'Number
        'node-reason $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn node-reason (plan index)
            let
                node $ &list:nth
                  :nodes $ :scene plan
                  , index
              if
                not= (:parent node) |
                , |nested-scene-requires-layer-fallback $ match (:content node)
                  (:rect r)
                    if
                      valid-record? $ RectRecord :id (:id node) :rect r :matrix $ matrix-at plan index
                      , | |geometry-outside-f32-domain
                  _ $ str |unsupported-node: $ scene/content-kind (:content node)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'String)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'Number
        'prepare-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn prepare-plan (plan)
            assert |invalid-gpu-component-scene $ scene/validate-scene $ :scene plan
            when
              retained/transform-active? $ :transform-sampler plan
              assert |invalid-gpu-component-transforms $ and
                =
                  count $ :transforms plan
                  count $ :nodes $ :scene plan
                every? (:transforms plan) retained/valid-transform?
            let
                reason $ first-reason plan 0
              if (not= reason |) (PreparedFrame :fallback reason)
                PreparedFrame :rects $ RectFrame :records $ map
                  range $ count $ :nodes (:scene plan)
                  fn (index) (rect-record plan index)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/PreparedFrame)
            :args $ [] 'quamolit.retained-component/ComponentPlan
        'raw-check! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn raw-check! (host instance-count) &unit
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
            :js $ {} $ :inline "|(h,count)=>{if(h.disposed)throw Error(\"gpu-component-disposed\");if(!Number.isSafeInteger(count)||count<0||count>h.capacity)throw Error(\"gpu-component-capacity\");if(!Number.isSafeInteger(h.canvas.width)||h.canvas.width<=0||!Number.isSafeInteger(h.canvas.height)||h.canvas.height<=0)throw Error(\"gpu-component-viewport\");}"
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject 'Number
            :features $ #{} :js-ffi
        'raw-create! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn raw-create! (canvas device format capacity) (raise |js-only-gpu-component)
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
            :js $ {} $ :file |src/host/gpu-component-create.mjs
          :schema $ :: 'Fn $ {} (:return 'JsObject)
            :args $ [] 'JsObject 'JsObject 'String 'Number
            :features $ #{} :js-ffi
        'raw-draw! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn raw-draw! (host instance-count) &unit
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
            :js $ {} $ :inline "|(h,count)=>{\nif(h.disposed)throw Error('gpu-component-disposed');\nif(!Number.isSafeInteger(count)||count<0||count>h.capacity)throw Error('gpu-component-capacity');\nconst {width,height}=h.canvas;\nif(!Number.isSafeInteger(width)||width<=0||!Number.isSafeInteger(height)||height<=0)throw Error('gpu-component-viewport');\nh.viewScratch[0]=width;h.viewScratch[1]=height;h.device.queue.writeBuffer(h.params,0,h.viewScratch);\nconst encoder=h.device.createCommandEncoder(),pass=encoder.beginRenderPass({colorAttachments:[{view:h.context.getCurrentTexture().createView(),loadOp:'clear',storeOp:'store',clearValue:{r:1,g:1,b:1,a:1}}]});\nif(count>0){pass.setPipeline(h.pipeline);pass.setBindGroup(0,h.bindGroup);pass.setVertexBuffer(0,h.vertices);pass.draw(6,count);h.draws++;}\npass.end();h.device.queue.submit([encoder.finish()]);h.submits++;\n}"
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject 'Number
            :features $ #{} :js-ffi
        'raw-write! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn raw-write!
            host index x y width height r g b alpha a mb c md e f
            , &unit
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
            :js $ {} $ :inline "|(h,index,x,y,w,height,r,g,b,alpha,a,mb,c,md,e,f)=>{\nif(h.disposed)throw Error('gpu-component-disposed');\nif(!Number.isSafeInteger(index)||index<0||index>=h.capacity)throw Error('gpu-component-capacity');\nconst values=[x,y,w,height,r,g,b,alpha,a,mb,c,md,e,f,0,0];\nif(!values.every(v=>Number.isFinite(v)&&Number.isFinite(Math.fround(v))))throw Error('gpu-component-nonfinite');\nh.recordScratch.set(values);h.device.queue.writeBuffer(h.vertices,index*64,h.recordScratch);h.uploadedBytes+=64;\n}"
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject 'Number 'Number 'Number 'Number 'Number 'Number 'Number 'Number 'Number 'Number 'Number 'Number 'Number 'Number 'Number
            :features $ #{} :js-ffi
        'rebuild-batch $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn rebuild-batch (batch plan)
            let
                fresh $ build-batch plan
              struct-with fresh
                :delta $ update-frame
                  frame-of $ :prepared batch
                  frame-of $ :prepared fresh
                :full-builds $ inc $ :full-builds batch
                :candidates $ + (:candidates batch) (:candidates fresh)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/BatchPlan)
            :args $ [] 'quamolit.gpu-component/BatchPlan 'quamolit.retained-component/ComponentPlan
        'record-values $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn record-values (record)
            let
                r $ :rect record
                c $ :fill r
                m $ :matrix record
              [] (:x r) (:y r) (:width r) (:height r)
                canvas-channel $ :r c
                canvas-channel $ :g c
                canvas-channel $ :b c
                :a c
                :a m
                :b m
                :c m
                :d m
                :e m
                :f m
                , 0 0
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.gpu-component/RectRecord
            :return $ :: 'List 'Number
        'rect-record $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn rect-record (plan index)
            let
                node $ &list:nth
                  :nodes $ :scene plan
                  , index
              match (:content node)
                (:rect r)
                  RectRecord :id (:id node) :rect r :matrix $ matrix-at plan index
                _ $ raise |unsupported-gpu-rect-record
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/RectRecord)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'Number
        'submit-batch! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn submit-batch! (host batch)
            match (:prepared batch)
              (:fallback reason) (raise reason)
              (:rects frame)
                submit-update! host $ :delta batch
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject 'quamolit.gpu-component/BatchPlan
            :features $ #{} :js-ffi
        'submit-frame! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn submit-frame! (host previous next)
            let
                delta $ update-frame previous next
              assert |invalid-gpu-component-frame $ every? (:records next) valid-record?
              submit-update! host delta
              , delta
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/RectUpdate)
            :args $ [] 'JsObject 'quamolit.gpu-component/RectFrame 'quamolit.gpu-component/RectFrame
            :features $ #{} :js-ffi
        'submit-update! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn submit-update! (host delta)
            raw-check! host $ :instances delta
            assert |invalid-gpu-delta-count $ = (:instances delta)
              count $ :records $ :frame delta
            each (:writes delta)
              fn (write)
                assert |invalid-gpu-delta-index $ and
                  >= (:index write) 0
                  = (:index write)
                    floor $ :index write
                  < (:index write) (:instances delta)
                assert |invalid-gpu-delta-record $ and
                  valid-record? $ :record write
                  = (:record write)
                    &list:nth
                      :records $ :frame delta
                      :index write
            each (:writes delta)
              fn (write)
                let
                    record $ :record write
                    r $ :rect record
                    color $ :fill r
                    m $ :matrix record
                  raw-write! host (:index write) (:x r) (:y r) (:width r) (:height r)
                    canvas-channel $ :r color
                    canvas-channel $ :g color
                    canvas-channel $ :b color
                    :a color
                    :a m
                    :b m
                    :c m
                    :d m
                    :e m
                    :f m
            raw-draw! host $ :instances delta
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject 'quamolit.gpu-component/RectUpdate
            :features $ #{} :js-ffi
        'unique-indices $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn unique-indices (slots result)
            if (empty? slots) result $ let
                index $ :index $ &list:nth slots 0
              recur (rest slots)
                if (includes? result index) result $ conj result index
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.retained-component/BoundScalar) (:: 'List 'Number)
            :return $ :: 'List 'Number
        'update-batch $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-batch (batch plan)
            let
                old $ :source batch
                stable? $ and
                  = (:id old) (:id plan)
                  = (:versions old) (:versions plan)
                  not $ retained/transform-active? $ :transform-sampler plan
                  not $ retained/transform-active? $ :transform-sampler old
              if stable?
                match (:prepared batch)
                  (:fallback reason) (rebuild-batch batch plan)
                  (:rects frame)
                    let
                        result $ if
                          = (:time old) (:time plan)
                          FastResult :prepared (:prepared batch) :writes (empty-writes) :candidates 0
                          walk-indices plan (:indices batch) (:records frame) (empty-writes) 0
                        next $ frame-of $ :prepared result
                        delta $ RectUpdate :frame next :writes (:writes result) :instances
                          count $ :records next
                          , :uploaded-bytes $ * 64
                            count $ :writes result
                      struct-with batch (:source plan)
                        :prepared $ :prepared result
                        :delta delta
                        :candidates $ + (:candidates batch) (:candidates result)
                rebuild-batch batch plan
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/BatchPlan)
            :args $ [] 'quamolit.gpu-component/BatchPlan 'quamolit.retained-component/ComponentPlan
        'update-frame $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-frame (previous next)
            let
                writes $ collect-writes (:records previous) (:records next) 0 $ empty-writes
              RectUpdate :frame next :writes writes :uploaded-bytes
                * 64 $ count writes
                , :instances $ count $ :records next
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/RectUpdate)
            :args $ [] 'quamolit.gpu-component/RectFrame 'quamolit.gpu-component/RectFrame
        'valid-record? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn valid-record? (record)
            let
                r $ :rect record
                m $ :matrix record
                x $ :x r
                y $ :y r
                right $ + x $ :width r
                bottom $ + y $ :height r
              and
                every? (record-values record) f32/finite-f32?
                finite-corner? m x y
                finite-corner? m right y
                finite-corner? m x bottom
                finite-corner? m right bottom
                scene/valid-content? $ scene/SceneContent :rect r
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.gpu-component/RectRecord
        'walk-indices $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn walk-indices (plan indices records writes checked)
            if (empty? indices)
              FastResult :prepared
                PreparedFrame :rects $ RectFrame :records records
                , :writes writes :candidates checked
              let
                  index $ &list:nth indices 0
                  node $ &list:nth
                    :nodes $ :scene plan
                    , index
                  next $ rect-record plan index
                if
                  and
                    = (:parent node) |
                    valid-record? next
                  let
                      same? $ = next $ &list:nth records index
                    recur plan (rest indices)
                      if same? records $ assoc records index next
                      if same? writes $ conj writes $ RectWrite :index index :record next
                      inc checked
                  FastResult :prepared (PreparedFrame :fallback |geometry-outside-f32-domain) :writes (empty-writes) :candidates $ inc checked
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/FastResult)
            :args $ [] 'quamolit.retained-component/ComponentPlan (:: 'List 'Number) (:: 'List 'quamolit.gpu-component/RectRecord) (:: 'List 'quamolit.gpu-component/RectWrite) 'Number
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.gpu-component
          :require (quamolit.scene-ir :as scene) (quamolit.retained-component :as retained) (quamolit.gpu-vec2-translation :as f32)
    'quamolit.gpu-scalar-program $ %{} 'FileEntry
      :defs $ {}
        'ParameterResult $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defenum ParameterResult (:ready 'quamolit.gpu-scalar-program/ScalarParameter) (:fallback 'String)
          :examples $ []
          :schema $ :: 'EnumDef
        'ProgramResult $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defenum ProgramResult (:ready 'quamolit.gpu-scalar-program/ScalarProgram) (:fallback 'String)
          :examples $ []
          :schema $ :: 'EnumDef
        'ScalarParameter $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct ScalarParameter (:index 'Number) (:axis 'Number) (:start 'Number) (:duration 'Number) (:from 'Number) (:to 'Number) (:easing 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'ScalarProgram $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct ScalarProgram (:source 'quamolit.retained-component/ComponentPlan) (:frame 'quamolit.gpu-component/RectFrame)
            :parameters $ :: 'List 'quamolit.gpu-scalar-program/ScalarParameter
            :precision-base 'Number
            :precision-slope 'Number
          :examples $ []
          :schema $ :: 'StructDef
        'axis-of $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn axis-of (slot)
            match (:target slot)
              (:x) 0
              (:y) 1
              _ -1
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.retained-component/BoundScalar
        'bounded? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn bounded? (value)
            and (f32/finite-f32? value)
              <= (abs value) 1e30
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'Number
        'collect-parameters $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn collect-parameters (slots plan frame parameters)
            if (empty? slots) (finish-program plan frame parameters)
              let
                  slot $ first-slot slots
                do
                  assert |gpu-scalar-binding-index $ and
                    motion/valid-motion-version? $ :index slot
                    < (:index slot)
                      count $ :records frame
                  match (prepare-slot slot)
                    (:fallback reason) (ProgramResult :fallback reason)
                    (:ready parameter)
                      if
                        any? parameters $ fn (old)
                          and
                            = (:index old) (:index parameter)
                            = (:axis old) (:axis parameter)
                        ProgramResult :fallback |duplicate-gpu-scalar-target
                        recur (rest slots) plan frame $ append parameters parameter
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-scalar-program/ProgramResult)
            :args $ [] (:: 'List 'quamolit.retained-component/BoundScalar) 'quamolit.retained-component/ComponentPlan 'quamolit.gpu-component/RectFrame $ :: 'List 'quamolit.gpu-scalar-program/ScalarParameter
        'create-renderer! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn create-renderer! (canvas device format capacity)
            raw-create! canvas (unsafe-coerce device 'JsObject) format capacity true
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'JsObject)
            :args $ [] 'JsObject 'js-ffi.webgpu/DeviceHost 'String 'Number
            :features $ #{} :js-ffi
        'draw-at! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-at! (host program time)
            assert |gpu-scalar-time-domain $ time-supported? program time
            gpu/raw-draw! host $ raw-time! host time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject 'quamolit.gpu-scalar-program/ScalarProgram 'Number
            :features $ #{} :js-ffi
        'empty-parameters $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-parameters () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.gpu-scalar-program/ScalarParameter
        'finish-program $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn finish-program (plan frame parameters)
            let
                precision $ precision-envelope parameters
                program $ ScalarProgram :source plan :frame frame :parameters parameters :precision-base (:x precision) :precision-slope $ :y precision
              if
                time-supported? program $ :time plan
                ProgramResult :ready program
                ProgramResult :fallback |scalar-precision-budget
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-scalar-program/ProgramResult)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'quamolit.gpu-component/RectFrame $ :: 'List 'quamolit.gpu-scalar-program/ScalarParameter
        'first-slot $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn first-slot (slots)
            -> (get slots 0) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/BoundScalar)
            :args $ [] $ :: 'List 'quamolit.retained-component/BoundScalar
        'install-program! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn install-program! (host program)
            assert |gpu-scalar-program-mismatch $ = (ProgramResult :ready program)
              prepare-program $ :source program
            let
                instances $ count $ :records (:frame program)
                time $ :time $ :source program
              assert |gpu-scalar-time-domain $ time-supported? program time
              gpu/raw-check! host instances
              raw-reset! host instances time
              each (:parameters program)
                fn (p) (write-parameter! host p)
              gpu/submit-frame! host (gpu/empty-frame) (:frame program)
              raw-ready! host
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject 'quamolit.gpu-scalar-program/ScalarProgram
            :features $ #{} :js-ffi
        'make-parameter $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn make-parameter (slot tween)
            let
                values $ [] (:start tween) (:duration tween) (:from tween) (:to tween)
                  + (:start tween) (:duration tween)
              if
                and (every? values bounded?)
                  >= (:duration tween) 0
                  or
                    = (:duration tween) 0
                    >= (:duration tween) 1e-30
                ParameterResult :ready $ ScalarParameter :index (:index slot) :axis (axis-of slot) :start (:start tween) :duration (:duration tween) :from (:from tween) :to (:to tween) :easing $ match (:easing tween)
                  (:linear) 0
                  (:smoothstep) 1
                ParameterResult :fallback |scalar-parameters-outside-f32-domain
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-scalar-program/ParameterResult)
            :args $ [] 'quamolit.retained-component/BoundScalar 'quamolit.motion/ScalarTween
        'parameter-precision $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn parameter-precision (p)
            let
                from $ :from p
                to $ :to p
                duration $ :duration p
                magnitude $ + (abs from) (abs to)
                minimum $ if
                  <= (* from to) 0
                  , 0 $ if
                    < (abs from) (abs to)
                    abs from
                    abs to
                budget $ + 0.00001 $ * 0.00001 minimum
                scale $ / (* 8 1.1920928955078125e-7) budget
              if
                and (= duration 0) (not= from to)
                motion/Vec2 :x 2 :y 0
                let
                    speed $ if (= from to) 0 $ *
                      if
                        = (:easing p) 1
                        , 1.5 1
                      /
                        abs $ - to from
                        , duration
                  motion/Vec2 :x
                    * scale $ + magnitude $ * speed
                      +
                        abs $ :start p
                        , duration
                    , :y $ * scale speed
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/Vec2)
            :args $ [] 'quamolit.gpu-scalar-program/ScalarParameter
        'parameter-values $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn parameter-values (parameter)
            [] (:index parameter) (:axis parameter) (:start parameter) (:duration parameter) (:from parameter) (:to parameter) (:easing parameter) 0
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.gpu-scalar-program/ScalarParameter
            :return $ :: 'List 'Number
        'precision-envelope $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn precision-envelope (parameters)
            foldl parameters (motion/Vec2 :x 0 :y 0)
              fn (acc p)
                hint-fn $ {}
                  :args $ [] 'quamolit.motion/Vec2 'quamolit.gpu-scalar-program/ScalarParameter
                  :return 'quamolit.motion/Vec2
                let
                    cost $ parameter-precision p
                  motion/Vec2 :x
                    if
                      > (:x acc) (:x cost)
                      :x acc
                      :x cost
                    , :y $ if
                      > (:y acc) (:y cost)
                      :y acc
                      :y cost
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/Vec2)
            :args $ [] $ :: 'List 'quamolit.gpu-scalar-program/ScalarParameter
        'prepare-program $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn prepare-program (plan)
            if
              retained/transform-active? $ :transform-sampler plan
              ProgramResult :fallback |cpu-transform-required
              match (gpu/prepare-plan plan)
                (:fallback reason) (ProgramResult :fallback reason)
                (:rects frame)
                  collect-parameters (:slots plan) plan frame $ empty-parameters
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-scalar-program/ProgramResult)
            :args $ [] 'quamolit.retained-component/ComponentPlan
        'prepare-slot $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn prepare-slot (slot)
            if
              < (axis-of slot) 0
              ParameterResult :fallback |scalar-target-not-supported
              match
                lowering/lower-scalar $ :descriptor slot
                (:unsupported reason) (ParameterResult :fallback reason)
                (:supported candidate)
                  match (:kernel candidate)
                    (:constant value)
                      make-parameter slot $ motion/ScalarTween :start 0 :duration 0 :from value :to value :easing $ motion/Easing :linear
                    (:tween tween) (make-parameter slot tween)
                    _ $ ParameterResult :fallback |scalar-kernel-not-supported
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-scalar-program/ParameterResult)
            :args $ [] 'quamolit.retained-component/BoundScalar
        'raw-create! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn raw-create! (canvas device format capacity scalar) (raise |js-only-gpu-scalar)
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
            :js $ {} $ :file |src/host/gpu-component-create.mjs
          :schema $ :: 'Fn $ {} (:return 'JsObject)
            :args $ [] 'JsObject 'JsObject 'String 'Number 'Bool
            :features $ #{} :js-ffi
        'raw-parameter! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn raw-parameter! (host index axis start duration from to easing) &unit
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
            :js $ {} $ :inline "|(h,index,axis,start,duration,from,to,easing)=>{\n if(h.disposed||!h.motions)throw Error('gpu-scalar-host-required');\n if(!Number.isSafeInteger(index)||index<0||index>=h.scalarCount||(axis!==0&&axis!==1))throw Error('gpu-scalar-index');\n h.scalarScratch.set([from,to,start,duration,1,easing,0,0]);\n h.device.queue.writeBuffer(h.motions,index*64+axis*32,h.scalarScratch);h.parameterBytes+=32;\n}"
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject 'Number 'Number 'Number 'Number 'Number 'Number 'Number
            :features $ #{} :js-ffi
        'raw-ready! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn raw-ready! (host) &unit
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
            :js $ {} $ :inline |h=>{h.scalarReady=true;}
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject
            :features $ #{} :js-ffi
        'raw-reset! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn raw-reset! (host instances time) &unit
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
            :js $ {} $ :inline "|(h,count,time)=>{\n if(h.disposed||!h.motions)throw Error('gpu-scalar-host-required');\n if(!Number.isSafeInteger(count)||count<0||count>h.capacity)throw Error('gpu-scalar-capacity');\n h.scalarReady=false;h.scalarCount=count;h.viewScratch[2]=time;\n if(count>0){h.device.queue.writeBuffer(h.motions,0,new Float32Array(count*16));h.parameterBytes+=count*64;}\n}"
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject 'Number 'Number
            :features $ #{} :js-ffi
        'raw-time! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn raw-time! (host time) (raise |js-only-gpu-scalar)
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
            :js $ {} $ :inline "|(h,time)=>{if(h.disposed||!h.motions||!h.scalarReady)throw Error('gpu-scalar-not-installed');h.viewScratch[2]=time;return h.scalarCount;}"
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'JsObject 'Number
            :features $ #{} :js-ffi
        'reusable? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reusable? (program plan)
            and
              =
                :id $ :source program
                :id plan
              =
                :versions $ :source program
                :versions plan
              not $ retained/transform-active? $ :transform-sampler plan
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.gpu-scalar-program/ScalarProgram 'quamolit.retained-component/ComponentPlan
        'time-supported? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn time-supported? (program time)
            and (bounded? time)
              <=
                + (:precision-base program)
                  * (abs time) (:precision-slope program)
                , 1
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.gpu-scalar-program/ScalarProgram 'Number
        'write-parameter! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn write-parameter! (host p)
            raw-parameter! host (:index p) (:axis p) (:start p) (:duration p) (:from p) (:to p) (:easing p)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'JsObject 'quamolit.gpu-scalar-program/ScalarParameter
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.gpu-scalar-program
          :require (quamolit.motion :as motion) (quamolit.motion-gpu :as lowering) (quamolit.retained-component :as retained) (quamolit.gpu-component :as gpu) (quamolit.gpu-vec2-translation :as f32)
    'quamolit.gpu-vec2-translation $ %{} 'FileEntry
      :defs $ {}
        'GpuVec2TranslationFrame $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct GpuVec2TranslationFrame (:from 'quamolit.motion/Vec2) (:to 'quamolit.motion/Vec2) (:time 'Number) (:start 'Number) (:duration 'Number) (:easing 'String)
          :examples $ []
          :schema $ :: 'StructDef
        'GpuVec2TranslationLowering $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defenum GpuVec2TranslationLowering
            :ready 'quamolit.gpu-vec2-translation/GpuVec2TranslationPlan
            :unsupported 'String
          :examples $ []
          :schema $ :: 'EnumDef
        'GpuVec2TranslationPlan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct GpuVec2TranslationPlan (:id 'String) (:version 'Number) (:from 'quamolit.motion/Vec2) (:to 'quamolit.motion/Vec2) (:start 'Number) (:duration 'Number) (:easing 'String)
          :examples $ []
          :schema $ :: 'StructDef
        'finite-f32? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn finite-f32? (value)
            hint-fn $ {}
              :args $ [] 'Number
              :return 'Bool
            and (motion/finite-number? value)
              <= (abs value) 3.4028234663852886e38
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'Number
        'frame-at $ %{} 'CodeEntry (:doc "|给已准备的位移计划附加绝对时间；WebGPU 宿主仍负责 f32 和资源契约的最终校验。")
          :code $ quote $ defn frame-at (plan time)
            hint-fn $ {}
              :args $ [] 'quamolit.gpu-vec2-translation/GpuVec2TranslationPlan 'Number
              :return 'quamolit.gpu-vec2-translation/GpuVec2TranslationFrame
            assert |gpu-translation-time-must-be-finite-f32 $ finite-f32? time
            GpuVec2TranslationFrame :from (:from plan) :to (:to plan) :time time :start (:start plan) :duration (:duration plan) :easing $ :easing plan
          :examples $ []
          :schema $ :: 'Fn $ {}
            :return 'quamolit.gpu-vec2-translation/GpuVec2TranslationFrame
            :args $ [] 'quamolit.gpu-vec2-translation/GpuVec2TranslationPlan 'Number
          :tests $ [] $ %{} 'TestEntry (:name |time-validation)
            :code $ quote $ let
                from $ motion/Vec2 :x 48 :y 80
                to $ motion/Vec2 :x 208 :y 120
                plan $ GpuVec2TranslationPlan :id |moving :version 1 :from from :to to :start 0 :duration 1 :easing |linear
              is=
                GpuVec2TranslationFrame :from from :to to :time 0.5 :start 0 :duration 1 :easing |linear
                frame-at plan 0.5
              is-throws $ frame-at plan 1e100
            :tags $ #{} :motion-gpu :unit
        'prepare $ %{} 'CodeEntry
          :doc "|将类型化 Vec2 Motion 计划转换为 WebGPU 位移参数；只处理 tween，不解释序列化 JS 对象。"
          :code $ quote $ defn prepare (lowering)
            hint-fn $ {}
              :args $ [] 'quamolit.motion-gpu/GpuVec2Lowering
              :return 'quamolit.gpu-vec2-translation/GpuVec2TranslationLowering
            match lowering
              (:unsupported reason) (GpuVec2TranslationLowering :unsupported reason)
              (:supported descriptor)
                match (:kernel descriptor)
                  (:constant value) (GpuVec2TranslationLowering :unsupported |vec2-tween-required)
                  (:tween tween)
                    if
                      and
                        finite-f32? $ :x $ :from tween
                        finite-f32? $ :y $ :from tween
                        finite-f32? $ :x $ :to tween
                        finite-f32? $ :y $ :to tween
                        finite-f32? $ :start tween
                        finite-f32? $ :duration tween
                        >= (:duration tween) 0
                      GpuVec2TranslationLowering :ready $ GpuVec2TranslationPlan :id (:id descriptor) :version (:version descriptor) :from (:from tween) :to (:to tween) :start (:start tween) :duration (:duration tween) :easing $ match (:easing tween)
                        (:linear) |linear
                        (:smoothstep) |smoothstep
                      GpuVec2TranslationLowering :unsupported |valid-vec2-tween-required
          :examples $ []
          :schema $ :: 'Fn $ {}
            :return 'quamolit.gpu-vec2-translation/GpuVec2TranslationLowering
            :args $ [] 'quamolit.motion-gpu/GpuVec2Lowering
          :tests $ []
            %{} 'TestEntry (:name |typed-gpu-translation)
              :code $ quote $ let
                  from $ motion/Vec2 :x 48 :y 80
                  to $ motion/Vec2 :x 208 :y 120
                  tween $ motion/Vec2Tween :start 0 :duration 1 :from from :to to :easing $ motion/Easing :smoothstep
                  descriptor $ motion-gpu/GpuVec2Plan :id |moving :version 1 :kernel $ motion-gpu/GpuVec2Kernel :tween tween
                  constant $ motion-gpu/GpuVec2Plan :id |fixed :version 1 :kernel $ motion-gpu/GpuVec2Kernel :constant from
                  too-large $ motion/Vec2Tween :start 0 :duration 1 :from (motion/Vec2 :x 1e100 :y 0) :to to :easing $ motion/Easing :linear
                  overflow $ motion-gpu/GpuVec2Plan :id |huge :version 1 :kernel $ motion-gpu/GpuVec2Kernel :tween too-large
                is=
                  GpuVec2TranslationLowering :ready $ GpuVec2TranslationPlan :id |moving :version 1 :from from :to to :start 0 :duration 1 :easing |smoothstep
                  prepare $ motion-gpu/GpuVec2Lowering :supported descriptor
                is= (GpuVec2TranslationLowering :unsupported |cpu-custom)
                  prepare $ motion-gpu/GpuVec2Lowering :unsupported |cpu-custom
                is= (GpuVec2TranslationLowering :unsupported |vec2-tween-required)
                  prepare $ motion-gpu/GpuVec2Lowering :supported constant
                is= (GpuVec2TranslationLowering :unsupported |valid-vec2-tween-required)
                  prepare $ motion-gpu/GpuVec2Lowering :supported overflow
              :tags $ #{} :motion-gpu :unit
            %{} 'TestEntry (:name |negative-duration)
              :code $ quote $ let
                  from $ motion/Vec2 :x 0 :y 0
                  to $ motion/Vec2 :x 10 :y 10
                  tween $ motion/Vec2Tween :start 0 :duration -1 :from from :to to :easing $ motion/Easing :linear
                  descriptor $ motion-gpu/GpuVec2Plan :id |invalid :version 1 :kernel $ motion-gpu/GpuVec2Kernel :tween tween
                is= (GpuVec2TranslationLowering :unsupported |valid-vec2-tween-required)
                  prepare $ motion-gpu/GpuVec2Lowering :supported descriptor
              :tags $ #{} :motion-gpu :unit
        'require-ready $ %{} 'CodeEntry
          :doc "|调用方要求 GPU tween 时提取已准备计划；失败保留诊断。可把计划缓存，逐帧只调用 frame-at。"
          :code $ quote $ defn require-ready (lowering)
            hint-fn $ {}
              :args $ [] 'quamolit.gpu-vec2-translation/GpuVec2TranslationLowering
              :return 'quamolit.gpu-vec2-translation/GpuVec2TranslationPlan
            match lowering
              (:ready plan) plan
              (:unsupported reason)
                raise $ str |unexpected-gpu-translation-plan: reason
          :examples $ []
          :schema $ :: 'Fn $ {}
            :return 'quamolit.gpu-vec2-translation/GpuVec2TranslationPlan
            :args $ [] 'quamolit.gpu-vec2-translation/GpuVec2TranslationLowering
      :ns $ %{} 'NsEntry
        :doc "|Quamolit 专属 GPU Vec2 Motion 参数解释；通用 WebGPU buffer 与绘制能力仍由 js-ffi 提供。"
        :code $ quote $ ns quamolit.gpu-vec2-translation
          :require (quamolit.motion :as motion) (quamolit.motion-gpu :as motion-gpu)
            calcit.test :refer $ is= is-throws
    'quamolit.host-clock $ %{} 'FileEntry
      :defs $ {}
        'HostClock $ %{} 'CodeEntry
          :doc "|Immutable mapping from a monotonic host timestamp to animation seconds. Negative speed is allowed for direct playback, not implicit reverse simulation."
          :code $ quote $ defstruct HostClock (:host-anchor 'Number) (:animation-anchor 'Number) (:speed 'Number) (:paused 'Bool)
          :examples $ []
          :schema $ :: 'StructDef
        'pause-clock $ %{} 'CodeEntry
          :doc "|Freeze animation at the value sampled at this host timestamp."
          :code $ quote $ defn pause-clock (clock host-time)
            HostClock :host-anchor host-time :animation-anchor (sample-clock clock host-time) :speed (:speed clock) :paused true
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.host-clock/HostClock)
            :args $ [] 'quamolit.host-clock/HostClock 'Number
        'resume-clock $ %{} 'CodeEntry
          :doc "|Resume at the stored rate without counting paused host time."
          :code $ quote $ defn resume-clock (clock host-time)
            HostClock :host-anchor host-time :animation-anchor (sample-clock clock host-time) :speed (:speed clock) :paused false
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.host-clock/HostClock)
            :args $ [] 'quamolit.host-clock/HostClock 'Number
        'sample-clock $ %{} 'CodeEntry
          :doc "|Map a finite host timestamp at or after the anchor to finite animation seconds."
          :code $ quote $ defn sample-clock (clock host-time)
            assert |invalid-host-clock $ valid-host-clock? clock
            assert |invalid-host-time $ finite-number? host-time
            assert |host-time-before-anchor $ >= host-time $ :host-anchor clock
            let
                animation-time $ if (:paused clock) (:animation-anchor clock)
                  + (:animation-anchor clock)
                    *
                      - host-time $ :host-anchor clock
                      :speed clock
              assert |non-finite-animation-time $ finite-number? animation-time
              , animation-time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.host-clock/HostClock 'Number
          :tests $ []
            %{} 'TestEntry (:name |timeline)
              :code $ quote $ let
                  start $ start-clock 10 0 1
                  paused $ pause-clock start 11
                  resumed $ resume-clock paused 20
                  fast $ set-clock-speed start 11 2
                  backward $ set-clock-speed fast 11.25 -1
                  paused-seek $ seek-clock paused 21 0.25
                  seek-resume $ resume-clock paused-seek 23
                is= ([] 0 0.5 1)
                  [] (sample-clock start 10) (sample-clock start 10.5) (sample-clock start 11)
                is= 1 $ sample-clock paused 20
                is= 1.5 $ sample-clock resumed 20.5
                is= 1.5 $ sample-clock fast 11.25
                is= 1.25 $ sample-clock backward 11.5
                is= 0.25 $ sample-clock paused-seek 23
                is= 0.75 $ sample-clock seek-resume 23.5
                is= 6 $ simulation-tick-at fast 11.25 0.25
                is= 4 $ simulation-tick-at paused 20 0.25
              :tags $ #{} :host-clock :unit
            %{} 'TestEntry (:name |invalid-clock-and-target)
              :code $ quote $ let
                  start $ start-clock 10 0 1
                  negative $ seek-clock start 11 -0.25
                  overflow $ start-clock 0 1e308 1e308
                is-throws $ start-clock (/ 0 0) 0 1
                is-throws $ start-clock 0 0 $ / 1 0
                is-throws $ sample-clock start 9.9
                is-throws $ sample-clock start $ / 0 0
                is-throws $ sample-clock overflow 1e308
                is-throws $ set-clock-speed start 10 $ / 1 0
                is-throws $ seek-clock start 11 $ / 0 0
                is-throws $ simulation-tick-at negative 11 0.25
                is-throws $ simulation-tick-at start 10 0
                is-throws $ simulation-tick-at start 10 $ / 1 0
              :tags $ #{} :host-clock :unit
        'seek-clock $ %{} 'CodeEntry
          :doc "|Set animation time explicitly at this host timestamp, retaining rate and pause state."
          :code $ quote $ defn seek-clock (clock host-time animation-time)
            assert |invalid-animation-time $ finite-number? animation-time
            sample-clock clock host-time
            HostClock :host-anchor host-time :animation-anchor animation-time :speed (:speed clock) :paused $ :paused clock
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.host-clock/HostClock)
            :args $ [] 'quamolit.host-clock/HostClock 'Number 'Number
        'set-clock-speed $ %{} 'CodeEntry
          :doc "|Change signed playback rate without jumping animation time; retain pause state."
          :code $ quote $ defn set-clock-speed (clock host-time speed)
            assert |invalid-clock-speed $ finite-number? speed
            HostClock :host-anchor host-time :animation-anchor (sample-clock clock host-time) :speed speed :paused $ :paused clock
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.host-clock/HostClock)
            :args $ [] 'quamolit.host-clock/HostClock 'Number 'Number
        'simulation-tick-at $ %{} 'CodeEntry
          :doc "|Map nonnegative animation seconds to a bounded target tick with explicit near-integer float snapping; never advance simulation state."
          :code $ quote $ defn simulation-tick-at (clock host-time dt)
            assert |invalid-simulation-dt $ finite-number? dt
            assert |non-positive-simulation-dt $ > dt 0
            let
                animation-time $ sample-clock clock host-time
                quotient $ / animation-time dt
              assert |negative-simulation-time $ >= animation-time 0
              assert |non-finite-simulation-tick $ finite-number? quotient
              assert |unsafe-simulation-tick $ <= quotient 9007199254740991
              let
                  nearest $ floor $ + quotient 0.5
                  tick $ if
                    <
                      abs $ - quotient nearest
                      , 1e-9
                    , nearest $ floor quotient
                , tick
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.host-clock/HostClock 'Number 'Number
          :tests $ [] $ %{} 'TestEntry (:name |fractional-boundary)
            :code $ quote $ let
                clock $ start-clock 0 0 1
              is= 3 $ simulation-tick-at clock 0.3 0.1
              is= 2 $ simulation-tick-at clock 0.299 0.1
              is= 0 $ simulation-tick-at clock 0 0.1
              is-throws $ simulation-tick-at clock 9007199254740992 1
            :tags $ #{} :host-clock :unit
        'start-clock $ %{} 'CodeEntry
          :doc "|Create an unpaused clock at explicit host and animation seconds with a signed rate."
          :code $ quote $ defn start-clock (host-time animation-time speed)
            assert |invalid-host-time $ finite-number? host-time
            assert |invalid-animation-time $ finite-number? animation-time
            assert |invalid-clock-speed $ finite-number? speed
            HostClock :host-anchor host-time :animation-anchor animation-time :speed speed :paused false
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.host-clock/HostClock)
            :args $ [] 'Number 'Number 'Number
        'valid-host-clock? $ %{} 'CodeEntry
          :doc "|Check that all clock anchors and the signed playback rate are finite."
          :code $ quote $ defn valid-host-clock? (clock)
            and
              finite-number? $ :host-anchor clock
              finite-number? $ :animation-anchor clock
              finite-number? $ :speed clock
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.host-clock/HostClock
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.host-clock
          :require
            quamolit.motion :refer $ finite-number?
            calcit.test :refer $ is= is-throws
    'quamolit.hud-logs $ %{} 'FileEntry
      :defs $ {}
        '*hud-logs $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *hud-logs ([])
          :examples $ []
          :schema $ :: 'Dynamic
        'clear-hud-logs! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn clear-hud-logs! ()
            reset! *hud-logs $ []
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ []
        'hud-log $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn hud-log (& xs)
            swap! *hud-logs conj $ join-str xs "|, "
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ []
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.hud-logs
    'quamolit.instance-ffi $ %{} 'FileEntry
      :defs $ {}
        'CanvasRectMetrics $ %{} 'CodeEntry
          :doc "|Canvas2D 矩形实例批次的边界调用、fillRect 调用、实例数和读取字节计数；不是 GPU 上传量。"
          :code $ quote $ defstruct CanvasRectMetrics (:boundary-calls 'Number) (:canvas-calls 'Number) (:instances 'Number) (:position-bytes-read 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'at $ %{} 'CodeEntry (:doc "|诊断用有界读取；热帧不得逐实例调用。")
          :code $ quote $ defn at (snapshot index)
            hint-fn $ {}
              :args $ [] 'js-ffi.typed-arrays/Float32SnapshotHost 'Number
              :return 'Number
              :features $ #{} :js-ffi
            arrays/float32-at snapshot index
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'js-ffi.typed-arrays/Float32SnapshotHost 'Number
            :features $ #{} :js-ffi
        'copy-range $ %{} 'CodeEntry (:doc "|只在源版本首次被宿主消费时复制范围，并缓存返回数组。")
          :code $ quote $ defn copy-range (snapshot start amount)
            hint-fn $ {}
              :args $ [] 'js-ffi.typed-arrays/Float32SnapshotHost 'Number 'Number
              :return 'js-ffi.typed-arrays/Float32ArrayHost
              :features $ #{} :js-ffi
            arrays/float32-copy-range snapshot start amount
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'js-ffi.typed-arrays/Float32ArrayHost)
            :args $ [] 'js-ffi.typed-arrays/Float32SnapshotHost 'Number 'Number
            :features $ #{} :js-ffi
        'draw-canvas! $ %{} 'CodeEntry (:doc "|Scene 矩形数据一次提交 js-ffi Canvas 批次，并返回类型化调用计数。")
          :code $ quote $ defn draw-canvas! (context positions start amount width height fill-style alpha)
            hint-fn $ {}
              :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'js-ffi.typed-arrays/Float32ArrayHost 'Number 'Number 'Number 'Number 'String 'Number
              :return 'quamolit.instance-ffi/CanvasRectMetrics
              :features $ #{} :js-ffi
            let
                result $ raw-draw-canvas! (unsafe-coerce context JsObject) (unsafe-coerce positions JsObject) start amount width height fill-style alpha
                boundary-calls $ contract/expect-number |CanvasRect.boundaryCalls $ contract/object-field |CanvasRect.draw result |boundaryCalls
                canvas-calls $ contract/expect-number |CanvasRect.canvasCalls $ contract/object-field |CanvasRect.draw result |canvasCalls
                instances $ contract/expect-number |CanvasRect.instances $ contract/object-field |CanvasRect.draw result |instances
                bytes-read $ contract/expect-number |CanvasRect.positionBytesRead $ contract/object-field |CanvasRect.draw result |positionBytesRead
              CanvasRectMetrics :boundary-calls boundary-calls :canvas-calls canvas-calls :instances instances :position-bytes-read bytes-read
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.instance-ffi/CanvasRectMetrics)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'js-ffi.typed-arrays/Float32ArrayHost 'Number 'Number 'Number 'Number 'String 'Number
            :features $ #{} :js-ffi
        'length $ %{} 'CodeEntry (:doc "|读取实例源快照元素数。")
          :code $ quote $ defn length (snapshot)
            hint-fn $ {}
              :args $ [] 'js-ffi.typed-arrays/Float32SnapshotHost
              :return 'Number
              :features $ #{} :js-ffi
            arrays/float32-length snapshot
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'js-ffi.typed-arrays/Float32SnapshotHost
            :features $ #{} :js-ffi
        'raw-draw-canvas! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn raw-draw-canvas! (context positions start amount width height fill-style alpha) (raise |js-only-instance-canvas)
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
            :js $ {} $ :file |src/host/canvas-rect-batches.mjs
          :schema $ :: 'Fn $ {} (:return 'JsObject)
            :args $ [] 'JsObject 'JsObject 'Number 'Number 'Number 'Number 'String 'Number
            :features $ #{} :js-ffi
        'snapshot $ %{} 'CodeEntry (:doc "|登记前一次复制并校验 Float32 交错位置；ID/version 由上层持有。")
          :code $ quote $ defn snapshot (positions)
            hint-fn $ {}
              :args $ [] 'js-ffi.typed-arrays/Float32ArrayHost
              :return 'js-ffi.typed-arrays/Float32SnapshotHost
              :features $ #{} :js-ffi
            arrays/snapshot-float32 positions
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'js-ffi.typed-arrays/Float32SnapshotHost)
            :args $ [] 'js-ffi.typed-arrays/Float32ArrayHost
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry
        :doc "|Scene 实例源到 js-ffi Calcit API 的薄适配；版本与缓存仍由 Quamolit 宿主层管理。"
        :code $ quote $ ns quamolit.instance-ffi
          :require (js-ffi.typed-arrays :as arrays) (js-ffi.contract :as contract)
    'quamolit.math $ %{} 'FileEntry
      :defs $ {}
        'bound-01 $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn bound-01 (x)
            cond
                nil? x
                , 1
              (not (number? x))
                do $ js/console.warn "|invalid value to bound:" x
              (< x 0) 0
              (> x 1) 1
              true x
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
            :features $ #{} :js-ffi
        'bound-opacity $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn bound-opacity (x) (bound-01 x)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
        'bound-x $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn bound-x (left right x)
            if (> left right)
              js/Math.min (js/Math.max right x) x
              js/Math.min (js/Math.max left x) right
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'pi-ratio $ %{} 'CodeEntry (:doc |)
          :code $ quote $ def pi-ratio 0.017453292519943295
          :examples $ []
          :schema $ :: 'Dynamic
        'point-add $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn point-add (a b)
            []
              &+
                  nth a 0
                  , .unwrap-or 0
                (nth b 0) .unwrap-or 0
              &+
                  nth a 1
                  , .unwrap-or 0
                (nth b 1) .unwrap-or 0
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'point-divide $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn point-divide (x y)
            let
                a $
                  nth x 0
                  , .unwrap-or 0
                b $
                  nth x 1
                  , .unwrap-or 0
                c $
                  nth y 0
                  , .unwrap-or 0
                d $
                  nth y 1
                  , .unwrap-or 0
                length2 $ + (* c c) (* d d)
              []
                /
                  + (* a c) (* b d)
                  , length2
                /
                  - (* b c) (* a d)
                  , length2
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'point-minus $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn point-minus (a b)
            []
              &-
                  nth a 0
                  , .unwrap-or 0
                (nth b 0) .unwrap-or 0
              &-
                  nth a 1
                  , .unwrap-or 0
                (nth b 1) .unwrap-or 0
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'point-negate $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn point-negate (a)
            []
              negate $ nth a 0
              negate $ nth a 1
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
        'point-scale $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn point-scale (pair v)
            map pair $ fn (x) (* v x)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'point-times $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn point-times (a b)
            let
                a0 $
                  nth a 0
                  , .unwrap-or 0
                a1 $
                  nth a 1
                  , .unwrap-or 0
                b0 $
                  nth b 0
                  , .unwrap-or 0
                b1 $
                  nth b 1
                  , .unwrap-or 0
              []
                - (* a0 b0) (* a1 b1)
                + (* a0 b1) (* a1 b0)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'vec-length $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn vec-length (point)
            let[] (x y) point $ js/Math.sqrt $ &+ (&* x x) (&* y y)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.math
    'quamolit.motion $ %{} 'FileEntry
      :defs $ {}
        'ColorDescriptor $ %{} 'CodeEntry
          :doc "|Versioned identity for serializable color motion."
          :code $ quote $ defstruct ColorDescriptor (:id 'String) (:version 'Number) (:motion 'quamolit.motion/ColorMotion)
          :examples $ []
          :schema $ :: 'StructDef
        'ColorMotion $ %{} 'CodeEntry
          :doc "|Closed color motion without host handles or closures."
          :code $ quote $ defenum ColorMotion (:constant 'quamolit.motion/ColorRgba) (:tween 'quamolit.motion/ColorTween)
          :examples $ []
          :schema $ :: 'EnumDef
        'ColorRgba $ %{} 'CodeEntry
          :doc "|Straight-alpha sRGB channels in [0,1]; sampling validates their range."
          :code $ quote $ defstruct ColorRgba (:r 'Number) (:g 'Number) (:b 'Number) (:a 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'ColorTween $ %{} 'CodeEntry
          :doc "|Color interval in seconds, interpolated in linear sRGB with separate alpha."
          :code $ quote $ defstruct ColorTween (:start 'Number) (:duration 'Number) (:from 'quamolit.motion/ColorRgba) (:to 'quamolit.motion/ColorRgba) (:easing 'quamolit.motion/Easing)
          :examples $ []
          :schema $ :: 'StructDef
        'CpuGpuStatus $ %{} 'CodeEntry
          :doc "|CPU callbacks cannot lower to GPU; retain a diagnostic reason."
          :code $ quote $ defenum CpuGpuStatus (:unsupported 'String)
          :examples $ []
          :schema $ :: 'EnumDef
        'CpuScalarDescriptor $ %{} 'CodeEntry
          :doc "|Versioned serializable reference to a CPU sampler; never embeds a closure or GPU handle."
          :code $ quote $ defstruct CpuScalarDescriptor (:id 'String) (:version 'Number) (:callback-id 'String) (:gpu-status 'quamolit.motion/CpuGpuStatus)
          :examples $ []
          :schema $ :: 'StructDef
        'CpuScalarRegistry $ %{} 'CodeEntry
          :doc "|Runtime-only immutable map of CPU scalar callbacks; excluded from Motion IR serialization and GPU lowering."
          :code $ quote $ defstruct CpuScalarRegistry
            :samplers $ :: 'Map 'String $ :: 'Fn
              {}
                :args $ [] 'Number
                :return 'Number
          :examples $ []
          :schema $ :: 'StructDef
        'Easing $ %{} 'CodeEntry (:doc "|Scalar easing for interpolation.")
          :code $ quote $ defenum Easing (:linear) (:smoothstep)
          :examples $ []
          :schema $ :: 'EnumDef
        'ScalarComposeOp $ %{} 'CodeEntry
          :doc "|Unitless scalar operations; mix has a normalized right-hand weight."
          :code $ quote $ defenum ScalarComposeOp (:add) (:multiply) (:mix 'Number)
          :examples $ []
          :schema $ :: 'EnumDef
        'ScalarComposition $ %{} 'CodeEntry
          :doc "|Versioned, non-recursive composition of exactly two scalar descriptors."
          :code $ quote $ defstruct ScalarComposition (:id 'String) (:version 'Number) (:left 'quamolit.motion/ScalarDescriptor) (:right 'quamolit.motion/ScalarDescriptor) (:operation 'quamolit.motion/ScalarComposeOp)
          :examples $ []
          :schema $ :: 'StructDef
        'ScalarDescriptor $ %{} 'CodeEntry
          :doc "|Versioned identity for a serializable scalar motion."
          :code $ quote $ defstruct ScalarDescriptor (:id 'String) (:version 'Number) (:motion 'quamolit.motion/ScalarMotion)
          :examples $ []
          :schema $ :: 'StructDef
        'ScalarKeyframe $ %{} 'CodeEntry
          :doc "|A scalar keyframe; sampling requires finite instant/value and easing applies to the following segment."
          :code $ quote $ defstruct ScalarKeyframe (:at 'Number) (:value 'Number) (:easing 'quamolit.motion/Easing)
          :examples $ []
          :schema $ :: 'StructDef
        'ScalarMotion $ %{} 'CodeEntry
          :doc "|Closed scalar expression; no arbitrary closure in serializable data."
          :code $ quote $ defenum ScalarMotion (:constant 'Number) (:time 'Number 'Number) (:tween 'quamolit.motion/ScalarTween) (:keyframes 'quamolit.motion/ScalarTrack)
          :examples $ []
          :schema $ :: 'EnumDef
        'ScalarTrack $ %{} 'CodeEntry
          :doc "|Keyframes and loop mode; sampling validates non-empty ordered frames."
          :code $ quote $ defstruct ScalarTrack
            :frames $ :: 'List 'quamolit.motion/ScalarKeyframe
            :loop 'quamolit.motion/TrackLoop
          :examples $ []
          :schema $ :: 'StructDef
        'ScalarTrackCursor $ %{} 'CodeEntry
          :doc "|Private scan state for deterministic keyframe reference sampling."
          :code $ quote $ defstruct ScalarTrackCursor (:previous 'quamolit.motion/ScalarKeyframe) (:value 'Number) (:done 'Bool)
          :examples $ []
          :schema $ :: 'StructDef
        'ScalarTween $ %{} 'CodeEntry
          :doc "|A scalar interval in seconds; duration zero switches at start."
          :code $ quote $ defstruct ScalarTween (:start 'Number) (:duration 'Number) (:from 'Number) (:to 'Number) (:easing 'quamolit.motion/Easing)
          :examples $ []
          :schema $ :: 'StructDef
        'TrackLoop $ %{} 'CodeEntry (:doc "|Clamp, half-open repeat, or mirrored repeat.")
          :code $ quote $ defenum TrackLoop (:clamp) (:repeat) (:mirror)
          :examples $ []
          :schema $ :: 'EnumDef
        'Vec2 $ %{} 'CodeEntry
          :doc "|Two-dimensional coordinates in caller-defined units; sampling requires finite values."
          :code $ quote $ defstruct Vec2 (:x 'Number) (:y 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'Vec2Descriptor $ %{} 'CodeEntry
          :doc "|Versioned identity for a serializable Vec2 motion."
          :code $ quote $ defstruct Vec2Descriptor (:id 'String) (:version 'Number) (:motion 'quamolit.motion/Vec2Motion)
          :examples $ []
          :schema $ :: 'StructDef
        'Vec2Motion $ %{} 'CodeEntry (:doc "|Closed two-dimensional expression.")
          :code $ quote $ defenum Vec2Motion (:constant 'quamolit.motion/Vec2) (:tween 'quamolit.motion/Vec2Tween)
          :examples $ []
          :schema $ :: 'EnumDef
        'Vec2Tween $ %{} 'CodeEntry
          :doc "|A Vec2 interval in seconds with explicit easing."
          :code $ quote $ defstruct Vec2Tween (:start 'Number) (:duration 'Number) (:from 'quamolit.motion/Vec2) (:to 'quamolit.motion/Vec2) (:easing 'quamolit.motion/Easing)
          :examples $ []
          :schema $ :: 'StructDef
        'advance-track $ %{} 'CodeEntry
          :doc "|Scan one sorted keyframe; the rightmost duplicate wins at its timestamp."
          :code $ quote $ defn advance-track (cursor frame time)
            if (:done cursor) cursor $ if
              < time $ :at frame
              let
                  previous $ :previous cursor
                  tween $ ScalarTween :start (:at previous) :duration
                    - (:at frame) (:at previous)
                    , :from (:value previous) :to (:value frame) :easing $ :easing previous
                  value $ sample-tween tween time
                ScalarTrackCursor :previous previous :value value :done true
              ScalarTrackCursor :previous frame :value (:value frame) :done false
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/ScalarTrackCursor)
            :args $ [] 'quamolit.motion/ScalarTrackCursor 'quamolit.motion/ScalarKeyframe 'Number
        'finite-number? $ %{} 'CodeEntry
          :doc "|Detect NaN and either infinity on native and JS numeric paths."
          :code $ quote $ defn finite-number? (value)
            = 0 $ - value value
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'Number
          :tests $ [] $ %{} 'TestEntry (:name |reject-non-finite)
            :code $ quote $ do
              is= true $ finite-number? 3.5
              is= false $ finite-number? $ sqrt -1
              is= false $ finite-number? $ / 1 0
              is= false $ finite-number? $ / -1 0
            :tags $ #{} :motion :unit
        'finite-vec2? $ %{} 'CodeEntry (:doc "|Reject non-finite vector coordinates.")
          :code $ quote $ defn finite-vec2? (value)
            and
              finite-number? $ :x value
              finite-number? $ :y value
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.motion/Vec2
        'first-keyframe $ %{} 'CodeEntry
          :doc "|Return the first keyframe; caller validates a non-empty ordered track."
          :code $ quote $ defn first-keyframe (frames)
            -> (first frames) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/ScalarKeyframe)
            :args $ [] $ :: 'List 'quamolit.motion/ScalarKeyframe
        'interpolate-color $ %{} 'CodeEntry
          :doc "|Interpolate straight-alpha colors; hidden RGB is not premultiplied away."
          :code $ quote $ defn interpolate-color (from to ratio)
            assert |invalid-color-from $ valid-color? from
            assert |invalid-color-to $ valid-color? to
            assert |invalid-color-ratio $ unit-channel? ratio
            if (= ratio 0) from $ if (= ratio 1) to $ let
                red $ interpolate-color-channel (:r from) (:r to) ratio
                green $ interpolate-color-channel (:g from) (:g to) ratio
                blue $ interpolate-color-channel (:b from) (:b to) ratio
                alpha $ +
                  * (:a from) (- 1 ratio)
                  * (:a to) ratio
                result $ ColorRgba :r red :g green :b blue :a alpha
              assert |invalid-color-result $ valid-color? result
              , result
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/ColorRgba)
            :args $ [] 'quamolit.motion/ColorRgba 'quamolit.motion/ColorRgba 'Number
          :tests $ []
            %{} 'TestEntry (:name |linear-midpoint)
              :code $ quote $ let
                  red $ ColorRgba :r 1 :g 0 :b 0 :a 1
                  blue $ ColorRgba :r 0 :g 0 :b 1 :a 1
                  middle $ interpolate-color red blue 0.5
                assert |red-linear-midpoint $ <
                  abs $ - (:r middle) 0.7353569830524495
                  , 0.000000000001
                is= (:g middle) 0
                assert |blue-linear-midpoint $ <
                  abs $ - (:b middle) 0.7353569830524495
                  , 0.000000000001
                is= (:a middle) 1
                is= (interpolate-color red blue 0) red
                is= (interpolate-color red blue 1) blue
              :tags $ #{} :motion :unit
            %{} 'TestEntry (:name |straight-alpha)
              :code $ quote $ let
                  hidden-red $ ColorRgba :r 1 :g 0 :b 0 :a 0
                  blue $ ColorRgba :r 0 :g 0 :b 1 :a 1
                  middle $ interpolate-color hidden-red blue 0.5
                  hidden-middle $ interpolate-color hidden-red
                    ColorRgba :r 0 :g 0 :b 1 :a 0
                    , 0.5
                is= (:a middle) 0.5
                is= (:a hidden-middle) 0
                assert |hidden-red-rgb-preserved $ <
                  abs $ - (:r hidden-middle) 0.7353569830524495
                  , 0.000000000001
                assert |hidden-blue-rgb-preserved $ <
                  abs $ - (:b hidden-middle) 0.7353569830524495
                  , 0.000000000001
                is= (interpolate-color hidden-red blue 0) hidden-red
              :tags $ #{} :motion :unit
            %{} 'TestEntry (:name |invalid-input)
              :code $ quote $ let
                  red $ ColorRgba :r 1 :g 0 :b 0 :a 1
                  invalid $ ColorRgba :r 1.1 :g 0 :b 0 :a 1
                is-throws $ interpolate-color invalid red 0.5
                is-throws $ interpolate-color red invalid 0.5
                is-throws $ interpolate-color red red -0.1
                is-throws $ interpolate-color red red 1.1
              :tags $ #{} :motion :unit
        'interpolate-color-channel $ %{} 'CodeEntry (:doc "|Interpolate one sRGB channel in linear light.")
          :code $ quote $ defn interpolate-color-channel (from to ratio)
            assert |invalid-color-from $ unit-channel? from
            assert |invalid-color-to $ unit-channel? to
            assert |invalid-color-ratio $ unit-channel? ratio
            if (= ratio 0) from $ if (= ratio 1) to $ linear-to-srgb
              +
                * (srgb-to-linear from) (- 1 ratio)
                * (srgb-to-linear to) ratio
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number 'Number 'Number
        'last-keyframe $ %{} 'CodeEntry
          :doc "|Return the last keyframe; caller validates a non-empty ordered track."
          :code $ quote $ defn last-keyframe (frames)
            -> (last frames) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/ScalarKeyframe)
            :args $ [] $ :: 'List 'quamolit.motion/ScalarKeyframe
        'linear-to-srgb $ %{} 'CodeEntry
          :doc "|Encode a normalized linear-light channel to sRGB."
          :code $ quote $ defn linear-to-srgb (channel)
            assert |invalid-linear-channel $ unit-channel? channel
            let
                result $ if (<= channel 0.0031308) (* 12.92 channel)
                  -
                    * 1.055 $ pow channel $ / 1 2.4
                    , 0.055
              assert |invalid-encoded-srgb $ unit-channel? result
              , result
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'register-cpu-scalar $ %{} 'CodeEntry
          :doc "|Add one uniquely named, typed CPU sampler to a new registry value."
          :code $ quote $ defn register-cpu-scalar (registry callback-id sampler)
            assert |empty-cpu-callback-id $ not $ empty? callback-id
            assert |duplicate-cpu-callback-id $ not $ contains? (:samplers registry) callback-id
            CpuScalarRegistry :samplers $ assoc (:samplers registry) callback-id sampler
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/CpuScalarRegistry)
            :args $ [] 'quamolit.motion/CpuScalarRegistry 'String $ :: 'Fn
              {} (:return 'Number)
                :args $ [] 'Number
        'sample-color $ %{} 'CodeEntry
          :doc "|Sample a versioned color descriptor at arbitrary finite seconds."
          :code $ quote $ defn sample-color (descriptor time)
            assert |invalid-motion-time $ finite-number? time
            assert |invalid-color-id $ not $ empty? (:id descriptor)
            assert |invalid-color-version $ valid-motion-version? $ :version descriptor
            match (:motion descriptor)
              (:constant value)
                do
                  assert |invalid-color-constant $ valid-color? value
                  , value
              (:tween tween)
                do
                  assert |invalid-color-from $ valid-color? $ :from tween
                  assert |invalid-color-to $ valid-color? $ :to tween
                  let
                      progress $ sample-tween
                        ScalarTween :start (:start tween) :duration (:duration tween) :from 0 :to 1 :easing $ :easing tween
                        , time
                    interpolate-color (:from tween) (:to tween) progress
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/ColorRgba)
            :args $ [] 'quamolit.motion/ColorDescriptor 'Number
          :tests $ []
            %{} 'TestEntry (:name |arbitrary-time)
              :code $ quote $ let
                  red $ ColorRgba :r 1 :g 0 :b 0 :a 0
                  blue $ ColorRgba :r 0 :g 0 :b 1 :a 1
                  tween $ ColorTween :start 0 :duration 1 :from red :to blue :easing $ Easing :linear
                  descriptor $ ColorDescriptor :id |color-test :version 1 :motion $ ColorMotion :tween tween
                  middle $ sample-color descriptor 0.5
                is= (sample-color descriptor -1) red
                is= (sample-color descriptor 1) blue
                is= (:a middle) 0.5
                assert |color-midpoint $ <
                  abs $ - (:r middle) 0.7353569830524495
                  , 0.000000000001
                is= (sample-color descriptor 0) red
                is-throws $ sample-color
                  ColorDescriptor :id |bad-duration :version 1 :motion $ ColorMotion :tween $ ColorTween :start 0 :duration -1 :from red :to blue :easing (Easing :linear)
                  , 0.5
              :tags $ #{} :motion :unit
            %{} 'TestEntry (:name |reject-invalid-identity)
              :code $ quote $ let
                  value $ ColorRgba :r 1 :g 0 :b 0 :a 1
                is-throws $ sample-color
                  ColorDescriptor :id | :version 1 :motion $ ColorMotion :constant value
                  , 0
                is-throws $ sample-color
                  ColorDescriptor :id |red :version 1.5 :motion $ ColorMotion :constant value
                  , 0
                is= value $ sample-color
                  ColorDescriptor :id |red :version 2 :motion $ ColorMotion :constant value
                  , 0
              :tags $ #{} :motion :unit
        'sample-cpu-scalar $ %{} 'CodeEntry
          :doc "|Resolve and sample one CPU-only custom function at arbitrary finite seconds."
          :code $ quote $ defn sample-cpu-scalar (descriptor time registry)
            assert |invalid-cpu-motion-time $ finite-number? time
            assert |invalid-cpu-motion-id $ not $ empty? (:id descriptor)
            assert |invalid-cpu-motion-version $ valid-motion-version? $ :version descriptor
            assert |empty-cpu-callback-id $ not $ empty? (:callback-id descriptor)
            match (:gpu-status descriptor)
              (:unsupported reason)
                assert |empty-cpu-gpu-diagnostic $ not $ empty? reason
            assert |missing-cpu-callback $ contains? (:samplers registry) (:callback-id descriptor)
            let
                sampler $
                  get (:samplers registry) (:callback-id descriptor)
                  , .unwrap
                result $ sampler time
              assert |invalid-cpu-motion-result $ finite-number? result
              , result
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.motion/CpuScalarDescriptor 'Number 'quamolit.motion/CpuScalarRegistry
          :tests $ []
            %{} 'TestEntry (:name |arbitrary-time)
              :code $ quote $ let
                  sampler $ fn (time)
                    hint-fn $ {}
                      :args $ [] 'Number
                      :return 'Number
                    + 10 $ * time 2
                  empty-registry $ CpuScalarRegistry :samplers $ {}
                  registry $ register-cpu-scalar empty-registry |double-offset sampler
                  descriptor $ CpuScalarDescriptor :id |custom-example :version 1 :callback-id |double-offset :gpu-status $ CpuGpuStatus :unsupported |runtime-callback
                is=
                  count $ :samplers empty-registry
                  , 0
                is=
                  count $ :samplers registry
                  , 1
                is= (:gpu-status descriptor) (CpuGpuStatus :unsupported |runtime-callback)
                is= (sample-cpu-scalar descriptor 1 registry) 12
                is= (sample-cpu-scalar descriptor 0 registry) 10
                is= (sample-cpu-scalar descriptor 0.25 registry) 10.5
                is= (sample-cpu-scalar descriptor 0.5 registry) 11
                is= (sample-cpu-scalar descriptor -0.25 registry) 9.5
                is= (sample-cpu-scalar descriptor 1 registry) 12
              :tags $ #{} :motion :unit
            %{} 'TestEntry (:name |rejects-invalid)
              :code $ quote $ let
                  sampler $ fn (time)
                    hint-fn $ {}
                      :args $ [] 'Number
                      :return 'Number
                    * time 2
                  empty-registry $ CpuScalarRegistry :samplers $ {}
                  registry $ register-cpu-scalar empty-registry |double sampler
                  non-finite-sampler $ fn (time)
                    hint-fn $ {}
                      :args $ [] 'Number
                      :return 'Number
                    / 1 0
                  bad-registry $ register-cpu-scalar registry |non-finite non-finite-sampler
                  descriptor $ CpuScalarDescriptor :id |custom-example :version 1 :callback-id |double :gpu-status $ CpuGpuStatus :unsupported |runtime-callback
                is-throws $ register-cpu-scalar registry |double sampler
                is-throws $ register-cpu-scalar registry | sampler
                is-throws $ sample-cpu-scalar
                  CpuScalarDescriptor :id |missing :version 1 :callback-id |unknown :gpu-status $ CpuGpuStatus :unsupported |runtime-callback
                  , 0 registry
                is-throws $ sample-cpu-scalar
                  CpuScalarDescriptor :id |invalid :version -1 :callback-id |double :gpu-status $ CpuGpuStatus :unsupported |runtime-callback
                  , 0 registry
                is-throws $ sample-cpu-scalar
                  CpuScalarDescriptor :id |invalid :version 1 :callback-id |double :gpu-status $ CpuGpuStatus :unsupported |
                  , 0 registry
                is-throws $ sample-cpu-scalar descriptor (sqrt -1) registry
                is-throws $ sample-cpu-scalar descriptor (/ 1 0) registry
                is-throws $ sample-cpu-scalar
                  CpuScalarDescriptor :id |invalid-result :version 1 :callback-id |non-finite :gpu-status $ CpuGpuStatus :unsupported |runtime-callback
                  , 0 bad-registry
              :tags $ #{} :motion :unit
            %{} 'TestEntry (:name |reject-invalid-identity)
              :code $ quote $ let
                  sampler $ fn (time)
                    hint-fn $ {}
                      :args $ [] 'Number
                      :return 'Number
                    + time 2
                  registry $ register-cpu-scalar
                    CpuScalarRegistry :samplers $ {}
                    , |add-two sampler
                  make $ fn (id version)
                    hint-fn $ {}
                      :args $ [] 'String 'Number
                      :return 'quamolit.motion/CpuScalarDescriptor
                    CpuScalarDescriptor :id id :version version :callback-id |add-two :gpu-status $ CpuGpuStatus :unsupported |runtime-callback
                is-throws $ sample-cpu-scalar (make | 1) 0 registry
                is-throws $ sample-cpu-scalar (make |custom 1.5) 0 registry
                is= 2 $ sample-cpu-scalar (make |custom 2) 0 registry
              :tags $ #{} :motion :unit
        'sample-scalar $ %{} 'CodeEntry
          :doc "|Sample a versioned scalar descriptor without reading previous frames."
          :code $ quote $ defn sample-scalar (descriptor time)
            assert |invalid-motion-time $ finite-number? time
            assert |invalid-motion-id $ not $ empty? (:id descriptor)
            assert |invalid-motion-version $ valid-motion-version? $ :version descriptor
            match (:motion descriptor)
              (:constant value)
                do
                  assert |invalid-motion-constant $ finite-number? value
                  , value
              (:time scale offset)
                do
                  assert |invalid-motion-scale $ finite-number? scale
                  assert |invalid-motion-offset $ finite-number? offset
                  let
                      value $ + offset $ * scale time
                    assert |invalid-motion-result $ finite-number? value
                    , value
              (:tween tween) (sample-tween tween time)
              (:keyframes track) (sample-track track time)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.motion/ScalarDescriptor 'Number
          :tests $ []
            %{} 'TestEntry (:name |arbitrary-order-and-fade)
              :code $ quote $ let
                  tween $ ScalarTween :start 0 :duration 1 :from 10 :to 20 :easing $ Easing :linear
                  descriptor $ ScalarDescriptor :id |old-fade :version 1 :motion $ ScalarMotion :tween tween
                  constant $ ScalarDescriptor :id |constant :version 1 :motion $ ScalarMotion :constant 7
                  clock $ ScalarDescriptor :id |clock :version 1 :motion $ ScalarMotion :time 2 1
                is= 20 $ sample-scalar descriptor 1
                is= 10 $ sample-scalar descriptor 0
                is= 15 $ sample-scalar descriptor 0.5
                is= 12.5 $ sample-scalar descriptor 0.25
                is= 20 $ sample-scalar descriptor 1
                is= 7 $ sample-scalar constant -3
                is= 2 $ sample-scalar clock 0.5
              :tags $ #{} :motion :unit
            %{} 'TestEntry (:name |keyframes-variant)
              :code $ quote $ let
                  track $ ScalarTrack :frames
                    []
                      ScalarKeyframe :at 0 :value 10 :easing $ Easing :linear
                      ScalarKeyframe :at 1 :value 20 :easing $ Easing :linear
                    , :loop $ TrackLoop :mirror
                  descriptor $ ScalarDescriptor :id |old-fade-track :version 1 :motion $ ScalarMotion :keyframes track
                is= 20 $ sample-scalar descriptor 1
                is= 10 $ sample-scalar descriptor 0
                is= 15 $ sample-scalar descriptor 0.5
                is= 12.5 $ sample-scalar descriptor 0.25
                is= 17.5 $ sample-scalar descriptor 1.25
                is= 12.5 $ sample-scalar descriptor -0.25
              :tags $ #{} :motion :unit
            %{} 'TestEntry (:name |reject-invalid-identity)
              :code $ quote $ do
                is-throws $ sample-scalar
                  ScalarDescriptor :id | :version 1 :motion $ ScalarMotion :constant 10
                  , 0
                is-throws $ sample-scalar
                  ScalarDescriptor :id |value :version 1.5 :motion $ ScalarMotion :constant 10
                  , 0
                is= 10 $ sample-scalar
                  ScalarDescriptor :id |value :version 2 :motion $ ScalarMotion :constant 10
                  , 0
              :tags $ #{} :motion :unit
        'sample-scalar-composition $ %{} 'CodeEntry
          :doc "|Sample a fixed two-input composition at arbitrary finite seconds."
          :code $ quote $ defn sample-scalar-composition (composition time)
            assert |invalid-composition-time $ finite-number? time
            assert |invalid-composition-id $ not $ empty? (:id composition)
            assert |invalid-composition-version $ valid-motion-version? $ :version composition
            let
                left $ sample-scalar (:left composition) time
                right $ sample-scalar (:right composition) time
                result $ match (:operation composition)
                  (:add) (+ left right)
                  (:multiply) (* left right)
                  (:mix weight)
                    do
                      assert |invalid-composition-weight $ unit-channel? weight
                      +
                        * left $ - 1 weight
                        * right weight
              assert |invalid-composition-result $ finite-number? result
              , result
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.motion/ScalarComposition 'Number
          :tests $ []
            %{} 'TestEntry (:name |bounded-values)
              :code $ quote $ let
                  left $ ScalarDescriptor :id |fade :version 1 :motion $ ScalarMotion :tween
                    ScalarTween :start 0 :duration 1 :from 10 :to 20 :easing $ Easing :linear
                  right $ ScalarDescriptor :id |clock :version 1 :motion $ ScalarMotion :time 2 1
                  add $ ScalarComposition :id |add :version 1 :left left :right right :operation $ ScalarComposeOp :add
                  multiply $ ScalarComposition :id |multiply :version 1 :left left :right right :operation $ ScalarComposeOp :multiply
                  mix $ ScalarComposition :id |mix :version 1 :left left :right right :operation $ ScalarComposeOp :mix 0.25
                is= (sample-scalar-composition add 1) 23
                is= (sample-scalar-composition add 0) 11
                is= (sample-scalar-composition add 0.25) 14
                is= (sample-scalar-composition add 0.5) 17
                is= (sample-scalar-composition add 0.25) 14
                is= (sample-scalar-composition multiply 0.25) 18.75
                is= (sample-scalar-composition mix 0.25) 9.75
                is= (sample-scalar-composition mix 0.5) 11.75
                is= (sample-scalar-composition mix 1) 15.75
              :tags $ #{} :motion :unit
            %{} 'TestEntry (:name |invalid-input)
              :code $ quote $ let
                  left $ ScalarDescriptor :id |left :version 1 :motion $ ScalarMotion :constant 1
                  right $ ScalarDescriptor :id |right :version 1 :motion $ ScalarMotion :constant 2
                  invalid-weight $ ScalarComposition :id |invalid-weight :version 1 :left left :right right :operation $ ScalarComposeOp :mix 1.1
                  invalid-version $ ScalarComposition :id |invalid-version :version -1 :left left :right right :operation $ ScalarComposeOp :add
                is-throws $ sample-scalar-composition invalid-weight 0.5
                is-throws $ sample-scalar-composition invalid-version 0.5
              :tags $ #{} :motion :unit
            %{} 'TestEntry (:name |reject-invalid-identity)
              :code $ quote $ let
                  left $ ScalarDescriptor :id |left :version 1 :motion $ ScalarMotion :constant 2
                  right $ ScalarDescriptor :id |right :version 1 :motion $ ScalarMotion :constant 3
                  make $ fn (id version)
                    hint-fn $ {}
                      :args $ [] 'String 'Number
                      :return 'quamolit.motion/ScalarComposition
                    ScalarComposition :id id :version version :left left :right right :operation $ ScalarComposeOp :add
                is-throws $ sample-scalar-composition (make | 1) 0
                is-throws $ sample-scalar-composition (make |sum 1.5) 0
                is= 5 $ sample-scalar-composition (make |sum 2) 0
              :tags $ #{} :motion :unit
        'sample-track $ %{} 'CodeEntry
          :doc "|Reference scalar keyframe sampler at arbitrary finite seconds."
          :code $ quote $ defn sample-track (track time)
            assert |invalid-motion-time $ finite-number? time
            assert |invalid-keyframe-track $ validate-track track
            let
                frames $ :frames track
                initial-frame $ first-keyframe frames
                final-frame $ last-keyframe frames
                wrapped-time $ wrap-track-time time (:at initial-frame) (:at final-frame) (:loop track)
                cursor $ scan-track frames wrapped-time
              :value cursor
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.motion/ScalarTrack 'Number
          :tests $ []
            %{} 'TestEntry (:name |keyframe-order-and-duplicates)
              :code $ quote $ let
                  f0 $ ScalarKeyframe :at 0 :value 0 :easing $ Easing :linear
                  f1 $ ScalarKeyframe :at 0.5 :value 5 :easing $ Easing :linear
                  f2 $ ScalarKeyframe :at 0.5 :value 7 :easing $ Easing :smoothstep
                  f3 $ ScalarKeyframe :at 1 :value 10 :easing $ Easing :linear
                  track $ ScalarTrack :frames ([] f0 f1 f2 f3) :loop $ TrackLoop :clamp
                is= 10 $ sample-track track 1
                is= 0 $ sample-track track 0
                is= 7 $ sample-track track 0.5
                is= 2.5 $ sample-track track 0.25
                is= 8.5 $ sample-track track 0.75
                is= 10 $ sample-track track 1
                is= 0 $ sample-track track -0.000001
                is= 10 $ sample-track track 1.000001
              :tags $ #{} :motion :unit
            %{} 'TestEntry (:name |repeat-and-mirror)
              :code $ quote $ let
                  a $ ScalarKeyframe :at 0 :value 0 :easing $ Easing :linear
                  b $ ScalarKeyframe :at 1 :value 10 :easing $ Easing :linear
                  repeated $ ScalarTrack :frames ([] a b) :loop $ TrackLoop :repeat
                  mirrored $ ScalarTrack :frames ([] a b) :loop $ TrackLoop :mirror
                  instant $ ScalarTrack :frames
                    []
                      ScalarKeyframe :at 0 :value 3 :easing $ Easing :linear
                      ScalarKeyframe :at 0 :value 8 :easing $ Easing :linear
                    , :loop $ TrackLoop :repeat
                is= 0 $ sample-track repeated 1
                is= 2.5 $ sample-track repeated 1.25
                is= 7.5 $ sample-track repeated -0.25
                is= 0 $ sample-track repeated 2
                is= 10 $ sample-track mirrored 1
                is= 7.5 $ sample-track mirrored 1.25
                is= 0 $ sample-track mirrored 2
                is= 2.5 $ sample-track mirrored -0.25
                is= 8 $ sample-track instant -99
                is= 8 $ sample-track instant 99
              :tags $ #{} :motion :unit
            %{} 'TestEntry (:name |rejects-invalid)
              :code $ quote $ let
                  a $ ScalarKeyframe :at 0 :value 0 :easing $ Easing :linear
                  b $ ScalarKeyframe :at 1 :value 10 :easing $ Easing :linear
                  bad-time $ ScalarKeyframe :at (sqrt -1) :value 1 :easing $ Easing :linear
                  bad-value $ ScalarKeyframe :at 0.5 :value (/ 1 0) :easing $ Easing :linear
                  good $ ScalarTrack :frames ([] a b) :loop $ TrackLoop :clamp
                is-throws $ sample-track
                  ScalarTrack :frames ([]) :loop $ TrackLoop :clamp
                  , 0
                is-throws $ sample-track
                  ScalarTrack :frames ([] b a) :loop $ TrackLoop :clamp
                  , 0.5
                is-throws $ sample-track
                  ScalarTrack :frames ([] a bad-time b) :loop $ TrackLoop :clamp
                  , 0.5
                is-throws $ sample-track
                  ScalarTrack :frames ([] a bad-value b) :loop $ TrackLoop :clamp
                  , 0.5
                is-throws $ sample-track good $ sqrt -1
                is-throws $ sample-track good $ / 1 0
              :tags $ #{} :motion :unit
        'sample-tween $ %{} 'CodeEntry
          :doc "|Reference scalar tween value at arbitrary finite seconds."
          :code $ quote $ defn sample-tween (tween time)
            assert |invalid-motion-time $ finite-number? time
            assert |invalid-motion-start $ finite-number? $ :start tween
            assert |invalid-motion-duration $ finite-number? $ :duration tween
            assert |invalid-motion-from $ finite-number? $ :from tween
            assert |invalid-motion-to $ finite-number? $ :to tween
            assert |negative-motion-duration $ >= (:duration tween) 0
            let
                start $ :start tween
                duration $ :duration tween
                from $ :from tween
                to $ :to tween
              if (= duration 0)
                if (< time start) from to
                let
                    progress $ if (< time start) 0 $ if
                      > time $ + start duration
                      , 1
                        / (- time start) duration
                    ratio $ match (:easing tween)
                      (:linear) progress
                      (:smoothstep)
                        * progress progress $ - 3 $ * 2 progress
                    value $ +
                      * from $ - 1 ratio
                      * to ratio
                  assert |invalid-motion-result $ finite-number? value
                  , value
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.motion/ScalarTween 'Number
          :tests $ []
            %{} 'TestEntry (:name |linear-smooth-and-boundaries)
              :code $ quote $ let
                  linear $ ScalarTween :start 0 :duration 1 :from 10 :to 20 :easing $ Easing :linear
                  smooth $ ScalarTween :start 0 :duration 1 :from 10 :to 20 :easing $ Easing :smoothstep
                  instant $ ScalarTween :start 0.5 :duration 0 :from 10 :to 20 :easing $ Easing :linear
                is= 10 $ sample-tween linear -1
                is= 10 $ sample-tween linear 0
                is= 12.5 $ sample-tween linear 0.25
                is= 15 $ sample-tween linear 0.5
                is= 20 $ sample-tween linear 1
                is= 20 $ sample-tween linear 1.5
                is= 11.5625 $ sample-tween smooth 0.25
                is= 15 $ sample-tween smooth 0.5
                is= 10 $ sample-tween instant 0.499
                is= 20 $ sample-tween instant 0.5
              :tags $ #{} :motion :unit
            %{} 'TestEntry (:name |reject-invalid-input)
              :code $ quote $ let
                  good $ ScalarTween :start 0 :duration 1 :from 10 :to 20 :easing $ Easing :linear
                  negative $ ScalarTween :start 0 :duration -1 :from 10 :to 20 :easing $ Easing :linear
                  invalid $ ScalarTween :start 0 :duration 1 :from 10 :to (sqrt -1) :easing $ Easing :linear
                is-throws $ sample-tween good $ sqrt -1
                is-throws $ sample-tween good $ / 1 0
                is-throws $ sample-tween negative 0.5
                is-throws $ sample-tween invalid 0.5
              :tags $ #{} :motion :unit
        'sample-vec2 $ %{} 'CodeEntry
          :doc "|Sample a Vec2 descriptor at arbitrary finite seconds without previous-frame state."
          :code $ quote $ defn sample-vec2 (descriptor time)
            assert |invalid-motion-time $ finite-number? time
            assert |invalid-vec2-id $ not $ empty? (:id descriptor)
            assert |invalid-vec2-version $ valid-motion-version? $ :version descriptor
            match (:motion descriptor)
              (:constant value)
                do
                  assert |invalid-vec2-constant $ finite-vec2? value
                  , value
              (:tween tween)
                do
                  assert |invalid-vec2-from $ finite-vec2? $ :from tween
                  assert |invalid-vec2-to $ finite-vec2? $ :to tween
                  let
                      progress $ sample-tween
                        ScalarTween :start (:start tween) :duration (:duration tween) :from 0 :to 1 :easing $ :easing tween
                        , time
                      from $ :from tween
                      to $ :to tween
                      result $ Vec2 :x
                        +
                          * (:x from) (- 1 progress)
                          * (:x to) progress
                        , :y $ +
                          * (:y from) (- 1 progress)
                          * (:y to) progress
                    assert |invalid-vec2-result $ finite-vec2? result
                    , result
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/Vec2)
            :args $ [] 'quamolit.motion/Vec2Descriptor 'Number
          :tests $ []
            %{} 'TestEntry (:name |arbitrary-order-and-boundaries)
              :code $ quote $ let
                  from $ Vec2 :x 0 :y 0
                  to $ Vec2 :x 10 :y 20
                  linear $ Vec2Descriptor :id |move :version 1 :motion $ Vec2Motion :tween
                    Vec2Tween :start 0 :duration 1 :from from :to to :easing $ Easing :linear
                  smooth $ Vec2Descriptor :id |smooth :version 1 :motion $ Vec2Motion :tween
                    Vec2Tween :start 0 :duration 1 :from from :to to :easing $ Easing :smoothstep
                  instant $ Vec2Descriptor :id |instant :version 1 :motion $ Vec2Motion :tween
                    Vec2Tween :start 0.5 :duration 0 :from from :to to :easing $ Easing :linear
                is= to $ sample-vec2 linear 1
                is= from $ sample-vec2 linear 0
                is= (Vec2 :x 5 :y 10) (sample-vec2 linear 0.5)
                is= (Vec2 :x 2.5 :y 5) (sample-vec2 linear 0.25)
                is= to $ sample-vec2 linear 1
                is= from $ sample-vec2 linear -0.000001
                is= to $ sample-vec2 linear 1.000001
                is= (Vec2 :x 1.5625 :y 3.125) (sample-vec2 smooth 0.25)
                is= from $ sample-vec2 instant 0.499999
                is= to $ sample-vec2 instant 0.5
              :tags $ #{} :motion :unit
            %{} 'TestEntry (:name |rejects-invalid)
              :code $ quote $ let
                  from $ Vec2 :x 0 :y 0
                  to $ Vec2 :x 10 :y 20
                  good $ Vec2Descriptor :id |move :version 1 :motion $ Vec2Motion :tween
                    Vec2Tween :start 0 :duration 1 :from from :to to :easing $ Easing :linear
                  negative $ Vec2Descriptor :id |negative :version 1 :motion $ Vec2Motion :tween
                    Vec2Tween :start 0 :duration -1 :from from :to to :easing $ Easing :linear
                  invalid $ Vec2Descriptor :id |invalid :version 1 :motion $ Vec2Motion :constant
                    Vec2 :x (sqrt -1) :y 0
                is-throws $ sample-vec2 good $ sqrt -1
                is-throws $ sample-vec2 good $ / 1 0
                is-throws $ sample-vec2 negative 0.5
                is-throws $ sample-vec2 invalid 0.5
              :tags $ #{} :motion :unit
            %{} 'TestEntry (:name |reject-invalid-identity)
              :code $ quote $ let
                  value $ Vec2 :x 2 :y 3
                is-throws $ sample-vec2
                  Vec2Descriptor :id | :version 1 :motion $ Vec2Motion :constant value
                  , 0
                is-throws $ sample-vec2
                  Vec2Descriptor :id |point :version 1.5 :motion $ Vec2Motion :constant value
                  , 0
                is= value $ sample-vec2
                  Vec2Descriptor :id |point :version 2 :motion $ Vec2Motion :constant value
                  , 0
              :tags $ #{} :motion :unit
        'scan-track $ %{} 'CodeEntry
          :doc "|Scan validated keyframes at one explicit time without previous-frame state."
          :code $ quote $ defn scan-track (frames time)
            let
                initial-frame $ first-keyframe frames
                initial $ ScalarTrackCursor :previous initial-frame :value (:value initial-frame) :done false
              if
                < time $ :at initial-frame
                , initial $ foldl (rest frames) initial $ fn (cursor frame)
                  hint-fn $ {}
                    :args $ [] 'quamolit.motion/ScalarTrackCursor 'quamolit.motion/ScalarKeyframe
                    :return 'quamolit.motion/ScalarTrackCursor
                  advance-track cursor frame time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/ScalarTrackCursor)
            :args $ [] (:: 'List 'quamolit.motion/ScalarKeyframe) 'Number
        'srgb-to-linear $ %{} 'CodeEntry (:doc "|Decode normalized sRGB channel to linear light.")
          :code $ quote $ defn srgb-to-linear (channel)
            assert |invalid-srgb-channel $ unit-channel? channel
            if (<= channel 0.04045) (/ channel 12.92)
              pow
                / (+ channel 0.055) 1.055
                , 2.4
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'unit-channel? $ %{} 'CodeEntry (:doc "|Finite normalized channel predicate.")
          :code $ quote $ defn unit-channel? (value)
            and (finite-number? value) (>= value 0) (<= value 1)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'Number
        'valid-color? $ %{} 'CodeEntry (:doc "|Check all straight-alpha sRGB channels.")
          :code $ quote $ defn valid-color? (color)
            and
              unit-channel? $ :r color
              unit-channel? $ :g color
              unit-channel? $ :b color
              unit-channel? $ :a color
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.motion/ColorRgba
        'valid-motion-version? $ %{} 'CodeEntry (:doc "|Motion 描述版本必须是有限、非负的整数；与 Scene 绑定及帧缓存使用同一身份规则。")
          :code $ quote $ defn valid-motion-version? (value)
            and (finite-number? value) (>= value 0)
              = value $ floor value
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'Number
          :tests $ [] $ %{} 'TestEntry (:name |finite-nonnegative-integer)
            :code $ quote $ do
              is= true $ valid-motion-version? 0
              is= true $ valid-motion-version? 2
              is= false $ valid-motion-version? -1
              is= false $ valid-motion-version? 1.5
              is= false $ valid-motion-version? $ / 1 0
              is= false $ valid-motion-version? $ sqrt -1
            :tags $ #{} :motion :unit
        'validate-track $ %{} 'CodeEntry
          :doc "|Reject empty, unordered, or non-finite keyframes. Equal timestamps are valid."
          :code $ quote $ defn validate-track (track)
            let
                frames $ :frames track
              assert |empty-keyframes $ > (count frames) 0
              let
                  initial $ first-keyframe frames
                assert |invalid-keyframe-time $ finite-number? $ :at initial
                assert |invalid-keyframe-value $ finite-number? $ :value initial
                foldl (rest frames) initial $ fn (previous frame)
                  hint-fn $ {}
                    :args $ [] 'quamolit.motion/ScalarKeyframe 'quamolit.motion/ScalarKeyframe
                    :return 'quamolit.motion/ScalarKeyframe
                  assert |invalid-keyframe-time $ finite-number? $ :at frame
                  assert |invalid-keyframe-value $ finite-number? $ :value frame
                  assert |unordered-keyframes $ >= (:at frame) (:at previous)
                  , frame
                , true
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.motion/ScalarTrack
        'wrap-track-time $ %{} 'CodeEntry
          :doc "|Map finite time into a track according to explicit endpoint semantics."
          :code $ quote $ defn wrap-track-time (time start end mode)
            assert |invalid-motion-time $ finite-number? time
            assert |invalid-track-start $ finite-number? start
            assert |invalid-track-end $ finite-number? end
            assert |unordered-track-bounds $ >= end start
            let
                duration $ - end start
              match mode
                (:clamp) time
                (:repeat)
                  if (= duration 0) start $ let
                      elapsed $ - time start
                      quotient $ floor $ / elapsed duration
                      phase $ - elapsed $ * quotient duration
                      result $ + start phase
                    assert |invalid-repeat-phase $ finite-number? result
                    , result
                (:mirror)
                  if (= duration 0) start $ let
                      elapsed $ - time start
                      period $ * 2 duration
                      quotient $ floor $ / elapsed period
                      phase $ - elapsed $ * quotient period
                      result $ if (<= phase duration) (+ start phase)
                        - end $ - phase duration
                    assert |invalid-mirror-phase $ finite-number? result
                    , result
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number 'Number 'Number 'quamolit.motion/TrackLoop
          :tests $ [] $ %{} 'TestEntry (:name |shifted-bounds)
            :code $ quote $ do
              is= 2 $ wrap-track-time 3 2 3 $ TrackLoop :repeat
              is= 2.75 $ wrap-track-time 1.75 2 3 $ TrackLoop :repeat
              is= 2.75 $ wrap-track-time 3.25 2 3 $ TrackLoop :mirror
              is= 2.25 $ wrap-track-time 1.75 2 3 $ TrackLoop :mirror
              is= 2 $ wrap-track-time 99 2 2 $ TrackLoop :repeat
              is= 2 $ wrap-track-time -99 2 2 $ TrackLoop :mirror
              is= 1 $ wrap-track-time 1 2 3 $ TrackLoop :clamp
            :tags $ #{} :motion :unit
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.motion
          :require $ calcit.test :refer $ is= is-throws
    'quamolit.motion-cpu $ %{} 'FileEntry
      :defs $ {}
        'CpuFunctionDescriptor $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct CpuFunctionDescriptor (:id 'String) (:version 'Number) (:callback-id 'String) (:gpu-status 'quamolit.motion/CpuGpuStatus)
          :examples $ []
          :schema $ :: 'StructDef
        'CpuFunctionFrame $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct CpuFunctionFrame ([] 'O) (:descriptor-id 'String) (:descriptor-version 'Number) (:callback-id 'String) (:time 'Number) (:versions 'quamolit.direct-frame/FrameVersions) (:value 'O)
          :examples $ []
          :schema $ :: 'StructDef
        'CpuFunctionRegistry $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct CpuFunctionRegistry ([] 'I 'O)
            :samplers $ :: 'Map 'String $ :: 'Fn
              {} (:return 'O)
                :args $ [] 'I 'Number
          :examples $ []
          :schema $ :: 'StructDef
        'CpuFunctionRequest $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct CpuFunctionRequest ([] 'I) (:descriptor 'quamolit.motion-cpu/CpuFunctionDescriptor) (:time 'Number) (:versions 'quamolit.direct-frame/FrameVersions) (:input 'I)
          :examples $ []
          :schema $ :: 'StructDef
        'gpu-reason $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-reason (descriptor)
            assert |invalid-cpu-function-id $ not $ empty? (:id descriptor)
            assert |invalid-cpu-function-version $ motion/valid-motion-version? $ :version descriptor
            assert |empty-cpu-function-callback $ not $ empty? (:callback-id descriptor)
            match (:gpu-status descriptor)
              (:unsupported reason)
                do
                  assert |empty-cpu-function-gpu-reason $ not $ empty? reason
                  , reason
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'String)
            :args $ [] 'quamolit.motion-cpu/CpuFunctionDescriptor
        'register-function $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn register-function (registry callback-id sampler)
            assert |empty-cpu-function-id $ not $ empty? callback-id
            assert |duplicate-cpu-function-id $ not $ contains? (:samplers registry) callback-id
            CpuFunctionRegistry :samplers $ assoc (:samplers registry) callback-id sampler
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.motion-cpu/CpuFunctionRegistry 'I 'O) 'String $ :: 'Fn
              {} (:return 'O)
                :args $ [] 'I 'Number
            :generics $ [] 'I 'O
            :return $ :: 'quamolit.motion-cpu/CpuFunctionRegistry 'I 'O
        'resample-function $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn resample-function (previous request registry valid-output)
            assert |invalid-cpu-function-request $ valid-request? request
            let
                descriptor $ :descriptor request
              if
                and
                  = (:descriptor-id previous) (:id descriptor)
                  = (:descriptor-version previous) (:version descriptor)
                  = (:callback-id previous) (:callback-id descriptor)
                  = (:time previous) (:time request)
                  = (:versions previous) (:versions request)
                , previous $ sample-function request registry valid-output
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.motion-cpu/CpuFunctionFrame 'O) (:: 'quamolit.motion-cpu/CpuFunctionRequest 'I) (:: 'quamolit.motion-cpu/CpuFunctionRegistry 'I 'O)
              :: 'Fn $ {} (:return 'Bool)
                :args $ [] 'O
            :generics $ [] 'I 'O
            :return $ :: 'quamolit.motion-cpu/CpuFunctionFrame 'O
          :tests $ [] $ %{} 'TestEntry (:name |complete-dependencies)
            :code $ quote $ let
                initial-frame $ quamolit.test.cpu-motion-fixture/frame-at 0.5 0 false 100
                same $ quamolit.test.cpu-motion-fixture/resample-at initial-frame 0.5 0 false 100
                ready $ quamolit.test.cpu-motion-fixture/resample-at initial-frame 0.5 0 true 100
                viewport $ quamolit.test.cpu-motion-fixture/resample-at initial-frame 0.5 0 false 110
                model $ quamolit.test.cpu-motion-fixture/resample-at initial-frame 0.5 1 false 100
              is= initial-frame same
              is= 100 $ :x $ :value initial-frame
              is= 120 $ :x $ :value ready
              is= 71 $ :y $ :value viewport
              is= 101 $ :x $ :value model
              is= |runtime-callback-vec2 $ quamolit.test.cpu-motion-fixture/unsupported-reason
            :tags $ #{} :motion-cpu :unit
        'sample-function $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-function (request registry valid-output)
            assert |invalid-cpu-function-request $ valid-request? request
            let
                descriptor $ :descriptor request
                callback-id $ :callback-id descriptor
              assert |missing-cpu-function-callback $ contains? (:samplers registry) callback-id
              let
                  sampler $ .unwrap $ get (:samplers registry) callback-id
                  value $ sampler (:input request) (:time request)
                assert |invalid-cpu-function-output $ valid-output value
                CpuFunctionFrame :descriptor-id (:id descriptor) :descriptor-version (:version descriptor) :callback-id callback-id :time (:time request) :versions (:versions request) :value value
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.motion-cpu/CpuFunctionRequest 'I) (:: 'quamolit.motion-cpu/CpuFunctionRegistry 'I 'O)
              :: 'Fn $ {} (:return 'Bool)
                :args $ [] 'O
            :generics $ [] 'I 'O
            :return $ :: 'quamolit.motion-cpu/CpuFunctionFrame 'O
          :tests $ []
            %{} 'TestEntry (:name |ordered-vec2)
              :code $ quote $ do
                is= 120 $ :x $ :value (quamolit.test.cpu-motion-fixture/frame-at 1 0 false 100)
                is= 80 $ :x $ :value (quamolit.test.cpu-motion-fixture/frame-at 0 0 false 100)
                is= 100 $ :x $ :value (quamolit.test.cpu-motion-fixture/frame-at 0.5 0 false 100)
                is= 90 $ :x $ :value (quamolit.test.cpu-motion-fixture/frame-at 0.25 0 false 100)
                is= 120 $ :x $ :value (quamolit.test.cpu-motion-fixture/frame-at 1 0 false 100)
                is= 70 $ :y $ :value (quamolit.test.cpu-motion-fixture/frame-at 0.5 0 false 100)
              :tags $ #{} :motion-cpu :unit
            %{} 'TestEntry (:name |reject-output-and-missing-callback)
              :code $ quote $ let
                  request $ quamolit.test.cpu-motion-fixture/make-request 0.5 0 false 100
                  registry $ quamolit.test.cpu-motion-fixture/make-registry
                  reject-output $ fn (value)
                    hint-fn $ {}
                      :args $ [] 'quamolit.motion/Vec2
                      :return 'Bool
                    , false
                  empty-registry $ assert-type
                    CpuFunctionRegistry :samplers $ {}
                    :: 'quamolit.motion-cpu/CpuFunctionRegistry 'quamolit.test.cpu-motion-fixture/CustomInput 'quamolit.motion/Vec2
                is-throws $ sample-function request registry reject-output
                is-throws $ sample-function request empty-registry quamolit.test.cpu-motion-fixture/valid-output?
              :tags $ #{} :motion-cpu :unit
        'valid-request? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn valid-request? (request)
            let
                descriptor $ :descriptor request
              and
                not $ empty? $ :id descriptor
                motion/valid-motion-version? $ :version descriptor
                not $ empty? $ :callback-id descriptor
                match (:gpu-status descriptor)
                  (:unsupported reason)
                    not $ empty? reason
                motion/finite-number? $ :time request
                direct/valid-frame-versions? $ :versions request
                = (:version descriptor)
                  :motion $ :versions request
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] $ :: 'quamolit.motion-cpu/CpuFunctionRequest 'I
            :generics $ [] 'I
          :tests $ [] $ %{} 'TestEntry (:name |reject-invalid)
            :code $ quote $ let
                request $ quamolit.test.cpu-motion-fixture/make-request 0.5 0 false 100
                descriptor $ :descriptor request
              is= true $ valid-request? request
              is= false $ valid-request? $ assoc request :time (sqrt -1)
              is= false $ valid-request? $ assoc request :descriptor (assoc descriptor :version 1.5)
              is= false $ valid-request? $ assoc request :descriptor (assoc descriptor :id |)
              is= false $ valid-request? $ assoc request :descriptor (assoc descriptor :callback-id |)
              is= false $ valid-request? $ assoc request :versions
                assoc (:versions request) :motion 2
              is= false $ valid-request? $ assoc request :versions
                assoc (:versions request) :resources -1
            :tags $ #{} :motion-cpu :unit
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.motion-cpu
          :require (quamolit.motion :as motion) (quamolit.direct-frame :as direct)
            calcit.test :refer $ is= is-throws
    'quamolit.motion-gpu $ %{} 'FileEntry
      :defs $ {}
        'GpuCompositionLowering $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defenum GpuCompositionLowering (:supported 'quamolit.motion-gpu/GpuCompositionPlan) (:unsupported 'String)
          :examples $ []
          :schema $ :: 'EnumDef
        'GpuCompositionPlan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct GpuCompositionPlan (:id 'String) (:version 'Number) (:left 'quamolit.motion-gpu/GpuScalarPlan) (:right 'quamolit.motion-gpu/GpuScalarPlan) (:operation 'quamolit.motion/ScalarComposeOp)
          :examples $ []
          :schema $ :: 'StructDef
        'GpuScalarKernel $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defenum GpuScalarKernel (:constant 'Number) (:time 'Number 'Number) (:tween 'quamolit.motion/ScalarTween) (:keyframes 'quamolit.motion/ScalarTrack)
          :examples $ []
          :schema $ :: 'EnumDef
        'GpuScalarLowering $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defenum GpuScalarLowering (:supported 'quamolit.motion-gpu/GpuScalarPlan) (:unsupported 'String)
          :examples $ []
          :schema $ :: 'EnumDef
        'GpuScalarPlan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct GpuScalarPlan (:id 'String) (:version 'Number) (:kernel 'quamolit.motion-gpu/GpuScalarKernel)
          :examples $ []
          :schema $ :: 'EnumDef
        'GpuVec2Kernel $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defenum GpuVec2Kernel (:constant 'quamolit.motion/Vec2) (:tween 'quamolit.motion/Vec2Tween)
          :examples $ []
          :schema $ :: 'EnumDef
        'GpuVec2Lowering $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defenum GpuVec2Lowering (:supported 'quamolit.motion-gpu/GpuVec2Plan) (:unsupported 'String)
          :examples $ []
          :schema $ :: 'EnumDef
        'GpuVec2Plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct GpuVec2Plan (:id 'String) (:version 'Number) (:kernel 'quamolit.motion-gpu/GpuVec2Kernel)
          :examples $ []
          :schema $ :: 'StructDef
        'gpu-keyframe-capacity $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-keyframe-capacity () 16
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ []
        'lower-composition $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn lower-composition (composition)
            do (motion/sample-scalar-composition composition 0)
              let
                  left $ lower-scalar $ :left composition
                  right $ lower-scalar $ :right composition
                match left
                  (:unsupported reason) (GpuCompositionLowering :unsupported reason)
                  (:supported left-plan)
                    match right
                      (:unsupported reason) (GpuCompositionLowering :unsupported reason)
                      (:supported right-plan)
                        GpuCompositionLowering :supported $ GpuCompositionPlan :id (:id composition) :version (:version composition) :left left-plan :right right-plan :operation $ :operation composition
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion-gpu/GpuCompositionLowering)
            :args $ [] 'quamolit.motion/ScalarComposition
          :tests $ []
            %{} 'TestEntry (:name |bounded-two-inputs)
              :code $ quote $ let
                  left $ motion/ScalarDescriptor :id |left :version 1 :motion $ motion/ScalarMotion :constant 10
                  right $ motion/ScalarDescriptor :id |right :version 1 :motion $ motion/ScalarMotion :constant 20
                  composition $ motion/ScalarComposition :id |mix :version 2 :left left :right right :operation $ motion/ScalarComposeOp :mix 0.25
                is=
                  GpuCompositionLowering :supported $ GpuCompositionPlan :id |mix :version 2 :left
                    GpuScalarPlan :id |left :version 1 :kernel $ GpuScalarKernel :constant 10
                    , :right
                      GpuScalarPlan :id |right :version 1 :kernel $ GpuScalarKernel :constant 20
                      , :operation $ motion/ScalarComposeOp :mix 0.25
                  lower-composition composition
                is= 12.5 $ motion/sample-scalar-composition composition 0
              :tags $ #{} :motion-gpu :unit
            %{} 'TestEntry (:name |unsupported-leaf-and-invalid-mix)
              :code $ quote $ let
                  track $ motion/ScalarTrack :frames
                    map (range 0 17)
                      fn (i)
                        motion/ScalarKeyframe :at i :value i :easing $ motion/Easing :linear
                    , :loop $ motion/TrackLoop :clamp
                  left $ motion/ScalarDescriptor :id |left :version 1 :motion $ motion/ScalarMotion :keyframes track
                  right $ motion/ScalarDescriptor :id |right :version 1 :motion $ motion/ScalarMotion :constant 20
                  composition $ motion/ScalarComposition :id |sum :version 1 :left left :right right :operation $ motion/ScalarComposeOp :add
                  invalid $ motion/ScalarComposition :id |bad :version 1 :left right :right right :operation $ motion/ScalarComposeOp :mix 2
                is= (GpuCompositionLowering :unsupported |keyframe-capacity-exceeded) (lower-composition composition)
                is-throws $ lower-composition invalid
              :tags $ #{} :motion-gpu :unit
        'lower-cpu-scalar $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn lower-cpu-scalar (descriptor)
            do
              assert |invalid-cpu-motion-id $ not $ empty? (:id descriptor)
              assert |invalid-cpu-motion-version $ motion/valid-motion-version? $ :version descriptor
              assert |empty-cpu-callback-id $ not $ empty? (:callback-id descriptor)
              match (:gpu-status descriptor)
                (:unsupported reason)
                  do
                    assert |missing-cpu-gpu-diagnostic $ not $ empty? reason
                    GpuScalarLowering :unsupported reason
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion-gpu/GpuScalarLowering)
            :args $ [] 'quamolit.motion/CpuScalarDescriptor
          :tests $ []
            %{} 'TestEntry (:name |explicit-cpu-diagnostic)
              :code $ quote $ let
                  descriptor $ motion/CpuScalarDescriptor :id |custom :version 1 :callback-id |ease :gpu-status $ motion/CpuGpuStatus :unsupported |runtime-callback
                  bad $ motion/CpuScalarDescriptor :id |bad :version -1 :callback-id |ease :gpu-status $ motion/CpuGpuStatus :unsupported |runtime-callback
                is= (GpuScalarLowering :unsupported |runtime-callback) (lower-cpu-scalar descriptor)
                is-throws $ lower-cpu-scalar bad
              :tags $ #{} :motion-gpu :unit
            %{} 'TestEntry (:name |reject-invalid-identity)
              :code $ quote $ let
                  make $ fn (id version callback-id)
                    hint-fn $ {}
                      :args $ [] 'String 'Number 'String
                      :return 'quamolit.motion/CpuScalarDescriptor
                    motion/CpuScalarDescriptor :id id :version version :callback-id callback-id :gpu-status $ motion/CpuGpuStatus :unsupported |runtime-callback
                is-throws $ lower-cpu-scalar $ make | 1 |callback
                is-throws $ lower-cpu-scalar $ make |custom 1.5 |callback
                is-throws $ lower-cpu-scalar $ make |custom 1 |
                is= (GpuScalarLowering :unsupported |runtime-callback)
                  lower-cpu-scalar $ make |custom 2 |callback
              :tags $ #{} :motion-gpu :unit
        'lower-scalar $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn lower-scalar (descriptor)
            do (motion/sample-scalar descriptor 0)
              match (:motion descriptor)
                (:constant amount)
                  GpuScalarLowering :supported $ GpuScalarPlan :id (:id descriptor) :version (:version descriptor) :kernel $ GpuScalarKernel :constant amount
                (:time scale offset)
                  GpuScalarLowering :supported $ GpuScalarPlan :id (:id descriptor) :version (:version descriptor) :kernel $ GpuScalarKernel :time scale offset
                (:tween tween)
                  do
                    motion/sample-tween tween $ :start tween
                    GpuScalarLowering :supported $ GpuScalarPlan :id (:id descriptor) :version (:version descriptor) :kernel $ GpuScalarKernel :tween tween
                (:keyframes track)
                  if
                    <=
                      count $ :frames track
                      gpu-keyframe-capacity
                    GpuScalarLowering :supported $ GpuScalarPlan :id (:id descriptor) :version (:version descriptor) :kernel $ GpuScalarKernel :keyframes track
                    GpuScalarLowering :unsupported |keyframe-capacity-exceeded
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion-gpu/GpuScalarLowering)
            :args $ [] 'quamolit.motion/ScalarDescriptor
          :tests $ []
            %{} 'TestEntry (:name |standard-kernels)
              :code $ quote $ let
                  fade $ motion/ScalarTween :start 0 :duration 1 :from 10 :to 20 :easing $ motion/Easing :linear
                  descriptor $ motion/ScalarDescriptor :id |fade :version 1 :motion $ motion/ScalarMotion :tween fade
                  constant $ motion/ScalarDescriptor :id |constant :version 1 :motion $ motion/ScalarMotion :constant 7
                  clock $ motion/ScalarDescriptor :id |clock :version 1 :motion $ motion/ScalarMotion :time 2 1
                is=
                  GpuScalarLowering :supported $ GpuScalarPlan :id |fade :version 1 :kernel $ GpuScalarKernel :tween fade
                  lower-scalar descriptor
                is=
                  GpuScalarLowering :supported $ GpuScalarPlan :id |constant :version 1 :kernel $ GpuScalarKernel :constant 7
                  lower-scalar constant
                is=
                  GpuScalarLowering :supported $ GpuScalarPlan :id |clock :version 1 :kernel $ GpuScalarKernel :time 2 1
                  lower-scalar clock
                is= 10 $ motion/sample-scalar descriptor 0
                is= 12.5 $ motion/sample-scalar descriptor 0.25
                is= 15 $ motion/sample-scalar descriptor 0.5
                is= 20 $ motion/sample-scalar descriptor 1
              :tags $ #{} :motion-gpu :unit
            %{} 'TestEntry (:name |unsupported-and-invalid)
              :code $ quote $ let
                  track $ motion/ScalarTrack :frames
                    map (range 0 17)
                      fn (i)
                        motion/ScalarKeyframe :at i :value i :easing $ motion/Easing :linear
                    , :loop $ motion/TrackLoop :clamp
                  keyframes $ motion/ScalarDescriptor :id |track :version 1 :motion $ motion/ScalarMotion :keyframes track
                  bad $ motion/ScalarDescriptor :id |bad :version -1 :motion $ motion/ScalarMotion :constant 7
                is= (GpuScalarLowering :unsupported |keyframe-capacity-exceeded) (lower-scalar keyframes)
                is-throws $ lower-scalar bad
              :tags $ #{} :motion-gpu :unit
            %{} 'TestEntry (:name |bounded-keyframes-and-endpoints)
              :code $ quote $ let
                  track $ motion/ScalarTrack :frames
                    []
                      motion/ScalarKeyframe :at 0 :value 10 :easing $ motion/Easing :linear
                      motion/ScalarKeyframe :at 1 :value 20 :easing $ motion/Easing :linear
                    , :loop $ motion/TrackLoop :mirror
                  descriptor $ motion/ScalarDescriptor :id |track :version 3 :motion $ motion/ScalarMotion :keyframes track
                is= 16 $ gpu-keyframe-capacity
                is=
                  GpuScalarLowering :supported $ GpuScalarPlan :id |track :version 3 :kernel $ GpuScalarKernel :keyframes track
                  lower-scalar descriptor
                is= 10 $ motion/sample-scalar descriptor 0
                is= 12.5 $ motion/sample-scalar descriptor 0.25
                is= 15 $ motion/sample-scalar descriptor 0.5
                is= 20 $ motion/sample-scalar descriptor 1
                is= 19.99999 $ motion/sample-scalar descriptor 1.000001
              :tags $ #{} :motion-gpu :unit
            %{} 'TestEntry (:name |capacity-boundary)
              :code $ quote $ let
                  frames16 $ map (range 0 16)
                    fn (i)
                      motion/ScalarKeyframe :at i :value i :easing $ motion/Easing :linear
                  frames17 $ map (range 0 17)
                    fn (i)
                      motion/ScalarKeyframe :at i :value i :easing $ motion/Easing :linear
                  track16 $ motion/ScalarTrack :frames frames16 :loop $ motion/TrackLoop :clamp
                  track17 $ motion/ScalarTrack :frames frames17 :loop $ motion/TrackLoop :clamp
                  descriptor16 $ motion/ScalarDescriptor :id |exact :version 1 :motion $ motion/ScalarMotion :keyframes track16
                  descriptor17 $ motion/ScalarDescriptor :id |over :version 1 :motion $ motion/ScalarMotion :keyframes track17
                is= 16 $ count frames16
                is= 17 $ count frames17
                is=
                  GpuScalarLowering :supported $ GpuScalarPlan :id |exact :version 1 :kernel $ GpuScalarKernel :keyframes track16
                  lower-scalar descriptor16
                is= (GpuScalarLowering :unsupported |keyframe-capacity-exceeded) (lower-scalar descriptor17)
              :tags $ #{} :motion-gpu :unit
        'lower-vec2 $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn lower-vec2 (descriptor)
            do (motion/sample-vec2 descriptor 0)
              match (:motion descriptor)
                (:constant value)
                  GpuVec2Lowering :supported $ GpuVec2Plan :id (:id descriptor) :version (:version descriptor) :kernel $ GpuVec2Kernel :constant value
                (:tween tween)
                  do
                    motion/sample-vec2 descriptor $ :start tween
                    GpuVec2Lowering :supported $ GpuVec2Plan :id (:id descriptor) :version (:version descriptor) :kernel $ GpuVec2Kernel :tween tween
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion-gpu/GpuVec2Lowering)
            :args $ [] 'quamolit.motion/Vec2Descriptor
          :tests $ []
            %{} 'TestEntry (:name |vector-kernels)
              :code $ quote $ let
                  from $ motion/Vec2 :x 10 :y 20
                  to $ motion/Vec2 :x 30 :y 40
                  tween $ motion/Vec2Tween :start 0 :duration 1 :from from :to to :easing $ motion/Easing :smoothstep
                  descriptor $ motion/Vec2Descriptor :id |move :version 2 :motion $ motion/Vec2Motion :tween tween
                  constant $ motion/Vec2Descriptor :id |origin :version 1 :motion $ motion/Vec2Motion :constant from
                is=
                  GpuVec2Lowering :supported $ GpuVec2Plan :id |move :version 2 :kernel $ GpuVec2Kernel :tween tween
                  lower-vec2 descriptor
                is=
                  GpuVec2Lowering :supported $ GpuVec2Plan :id |origin :version 1 :kernel $ GpuVec2Kernel :constant from
                  lower-vec2 constant
                is= from $ motion/sample-vec2 descriptor 0
                is= (motion/Vec2 :x 13.125 :y 23.125) (motion/sample-vec2 descriptor 0.25)
                is= (motion/Vec2 :x 20 :y 30) (motion/sample-vec2 descriptor 0.5)
                is= to $ motion/sample-vec2 descriptor 1
              :tags $ #{} :motion-gpu :unit
            %{} 'TestEntry (:name |invalid-vector-input)
              :code $ quote $ let
                  from $ motion/Vec2 :x 10 :y 20
                  to $ motion/Vec2 :x 30 :y 40
                  bad-tween $ motion/Vec2Tween :start 0 :duration -1 :from from :to to :easing $ motion/Easing :linear
                  bad $ motion/Vec2Descriptor :id |bad :version 1 :motion $ motion/Vec2Motion :tween bad-tween
                  bad-version $ motion/Vec2Descriptor :id |bad :version -1 :motion $ motion/Vec2Motion :constant from
                is-throws $ lower-vec2 bad
                is-throws $ lower-vec2 bad-version
              :tags $ #{} :motion-gpu :unit
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.motion-gpu
          :require (quamolit.motion :as motion)
            calcit.test :refer $ is= is-throws
    'quamolit.playback $ %{} 'FileEntry
      :defs $ {}
        'advance-to-host $ %{} 'CodeEntry
          :doc "|从显式检查点按映射后的目标 tick 和输入日志推进；暂停返回原检查点，倒退须传旧检查点，预算不足报错。"
          :code $ quote $ defn advance-to-host (timeline host-time checkpoint input-log max-steps update-state)
            fixed/advance-simulation checkpoint
              clock/simulation-tick-at timeline host-time $ :dt checkpoint
              , input-log max-steps update-state
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.host-clock/HostClock 'Number (:: 'quamolit.fixed-step/SimulationState 'S) (:: 'Map 'Number 'I) 'Number $ :: 'Fn
              {} (:return 'S)
                :args $ [] 'S 'I 'Number 'Number
            :generics $ [] 'S 'I
            :return $ :: 'quamolit.fixed-step/SimulationState 'S
          :tests $ [] $ %{} 'TestEntry (:name |staged-paused-and-seeked)
            :code $ quote $ let
                timeline $ clock/start-clock 10 0 1
                paused $ clock/pause-clock timeline 10.5
                seeked $ clock/seek-clock paused 20 0.25
                inputs $ {} (1 2) (2 4) (3 -2) (4 0)
                update-state $ fn (state input dt seed)
                  hint-fn $ {}
                    :args $ [] 'Number 'Number 'Number 'Number
                    :return 'Number
                  + state $ * input dt
                initial $ fixed/start-simulation 0.25 7 0
                direct $ advance-to-host timeline 11 initial inputs 4 update-state
                first-step $ advance-to-host timeline 10.25 initial inputs 1 update-state
                second-step $ advance-to-host timeline 10.5 first-step inputs 1 update-state
                staged $ advance-to-host timeline 11 second-step inputs 2 update-state
                paused-frame $ advance-to-host paused 20 second-step inputs 0 update-state
                rewound $ advance-to-host seeked 20 initial inputs 1 update-state
              is= 4 $ :tick direct
              is= 1 $ :state direct
              is= direct staged
              is= second-step paused-frame
              is= 1 $ :tick rewound
              is= 0.5 $ :state rewound
              is-throws $ advance-to-host seeked 20 second-step inputs 1 update-state
              is-throws $ advance-to-host timeline 11 initial inputs 3 update-state
              is-throws $ advance-to-host timeline 9 initial inputs 4 update-state
            :tags $ #{} :playback :unit
        'request-at-host $ %{} 'CodeEntry
          :doc "|用显式宿主时钟替换请求的动画时间，校验完整身份与六类版本；原请求 time 仅作占位，不被读取。"
          :code $ quote $ defn request-at-host (timeline host-time request)
            let
                mapped $ direct/DirectRequest :id (:id request) :time (clock/sample-clock timeline host-time) :versions (:versions request) :motion (:motion request) :model (:model request) :input (:input request) :resources (:resources request) :viewport $ :viewport request
              assert |invalid-playback-request $ direct/valid-direct-request? mapped
              , mapped
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.host-clock/HostClock 'Number $ :: 'quamolit.direct-frame/DirectRequest 'D 'M 'I 'R 'V
            :generics $ [] 'D 'M 'I 'R 'V
            :return $ :: 'quamolit.direct-frame/DirectRequest 'D 'M 'I 'R 'V
        'resample-at-host $ %{} 'CodeEntry (:doc "|仅当映射后的动画时间、身份及所有版本相同才复用前帧；资源/输入变化须递增相应版本。")
          :code $ quote $ defn resample-at-host (previous timeline host-time request evaluate)
            direct/resample-at previous (request-at-host timeline host-time request) evaluate
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.direct-frame/DirectFrame 'S) 'quamolit.host-clock/HostClock 'Number (:: 'quamolit.direct-frame/DirectRequest 'D 'M 'I 'R 'V)
              :: 'Fn $ {} (:return 'S)
                :args $ [] 'D 'M 'I 'R 'V 'Number
            :generics $ [] 'D 'M 'I 'R 'V 'S
            :return $ :: 'quamolit.direct-frame/DirectFrame 'S
        'sample-archive-at-host $ %{} 'CodeEntry (:doc "|将宿主暂停或 seek 后的动画时间映射为 tick，再按档案和预算重放。")
          :code $ quote $ defn sample-archive-at-host (timeline host-time saved max-steps update-state)
            archive/sample-archive-at saved
              clock/simulation-tick-at timeline host-time $ :dt $ :origin saved
              , max-steps update-state
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.host-clock/HostClock 'Number (:: 'quamolit.replay-archive/ReplayArchive 'S 'I) 'Number $ :: 'Fn
              {} (:return 'S)
                :args $ [] 'S 'I 'Number 'Number
            :generics $ [] 'S 'I
            :return $ :: 'quamolit.fixed-step/SimulationState 'S
          :tests $ [] $ %{} 'TestEntry (:name |host-pause-seek-with-retained-log)
            :code $ quote $ let
                timeline $ clock/start-clock 10 0 1
                paused $ clock/pause-clock timeline 10.5
                seeked $ clock/seek-clock timeline 20 0.5
                saved $ quamolit.test.replay-archive-fixture/make-archive
              is= 2 $ :state $ sample-archive-at-host timeline 11.5 saved 0 quamolit.test.replay-archive-fixture/update-state
              is= 1.5 $ :state $ sample-archive-at-host paused 20 saved 2 quamolit.test.replay-archive-fixture/update-state
              is= 1.5 $ :state $ sample-archive-at-host seeked 20 saved 2 quamolit.test.replay-archive-fixture/update-state
              is-throws $ sample-archive-at-host seeked 20 saved 1 quamolit.test.replay-archive-fixture/update-state
            :tags $ #{} :playback :replay-archive :unit
        'sample-at-host $ %{} 'CodeEntry (:doc "|在任意宿主时间直接采样完整请求；不读取或推进固定步长模拟状态。")
          :code $ quote $ defn sample-at-host (timeline host-time request evaluate)
            direct/sample-at (request-at-host timeline host-time request) evaluate
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.host-clock/HostClock 'Number (:: 'quamolit.direct-frame/DirectRequest 'D 'M 'I 'R 'V)
              :: 'Fn $ {} (:return 'S)
                :args $ [] 'D 'M 'I 'R 'V 'Number
            :generics $ [] 'D 'M 'I 'R 'V 'S
            :return $ :: 'quamolit.direct-frame/DirectFrame 'S
          :tests $ [] $ %{} 'TestEntry (:name |direct-and-revision-at-host)
            :code $ quote $ let
                timeline $ clock/start-clock 10 0 1
                paused $ clock/pause-clock timeline 10.5
                seeked $ clock/seek-clock paused 20 0.25
                descriptor $ motion/ScalarDescriptor :id |fade :version 1 :motion $ motion/ScalarMotion :tween
                  motion/ScalarTween :start 0 :duration 1 :from 10 :to 20 :easing $ motion/Easing :linear
                versions $ direct/FrameVersions :component 0 :motion 0 :model 0 :input 0 :resources 0 :viewport 0
                request $ direct/DirectRequest :id |badge :time 999 :versions versions :motion descriptor :model 5 :input 0 :resources false :viewport 100
                ready-request $ direct/DirectRequest :id |badge :time 999 :versions
                  direct/FrameVersions :component 0 :motion 0 :model 0 :input 0 :resources 1 :viewport 0
                  , :motion descriptor :model 5 :input 0 :resources true :viewport 100
                evaluate $ fn (motion model input resources viewport time)
                  hint-fn $ {}
                    :args $ [] 'quamolit.motion/ScalarDescriptor 'Number 'Number 'Bool 'Number 'Number
                    :return 'Number
                  + (motion/sample-scalar motion time) model input (if resources 20 0) (/ viewport 10)
                baseline $ sample-at-host timeline 10.5 request evaluate
                reused $ resample-at-host baseline paused 20 request $ fn (motion model input resources viewport time)
                  hint-fn $ {}
                    :args $ [] 'quamolit.motion/ScalarDescriptor 'Number 'Number 'Bool 'Number 'Number
                    :return 'Number
                  raise |unexpected-evaluation
              is= 0.5 $ :time baseline
              is= 30 $ :scene baseline
              is= ([] 35 25 30 27.5 35)
                map ([] 11 10 10.5 10.25 11)
                  fn (host-time)
                    :scene $ sample-at-host timeline host-time request evaluate
              is= baseline reused
              is= 50 $ :scene $ resample-at-host baseline paused 20 ready-request evaluate
              is= 27.5 $ :scene $ sample-at-host seeked 20 request evaluate
              is-throws $ request-at-host timeline 9 request
            :tags $ #{} :playback :unit
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.playback
          :require (quamolit.host-clock :as clock) (quamolit.direct-frame :as direct) (quamolit.fixed-step :as fixed)
            calcit.test :refer $ is= is-throws
            quamolit.motion :as motion
            quamolit.replay-archive :as archive
    'quamolit.presence $ %{} 'FileEntry
      :defs $ {}
        'InstanceResourcePlan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct InstanceResourcePlan
            :references $ :: 'List 'quamolit.presence/InstanceResourceRef
            :release $ :: 'List 'quamolit.scene-ir/InstanceSource
            :live-references 'Number
            :live-sources 'Number
          :examples $ []
          :schema $ :: 'StructDef
        'InstanceResourceRef $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct InstanceResourceRef (:key 'String) (:source 'quamolit.scene-ir/InstanceSource) (:count 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'PresenceItem $ %{} 'CodeEntry (:doc "|稳定 Scene 路径、保留展示数据、阶段和局部 alpha 意图。")
          :code $ quote $ defstruct PresenceItem (:entry 'quamolit.scene-diff/SceneEntry) (:phase 'quamolit.presence/PresencePhase) (:alpha 'quamolit.motion/ScalarTween)
          :examples $ []
          :schema $ :: 'StructDef
        'PresenceModel $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct PresenceModel
            :items $ :: 'List 'quamolit.presence/PresenceItem
          :examples $ []
          :schema $ :: 'StructDef
        'PresencePhase $ %{} 'CodeEntry (:doc "|Scene 逻辑实例的进入、稳定展示与退出阶段。")
          :code $ quote $ defenum PresencePhase (:enter) (:present) (:exit)
          :examples $ []
          :schema $ :: 'EnumDef
        'PresenceSample $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct PresenceSample (:entry 'quamolit.scene-diff/SceneEntry) (:alpha 'Number) (:interactive 'Bool)
          :examples $ []
          :schema $ :: 'StructDef
        'PresenceUpdate $ %{} 'CodeEntry (:doc "|返回新纯模型与恰好一次的逻辑释放通知，不持有宿主句柄。")
          :code $ quote $ defstruct PresenceUpdate (:model 'quamolit.presence/PresenceModel)
            :released $ :: 'List 'quamolit.scene-diff/SceneEntry
          :examples $ []
          :schema $ :: 'StructDef
        'alpha-active? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn alpha-active? (item time)
            let
                tween $ :alpha item
              and
                not= (:from tween) (:to tween)
                > (:duration tween) 0
                >= time $ :start tween
                < time $ + (:start tween) (:duration tween)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.presence/PresenceItem 'Number
        'alpha-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn alpha-at (item time)
            motion/sample-tween (:alpha item) time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.presence/PresenceItem 'Number
        'alpha-finished? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn alpha-finished? (item time)
            let
                tween $ :alpha item
              >= time $ + (:start tween) (:duration tween)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.presence/PresenceItem 'Number
        'alpha-tween $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn alpha-tween (from to start duration easing)
            let
                tween $ motion/ScalarTween :from from :to to :start start :duration duration :easing easing
              motion/sample-tween tween start
              , tween
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/ScalarTween)
            :args $ [] 'Number 'Number 'Number 'Number 'quamolit.motion/Easing
        'append-exits $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn append-exits (remaining desired items time duration easing)
            if (empty? remaining) items $ let
                item $ first-item remaining
                next $ if
                  path-in-entries? desired $ :path $ :entry item
                  , items $ append items (exit-item item time duration easing)
              recur (rest remaining) desired next time duration easing
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.presence/PresenceItem) (:: 'List 'quamolit.scene-diff/SceneEntry) (:: 'List 'quamolit.presence/PresenceItem) 'Number 'Number 'quamolit.motion/Easing
            :return $ :: 'List 'quamolit.presence/PresenceItem
        'bump-all-resource-refs $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn bump-all-resource-refs (sources)
            if (empty? sources) (empty-resource-refs)
              bump-resource-ref
                bump-all-resource-refs $ rest sources
                first-source sources
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] $ :: 'List 'quamolit.scene-ir/InstanceSource
            :return $ :: 'List 'quamolit.presence/InstanceResourceRef
        'bump-resource-ref $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn bump-resource-ref (refs source)
            let
                key $ instance-source-key source
              if (resource-ref-present? refs key) (increment-ref-in-list refs key source)
                append refs $ InstanceResourceRef :key key :source source :count 1
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.presence/InstanceResourceRef) 'quamolit.scene-ir/InstanceSource
            :return $ :: 'List 'quamolit.presence/InstanceResourceRef
          :tests $ [] $ %{} 'TestEntry (:name |shared-source-count)
            :code $ quote $ let
                source $ scene-ir/InstanceSource :id |shared :version 1 :count 2
                refs $ bump-resource-ref
                  bump-resource-ref (empty-resource-refs) source
                  , source
              is= 1 $ count refs
              is= 2 $ :count $ first-resource-ref refs
            :tags $ #{} :presence :unit
        'desired-prefix $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn desired-prefix (remaining earlier items time duration easing)
            if (empty? remaining) items $ let
                entry $ first-entry remaining
                path $ :path entry
                next $ if (path-in-items? earlier path)
                  let
                      old $ item-for-path earlier path
                    if
                      = (:phase old) (PresencePhase :exit)
                      revive-item old entry time duration easing
                      retain-item old entry
                  make-enter entry time duration easing
              recur (rest remaining) earlier (append items next) time duration easing
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.scene-diff/SceneEntry) (:: 'List 'quamolit.presence/PresenceItem) (:: 'List 'quamolit.presence/PresenceItem) 'Number 'Number 'quamolit.motion/Easing
            :return $ :: 'List 'quamolit.presence/PresenceItem
        'empty-instance-resource-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-instance-resource-plan ()
            InstanceResourcePlan :references (empty-resource-refs) :release (empty-instance-sources) :live-references 0 :live-sources 0
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/InstanceResourcePlan)
            :args $ []
        'empty-instance-sources $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-instance-sources () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.scene-ir/InstanceSource
        'empty-items $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-items () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.presence/PresenceItem
        'empty-presence-model $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-presence-model ()
            PresenceModel :items $ empty-items
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceModel)
            :args $ []
        'empty-released $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-released () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.scene-diff/SceneEntry
        'empty-resource-refs $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-resource-refs () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.presence/InstanceResourceRef
        'empty-samples $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-samples () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.presence/PresenceSample
        'exit-item $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn exit-item (item time duration easing)
            if
              = (:phase item) (PresencePhase :exit)
              , item $ PresenceItem :entry (:entry item) :phase (PresencePhase :exit) :alpha $ alpha-tween (alpha-at item time) 0 time duration easing
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceItem)
            :args $ [] 'quamolit.presence/PresenceItem 'Number 'Number 'quamolit.motion/Easing
        'first-entry $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn first-entry (entries)
            -> (first entries) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-diff/SceneEntry)
            :args $ [] $ :: 'List 'quamolit.scene-diff/SceneEntry
        'first-item $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn first-item (items)
            -> (first items) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceItem)
            :args $ [] $ :: 'List 'quamolit.presence/PresenceItem
        'first-resource-ref $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn first-resource-ref (refs)
            -> (first refs) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/InstanceResourceRef)
            :args $ [] $ :: 'List 'quamolit.presence/InstanceResourceRef
        'first-source $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn first-source (sources)
            -> (first sources) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/InstanceSource)
            :args $ [] $ :: 'List 'quamolit.scene-ir/InstanceSource
        'gather-instance-sources $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gather-instance-sources (items)
            if (empty? items) (empty-instance-sources)
              let
                  item $ first-item items
                match (item-instance-source item)
                  (:some source)
                    append
                      gather-instance-sources $ rest items
                      , source
                  (:none)
                    gather-instance-sources $ rest items
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] $ :: 'List 'quamolit.presence/PresenceItem
            :return $ :: 'List 'quamolit.scene-ir/InstanceSource
        'increment-ref-in-list $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn increment-ref-in-list (refs key source)
            if (empty? refs) (empty-resource-refs)
              let
                  head $ first-resource-ref refs
                if
                  = key $ :key head
                  prepend
                    increment-ref-in-list (rest refs) key source
                    InstanceResourceRef :key key :source (:source head) :count $ + 1 $ :count head
                  prepend
                    increment-ref-in-list (rest refs) key source
                    , head
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.presence/InstanceResourceRef) 'String 'quamolit.scene-ir/InstanceSource
            :return $ :: 'List 'quamolit.presence/InstanceResourceRef
        'initialize-items $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn initialize-items (entries items)
            if (empty? entries) items $ recur (rest entries)
              append items $ make-present $ first-entry entries
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.scene-diff/SceneEntry) (:: 'List 'quamolit.presence/PresenceItem)
            :return $ :: 'List 'quamolit.presence/PresenceItem
        'instance-resource-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn instance-resource-plan (model previous)
            let
                references $ bump-all-resource-refs $ gather-instance-sources (:items model)
              InstanceResourcePlan :references references :release (plan-release-sources references previous) :live-references (foldl references 0 total-ref-count) :live-sources $ count references
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/InstanceResourcePlan)
            :args $ [] 'quamolit.presence/PresenceModel 'quamolit.presence/InstanceResourcePlan
        'instance-source-key $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn instance-source-key (source)
            str (:id source) |@ (:version source) |@ $ :count source
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'String)
            :args $ [] 'quamolit.scene-ir/InstanceSource
        'item-for-path $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn item-for-path (items path)
            if (empty? items) (raise |missing-presence-path)
              let
                  item $ first-item items
                if
                  = path $ :path $ :entry item
                  , item $ recur (rest items) path
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceItem)
            :args $ [] (:: 'List 'quamolit.presence/PresenceItem) (:: 'List 'quamolit.scene-diff/IdentitySegment)
        'item-instance-source $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn item-instance-source (item)
            let
                content $ :content $ :node (:entry item)
              match content
                (:instances instances)
                  %some $ :source instances
                (:group group) (%none)
                (:rect rect) (%none)
                (:polyline path) (%none)
                (:text text) (%none)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.presence/PresenceItem
            :return $ :: 'Option 'quamolit.scene-ir/InstanceSource
        'make-enter $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn make-enter (entry time duration easing)
            PresenceItem :entry entry :phase (PresencePhase :enter) :alpha $ alpha-tween 0 1 time duration easing
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceItem)
            :args $ [] 'quamolit.scene-diff/SceneEntry 'Number 'Number 'quamolit.motion/Easing
        'make-present $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn make-present (entry)
            PresenceItem :entry entry :phase (PresencePhase :present) :alpha $ alpha-tween 1 1 0 0 $ motion/Easing :linear
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceItem)
            :args $ [] 'quamolit.scene-diff/SceneEntry
        'needs-frame-prefix? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn needs-frame-prefix? (items time)
            if (empty? items) false $ if
              or
                alpha-active? (first-item items) time
                not=
                  :phase $ first-item items
                  PresencePhase :present
              , true $ recur (rest items) time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] (:: 'List 'quamolit.presence/PresenceItem) 'Number
        'path-in-entries? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn path-in-entries? (entries path)
            if (empty? entries) false $ if
              = path $ :path $ first-entry entries
              , true $ recur (rest entries) path
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] (:: 'List 'quamolit.scene-diff/SceneEntry) (:: 'List 'quamolit.scene-diff/IdentitySegment)
        'path-in-items? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn path-in-items? (items path)
            if (empty? items) false $ if
              = path $ :path $ :entry (first-item items)
              , true $ recur (rest items) path
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] (:: 'List 'quamolit.presence/PresenceItem) (:: 'List 'quamolit.scene-diff/IdentitySegment)
        'plan-release-loop $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn plan-release-loop (remaining references acc)
            if (empty? remaining) acc $ let
                ref $ first-resource-ref remaining
              recur (rest remaining) references $ if
                resource-ref-present? references $ :key ref
                , acc $ append acc (:source ref)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.presence/InstanceResourceRef) (:: 'List 'quamolit.presence/InstanceResourceRef) (:: 'List 'quamolit.scene-ir/InstanceSource)
            :return $ :: 'List 'quamolit.scene-ir/InstanceSource
        'plan-release-sources $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn plan-release-sources (references previous)
            plan-release-loop (:references previous) references $ empty-instance-sources
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.presence/InstanceResourceRef) 'quamolit.presence/InstanceResourcePlan
            :return $ :: 'List 'quamolit.scene-ir/InstanceSource
          :tests $ [] $ %{} 'TestEntry (:name |release-only-when-absent)
            :code $ quote $ let
                source $ scene-ir/InstanceSource :id |shared :version 1 :count 2
                refs $ bump-resource-ref (empty-resource-refs) source
                previous $ InstanceResourcePlan :references refs :release (empty-instance-sources) :live-references 1 :live-sources 1
              is= 0 $ count $ plan-release-sources refs previous
              is= 1 $ count $ plan-release-sources (empty-resource-refs) previous
            :tags $ #{} :presence :unit
        'presence-needs-frame? $ %{} 'CodeEntry (:doc "|活跃或尚待终点结算的生命周期需要后续帧；结算后停止。")
          :code $ quote $ defn presence-needs-frame? (model time)
            if
              not $ motion/finite-number? time
              raise |invalid-presence-time
              needs-frame-prefix? (:items model) time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.presence/PresenceModel 'Number
        'reconcile-presence $ %{} 'CodeEntry (:doc "|按稳定路径协调声明：重排复用，退出保留，重入取消退出，换父/类型重挂载。")
          :code $ quote $ defn reconcile-presence (model document time duration easing)
            if
              not $ and (motion/finite-number? time) (motion/finite-number? duration) (>= duration 0)
              raise |invalid-presence-reconcile-time
              let
                  desired $ scene-diff/index-scene document
                  settled $ settle-presence model time
                  earlier $ :items $ :model settled
                  retained $ desired-prefix desired earlier (empty-items) time duration easing
                  items $ append-exits earlier desired retained time duration easing
                PresenceUpdate :model (PresenceModel :items items) :released $ :released settled
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceUpdate)
            :args $ [] 'quamolit.presence/PresenceModel 'quamolit.scene-ir/SceneDocument 'Number 'Number 'quamolit.motion/Easing
          :tests $ []
            %{} 'TestEntry (:name |reorder-exit-reentry-remount-parent)
              :code $ quote $ let
                  matrix $ scene-ir/Matrix2D :a 1 :b 0 :c 0 :d 1 :e 0 :f 0
                  color $ motion/ColorRgba :r 1 :g 0 :b 0 :a 1
                  group-content $ scene-ir/SceneContent :group $ scene-ir/GroupNode :transform matrix :clip (scene-ir/ClipSpec :none) :opacity 1
                  rect-content $ scene-ir/SceneContent :rect $ scene-ir/RectNode :x 10 :y 20 :width 16 :height 16 :fill color
                  instance-content $ scene-ir/SceneContent :instances $ scene-ir/InstanceNode :source (scene-ir/InstanceSource :id |points :version 1 :count 10000) :width 2 :height 2 :fill color
                  root $ scene-ir/SceneNode :id |root :parent | :key |root :content group-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  a $ scene-ir/SceneNode :id |a :parent |root :key |a :content rect-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :target |a-click
                  b $ scene-ir/SceneNode :id |b :parent |root :key |b :content rect-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :target |b-click
                  a-instance $ scene-ir/SceneNode :id |a-new :parent |root :key |a :content instance-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  full $ scene-ir/SceneDocument :nodes $ [] root a b
                  reordered $ scene-ir/SceneDocument :nodes $ [] root b a
                  b-only $ scene-ir/SceneDocument :nodes $ [] root b
                  type-changed $ scene-ir/SceneDocument :nodes $ [] root b a-instance
                  empty-doc $ scene-ir/SceneDocument :nodes $ []
                  easing $ motion/Easing :linear
                  initial $ start-presence full
                  reorder-update $ reconcile-presence initial reordered 0 1 easing
                  exit-update $ reconcile-presence initial b-only 0.5 1 easing
                  reenter-update $ reconcile-presence (:model exit-update) full 0.75 1 easing
                  settled $ settle-presence (:model exit-update) 1.5
                  settled-again $ settle-presence (:model settled) 2
                  type-update $ reconcile-presence initial type-changed 0.5 1 easing
                  parent-exit $ reconcile-presence initial empty-doc 0.5 1 easing
                  parent-done $ settle-presence (:model parent-exit) 1.5
                is= 3 $ count $ :items initial
                is= ([] |root |b |a)
                  map
                    :items $ :model reorder-update
                    fn (item)
                      :id $ :node $ :entry item
                is=
                  [] (PresencePhase :present) (PresencePhase :present) (PresencePhase :present)
                  map
                    :items $ :model reorder-update
                    fn (item) (:phase item)
                is= ([] 1 1 0.75)
                  map
                    sample-presence (:model exit-update) 0.75
                    fn (sample) (:alpha sample)
                is= ([] false true false)
                  map
                    sample-presence (:model exit-update) 0.75
                    fn (sample) (:interactive sample)
                is= 0 $ count $ :released reenter-update
                is= ([] 1 0.75 1)
                  map
                    sample-presence (:model reenter-update) 0.75
                    fn (sample) (:alpha sample)
                is= 1 $ count $ :released settled
                is= |a $ :id $ :node
                  first-entry $ :released settled
                is= 0 $ count $ :released settled-again
                is= 2 $ count $ :items (:model settled)
                is= 4 $ count $ :items (:model type-update)
                is= 3 $ count $ :released parent-done
                is= ([] |b |a |root)
                  map (:released parent-done)
                    fn (entry)
                      :id $ :node entry
                is= 0 $ count $ :items (:model parent-done)
                is= false $ presence-needs-frame? (:model parent-done) 1.5
              :tags $ #{} :presence :unit
            %{} 'TestEntry (:name |one-hundred-instance-mount-cycles)
              :code $ quote $ let
                  matrix $ scene-ir/Matrix2D :a 1 :b 0 :c 0 :d 1 :e 0 :f 0
                  color $ motion/ColorRgba :r 1 :g 0 :b 0 :a 1
                  group-content $ scene-ir/SceneContent :group $ scene-ir/GroupNode :transform matrix :clip (scene-ir/ClipSpec :none) :opacity 1
                  instance-content $ scene-ir/SceneContent :instances $ scene-ir/InstanceNode :source (scene-ir/InstanceSource :id |batch :version 1 :count 10000) :width 2 :height 2 :fill color
                  root $ scene-ir/SceneNode :id |root :parent | :key |root :content group-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  batch $ scene-ir/SceneNode :id |batch :parent |root :key |batch :content instance-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :target |tap
                  duplicate $ scene-ir/SceneNode :id |other :parent |root :key |batch :content instance-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  root-only $ scene-ir/SceneDocument :nodes $ [] root
                  full $ scene-ir/SceneDocument :nodes $ [] root batch
                  bad $ scene-ir/SceneDocument :nodes $ [] root batch duplicate
                  easing $ motion/Easing :linear
                  initial $ start-presence root-only
                  result $ loop
                      model initial
                      iteration 0
                      time 0
                      released-total 0
                    if (= iteration 100) released-total $ let
                        enter $ reconcile-presence model full time 0.25 easing
                        exit $ reconcile-presence (:model enter) root-only (+ time 1) 0.25 easing
                        done $ settle-presence (:model exit) (+ time 2)
                        released $ count $ :released done
                      is= 1 released
                      is= 1 $ count $ :items (:model done)
                      recur (:model done) (+ iteration 1) (+ time 3) (+ released-total released)
                is= 100 result
                is-throws $ reconcile-presence initial bad 0 1 easing
                is-throws $ reconcile-presence initial full (/ 0 0) 1 easing
                is-throws $ reconcile-presence initial full 0 -1 easing
              :tags $ #{} :presence :unit
        'resource-ref-present? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn resource-ref-present? (refs key)
            if (empty? refs) false $ if
              = key $ :key $ first-resource-ref refs
              , true $ recur (rest refs) key
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] (:: 'List 'quamolit.presence/InstanceResourceRef) 'String
        'retain-item $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn retain-item (item entry)
            PresenceItem :entry entry :phase (:phase item) :alpha $ :alpha item
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceItem)
            :args $ [] 'quamolit.presence/PresenceItem 'quamolit.scene-diff/SceneEntry
        'revive-item $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn revive-item (item entry time duration easing)
            PresenceItem :entry entry :phase (PresencePhase :enter) :alpha $ alpha-tween (alpha-at item time) 1 time duration easing
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceItem)
            :args $ [] 'quamolit.presence/PresenceItem 'quamolit.scene-diff/SceneEntry 'Number 'Number 'quamolit.motion/Easing
        'sample-item $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-item (item time)
            let
                node $ :node $ :entry item
                interactive $ if
                  = (:phase item) (PresencePhase :exit)
                  , false $ match (:interaction node)
                    (:none) false
                    (:target target) true
              PresenceSample :entry (:entry item) :alpha (alpha-at item time) :interactive interactive
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceSample)
            :args $ [] 'quamolit.presence/PresenceItem 'Number
        'sample-prefix $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-prefix (items samples time)
            if (empty? items) samples $ recur (rest items)
              append samples $ sample-item (first-item items) time
              , time
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.presence/PresenceItem) (:: 'List 'quamolit.presence/PresenceSample) 'Number
            :return $ :: 'List 'quamolit.presence/PresenceSample
        'sample-presence $ %{} 'CodeEntry (:doc "|在任意有限时间纯采样展示顺序、局部 alpha 与退出禁交互标记。")
          :code $ quote $ defn sample-presence (model time)
            if
              not $ motion/finite-number? time
              raise |invalid-presence-time
              sample-prefix (:items model) (empty-samples) time
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.presence/PresenceModel 'Number
            :return $ :: 'List 'quamolit.presence/PresenceSample
        'settle-prefix $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn settle-prefix (remaining retained released time)
            if (empty? remaining)
              PresenceUpdate :model (PresenceModel :items retained) :released released
              let
                  item $ first-item remaining
                  phase $ :phase item
                if
                  and
                    = phase $ PresencePhase :exit
                    alpha-finished? item time
                  recur (rest remaining) retained
                    prepend released $ :entry item
                    , time
                  if
                    and
                      = phase $ PresencePhase :enter
                      alpha-finished? item time
                    recur (rest remaining)
                      append retained $ make-present $ :entry item
                      , released time
                    recur (rest remaining) (append retained item) released time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceUpdate)
            :args $ [] (:: 'List 'quamolit.presence/PresenceItem) (:: 'List 'quamolit.presence/PresenceItem) (:: 'List 'quamolit.scene-diff/SceneEntry) 'Number
        'settle-presence $ %{} 'CodeEntry (:doc "|在时间终点完成 enter/exit，移除退出项并按子先父后的顺序返回释放通知。")
          :code $ quote $ defn settle-presence (model time)
            if
              not $ motion/finite-number? time
              raise |invalid-presence-time
              settle-prefix (:items model) (empty-items) (empty-released) time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceUpdate)
            :args $ [] 'quamolit.presence/PresenceModel 'Number
          :tests $ [] $ %{} 'TestEntry (:name |terminal-frame-and-once-release)
            :code $ quote $ let
                matrix $ scene-ir/Matrix2D :a 1 :b 0 :c 0 :d 1 :e 0 :f 0
                group-content $ scene-ir/SceneContent :group $ scene-ir/GroupNode :transform matrix :clip (scene-ir/ClipSpec :none) :opacity 1
                root $ scene-ir/SceneNode :id |root :parent | :key |root :content group-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                full $ scene-ir/SceneDocument :nodes $ [] root
                empty-doc $ scene-ir/SceneDocument :nodes $ []
                started $ start-presence full
                exiting $ reconcile-presence started empty-doc 0 1 $ motion/Easing :linear
                finished $ settle-presence (:model exiting) 1
              is= true $ presence-needs-frame? (:model exiting) 0.5
              is= true $ presence-needs-frame? (:model exiting) 1
              is= false $ presence-needs-frame? (:model finished) 1
              is= 1 $ count $ :released finished
              is= 0 $ count $ :released
                settle-presence (:model finished) 2
            :tags $ #{} :presence :unit
        'start-presence $ %{} 'CodeEntry (:doc "|从已验证 Scene 建立全部为 present 的初始逻辑实例。")
          :code $ quote $ defn start-presence (document)
            PresenceModel :items $ initialize-items (scene-diff/index-scene document) (empty-items)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceModel)
            :args $ [] 'quamolit.scene-ir/SceneDocument
        'total-ref-count $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn total-ref-count (acc ref)
            + acc $ :count ref
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number 'quamolit.presence/InstanceResourceRef
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.presence
          :require (quamolit.scene-diff :as scene-diff) (quamolit.scene-ir :as scene-ir) (quamolit.motion :as motion)
            calcit.test :refer $ is= is-throws
    'quamolit.presence-component $ %{} 'FileEntry
      :defs $ {}
        'animated-alpha? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn animated-alpha? (item)
            not= (:phase item) (presence/PresencePhase :present)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.presence/PresenceItem
        'declare-flat $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn declare-flat (model descriptors)
            let
                document $ scene/SceneDocument :nodes $ map (:items model) item-node
                motions $ concat descriptors $ map
                  filter (:items model) animated-alpha?
                  , item-motion
              scene/validate-scene document
              binding/validate-descriptors motions
              component/ComponentDeclaration :scene document :motions motions
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.component-sample/ComponentDeclaration)
            :args $ [] 'quamolit.presence/PresenceModel $ :: 'List 'quamolit.motion/ScalarDescriptor
        'item-id $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn item-id (item)
            let
                node $ :node $ :entry item
                kind $ scene/content-kind $ :content node
              str |presence/ kind |/ $ :key node
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'String)
            :args $ [] 'quamolit.presence/PresenceItem
        'item-motion $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn item-motion (item)
            let
                alpha $ leaf-alpha $ :content
                  :node $ :entry item
                tween $ :alpha item
              motion/ScalarDescriptor :id (item-id item) :version 0 :motion $ motion/ScalarMotion :tween $ struct-with tween
                :from $ * alpha $ :from tween
                :to $ * alpha $ :to tween
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/ScalarDescriptor)
            :args $ [] 'quamolit.presence/PresenceItem
        'item-node $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn item-node (item)
            let
                node $ :node $ :entry item
                id $ item-id item
              assert |presence-requires-flat-leaf $ empty? $ :parent node
              leaf-alpha $ :content node
              assert |presence-alpha-binding-conflict $ every? (:bindings node)
                fn (entry)
                  not= (:target entry) (scene/ScalarTarget :alpha)
              struct-with node (:id id) (:key id)
                :bindings $ if (animated-alpha? item)
                  conj (:bindings node)
                    scene/ScalarBinding :target (scene/ScalarTarget :alpha) :motion-id id :version 0
                  :bindings node
                :interaction $ match (:phase item)
                  (:exit) (scene/SceneInteraction :none)
                  _ $ :interaction node
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneNode)
            :args $ [] 'quamolit.presence/PresenceItem
        'leaf-alpha $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn leaf-alpha (content)
            match content
              (:rect rect)
                :a $ :fill rect
              (:polyline path)
                :a $ :stroke path
              (:text text)
                :a $ :fill text
              _ $ raise |presence-requires-flat-leaf
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.scene-ir/SceneContent
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.presence-component
          :require (quamolit.presence :as presence) (quamolit.scene-ir :as scene) (quamolit.motion :as motion) (quamolit.component-sample :as component) (quamolit.scene-binding :as binding)
    'quamolit.render.element $ %{} 'FileEntry
      :defs $ {}
        'alpha $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp alpha (props & children)
            {} $ :tree $ group ({})
              native-save $ {}
              native-alpha $ merge (&{} :opacity 0.01) props
              , & children
                native-restore $ {}
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] $ :: 'Map 'Tag 'Dynamic
        'button $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp button (style) (; js/console.log |button style)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
            :features $ #{} :js-ffi
        'input $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp input (style)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
        'rotate $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp rotate (props & children)
            let
                angle $ * pi-ratio $ either (&map:get props :angle) 30
              group ({})
                native-save $ {}
                native-rotate $ &{} :angle angle
                , & children $ native-restore $ {}
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] $ :: 'Map 'Tag 'Dynamic
        'scale $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp scale (props & children)
            group ({})
              native-save $ {}
              native-scale $ merge (&{} :ratio 1) props
              , & children $ native-restore $ {}
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] $ :: 'Map 'Tag 'Dynamic
        'textbox $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp textbox (states props)
            let
                cursor $ :cursor states
                state $ assert-type
                    get states :data
                    , .unwrap-or $ {} $ :text
                        get props :text
                        , .unwrap-or |
                  :: 'Map 'Tag 'Dynamic
                text $ assert-type
                    get state :text
                    , .unwrap-or |
                  , 'String
              [] nil $ input $ assoc props :text text :event
                &{} :keydown $ fn (event d!)
                  let
                      next-text $ case-default (.-keyCode event)
                        str text $ keycode->key (.-keyCode event) (.-shiftKey event)
                        32 $ str text "| "
                        8 $ if
                          <= (count text) 1
                          , | $ slice text 0
                            dec $ count text
                    d! cursor $ assoc state :text next-text
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] (:: 'Map 'Tag 'Dynamic) (:: 'Map 'Tag 'Dynamic)
        'translate $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defcomp translate (props & children)
            group ({})
              native-save $ {}
              native-translate $ merge (&{} :x 0 :y 0) props
              , & children $ native-restore $ {}
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'Dynamic)
            :args $ [] $ :: 'Map 'Tag 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.render.element
          :require
            quamolit.util.string :refer $ hsl
            quamolit.alias :refer $ defcomp native-translate native-alpha native-save native-restore native-rotate native-scale group rect text arrange-children
            quamolit.util.keyboard :refer $ keycode->key
            quamolit.math :refer $ pi-ratio
    'quamolit.render.paint $ %{} 'FileEntry
      :defs $ {}
        '*image-pool $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *image-pool ({})
          :examples $ []
          :schema $ :: 'Dynamic
        'get-image $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn get-image (src)
            if (&map:contains? @*image-pool src) (&map:get @*image-pool src)
              let
                  image $ image-create
                image-src! image src
                swap! *image-pool assoc src image
                , image
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
            :features $ #{} :js-ffi
        'paint $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint (ctx tree coord dispatch! elapsed tick?) (; js/console.log |paint tree) (paint-tree-with ctx tree coord dispatch! elapsed tick? paint-one)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic (:: 'List 'Dynamic) 'Dynamic 'Number 'Bool
            :features $ #{} :js-ffi
        'paint-alpha $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-alpha (ctx style)
            let
                base-alpha $ &map:get @*tracked-transform :alpha
                opacity $ * base-alpha $ bound-opacity (&map:get style :opacity)
              set! (.-globalAlpha ctx) opacity
              swap! *tracked-transform assoc :alpha opacity
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'paint-arc $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-arc (ctx style coord event)
            let
                x $ either (&map:get style :x) 0
                y $ either (&map:get style :y) 0
                r $ either (&map:get style :r) 40
                s-angle $ * pi-ratio $ either (&map:get style :s-angle) 0
                e-angle $ * pi-ratio $ either (&map:get style :e-angle) 300
                line-width $ either (&map:get style :line-width) 4
                counterclockwise $ either (&map:get style :counterclockwise) false
                line-cap $ either (&map:get style :line-cap) |round
                miter-limit $ either (&map:get style :miter-limit) 8
              .!beginPath ctx
              .!arc ctx x y r s-angle e-angle counterclockwise
              when (some? event)
                reset! *touch-event-areas $ prepend
                  {} (:kind :arc) (:r r)
                    :transform $ &map:get @*tracked-transform :transform
                    :offset $ &map:get @*tracked-transform :offset
                    :coord coord
                    :position $ [] x y
                  , @*touch-event-areas
              when (&map:contains? style :fill-style)
                set! (.-fillStyle ctx) (&map:get style :fill-style)
                .!fill ctx
              when (&map:contains? style :stroke-style)
                set! (.-lineWidth ctx) line-width
                set! (.-strokeStyle ctx) (&map:get style :stroke-style)
                set! (.-lineCap ctx) line-cap
                set! (.-miterLimit ctx) miter-limit
                .!stroke ctx
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'paint-image $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-image (ctx style coord)
            let
                sx $ or (:sx style) 0
                sy $ or (:sy style) 0
                sw $ or (:sw style) 40
                sh $ or (:sh style) 40
                dx $ or (:dx style) 0
                dy $ or (:dy style) 0
                dw $ or (:dw style) 40
                dh $ or (:dh style) 40
                image $ get-image $ :src style
              .!drawImage ctx image sx sy sw sh dx dy dw dh
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'paint-line $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-line (ctx style)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'paint-one $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-one (ctx directive coord)
            let
                op $ :name directive
                style $ :style directive
                event $ :event directive
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
                true $ do $ js/console.log "|painting not implemented" directive
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'quamolit.types/Shape $ :: 'List 'Dynamic
            :features $ #{} :js-ffi
        'paint-path $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-path (ctx style)
            let
                points $ &map:get style :points
                first-point $ &list:first points
              .!beginPath ctx
              .!moveTo ctx (&list:first first-point) (&list:last first-point)
              &doseq
                coords $ rest points
                case-default (count coords) (raise |not-supported-coords)
                  2 $ .!lineTo ctx (nth coords 0) (nth coords 1)
                  4 $ .!quadraticCurveTo ctx (nth coords 0) (nth coords 1) (nth coords 2) (nth coords 3)
                  6 $ .!bezierCurveTo ctx (nth coords 0) (nth coords 1) (nth coords 2) (nth coords 3) (nth coords 4) (nth coords 5)
              when (&map:contains? style :stroke-style)
                set! (.-lineWidth ctx)
                  either (&map:get style :line-width) 4
                set! (.-strokeStyle ctx) (&map:get style :stroke-style)
                set! (.-lineCap ctx)
                  either (&map:get style :line-cap) |round
                set! (.-lineJoin ctx)
                  either (&map:get style :line-join) |round
                set! (.-milterLimit ctx)
                  either (&map:get style :milter-limit) 8
                .!stroke ctx
              when (&map:contains? style :fill-style)
                set! (.-fillStyle ctx) (&map:get style :fill-style)
                .!closePath ctx
                .!fill ctx
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'paint-rect $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-rect (ctx style coord event)
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
                reset! *touch-event-areas $ prepend @*touch-event-areas $ {} (:kind :rect)
                  :half-w $ &* 0.5 w
                  :half-h $ &* 0.5 h
                  :transform $ :transform @*tracked-transform
                  :offset $ :offset @*tracked-transform
                  :coord coord
                  :position $ []
                    &+ x $ &* 0.5 w
                    &+ y $ &* 0.5 h
              when (&map:contains? style :fill-style)
                set! (.-fillStyle ctx) (&map:get style :fill-style)
                .!fill ctx
              when (&map:contains? style :stroke-style)
                set! (.-strokeStyle ctx) (&map:get style :stroke-style)
                set! (.-lineWidth ctx) line-width
                .!stroke ctx
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'paint-restore $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-restore (ctx style) (.!restore ctx)
            if (empty? @*transforms-memory) (js/console.warn |nothing-to-restore)
              do
                reset! *tracked-transform $
                  last @*transforms-memory
                  , .unwrap-or $ {}
                swap! *transforms-memory butlast
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'paint-rotate $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-rotate (ctx style)
            let
                angle $ or (:angle style) 30
                radius $ / (* angle js/Math 2) 180
              .!rotate ctx angle
              swap! *tracked-transform update :transform $ fn (point)
                point-times point $ [] (js/Math.cos radius)
                  negate $ js/Math.cos radius
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'paint-save $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-save (ctx style) (.!save ctx) (swap! *transforms-memory conj @*tracked-transform)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'paint-scale $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-scale (ctx style)
            let
                ratio $ or (:ratio style) 1.2
              .!scale ctx ratio ratio
              swap! *tracked-transform update :transform $ fn (point)
                point-times point $ [] ratio 0
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'paint-text $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-text (ctx style)
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
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'paint-translate $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-translate (ctx style)
            let
                x $ or (:x style) 0
                y $ or (:y style) 0
                transform $ :transform @*tracked-transform
                delta $ point-times transform $ [] x y
              .!translate ctx x y
              swap! *tracked-transform update :offset $ fn (point) (point-add point delta)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
        'paint-tree-only-with $ %{} 'CodeEntry
          :doc "|Paint a scene without invoking on-tick callbacks or advancing frame time."
          :code $ quote $ defn paint-tree-only-with (ctx tree coord paint-leaf)
            if (nil? tree) &unit $ if
              and (struct? tree) (&struct:matches? tree Component)
              let
                  component $ assert-type tree Component
                paint-tree-only-with ctx (:tree component)
                  conj coord $ :name component
                  , paint-leaf
              let
                  shape $ assert-type tree Shape
                paint-leaf ctx shape coord
                &doseq
                  cursor $ :children shape
                  paint-tree-only-with ctx
                    (last cursor) .unwrap-or nil
                    append coord $
                      first cursor
                      , .unwrap-or nil
                    , paint-leaf
                , &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'Dynamic 'Dynamic (:: 'List 'Dynamic) 'Dynamic
          :tests $ [] $ %{} 'TestEntry (:name |paint-does-not-tick)
            :code $ quote $ let
                ticked $ atom 0
                painted $ atom 0
                shape $ %{} Shape (:name :rect)
                  :style $ {}
                  :event nil
                  :children $ []
                component $ %{} Component (:name :probe) (:tree shape)
                  :on-tick $ fn (elapsed dispatch!) (swap! ticked inc)
                leaf $ fn (ctx shape coord) (swap! painted inc)
              paint-tree-only-with nil component ([]) leaf
              is= 0 @ticked
              is= 1 @painted
              tick-tree component
                fn (op data) &unit
                , 0.25
              is= 1 @ticked
              is= 1 @painted
              paint-tree-only-with nil component ([]) leaf
              is= 1 @ticked
              is= 2 @painted
            :tags $ #{} :frame-clock :unit
        'paint-tree-with $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn paint-tree-with (ctx tree coord dispatch! elapsed tick? paint-leaf)
            do
              when tick? $ tick-tree tree dispatch! elapsed
              paint-tree-only-with ctx tree coord paint-leaf
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic (:: 'List 'Dynamic) 'Dynamic 'Number 'Bool 'Dynamic
          :tests $ [] $ %{} 'TestEntry (:name |tick-versus-redraw)
            :code $ quote $ let
                seen $ atom 0
                component $ %{} Component (:name :sample) (:tree nil)
                  :on-tick $ fn (elapsed dispatch!)
                    reset! seen $ + @seen elapsed
              paint-tree-with nil component ([])
                fn (op data) &unit
                , 0.25 true $ fn (ctx shape coord) &unit
              is= 0.25 @seen
              paint-tree-with nil component ([])
                fn (op data) &unit
                , 0 false $ fn (ctx shape coord) &unit
              is= 0.25 @seen
            :tags $ #{} :frame-clock :unit
        'pi-ratio $ %{} 'CodeEntry (:doc |)
          :code $ quote $ def pi-ratio 0.017453292519943295
          :examples $ []
          :schema $ :: 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.render.paint
          :require
            quamolit.util.string :refer $ hsl
            quamolit.types :refer $ Component Shape
            quamolit.util.string :refer $ gen-id!
            quamolit.math :refer $ bound-opacity point-times point-add
            quamolit.global :refer $ *transforms-memory *tracked-transform *touch-event-areas
            js-ffi.browser :refer $ image-create image-src!
            calcit.test :refer $ is=
            quamolit.frame-eval :refer $ tick-tree
    'quamolit.replay-archive $ %{} 'FileEntry
      :defs $ {}
        'ReplayArchive $ %{} 'CodeEntry (:doc "|完整 tick 输入日志与有界最近检查点的不可变 CPU 回放档案；原点永久保留。")
          :code $ quote $ defstruct ReplayArchive ([] 'S 'I)
            :origin $ :: 'quamolit.fixed-step/SimulationState 'S
            :latest $ :: 'quamolit.fixed-step/SimulationState 'S
            :inputs $ :: 'Map 'Number 'I
            :checkpoints $ :: 'List $ :: 'quamolit.fixed-step/SimulationState 'S
            :stride 'Number
            :max-checkpoints 'Number
          :examples $ []
          :schema $ :: 'StructDef
        'nearest-checkpoint $ %{} 'CodeEntry (:doc "|内部按目标 tick 选择最近的不晚于目标的检查点；找不到则使用原点。")
          :code $ quote $ defn nearest-checkpoint (checkpoints target best)
            if (empty? checkpoints) best $ let
                candidate $ assert-type
                  -> (first checkpoints) .unwrap
                  :: 'quamolit.fixed-step/SimulationState 'S
                next-best $ if
                  <= (:tick candidate) target
                  , candidate best
              recur (rest checkpoints) target next-best
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
              :: 'List $ :: 'quamolit.fixed-step/SimulationState 'S
              , 'Number $ :: 'quamolit.fixed-step/SimulationState 'S
            :generics $ [] 'S
            :return $ :: 'quamolit.fixed-step/SimulationState 'S
        'record-input $ %{} 'CodeEntry (:doc "|顺序记录下一 tick 的输入并生成新档案；只保留最近的额外检查点。")
          :code $ quote $ defn record-input (archive input update-state)
            let
                next-tick $ + 1 $ :tick (:latest archive)
                next-state $ fixed/step-simulation (:latest archive) next-tick input update-state
                next-inputs $ assoc (:inputs archive) next-tick input
                checkpoints $ if
                  = next-tick $ * (:stride archive)
                    floor $ / next-tick $ :stride archive
                  conj (:checkpoints archive) next-state
                  :checkpoints archive
                retained $ if
                  > (count checkpoints) (:max-checkpoints archive)
                  rest checkpoints
                  , checkpoints
              ReplayArchive :origin (:origin archive) :latest next-state :inputs next-inputs :checkpoints retained :stride (:stride archive) :max-checkpoints $ :max-checkpoints archive
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.replay-archive/ReplayArchive 'S 'I) 'I $ :: 'Fn
              {} (:return 'S)
                :args $ [] 'S 'I 'Number 'Number
            :generics $ [] 'S 'I
            :return $ :: 'quamolit.replay-archive/ReplayArchive 'S 'I
          :tests $ [] $ %{} 'TestEntry (:name |zero-checkpoint-capacity)
            :code $ quote $ let
                base-archive $ assert-type
                  start-archive (fixed/start-simulation 0.25 7 0) 2 0
                  :: 'quamolit.replay-archive/ReplayArchive 'Number 'Number
                step-one $ record-input base-archive 2 quamolit.test.replay-archive-fixture/update-state
                step-two $ record-input step-one 4 quamolit.test.replay-archive-fixture/update-state
                reset-state $ reset-archive step-two
                after-reset $ record-input reset-state 2 quamolit.test.replay-archive-fixture/update-state
              is= 0 $ count $ :checkpoints step-two
              is= 2 $ count $ :inputs step-two
              is= 1.5 $ :state $ sample-archive-at step-two 2 2 quamolit.test.replay-archive-fixture/update-state
              is-throws $ sample-archive-at step-two 2 1 quamolit.test.replay-archive-fixture/update-state
              is= 0 $ count $ :inputs reset-state
              is= 0.5 $ :state $ :latest after-reset
              is= 1 $ :tick $ :latest after-reset
            :tags $ #{} :replay-archive :unit
        'reset-archive $ %{} 'CodeEntry (:doc "|清空输入与额外检查点，保留原点和策略以重新开始。")
          :code $ quote $ defn reset-archive (archive)
            ReplayArchive :origin (:origin archive) :latest (:origin archive) :inputs ({}) :checkpoints ([]) :stride (:stride archive) :max-checkpoints $ :max-checkpoints archive
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] $ :: 'quamolit.replay-archive/ReplayArchive 'S 'I
            :generics $ [] 'S 'I
            :return $ :: 'quamolit.replay-archive/ReplayArchive 'S 'I
        'sample-archive-at $ %{} 'CodeEntry (:doc "|从最近保留检查点或原点按完整日志重放目标 tick；预算不足明确失败。")
          :code $ quote $ defn sample-archive-at (archive target-tick max-steps update-state)
            assert |invalid-archive-target $ and (motion/finite-number? target-tick) (>= target-tick 0)
              = target-tick $ floor target-tick
            assert |archive-target-not-recorded $ <= target-tick $ :tick (:latest archive)
            let
                checkpoint $ nearest-checkpoint (:checkpoints archive) target-tick $ :origin archive
              fixed/advance-simulation checkpoint target-tick (:inputs archive) max-steps update-state
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.replay-archive/ReplayArchive 'S 'I) 'Number 'Number $ :: 'Fn
              {} (:return 'S)
                :args $ [] 'S 'I 'Number 'Number
            :generics $ [] 'S 'I
            :return $ :: 'quamolit.fixed-step/SimulationState 'S
          :tests $ [] $ %{} 'TestEntry (:name |bounded-checkpoint-replay)
            :code $ quote $ let
                saved $ quamolit.test.replay-archive-fixture/make-archive
                reset-state $ reset-archive saved
                direct-two $ fixed/advance-simulation (:origin saved) 2 (:inputs saved) 2 quamolit.test.replay-archive-fixture/update-state
              is= 6 $ count $ :inputs saved
              is= 2 $ count $ :checkpoints saved
              is= 2 $ :state $ sample-archive-at saved 6 0 quamolit.test.replay-archive-fixture/update-state
              is= 0 $ :state $ sample-archive-at saved 0 0 quamolit.test.replay-archive-fixture/update-state
              is= 1.5 $ :state $ sample-archive-at saved 2 2 quamolit.test.replay-archive-fixture/update-state
              is= direct-two $ sample-archive-at saved 2 2 quamolit.test.replay-archive-fixture/update-state
              is= 1 $ :state $ sample-archive-at saved 4 0 quamolit.test.replay-archive-fixture/update-state
              is= 2.5 $ :state $ sample-archive-at saved 5 1 quamolit.test.replay-archive-fixture/update-state
              is-throws $ sample-archive-at saved 2 1 quamolit.test.replay-archive-fixture/update-state
              is-throws $ sample-archive-at saved 7 7 quamolit.test.replay-archive-fixture/update-state
              is-throws $ sample-archive-at saved -1 7 quamolit.test.replay-archive-fixture/update-state
              is-throws $ sample-archive-at saved (sqrt -1) 7 quamolit.test.replay-archive-fixture/update-state
              is= 0 $ count $ :inputs reset-state
              is= 0 $ count $ :checkpoints reset-state
              is= 0 $ :tick $ :latest reset-state
            :tags $ #{} :replay-archive :unit
        'start-archive $ %{} 'CodeEntry (:doc "|从 tick 0 检查点创建档案；检查点间隔为正整数，容量可为零。")
          :code $ quote $ defn start-archive (origin stride max-checkpoints)
            assert |invalid-archive-origin $ fixed/valid-simulation-state? origin
            assert |archive-origin-must-be-zero $ = 0 $ :tick origin
            assert |invalid-archive-stride $ and (motion/finite-number? stride) (> stride 0)
              = stride $ floor stride
            assert |invalid-archive-capacity $ and (motion/finite-number? max-checkpoints) (>= max-checkpoints 0)
              = max-checkpoints $ floor max-checkpoints
            ReplayArchive :origin origin :latest origin :inputs ({}) :checkpoints ([]) :stride stride :max-checkpoints max-checkpoints
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.fixed-step/SimulationState 'S) 'Number 'Number
            :generics $ [] 'S 'I
            :return $ :: 'quamolit.replay-archive/ReplayArchive 'S 'I
          :tests $ [] $ %{} 'TestEntry (:name |reject-invalid-policy)
            :code $ quote $ let
                origin $ fixed/start-simulation 0.25 7 0
                shifted $ fixed/SimulationState :tick 1 :dt 0.25 :seed 7 :state 0
              is-throws $ start-archive shifted 2 2
              is-throws $ start-archive origin 0 2
              is-throws $ start-archive origin 1.5 2
              is-throws $ start-archive origin (sqrt -1) 2
              is-throws $ start-archive origin 2 -1
              is-throws $ start-archive origin 2 1.5
              is-throws $ start-archive origin 2 $ / 1 0
            :tags $ #{} :replay-archive :unit
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.replay-archive
          :require (quamolit.fixed-step :as fixed) (quamolit.motion :as motion)
            calcit.test :refer $ is= is-throws
    'quamolit.retained-component $ %{} 'FileEntry
      :defs $ {}
        'BoundScalar $ %{} 'CodeEntry (:doc "|构建时解析的标量绑定：节点索引、目标与描述符，不含宿主句柄。")
          :code $ quote $ defstruct BoundScalar (:index 'Number) (:target 'quamolit.scene-ir/ScalarTarget) (:descriptor 'quamolit.motion/ScalarDescriptor)
          :examples $ []
          :schema $ :: 'StructDef
        'ComponentPlan $ %{} 'CodeEntry
          :doc "|不可变组件保留计划；静态节点共享，更新返回新计划。计数为逻辑操作次数，不代表内存字节或 GPU 性能。"
          :code $ quote $ defstruct ComponentPlan (:id 'String) (:time 'Number) (:versions 'quamolit.direct-frame/FrameVersions) (:scene 'quamolit.scene-ir/SceneDocument)
            :slots $ :: 'List 'quamolit.retained-component/BoundScalar
            :declarations 'Number
            :plan-builds 'Number
            :binding-samples 'Number
            :node-writes 'Number
            :skipped-updates 'Number
            :transforms $ :: 'List 'quamolit.scene-ir/Matrix2D
            :transform-sampler 'quamolit.retained-component/TransformSampler
            :transform-samples 'Number
          :examples $ []
          :schema $ :: 'StructDef
        'ExecutionDeclaration $ %{} 'CodeEntry (:doc "|统一组件执行声明：纯 Scene/Motion 描述 + 可选 CPU 变换提供者。")
          :code $ quote $ defstruct ExecutionDeclaration (:component 'quamolit.component-sample/ComponentDeclaration) (:transforms 'quamolit.retained-component/TransformSampler)
          :examples $ []
          :schema $ :: 'StructDef
        'TransformSampler $ %{} 'CodeEntry
          :doc "|执行层 CPU 变换采样器，按 Scene 节点顺序返回矩阵；闭包不进入 Scene/Motion IR，不承诺自动 WGSL。"
          :code $ quote $ defenum TransformSampler (:none)
            :cpu $ :: 'Fn $ {}
              :args $ [] 'Number
              :return $ :: 'List 'quamolit.scene-ir/Matrix2D
          :examples $ []
          :schema $ :: 'EnumDef
        'build-component-plan $ %{} 'CodeEntry
          :doc "|声明并验证一次组件，解析 Motion 引用，直接生成首个指定时间帧；所有业务处理在 Calcit。"
          :code $ quote $ defn build-component-plan (request declare)
            assert |invalid-component-request $ direct/valid-direct-request? $ component/to-direct-request request
            let
                declaration $ declare (:props request) (:model request) (:input request) (:resources request) (:viewport request)
                document $ :scene declaration
                descriptors $ :motions declaration
              assert |invalid-component-scene $ scene/validate-scene document
              assert |invalid-component-motions $ binding/validate-descriptors descriptors
              let
                  slots $ compile-slots (:nodes document) descriptors 0 $ empty-slots
                  nodes $ evaluate-slots slots (:nodes document) (:time request)
                ComponentPlan :id (:id request) :time (:time request) :versions (:versions request) :scene (scene/SceneDocument :nodes nodes) :slots slots :declarations 1 :plan-builds 1 :binding-samples (count slots) :node-writes (count slots) :skipped-updates 0 :transforms (empty-transforms) :transform-sampler (TransformSampler :none) :transform-samples 0
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] (:: 'quamolit.component-sample/ComponentRequest 'P 'M 'I 'R 'V)
              :: 'Fn $ {} (:return 'quamolit.component-sample/ComponentDeclaration)
                :args $ [] 'P 'M 'I 'R 'V
            :generics $ [] 'P 'M 'I 'R 'V
        'build-execution-plan $ %{} 'CodeEntry
          :doc "|统一构建入口：声明一次并解析标量与变换；返回同一个 ComponentPlan，时间更新复用既有 sample-plan-at。"
          :code $ quote $ defn build-execution-plan (request declare)
            assert |invalid-component-request $ direct/valid-direct-request? $ component/to-direct-request request
            let
                declaration $ declare (:props request) (:model request) (:input request) (:resources request) (:viewport request)
                base $ build-component-plan request $ fn (props model input resources viewport) (:component declaration)
                sampler $ :transforms declaration
                transforms $ evaluate-transforms sampler
                  count $ :nodes $ :scene base
                  :time request
              struct-with base (:transform-sampler sampler) (:transforms transforms)
                :transform-samples $ if (transform-active? sampler) 1 0
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] (:: 'quamolit.component-sample/ComponentRequest 'P 'M 'I 'R 'V)
              :: 'Fn $ {}
                :return 'quamolit.retained-component/ExecutionDeclaration
                :args $ [] 'P 'M 'I 'R 'V
            :generics $ [] 'P 'M 'I 'R 'V
        'compile-slots $ %{} 'CodeEntry (:doc "|仅在组件重新声明时遍历节点并解析 Motion 引用；时间更新复用结果。")
          :code $ quote $ defn compile-slots (nodes descriptors index slots)
            if (empty? nodes) slots $ let
                node $ scene/first-node nodes
                next $ foldl (:bindings node) slots $ fn (acc item)
                  hint-fn $ {}
                    :args $ [] (:: 'List 'quamolit.retained-component/BoundScalar) 'quamolit.scene-ir/ScalarBinding
                    :return $ :: 'List 'quamolit.retained-component/BoundScalar
                  append acc $ BoundScalar :index index :target (:target item) :descriptor $ binding/find-descriptor descriptors (:motion-id item) (:version item)
              recur (rest nodes) descriptors (inc index) next
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.scene-ir/SceneNode) (:: 'List 'quamolit.motion/ScalarDescriptor) 'Number $ :: 'List 'quamolit.retained-component/BoundScalar
            :return $ :: 'List 'quamolit.retained-component/BoundScalar
        'draw-plan! $ %{} 'CodeEntry
          :doc "|统一 Canvas 提交：按 Scene 顺序绘制矩形与折线，先标量更新再局部仿射变换；不支持组/实例时绘制前拒绝。"
          :code $ quote $ defn draw-plan! (context plan)
            assert |unsupported-component-canvas-scene $ every?
              :nodes $ :scene plan
              , canvas/supported-flat-node?
            each
              range $ count $ :nodes (:scene plan)
              fn (index)
                let
                    node $ node-at
                      :nodes $ :scene plan
                      , index
                  context .save!
                  when
                    transform-active? $ :transform-sampler plan
                    let
                        m $ &list:nth (:transforms plan) index
                      context .transform! (:a m) (:b m) (:c m) (:d m) (:e m) (:f m)
                  canvas/draw-content! context $ :content node
                  context .restore!
            , &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.retained-component/ComponentPlan
            :features $ #{} :js-ffi
        'empty-slots $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-slots () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.retained-component/BoundScalar
        'empty-transforms $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-transforms () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.scene-ir/Matrix2D
        'evaluate-slots $ %{} 'CodeEntry (:doc "|只更新预编译绑定；持久列表保留其他节点。失败不会修改调用者持有的旧帧。")
          :code $ quote $ defn evaluate-slots (slots nodes time)
            foldl slots nodes $ fn (current slot)
              hint-fn $ {}
                :args $ [] (:: 'List 'quamolit.scene-ir/SceneNode) 'quamolit.retained-component/BoundScalar
                :return $ :: 'List 'quamolit.scene-ir/SceneNode
              let
                  node $ node-at current $ :index slot
                  value $ motion/sample-scalar (:descriptor slot) time
                  content $ binding/apply-scalar (:content node) (:target slot) value
                assert |invalid-retained-content $ scene/valid-content? content
                assoc current (:index slot)
                  struct-with node $ :content content
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.retained-component/BoundScalar) (:: 'List 'quamolit.scene-ir/SceneNode) 'Number
            :return $ :: 'List 'quamolit.scene-ir/SceneNode
        'evaluate-transforms $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn evaluate-transforms (sampler size time)
            match sampler
              (:none) (empty-transforms)
              (:cpu sample)
                let
                    result $ sample time
                  assert |invalid-component-transforms $ and
                    = size $ count result
                    every? result valid-transform?
                  , result
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.retained-component/TransformSampler 'Number 'Number
            :return $ :: 'List 'quamolit.scene-ir/Matrix2D
        'node-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn node-at (nodes index)
            -> (get nodes index) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneNode)
            :args $ [] (:: 'List 'quamolit.scene-ir/SceneNode) 'Number
        'sample-plan-at $ %{} 'CodeEntry
          :doc "|仅时间更新入口，支持乱序/重复/倒放；输入变更必须调用 update-component-plan 并提升相关版本。"
          :code $ quote $ defn sample-plan-at (plan time)
            assert |invalid-component-time $ motion/finite-number? time
            let
                same? $ = time $ :time plan
                added $ if same? 0 $ count (:slots plan)
                document $ if
                  or same? $ empty? $ :slots plan
                  :scene plan
                  scene/SceneDocument :nodes $ evaluate-slots (:slots plan)
                    :nodes $ :scene plan
                    , time
                transforms $ if same? (:transforms plan)
                  evaluate-transforms (:transform-sampler plan)
                    count $ :nodes document
                    , time
              struct-with plan (:time time) (:scene document)
                :binding-samples $ + (:binding-samples plan) added
                :node-writes $ + (:node-writes plan) added
                :skipped-updates $ + (:skipped-updates plan) (if same? 1 0)
                :transforms transforms
                :transform-samples $ + (:transform-samples plan)
                  if
                    and (not same?)
                      transform-active? $ :transform-sampler plan
                    , 1 0
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'Number
        'transform-active? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn transform-active? (sampler)
            match sampler
              (:none) false
              (:cpu sample) true
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.retained-component/TransformSampler
        'update-component-plan $ %{} 'CodeEntry
          :doc "|完整身份/版本不变时只采样绑定；任一版本或身份变更保守重声明。替换声明函数须提升 component 版本。"
          :code $ quote $ defn update-component-plan (previous request declare)
            assert |invalid-component-request $ direct/valid-direct-request? $ component/to-direct-request request
            if
              and
                = (:id previous) (:id request)
                = (:versions previous) (:versions request)
              sample-plan-at previous $ :time request
              let
                  next $ build-component-plan request declare
                struct-with next
                  :declarations $ inc $ :declarations previous
                  :plan-builds $ inc $ :plan-builds previous
                  :binding-samples $ + (:binding-samples previous) (:binding-samples next)
                  :node-writes $ + (:node-writes previous) (:node-writes next)
                  :skipped-updates $ :skipped-updates previous
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan (:: 'quamolit.component-sample/ComponentRequest 'P 'M 'I 'R 'V)
              :: 'Fn $ {} (:return 'quamolit.component-sample/ComponentDeclaration)
                :args $ [] 'P 'M 'I 'R 'V
            :generics $ [] 'P 'M 'I 'R 'V
        'update-execution-plan $ %{} 'CodeEntry
          :doc "|同身份/六类版本复用；任何依赖变化重声明标量和变换，失败不修改旧计划。替换声明或闭包需提升 component/motion 版本。"
          :code $ quote $ defn update-execution-plan (previous request declare)
            assert |invalid-component-request $ direct/valid-direct-request? $ component/to-direct-request request
            if
              and
                = (:id previous) (:id request)
                = (:versions previous) (:versions request)
              sample-plan-at previous $ :time request
              let
                  next $ build-execution-plan request declare
                struct-with next
                  :declarations $ inc $ :declarations previous
                  :plan-builds $ inc $ :plan-builds previous
                  :binding-samples $ + (:binding-samples previous) (:binding-samples next)
                  :node-writes $ + (:node-writes previous) (:node-writes next)
                  :skipped-updates $ :skipped-updates previous
                  :transform-samples $ + (:transform-samples previous) (:transform-samples next)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan (:: 'quamolit.component-sample/ComponentRequest 'P 'M 'I 'R 'V)
              :: 'Fn $ {}
                :return 'quamolit.retained-component/ExecutionDeclaration
                :args $ [] 'P 'M 'I 'R 'V
            :generics $ [] 'P 'M 'I 'R 'V
        'valid-transform? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn valid-transform? (m)
            every?
              [] (:a m) (:b m) (:c m) (:d m) (:e m) (:f m)
              , motion/finite-number?
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.scene-ir/Matrix2D
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.retained-component
          :require (quamolit.component-sample :as component) (quamolit.direct-frame :as direct) (quamolit.scene-ir :as scene) (quamolit.scene-binding :as binding) (quamolit.motion :as motion) (quamolit.canvas-reference :as canvas)
    'quamolit.retained-path $ %{} 'FileEntry
      :defs $ {}
        'PathPlan $ %{} 'CodeEntry
          :doc "|静态折线 Scene 与自定义 CPU 变换采样器的不可变计划。Scene 不保存闭包；运行计划可以。更换任何输入需重建。"
          :code $ quote $ defstruct PathPlan ([] 'P) (:scene 'quamolit.scene-ir/SceneDocument) (:props 'P)
            :sample $ :: 'Fn $ {}
              :args $ [] 'P 'Number
              :return $ :: 'List 'quamolit.scene-ir/Matrix2D
            :time 'Number
            :transforms $ :: 'List 'quamolit.scene-ir/Matrix2D
            :samples 'Number
            :skipped 'Number
          :examples $ []
          :schema $ :: 'StructDef
        'build-plan $ %{} 'CodeEntry
          :doc "|验证静态 Scene 并采样首帧，仅支持顶层、无绑定的折线；props 或采样器改变必须重新构建。"
          :code $ quote $ defn build-plan (document props time sample)
            assert |invalid-path-time $ motion/finite-number? time
            scene/validate-scene document
            assert |unsupported-retained-path-scene $ every? (:nodes document) path-node?
            let
                transforms $ sample props time
              assert |invalid-path-transforms $ and
                = (count transforms)
                  count $ :nodes document
                every? transforms valid-transform?
              PathPlan :scene document :props props :sample sample :time time :transforms transforms :samples 1 :skipped 0
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.scene-ir/SceneDocument 'P 'Number $ :: 'Fn
              {}
                :args $ [] 'P 'Number
                :return $ :: 'List 'quamolit.scene-ir/Matrix2D
            :generics $ [] 'P
            :return $ :: 'quamolit.retained-path/PathPlan 'P
        'draw-plan! $ %{} 'CodeEntry (:doc "|消费已验证计划，按原层序复合调用者变换并绘制；不负责清屏/DPR，不修改逻辑状态。")
          :code $ quote $ defn draw-plan! (context plan)
            each
              range $ count $ :transforms plan
              fn (index)
                let
                    node $ &list:nth
                      :nodes $ :scene plan
                      , index
                    m $ &list:nth (:transforms plan) index
                  context .save!
                  context .transform! (:a m) (:b m) (:c m) (:d m) (:e m) (:f m)
                  match (:content node)
                    (:polyline path) (canvas/draw-round-path! context path)
                    (:rect rect) (raise |unsupported-retained-path-scene)
                    (:group group) (raise |unsupported-retained-path-scene)
                    (:instances instances) (raise |unsupported-retained-path-scene)
                    (:text text) (raise |unsupported-retained-path-scene)
                  context .restore!
            , &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost $ :: 'quamolit.retained-path/PathPlan 'P
            :features $ #{} :js-ffi
            :generics $ [] 'P
        'path-node? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn path-node? (node)
            and
              empty? $ :parent node
              empty? $ :bindings node
              match (:content node)
                (:polyline path) true
                (:rect rect) false
                (:group group) false
                (:instances instances) false
                (:text text) false
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.scene-ir/SceneNode
        'sample-plan-at $ %{} 'CodeEntry
          :doc "|仅更新时间；同时间跳过，保留静态 Scene/props 身份。采样器必须是纯函数，不读取外部可变状态。"
          :code $ quote $ defn sample-plan-at (plan time)
            assert |invalid-path-time $ motion/finite-number? time
            if
              = time $ :time plan
              struct-with plan $ :skipped $ inc (:skipped plan)
              let
                  transforms $
                    :sample plan
                    :props plan
                    , time
                assert |invalid-path-transforms $ and
                  = (count transforms)
                    count $ :nodes $ :scene plan
                  every? transforms valid-transform?
                struct-with plan (:time time) (:transforms transforms)
                  :samples $ inc $ :samples plan
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.retained-path/PathPlan 'P) 'Number
            :generics $ [] 'P
            :return $ :: 'quamolit.retained-path/PathPlan 'P
        'valid-transform? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn valid-transform? (m)
            every?
              [] (:a m) (:b m) (:c m) (:d m) (:e m) (:f m)
              , motion/finite-number?
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.scene-ir/Matrix2D
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.retained-path
          :require (quamolit.scene-ir :as scene) (quamolit.motion :as motion) (quamolit.canvas-reference :as canvas)
    'quamolit.retained-scene $ %{} 'FileEntry
      :defs $ {}
        'append-changed-revisions $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn append-changed-revisions (remain lasts currents acc)
            if (empty? remain) acc $ let
                key $ -> (first remain) .unwrap
                prev $ -> (first lasts) .unwrap
                curr $ -> (first currents) .unwrap
              recur (rest remain) (rest lasts) (rest currents)
                if (= prev curr) acc $ append acc key
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'String) (:: 'List 'Number) (:: 'List 'Number) (:: 'List 'String)
            :return $ :: 'List 'String
        'revision-keys $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn revision-keys () ([] |model |input |resources |viewport |quality |motion)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'String
        'revision-reasons $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn revision-reasons (initial? time last-time last-values current-values)
            if initial? ([] |initial)
              let
                  base $ if (= time last-time) ([]) ([] |time)
                append-changed-revisions (revision-keys) last-values current-values base
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Bool 'Number 'Number (:: 'List 'Number) (:: 'List 'Number)
            :return $ :: 'List 'String
          :tests $ [] $ %{} 'TestEntry (:name |reasons-classification)
            :code $ quote $ let
                current $ [] 0 0 0 0 0 0
                next $ [] 0 2 0 0 0 0
              assert= ([] |initial)
                revision-reasons true 0 0 ([]) ([])
              assert= ([] |time) (revision-reasons false 1 0 current current)
              assert= ([] |input) (revision-reasons false 0.5 0.5 current next)
              assert= ([] |time |input) (revision-reasons false 1 0 current next)
            :tags $ #{} :retained-scene :unit
        'sampled-value-valid? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sampled-value-valid? (kind field value)
            and
              = 0 $ - value value
              if
                or (= field |width) (= field |height)
                >= value 0
                , true
              if (= kind |group)
                and (>= value 0) (<= value 1)
                , true
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'String 'String 'Number
          :tests $ [] $ %{} 'TestEntry (:name |value-validation-rules)
            :code $ quote $ do
              assert= true $ sampled-value-valid? |rect |x 3
              assert= false $ sampled-value-valid? |rect |width -1
              assert= false $ sampled-value-valid? |group |opacity 1.5
              assert= false $ sampled-value-valid? |rect |x $ sqrt -1
              assert= true $ sampled-value-valid? |group |opacity 0.5
            :tags $ #{} :retained-scene :unit
        'supported-target-field? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn supported-target-field? (kind field)
            if (= kind |rect)
              or (= field |x) (= field |y) (= field |width) (= field |height)
              if (= kind |group) (= field |opacity) false
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'String 'String
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.retained-scene
          :require $ quamolit.motion :as motion
    'quamolit.scene-binding $ %{} 'FileEntry
      :defs $ {}
        'apply-group-scalar $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn apply-group-scalar (group target value)
            match target
              (:opacity)
                scene-ir/GroupNode :transform (:transform group) :clip (:clip group) :opacity value
              _ $ raise |unsupported-group-binding
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/GroupNode)
            :args $ [] 'quamolit.scene-ir/GroupNode 'quamolit.scene-ir/ScalarTarget 'Number
        'apply-rect-scalar $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn apply-rect-scalar (rect target value)
            if
              match target
                (:opacity) true
                _ false
              raise |unsupported-rect-binding
              scene-ir/RectNode :x
                match target
                  (:x) value
                  _ $ :x rect
                , :y
                  match target
                    (:y) value
                    _ $ :y rect
                  , :width
                    match target
                      (:width) value
                      _ $ :width rect
                    , :height
                      match target
                        (:height) value
                        _ $ :height rect
                      , :fill $ match target
                        (:alpha)
                          struct-with (:fill rect) (:a value)
                        _ $ :fill rect
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/RectNode)
            :args $ [] 'quamolit.scene-ir/RectNode 'quamolit.scene-ir/ScalarTarget 'Number
        'apply-scalar $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn apply-scalar (content target value)
            match content
              (:group group)
                scene-ir/SceneContent :group $ apply-group-scalar group target value
              (:rect rect)
                scene-ir/SceneContent :rect $ apply-rect-scalar rect target value
              (:instances instance) (raise |unsupported-instance-binding)
              (:polyline path)
                match target
                  (:alpha)
                    scene-ir/SceneContent :polyline $ struct-with path $ :stroke
                      struct-with (:stroke path) (:a value)
                  _ $ raise |unsupported-polyline-binding
              (:text text)
                match target
                  (:alpha)
                    scene-ir/SceneContent :text $ struct-with text $ :fill
                      struct-with (:fill text) (:a value)
                  _ $ raise |unsupported-text-binding
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneContent)
            :args $ [] 'quamolit.scene-ir/SceneContent 'quamolit.scene-ir/ScalarTarget 'Number
        'descriptor-pair-in? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn descriptor-pair-in? (descriptors id version)
            if (empty? descriptors) false $ let
                descriptor $ first-descriptor descriptors
              if
                and
                  = id $ :id descriptor
                  = version $ :version descriptor
                , true $ recur (rest descriptors) id version
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] (:: 'List 'quamolit.motion/ScalarDescriptor) 'String 'Number
        'empty-descriptors $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-descriptors () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.motion/ScalarDescriptor
        'empty-nodes $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-nodes () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.scene-ir/SceneNode
        'find-descriptor $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn find-descriptor (descriptors id version)
            if (empty? descriptors) (raise |missing-motion-descriptor)
              let
                  descriptor $ first-descriptor descriptors
                if
                  and
                    = id $ :id descriptor
                    = version $ :version descriptor
                  , descriptor $ recur (rest descriptors) id version
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/ScalarDescriptor)
            :args $ [] (:: 'List 'quamolit.motion/ScalarDescriptor) 'String 'Number
        'first-binding $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn first-binding (bindings)
            -> (first bindings) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/ScalarBinding)
            :args $ [] $ :: 'List 'quamolit.scene-ir/ScalarBinding
        'first-descriptor $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn first-descriptor (descriptors)
            -> (first descriptors) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/ScalarDescriptor)
            :args $ [] $ :: 'List 'quamolit.motion/ScalarDescriptor
        'first-node $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn first-node (nodes)
            -> (first nodes) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneNode)
            :args $ [] $ :: 'List 'quamolit.scene-ir/SceneNode
        'resolve-bindings $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn resolve-bindings (bindings content descriptors time)
            if (empty? bindings) content $ let
                binding $ first-binding bindings
                descriptor $ find-descriptor descriptors (:motion-id binding) (:version binding)
                value $ motion/sample-scalar descriptor time
              recur (rest bindings)
                apply-scalar content (:target binding) value
                , descriptors time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneContent)
            :args $ [] (:: 'List 'quamolit.scene-ir/ScalarBinding) 'quamolit.scene-ir/SceneContent (:: 'List 'quamolit.motion/ScalarDescriptor) 'Number
        'resolve-node $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn resolve-node (node descriptors time)
            scene-ir/SceneNode :id (:id node) :parent (:parent node) :key (:key node) :content
              resolve-bindings (:bindings node) (:content node) descriptors time
              , :bindings (:bindings node) :interaction $ :interaction node
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneNode)
            :args $ [] 'quamolit.scene-ir/SceneNode (:: 'List 'quamolit.motion/ScalarDescriptor) 'Number
        'resolve-nodes-prefix $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn resolve-nodes-prefix (remaining resolved descriptors time)
            if (empty? remaining) resolved $ recur (rest remaining)
              append resolved $ resolve-node (first-node remaining) descriptors time
              , descriptors time
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.scene-ir/SceneNode) (:: 'List 'quamolit.scene-ir/SceneNode) (:: 'List 'quamolit.motion/ScalarDescriptor) 'Number
            :return $ :: 'List 'quamolit.scene-ir/SceneNode
        'resolve-scene $ %{} 'CodeEntry
          :doc "|按绝对时间解析 Scene 标量绑定并返回合法的新 SceneDocument；这是全量 CPU 正确性参考，不是保留式执行计划。"
          :code $ quote $ defn resolve-scene (document descriptors time)
            do (scene-ir/validate-scene document) (validate-descriptors descriptors)
              if
                not $ motion/finite-number? time
                raise |invalid-scene-sample-time
                let
                    resolved $ scene-ir/SceneDocument :nodes $ resolve-nodes-prefix (:nodes document) (empty-nodes) descriptors time
                  scene-ir/validate-scene resolved
                  , resolved
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'quamolit.scene-ir/SceneDocument (:: 'List 'quamolit.motion/ScalarDescriptor) 'Number
          :tests $ []
            %{} 'TestEntry (:name |absolute-time-and-preserved-bindings)
              :code $ quote $ let
                  matrix $ scene-ir/Matrix2D :a 1 :b 0 :c 0 :d 1 :e 0 :f 0
                  color $ motion/ColorRgba :r 1 :g 0 :b 0 :a 1
                  group-content $ scene-ir/SceneContent :group $ scene-ir/GroupNode :transform matrix :clip (scene-ir/ClipSpec :none) :opacity 1
                  rect-content $ scene-ir/SceneContent :rect $ scene-ir/RectNode :x 80 :y 42 :width 16 :height 16 :fill color
                  opacity-binding $ scene-ir/ScalarBinding :target (scene-ir/ScalarTarget :opacity) :motion-id |fade :version 2
                  x-binding $ scene-ir/ScalarBinding :target (scene-ir/ScalarTarget :x) :motion-id |slide :version 3
                  group $ scene-ir/SceneNode :id |root :parent | :key |root :content group-content :bindings ([] opacity-binding) :interaction $ scene-ir/SceneInteraction :none
                  rect $ scene-ir/SceneNode :id |badge :parent |root :key |badge :content rect-content :bindings ([] x-binding) :interaction $ scene-ir/SceneInteraction :none
                  document $ scene-ir/SceneDocument :nodes $ [] group rect
                  slide $ motion/ScalarDescriptor :id |slide :version 3 :motion $ motion/ScalarMotion :tween
                    motion/ScalarTween :start 0 :duration 1 :from 80 :to 120 :easing $ motion/Easing :linear
                  fade $ motion/ScalarDescriptor :id |fade :version 2 :motion $ motion/ScalarMotion :tween
                    motion/ScalarTween :start 0 :duration 1 :from 1 :to 0.5 :easing $ motion/Easing :linear
                  descriptors $ append
                    append (empty-descriptors) slide
                    , fade
                  middle $ resolve-scene document descriptors 0.5
                  end $ resolve-scene document descriptors 1
                  start $ resolve-scene document descriptors -1
                is= 100 $ match
                  :content $ first-node $ rest (:nodes middle)
                  (:rect value) (:x value)
                  _ -1
                is= 0.75 $ match
                  :content $ first-node $ :nodes middle
                  (:group value) (:opacity value)
                  _ -1
                is= 120 $ match
                  :content $ first-node $ rest (:nodes end)
                  (:rect value) (:x value)
                  _ -1
                is= 0.5 $ match
                  :content $ first-node $ :nodes end
                  (:group value) (:opacity value)
                  _ -1
                is= 80 $ match
                  :content $ first-node $ rest (:nodes start)
                  (:rect value) (:x value)
                  _ -1
                is= 1 $ match
                  :content $ first-node $ :nodes start
                  (:group value) (:opacity value)
                  _ -1
                is= true $ scene-ir/validate-scene middle
                is= true $ scene-ir/validate-scene $ resolve-scene document descriptors 0.5
                is= (:bindings rect)
                  :bindings $ first-node $ rest (:nodes middle)
              :tags $ #{} :scene-binding :unit
            %{} 'TestEntry (:name |rejects-invalid-registry-and-results)
              :code $ quote $ let
                  color $ motion/ColorRgba :r 1 :g 0 :b 0 :a 1
                  rect-content $ scene-ir/SceneContent :rect $ scene-ir/RectNode :x 0 :y 0 :width 16 :height 16 :fill color
                  x-binding $ scene-ir/ScalarBinding :target (scene-ir/ScalarTarget :x) :motion-id |slide :version 3
                  width-binding $ scene-ir/ScalarBinding :target (scene-ir/ScalarTarget :width) :motion-id |bad-width :version 1
                  x-node $ scene-ir/SceneNode :id |rect :parent | :key |rect :content rect-content :bindings ([] x-binding) :interaction $ scene-ir/SceneInteraction :none
                  width-node $ scene-ir/SceneNode :id |rect :parent | :key |rect :content rect-content :bindings ([] width-binding) :interaction $ scene-ir/SceneInteraction :none
                  document $ scene-ir/SceneDocument :nodes $ [] x-node
                  width-document $ scene-ir/SceneDocument :nodes $ [] width-node
                  slide $ motion/ScalarDescriptor :id |slide :version 3 :motion $ motion/ScalarMotion :constant 10
                  wrong-version $ motion/ScalarDescriptor :id |slide :version 2 :motion $ motion/ScalarMotion :constant 10
                  duplicate $ append
                    append (empty-descriptors) slide
                    , slide
                  width-motion $ motion/ScalarDescriptor :id |bad-width :version 1 :motion $ motion/ScalarMotion :constant -1
                  blank-id $ motion/ScalarDescriptor :id | :version 1 :motion $ motion/ScalarMotion :constant 1
                  fraction-version $ motion/ScalarDescriptor :id |slide :version 1.5 :motion $ motion/ScalarMotion :constant 1
                is-throws $ resolve-scene document (empty-descriptors) 0
                is-throws $ resolve-scene document
                  append (empty-descriptors) wrong-version
                  , 0
                is-throws $ resolve-scene document duplicate 0
                is-throws $ resolve-scene width-document
                  append (empty-descriptors) width-motion
                  , 0
                is-throws $ resolve-scene document
                  append (empty-descriptors) slide
                  / 0 0
                is-throws $ validate-descriptors $ append (empty-descriptors) blank-id
                is-throws $ validate-descriptors $ append (empty-descriptors) fraction-version
              :tags $ #{} :scene-binding :unit
        'validate-descriptors $ %{} 'CodeEntry (:doc "|拒绝空 ID、非有限或非整数版本及重复的 ID/version 对；不同版本可以同时存在。")
          :code $ quote $ defn validate-descriptors (descriptors)
            validate-descriptors-prefix descriptors $ empty-descriptors
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] $ :: 'List 'quamolit.motion/ScalarDescriptor
        'validate-descriptors-prefix $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn validate-descriptors-prefix (remaining earlier)
            if (empty? remaining) true $ let
                descriptor $ first-descriptor remaining
                version $ :version descriptor
              if
                and
                  not $ empty? $ :id descriptor
                  motion/finite-number? version
                  >= version 0
                  = version $ floor version
                  not $ descriptor-pair-in? earlier (:id descriptor) version
                recur (rest remaining) (append earlier descriptor)
                raise |invalid-or-duplicate-motion-descriptor
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] (:: 'List 'quamolit.motion/ScalarDescriptor) (:: 'List 'quamolit.motion/ScalarDescriptor)
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.scene-binding
          :require (quamolit.scene-ir :as scene-ir) (quamolit.motion :as motion)
            calcit.test :refer $ is= is-throws
    'quamolit.scene-diff $ %{} 'FileEntry
      :defs $ {}
        'DirtyFlags $ %{} 'CodeEntry
          :doc "|Independent reference flags; execution plan chooses actual work later."
          :code $ quote $ defstruct DirtyFlags (:reference 'Bool) (:order 'Bool) (:geometry 'Bool) (:resources 'Bool) (:properties 'Bool) (:bindings 'Bool) (:interaction 'Bool)
          :examples $ []
          :schema $ :: 'StructDef
        'GeometrySignature $ %{} 'CodeEntry
          :doc "|Closed geometry-only projection of supported Scene content."
          :code $ quote $ defenum GeometrySignature (:group 'quamolit.scene-ir/Matrix2D 'quamolit.scene-ir/ClipSpec) (:rect 'Number 'Number 'Number 'Number) (:instances 'Number 'Number)
            :polyline (:: 'List 'quamolit.motion/Vec2) 'Number
            :text 'Number 'Number 'Number 'String
          :examples $ []
          :schema $ :: 'EnumDef
        'IdentitySegment $ %{} 'CodeEntry
          :doc "|One stable path segment uses sibling key and content kind, never buffer slot or temporary node ID."
          :code $ quote $ defstruct IdentitySegment (:key 'String) (:kind 'String)
          :examples $ []
          :schema $ :: 'StructDef
        'PropertySignature $ %{} 'CodeEntry
          :doc "|Closed visual-property projection; separate from geometry and resource versions."
          :code $ quote $ defenum PropertySignature (:group 'Number) (:rect 'quamolit.motion/ColorRgba) (:instances 'quamolit.motion/ColorRgba) (:polyline 'quamolit.motion/ColorRgba) (:text 'quamolit.motion/ColorRgba)
          :examples $ []
          :schema $ :: 'EnumDef
        'ResourceSignature $ %{} 'CodeEntry
          :doc "|Versioned external instance source, or none for non-resource nodes."
          :code $ quote $ defenum ResourceSignature (:none) (:instances 'quamolit.scene-ir/InstanceSource)
          :examples $ []
          :schema $ :: 'EnumDef
        'SceneChange $ %{} 'CodeEntry
          :doc "|Add/remove or retained-node update; no host handle or mutable cache."
          :code $ quote $ defenum SceneChange (:added 'quamolit.scene-diff/SceneEntry) (:removed 'quamolit.scene-diff/SceneEntry) (:updated 'quamolit.scene-diff/SceneEntry 'quamolit.scene-diff/DirtyFlags)
          :examples $ []
          :schema $ :: 'EnumDef
        'SceneDelta $ %{} 'CodeEntry
          :doc "|Logical changes plus an independent animation-time invalidation bit."
          :code $ quote $ defstruct SceneDelta
            :changes $ :: 'List 'quamolit.scene-diff/SceneChange
            :time-changed 'Bool
          :examples $ []
          :schema $ :: 'StructDef
        'SceneEntry $ %{} 'CodeEntry
          :doc "|Indexed node with resolved logical path and sibling position."
          :code $ quote $ defstruct SceneEntry
            :path $ :: 'List 'quamolit.scene-diff/IdentitySegment
            :sibling-index 'Number
            :node 'quamolit.scene-ir/SceneNode
          :examples $ []
          :schema $ :: 'StructDef
        'any-dirty? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn any-dirty? (flags)
            or (:reference flags) (:order flags) (:geometry flags) (:resources flags) (:properties flags) (:bindings flags) (:interaction flags)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.scene-diff/DirtyFlags
        'collect-current $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn collect-current (remaining old-entries changes)
            if (empty? remaining) changes $ let
                entry $ first-entry remaining
                next-changes $ if
                  path-in? old-entries $ :path entry
                  let
                      old-entry $ entry-for-path old-entries $ :path entry
                      flags $ dirty-flags old-entry entry
                    if (any-dirty? flags)
                      append changes $ SceneChange :updated entry flags
                      , changes
                  append changes $ SceneChange :added entry
              recur (rest remaining) old-entries next-changes
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.scene-diff/SceneEntry) (:: 'List 'quamolit.scene-diff/SceneEntry) (:: 'List 'quamolit.scene-diff/SceneChange)
            :return $ :: 'List 'quamolit.scene-diff/SceneChange
        'collect-removed $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn collect-removed (remaining current-entries changes)
            if (empty? remaining) changes $ let
                entry $ first-entry remaining
                next-changes $ if
                  path-in? current-entries $ :path entry
                  , changes $ append changes (SceneChange :removed entry)
              recur (rest remaining) current-entries next-changes
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.scene-diff/SceneEntry) (:: 'List 'quamolit.scene-diff/SceneEntry) (:: 'List 'quamolit.scene-diff/SceneChange)
            :return $ :: 'List 'quamolit.scene-diff/SceneChange
        'count-siblings $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn count-siblings (entries parent-id seen)
            if (empty? entries) seen $ recur (rest entries) parent-id $ if
              = parent-id $ :parent $ :node (first-entry entries)
              + seen 1
              , seen
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] (:: 'List 'quamolit.scene-diff/SceneEntry) 'String 'Number
        'diff-scene $ %{} 'CodeEntry
          :doc "|Conservative O(n²) logical reference diff; time-only requests leave structural changes empty."
          :code $ quote $ defn diff-scene (previous current previous-time current-time)
            if
              not $ and (finite-number? previous-time) (finite-number? current-time)
              raise |invalid-scene-time
              let
                  old-entries $ index-scene previous
                  new-entries $ index-scene current
                  removed $ collect-removed old-entries new-entries $ empty-changes
                  changes $ collect-current new-entries old-entries removed
                SceneDelta :changes changes :time-changed $ not= previous-time current-time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-diff/SceneDelta)
            :args $ [] 'quamolit.scene-ir/SceneDocument 'quamolit.scene-ir/SceneDocument 'Number 'Number
          :tests $ []
            %{} 'TestEntry (:name |reorder-keeps-identity)
              :code $ quote $ let
                  matrix $ scene-ir/Matrix2D :a 1 :b 0 :c 0 :d 1 :e 0 :f 0
                  group-content $ scene-ir/SceneContent :group $ scene-ir/GroupNode :transform matrix :clip (scene-ir/ClipSpec :none) :opacity 1
                  color $ ColorRgba :r 1 :g 0 :b 0 :a 1
                  rect-content $ scene-ir/SceneContent :rect $ scene-ir/RectNode :x 10 :y 20 :width 16 :height 16 :fill color
                  root $ scene-ir/SceneNode :id |root :parent | :key |root :content group-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  a $ scene-ir/SceneNode :id |a :parent |root :key |a :content rect-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  b $ scene-ir/SceneNode :id |b :parent |root :key |b :content rect-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  before $ scene-ir/SceneDocument :nodes $ [] root a b
                  after $ scene-ir/SceneDocument :nodes $ [] root b a
                  delta $ diff-scene before after 0 1
                is= 2 $ count $ :changes delta
                is= true $ :time-changed delta
                is=
                  map (:changes delta)
                    fn (change)
                      match change
                        (:updated entry flags) (:order flags)
                        _ false
                  [] true true
              :tags $ #{} :scene-diff :unit
            %{} 'TestEntry (:name |classifications)
              :code $ quote $ let
                  matrix $ scene-ir/Matrix2D :a 1 :b 0 :c 0 :d 1 :e 0 :f 0
                  group-content $ scene-ir/SceneContent :group $ scene-ir/GroupNode :transform matrix :clip (scene-ir/ClipSpec :none) :opacity 1
                  red $ ColorRgba :r 1 :g 0 :b 0 :a 1
                  blue $ ColorRgba :r 0 :g 0 :b 1 :a 1
                  base-content $ scene-ir/SceneContent :rect $ scene-ir/RectNode :x 10 :y 20 :width 16 :height 16 :fill red
                  geo-content $ scene-ir/SceneContent :rect $ scene-ir/RectNode :x 11 :y 20 :width 16 :height 16 :fill red
                  prop-content $ scene-ir/SceneContent :rect $ scene-ir/RectNode :x 10 :y 20 :width 16 :height 16 :fill blue
                  instance-content $ scene-ir/SceneContent :instances $ scene-ir/InstanceNode :source (scene-ir/InstanceSource :id |points :version 1 :count 2) :width 2 :height 2 :fill red
                  version-content $ scene-ir/SceneContent :instances $ scene-ir/InstanceNode :source (scene-ir/InstanceSource :id |points :version 2 :count 2) :width 2 :height 2 :fill red
                  root $ scene-ir/SceneNode :id |root :parent | :key |root :content group-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  base $ scene-ir/SceneNode :id |a :parent |root :key |a :content base-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  geo $ scene-ir/SceneNode :id |a :parent |root :key |a :content geo-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  prop $ scene-ir/SceneNode :id |a :parent |root :key |a :content prop-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  binding $ scene-ir/ScalarBinding :target (scene-ir/ScalarTarget :x) :motion-id |motion :version 1
                  bound $ scene-ir/SceneNode :id |a :parent |root :key |a :content base-content :bindings ([] binding) :interaction $ scene-ir/SceneInteraction :none
                  new-id $ scene-ir/SceneNode :id |a2 :parent |root :key |a :content base-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  instance $ scene-ir/SceneNode :id |a :parent |root :key |a :content instance-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  version $ scene-ir/SceneNode :id |a :parent |root :key |a :content version-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  base-doc $ scene-ir/SceneDocument :nodes $ [] root base
                  geo-doc $ scene-ir/SceneDocument :nodes $ [] root geo
                  prop-doc $ scene-ir/SceneDocument :nodes $ [] root prop
                  bound-doc $ scene-ir/SceneDocument :nodes $ [] root bound
                  id-doc $ scene-ir/SceneDocument :nodes $ [] root new-id
                  instance-doc $ scene-ir/SceneDocument :nodes $ [] root instance
                  version-doc $ scene-ir/SceneDocument :nodes $ [] root version
                is= 0 $ count $ :changes (diff-scene base-doc base-doc 0 1)
                is= true $ :time-changed $ diff-scene base-doc base-doc 0 1
                is= ([] true)
                  map
                    :changes $ diff-scene base-doc geo-doc 0 0
                    fn (change)
                      match change
                        (:updated entry flags) (:geometry flags)
                        _ false
                is= ([] true)
                  map
                    :changes $ diff-scene base-doc prop-doc 0 0
                    fn (change)
                      match change
                        (:updated entry flags) (:properties flags)
                        _ false
                is= ([] true)
                  map
                    :changes $ diff-scene base-doc bound-doc 0 0
                    fn (change)
                      match change
                        (:updated entry flags) (:bindings flags)
                        _ false
                is= ([] true)
                  map
                    :changes $ diff-scene base-doc id-doc 0 0
                    fn (change)
                      match change
                        (:updated entry flags) (:reference flags)
                        _ false
                is= ([] true)
                  map
                    :changes $ diff-scene instance-doc version-doc 0 0
                    fn (change)
                      match change
                        (:updated entry flags) (:resources flags)
                        _ false
                is= ([] |removed |added)
                  map
                    :changes $ diff-scene base-doc instance-doc 0 0
                    fn (change)
                      match change
                        (:removed entry) |removed
                        (:added entry) |added
                        _ |wrong
                is-throws $ diff-scene base-doc base-doc 0 $ / 0 0
              :tags $ #{} :scene-diff :unit
            %{} 'TestEntry (:name |reparent-add-remove)
              :code $ quote $ let
                  matrix $ scene-ir/Matrix2D :a 1 :b 0 :c 0 :d 1 :e 0 :f 0
                  group-content $ scene-ir/SceneContent :group $ scene-ir/GroupNode :transform matrix :clip (scene-ir/ClipSpec :none) :opacity 1
                  color $ ColorRgba :r 1 :g 0 :b 0 :a 1
                  rect-content $ scene-ir/SceneContent :rect $ scene-ir/RectNode :x 0 :y 0 :width 2 :height 2 :fill color
                  root $ scene-ir/SceneNode :id |root :parent | :key |root :content group-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  p $ scene-ir/SceneNode :id |p :parent |root :key |p :content group-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  q $ scene-ir/SceneNode :id |q :parent |root :key |q :content group-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  old-child $ scene-ir/SceneNode :id |child :parent |p :key |item :content rect-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  new-child $ scene-ir/SceneNode :id |child :parent |q :key |item :content rect-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                  before $ scene-ir/SceneDocument :nodes $ [] root p old-child q
                  after $ scene-ir/SceneDocument :nodes $ [] root p q new-child
                  empty-doc $ scene-ir/SceneDocument :nodes $ [] root p q
                is= ([] |removed |added)
                  map
                    :changes $ diff-scene before after 0 0
                    fn (change)
                      match change
                        (:removed entry) |removed
                        (:added entry) |added
                        _ |updated
                is= ([] |removed)
                  map
                    :changes $ diff-scene before empty-doc 0 0
                    fn (change)
                      match change
                        (:removed entry) |removed
                        (:added entry) |added
                        _ |updated
                is= ([] |added)
                  map
                    :changes $ diff-scene empty-doc before 0 0
                    fn (change)
                      match change
                        (:removed entry) |removed
                        (:added entry) |added
                        _ |updated
              :tags $ #{} :scene-diff :unit
        'dirty-flags $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn dirty-flags (previous current)
            let
                old-node $ :node previous
                new-node $ :node current
                old-content $ :content old-node
                new-content $ :content new-node
              DirtyFlags :reference
                or
                  not= (:id old-node) (:id new-node)
                  not= (:parent old-node) (:parent new-node)
                , :order
                  not= (:sibling-index previous) (:sibling-index current)
                  , :geometry
                    not= (geometry-signature old-content) (geometry-signature new-content)
                    , :resources
                      not= (resource-signature old-content) (resource-signature new-content)
                      , :properties
                        not= (property-signature old-content) (property-signature new-content)
                        , :bindings
                          not= (:bindings old-node) (:bindings new-node)
                          , :interaction $ not= (:interaction old-node) (:interaction new-node)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-diff/DirtyFlags)
            :args $ [] 'quamolit.scene-diff/SceneEntry 'quamolit.scene-diff/SceneEntry
        'empty-changes $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-changes () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.scene-diff/SceneChange
        'empty-entries $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-entries () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.scene-diff/SceneEntry
        'empty-segments $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-segments () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.scene-diff/IdentitySegment
        'entry-for-path $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn entry-for-path (entries path)
            if (empty? entries) (raise |missing-scene-path)
              if
                = path $ :path $ first-entry entries
                first-entry entries
                recur (rest entries) path
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-diff/SceneEntry)
            :args $ [] (:: 'List 'quamolit.scene-diff/SceneEntry) (:: 'List 'quamolit.scene-diff/IdentitySegment)
        'first-entry $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn first-entry (entries)
            -> (first entries) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-diff/SceneEntry)
            :args $ [] $ :: 'List 'quamolit.scene-diff/SceneEntry
        'geometry-signature $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn geometry-signature (content)
            match content
              (:group group)
                GeometrySignature :group (:transform group) (:clip group)
              (:rect rect)
                GeometrySignature :rect (:x rect) (:y rect) (:width rect) (:height rect)
              (:instances instances)
                GeometrySignature :instances (:width instances) (:height instances)
              (:polyline path)
                GeometrySignature :polyline (:points path) (:width path)
              (:text text)
                GeometrySignature :text (:x text) (:y text) (:size text) (:text text)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-diff/GeometrySignature)
            :args $ [] 'quamolit.scene-ir/SceneContent
        'index-prefix $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn index-prefix (remaining entries)
            if (empty? remaining) entries $ let
                node $ scene-ir/first-node remaining
                segment $ IdentitySegment :key (:key node) :kind $ scene-ir/content-kind (:content node)
                path $ append
                  parent-path entries $ :parent node
                  , segment
                position $ sibling-index entries $ :parent node
                entry $ SceneEntry :path path :sibling-index position :node node
              recur (rest remaining) (append entries entry)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.scene-ir/SceneNode) (:: 'List 'quamolit.scene-diff/SceneEntry)
            :return $ :: 'List 'quamolit.scene-diff/SceneEntry
        'index-scene $ %{} 'CodeEntry
          :doc "|Validate and resolve stable paths from preorder parent IDs."
          :code $ quote $ defn index-scene (document) (scene-ir/validate-scene document)
            index-prefix (:nodes document) (empty-entries)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'quamolit.scene-ir/SceneDocument
            :return $ :: 'List 'quamolit.scene-diff/SceneEntry
        'parent-path $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn parent-path (entries parent-id)
            if (empty? parent-id) (empty-segments)
              if (empty? entries) (raise |missing-scene-parent)
                let
                    entry $ first-entry entries
                  if
                    =
                      :id $ :node entry
                      , parent-id
                    :path entry
                    recur (rest entries) parent-id
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'List 'quamolit.scene-diff/SceneEntry) 'String
            :return $ :: 'List 'quamolit.scene-diff/IdentitySegment
        'path-in? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn path-in? (entries path)
            if (empty? entries) false $ if
              = path $ :path $ first-entry entries
              , true $ recur (rest entries) path
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] (:: 'List 'quamolit.scene-diff/SceneEntry) (:: 'List 'quamolit.scene-diff/IdentitySegment)
        'property-signature $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn property-signature (content)
            match content
              (:group group)
                PropertySignature :group $ :opacity group
              (:rect rect)
                PropertySignature :rect $ :fill rect
              (:instances instances)
                PropertySignature :instances $ :fill instances
              (:polyline path)
                PropertySignature :polyline $ :stroke path
              (:text text)
                PropertySignature :text $ :fill text
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-diff/PropertySignature)
            :args $ [] 'quamolit.scene-ir/SceneContent
        'resource-signature $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn resource-signature (content)
            match content
              (:group group) (ResourceSignature :none)
              (:rect rect) (ResourceSignature :none)
              (:instances instances)
                ResourceSignature :instances $ :source instances
              (:polyline path) (ResourceSignature :none)
              (:text text) (ResourceSignature :none)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-diff/ResourceSignature)
            :args $ [] 'quamolit.scene-ir/SceneContent
        'sibling-index $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sibling-index (entries parent-id) (count-siblings entries parent-id 0)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] (:: 'List 'quamolit.scene-diff/SceneEntry) 'String
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.scene-diff
          :require (quamolit.scene-ir :as scene-ir)
            quamolit.motion :refer $ finite-number? ColorRgba
            calcit.test :refer $ is= is-throws
    'quamolit.scene-ir $ %{} 'FileEntry
      :defs $ {}
        'ClipRect $ %{} 'CodeEntry (:doc "|Group-local rectangular clip in CSS pixels.")
          :code $ quote $ defstruct ClipRect (:x 'Number) (:y 'Number) (:width 'Number) (:height 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'ClipSpec $ %{} 'CodeEntry
          :doc "|Closed clip declaration; no Canvas path or host resource handle."
          :code $ quote $ defenum ClipSpec (:none) (:rect 'quamolit.scene-ir/ClipRect)
          :examples $ []
          :schema $ :: 'EnumDef
        'GroupNode $ %{} 'CodeEntry
          :doc "|Group transform, clip and isolated opacity declaration."
          :code $ quote $ defstruct GroupNode (:transform 'quamolit.scene-ir/Matrix2D) (:clip 'quamolit.scene-ir/ClipSpec) (:opacity 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'InstanceNode $ %{} 'CodeEntry
          :doc "|One logical instance layer referencing external positions and shared geometry/color."
          :code $ quote $ defstruct InstanceNode (:source 'quamolit.scene-ir/InstanceSource) (:width 'Number) (:height 'Number) (:fill 'quamolit.motion/ColorRgba)
          :examples $ []
          :schema $ :: 'StructDef
        'InstanceSource $ %{} 'CodeEntry
          :doc "|Versioned external typed-array source; count does not create child nodes."
          :code $ quote $ defstruct InstanceSource (:id 'String) (:version 'Number) (:count 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'Matrix2D $ %{} 'CodeEntry (:doc "|CSS-pixel affine matrix [a c e; b d f; 0 0 1].")
          :code $ quote $ defstruct Matrix2D (:a 'Number) (:b 'Number) (:c 'Number) (:d 'Number) (:e 'Number) (:f 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'PolylineNode $ %{} 'CodeEntry (:doc "|开放圆头/圆连接折线；至少两点，有限非负宽度，直通道 sRGB 颜色，不含宿主句柄。")
          :code $ quote $ defstruct PolylineNode
            :points $ :: 'List 'quamolit.motion/Vec2
            :width 'Number
            :stroke 'quamolit.motion/ColorRgba
          :examples $ []
          :schema $ :: 'StructDef
        'RectNode $ %{} 'CodeEntry
          :doc "|Solid rectangle geometry and straight-alpha sRGB color."
          :code $ quote $ defstruct RectNode (:x 'Number) (:y 'Number) (:width 'Number) (:height 'Number) (:fill 'quamolit.motion/ColorRgba)
          :examples $ []
          :schema $ :: 'StructDef
        'ScalarBinding $ %{} 'CodeEntry
          :doc "|Versioned reference to a Motion descriptor, never an executable closure."
          :code $ quote $ defstruct ScalarBinding (:target 'quamolit.scene-ir/ScalarTarget) (:motion-id 'String) (:version 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'ScalarTarget $ %{} 'CodeEntry
          :doc "|Scalar animation binding target; supported per content kind by validator."
          :code $ quote $ defenum ScalarTarget (:x) (:y) (:width) (:height) (:opacity) (:alpha)
          :examples $ []
          :schema $ :: 'EnumDef
        'SceneContent $ %{} 'CodeEntry
          :doc "|Closed primitive/group/instance-layer union, independent from execution plans."
          :code $ quote $ defenum SceneContent (:group 'quamolit.scene-ir/GroupNode) (:rect 'quamolit.scene-ir/RectNode) (:instances 'quamolit.scene-ir/InstanceNode) (:polyline 'quamolit.scene-ir/PolylineNode) (:text 'quamolit.scene-ir/TextNode)
          :examples $ []
          :schema $ :: 'EnumDef
        'SceneDocument $ %{} 'CodeEntry
          :doc "|Preorder node list; order is paint order, parent appears before child."
          :code $ quote $ defstruct SceneDocument
            :nodes $ :: 'List 'quamolit.scene-ir/SceneNode
          :examples $ []
          :schema $ :: 'StructDef
        'SceneInteraction $ %{} 'CodeEntry
          :doc "|Logical event target reference; hit testing is not performed during paint."
          :code $ quote $ defenum SceneInteraction (:none) (:target 'String)
          :examples $ []
          :schema $ :: 'EnumDef
        'SceneNode $ %{} 'CodeEntry
          :doc "|Flat node: stable unique id, parent id, sibling key, typed content and metadata."
          :code $ quote $ defstruct SceneNode (:id 'String) (:parent 'String) (:key 'String) (:content 'quamolit.scene-ir/SceneContent)
            :bindings $ :: 'List 'quamolit.scene-ir/ScalarBinding
            :interaction 'quamolit.scene-ir/SceneInteraction
          :examples $ []
          :schema $ :: 'StructDef
        'TextNode $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct TextNode (:x 'Number) (:y 'Number) (:size 'Number) (:text 'String) (:fill 'quamolit.motion/ColorRgba)
          :examples $ []
          :schema $ :: 'StructDef
        'conflicts-with-earlier? $ %{} 'CodeEntry
          :doc "|Reject duplicate ID or sibling key in a preorder prefix."
          :code $ quote $ defn conflicts-with-earlier? (node earlier)
            if (empty? earlier) false $ let
                previous $ first-node earlier
              if
                or
                  = (:id node) (:id previous)
                  and
                    = (:parent node) (:parent previous)
                    = (:key node) (:key previous)
                , true $ recur node $ rest earlier
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.scene-ir/SceneNode $ :: 'List 'quamolit.scene-ir/SceneNode
        'content-kind $ %{} 'CodeEntry
          :doc "|Stable content kind for identity and diagnostics."
          :code $ quote $ defn content-kind (content)
            match content
              (:group group) |group
              (:rect rect) |rect
              (:instances instances) |instances
              (:polyline path) |polyline
              (:text text) |text
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'String)
            :args $ [] 'quamolit.scene-ir/SceneContent
        'empty-scene-nodes $ %{} 'CodeEntry (:doc "|Typed empty node prefix.")
          :code $ quote $ defn empty-scene-nodes () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.scene-ir/SceneNode
        'first-binding $ %{} 'CodeEntry
          :doc "|Typed first element helper for a nonempty binding list."
          :code $ quote $ defn first-binding (bindings)
            -> (first bindings) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/ScalarBinding)
            :args $ [] $ :: 'List 'quamolit.scene-ir/ScalarBinding
        'first-node $ %{} 'CodeEntry
          :doc "|Typed first element helper for a nonempty node list."
          :code $ quote $ defn first-node (nodes)
            -> (first nodes) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneNode)
            :args $ [] $ :: 'List 'quamolit.scene-ir/SceneNode
        'last-node $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn last-node (nodes)
            if
              empty? $ rest nodes
              first-node nodes
              recur $ rest nodes
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneNode)
            :args $ [] $ :: 'List 'quamolit.scene-ir/SceneNode
        'node-for-id $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn node-for-id (nodes id)
            if (empty? nodes) (raise |missing-scene-ancestor)
              let
                  node $ first-node nodes
                if
                  = id $ :id node
                  , node $ recur (rest nodes) id
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneNode)
            :args $ [] (:: 'List 'quamolit.scene-ir/SceneNode) 'String
        'parent-group? $ %{} 'CodeEntry
          :doc "|A non-root parent must already exist in the prefix and be a group."
          :code $ quote $ defn parent-group? (parent-id earlier)
            if (empty? earlier) false $ let
                previous $ first-node earlier
              if
                = parent-id $ :id previous
                =
                  content-kind $ :content previous
                  , |group
                recur parent-id $ rest earlier
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'String $ :: 'List 'quamolit.scene-ir/SceneNode
        'parent-on-spine? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn parent-on-spine? (parent-id earlier)
            if (empty? parent-id) true $ if (empty? earlier) false $ spine-contains?
              :id $ last-node earlier
              , parent-id earlier
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'String $ :: 'List 'quamolit.scene-ir/SceneNode
        'spine-contains? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn spine-contains? (current-id target-id earlier)
            if (empty? current-id) false $ if (= current-id target-id) true $ recur
              :parent $ node-for-id earlier current-id
              , target-id earlier
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'String 'String $ :: 'List 'quamolit.scene-ir/SceneNode
        'target-in? $ %{} 'CodeEntry (:doc "|Check for another binding of the same target.")
          :code $ quote $ defn target-in? (target bindings)
            if (empty? bindings) false $ if
              = target $ :target $ first-binding bindings
              , true $ recur target (rest bindings)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.scene-ir/ScalarTarget $ :: 'List 'quamolit.scene-ir/ScalarBinding
        'valid-binding? $ %{} 'CodeEntry
          :doc "|Validate one versioned scalar motion binding and its legal target."
          :code $ quote $ defn valid-binding? (binding content)
            and
              not $ empty? $ :motion-id binding
              finite-number? $ :version binding
              >= (:version binding) 0
              = (:version binding)
                floor $ :version binding
              match (:target binding)
                (:opacity)
                  = (content-kind content) |group
                (:x)
                  = (content-kind content) |rect
                (:y)
                  = (content-kind content) |rect
                (:width)
                  = (content-kind content) |rect
                (:height)
                  = (content-kind content) |rect
                (:alpha)
                  or
                    = (content-kind content) |rect
                    = (content-kind content) |polyline
                    = (content-kind content) |text
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.scene-ir/ScalarBinding 'quamolit.scene-ir/SceneContent
        'valid-bindings? $ %{} 'CodeEntry (:doc "|Reject duplicate or unsupported scalar targets.")
          :code $ quote $ defn valid-bindings? (bindings content)
            if (empty? bindings) true $ let
                binding $ first-binding bindings
                later $ rest bindings
              and (valid-binding? binding content)
                not $ target-in? (:target binding) later
                recur later content
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] (:: 'List 'quamolit.scene-ir/ScalarBinding) 'quamolit.scene-ir/SceneContent
        'valid-color? $ %{} 'CodeEntry (:doc "|Validate straight-alpha sRGB channels.")
          :code $ quote $ defn valid-color? (color)
            and
              valid-unit? $ :r color
              valid-unit? $ :g color
              valid-unit? $ :b color
              valid-unit? $ :a color
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.motion/ColorRgba
        'valid-content? $ %{} 'CodeEntry
          :doc "|Validate the numeric and resource payload of one content variant."
          :code $ quote $ defn valid-content? (content)
            match content
              (:group group)
                let
                    transform $ :transform group
                    clip-valid $ match (:clip group)
                      (:none) true
                      (:rect clip)
                        and
                          finite-number? $ :x clip
                          finite-number? $ :y clip
                          finite-number? $ :width clip
                          finite-number? $ :height clip
                          >= (:width clip) 0
                          >= (:height clip) 0
                  and
                    finite-number? $ :a transform
                    finite-number? $ :b transform
                    finite-number? $ :c transform
                    finite-number? $ :d transform
                    finite-number? $ :e transform
                    finite-number? $ :f transform
                    valid-unit? $ :opacity group
                    , clip-valid
              (:rect rect)
                and
                  finite-number? $ :x rect
                  finite-number? $ :y rect
                  finite-number? $ :width rect
                  finite-number? $ :height rect
                  >= (:width rect) 0
                  >= (:height rect) 0
                  valid-color? $ :fill rect
              (:instances instances)
                let
                    source $ :source instances
                  and
                    not $ empty? $ :id source
                    finite-number? $ :version source
                    >= (:version source) 0
                    = (:version source)
                      floor $ :version source
                    finite-number? $ :count source
                    >= (:count source) 0
                    = (:count source)
                      floor $ :count source
                    finite-number? $ :width instances
                    finite-number? $ :height instances
                    >= (:width instances) 0
                    >= (:height instances) 0
                    valid-color? $ :fill instances
              (:polyline path) (valid-polyline? path)
              (:text text)
                and
                  finite-number? $ :x text
                  finite-number? $ :y text
                  finite-number? $ :size text
                  > (:size text) 0
                  valid-color? $ :fill text
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.scene-ir/SceneContent
        'valid-node? $ %{} 'CodeEntry
          :doc "|Check local numeric, resource, binding and interaction invariants."
          :code $ quote $ defn valid-node? (node)
            and
              not $ empty? $ :id node
              not $ empty? $ :key node
              not= (:id node) (:parent node)
              valid-content? $ :content node
              valid-bindings? (:bindings node) (:content node)
              match (:interaction node)
                (:none) true
                (:target target)
                  not $ empty? target
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.scene-ir/SceneNode
        'valid-polyline? $ %{} 'CodeEntry (:doc "|验证折线点数、有限坐标、有限非负宽度和颜色。")
          :code $ quote $ defn valid-polyline? (path)
            and
              >=
                count $ :points path
                , 2
              every? (:points path) finite-vec2?
              finite-number? $ :width path
              >= (:width path) 0
              valid-color? $ :stroke path
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.scene-ir/PolylineNode
        'valid-prefix? $ %{} 'CodeEntry
          :doc "|Walk preorder nodes and reject invalid topology or duplicate identities."
          :code $ quote $ defn valid-prefix? (remaining earlier)
            if (empty? remaining) true $ let
                node $ first-node remaining
              assert |invalid-scene-node $ valid-node? node
              assert |duplicate-scene-id-or-sibling-key $ not $ conflicts-with-earlier? node earlier
              assert |missing-or-non-group-parent $ or
                empty? $ :parent node
                parent-group? (:parent node) earlier
              assert |non-preorder-parent $ parent-on-spine? (:parent node) earlier
              recur (rest remaining) (append earlier node)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] (:: 'List 'quamolit.scene-ir/SceneNode) (:: 'List 'quamolit.scene-ir/SceneNode)
        'valid-unit? $ %{} 'CodeEntry (:doc "|Validate a finite normalized channel.")
          :code $ quote $ defn valid-unit? (value)
            and (finite-number? value) (>= value 0) (<= value 1)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'Number
        'validate-scene $ %{} 'CodeEntry
          :doc "|Validate the serializable preorder Scene IR before any drawing."
          :code $ quote $ defn validate-scene (document)
            valid-prefix? (:nodes document) (empty-scene-nodes)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.scene-ir/SceneDocument
          :tests $ []
            %{} 'TestEntry (:name |flat-valid-document)
              :code $ quote $ let
                  matrix $ Matrix2D :a 1 :b 0 :c 0 :d 1 :e 0 :f 0
                  group-content $ SceneContent :group $ GroupNode :transform matrix :clip (ClipSpec :none) :opacity 1
                  color $ ColorRgba :r 1 :g 0 :b 0 :a 1
                  rect-content $ SceneContent :rect $ RectNode :x 10 :y 20 :width 16 :height 16 :fill color
                  instance-content $ SceneContent :instances $ InstanceNode :source (InstanceSource :id |crowd-positions :version 3 :count 10000) :width 2 :height 2 :fill color
                  binding $ ScalarBinding :target (ScalarTarget :x) :motion-id |badge-x :version 1
                  group $ SceneNode :id |root :parent | :key |root :content group-content :bindings ([]) :interaction $ SceneInteraction :none
                  badge $ SceneNode :id |badge :parent |root :key |badge :content rect-content :bindings ([] binding) :interaction $ SceneInteraction :target |badge-click
                  crowd $ SceneNode :id |crowd :parent |root :key |crowd :content instance-content :bindings ([]) :interaction $ SceneInteraction :none
                  document $ SceneDocument :nodes $ [] group badge crowd
                is= true $ validate-scene document
                is= true $ validate-scene $ SceneDocument :nodes ([] group crowd badge)
                is= 3 $ count $ :nodes document
                is= |instances $ content-kind $ :content crowd
              :tags $ #{} :scene :unit
            %{} 'TestEntry (:name |rejects-invalid-scene)
              :code $ quote $ let
                  matrix $ Matrix2D :a 1 :b 0 :c 0 :d 1 :e 0 :f 0
                  color $ ColorRgba :r 1 :g 0 :b 0 :a 1
                  group-content $ SceneContent :group $ GroupNode :transform matrix :clip (ClipSpec :none) :opacity 1
                  rect-content $ SceneContent :rect $ RectNode :x 10 :y 20 :width 16 :height 16 :fill color
                  group $ SceneNode :id |root :parent | :key |root :content group-content :bindings ([]) :interaction $ SceneInteraction :none
                  badge $ SceneNode :id |badge :parent |root :key |badge :content rect-content :bindings ([]) :interaction $ SceneInteraction :none
                  duplicate-key $ SceneNode :id |other :parent |root :key |badge :content rect-content :bindings ([]) :interaction $ SceneInteraction :none
                  duplicate-id $ SceneNode :id |badge :parent |root :key |other :content rect-content :bindings ([]) :interaction $ SceneInteraction :none
                  missing-parent $ SceneNode :id |orphan :parent |missing :key |orphan :content rect-content :bindings ([]) :interaction $ SceneInteraction :none
                  rect-child $ SceneNode :id |child :parent |badge :key |child :content rect-content :bindings ([]) :interaction $ SceneInteraction :none
                  bad-rect $ SceneNode :id |bad :parent |root :key |bad :content
                    SceneContent :rect $ RectNode :x 0 :y 0 :width -1 :height 2 :fill color
                    , :bindings ([]) :interaction $ SceneInteraction :none
                  bad-group $ SceneNode :id |bad :parent | :key |bad :content
                    SceneContent :group $ GroupNode :transform matrix :clip (ClipSpec :none) :opacity 1.5
                    , :bindings ([]) :interaction $ SceneInteraction :none
                  bad-instances $ SceneNode :id |bad :parent |root :key |bad :content
                    SceneContent :instances $ InstanceNode :source (InstanceSource :id |points :version 1 :count 1.5) :width 2 :height 2 :fill color
                    , :bindings ([]) :interaction $ SceneInteraction :none
                  x-binding $ ScalarBinding :target (ScalarTarget :x) :motion-id |move :version 1
                  duplicate-binding $ SceneNode :id |bad :parent |root :key |bad :content rect-content :bindings ([] x-binding x-binding) :interaction $ SceneInteraction :none
                  invalid-target $ SceneNode :id |bad :parent | :key |bad :content group-content :bindings ([] x-binding) :interaction $ SceneInteraction :none
                  bad-event $ SceneNode :id |bad :parent |root :key |bad :content rect-content :bindings ([]) :interaction $ SceneInteraction :target |
                is-throws $ validate-scene $ SceneDocument :nodes ([] group badge duplicate-key)
                is-throws $ validate-scene $ SceneDocument :nodes ([] group badge duplicate-id)
                is-throws $ validate-scene $ SceneDocument :nodes ([] group missing-parent)
                is-throws $ validate-scene $ SceneDocument :nodes ([] badge group)
                is-throws $ validate-scene $ SceneDocument :nodes ([] group badge rect-child)
                is-throws $ validate-scene $ SceneDocument :nodes ([] group bad-rect)
                is-throws $ validate-scene $ SceneDocument :nodes ([] bad-group)
                is-throws $ validate-scene $ SceneDocument :nodes ([] group bad-instances)
                is-throws $ validate-scene $ SceneDocument :nodes ([] group duplicate-binding)
                is-throws $ validate-scene $ SceneDocument :nodes ([] invalid-target)
                is-throws $ validate-scene $ SceneDocument :nodes ([] group bad-event)
              :tags $ #{} :scene :unit
            %{} 'TestEntry (:name |rejects-return-to-closed-subtree)
              :code $ quote $ let
                  matrix $ Matrix2D :a 1 :b 0 :c 0 :d 1 :e 0 :f 0
                  color $ ColorRgba :r 1 :g 0 :b 0 :a 1
                  group-content $ SceneContent :group $ GroupNode :transform matrix :clip (ClipSpec :none) :opacity 1
                  rect-content $ SceneContent :rect $ RectNode :x 0 :y 0 :width 1 :height 1 :fill color
                  root $ SceneNode :id |root :parent | :key |root :content group-content :bindings ([]) :interaction $ SceneInteraction :none
                  p $ SceneNode :id |p :parent |root :key |p :content group-content :bindings ([]) :interaction $ SceneInteraction :none
                  q $ SceneNode :id |q :parent |root :key |q :content group-content :bindings ([]) :interaction $ SceneInteraction :none
                  child $ SceneNode :id |child :parent |p :key |child :content rect-content :bindings ([]) :interaction $ SceneInteraction :none
                is= true $ validate-scene $ SceneDocument :nodes ([] root p child q)
                is-throws $ validate-scene $ SceneDocument :nodes ([] root p q child)
              :tags $ #{} :scene :unit
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.scene-ir
          :require
            quamolit.motion :refer $ finite-number? ColorRgba finite-vec2?
            calcit.test :refer $ is= is-throws
    'quamolit.test.component-fixture $ %{} 'FileEntry
      :defs $ {}
        'declare-badge $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn declare-badge (props model input resources viewport)
            let
                color $ if resources
                  motion/ColorRgba :r 0 :g 0.7 :b 0.4 :a 1
                  motion/ColorRgba :r 0.92 :g 0.28 :b 0.6 :a 1
                content $ scene-ir/SceneContent :rect $ scene-ir/RectNode :x 80 :y (+ props model input) :width (/ viewport 10) :height 20 :fill color
                binding $ scene-ir/ScalarBinding :target (scene-ir/ScalarTarget :x) :motion-id |badge-x :version 1
                node $ scene-ir/SceneNode :id |badge :parent | :key |badge :content content :bindings ([] binding) :interaction $ scene-ir/SceneInteraction :none
                descriptor $ motion/ScalarDescriptor :id |badge-x :version 1 :motion $ motion/ScalarMotion :tween
                  motion/ScalarTween :start 0 :duration 1 :from 80 :to 120 :easing $ motion/Easing :linear
              component/ComponentDeclaration :scene
                scene-ir/SceneDocument :nodes $ [] node
                , :motions $ [] descriptor
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.component-sample/ComponentDeclaration)
            :args $ [] 'Number 'Number 'Number 'Bool 'Number
        'frame-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn frame-at (time model ready viewport)
            component/sample-component-at (make-request time model ready viewport) declare-badge
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'Number 'Bool 'Number
            :return $ :: 'quamolit.direct-frame/DirectFrame 'quamolit.scene-ir/SceneDocument
          :tests $ [] $ %{} 'TestEntry (:name |complete-version-reuse-and-host-clock)
            :code $ quote $ let
                request $ make-request 0.5 40 false 100
                initial $ frame-at 0.5 40 false 100
                reused $ component/resample-component-at initial request $ fn (props model input resources viewport)
                  hint-fn $ {}
                    :args $ [] 'Number 'Number 'Number 'Bool 'Number
                    :return 'quamolit.component-sample/ComponentDeclaration
                  raise |unexpected-component-evaluation
                ready $ component/resample-component-at initial (make-request 0.5 40 true 100) declare-badge
                timeline $ clock/start-clock 10 0 1
                paused $ clock/pause-clock timeline 10.5
                host-frame $ component/sample-component-at-host paused 20 request declare-badge
                seeked $ clock/seek-clock paused 20 0.25
                seek-frame $ component/sample-component-at-host seeked 20 request declare-badge
              is= initial reused
              is= 0.7 $ :g $ :fill (rect-at 0.5 40 true 100)
              is= 0.5 $ :time host-frame
              is= 0.25 $ :time seek-frame
              is= 90 $ match
                :content $ scene-ir/first-node $ :nodes (:scene seek-frame)
                (:rect value) (:x value)
                _ -1
              is= 0.7 $ match
                :content $ scene-ir/first-node $ :nodes (:scene ready)
                (:rect value)
                  :g $ :fill value
                _ -1
            :tags $ #{} :component-sample :unit
        'main! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn main! ()
            scene-ir/validate-scene $ scene-at 0.5 40 false 100
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ []
        'make-request $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn make-request (time model ready viewport)
            component/ComponentRequest :id |badge :time time :versions
              direct/FrameVersions :component 0 :motion 0 :model model :input 0 :resources (if ready 1 0) :viewport viewport
              , :props 20 :model model :input 2 :resources ready :viewport viewport
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'Number 'Bool 'Number
            :return $ :: 'quamolit.component-sample/ComponentRequest 'Number 'Number 'Number 'Bool 'Number
        'rect-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn rect-at (time model ready viewport)
            match
              :content $ scene-ir/first-node $ :nodes (scene-at time model ready viewport)
              (:rect value) value
              _ $ raise |expected-rect
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/RectNode)
            :args $ [] 'Number 'Number 'Bool 'Number
          :tests $ [] $ %{} 'TestEntry (:name |arbitrary-time-and-snapshot-inputs)
            :code $ quote $ let
                xs $ map ([] 1 0 0.5 0.25 1)
                  fn (time)
                    :x $ rect-at time 40 false 100
                middle $ rect-at 0.5 40 false 100
                changed-model $ rect-at 0.5 41 false 100
                changed-resource $ rect-at 0.5 40 true 100
                changed-viewport $ rect-at 0.5 40 false 110
              is= ([] 120 80 100 90 120) xs
              is= 62 $ :y middle
              is= 63 $ :y changed-model
              is= 0.7 $ :g $ :fill changed-resource
              is= 11 $ :width changed-viewport
              is-throws $ frame-at (/ 0 0) 40 false 100
            :tags $ #{} :component-sample :unit
        'reload! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reload! () (main!)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ []
        'scene-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn scene-at (time model ready viewport)
            :scene $ frame-at time model ready viewport
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'Number 'Number 'Bool 'Number
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.test.component-fixture
          :require (quamolit.component-sample :as component) (quamolit.scene-ir :as scene-ir) (quamolit.motion :as motion) (quamolit.direct-frame :as direct) (quamolit.host-clock :as clock)
            calcit.test :refer $ is= is-throws
    'quamolit.test.cpu-motion-fixture $ %{} 'FileEntry
      :defs $ {}
        'CustomInput $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct CustomInput (:base 'quamolit.motion/Vec2) (:ready 'Bool) (:viewport 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'frame-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn frame-at (time model ready viewport)
            cpu/sample-function (make-request time model ready viewport) (make-registry) valid-output?
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'Number 'Bool 'Number
            :return $ :: 'quamolit.motion-cpu/CpuFunctionFrame 'quamolit.motion/Vec2
        'main! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn main! ()
            [] (sample-x-at 0.5 0 false 100) (sample-y-at 0.5 0 false 100)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'Number
        'make-registry $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn make-registry ()
            let
                base-registry $ assert-type
                  cpu/CpuFunctionRegistry :samplers $ {}
                  :: 'quamolit.motion-cpu/CpuFunctionRegistry 'quamolit.test.cpu-motion-fixture/CustomInput 'quamolit.motion/Vec2
              cpu/register-function base-registry |move sample-custom
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'quamolit.motion-cpu/CpuFunctionRegistry 'quamolit.test.cpu-motion-fixture/CustomInput 'quamolit.motion/Vec2
        'make-request $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn make-request (time model ready viewport)
            let
                descriptor $ cpu/CpuFunctionDescriptor :id |custom-vec2 :version 1 :callback-id |move :gpu-status $ motion/CpuGpuStatus :unsupported |runtime-callback-vec2
                versions $ direct/FrameVersions :component 0 :motion 1 :model model :input 0 :resources (if ready 1 0) :viewport viewport
                input $ CustomInput :base
                  motion/Vec2 :x (+ 80 model) :y 60
                  , :ready ready :viewport viewport
              cpu/CpuFunctionRequest :descriptor descriptor :time time :versions versions :input input
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'Number 'Bool 'Number
            :return $ :: 'quamolit.motion-cpu/CpuFunctionRequest 'quamolit.test.cpu-motion-fixture/CustomInput
        'reload! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reload! () (main!)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'Number
        'resample-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn resample-at (previous time model ready viewport)
            cpu/resample-function previous (make-request time model ready viewport) (make-registry) valid-output?
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] (:: 'quamolit.motion-cpu/CpuFunctionFrame 'quamolit.motion/Vec2) 'Number 'Number 'Bool 'Number
            :return $ :: 'quamolit.motion-cpu/CpuFunctionFrame 'quamolit.motion/Vec2
        'sample-custom $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-custom (input time)
            motion/Vec2 :x
              +
                :x $ :base input
                * time 40
                if (:ready input) 20 0
              , :y $ +
                :y $ :base input
                / (:viewport input) 10
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/Vec2)
            :args $ [] 'quamolit.test.cpu-motion-fixture/CustomInput 'Number
        'sample-x-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-x-at (time model ready viewport)
            :x $ :value $ frame-at time model ready viewport
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number 'Number 'Bool 'Number
        'sample-y-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-y-at (time model ready viewport)
            :y $ :value $ frame-at time model ready viewport
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number 'Number 'Bool 'Number
        'unsupported-reason $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn unsupported-reason ()
            cpu/gpu-reason $ :descriptor $ make-request 0 0 false 100
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'String)
            :args $ []
        'valid-output? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn valid-output? (value) (motion/finite-vec2? value)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.motion/Vec2
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.test.cpu-motion-fixture
          :require (quamolit.motion-cpu :as cpu) (quamolit.motion :as motion) (quamolit.direct-frame :as direct)
            calcit.test :refer $ is= is-throws
    'quamolit.test.fade-migration-fixture $ %{} 'FileEntry
      :defs $ {}
        'FadeModel $ %{} 'CodeEntry (:doc "|旧 fade 迁移用的显式应用 Model：保存过渡意图、描述版本和进入/退出阶段。")
          :code $ quote $ defstruct FadeModel (:intent 'quamolit.transition/TransitionIntent) (:revision 'Number) (:phase 'quamolit.test.fade-migration-fixture/FadePhase)
          :examples $ []
          :schema $ :: 'StructDef
        'FadePhase $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defenum FadePhase (:enter) (:exit)
          :examples $ []
          :schema $ :: 'EnumDef
        'declare-fade $ %{} 'CodeEntry
          :doc "|声明一个 group 与单矩形 Scene；group opacity 仅保存 Motion 引用，组件与绘制无缓存副作用。"
          :code $ quote $ defn declare-fade (props model input resources viewport)
            let
                descriptor $ fade-descriptor model
                tween $ :tween $ :intent model
                transform $ scene-ir/Matrix2D :a 1 :b 0 :c 0 :d 1 :e 0 :f 0
                group-content $ scene-ir/SceneContent :group $ scene-ir/GroupNode :transform transform :clip (scene-ir/ClipSpec :none) :opacity (:from tween)
                binding $ scene-ir/ScalarBinding :target (scene-ir/ScalarTarget :opacity) :motion-id (:id descriptor) :version $ :version descriptor
                group $ scene-ir/SceneNode :id |fade-root :parent | :key |fade-root :content group-content :bindings ([] binding) :interaction $ scene-ir/SceneInteraction :none
                fill $ if resources
                  motion/ColorRgba :r 0 :g 0.2 :b 0.8 :a 1
                  motion/ColorRgba :r 0 :g 0 :b 0 :a 1
                rect-content $ scene-ir/SceneContent :rect $ scene-ir/RectNode :x props :y input :width (/ viewport 2) :height 60 :fill fill
                rect $ scene-ir/SceneNode :id |fade-rect :parent |fade-root :key |fade-rect :content rect-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
              component/ComponentDeclaration :scene
                scene-ir/SceneDocument :nodes $ [] group rect
                , :motions $ [] descriptor
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.component-sample/ComponentDeclaration)
            :args $ [] 'Number 'quamolit.test.fade-migration-fixture/FadeModel 'Number 'Bool 'Number
        'enter-model $ %{} 'CodeEntry (:doc "|把旧 v=4 的淡入速度映射为从 0 到 1、持续 0.25 秒的绝对时间意图。")
          :code $ quote $ defn enter-model ()
            FadeModel :intent
              transition/start-transition |fade 0 1 0 0.25 $ motion/Easing :linear
              , :revision 1 :phase $ FadePhase :enter
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.test.fade-migration-fixture/FadeModel)
            :args $ []
        'enter-opacity-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn enter-opacity-at (time)
            opacity-for-model time $ enter-model
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
          :tests $ [] $ %{} 'TestEntry (:name |legacy-speed-four-equivalence)
            :code $ quote $ do
              is= ([] 0 0.25 0.5 1 1 0.5)
                map ([] 0 0.0625 0.125 0.25 1 0.125)
                  fn (time) (enter-opacity-at time)
              is= 0 $ enter-opacity-at -1
              is-throws $ enter-opacity-at $ / 0 0
            :tags $ #{} :fade-migration :unit
        'enter-scene-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn enter-scene-at (time)
            scene-for-model time $ enter-model
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'Number
        'exit-model $ %{} 'CodeEntry (:doc "|在 t=0.5 从淡入完成值建立淡出意图，保证切换处透明度连续。")
          :code $ quote $ defn exit-model ()
            let
                initial $ enter-model
              FadeModel :intent
                transition/interrupt-transition (:intent initial) 0 0.5 0.25 $ motion/Easing :linear
                , :revision 2 :phase $ FadePhase :exit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.test.fade-migration-fixture/FadeModel)
            :args $ []
        'exit-opacity-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn exit-opacity-at (time)
            opacity-for-model time $ exit-model
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
          :tests $ [] $ %{} 'TestEntry (:name |exit-and-interruption-continuity)
            :code $ quote $ do
              is= 1 $ exit-opacity-at 0.5
              is= 1 $ enter-opacity-at 0.5
              is= 0.75 $ exit-opacity-at 0.5625
              is= 0.5 $ exit-opacity-at 0.625
              is= 0 $ exit-opacity-at 0.75
              is= 0.5 $ enter-opacity-at 0.125
              is= 0.5 $ interrupt-opacity-at 0.125
              is= 0.25 $ interrupt-opacity-at 0.25
              is= 0 $ interrupt-opacity-at 0.375
              is= 0.5 $ interrupt-opacity-at 0.125
            :tags $ #{} :fade-migration :unit
        'exit-scene-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn exit-scene-at (time)
            scene-for-model time $ exit-model
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'Number
        'fade-descriptor $ %{} 'CodeEntry
          :doc "|从 FadeModel 生成纯数据的版本化标量 tween，供 Scene opacity 绑定与 GPU 候选计划共用。"
          :code $ quote $ defn fade-descriptor (model)
            assert |invalid-fade-revision $ motion/valid-motion-version? $ :revision model
            motion/ScalarDescriptor :id |fade-alpha :version (:revision model) :motion $ motion/ScalarMotion :tween $ :tween (:intent model)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/ScalarDescriptor)
            :args $ [] 'quamolit.test.fade-migration-fixture/FadeModel
        'gpu-enter-plan $ %{} 'CodeEntry (:doc "|将同一 fade 描述降为受限 GPU 候选数据计划，不表示 WGSL 已执行。")
          :code $ quote $ defn gpu-enter-plan ()
            motion-gpu/lower-scalar $ fade-descriptor $ enter-model
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion-gpu/GpuScalarLowering)
            :args $ []
          :tests $ [] $ %{} 'TestEntry (:name |serializable-fade-candidate)
            :code $ quote $ match (gpu-enter-plan)
              (:supported plan)
                do
                  is= |fade-alpha $ :id plan
                  is= 1 $ :version plan
                  match (:kernel plan)
                    (:tween tween)
                      do
                        is= 0.25 $ :duration tween
                        is= 0 $ :from tween
                        is= 1 $ :to tween
                    _ $ raise |expected-fade-tween
              (:unsupported reason) (raise |expected-supported-fade)
            :tags $ #{} :fade-migration :unit
        'interrupt-model $ %{} 'CodeEntry (:doc "|在淡入 t=0.125 时采样当前 alpha=0.5，再建立到 0 的新意图。")
          :code $ quote $ defn interrupt-model ()
            let
                initial $ enter-model
              FadeModel :intent
                transition/interrupt-transition (:intent initial) 0 0.125 0.25 $ motion/Easing :linear
                , :revision 2 :phase $ FadePhase :exit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.test.fade-migration-fixture/FadeModel)
            :args $ []
        'interrupt-opacity-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn interrupt-opacity-at (time)
            opacity-for-model time $ interrupt-model
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'interrupt-scene-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn interrupt-scene-at (time)
            scene-for-model time $ interrupt-model
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'Number
        'main! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn main! ()
            [] (enter-opacity-at 0.125) (exit-opacity-at 0.625) (interrupt-opacity-at 0.25)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'Number
        'make-request $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn make-request (time model)
            component/ComponentRequest :id |fade :time time :versions
              direct/FrameVersions :component 0 :motion (:revision model) :model (:revision model) :input 0 :resources 0 :viewport 0
              , :props 80 :model model :input 50 :resources false :viewport 100
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'quamolit.test.fade-migration-fixture/FadeModel
            :return $ :: 'quamolit.component-sample/ComponentRequest 'Number 'quamolit.test.fade-migration-fixture/FadeModel 'Number 'Bool 'Number
        'opacity-for-model $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn opacity-for-model (time model)
            match
              :content $ scene-ir/first-node $ :nodes (scene-for-model time model)
              (:group value) (:opacity value)
              _ $ raise |expected-fade-group
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number 'quamolit.test.fade-migration-fixture/FadeModel
        'reload! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reload! () (main!)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'Number
        'scene-for-model $ %{} 'CodeEntry (:doc "|在任意绝对时间直接求旧 fade 迁移组件的 Scene；这是 CPU 全量正确性参考。")
          :code $ quote $ defn scene-for-model (time model)
            :scene $ component/sample-component-at (make-request time model) declare-fade
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'Number 'quamolit.test.fade-migration-fixture/FadeModel
          :tests $ [] $ %{} 'TestEntry (:name |scene-binding-and-model-version)
            :code $ quote $ let
                enter $ enter-model
                exiting $ exit-model
                entering-scene $ scene-for-model 0.125 enter
                exiting-scene $ scene-for-model 0.625 exiting
                root $ scene-ir/first-node $ :nodes entering-scene
                exit-root $ scene-ir/first-node $ :nodes exiting-scene
              is= true $ scene-ir/validate-scene entering-scene
              is= true $ scene-ir/validate-scene exiting-scene
              is= 2 $ count $ :nodes entering-scene
              is= 1 $ :version $ fade-descriptor enter
              is= 2 $ :version $ fade-descriptor exiting
              is= 1 $ :version $ scene-ir/first-binding (:bindings root)
              is= 2 $ :version $ scene-ir/first-binding (:bindings exit-root)
              is= 0.5 $ opacity-for-model 0.125 enter
              is= 0.5 $ opacity-for-model 0.625 exiting
              is-throws $ scene-for-model (/ 0 0) enter
            :tags $ #{} :fade-migration :unit
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.test.fade-migration-fixture
          :require (quamolit.component-sample :as component) (quamolit.direct-frame :as direct) (quamolit.motion :as motion) (quamolit.motion-gpu :as motion-gpu) (quamolit.scene-ir :as scene-ir) (quamolit.transition :as transition)
            calcit.test :refer $ is= is-throws
    'quamolit.test.frame-fixture $ %{} 'FileEntry
      :defs $ {}
        '*frame $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *frame (initial-frame 0 0 scene)
          :examples $ []
          :schema $ :: 'Dynamic
        'main! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn main! () (reset-fixture!) ([] step-fixture! redraw-fixture! progress)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ []
        'progress $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn progress () (:model @*frame)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ []
        'redraw-fixture! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn redraw-fixture! (ctx)
            paint-tree-only-with ctx (:scene @*frame) ([])
              fn (context shape coord)
                paint-rect context
                  :style $ assert-type shape Shape
                  , coord $ :event $ assert-type shape Shape
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
            :features $ #{} :js-ffi
        'reload! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reload! () &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ []
        'reset-fixture! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reset-fixture! ()
            reset! *frame $ initial-frame 0 0 scene
            , &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ []
        'scene $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn scene (progress)
            rect $ {} (:w 48) (:h 48) (:y 80) (:fill-style |#ec4899)
              :x $ + 48 $ * 160 progress
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.types/Shape)
            :args $ [] 'Number
        'step-fixture! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn step-fixture! (ctx seconds)
            reset! *frame $ evaluate-at @*frame seconds update-progress scene
            redraw-fixture! ctx
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Number
            :features $ #{} :js-ffi
        'update-progress $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-progress (model sample)
            + model $ :elapsed sample
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number 'quamolit.frame-clock/FrameSample
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.test.frame-fixture
          :require
            quamolit.alias :refer $ rect
            quamolit.types :refer $ Component Shape
            quamolit.render.paint :refer $ paint-tree-only-with paint-rect
            quamolit.frame-eval :refer $ initial-frame evaluate-at
    'quamolit.test.gpu-component-fixture $ %{} 'FileEntry
      :defs $ {}
        'extreme-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn extreme-plan (time)
            let
                plan $ fixture/start 0 40 false 100
                slot $ &list:nth (:slots plan) 0
                descriptor $ struct-with (:descriptor slot)
                  :motion $ motion/ScalarMotion :tween $ motion/ScalarTween :start 0 :duration 1 :from 80 :to 1e39 :easing (motion/Easing :linear)
                changed $ struct-with plan $ :slots
                  [] $ struct-with slot $ :descriptor descriptor
              retained/sample-plan-at changed time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'Number
        'frame-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn frame-at (time)
            match
              gpu/prepare-plan $ fixture/start time 40 false 100
              (:rects frame) frame
              (:fallback reason) (raise reason)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-component/RectFrame)
            :args $ [] 'Number
        'main! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn main! ()
            count $ :records $ frame-at 0
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ []
          :tests $ []
            %{} 'TestEntry (:name |gpu-component-delta)
              :code $ quote $ let
                  initial $ frame-at 0
                  changed $ frame-at 0.5
                  cold $ gpu/update-frame (gpu/empty-frame) initial
                  hot $ gpu/update-frame initial changed
                is= 65 $ :instances cold
                is= 4160 $ :uploaded-bytes cold
                is= 64 $ :uploaded-bytes hot
                is= 0 $ :uploaded-bytes $ gpu/update-frame changed changed
              :tags $ #{} :gpu-component
            %{} 'TestEntry (:name |gpu-cache-identity)
              :code $ quote $ let
                  initial $ gpu/build-batch $ extreme-plan 0
                  failed $ gpu/update-batch initial $ extreme-plan 0.5
                  restored $ gpu/update-batch failed $ extreme-plan 0
                is= 65 $ :candidates initial
                is= 66 $ :candidates failed
                is= (gpu/PreparedFrame :fallback |geometry-outside-f32-domain) (:prepared failed)
                is= 4160 $ :uploaded-bytes $ :delta restored
              :tags $ #{} :gpu-component
            %{} 'TestEntry (:name |scalar-program-domain)
              :code $ quote $ do
                is= (scalar-program/ProgramResult :fallback |scalar-parameters-outside-f32-domain)
                  scalar-program/prepare-program $ extreme-plan 0
                match (scalar-program-at 0.5)
                  (:fallback reason) (is= |ready reason)
                  (:ready program)
                    is= 1 $ count $ :parameters program
              :tags $ #{} :gpu-component
        'reload! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reload! () (main!)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ []
        'scalar-program-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn scalar-program-at (time)
            scalar-program/prepare-program $ fixture/start time 40 false 100
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.gpu-scalar-program/ProgramResult)
            :args $ [] 'Number
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.test.gpu-component-fixture
          :require (quamolit.gpu-component :as gpu) (quamolit.test.retained-component-fixture :as fixture)
            calcit.test :refer $ is=
            quamolit.retained-component :as retained
            quamolit.motion :as motion
            quamolit.gpu-scalar-program :as scalar-program
    'quamolit.test.motion-fixture $ %{} 'FileEntry
      :defs $ {}
        'PresenceFixtureFrame $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct PresenceFixtureFrame
            :samples $ :: 'List 'quamolit.presence/PresenceSample
            :released $ :: 'List 'quamolit.scene-diff/SceneEntry
            :needs-frame 'Bool
          :examples $ []
          :schema $ :: 'StructDef
        'bound-scene-document-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn bound-scene-document-at (time)
            let
                base $ scene-document-at 0
                root $ scene-ir/first-node $ :nodes base
                badge $ scene-ir/first-node $ rest (:nodes base)
                instances $ scene-ir/first-node $ rest
                  rest $ :nodes base
                binding $ scene-ir/ScalarBinding :target (scene-ir/ScalarTarget :x) :motion-id |badge-x :version 1
                bound-badge $ scene-ir/SceneNode :id (:id badge) :parent (:parent badge) :key (:key badge) :content (:content badge) :bindings ([] binding) :interaction $ :interaction badge
                unresolved $ scene-ir/SceneDocument :nodes $ [] root bound-badge instances
                descriptor $ ScalarDescriptor :id |badge-x :version 1 :motion $ ScalarMotion :tween
                  ScalarTween :start 0 :duration 1 :from 80 :to 120 :easing $ Easing :linear
                descriptors $ append (scene-binding/empty-descriptors) descriptor
              scene-binding/resolve-scene unresolved descriptors time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'Number
        'cpu-gpu-reason $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn cpu-gpu-reason ()
            let
                descriptor $ CpuScalarDescriptor :id |test-custom :version 1 :callback-id |test-pure-function :gpu-status $ CpuGpuStatus :unsupported |runtime-callback
              match (:gpu-status descriptor)
                (:unsupported reason) reason
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'String)
            :args $ []
        'draw-reference-scene-at! $ %{} 'CodeEntry
          :doc "|固定时间浏览器夹具：绑定 Scene 由 Quamolit Calcit 绘制纯色矩形；不表示完整 Scene 后端。"
          :code $ quote $ defn draw-reference-scene-at! (context time)
            hint-fn $ {}
              :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'Number
              :return 'Unit
              :features $ #{} :js-ffi
            canvas-reference/draw-reference-rects! context $ bound-scene-document-at time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'Number
            :features $ #{} :js-ffi
        'gpu-fade-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-fade-plan ()
            let
                tween $ ScalarTween :start 0 :duration 1 :from 10 :to 20 :easing $ Easing :linear
                descriptor $ ScalarDescriptor :id |old-fade :version 1 :motion $ ScalarMotion :tween tween
              motion-gpu/lower-scalar descriptor
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion-gpu/GpuScalarLowering)
            :args $ []
        'gpu-keyframes-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-keyframes-plan (mode)
            motion-gpu/lower-scalar $ keyframes-descriptor mode
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion-gpu/GpuScalarLowering)
            :args $ [] 'quamolit.motion/TrackLoop
        'gpu-keyframes-repeat-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-keyframes-repeat-plan ()
            gpu-keyframes-plan $ TrackLoop :repeat
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion-gpu/GpuScalarLowering)
            :args $ []
        'gpu-translation-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-translation-plan ()
            hint-fn $ {}
              :args $ []
              :return 'quamolit.gpu-vec2-translation/GpuVec2TranslationLowering
            gpu-translation/prepare $ gpu-vec2-plan
          :examples $ []
          :schema $ :: 'Fn $ {}
            :return 'quamolit.gpu-vec2-translation/GpuVec2TranslationLowering
            :args $ []
        'gpu-vec2-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gpu-vec2-plan ()
            motion-gpu/lower-vec2 $ vec2-descriptor
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion-gpu/GpuVec2Lowering)
            :args $ []
        'instance-presence-document $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn instance-presence-document (version present?)
            let
                base $ scene-document-at 0
                root $ scene-ir/first-node $ :nodes base
                color $ ColorRgba :r 0.9176470588235294 :g 0.34509803921568627 :b 0.047058823529411764 :a 1
                content $ scene-ir/SceneContent :instances $ scene-ir/InstanceNode :source (scene-ir/InstanceSource :id |particles :version version :count 10000) :width 2 :height 2 :fill color
                item $ scene-ir/SceneNode :id |particles :parent |root :key |particles :content content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                document $ if present?
                  scene-ir/SceneDocument :nodes $ [] root item
                  scene-ir/SceneDocument :nodes $ [] root
              scene-ir/validate-scene document
              , document
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'Number 'Bool
        'instance-presence-reconcile $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn instance-presence-reconcile (model version time present?)
            presence/reconcile-presence model (instance-presence-document version present?) time 0.25 $ Easing :linear
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceUpdate)
            :args $ [] 'quamolit.presence/PresenceModel 'Number 'Number 'Bool
        'keyframes-descriptor $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn keyframes-descriptor (mode)
            let
                f0 $ ScalarKeyframe :at 0 :value 48 :easing $ Easing :linear
                f1 $ ScalarKeyframe :at 0.5 :value 128 :easing $ Easing :linear
                f2 $ ScalarKeyframe :at 0.5 :value 144 :easing $ Easing :linear
                f3 $ ScalarKeyframe :at 1 :value 208 :easing $ Easing :linear
                track $ ScalarTrack :frames ([] f0 f1 f2 f3) :loop mode
              ScalarDescriptor :id |keyframe-track :version 1 :motion $ ScalarMotion :keyframes track
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/ScalarDescriptor)
            :args $ [] 'quamolit.motion/TrackLoop
        'main! $ %{} 'CodeEntry (:doc "|Motion 浏览器入口同时校验 Scene 绑定夹具，确保编译产物包含页面所需的绑定函数。")
          :code $ quote $ defn main! ()
            let
                tween $ ScalarTween :start 0 :duration 1 :from 10 :to 20 :easing $ Easing :linear
                descriptor $ ScalarDescriptor :id |old-fade :version 1 :motion $ ScalarMotion :tween tween
              assert |invalid-bound-scene-fixture $ scene-ir/validate-scene $ bound-scene-document-at 0
              [] (sample-scalar descriptor 1) (sample-scalar descriptor 0) (sample-scalar descriptor 0.5) (sample-scalar descriptor 0.25) (sample-scalar descriptor 1)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'Number
        'presence-document $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-document (mode)
            let
                matrix $ scene-ir/Matrix2D :a 1 :b 0 :c 0 :d 1 :e 0 :f 0
                group-content $ scene-ir/SceneContent :group $ scene-ir/GroupNode :transform matrix :clip (scene-ir/ClipSpec :none) :opacity 1
                blue $ ColorRgba :r 0.11764705882352941 :g 0.5647058823529412 :b 1 :a 1
                orange $ ColorRgba :r 0.9764705882352941 :g 0.45098039215686275 :b 0.08627450980392157 :a 1
                b-content $ scene-ir/SceneContent :rect $ scene-ir/RectNode :x 80 :y 40 :width 48 :height 40 :fill blue
                a-content $ scene-ir/SceneContent :rect $ scene-ir/RectNode :x 100 :y 40 :width 48 :height 40 :fill orange
                root $ scene-ir/SceneNode :id |root :parent | :key |root :content group-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                b $ scene-ir/SceneNode :id |b :parent |root :key |b :content b-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :target |b-click
                a $ scene-ir/SceneNode :id |a :parent |root :key |a :content a-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :target |a-click
              if (= mode |base)
                scene-ir/SceneDocument :nodes $ [] root b
                if (= mode |full)
                  scene-ir/SceneDocument :nodes $ [] root b a
                  if (= mode |reordered)
                    scene-ir/SceneDocument :nodes $ [] root a b
                    raise |unknown-presence-scene
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'String
        'presence-frame-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-frame-at (time reenter?)
            let
                result $ presence-update-at time reenter?
                model $ :model result
              PresenceFixtureFrame :samples (presence/sample-presence model time) :released (:released result) :needs-frame $ presence/presence-needs-frame? model time
          :examples $ []
          :schema $ :: 'Fn $ {}
            :return 'quamolit.test.motion-fixture/PresenceFixtureFrame
            :args $ [] 'Number 'Bool
        'presence-update-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-update-at (time reenter?)
            let
                initial $ presence/start-presence $ presence-document |base
                easing $ Easing :linear
                entered $ if (>= time 0.25)
                  :model $ presence/reconcile-presence initial (presence-document |full) 0.25 0.5 easing
                  , initial
                reordered $ if (>= time 0.5)
                  :model $ presence/reconcile-presence entered (presence-document |reordered) 0.5 0.5 easing
                  , entered
                exiting $ if (>= time 0.75)
                  :model $ presence/reconcile-presence reordered (presence-document |base) 0.75 0.5 easing
                  , reordered
                revived $ if
                  and reenter? $ >= time 0.875
                  :model $ presence/reconcile-presence exiting (presence-document |full) 0.875 0.5 easing
                  , exiting
              presence/settle-presence revived time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceUpdate)
            :args $ [] 'Number 'Bool
        'reload! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reload! () &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ []
        'sample-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-at (time)
            let
                tween $ ScalarTween :start 0 :duration 1 :from 10 :to 20 :easing $ Easing :linear
                descriptor $ ScalarDescriptor :id |old-fade :version 1 :motion $ ScalarMotion :tween tween
              sample-scalar descriptor time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'sample-clock-x $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-clock-x (clock host-time)
            sample-direct-x (host-clock/sample-clock clock host-time) 0 0 false 100 0 0 0 0
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.host-clock/HostClock 'Number
        'sample-color-a-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-color-a-at (time)
            :a $ sample-color-at time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'sample-color-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-color-at (time)
            let
                from $ ColorRgba :r 1 :g 0 :b 0 :a 0
                to $ ColorRgba :r 0 :g 0 :b 1 :a 1
                tween $ ColorTween :start 0 :duration 1 :from from :to to :easing $ Easing :linear
                descriptor $ ColorDescriptor :id |transparent-red-to-blue :version 1 :motion $ ColorMotion :tween tween
              sample-color descriptor time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/ColorRgba)
            :args $ [] 'Number
        'sample-color-b-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-color-b-at (time)
            :b $ sample-color-at time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'sample-color-r-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-color-r-at (time)
            :r $ sample-color-at time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'sample-composition-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-composition-at (time)
            let
                left $ ScalarDescriptor :id |fade :version 1 :motion $ ScalarMotion :tween
                  ScalarTween :start 0 :duration 1 :from 10 :to 20 :easing $ Easing :linear
                right $ ScalarDescriptor :id |clock :version 1 :motion $ ScalarMotion :time 2 1
                composition $ ScalarComposition :id |fade-plus-clock :version 1 :left left :right right :operation $ ScalarComposeOp :add
              sample-scalar-composition composition time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'sample-cpu-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-cpu-at (time)
            let
                sampler $ fn (at)
                  hint-fn $ {}
                    :args $ [] 'Number
                    :return 'Number
                  + 10 $ * at 2
                registry $ register-cpu-scalar
                  CpuScalarRegistry :samplers $ {}
                  , |test-pure-function sampler
                descriptor $ CpuScalarDescriptor :id |test-custom :version 1 :callback-id |test-pure-function :gpu-status $ CpuGpuStatus :unsupported |runtime-callback
              sample-cpu-scalar descriptor time registry
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'sample-direct-x $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-direct-x
            time model input ready viewport model-version input-version resource-version viewport-version
            let
                descriptor $ ScalarDescriptor :id |direct-fade :version 1 :motion $ ScalarMotion :tween
                  ScalarTween :start 0 :duration 1 :from 10 :to 20 :easing $ Easing :linear
                versions $ direct-frame/FrameVersions :component 0 :motion 0 :model model-version :input input-version :resources resource-version :viewport viewport-version
                request $ direct-frame/DirectRequest :id |badge :time time :versions versions :motion descriptor :model model :input input :resources ready :viewport viewport
                evaluate $ fn (motion model input resources viewport time)
                  hint-fn $ {}
                    :args $ [] 'quamolit.motion/ScalarDescriptor 'Number 'Number 'Bool 'Number 'Number
                    :return 'Number
                  +
                    +
                      +
                        + (sample-scalar motion time) model
                        , input
                      if resources 20 0
                    / viewport 10
              :scene $ direct-frame/sample-at request evaluate
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number 'Number 'Number 'Bool 'Number 'Number 'Number 'Number 'Number
        'sample-keyframes-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-keyframes-at (time mode)
            sample-scalar (keyframes-descriptor mode) time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number 'quamolit.motion/TrackLoop
        'sample-keyframes-clamp-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-keyframes-clamp-at (time)
            sample-keyframes-at time $ TrackLoop :clamp
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'sample-keyframes-mirror-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-keyframes-mirror-at (time)
            sample-keyframes-at time $ TrackLoop :mirror
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'sample-keyframes-repeat-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-keyframes-repeat-at (time)
            sample-keyframes-at time $ TrackLoop :repeat
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'sample-simulation-direct $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-simulation-direct (tick)
            let
                update-state $ fn (state input dt seed)
                  hint-fn $ {}
                    :args $ [] 'Number 'Number 'Number 'Number
                    :return 'Number
                  + state $ * input dt
                inputs $ {} (1 2) (2 4) (3 -2) (4 0)
                initial $ start-simulation 0.25 7 0
              :state $ advance-simulation initial tick inputs 4 update-state
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'sample-simulation-staged $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-simulation-staged (tick)
            let
                update-state $ fn (state input dt seed)
                  hint-fn $ {}
                    :args $ [] 'Number 'Number 'Number 'Number
                    :return 'Number
                  + state $ * input dt
                inputs $ {} (1 2) (2 4) (3 -2) (4 0)
                initial $ start-simulation 0.25 7 0
              if (<= tick 2)
                :state $ advance-simulation initial tick inputs 2 update-state
                let
                    checkpoint $ advance-simulation initial 2 inputs 2 update-state
                  :state $ advance-simulation checkpoint tick inputs 2 update-state
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'sample-vec2-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-vec2-at (time)
            sample-vec2 (vec2-descriptor) time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/Vec2)
            :args $ [] 'Number
        'sample-vec2-x-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-vec2-x-at (time)
            :x $ sample-vec2-at time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'sample-vec2-y-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-vec2-y-at (time)
            :y $ sample-vec2-at time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'scene-delta-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn scene-delta-at (previous-time current-time)
            scene-diff/diff-scene (scene-document-at previous-time) (scene-document-at current-time) previous-time current-time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-diff/SceneDelta)
            :args $ [] 'Number 'Number
        'scene-document-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn scene-document-at (time)
            let
                matrix $ scene-ir/Matrix2D :a 1 :b 0 :c 0 :d 1 :e 0 :f 0
                color $ ColorRgba :r 0.9176470588235294 :g 0.34509803921568627 :b 0.047058823529411764 :a 1
                group-content $ scene-ir/SceneContent :group $ scene-ir/GroupNode :transform matrix :clip (scene-ir/ClipSpec :none) :opacity 1
                x $ * 4 $ sample-direct-x time 0 0 false 100 0 0 0 0
                rect-content $ scene-ir/SceneContent :rect $ scene-ir/RectNode :x x :y 42 :width 16 :height 16 :fill color
                instance-content $ scene-ir/SceneContent :instances $ scene-ir/InstanceNode :source (scene-ir/InstanceSource :id |particles :version 1 :count 10000) :width 2 :height 2 :fill color
                group $ scene-ir/SceneNode :id |root :parent | :key |root :content group-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                badge $ scene-ir/SceneNode :id |badge :parent |root :key |badge :content rect-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :target |badge-click
                instances $ scene-ir/SceneNode :id |particles :parent |root :key |particles :content instance-content :bindings ([]) :interaction $ scene-ir/SceneInteraction :none
                document $ scene-ir/SceneDocument :nodes $ [] group badge instances
              scene-ir/validate-scene document
              , document
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'Number
        'transition-active-at? $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn transition-active-at? (time)
            transition/replay-active? (transition-initial) (transition-events) time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'Number
        'transition-events $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn transition-events ()
            let
                easing $ Easing :linear
                first-event $ transition/TransitionEvent :at 0.5 :to 40 :duration 0.5 :easing easing
                second-event $ transition/TransitionEvent :at 0.75 :to 120 :duration 0.5 :easing easing
              append
                append (transition/empty-events) first-event
                , second-event
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.transition/TransitionEvent
        'transition-initial $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn transition-initial ()
            transition/start-transition |badge 80 120 0 1 $ Easing :linear
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.transition/TransitionIntent)
            :args $ []
        'transition-x-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn transition-x-at (time)
            transition/sample-replay (transition-initial) (transition-events) time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number
        'vec2-descriptor $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn vec2-descriptor ()
            let
                from $ Vec2 :x 48 :y 80
                to $ Vec2 :x 208 :y 120
                tween $ Vec2Tween :start 0 :duration 1 :from from :to to :easing $ Easing :linear
              Vec2Descriptor :id |moving-rect :version 1 :motion $ Vec2Motion :tween tween
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.motion/Vec2Descriptor)
            :args $ []
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.test.motion-fixture
          :require
            quamolit.motion :refer $ Easing ScalarTween ScalarMotion ScalarDescriptor sample-scalar Vec2 Vec2Tween Vec2Motion Vec2Descriptor sample-vec2 ScalarKeyframe ScalarTrack TrackLoop ColorRgba ColorTween ColorMotion ColorDescriptor sample-color ScalarComposeOp ScalarComposition sample-scalar-composition CpuScalarDescriptor CpuGpuStatus CpuScalarRegistry register-cpu-scalar sample-cpu-scalar
            quamolit.fixed-step :refer $ start-simulation advance-simulation
            quamolit.direct-frame :as direct-frame
            quamolit.host-clock :as host-clock
            quamolit.scene-ir :as scene-ir
            quamolit.scene-diff :as scene-diff
            quamolit.scene-binding :as scene-binding
            quamolit.transition :as transition
            quamolit.presence :as presence
            quamolit.motion-gpu :as motion-gpu
            quamolit.canvas-reference :as canvas-reference
            quamolit.gpu-vec2-translation :as gpu-translation
    'quamolit.test.playback-fixture $ %{} 'FileEntry
      :defs $ {}
        'PlaybackFixtureFrame $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct PlaybackFixtureFrame (:animation-time 'Number) (:value 'Number) (:tick 'Number) (:state 'Number) (:ready 'Bool)
          :examples $ []
          :schema $ :: 'StructDef
        'main! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn main! ()
            :value $ playback-frame-at (host-clock/start-clock 10 0 1) 10 false
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ []
        'make-playback-request $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn make-playback-request (ready)
            let
                descriptor $ ScalarDescriptor :id |playback-fade :version 1 :motion $ ScalarMotion :tween
                  ScalarTween :start 0 :duration 1 :from 10 :to 20 :easing $ Easing :linear
                versions $ direct-frame/FrameVersions :component 0 :motion 0 :model 0 :input 0 :resources (if ready 1 0) :viewport 0
              direct-frame/DirectRequest :id |playback-badge :time 0 :versions versions :motion descriptor :model 5 :input 0 :resources ready :viewport 100
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Bool
            :return $ :: 'quamolit.direct-frame/DirectRequest 'quamolit.motion/ScalarDescriptor 'Number 'Number 'Bool 'Number
        'playback-frame-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn playback-frame-at (timeline host-time ready)
            let
                request $ make-playback-request ready
                evaluate $ fn (motion model input resources viewport time)
                  hint-fn $ {}
                    :args $ [] 'quamolit.motion/ScalarDescriptor 'Number 'Number 'Bool 'Number 'Number
                    :return 'Number
                  + (sample-scalar motion time) model input (if resources 20 0) (/ viewport 10)
                mapped $ playback/request-at-host timeline host-time request
                direct-frame $ direct-frame/sample-at mapped evaluate
                inputs $ {} (1 2) (2 4) (3 -2) (4 0)
                update-state $ fn (state input dt seed)
                  hint-fn $ {}
                    :args $ [] 'Number 'Number 'Number 'Number
                    :return 'Number
                  + state $ * input dt
                simulation $ playback/advance-to-host timeline host-time (start-simulation 0.25 7 0) inputs 4 update-state
              PlaybackFixtureFrame :animation-time (:time direct-frame) :value (:scene direct-frame) :tick (:tick simulation) :state (:state simulation) :ready ready
          :examples $ []
          :schema $ :: 'Fn $ {}
            :return 'quamolit.test.playback-fixture/PlaybackFixtureFrame
            :args $ [] 'quamolit.host-clock/HostClock 'Number 'Bool
          :tests $ [] $ %{} 'TestEntry (:name |fixed-time-reference)
            :code $ quote $ let
                running $ host-clock/start-clock 10 0 1
                paused $ host-clock/pause-clock running 10.5
                seeked $ host-clock/seek-clock paused 20 0.25
                at-zero $ playback-frame-at running 10 false
                middle $ playback-frame-at running 10.5 false
                ready $ playback-frame-at paused 20 true
                rewound $ playback-frame-at seeked 20 false
                finished $ playback-frame-at running 11 false
              is=
                PlaybackFixtureFrame :animation-time 0 :value 25 :tick 0 :state 0 :ready false
                , at-zero
              is=
                PlaybackFixtureFrame :animation-time 0.5 :value 30 :tick 2 :state 1.5 :ready false
                , middle
              is=
                PlaybackFixtureFrame :animation-time 0.5 :value 50 :tick 2 :state 1.5 :ready true
                , ready
              is=
                PlaybackFixtureFrame :animation-time 0.25 :value 27.5 :tick 1 :state 0.5 :ready false
                , rewound
              is=
                PlaybackFixtureFrame :animation-time 1 :value 35 :tick 4 :state 1 :ready false
                , finished
            :tags $ #{} :playback :unit
        'reload! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reload! () &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ []
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.test.playback-fixture
          :require
            quamolit.motion :refer $ Easing ScalarTween ScalarMotion ScalarDescriptor sample-scalar
            quamolit.fixed-step :refer $ start-simulation
            quamolit.direct-frame :as direct-frame
            quamolit.host-clock :as host-clock
            quamolit.playback :as playback
            calcit.test :refer $ is=
    'quamolit.test.replay-archive-fixture $ %{} 'FileEntry
      :defs $ {}
        'checkpoint-count $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn checkpoint-count ()
            count $ :checkpoints $ make-archive
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ []
        'input-count $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn input-count ()
            count $ :inputs $ make-archive
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ []
        'main! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn main! ()
            [] (sample-at 6 0) (sample-at 0 0) (sample-at 2 2) (sample-at 4 0) (sample-at 5 1)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'Number
        'make-archive $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn make-archive ()
            let
                base-archive $ assert-type
                  archive/start-archive (fixed/start-simulation 0.25 7 0) 2 2
                  :: 'quamolit.replay-archive/ReplayArchive 'Number 'Number
                a1 $ archive/record-input base-archive 2 update-state
                a2 $ archive/record-input a1 4 update-state
                a3 $ archive/record-input a2 -2 update-state
                a4 $ archive/record-input a3 0 update-state
                a5 $ archive/record-input a4 6 update-state
              archive/record-input a5 -2 update-state
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'quamolit.replay-archive/ReplayArchive 'Number 'Number
        'reload! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reload! () (main!)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'Number
        'sample-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-at (tick budget)
            :state $ archive/sample-archive-at (make-archive) tick budget update-state
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number 'Number
        'update-state $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-state (state input dt seed)
            + state $ * input dt
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'Number 'Number 'Number 'Number
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.test.replay-archive-fixture
          :require (quamolit.replay-archive :as archive) (quamolit.fixed-step :as fixed)
    'quamolit.test.retained-component-fixture $ %{} 'FileEntry
      :defs $ {}
        'declare-demo $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn declare-demo (props model input resources viewport)
            let
                moving $ badge/declare-badge props model input resources viewport
                tiles $ map (range 64)
                  fn (index)
                    hint-fn $ {}
                      :args $ [] 'Number
                      :return 'quamolit.scene-ir/SceneNode
                    let
                        id $ str |tile- index
                        color $ motion/ColorRgba :r 0.87 :g 0.9 :b 0.94 :a 1
                        rect $ scene/RectNode :x
                          + 16 $ * 18 $ - index
                            * 16 $ floor $ / index 16
                          , :y
                            + 100 $ * 18 $ floor (/ index 16)
                            , :width 12 :height 12 :fill color
                      scene/SceneNode :id id :parent | :key id :content (scene/SceneContent :rect rect) :bindings ([]) :interaction $ scene/SceneInteraction :none
              component/ComponentDeclaration :scene
                scene/SceneDocument :nodes $ concat tiles $ :nodes (:scene moving)
                , :motions $ :motions moving
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.component-sample/ComponentDeclaration)
            :args $ [] 'Number 'Number 'Number 'Bool 'Number
        'declare-mixed $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn declare-mixed (props model input resources viewport)
            let
                base $ declare-demo props model input resources viewport
                path $ scene/SceneNode :id |mixed-path :parent | :key |mixed-path :bindings ([]) :interaction (scene/SceneInteraction :none) :content $ scene/SceneContent :polyline
                  scene/PolylineNode :width 4 :stroke
                    motion/ColorRgba :r 0 :g 0.5 :b 1 :a 0.5
                    , :points $ [] (motion/Vec2 :x 40 :y 60) (motion/Vec2 :x 80 :y 70)
                nodes $ conj
                  :nodes $ :scene base
                  , path
              retained/ExecutionDeclaration :component
                struct-with base $ :scene $ scene/SceneDocument :nodes nodes
                , :transforms $ retained/TransformSampler :cpu $ fn (time)
                  map nodes $ fn (node)
                    scene/Matrix2D :a 1 :b 0 :c 0 :d 1 :e
                      if
                        = |mixed-path $ :id node
                        + model $ * 10 time
                        , 0
                      , :f 0
          :examples $ []
          :schema $ :: 'Fn $ {}
            :return 'quamolit.retained-component/ExecutionDeclaration
            :args $ [] 'Number 'Number 'Number 'Bool 'Number
        'draw-plan! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-plan! (context plan)
            canvas/draw-reference-rects! context $ :scene plan
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'quamolit.retained-component/ComponentPlan
            :features $ #{} :js-ffi
        'draw-reference! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn draw-reference! (context time model ready viewport)
            canvas/draw-reference-rects! context $ reference-at time model ready viewport
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ [] 'js-ffi.canvas-batches/CanvasContextHost 'Number 'Number 'Bool 'Number
            :features $ #{} :js-ffi
        'main! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn main! ()
            let
                first-plan $ start 0.5 40 false 100
                final-plan $ verify-sequence ([] 1 0 0.5 0.25 1) first-plan
              and
                = 1 $ :declarations final-plan
                = 1 $ :plan-builds final-plan
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ []
          :tests $ [] $ %{} 'TestEntry (:name |retained-component-replay)
            :code $ quote $ assert= true (main!)
        'make-request $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn make-request (time model ready viewport) (badge/make-request time model ready viewport)
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ [] 'Number 'Number 'Bool 'Number
            :return $ :: 'quamolit.component-sample/ComponentRequest 'Number 'Number 'Number 'Bool 'Number
        'plan-scene $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn plan-scene (plan) (:scene plan)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'quamolit.retained-component/ComponentPlan
        'presence-document $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-document ()
            let
                nodes $ :nodes $ :scene
                  :component $ declare-mixed 0 40 0 false 100
                rect $ &list:nth nodes 64
                path $ &list:nth nodes 65
              scene/SceneDocument :nodes $ []
                struct-with rect
                  :bindings $ []
                  :interaction $ scene/SceneInteraction :target |badge
                , path
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ []
        'presence-exit $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-exit ()
            :model $ presence/reconcile-presence (presence-initial)
              scene/SceneDocument :nodes $ []
              , 0 1 $ motion/Easing :linear
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceModel)
            :args $ []
        'presence-initial $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-initial ()
            presence/start-presence $ presence-document
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.presence/PresenceModel)
            :args $ []
        'presence-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn presence-plan (model time)
            retained/build-execution-plan (make-request time 40 false 100)
              fn (props ignored input resources viewport)
                retained/ExecutionDeclaration :component
                  presence-component/declare-flat model $ binding/empty-descriptors
                  , :transforms $ retained/TransformSampler :none
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.presence/PresenceModel 'Number
          :tests $ [] $ %{} 'TestEntry (:name |presence-binding-continuity)
            :code $ quote $ let
                exiting $ presence-exit
                midpoint $ presence-plan exiting 0.5
                revived $ :model $ presence/reconcile-presence exiting (presence-document) 0.5 1 (motion/Easing :linear)
                resumed $ presence-plan revived 0.5
                completed $ presence/settle-presence exiting 1
              is= 2 $ count $ :nodes (:scene midpoint)
              is= 0.5 $ presence-component/leaf-alpha $ :content
                &list:nth
                  :nodes $ :scene midpoint
                  , 0
              is= 0.25 $ presence-component/leaf-alpha $ :content
                &list:nth
                  :nodes $ :scene midpoint
                  , 1
              is= (:scene midpoint)
                struct-with (:scene resumed)
                  :nodes $ map
                    :nodes $ :scene resumed
                    fn (node)
                      struct-with node $ :interaction $ scene/SceneInteraction :none
              is= 2 $ count $ :released completed
              is= 0 $ count $ :released
                presence/settle-presence (:model completed) 1
              is= false $ presence/presence-needs-frame? (:model completed) 1
              is-throws $ retained/sample-plan-at midpoint $ / 1 0
            :tags $ #{} :presence-component
        'reference-at $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reference-at (time model ready viewport)
            :scene $ component/sample-component-at (make-request time model ready viewport) declare-demo
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.scene-ir/SceneDocument)
            :args $ [] 'Number 'Number 'Bool 'Number
        'reload! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn reload! () (main!)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ []
        'start $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn start (time model ready viewport)
            retained/build-component-plan (make-request time model ready viewport) declare-demo
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'Number 'Number 'Bool 'Number
        'start-mixed $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn start-mixed (time model ready viewport)
            retained/build-execution-plan (make-request time model ready viewport) declare-mixed
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'Number 'Number 'Bool 'Number
        'update-mixed $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-mixed (plan time model ready viewport)
            retained/update-execution-plan plan (make-request time model ready viewport) declare-mixed
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'Number 'Number 'Bool 'Number
        'update-plan $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn update-plan (previous time model ready viewport)
            retained/update-component-plan previous (make-request time model ready viewport) declare-demo
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] 'quamolit.retained-component/ComponentPlan 'Number 'Number 'Bool 'Number
        'verify-sequence $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn verify-sequence (times plan)
            if (empty? times) plan $ let
                time $ -> (first times) .unwrap
                next $ update-plan plan time 40 false 100
              assert= (reference-at time 40 false 100) (:scene next)
              recur (rest times) next
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.retained-component/ComponentPlan)
            :args $ [] (:: 'List 'Number) 'quamolit.retained-component/ComponentPlan
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.test.retained-component-fixture
          :require (quamolit.retained-component :as retained) (quamolit.component-sample :as component) (quamolit.test.component-fixture :as badge) (quamolit.direct-frame :as direct) (quamolit.scene-ir :as scene) (quamolit.motion :as motion) (quamolit.canvas-reference :as canvas) (quamolit.presence :as presence) (quamolit.presence-component :as presence-component)
            calcit.test :refer $ is= is-throws
            quamolit.scene-binding :as binding
    'quamolit.transition $ %{} 'FileEntry
      :defs $ {}
        'TransitionEvent $ %{} 'CodeEntry (:doc "|固定输入日志中的一次目标变更；事件时间必须按非降序排列。")
          :code $ quote $ defstruct TransitionEvent (:at 'Number) (:to 'Number) (:duration 'Number) (:easing 'quamolit.motion/Easing)
          :examples $ []
          :schema $ :: 'StructDef
        'TransitionIntent $ %{} 'CodeEntry (:doc "|组件 key 与显式 ScalarTween 意图；只保证位置连续的 CPU 过渡模型。")
          :code $ quote $ defstruct TransitionIntent (:key 'String) (:tween 'quamolit.motion/ScalarTween)
          :examples $ []
          :schema $ :: 'StructDef
        'empty-events $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn empty-events () ([])
          :examples $ []
          :schema $ :: 'Fn $ {}
            :args $ []
            :return $ :: 'List 'quamolit.transition/TransitionEvent
        'first-event $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn first-event (events)
            -> (first events) .unwrap
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.transition/TransitionEvent)
            :args $ [] $ :: 'List 'quamolit.transition/TransitionEvent
        'interrupt-transition $ %{} 'CodeEntry (:doc "|在打断时间采样旧意图，并以该值作为新意图的 from。")
          :code $ quote $ defn interrupt-transition (intent to at duration easing)
            if
              < at $ :start $ :tween intent
              raise |retroactive-transition-event
              start-transition (:key intent) (sample-transition intent at) to at duration easing
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.transition/TransitionIntent)
            :args $ [] 'quamolit.transition/TransitionIntent 'Number 'Number 'Number 'quamolit.motion/Easing
          :tests $ [] $ %{} 'TestEntry (:name |interrupt-continuity-quarter-half-three-quarter)
            :code $ quote $ let
                easing $ motion/Easing :linear
                initial $ start-transition |badge 0 100 0 1 easing
                at-quarter $ interrupt-transition initial 200 0.25 1 easing
                at-half $ interrupt-transition initial 200 0.5 1 easing
                at-three-quarter $ interrupt-transition initial 200 0.75 1 easing
                again $ interrupt-transition at-quarter -20 0.5 1 easing
                instant $ interrupt-transition initial 20 0.5 0 easing
              is= 25 $ sample-transition at-quarter 0.25
              is= 50 $ sample-transition at-half 0.5
              is= 75 $ sample-transition at-three-quarter 0.75
              is= 68.75 $ sample-transition at-quarter 0.5
              is= 87.5 $ sample-transition at-half 0.75
              is= 106.25 $ sample-transition at-three-quarter 1
              is= 68.75 $ sample-transition again 0.5
              is= 46.5625 $ sample-transition again 0.75
              is= 50 $ sample-transition instant 0.499
              is= 20 $ sample-transition instant 0.5
              is= true $ transition-active? initial 0.5
              is= false $ transition-active? initial 1
              is= false $ transition-active? instant 0.5
            :tags $ #{} :transition :unit
        'replay-active? $ %{} 'CodeEntry (:doc "|重放到给定时间后判断是否仍需连续过渡帧。")
          :code $ quote $ defn replay-active? (initial events time)
            do (replay-transition initial events)
              transition-active? (replay-prefix-until initial events time) time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.transition/TransitionIntent (:: 'List 'quamolit.transition/TransitionEvent) 'Number
        'replay-prefix $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn replay-prefix (intent events)
            if (empty? events) intent $ let
                event $ first-event events
                next $ interrupt-transition intent (:to event) (:at event) (:duration event) (:easing event)
              recur next $ rest events
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.transition/TransitionIntent)
            :args $ [] 'quamolit.transition/TransitionIntent $ :: 'List 'quamolit.transition/TransitionEvent
        'replay-prefix-until $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn replay-prefix-until (intent events time)
            if (empty? events) intent $ let
                event $ first-event events
              if
                > (:at event) time
                , intent $ recur
                  interrupt-transition intent (:to event) (:at event) (:duration event) (:easing event)
                  rest events
                  , time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.transition/TransitionIntent)
            :args $ [] 'quamolit.transition/TransitionIntent (:: 'List 'quamolit.transition/TransitionEvent) 'Number
        'replay-transition $ %{} 'CodeEntry (:doc "|按非降序事件序列重建最终过渡意图。")
          :code $ quote $ defn replay-transition (initial events) (replay-prefix initial events)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.transition/TransitionIntent)
            :args $ [] 'quamolit.transition/TransitionIntent $ :: 'List 'quamolit.transition/TransitionEvent
          :tests $ [] $ %{} 'TestEntry (:name |fixed-events-and-invalid-input)
            :code $ quote $ let
                easing $ motion/Easing :linear
                initial $ start-transition |badge 0 100 0 1 easing
                first-event $ TransitionEvent :at 0.25 :to 200 :duration 1 :easing easing
                second-event $ TransitionEvent :at 0.5 :to -20 :duration 1 :easing easing
                third-event $ TransitionEvent :at 0.5 :to 40 :duration 1 :easing easing
                events $ append
                  append
                    append (empty-events) first-event
                    , second-event
                  , third-event
                final $ replay-transition initial events
              is= 68.75 $ sample-transition final 0.5
              is= 61.5625 $ sample-transition final 0.75
              is= 40 $ sample-transition final 1.5
              is= 61.5625 $ sample-transition (replay-transition initial events) 0.75
              is-throws $ replay-transition initial $ append
                append (empty-events) second-event
                , first-event
              is-throws $ interrupt-transition initial 20 -0.1 1 easing
              is-throws $ interrupt-transition initial 20 0.5 -1 easing
              is-throws $ interrupt-transition initial (/ 0 0) 0.5 1 easing
            :tags $ #{} :transition :unit
        'sample-replay $ %{} 'CodeEntry (:doc "|按固定事件序列在任意绝对时间重放并采样，不依赖上一次绘制帧。")
          :code $ quote $ defn sample-replay (initial events time)
            do (replay-transition initial events)
              sample-transition (replay-prefix-until initial events time) time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.transition/TransitionIntent (:: 'List 'quamolit.transition/TransitionEvent) 'Number
          :tests $ [] $ %{} 'TestEntry (:name |arbitrary-time-replay)
            :code $ quote $ let
                easing $ motion/Easing :linear
                initial $ start-transition |badge 80 120 0 1 easing
                event-a $ TransitionEvent :at 0.5 :to 40 :duration 0.5 :easing easing
                event-b $ TransitionEvent :at 0.75 :to 120 :duration 0.5 :easing easing
                events $ append
                  append (empty-events) event-a
                  , event-b
              is= 80 $ sample-replay initial events 0
              is= 90 $ sample-replay initial events 0.25
              is= 100 $ sample-replay initial events 0.5
              is= 85 $ sample-replay initial events 0.625
              is= 70 $ sample-replay initial events 0.75
              is= 95 $ sample-replay initial events 1
              is= 120 $ sample-replay initial events 1.25
              is= 90 $ sample-replay initial events 0.25
              is= true $ replay-active? initial events 1
              is= false $ replay-active? initial events 1.25
              is-throws $ sample-replay initial events $ / 0 0
            :tags $ #{} :transition :unit
        'sample-transition $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn sample-transition (intent time)
            if
              empty? $ :key intent
              raise |empty-transition-key
              motion/sample-tween (:tween intent) time
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.transition/TransitionIntent 'Number
        'start-transition $ %{} 'CodeEntry (:doc "|构造带 key 的标量过渡意图并验证全部数值。")
          :code $ quote $ defn start-transition (key from to start duration easing)
            if (empty? key) (raise |empty-transition-key)
              let
                  tween $ motion/ScalarTween :start start :duration duration :from from :to to :easing easing
                motion/sample-tween tween start
                TransitionIntent :key key :tween tween
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.transition/TransitionIntent)
            :args $ [] 'String 'Number 'Number 'Number 'Number 'quamolit.motion/Easing
        'transition-active? $ %{} 'CodeEntry (:doc "|当前时间段是否需要连续请求过渡帧；终点后为 false。")
          :code $ quote $ defn transition-active? (intent time)
            let
                tween $ :tween intent
              if
                not $ motion/finite-number? time
                raise |invalid-transition-time
                and
                  not= (:from tween) (:to tween)
                  > (:duration tween) 0
                  >= time $ :start tween
                  < time $ + (:start tween) (:duration tween)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.transition/TransitionIntent 'Number
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.transition
          :require (quamolit.motion :as motion)
            calcit.test :refer $ is= is-throws
    'quamolit.types $ %{} 'FileEntry
      :defs $ {}
        'Component $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct Component (:name 'Dynamic) (:on-tick 'Dynamic) (:tree 'Dynamic)
          :examples $ []
          :schema $ :: 'StructDef
        'Shape $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defstruct Shape (:name 'Dynamic) (:style 'Dynamic) (:event 'Dynamic) (:children 'Dynamic)
          :examples $ []
          :schema $ :: 'StructDef
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.types
    'quamolit.util.detect $ %{} 'FileEntry
      :defs $ {}
        '=seq $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn =seq (xs ys)
            let
                xs-empty? $ empty? xs
                ys-empty? $ empty? ys
              if (and xs-empty? ys-empty?) true $ if (or xs-empty? ys-empty?) false $ if
                identical? (first xs) (first ys)
                recur (rest xs) (rest ys)
                , false
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'compare-more $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn compare-more (x y)
            let
                tx $ type-as-int x
                ty $ type-as-int y
              if (identical? tx ty) (compare-number x y) (compare-number tx ty)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'compare-number $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn compare-number (x y)
            cond
                &< x y
                , -1
              (&> x y) 1
              true 0
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
        'type-as-int $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn type-as-int (x)
            cond
                number? x
                , 0
              (keyword? x) 1
              (string? x) 2
              :else 3
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.util.detect
    'quamolit.util.keyboard $ %{} 'FileEntry
      :defs $ {} $ 'keycode->key
        %{} 'CodeEntry (:doc |)
          :code $ quote $ defn keycode->key (k shift?)
            if
              and (<= k 90) (>= k 65)
              let
                  letter $ unsafe-coerce (js/String.fromCharCode k) String
                if shift? letter $ .!toLowerCase letter
              , |
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.util.keyboard
    'quamolit.util.ref $ %{} 'FileEntry
      :defs $ {}
        'new-ref $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn new-ref (x) (js-array x)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
            :features $ #{} :js-ffi
        'ref-get $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn ref-get (o) (.-0 o)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic
            :features $ #{} :js-ffi
        'ref-set! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn ref-set! (o v)
            set! (.-0 o) v
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Dynamic
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.util.ref
    'quamolit.util.string $ %{} 'FileEntry
      :defs $ {}
        '*counter $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *counter 0
          :examples $ []
          :schema $ :: 'Dynamic
        'gen-id! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn gen-id! ()
            do (swap! *counter inc) @*counter
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ []
        'hsl $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn hsl (h s l & alpha)
            if (empty? alpha)
              str |hsl $ h |, s |%, l |%
              let
                  a $ &list:first alpha
                str |hsla $ h |, s |%, l |%, a |
          :examples $ []
          :schema $ :: 'Fn $ {} (:rest 'Dynamic) (:return 'String)
            :args $ [] 'Dynamic 'Dynamic 'Dynamic
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.util.string
    'quamolit.util.time $ %{} 'FileEntry
      :defs $ {} $ 'get-tick
        %{} 'CodeEntry (:doc |)
          :code $ quote $ defn get-tick ()
            * 0.001 $ js-ffi.shared/performance-now
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ []
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.util.time
    'quamolit.webgpu-batches $ %{} 'FileEntry
      :defs $ {}
        'RectBatchHost $ %{} 'CodeEntry
          :doc "|Quamolit 矩形图层的 WebGPU 宿主句柄；只由本仓库 create! 创建，调用方负责 dispose!。"
          :code $ quote $ deftrait RectBatchHost
            .upload $ :: 'Fn $ {}
              :args $ [] 'quamolit.webgpu-batches/RectBatchHost 'js-ffi.typed-arrays/Float32ArrayHost 'Number 'Number
              :return 'JsObject
            .draw $ :: 'Fn $ {}
              :args $ [] 'quamolit.webgpu-batches/RectBatchHost 'JsObject
              :return 'JsObject
            .read-translation $ :: 'Fn $ {}
              :args $ [] 'quamolit.webgpu-batches/RectBatchHost
              :return 'JsObject
            .read-pixel $ :: 'Fn $ {}
              :args $ [] 'quamolit.webgpu-batches/RectBatchHost 'Number 'Number
              :return 'JsObject
            .dispose $ :: 'Fn $ {}
              :args $ [] 'quamolit.webgpu-batches/RectBatchHost
              :return 'Bool
          :examples $ []
          :ffi $ {} (:backend :js) (:kind :external-object) (:target :browser)
          :schema $ :: 'Trait
        'RectColor $ %{} 'CodeEntry (:doc "|矩形图层的 RGBA 直通道颜色；shader 输出时转预乘 alpha。")
          :code $ quote $ defstruct RectColor (:r 'Number) (:g 'Number) (:b 'Number) (:a 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'RectMetrics $ %{} 'CodeEntry (:doc "|单次矩形图层绘制的批次、实例、上传及资源创建指标。")
          :code $ quote $ defstruct RectMetrics (:draw-calls 'Number) (:instances 'Number) (:position-bytes-uploaded 'Number) (:uniform-bytes-uploaded 'Number) (:pipelines-created 'Number) (:buffers-created 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'RectPixel $ %{} 'CodeEntry (:doc "|测试诊断读回的单个 RGBA 像素。")
          :code $ quote $ defstruct RectPixel (:r 'Number) (:g 'Number) (:b 'Number) (:a 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'RectTranslation $ %{} 'CodeEntry (:doc "|Quamolit 矩形图层共享的 Vec2 绝对时间位移参数。")
          :code $ quote $ defstruct RectTranslation (:from 'quamolit.webgpu-batches/RectVec2) (:to 'quamolit.webgpu-batches/RectVec2) (:time 'Number) (:start 'Number) (:duration 'Number) (:easing 'String)
          :examples $ []
          :schema $ :: 'StructDef
        'RectTranslationSample $ %{} 'CodeEntry (:doc "|GPU 诊断读回的单个 f32 Vec2 位移样本。")
          :code $ quote $ defstruct RectTranslationSample (:x 'Number) (:y 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'RectVec2 $ %{} 'CodeEntry (:doc "|Quamolit 矩形图层的实际像素坐标二维向量。")
          :code $ quote $ defstruct RectVec2 (:x 'Number) (:y 'Number)
          :examples $ []
          :schema $ :: 'StructDef
        'clear! $ %{} 'CodeEntry (:doc "|提交零实例帧，在完整图层边界清屏。")
          :code $ quote $ defn clear! (batch)
            hint-fn $ {}
              :args $ [] 'quamolit.webgpu-batches/RectBatchHost
              :return 'quamolit.webgpu-batches/RectMetrics
              :features $ #{} :js-ffi
            draw! batch 0 0 (color 1 1 1 1) 1 (%none) (%some 0)
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
          :schema $ :: 'Fn $ {} (:return 'quamolit.webgpu-batches/RectMetrics)
            :args $ [] 'quamolit.webgpu-batches/RectBatchHost
            :features $ #{} :js-ffi
        'color $ %{} 'CodeEntry (:doc "|把 Scene 颜色数值构造成 Quamolit 的类型化 RGBA。")
          :code $ quote $ defn color (r g b a)
            hint-fn $ {}
              :args $ [] 'Number 'Number 'Number 'Number
              :return 'quamolit.webgpu-batches/RectColor
            RectColor :r r :g g :b b :a a
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
          :schema $ :: 'Fn $ {} (:return 'quamolit.webgpu-batches/RectColor)
            :args $ [] 'Number 'Number 'Number 'Number
        'create! $ %{} 'CodeEntry (:doc "|创建保留式 GPU 实例图层，所有权留给调用者。")
          :code $ quote $ defn create! (canvas device format capacity)
            hint-fn $ {} (:async true)
              :args $ [] 'js-ffi.browser/DomElementHost 'js-ffi.webgpu/DeviceHost 'String 'Number
              :return 'quamolit.webgpu-batches/RectBatchHost
              :features $ #{} :js-ffi
            let
                create $ unsafe-coerce createFloat32RectBatch $ :: 'Fn
                  {} (:async true)
                    :args $ [] 'js-ffi.browser/DomElementHost 'js-ffi.webgpu/DeviceHost 'String 'Number
                    :return 'quamolit.webgpu-batches/RectBatchHost
              js-await $ create canvas device format capacity
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
          :schema $ :: 'Fn $ {} (:async true) (:return 'quamolit.webgpu-batches/RectBatchHost)
            :args $ [] 'js-ffi.browser/DomElementHost 'js-ffi.webgpu/DeviceHost 'String 'Number
            :features $ #{} :js-ffi
        'dispose! $ %{} 'CodeEntry (:doc "|幂等释放图层宿主资源，不释放调用者持有的 device。")
          :code $ quote $ defn dispose! (batch)
            hint-fn $ {}
              :args $ [] 'quamolit.webgpu-batches/RectBatchHost
              :return 'Bool
              :features $ #{} :js-ffi
            batch .dispose
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
          :schema $ :: 'Fn $ {} (:return 'Bool)
            :args $ [] 'quamolit.webgpu-batches/RectBatchHost
            :features $ #{} :js-ffi
        'draw! $ %{} 'CodeEntry (:doc "|提交一个实例图层帧；缺省 count 复用活跃实例，count=0 清空画布。")
          :code $ quote $ defn draw! (batch width height fill alpha motion instance-count)
            hint-fn $ {}
              :args $ [] 'quamolit.webgpu-batches/RectBatchHost 'Number 'Number 'quamolit.webgpu-batches/RectColor 'Number (:: 'calcit.core/Option 'quamolit.webgpu-batches/RectTranslation) (:: 'calcit.core/Option 'Number)
              :return 'quamolit.webgpu-batches/RectMetrics
              :features $ #{} :js-ffi
            let
                translation $ if (option:some? motion)
                  let
                      tween $ option:unwrap motion
                      from $ :from tween
                      to $ :to tween
                    js-object
                      :from $ js-object
                        :x $ :x from
                        :y $ :y from
                      :to $ js-object
                        :x $ :x to
                        :y $ :y to
                      :time $ :time tween
                      :start $ :start tween
                      :duration $ :duration tween
                      :easing $ :easing tween
                  , js/undefined
                draw-count $ if (option:some? instance-count) (option:unwrap instance-count) js/undefined
                options $ js-object (:width width) (:height height)
                  :fill $ js-object
                    :r $ :r fill
                    :g $ :g fill
                    :b $ :b fill
                    :a $ :a fill
                  :alpha alpha
                  :translation translation
                  :count draw-count
                result $ batch .draw options
                draws $ contract/expect-number |RectBatch.drawCalls $ contract/object-field |RectBatch.draw result |drawCalls
                instances $ contract/expect-number |RectBatch.instances $ contract/object-field |RectBatch.draw result |instances
                uploaded $ contract/expect-number |RectBatch.positionBytesUploaded $ contract/object-field |RectBatch.draw result |positionBytesUploaded
                uniform $ contract/expect-number |RectBatch.uniformBytesUploaded $ contract/object-field |RectBatch.draw result |uniformBytesUploaded
                pipelines $ contract/expect-number |RectBatch.pipelinesCreated $ contract/object-field |RectBatch.draw result |pipelinesCreated
                buffers $ contract/expect-number |RectBatch.buffersCreated $ contract/object-field |RectBatch.draw result |buffersCreated
              RectMetrics :draw-calls draws :instances instances :position-bytes-uploaded uploaded :uniform-bytes-uploaded uniform :pipelines-created pipelines :buffers-created buffers
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
          :schema $ :: 'Fn $ {} (:return 'quamolit.webgpu-batches/RectMetrics)
            :args $ [] 'quamolit.webgpu-batches/RectBatchHost 'Number 'Number 'quamolit.webgpu-batches/RectColor 'Number (:: 'calcit.core/Option 'quamolit.webgpu-batches/RectTranslation) (:: 'calcit.core/Option 'Number)
            :features $ #{} :js-ffi
        'read-pixel! $ %{} 'CodeEntry (:doc "|测试诊断读回；生产帧不得调用。")
          :code $ quote $ defn read-pixel! (batch x y)
            hint-fn $ {} (:async true)
              :args $ [] 'quamolit.webgpu-batches/RectBatchHost 'Number 'Number
              :return 'quamolit.webgpu-batches/RectPixel
              :features $ #{} :js-ffi
            let
                raw $ js-await $ batch .read-pixel x y
                r $ contract/expect-number |RectBatch.pixel.r $ contract/object-field |RectBatch.pixel raw |0
                g $ contract/expect-number |RectBatch.pixel.g $ contract/object-field |RectBatch.pixel raw |1
                b $ contract/expect-number |RectBatch.pixel.b $ contract/object-field |RectBatch.pixel raw |2
                a $ contract/expect-number |RectBatch.pixel.a $ contract/object-field |RectBatch.pixel raw |3
              RectPixel :r r :g g :b b :a a
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
          :schema $ :: 'Fn $ {} (:async true) (:return 'quamolit.webgpu-batches/RectPixel)
            :args $ [] 'quamolit.webgpu-batches/RectBatchHost 'Number 'Number
            :features $ #{} :js-ffi
        'read-translation! $ %{} 'CodeEntry (:doc "|测试诊断 GPU f32 时间位移；生产帧不得调用。")
          :code $ quote $ defn read-translation! (batch)
            hint-fn $ {} (:async true)
              :args $ [] 'quamolit.webgpu-batches/RectBatchHost
              :return 'quamolit.webgpu-batches/RectTranslationSample
              :features $ #{} :js-ffi
            let
                raw $ js-await $ batch .read-translation
                x $ contract/expect-number |RectBatch.translation.x $ contract/object-field |RectBatch.translation raw |x
                y $ contract/expect-number |RectBatch.translation.y $ contract/object-field |RectBatch.translation raw |y
              RectTranslationSample :x x :y y
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
          :schema $ :: 'Fn $ {} (:async true) (:return 'quamolit.webgpu-batches/RectTranslationSample)
            :args $ [] 'quamolit.webgpu-batches/RectBatchHost
            :features $ #{} :js-ffi
        'translation $ %{} 'CodeEntry (:doc "|把已验证的 Vec2 tween 参数构造成绝对时间 GPU 位移。")
          :code $ quote $ defn translation (from-x from-y to-x to-y time start duration easing)
            hint-fn $ {}
              :args $ [] 'Number 'Number 'Number 'Number 'Number 'Number 'Number 'String
              :return 'quamolit.webgpu-batches/RectTranslation
            let
                from $ RectVec2 :x from-x :y from-y
                to $ RectVec2 :x to-x :y to-y
              RectTranslation :from from :to to :time time :start start :duration duration :easing easing
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
          :schema $ :: 'Fn $ {} (:return 'quamolit.webgpu-batches/RectTranslation)
            :args $ [] 'Number 'Number 'Number 'Number 'Number 'Number 'Number 'String
        'upload! $ %{} 'CodeEntry (:doc "|上传当前版本实例位置，调用次数按资源版本而非帧数增长。")
          :code $ quote $ defn upload! (batch positions instance-count)
            hint-fn $ {}
              :args $ [] 'quamolit.webgpu-batches/RectBatchHost 'js-ffi.typed-arrays/Float32ArrayHost 'Number
              :return 'Number
              :features $ #{} :js-ffi
            let
                result $ batch .upload positions 0 instance-count
              contract/expect-number |RectBatch.positionBytesUploaded $ contract/object-field |RectBatch.upload result |positionBytesUploaded
          :examples $ []
          :ffi $ {} (:backend :js) (:target :browser)
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ [] 'quamolit.webgpu-batches/RectBatchHost 'js-ffi.typed-arrays/Float32ArrayHost 'Number
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.webgpu-batches
          :require
            |../../../src/host/webgpu-rect-batches.mjs :refer $ createFloat32RectBatch
            js-ffi.contract :as contract
    'quamolit.webgpu-capabilities $ %{} 'FileEntry
      :defs $ {} $ 'probe!
        %{} 'CodeEntry (:doc "|获取上游封闭能力结果；调用方只在 ready 分支使用并最终释放设备。")
          :code $ quote $ defn probe! (navigator-host)
            hint-fn $ {} (:async true)
              :args $ [] $ :: 'JsNullish 'js-ffi.webgpu-capabilities/NavigatorHost
              :return 'js-ffi.webgpu-capabilities/DeviceProbe
              :features $ #{} :js-ffi
            js-await $ capabilities/probe-device! navigator-host
          :examples $ []
          :schema $ :: 'Fn $ {} (:async true) (:return 'js-ffi.webgpu-capabilities/DeviceProbe)
            :args $ [] $ :: 'JsNullish 'js-ffi.webgpu-capabilities/NavigatorHost
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry
        :doc "|Quamolit 的 WebGPU 设备探测薄适配；状态、失败与设备所有权由上游 Calcit API 定义。"
        :code $ quote $ ns quamolit.webgpu-capabilities
          :require $ js-ffi.webgpu-capabilities :as capabilities
