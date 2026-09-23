
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
      :defs $ {} $ 'tick-tree
        %{} 'CodeEntry
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
            calcit.test :refer $ is=
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
    'quamolit.test.frame-fixture $ %{} 'FileEntry
      :defs $ {}
        '*progress $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defatom *progress 0
          :examples $ []
          :schema $ :: 'Dynamic
        'main! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn main! () (reset-fixture!) ([] step-fixture! redraw-fixture! progress)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ []
        'progress $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn progress () @*progress
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Number)
            :args $ []
        'redraw-fixture! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn redraw-fixture! (ctx)
            paint-tree-only-with ctx (scene) ([])
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
          :code $ quote $ defn reset-fixture! () (reset! *progress 0) (reset-frame-clock! 0) &unit
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Unit)
            :args $ []
        'scene $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn scene ()
            let
                x $ + 48 $ * 160 @*progress
              %{} Component (:name :fixture)
                :on-tick $ fn (elapsed d!)
                  reset! *progress $ + @*progress $ assert-type elapsed Number
                :tree $ rect $ {} (:w 48) (:h 48) (:x x) (:y 80) (:fill-style |#ec4899)
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'quamolit.types/Component)
            :args $ []
        'step-fixture! $ %{} 'CodeEntry (:doc |)
          :code $ quote $ defn step-fixture! (ctx seconds)
            let
                elapsed $ advance-frame-clock! seconds
              tick-tree (scene)
                fn (op data) &unit
                , elapsed
              redraw-fixture! ctx
          :examples $ []
          :schema $ :: 'Fn $ {} (:return 'Dynamic)
            :args $ [] 'Dynamic 'Number
            :features $ #{} :js-ffi
      :ns $ %{} 'NsEntry (:doc |)
        :code $ quote $ ns quamolit.test.frame-fixture
          :require
            quamolit.alias :refer $ rect
            quamolit.types :refer $ Component Shape
            quamolit.core :refer $ reset-frame-clock! advance-frame-clock!
            quamolit.render.paint :refer $ paint-tree-only-with paint-rect
            quamolit.frame-eval :refer $ tick-tree
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
