
{} (:package |quamolit)
  :configs $ {} (:init-fn |quamolit.main/main!) (:reload-fn |quamolit.main/reload!)
    :modules $ []
    :version nil
  :files $ {}
    |quamolit.comp.fade-in-out $ {}
      :ns $ quote
        ns quamolit.comp.fade-in-out $ :require
          [] quamolit.alias :refer $ [] defcomp >>
          [] quamolit.render.element :refer $ [] alpha
          [] quamolit.util.iterate :refer $ [] iterate-instant
      :defs $ {}
        |comp-fade-in-out $ quote
          defcomp comp-fade-in-out (states props p1) (; js/console.log instant)
            let
                cursor $ :cursor states
                v 4
                state $ either (:data states)
                  {} (:stage :hidden) (:opacity 0) (:p1 nil)
              []
                fn (elapsed d!)
                  case-default (:stage state)
                    println "\"unknown stage" $ :stage state
                    :hidden $ when (some? p1)
                      d! cursor $ merge state
                        {} (:stage :showing)
                          :opacity $ + (* elapsed v) 0
                          :p1 p1
                    :showing $ if
                      >= (:opacity state) 1
                      d! cursor $ {} (:stage :show) (:opacity 1) (:p1 p1)
                      d! cursor $ update state :opacity
                        fn (x)
                          + x $ * elapsed v
                    :show $ if (nil? p1)
                      d! cursor $ {} (:stage :hiding)
                        :opacity $ - 1 (* elapsed v)
                        :p1 $ :p1 state
                      d! cursor $ assoc state :p1 p1
                    :hiding $ if
                      <= (:opacity state) 0
                      d! cursor $ {} (:stage :hidden) (:opacity 0.01) (:p1 nil)
                      d! cursor $ update state :opacity
                        fn (x)
                          - x $ * elapsed v
                alpha
                  {} $ :style
                    {} $ :opacity (:opacity state)
                  case-default (:stage state)
                    either p1 $ :p1 state
                    :hidden nil
        |comp-fade-fn $ quote
          defcomp comp-fade-fn (states props f1) (; js/console.log instant)
            let
                cursor $ :cursor states
                v 4
                state $ either (:data states)
                  {} (:stage :hidden) (:opacity 0) (:f1 nil)
                p1 $ f1 (>> states :renderer) (:opacity state) (:stage state)
              []
                fn (elapsed d!)
                  case-default (:stage state)
                    println "\"unknown stage" $ :stage state
                    :hidden $ when (some? p1)
                      d! cursor $ merge state
                        {} (:stage :showing)
                          :opacity $ + (* elapsed v) 0
                          :f1 f1
                    :showing $ if
                      >= (:opacity state) 1
                      d! cursor $ {} (:stage :show) (:opacity 1) (:f1 f1)
                      d! cursor $ -> state
                        update :opacity $ fn (x)
                          + x $ * elapsed v
                        assoc :f1 f1
                    :show $ if (nil? p1)
                      d! cursor $ {} (:stage :hiding)
                        :opacity $ - 1 (* elapsed v)
                        :f1 $ .get state :f1
                      d! cursor $ assoc state :f1 f1
                    :hiding $ if
                      <= (:opacity state) 0
                      d! cursor $ {} (:stage :hidden) (:opacity 0.01) (:f1 nil)
                      d! cursor $ update state :opacity
                        fn (x)
                          - x $ * elapsed v
                alpha
                  {} $ :style
                    {} $ :opacity (:opacity state)
                  case-default (:stage state)
                    either p1 $ 
                      :f1 state
                      >> states :renderer
                      :opacity state
                      :stage state
                    :hidden nil
      :proc $ quote ()
    |quamolit.comp.portal $ {}
      :ns $ quote
        ns quamolit.comp.portal $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp group rect text
          [] quamolit.render.element :refer $ [] alpha translate button
          [] quamolit.util.iterate :refer $ [] iterate-instant tween
      :defs $ {}
        |comp-portal $ quote
          defcomp comp-portal (cursor)
            group ({})
              button $ {,} :style
                style-button 0 0 |Todolist $ hsl 0 120 60
                , :event
                  {,} :click $ handle-navigate cursor :todolist
              button $ {,} :style
                style-button 1 0 |Clock $ hsl 300 80 80
                , :event
                  {,} :click $ handle-navigate cursor :clock
              button $ {,} :style
                style-button 2 0 |Solar $ hsl 140 80 80
                , :event
                  {,} :click $ handle-navigate cursor :solar
              button $ {,} :style
                style-button 3 0 "|Binary Tree" $ hsl 140 20 30
                , :event
                  {,} :click $ handle-navigate cursor :binary-tree
              button $ {,} :style
                style-button 0 1 |Table $ hsl 340 80 80
                , :event
                  {,} :click $ handle-navigate cursor :code-table
              button $ {,} :style
                style-button 1 1 |Finder $ hsl 60 80 45
                , :event
                  {,} :click $ handle-navigate cursor :finder
              button $ {,} :style
                style-button 2 1 |Raining $ hsl 260 80 80
                , :event
                  {,} :click $ handle-navigate cursor :raining
              button $ {,} :style
                style-button 3 1 |Icons $ hsl 30 80 80
                , :event
                  {,} :click $ handle-navigate cursor :icons
              button $ {,} :style
                style-button 0 2 |Curve $ hsl 100 80 80
                , :event
                  {,} :click $ handle-navigate cursor :curve
              button $ {,} :style
                style-button 1 2 "|Folding fan" $ hsl 200 80 80
                , :event
                  {,} :click $ handle-navigate cursor :folding-fan
        |handle-navigate $ quote
          defn handle-navigate (cursor next-page)
            fn (e d!)
              d! cursor $ {} (:tab next-page)
        |style-button $ quote
          defn style-button (x y page-name bg-color)
            {} (:w 180) (:h 60)
              :x $ - (* x 240) 400
              :y $ - (* y 100) 200
              :surface-color bg-color
              :text page-name
              :text-color $ hsl 0 0 100
      :proc $ quote ()
    |quamolit.types $ {}
      :ns $ quote (ns quamolit.types)
      :defs $ {}
        |Component $ quote (defrecord Component :name :on-tick :tree)
        |Shape $ quote (defrecord Shape :name :style :event :children)
      :proc $ quote ()
      :configs $ {}
    |quamolit.comp.code-table $ {}
      :ns $ quote
        ns quamolit.comp.code-table $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp group rect
          [] quamolit.render.element :refer $ [] input translate textbox
          [] quamolit.util.keyboard :refer $ [] keycode->key
      :defs $ {}
        |comp-code-table $ quote
          defcomp comp-code-table (states) (; js/console.log state)
            let
                cursor $ :cursor states
                state $ either (:data states) ([])
              translate
                {,} :style $ {,} :x -160 :y -160
                -> state $ map-indexed
                  fn (i row)
                    [] i $ group ({})
                      -> row $ map-indexed
                        fn (j content)
                          [] j $ let
                              move-x $ * i 100
                              move-y $ * j 60
                            translate
                              {,} :style $ {,} :x move-x :y move-y
                              textbox $ {,} :style ({,} :w 80 :h 40 :text content)
        |init-state $ quote
          defn init-state () $ repeat (repeat |edit 3) 3
      :proc $ quote ()
    |quamolit.util.string $ {}
      :ns $ quote (ns quamolit.util.string)
      :defs $ {}
        |hsl $ quote
          defn hsl (h s l ? a)
            if (some? a) (str "\"hsl(" h "\"," s "\"%," l "\"%," a "\")") (str "\"hsl(" h "\"," s "\"%," l "\"%)")
        |gen-id! $ quote
          defn gen-id! () $ do (swap! *counter inc) @*counter
        |*counter $ quote (defatom *counter 0)
      :proc $ quote ()
      :configs $ {}
    |quamolit.util.iterate $ {}
      :ns $ quote (ns quamolit.util.iterate)
      :defs $ {}
        |iterate-instant $ quote
          defn iterate-instant (instant data-key velocity-key tick bound)
            let
                current-data $ get instant data-key
                velocity $ get instant velocity-key
                next-data $ + current-data (* tick velocity)
                lower-bound $ first bound
                upper-bound $ last bound
              cond
                  < velocity 0
                  if (< next-data lower-bound)
                    -> instant (assoc data-key lower-bound) (assoc velocity-key 0)
                    assoc instant data-key next-data
                (> velocity 0)
                  if (> next-data upper-bound)
                    -> instant (assoc data-key upper-bound) (assoc velocity-key 0)
                    assoc instant data-key next-data
                true instant
        |tween $ quote
          defn tween (range-data range-bound x)
            let-sugar
                  [] a b
                  , range-data
                ([] c d) range-bound
              + a $ /
                * (- b a) (- x c)
                - d c
      :proc $ quote ()
    |quamolit.comp.icon-play $ {}
      :ns $ quote
        ns quamolit.comp.icon-play $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp path group rect
          [] quamolit.util.iterate :refer $ [] iterate-instant tween
          [] quamolit.comp.debug :refer $ [] comp-debug
          quamolit.math :refer $ bound-opacity
      :defs $ {}
        |comp-icon-play $ quote
          defcomp comp-icon-play (states)
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {} (:playing? false) (:play-value 0)
              let
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
                    {,} :style
                      {} (:w 60) (:h 60)
                        :fill-style $ hsl 40 80 90
                      , :event $ {,} :click
                        fn (e d!)
                          d! cursor $ update state :playing? not
                    path $ {,} :style
                      {}
                        :points $ [] ([] -20 -20) ([] -20 20)
                          [] (tw -5 0) (tw 20 10)
                          [] (tw -5 0) (tw -20 -10)
                        :fill-style $ hsl 120 50 60
                    path $ {,} :style
                      {}
                        :points $ []
                          [] (tw 5 0) (tw -20 -10)
                          [] 20 $ tw -20 0
                          [] 20 $ tw 20 0
                          [] (tw 5 0) (tw 20 10)
                        :fill-style $ hsl 120 50 60
                    ; comp-debug state $ {}
        |on-tick $ quote
          defn on-tick (instant tick elapsed)
            iterate-instant instant :play-value :play-v elapsed $ [] (:play-target instant) (:play-target instant)
        |update-state $ quote (def update-state not)
        |remove? $ quote
          defn remove? (instant) true
        |on-update $ quote
          defn on-update (instant old-args args old-state state)
            if (= old-state state) instant $ let
                next-value $ if state 1 0
                next-v $ if state 0.002 -0.002
              -> instant (assoc :play-target next-value) (assoc :play-v next-v)
        |init-state $ quote
          defn init-state () true
        |init-instant $ quote
          defn init-instant (args state at?)
            let
                value $ if true 1 0
              {,} :play-target value :play-v 0 :play-value value
        |on-unmount $ quote
          defn on-unmount (instant) instant
      :proc $ quote ()
    |quamolit.comp.debug $ {}
      :ns $ quote
        ns quamolit.comp.debug $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp rect text
          [] quamolit.render.element :refer $ [] alpha translate button
      :defs $ {}
        |comp-debug $ quote
          defcomp comp-debug (data more-style)
            let
                style $ -> default-style (merge more-style)
                  assoc :text $ if (instance? js/Date data) (js/JSON.stringify data) (pr-str data)
              text $ {,} :style style
        |default-style $ quote
          def default-style $ {} (:x 0) (:y 0)
            :fill-style $ hsl 0 0 0 0.5
            :font-family |Menlo
            :size 12
            :max-width 600
      :proc $ quote ()
    |quamolit.comp.icon-increase $ {}
      :ns $ quote
        ns quamolit.comp.icon-increase $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp line text group rect
          [] quamolit.render.element :refer $ [] translate rotate alpha
          [] quamolit.util.iterate :refer $ [] iterate-instant
          quamolit.types :refer $ Component
      :defs $ {}
        |on-tick $ quote
          defn on-tick (instant tick elapsed)
            let
                target $ :n-target instant
                new-instant $ -> instant
                  iterate-instant :n :n-v elapsed $ [] target target
              , new-instant
        |update-state $ quote
          defn update-state (x) (inc x)
        |comp-icon-increase $ quote
          defcomp comp-icon-increase (states)
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {} (:v 0) (:n 0)
                v $ :v state
              let
                  n1 $ :n state
                rect
                  {}
                    :style $ {} (:w 60) (:h 60)
                      :fill-style $ hsl 0 0 90
                    :event $ {}
                      :click $ fn (e d!)
                        d! cursor $ update state :v inc
                  translate
                    {} $ :style
                      {} $ :x -12
                    rotate
                      {} $ :style
                        {} $ :angle (* 90 n1)
                      line $ {}
                        :style $ {}
                          :stroke-style $ hsl 0 80 30
                          :x0 -7
                          :y0 0
                          :x1 7
                          :y1 0
                          :line-width 2
                      line $ {}
                        :style $ {}
                          :stroke-style $ hsl 0 80 30
                          :x0 0
                          :y0 -7
                          :x1 0
                          :y1 7
                          :line-width 2
                  translate
                    {,} :style $ {} (:x 10)
                    translate
                      {} $ :style
                        {} $ :y
                          * -20 $ - v n1
                      alpha
                        {} $ :style
                          {} $ :opacity
                            - (+ 1 n1) v
                        text $ {}
                          :style $ {}
                            :text $ str (+ v 1)
                            :fill-style $ hsl 0 80 30
                            :font-family "|Wawati SC Regular"
                    translate
                      {} $ :style
                        {} $ :y
                          * 20 $ - n1 (- v 1)
                      alpha
                        {} $ :style
                          {} $ :opacity (- v n1)
                        text $ {}
                          :style $ {}
                            :text $ str v
                            :fill-style $ hsl 0 80 30
                            :font-family "|Wawati SC Regular"
        |remove? $ quote
          defn remove? (instant) true
        |on-update $ quote
          defn on-update (instant old-args args old-state state)
            if (not= old-state state)
              -> instant (assoc :n-v 0.004) (assoc :n-target state)
              , instant
        |init-state $ quote
          defn init-state () 0
        |init-instant $ quote
          defn init-instant (args state at?) ({,} :n state :n-v 0 :n-target state)
        |on-unmount $ quote
          defn on-unmount (instant) instant
      :proc $ quote ()
    |quamolit.render.expand $ {}
      :ns $ quote
        ns quamolit.render.expand $ :require
          [] quamolit.types :refer $ [] Component Shape
          [] quamolit.util.detect :refer $ [] =seq compare-more
      :defs $ {}
        |contain-markups? $ quote
          defn contain-markups? (items)
            let
                result $ some
                  fn (item)
                    if
                      and (record? item)
                        or (relevant-record? Component item) (relevant-record? Shape item)
                      , true $ if
                        and (map? item)
                          > (count item) 0
                        some
                          fn (child)
                            or (relevant-record? Component child) (relevant-record? Shape child)
                          vals item
                        , false
                  , items
              ; if (not result) (js/console.log result items)
              , result
      :proc $ quote
          declare expand-component
    |quamolit.controller.resolve $ {}
      :ns $ quote
        ns quamolit.controller.resolve $ :require
          [] quamolit.types :refer $ [] Component
      :defs $ {}
        |locate-target $ quote
          defn locate-target (tree coord) (; js/console.log |locating coord tree)
            if
              = 0 $ count coord
              , tree $ let
                  first-pos $ first coord
                if (relevant-record? Component tree)
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
                  maybe-listener $ get-in maybe-target ([] :event event-name)
                ; .log js/console |listener maybe-listener maybe-target
                if (some? maybe-listener) maybe-listener $ if
                  = 0 $ count coord
                  , nil
                    recur tree event-name $ slice coord 0
                      - (count coord) 1
      :proc $ quote ()
    |quamolit.comp.todolist $ {}
      :ns $ quote
        ns quamolit.comp.todolist $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp group rect text >>
          [] quamolit.render.element :refer $ [] translate button input alpha
          [] quamolit.comp.task :refer $ [] comp-task
          [] quamolit.util.iterate :refer $ [] iterate-instant tween
          [] quamolit.comp.debug :refer $ [] comp-debug
          [] quamolit.math :refer $ [] bound-x
          quamolit.comp.fade-in-out :refer $ comp-fade-fn
      :defs $ {}
        |on-tick $ quote
          defn on-tick (instant tick elapsed)
            let
                new-instant $ iterate-instant instant :presence :presence-v elapsed ([] 0 1000)
              if
                and
                  < (:presence-v instant) 0
                  = (:presence new-instant) 0
                assoc new-instant :numb? true
                , new-instant
        |style-button $ quote
          def style-button $ {} (:w 80) (:h 40) (:text |add)
        |handle-click $ quote
          defn handle-click (simple-event dispatch set-state) (.log js/console simple-event)
        |position-header $ quote
          def position-header $ {} (:x 0) (:y -240)
        |on-update $ quote
          defn on-update (instant old-args args old-state state) instant
        |init-state $ quote
          defn init-state (store args) ({,} :draft |)
        |init-instant $ quote
          defn init-instant (args state at-place?) ({,} :presence 0 :presence-v 3 :numb? false)
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
              [] nil $ alpha
                {,} :style $ {,} :opacity 0.5
                translate ({,} :style position-header)
                  translate
                    {,} :style $ {,} :x -20 :y 40
                    input $ {,} :style
                      {,} :w 400 :h 40 :text $ :draft state
                      , :event
                        {} $ :click
                          fn (e d!)
                            let
                                user-text $ js/prompt "|input to canvas:" (:draft state)
                              d! cursor $ assoc state :draft user-text
                  translate
                    {,} :style $ {,} :x 240 :y 40
                    button $ {} (:style style-button)
                      :event $ {}
                        :click $ fn (e d!)
                          d! :add $ :draft state
                          d! cursor $ -> state (assoc :draft |)
                translate
                  {} $ :style position-body
                  group ({}) & $ -> tasks (reverse)
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
        |on-unmount $ quote
          defn on-unmount (instant) (assoc instant :presence-v -3)
        |position-body $ quote
          def position-body $ {} (:x 0) (:y 0)
      :proc $ quote ()
    |quamolit.alias $ {}
      :ns $ quote
        ns quamolit.alias $ :require
          [] quamolit.types :refer $ [] Component Shape
      :defs $ {}
        |>> $ quote
          defn >> (states k)
            let
                parent-cursor $ either (:cursor states) ([])
                branch $ get states k
              assoc
                either branch $ {}
                , :cursor $ append parent-cursor k
        |native-rotate $ quote
          defn native-rotate (props & children) (create-shape :native-rotate props children)
        |default-init-state $ quote
          defn default-init-state (& args) ({})
        |native-translate $ quote
          defn native-translate (props & children) (create-shape :native-translate props children)
        |default-on-unmount $ quote
          defn default-on-unmount (instant) (assoc instant :numb? true)
        |native-clip $ quote
          defn native-clip (props & children) (create-shape :native-clip props children)
        |group $ quote
          defn group (props & children) (create-shape :group props children)
        |image $ quote
          defn image (props & children) (create-shape :image props children)
        |arrange-children $ quote
          defn arrange-children (children)
            cond
                list? $ first children
                first children
              (map? children) (raise "\"unknown")
              true $ -> children
                map-indexed $ fn (idx x) ([] idx x)
                filter $ fn (entry)
                  some? $ last entry
        |path $ quote
          defn path (props & children) (create-shape :path props children)
        |native-transform $ quote
          defn native-transform (props & children) (create-shape :native-transform props children)
        |native-alpha $ quote
          defn native-alpha (props & children) (create-shape :native-alpha props children)
        |native-save $ quote
          defn native-save (props & children) (create-shape :native-save props children)
        |default-on-update $ quote
          defn default-on-update (instant old-args args old-state state) instant
        |bezier $ quote
          defn bezier (props & children) (create-shape :bezier props children)
        |create-shape $ quote
          defn create-shape (shape-name props children)
            if
              not $ map? props
              raise $ new js/Error "|Props expeced to be a map!"
            %{} Shape (:name shape-name)
              :style $ :style props
              :event $ :event props
              :children $ arrange-children children
        |text $ quote
          defn text (props & children) (create-shape :text props children)
        |arc $ quote
          defn arc (props & children) (create-shape :arc props children)
        |line $ quote
          defn line (props & children) (create-shape :line props children)
        |default-remove? $ quote
          defn default-remove? (instant) (:numb? instant)
        |default-init-instant $ quote
          defn default-init-instant (args state at?) ({,} :numb? false)
        |native-scale $ quote
          defn native-scale (props & children) (create-shape :native-scale props children)
        |native-restore $ quote
          defn native-restore (props & children) (create-shape :native-restore props children)
        |rect $ quote
          defn rect (props & children) (create-shape :rect props children)
        |defcomp $ quote
          defmacro defcomp (comp-name args & body)
            quasiquote $ defn ~comp-name ~args
              let
                  ret $ do ~@body
                cond
                    record? ret
                    %{} Component
                      :name $ ~ (turn-keyword comp-name)
                      :on-tick nil
                      :tree ret
                  (list? ret)
                    do
                      assert "\"expected on-tick and tree" $ = 2 (count ret)
                      %{} Component
                        :name $ ~ (turn-keyword comp-name)
                        :on-tick $ first ret
                        :tree $ last ret
                  (map? ret)
                    %{} Component
                      :name $ ~ (turn-keyword comp-name)
                      :on-tick $ :on-tick ret
                      :tree $ :tree ret
                  true $ raise "\"unknown component"
      :proc $ quote ()
    |quamolit.core $ {}
      :ns $ quote
        ns quamolit.core $ :require
          [] quamolit.types :refer $ [] Component
          [] quamolit.render.expand :refer $ [] expand-app
          [] quamolit.util.time :refer $ [] get-tick
          [] quamolit.render.paint :refer $ [] paint
          [] quamolit.controller.resolve :refer $ [] resolve-target locate-target
      :defs $ {}
        |render-page $ quote
          defn render-page (tree target dispatch!)
            let
                new-tick $ get-tick
                elapsed $ - new-tick @tick-ref
              ; js/console.info "|render page:" tree
              reset! tree-ref tree
              reset! tick-ref new-tick
              call-paint tree target dispatch! elapsed
              ; js/console.log |tree tree
        |focus-ref $ quote
          defatom focus-ref $ []
        |tree-ref $ quote (defatom tree-ref nil)
        |*paint-eff $ quote
          defatom *paint-eff $ {}
            :alpha-stack $ [] 1
        |tick-ref $ quote
          defatom tick-ref $ get-tick
        |configure-canvas $ quote
          defn configure-canvas (app-container) (.!setAttribute app-container |width js/window.innerWidth) (.!setAttribute app-container |height js/window.innerHeight)
        |handle-event $ quote
          defn handle-event (coord event-name event dispatch)
            let
                maybe-listener $ resolve-target @tree-ref event-name coord
              ; js/console.log "|handle event" maybe-listener coord event-name @tree-ref
              if (some? maybe-listener)
                do (.preventDefault event) (maybe-listener event dispatch)
                ; js/console.log "|no target"
        |setup-events $ quote
          defn setup-events (root-element dispatch)
            let
                ctx $ .getContext root-element |2d
              .!addEventListener root-element |click $ fn (event)
                let
                    hit-region $ aget event |region
                  if (some? hit-region)
                    let
                        coord $ parse-cirru-edn hit-region
                      ; js/console.log |hit: event coord
                      reset! focus-ref coord
                      handle-event coord :click event dispatch
                    reset! focus-ref $ []
              .!addEventListener root-element |keypress $ fn (event)
                let
                    coord @focus-ref
                  handle-event coord :keypress event dispatch
              .!addEventListener root-element |keydown $ fn (event)
                let
                    coord @focus-ref
                  handle-event coord :keydown event dispatch
              if
                nil? $ aget ctx |addHitRegion
                js/alert "|You need to enable experimental canvas features to view this app"
        |call-paint $ quote
          defn call-paint (tree target dispatch! elapsed) (; .log js/console tree)
            let
                ctx $ .!getContext target |2d
                w js/window.innerWidth
                h js/window.innerHeight
              reset! *paint-eff $ {}
                :alpha-stack $ [] 1
              .!clearRect ctx 0 0 w h
              ; .!save ctx
              .!translate ctx (/ w 2) (/ h 2)
              paint ctx tree *paint-eff ([]) dispatch! elapsed
              .!translate ctx
                negate $ / w 2
                negate $ / h 2
              ; .!restore ctx
      :proc $ quote ()
    |quamolit.comp.task $ {}
      :ns $ quote
        ns quamolit.comp.task $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp group rect >>
          [] quamolit.render.element :refer $ [] translate alpha input
          [] quamolit.util.iterate :refer $ [] iterate-instant
          [] quamolit.comp.task-toggler :refer $ [] comp-toggler
          [] quamolit.comp.debug :refer $ [] comp-debug
          [] quamolit.math :refer $ [] bound-x bound-opacity
      :defs $ {}
        |on-tick $ quote
          defn on-tick (instant tick elapsed) (; .log js/console "|on tick data:" instant tick elapsed)
            let
                v $ :presence-velocity instant
                new-instant $ -> instant
                  iterate-instant :presence :presence-velocity elapsed $ [] 0 1000
                  iterate-instant :index :index-velocity elapsed $ repeat 2 (:index-target instant)
                  iterate-instant :left :left-velocity elapsed $ [] -40 0
              if
                and (< v 0)
                  = 0 $ :presence new-instant
                assoc new-instant :numb? true
                , new-instant
        |style-block $ quote
          def style-block $ {} (:w 300) (:h 40)
            :fill-style $ hsl 40 80 80
        |on-update $ quote
          defn on-update (instant old-args args old-state state) (; .log js/console "|on update:" instant old-args args)
            let
                old-index $ nth old-args 2
                new-index $ nth args 2
              if (not= old-index new-index)
                -> instant
                  assoc :index-velocity $ /
                    - new-index $ :index instant
                    , 300
                  assoc :index-target new-index
                , instant
        |handle-input $ quote
          defn handle-input (task-id task-text)
            fn (event dispatch)
              let
                  new-text $ js/prompt "|new content:" task-text
                dispatch :update $ [] task-id new-text
        |style-input $ quote
          defn style-input (text)
            {} (:w 400) (:h 40) (:x 40) (:y 0)
              :fill-style $ hsl 0 0 60
              :text text
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
                  {,} :style $ {,} :x
                    + shift-x $ :left state
                    , :y
                      -
                        * 60 $ :idx state
                        , 140
                  alpha
                    {,} :style $ {,} :opacity 1
                    translate
                      {,} :style $ {,} :x -200
                      comp-toggler (>> states :toggler) (:done? task) (:id task)
                    input $ {,} :style
                      style-input $ :text task
                      , :event
                        {,} :click $ handle-input (:id task) (:text task)
                    translate
                      {,} :style $ {,} :x 280
                      rect $ {,} :style style-remove :event
                        {} $ :click
                          fn (e d!)
                            add-orphin (:id task) d!
                            d! :rm $ :id task
                    ; comp-debug task $ {} (:y 20)
        |init-instant $ quote
          defn init-instant (args state at-place?)
            let
                index $ nth args 2
              {} (:numb? false) (:presence 0) (:presence-velocity 3)
                :left $ if at-place? -40 0
                :left-velocity $ if at-place? 0.09 0
                :index index
                :index-velocity 0
        |style-remove $ quote
          def style-remove $ {} (:w 40) (:h 40)
            :fill-style $ hsl 0 80 40
        |on-unmount $ quote
          defn on-unmount (instant) (; .log js/console "|calling unmount" instant)
            -> instant (assoc :presence-velocity -3) (assoc :left-velocity -0.09)
      :proc $ quote ()
    |quamolit.comp.clock $ {}
      :ns $ quote
        ns quamolit.comp.clock $ :require
          [] quamolit.alias :refer $ [] defcomp group >>
          [] quamolit.render.element :refer $ [] translate
          [] quamolit.comp.digits :refer $ [] comp-digit
          [] quamolit.comp.debug :refer $ [] comp-debug
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
                get-one $ fn (x) (rem x 10)
              ; js/console.log secs
              []
                fn $ elapsed d!
                group ({,})
                  comp-digit (>> states :h1) (get-ten hrs)
                    {,} :style $ {,} :x -280
                  comp-digit (>> states :h) (get-one hrs)
                    {,} :style $ {,} :x -200
                  comp-digit (>> states :m1) (get-ten mins)
                    {,} :style $ {,} :x -80
                  comp-digit (>> states :m) (get-one mins)
                    {,} :style $ {,} :x 0
                  comp-digit (>> states :s1) (get-ten secs)
                    {,} :style $ {,} :x 120
                  comp-digit (>> states :s) (get-one secs)
                    {,} :style $ {,} :x 200
                  ; comp-debug now $ {,} :y -60
      :proc $ quote ()
    |quamolit.comp.folding-fan $ {}
      :ns $ quote
        ns quamolit.comp.folding-fan $ :require
          [] quamolit.alias :refer $ [] text defcomp group image
          [] quamolit.render.element :refer $ [] button translate rotate
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.util.iterate :refer $ [] iterate-instant tween
          quamolit.math :refer $ bound-opacity
      :defs $ {}
        |on-tick $ quote
          defn on-tick (instant tick elapsed)
            iterate-instant instant :folding-value :folding-v elapsed $ [] 0 1000
        |update-state $ quote
          defn update-state (state) (not state)
        |remove? $ quote
          defn remove? (instant) true
        |on-update $ quote
          defn on-update (instant old-args old-state args state)
            if (not= old-state state)
              assoc instant :folding-v $ if state 2 -2
              , instant
        |init-state $ quote
          defn init-state () true
        |init-instant $ quote
          defn init-instant (args state at?)
            {,} :folding-value (if state 1000 0) :folding-v 0
        |on-unmount $ quote
          defn on-unmount (instant) instant
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
                    translate
                      {} $ :style ({,} :x 0 :y 160)
                      -> (range n)
                        map $ fn (i)
                          [] i $ rotate
                            {} $ :style
                              {,} :angle $ * 6 (:folding-value state)
                                + 0.5 $ - i (/ n 2)
                            image $ {}
                              :style $ {} (:src |assets/lotus.jpg)
                                :sx $ * i image-unit
                                :sy 0
                                :sw image-unit
                                :sh image-h
                                :dx $ - 0 (/ image-unit 2)
                                :dy $ - 10 dest-h
                                :dw dest-unit
                                :dh dest-h
                    button $ {}
                      :style $ {} (:text |Toggle) (:x 160) (:y 200)
                        :surface-color $ hsl 30 80 60
                        :text-color $ hsl 0 0 100
                      :event $ {}
                        :click $ fn (e d!)
                          d! cursor $ update state :folded? not
      :proc $ quote ()
    |quamolit.comp.digits $ {}
      :ns $ quote
        ns quamolit.comp.digits $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp rect group line >>
          [] quamolit.render.element :refer $ [] alpha translate
          [] quamolit.util.iterate :refer $ [] iterate-instant tween
          [] quamolit.comp.fade-in-out :refer $ [] comp-fade-in-out
      :defs $ {}
        |comp-3 $ quote
          defcomp comp-3 (states props)
            translate props
              comp-fade-in-out (>> states 0) ({})
                comp-stroke (>> states :stroke-0) 0 1 1 1
              comp-fade-in-out (>> states 1) ({})
                comp-stroke (>> states :stroke-1) 1 1 1 0
              comp-fade-in-out (>> states 2) ({})
                comp-stroke (>> states :stroke-3) 1 0 0 0
              comp-fade-in-out (>> states 3) ({}) nil
              comp-fade-in-out (>> states 4) ({}) nil
              comp-fade-in-out (>> states 5) ({})
                comp-stroke (>> states :stroke-5) 0 2 1 2
              comp-fade-in-out (>> states 6) ({})
                comp-stroke (>> states :stroke-6) 1 2 1 1
        |comp-stroke $ quote
          defcomp comp-stroke (states x0 y0 x1 y1)
            ; js/console.log |watching $ :presence instant
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {} (:x0 0) (:y0 0) (:x1 0) (:y1 0)
                h 100
                w 60
              []
                fn (elapsed d!)
                  when-not
                    and
                      = x0 $ :x0 state
                      = y0 $ :y0 state
                      = x1 $ :x1 state
                      = y1 $ :y1 state
                    let
                        v $ * elapsed 6
                      d! cursor $ -> state
                        update :x0 $ fn (n)
                          + n $ * v (- x0 n)
                        update :y0 $ fn (n)
                          + n $ * v (- y0 n)
                        update :x1 $ fn (n)
                          + n $ * v (- x1 n)
                        update :y1 $ fn (n)
                          + n $ * v (- y1 n)
                group ({})
                  alpha
                    {,} :style $ {,} :opacity 1
                    line $ {,} :style
                      {}
                        :x0 $ * w (:x0 state)
                        :y0 $ * h (:y0 state)
                        :x1 $ * w (:x1 state)
                        :y1 $ * h (:y1 state)
                        :line-width 2
                        :stroke-style $ hsl 240 90 80
        |comp-7 $ quote
          defcomp comp-7 (states props)
            translate props
              comp-fade-in-out (>> states 0) ({}) nil
              comp-fade-in-out (>> states 1) ({})
                comp-stroke (>> states :stroke-1) 1 1 1 0
              comp-fade-in-out (>> states 2) ({})
                comp-stroke (>> states :stroke-3) 1 0 0 0
              comp-fade-in-out (>> states 3) ({}) nil
              comp-fade-in-out (>> states 4) ({}) nil
              comp-fade-in-out (>> states 5) ({}) nil
              comp-fade-in-out (>> states 6) ({})
                comp-stroke (>> states :stroke-6) 1 2 1 1
        |comp-2 $ quote
          defcomp comp-2 (states props)
            translate props
              comp-fade-in-out (>> states 0) ({})
                comp-stroke (>> states :stroke-0) 0 1 1 1
              comp-fade-in-out (>> states 1) ({})
                comp-stroke (>> states :stroke-6) 1 1 1 0
              comp-fade-in-out (>> states 2) ({})
                comp-stroke (>> states :stroke-2) 1 0 0 0
              comp-fade-in-out (>> states 3) ({}) nil
              comp-fade-in-out (>> states 4) ({})
                comp-stroke (>> states :stroke-4) 0 1 0 2
              comp-fade-in-out (>> states 5) ({})
                comp-stroke (>> states :stroke-5) 0 2 1 2
              comp-fade-in-out (>> states 6) ({}) nil
        |comp-4 $ quote
          defcomp comp-4 (states props)
            translate props
              comp-fade-in-out (>> states 0) ({})
                comp-stroke (>> states :stroke-0) 0 1 1 1
              comp-fade-in-out (>> states 1) ({})
                comp-stroke (>> states :stroke-1) 1 1 1 0
              comp-fade-in-out (>> states 2) ({}) nil
              comp-fade-in-out (>> states 3) ({})
                comp-stroke (>> states :stroke-3) 0 0 0 1
              comp-fade-in-out (>> states 4) ({}) nil
              comp-fade-in-out (>> states 5) ({}) nil
              comp-fade-in-out (>> states 6) ({})
                comp-stroke (>> states :stroke-6) 1 2 1 1
        |comp-1 $ quote
          defcomp comp-1 (states props)
            translate props
              comp-fade-in-out (>> states 0) ({}) nil
              comp-fade-in-out (>> states 1) ({})
                comp-stroke (>> states :stroke-2) 1 1 1 0
              comp-fade-in-out (>> states 2) ({}) nil
              comp-fade-in-out (>> states 3) ({}) nil
              comp-fade-in-out (>> states 4) ({}) nil
              comp-fade-in-out (>> states 5) ({}) nil
              comp-fade-in-out (>> states 6) ({})
                comp-stroke (>> states :stroke-6) 1 2 1 1
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
        |comp-6 $ quote
          defcomp comp-6 (states props)
            translate props
              comp-fade-in-out (>> states 0) ({})
                comp-stroke (>> states :stroke-0) 1 1 0 1
              comp-fade-in-out (>> states 1) ({}) nil
              comp-fade-in-out (>> states 2) ({})
                comp-stroke (>> states :stroke-2) 1 0 0 0
              comp-fade-in-out (>> states 3) ({})
                comp-stroke (>> states :stroke-3) 0 0 0 1
              comp-fade-in-out (>> states 4) ({})
                comp-stroke (>> states :stroke-4) 0 1 0 2
              comp-fade-in-out (>> states 5) ({})
                comp-stroke (>> states :stroke-5) 0 2 1 2
              comp-fade-in-out (>> states 6) ({})
                comp-stroke (>> states :stroke-6) 1 2 1 1
        |comp-0 $ quote
          defcomp comp-0 (states props)
            translate props
              comp-fade-in-out (>> states 0) ({}) nil
              comp-fade-in-out (>> states 1) ({})
                comp-stroke (>> states :stroke-1) 1 1 1 0
              comp-fade-in-out (>> states 2) ({})
                comp-stroke (>> states :stroke-2) 1 0 0 0
              comp-fade-in-out (>> states 3) ({})
                comp-stroke (>> states :stroke-4) 0 0 0 1
              comp-fade-in-out (>> states 4) ({})
                comp-stroke (>> states :stroke-3) 0 1 0 2
              comp-fade-in-out (>> states 5) ({})
                comp-stroke (>> states :stroke-5) 0 2 1 2
              comp-fade-in-out (>> states 6) ({})
                comp-stroke (>> states :stroke-6) 1 2 1 1
        |comp-5 $ quote
          defcomp comp-5 (states props)
            translate props
              comp-fade-in-out (>> states 0) ({})
                comp-stroke (>> states :stroke-4) 1 1 0 1
              comp-fade-in-out (>> states 1) ({}) nil
              comp-fade-in-out (>> states 2) ({})
                comp-stroke (>> states :stroke-1) 1 0 0 0
              comp-fade-in-out (>> states 3) ({})
                comp-stroke (>> states :stroke-0) 0 0 0 1
              comp-fade-in-out (>> states 4) ({}) nil
              comp-fade-in-out (>> states 5) ({})
                comp-stroke (>> states :stroke-5) 0 2 1 2
              comp-fade-in-out (>> states 6) ({})
                comp-stroke (>> states :stroke-6) 1 2 1 1
        |comp-8 $ quote
          defcomp comp-8 (states props)
            translate props
              comp-fade-in-out (>> states 0) ({})
                comp-stroke (>> states :stroke-0) 0 1 1 1
              comp-fade-in-out (>> states 1) ({})
                comp-stroke (>> states :stroke-1) 1 1 1 0
              comp-fade-in-out (>> states 2) ({})
                comp-stroke (>> states :stroke-2) 1 0 0 0
              comp-fade-in-out (>> states 3) ({})
                comp-stroke (>> states :stroke-3) 0 0 0 1
              comp-fade-in-out (>> states 4) ({})
                comp-stroke (>> states :stroke-4) 0 1 0 2
              comp-fade-in-out (>> states 5) ({})
                comp-stroke (>> states :stroke-5) 0 2 1 2
              comp-fade-in-out (>> states 6) ({})
                comp-stroke (>> states :stroke-6) 1 2 1 1
        |comp-9 $ quote
          defcomp comp-9 (states props)
            translate props
              comp-fade-in-out (>> states 0) ({})
                comp-stroke (>> states :stroke-0) 0 1 1 1
              comp-fade-in-out (>> states 1) ({})
                comp-stroke (>> states :stroke-2) 1 0 1 1
              comp-fade-in-out (>> states 2) ({})
                comp-stroke (>> states :stroke-1) 1 0 0 0
              comp-fade-in-out (>> states 3) ({})
                comp-stroke (>> states :stroke-3) 0 0 0 1
              comp-fade-in-out (>> states 4) ({}) nil
              comp-fade-in-out (>> states 5) ({})
                comp-stroke (>> states :stroke-5) 0 2 1 2
              comp-fade-in-out (>> states 6) ({})
                comp-stroke (>> states :stroke-6) 1 2 1 1
      :proc $ quote ()
    |quamolit.util.keyboard $ {}
      :ns $ quote
        ns quamolit.util.keyboard $ :require ([] clojure.string :as string)
      :defs $ {}
        |keycode->key $ quote
          defn keycode->key (k shift?)
            if
              and (<= k 90) (>= k 65)
              if shift? (js/String.fromCharCode k)
                -> k js/String.fromCharCode $ .toUpperCase
              , nil
      :proc $ quote ()
    |quamolit.comp.container $ {}
      :ns $ quote
        ns quamolit.comp.container $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp group >>
          [] quamolit.render.element :refer $ [] translate button
          [] quamolit.comp.todolist :refer $ [] comp-todolist
          [] quamolit.comp.digits :refer $ [] comp-digit
          [] quamolit.comp.portal :refer $ [] comp-portal
          [] quamolit.comp.clock :refer $ [] comp-clock
          [] quamolit.comp.solar :refer $ [] comp-solar
          [] quamolit.comp.fade-in-out :refer $ [] comp-fade-in-out comp-fade-fn
          [] quamolit.comp.binary-tree :refer $ [] comp-tree-waving
          [] quamolit.comp.code-table :refer $ [] comp-code-table
          [] quamolit.comp.finder :refer $ [] comp-finder
          [] quamolit.comp.raining :refer $ [] comp-raining
          [] quamolit.comp.icons-table :refer $ [] comp-icons-table
          [] quamolit.comp.ring :refer $ [] comp-ring
          [] quamolit.comp.folding-fan :refer $ [] comp-folding-fan
          [] quamolit.comp.debug :refer $ [] comp-debug
      :defs $ {}
        |comp-container $ quote
          defcomp comp-container (store)
            let
                states $ :states store
                state $ either (:data states)
                  {} $ :tab :portal
                cursor $ []
                tab $ :tab state
              group
                {} $ :style ({})
                comp-fade-in-out (>> states :fade-portal) ({})
                  if (= tab :portal) (comp-portal cursor)
                comp-fade-fn (>> states :fade-todolist) ({})
                  fn (renderer-states opacity stage)
                    if (= tab :todolist)
                      comp-todolist renderer-states (:tasks store) opacity stage
                comp-fade-in-out (>> states :fade-clock) ({})
                  if (= tab :clock)
                    translate
                      {,} :style $ {,} :x 0 :y -100
                      comp-clock $ >> states :clock
                comp-fade-in-out (>> states :fade-solar) ({})
                  if (= tab :solar)
                    translate
                      {,} :style $ {,} :x 0 :y 0
                      comp-solar (>> states :solar) 4
                comp-fade-in-out (>> states :fade-binary-tree) ({})
                  if (= tab :binary-tree)
                    translate
                      {,} :style $ {,} :x 0 :y 240
                      comp-tree-waving $ >> states :binary-tree
                comp-fade-in-out (>> states :fade-code-table) ({})
                  if (= tab :code-table)
                    translate
                      {,} :style $ {,} :x 0 :y 40
                      comp-code-table $ >> states :code-table
                comp-fade-in-out (>> states :fade-finder) ({})
                  if (= tab :finder)
                    translate
                      {,} :style $ {,} :x 0 :y 40
                      comp-finder $ >> states :finder
                comp-fade-in-out (>> states :fade-raining) ({})
                  if (= tab :raining)
                    translate
                      {,} :style $ {,} :x 0 :y 40
                      comp-raining $ >> states :raining
                comp-fade-in-out (>> states :fade-curve) ({})
                  if (= tab :curve)
                    translate
                      {,} :style $ {,} :x 0 :y 40
                      comp-ring $ >> states :ring
                comp-fade-in-out (>> states :fade-icons) ({})
                  if (= tab :icons)
                    translate
                      {,} :style $ {,} :x 0 :y 40
                      comp-icons-table $ >> states :icons
                comp-fade-in-out (>> states :fade-folding-fan) ({})
                  if (= tab :folding-fan)
                    translate
                      {} $ :style
                        {} (:x 0) (:y 40)
                      comp-folding-fan $ >> states :folding-fan
                comp-fade-in-out (>> states :fade-back) ({})
                  if (not= tab :portal)
                    translate
                      {} $ :style ({,} :x -400 :y -140)
                      button $ {}
                        :style $ style-button |Back
                        :event $ {}
                          :click $ fn (e d!)
                            d! cursor $ assoc state :tab :portal
        |init-state $ quote
          defn init-state (& args) :portal
        |style-button $ quote
          defn style-button (guide-text)
            {} (:text guide-text)
              :surface-color $ hsl 200 80 50
              :text-color $ hsl 200 80 100
              :font-size 16
              :w 80
              :h 32
        |update-state $ quote
          defn update-state (old-state new-page) new-page
      :proc $ quote ()
    |quamolit.util.time $ {}
      :ns $ quote (ns quamolit.util.time)
      :defs $ {}
        |get-tick $ quote
          defn get-tick () (; "\"return value in seconds")
            * 0.001 $ js/performance.now
      :proc $ quote ()
    |quamolit.comp.finder $ {}
      :ns $ quote
        ns quamolit.comp.finder $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp rect group >>
          [] quamolit.comp.folder :refer $ [] comp-folder
      :defs $ {}
        |card-collection $ quote
          def card-collection $ [] ([] "|喷雪花" "|檵木" "|石楠" "|文竹") ([] "|紫云英" "|绣球花" "|蔷薇") ([] "|金银花" "|栗树" "|婆婆纳" "|鸡爪槭") ([] "|卷柏" "|稻" "|马尾松" "|五角星花" "|苔藓") ([] "|芍药" "|木棉")
        |comp-finder $ quote
          defcomp comp-finder (states)
            let
                cursor $ :cursor states
                state $ either (:data states) ({})
              ; js/console.log state state
              rect
                {,} :style
                  {,} :w 1000 :h 600 :fill-style $ hsl 100 40 90
                  , :event $ {,} :click
                    fn (e d!) (d! cursor nil)
                group ({})
                  ->
                    [] $ [] "\"a" "\"c"
                    map-indexed $ fn (index folder) (; js/console.log folder)
                      let
                          ix $ rem index 4
                          iy $ js/Math.floor (/ index 4)
                          position $ []
                            - (* ix 200) 200
                            - (* iy 200) 100
                        [] index $ comp-folder (>> states index) folder position
                          fn $
                          , index
                            = index $ last state
                    filter $ fn (entry)
                      let-sugar
                            [] index tree
                            , entry
                          target $ last state
                        if (some? target) (= index target) true
        |init-state $ quote
          defn init-state (& args) ([] card-collection nil)
        |update-state $ quote
          defn update-state (state target) (; .log js/console state target) (assoc state 1 target)
      :proc $ quote ()
    |quamolit.util.detect $ {}
      :ns $ quote (ns quamolit.util.detect)
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
              if (= tx ty) (compare-number x y) (compare-number tx ty)
        |type-as-int $ quote
          defn type-as-int (x)
            cond
                number? x
                , 0
              (keyword? x) 1
              (string? x) 2
              :else 3
        |compare-number $ quote
          defn compare-number (x y)
            cond
                &< x y
                , -1
              (&> x y) 1
              true 0
      :proc $ quote ()
    |quamolit.comp.file-card $ {}
      :ns $ quote
        ns quamolit.comp.file-card $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp group rect text
          [] quamolit.render.element :refer $ [] translate alpha scale
          [] quamolit.util.iterate :refer $ [] iterate-instant
      :defs $ {}
        |comp-file-card $ quote
          defcomp comp-file-card (states card-name position cursor index parent-ratio popup?)
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {} (:popup 0) (:presence 0)
              {} $ :render
                fn (m)
                  let
                      popup-ratio $ / (:popup state) 1000
                      shift-x $ first position
                      shift-y $ last position
                      move-x $ * shift-x
                        + 0.1 $ * 0.9 (- 1 popup-ratio)
                      move-y $ * shift-y
                        + 0.1 $ * 0.9 (- 1 popup-ratio)
                      scale-ratio $ /
                        + 0.2 $ * 0.8 popup-ratio
                        , parent-ratio
                    translate
                      {,} :style $ {,}
                      alpha
                        {,} :style $ {,} :opacity
                          / (:presence state) 1000
                        translate
                          {,} :style $ {,} :x move-x :y move-y
                          scale
                            {,} :style $ {,} :ratio scale-ratio
                            rect
                              {,} :style
                                {,} :w 520 :h 360 :fill-style $ hsl 200 80 80
                                , :event $ {,} :click (handle-click cursor index popup?)
                              text $ {,} :style
                                {,} :fill-style (hsl 0 0 100) :text card-name :size 60
        |handle-click $ quote
          defn handle-click (cursor index popup?)
            fn (e d!)
              d! cursor $ if popup? nil index
        |init-instant $ quote
          defn init-instant (args state at?) ({,} :numb? false :popup 0 :popup-v 0 :presence 0 :presence-v 3)
        |on-tick $ quote
          defn on-tick (instant tick elapsed)
            let
                new-instant $ -> instant
                  iterate-instant :presence :presence-v elapsed $ [] 0 1000
                  iterate-instant :popup :popup-v elapsed $ [] 0 1000
              if
                and
                  < (:presence-v instant) 0
                  = (:presence new-instant) 0
                assoc new-instant :numb? true
                , new-instant
        |on-unmount $ quote
          defn on-unmount (instant) (assoc instant :presence-v -3)
        |on-update $ quote
          defn on-update (instant old-args args old-state state)
            let
                old-popup? $ last old-args
                popup? $ last args
              if (= old-popup? popup?) instant $ assoc instant :popup-v (if popup? 3 -3)
      :proc $ quote ()
    |quamolit.updater.core $ {}
      :ns $ quote
        ns quamolit.updater.core $ :require ([] quamolit.schema :as schema)
          [] quamolit.cursor :refer $ [] update-states
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
        |updater-fn $ quote
          defn updater-fn (store op op-data tick) (; js/console.log "|store update:" op op-data tick)
            case-default op
              do (js/console.log "\"unknown op" op) store
              :states $ update-states store op-data
              :gc-states $ gc-states store op-data
              :add $ task-add store op-data tick
              :rm $ task-rm store op-data tick
              :update $ task-update store op-data tick
              :toggle $ task-toggle store op-data tick
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
      :proc $ quote ()
    |quamolit.comp.ring $ {}
      :ns $ quote
        ns quamolit.comp.ring $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp group path
          [] quamolit.comp.debug :refer $ [] comp-debug
      :defs $ {}
        |comp-ring $ quote
          defcomp comp-ring (states)
            let
                cursor $ :cursor states
                state $ or (:data states) 0
                n 32
                unit $ * 2 (/ &PI n)
                shift 10
                rotation $ rem state 360
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
              []
                fn (elapsed d!)
                  d! cursor $ + state (* elapsed 0.3)
                group ({})
                  path $ {,} :style
                    {}
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
      :proc $ quote ()
    |quamolit.comp.folder $ {}
      :ns $ quote
        ns quamolit.comp.folder $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp rect text group >>
          [] quamolit.render.element :refer $ [] translate scale alpha
          [] quamolit.util.iterate :refer $ [] iterate-instant tween
          [] quamolit.comp.file-card :refer $ [] comp-file-card
      :defs $ {}
        |on-tick $ quote
          defn on-tick (instant tick elapsed)
            let
                new-instant $ -> instant
                  iterate-instant :presence :presence-v elapsed $ [] 0 1000
                  iterate-instant :popup :popup-v elapsed $ [] 0 1000
              if
                and
                  < (:presence-v instant) 0
                  = (:presence new-instant) 0
                assoc new-instant :numb? true
                , new-instant
        |update-state $ quote
          defn update-state (state target) target
        |on-update $ quote
          defn on-update (instant old-args args old-state state) (; .log js/console "|update folder..." args)
            let
                old-popup? $ last old-args
                popup? $ last args
              if (not= old-popup? popup?)
                assoc instant :popup-v $ if popup? 3 -3
                , instant
        |comp-folder $ quote
          defcomp comp-folder (states cards position navigate index popup?) (; js/console.log state)
            let
                cursor $ :cursor states
                state $ either (:data states)
                  {} (:popup 0) (:presence 0)
                shift-x $ first position
                shift-y $ last position
                popup-ratio $ / (:popup state) 1000
                place-x $ * shift-x (- 1 popup-ratio)
                place-y $ * shift-y (- 1 popup-ratio)
                ratio $ + 0.2 (* 0.8 popup-ratio)
                bg-light $ tween ([] 60 82) ([] 0 1) popup-ratio
              translate
                {,} :style $ {,} :x place-x :y place-y
                scale
                  {,} :style $ {,} :ratio ratio
                  alpha
                    {,} :style $ {,} :opacity
                      * 0.6 $ / (:presence state) 1000
                    rect $ {,} :style
                      {,} :w 600 :h 400 :fill-style $ hsl 0 80 bg-light
                      , :event
                        {,} :click $ fn (e d!) (navigate index)
                  group ({,})
                    -> cards
                      map-indexed $ fn (index card-name)
                        [] index $ let
                            jx $ rem index 4
                            jy $ js/Math.floor (/ index 4)
                            card-x $ * (- jx 1.5)
                              * 200 $ + 0.1 (* 0.9 popup-ratio)
                            card-y $ * (- jy 1.5)
                              * 100 $ + 0.1 (* 0.9 popup-ratio)
                          comp-file-card (>> states index) card-name ([] card-x card-y) cursor index ratio $ = state index
                      filter $ fn (entry)
                        let
                            index $ first entry
                          if (some? state) (= index state) true
                  if (not popup?)
                    rect $ {,} :style
                      {,} :w 600 :h 400 :fill-style $ hsl 0 80 0 0
                      , :event
                        {,} :click $ fn (e d!) (navigate index)
        |init-state $ quote
          defn init-state (cards position _ index popup?) nil
        |init-instant $ quote
          defn init-instant (args state at-place?) ({,} :presence 0 :presence-v 3 :popup 0 :popup-v 0)
        |on-unmount $ quote
          defn on-unmount (instant) (assoc instant :presence-v -3)
      :proc $ quote ()
    |quamolit.comp.raining $ {}
      :ns $ quote
        ns quamolit.comp.raining $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp rect group >>
          [] quamolit.comp.raindrop :refer $ [] comp-raindrop
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
                group ({})
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
      :proc $ quote ()
    |quamolit.cursor $ {}
      :ns $ quote (ns quamolit.cursor)
      :defs $ {}
        |update-states $ quote
          defn update-states (store op-data)
            let
                cursor $ first op-data
                data $ last op-data
              assoc-in store
                concat ([] :states) cursor $ [] :data
                , data
      :proc $ quote ()
      :configs $ {}
    |quamolit.math $ {}
      :ns $ quote (ns quamolit.math)
      :defs $ {}
        |bound-opacity $ quote
          defn bound-opacity (o)
            cond
                nil? o
                , 1
              (not (number? 0))
                do (js/console.warn "\"invalid opacity" 0) 1
              (< o 0) 0
              (> o 1) 1
              true o
        |bound-x $ quote
          defn bound-x (left right x)
            js/Math.min (js/Math.max left x) right
      :proc $ quote ()
      :configs $ {}
    |quamolit.util.order $ {}
      :ns $ quote (ns quamolit.util.order)
      :defs $ {}
        |by-coord $ quote
          defn by-coord (a b) (; js/console.log |comparing a b)
            cond
                = (count a) (count b) 0
                , 0
              (and (= (count a) 0) (> (count b) 0))
                , -1
              (and (> (count a) 0) (= (count b) 0))
                , 1
              true $ case
                compare (first a) (first b)
                -1 -1
                1 1
                recur (rest a) (rest b)
      :proc $ quote ()
    |quamolit.comp.binary-tree $ {}
      :ns $ quote
        ns quamolit.comp.binary-tree $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp line group path
          [] quamolit.render.element :refer $ [] rotate scale translate
          [] quamolit.comp.debug :refer $ [] comp-debug
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
              group ({})
                path $ {,} :style
                  {}
                    :points $ [] ([] x1 y1) ([] 0 0) ([] x2 y2)
                    :stroke-style $ hsl 200 80 50
                if (> level 0)
                  translate
                    {,} :style $ {,} :x x1 :y y1
                    scale
                      {,} :style $ {,} :ratio
                        + 0.6 $ * 1.3 shift-a
                      rotate
                        {,} :style $ {,} :angle
                          + (* 30 shift-a) 10
                        comp-binary-tree timestamp $ dec level
                if (> level 0)
                  translate
                    {,} :style $ {,} :x x2 :y y2
                    scale
                      {,} :style $ {,} :ratio
                        + 0.73 $ * 2 shift-b
                      rotate
                        {,} :style $ {,} :angle
                          + (* 20 shift-b) 10
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
      :proc $ quote
          declare comp-binary-tree
    |quamolit.comp.raindrop $ {}
      :ns $ quote
        ns quamolit.comp.raindrop $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp rect
          [] quamolit.render.element :refer $ [] translate alpha
          [] quamolit.util.iterate :refer $ [] iterate-instant
          quamolit.util.time :refer $ get-tick
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
                    {} $ :style
                      {} $ :opacity
                        cond
                          dropped? $ rand 0.5
                          (>= y (- earth 80))
                            / (- earth y) 80
                          (< dy 100) (/ dy 100)
                          true 1
                    rect $ {,} :style
                      {}
                        :fill-style $ hsl 200 80 80
                        :w $ if dropped? (rand 200) 3
                        :h $ if dropped? (rand 6) 30
                        :x $ :x position
                        :y y
      :proc $ quote ()
    |quamolit.main $ {}
      :ns $ quote
        ns quamolit.main $ :require
          [] quamolit.comp.container :refer $ [] comp-container
          [] quamolit.core :refer $ [] render-page configure-canvas setup-events
          [] quamolit.util.time :refer $ [] get-tick
          [] quamolit.updater.core :refer $ [] updater-fn
      :defs $ {}
        |dispatch! $ quote
          defn dispatch! (op op-data)
            if (list? op)
              recur :states $ [] op op-data
              do (; println "\"dispatch" op op-data)
                let
                    new-tick $ get-tick
                    new-store $ updater-fn @store-ref op op-data new-tick
                  reset! store-ref new-store
        |loop-ref $ quote (defatom loop-ref nil)
        |render-loop! $ quote
          defn render-loop! (? t)
            let
                target $ js/document.querySelector |#app
              ; js/console.log "\"store" @store-ref
              render-page (comp-container @store-ref) target dispatch!
              reset! loop-ref $ js/setTimeout
                fn () $ reset! *raq (js/requestAnimationFrame render-loop!)
                , 20
        |store-ref $ quote
          defatom store-ref $ {}
            :states $ {}
            :tasks $ []
        |reload! $ quote
          defn reload! () (js/clearTimeout @loop-ref) (js/cancelAnimationFrame @*raq) (render-loop!) (js/console.log "|code updated...")
        |main! $ quote
          defn main! () (load-console-formatter!)
            let
                target $ js/document.querySelector |#app
              configure-canvas target
              setup-events target dispatch!
              render-loop!
            set! js/window.onresize $ fn (event)
              let
                  target $ .!querySelector js/document |#app
                configure-canvas target
        |*raq $ quote (defatom *raq nil)
      :proc $ quote ()
    |quamolit.comp.icons-table $ {}
      :ns $ quote
        ns quamolit.comp.icons-table $ :require
          [] quamolit.alias :refer $ [] defcomp text line group >>
          [] quamolit.render.element :refer $ [] translate
          [] quamolit.comp.icon-increase :refer $ [] comp-icon-increase
          [] quamolit.comp.icon-play :refer $ [] comp-icon-play
      :defs $ {}
        |comp-icons-table $ quote
          defcomp comp-icons-table (states)
            group ({})
              translate
                {,} :style $ {,} :x -200
                comp-icon-increase $ >> states :increase
              translate
                {,} :style $ {,} :x 0
                comp-icon-play $ >> states :play
      :proc $ quote ()
    |quamolit.render.element $ {}
      :ns $ quote
        ns quamolit.render.element $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp native-translate native-alpha native-save native-restore native-rotate native-scale group rect text arrange-children
          [] quamolit.util.keyboard :refer $ [] keycode->key
      :defs $ {}
        |init-textbox $ quote
          defn init-textbox (props)
            :text $ :style props
        |translate $ quote
          defcomp translate (props & children)
            let
                style $ merge ({,} :x 0 :y 0) (:style props)
              group ({})
                native-save $ {}
                native-translate $ assoc props :style style
                group ({}) & children
                native-restore $ {}
        |scale $ quote
          defcomp scale (props & children)
            let
                style $ merge ({,} :x 0 :y 0) (:style props)
              group ({})
                native-save $ {}
                native-scale $ assoc props :style style
                group ({}) & children
                native-restore $ {}
        |update-textbox $ quote
          defn update-textbox (state keycode shift?) (; .log js/console keycode)
            let
                guess $ keycode->key keycode shift?
              if (some? guess) (str state guess)
                case-default keycode state $ 8
                  if (= state |) | $ substr state 0
                    - (count state) 1
        |input $ quote
          defcomp input (props)
            let
                style $ :style props
                event-collection $ :event props
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
                style-place-text $ {}
                style-text $ {} (:text-align |center)
                  :text $ :text style
                  :font-family |Optima
                  :size 20
                  :fill-style $ hsl 0 0 0
                  :x 0
                  :y 0
                  :max-width w
              group ({})
                rect $ {,} :style style-bg :event event-collection
                translate ({,} :style style-place-text)
                  text $ {,} :style style-text
        |textbox $ quote
          defcomp textbox (props)
            let
                cursor $ []
                state "\"TODO"
              {} $ :render
                fn (m)
                  let
                      style $ assoc (:style props) :text state
                    input $ {,} :style style :event
                      {,} :keydown $ fn (e d!)
                        let
                            event $ :event e
                          d! cursor (.-keyCode event) (.-shiftKey event)
        |alpha $ quote
          defcomp alpha (props & children)
            {} $ :tree
              let
                  style $ merge ({,} :opacity 0.01) (:style props)
                group ({})
                  native-save $ {}
                  native-alpha $ assoc props :style style
                  , & children $ native-restore ({})
        |pi-ratio $ quote
          def pi-ratio $ / js/Math.PI 180
        |rotate $ quote
          defcomp rotate (props & children)
            let
                style $ :style props
                angle $ * pi-ratio
                  or (:angle style) 30
              ; .log js/console "|actual degree:" angle
              group ({})
                native-save $ {}
                native-rotate $ {,} :style ({,} :angle angle)
                group ({}) (arrange-children children)
                native-restore $ {}
        |button $ quote
          defcomp button (props) (; js/console.log "\"button" props)
            let
                style $ either (:style props) ({})
                guide-text $ or (:text style) |button
                x $ or (:x style) 0
                y $ or (:y style) 0
                w $ or (:w style) 100
                h $ or (:h style) 40
                style-bg $ {} (:x x) (:y y)
                  :fill-style $ or (:surface-color style) (hsl 0 80 80)
                  :w w
                  :h h
                event-button $ :event props
                style-text $ {}
                  :fill-style $ or (:text-color style) (hsl 0 0 10)
                  :text guide-text
                  :size $ or (:font-size style) 20
                  :font-family $ or (:font-family style) |Optima
                  :text-align |center
                  :x x
                  :y y
              group ({})
                rect $ {,} :style style-bg :event event-button
                text $ {,} :style style-text
      :proc $ quote ()
    |quamolit.schema $ {}
      :ns $ quote (ns quamolit.schema)
      :defs $ {}
        |task $ quote
          def task $ {} (:text |) (:id nil) (:done? false)
      :proc $ quote ()
    |quamolit.comp.solar $ {}
      :ns $ quote
        ns quamolit.comp.solar $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.alias :refer $ [] defcomp group rect arc >>
          [] quamolit.render.element :refer $ [] rotate translate scale
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
                  {,} :style $ {,} :angle (rem state 360)
                  arc $ {} (:style style-large)
                  translate
                    {,} :style $ {,} :x 100 :y -40
                    arc $ {} (:style style-small)
                  if (> level 0)
                    scale
                      {,} :style $ {,} :ratio 0.6
                      translate
                        {,} :style $ {,} :x 260 :y 40
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
      :proc $ quote
          declare comp-solar
    |quamolit.render.paint $ {}
      :ns $ quote
        ns quamolit.render.paint $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.types :refer $ [] Component
          [] quamolit.util.string :refer $ [] gen-id!
          quamolit.math :refer $ bound-opacity
      :defs $ {}
        |paint-one $ quote
          defn paint-one (ctx directive eff-ref coord)
            let
                op $ .get directive :name
                style $ .get directive :style
                event $ .get directive :event
              ;  js/console.log :paint-one op style
              case-default op
                do (js/console.log "|painting not implemented" directive) @eff-ref
                :line $ paint-line ctx style
                :path $ paint-path ctx style
                :text $ paint-text ctx style
                :rect $ paint-rect ctx style coord event
                :native-save $ paint-save ctx style eff-ref
                :native-restore $ paint-restore ctx style eff-ref
                :native-translate $ paint-translate ctx style
                :native-alpha $ paint-alpha ctx style eff-ref
                :native-rotate $ paint-rotate ctx style
                :native-scale $ paint-scale ctx style
                :arc $ paint-arc ctx style coord event
                :image $ paint-image ctx style coord
                :group $ paint-group!
        |paint-text $ quote
          defn paint-text (ctx style)
            aset ctx "\"fillStyle" $ or (:fill-style style) (hsl 0 0 0)
            aset ctx "\"textAlign" $ or (:text-align style) |center
            aset ctx "\"textBaseline" $ or (:base-line style) |middle
            aset ctx "\"font" $ str
              or (:size style) 20
              , "|px "
                or (:font-family style) |Optima
            if (contains? style :fill-style)
              do $ .fillText ctx (:text style)
                or (:x style) 0
                or (:y style) 0
                or (:max-width style) 400
            if (contains? style :stroke-style)
              do $ .strokeText ctx (:text style)
                or (:x style) 0
                or (:y style) 0
                or (:max-width style) 400
        |paint-restore $ quote
          defn paint-restore (ctx style eff-ref) (.!restore ctx) (swap! eff-ref update :alpha-stack rest)
        |paint-alpha $ quote
          defn paint-alpha (ctx style eff-ref)
            let
                inherent-opacity $ first (:alpha-stack @eff-ref)
                opacity $ * inherent-opacity
                  bound-opacity $ :opacity style
              set! (.-globalAlpha ctx) opacity
              swap! eff-ref update :alpha-stack $ fn (alpha-stack)
                prepend (rest alpha-stack) opacity
        |paint-save $ quote
          defn paint-save (ctx style eff-ref) (.save ctx)
            swap! eff-ref update :alpha-stack $ fn (alpha-stack)
              prepend alpha-stack $ .-globalAlpha ctx
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
              .beginPath ctx
              .arc ctx x y r s-angle e-angle counterclockwise
              if (some? event)
                if
                  some? $ .-addHitRegion ctx
                  .!addHitRegion ctx $ js-object
                    :id $ write-cirru-edn coord
              if
                some? $ :fill-style style
                do
                  set! (.-fillStyle ctx) (:fill-style style)
                  .!fill ctx
              if
                some? $ :stroke-style style
                do
                  set! (.-lineWidth ctx) line-width
                  set! (.-strokeStyle ctx) (:stroke-style style)
                  set! (.-lineCap ctx) line-cap
                  set! (.-miterLimit ctx) miter-limit
                  .!stroke ctx
        |paint-scale $ quote
          defn paint-scale (ctx style)
            let
                ratio $ or (:ratio style) 1.2
              .!scale ctx ratio ratio
        |paint-translate $ quote
          defn paint-translate (ctx style)
            let
                x $ or (:x style) 0
                y $ or (:y style) 0
              .!translate ctx x y
        |paint $ quote
          defn paint (ctx tree eff-ref coord dispatch! elapsed) (; js/console.log "\"paint" tree)
            if (nil? tree) nil $ if
              and (record? tree) (relevant-record? Component tree)
              let
                  on-tick $ :on-tick tree
                if (fn? on-tick) (on-tick elapsed dispatch!)
                recur ctx (:tree tree) eff-ref
                  conj coord $ :name tree
                  , dispatch! elapsed
              do (paint-one ctx tree eff-ref coord)
                &doseq
                  cursor $ :children tree
                  paint ctx (last cursor) eff-ref
                    conj coord $ first cursor
                    , dispatch! elapsed
        |paint-line $ quote
          defn paint-line (ctx style)
            let
                x0 $ either (.get style :x0) 0
                y0 $ either (.get style :y0) 0
                x1 $ either (.get style :x1) 40
                y1 $ either (.get style :y1) 40
                line-width $ or (.get style :line-width) 4
                stroke-style $ or (.get style :stroke-style) (hsl 200 70 50)
                line-cap $ or (.get style :line-cap) |round
                line-join $ or (.get style :line-join) |round
                miter-limit $ or (.get style :miter-limit) 8
              .!beginPath ctx
              .!moveTo ctx x0 y0
              .!lineTo ctx x1 y1
              set! (.-lineWidth ctx) line-width
              set! (.-strokeStyle ctx) stroke-style
              set! (.-lineCap ctx) line-cap
              set! (.-miterLimit ctx) miter-limit
              .!stroke ctx
        |paint-path $ quote
          defn paint-path (ctx style)
            let
                points $ :points style
                first-point $ first points
              .beginPath ctx
              .moveTo ctx (first first-point) (last first-point)
              &doseq
                coords $ rest points
                case (count coords) (raise "|not supported coords")
                  2 $ .!lineTo ctx (nth coords 0) (nth coords 1)
                  4 $ .!quadraticCurveTo ctx (nth coords 0) (nth coords 1) (nth coords 2) (nth coords 3)
                  6 $ .!bezierCurveTo ctx (nth coords 0) (nth coords 1) (nth coords 2) (nth coords 3) (nth coords 4) (nth coords 5)
              if (contains? style :stroke-style)
                do
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
              if (contains? style :fill-style)
                do
                  set! (.-fillStyle ctx) (:fill-style style)
                  .!closePath ctx
                  .!fill ctx
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
        |get-image $ quote
          defn get-image (src)
            if (contains? @*image-pool src) (get @*image-pool src)
              let
                  image $ .!createElement js/document |img
                .!setAttribute image |src src
                , image
        |*image-pool $ quote
          defatom *image-pool $ {}
        |pi-ratio $ quote
          def pi-ratio $ / js/Math.PI 180
        |paint-rect $ quote
          defn paint-rect (ctx style coord event)
            let
                w $ or (:w style) 100
                h $ or (:h style) 40
                x $ -
                  or (:x style) 0
                  / w 2
                y $ -
                  or (:y style) 0
                  / h 2
                line-width $ or (:line-width style) 2
              .!beginPath ctx
              .!rect ctx x y w h
              if (some? event)
                if
                  some? $ .-addHitRegion ctx
                  .!addHitRegion ctx $ js-object
                    :id $ write-cirru-edn coord
              if (contains? style :fill-style)
                do
                  set! (.-fillStyle ctx) (:fill-style style)
                  .!fill ctx
              if (contains? style :stroke-style)
                do
                  set! (.-strokeStyle ctx) (:stroke-style style)
                  set! (.-lineWidth ctx) line-width
                  .!stroke ctx
        |paint-group! $ quote
          defn paint-group! $
        |paint-rotate $ quote
          defn paint-rotate (ctx style)
            let
                angle $ or (:angle style) 30
              .!rotate ctx angle
      :proc $ quote ()
    |quamolit.comp.task-toggler $ {}
      :ns $ quote
        ns quamolit.comp.task-toggler $ :require
          [] quamolit.util.string :refer $ [] hsl
          [] quamolit.util.iterate :refer $ [] iterate-instant tween
          [] quamolit.alias :refer $ [] defcomp group rect
          quamolit.math :refer $ bound-x bound-opacity
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
                rect $ {}
                  :style
                    {} (:w 40) (:h 40)
                      :fill-style $ hsl
                        + 240 $ * 120 state
                        , 80 60
                    , :event $ {}
                      :click $ fn (e d!) (d! :toggle task-id)
        |init-instant $ quote
          defn init-instant (args state at!)
            let
                done? $ first args
              {} (:numb? true)
                :done-value $ if done? 0 1000
                :done-velocity 0
        |on-tick $ quote
          defn on-tick (instant tick elapsed)
            iterate-instant instant :done-value :done-velocity elapsed $ [] 0 1000
        |on-update $ quote
          defn on-update (instant old-args args old-state state)
            let
                old-done? $ first old-args
                done? $ first args
              if (not= old-done? done?)
                assoc instant :done-velocity $ if
                  > (:done-value instant) 500
                  , -3 3
                , instant
      :proc $ quote ()
