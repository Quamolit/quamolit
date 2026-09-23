
Quamolit in calcit-js / Calcit 版 Quamolit
----

Quamolit 是用 Calcit 编写的声明式 Canvas 动画库。组件描述画面，应用模型保存动画状态；框架提供绘制与帧更新能力。

当前 vNext 迁移仍在进行中：[设计草案](docs/vnext-design.md) 说明目标 API 与渲染边界，[确定性帧测试](test/README.md) 说明固定时间截图的使用方式。要在本地编译和运行，需要 Calcit 0.19.1 与 Node.js 24：

```sh
corepack enable
yarn install --immutable
yarn compile
yarn test:clock
yarn test:runtime
yarn release
```

目前 `yarn compile` 仅验证 `quamolit.bootstrap`，还不能证明旧版应用入口的功能已恢复。旧版 `paint` 会先执行独立的 `tick-tree` 阶段，再绘制；`paint-tree-only-with` 可在不推进动画状态的情况下重绘。下文保留英文说明及旧版 API 示例，作为迁移参考。

---

English documentation and legacy API examples follow.

> what if we describe UI transitions in React's way? Previously written in [ClojureScript](https://github.com/Quamolit/quamolit.cljs).

Demo http://r.Quamolit.org/quamolit.calcit/

Features:

* declarative component markups for Canvas
* React-like components, element DSLs, event handlers, global Store
* animation abstractions

### Design

The staged vNext API and rendering contract is documented in
[docs/vnext-design.md](docs/vnext-design.md). It is a draft; the API described
there is not yet implemented.

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
* * `...` styles used in Canvas API
* * `event` a hashmap of events, mainly `:click` events
* `children` sorted hashmap with values of child nodes

Component record:

* `name` keyword
* `on-tick` function to update animation state at every tick
* `tree` cached from render tree

### Paint Elements

```cirru
line $ {}
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
  :w 100
  :h 40
  :x $ - (/ w 2)
  :y $ - (/ h 2)
  :line-width 2

text $ {}
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
  :x 0
  :y 0

scale $ {}
  :ratio 1.2

alpha $ {}
  :opacity 0.5

rotate $ {}
  :angle 30

button $ {}
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
  :w 0
  :h 0
  :text "|TODO"

comp-debug data $ {}


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
```

### HUD logs

```cirru
:require
  quamolit.hud-logs :refer $ hud-log

hug-log :data "|more data"
```

### Develop

To run this project, install Calcit 0.19.1 and Node.js 24 first:

```bash
corepack enable
yarn install --immutable
caps --ci
calcit calcit.cirru js
yarn vite
```

The 0.19.1 migration currently uses `quamolit.bootstrap` as a compile-only
entry. The original canvas application remains in `quamolit.app.main`, but is
not wired into the Vite entry yet: its strict type check still reports legacy
warnings. `yarn compile` and `yarn release` validate the migration baseline;
they do not validate the original application's behavior. `yarn test:runtime`
also checks the generated core against the installed `@calcit/procs` runtime.

### Deterministic frame tests

Quamolit now exposes an absolute frame clock (`reset-frame-clock!`,
`advance-frame-clock!`), a separate `tick-tree` pass for component `on-tick`
callbacks, and `paint-tree-only-with` for drawing without advancing animation
state. The compatibility `paint-tree-with` entry combines these passes.
Advancing a frame calls component `on-tick` once with the elapsed seconds; a
redraw can paint the same state without advancing time.
The browser fixture exercises this with a real Canvas rectangle at fixed
timestamps, including intermediate frames. See [test/README.md](test/README.md)
for the screenshot workflow and current coverage limits.

### History

By rethinking MVC and GUI during using React, I developed the need of writing animations with declarative code. It was late 2014. I created the first prototype with CoffeeScript but it's not viable. In early 2016, I rewrote it with ClojureScript, which is last version of Quamolit. Now it's being rewritten in calcit-js.

### License

MIT
