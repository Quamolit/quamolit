
[Refactoring] Quamolit in calcit-js
----

> what if we make animations in React's way?

Demo(check [browser compatibility](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/addHitRegion#Browser_compatibility) first) http://r.Quamolit.org/quamolit.calcit/

> Still prototype... Quamolit requires `ctx.addHitRegion(opts)`, which is an experimental technology.

Features:

* declarative component markups for Canvas
* React-like components, element DSLs, event handlers, global Store
* animation abstractions

### Design

Quamolit is trying to combine two things:

* declarative programming experience like React
* canvas API drawing and animations

Seeing from MVC, animations has Models too. Said by FRP(Functional Reactive Programming), the Model for animations is values changing over time, like a stream. It does have a Model, a Model for animations. But we want to program in a declarative way, which means we need that Model to be generated from our code. Meanwhile CSS animations is not we want because of the private animation states, we need global app state. So question, how to expression a time varying Model with declarative code?

### Usage

Define components:

```cirru
defcomp comp-demo ()
  group ({})

defcomp comp-demo-tick (states)
  let
      cursor $ :cursor states
      state $ or (:data states) {} (:demo :demo)
  []
    fn (elapsed d!)
      ; "this is there you handle animation states"
      d! cursor (merge state state-changes)
    group ({})
      group ({})
```

It requires some boilerplate code to start a Quamolit project. I would suggest starting by forking my [workflow](https://github.com/Quamolit/quamolit-workflow).

### Component Specs

Shape records:

* `name` keyword
* `props` a hashmap of:
* * `style` a hashmap of styles used in Canvas API
* * `event` a hashmap of events, mainly `:click` events
* * `attrs` a hashmap
* `children` sorted hashmap with values of child nodes

Component record:

* `name` keyword
* `on-tick` function to update animation state at every tick
* `tree` cached from render tree

### Paint Elements

```cirru
line $ {}
  :style $ {}
    :x0 0
    :y0 0
    :x1 40
    :y1 40
    :line-width 4
    :stroke-style (hsl 200 870 50)
    :line-cap :round
    :line-join :round
    :milter-limit 8

arc $ {}
  :style $ {}
    :x 0 :y 0:r 40
    :s-angle 0
    :e-angle 60
    :line-width 4
    :counterclockwise true
    :line-cap :round
    :line-join :round
    :miter-limit 8
    :fill-style nil
    :stroke-style nil

rect $ {}
  :style $ {}
    :w 100
    :h 40
    :x $ - (/ w 2)
    :y $ - (/ h 2)
    :line-width 2

text $ {}
  :style $ {}
    :x 0
    :y 0
    :fill-style (hsl 0 0 0)
    :text-align :center
    :base-linee :middle
    :size 20
    :font-family |Optima
    :max-width 400
    :text |todo

image $ {}
  :style $ {}
    :src "|lotus.jpg"
    :sx 0
    :sy 0
    :sw 40
    :sh 40
    :dx 0
    :dy 0
    :dw 40
    :dh 40
```

### Paint Components

```cirru
translate $ {}
  :style $ {}
    :x 0
    :y 0

scale $ {}
  :style $ {}
    :ratio 1.2

alpha $ {}
  :style $ {}
    :opacity 0.5

rotate $ {}
  :style $ {}
    :angle 30

button $ {}
  :style $ {}
    :x 0
    :y 0
    :w 100
    :h 40
    :text "|button"
    :surface-color (hsl 0 80 80)
    :text-color (hsl 0 0 10)
    :font-family "|Optima"
    :font-size 20

input $ {}
  :style $ {}
    :w 0
    :h 0
    :text "|TODO"

comp-debug data $ {}
```

### Develop

To run this project, with [calcit_runner](https://github.com/calcit-lang/calcit_runner.rs) and [Vite](https://vitejs.dev/):

```bash
yarn
cr --emit-js --once
yarn vite
```

### History

By rethinking MVC and GUI during using React, I developed the need of writing animations with declarative code. It was late 2014. I created the first prototype with CoffeeScript but it's not viable. In early 2016, I rewrote it with ClojureScript, which is last version of Quamolit. Now it's being rewritten in calcit-js.

### License

MIT
