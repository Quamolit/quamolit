# Quamolit vNext: core contract (draft)

This document records the M1 direction for [API design](https://github.com/Quamolit/quamolit/issues/30),
[deterministic time](https://github.com/Quamolit/quamolit/issues/31), and
[Scene IR](https://github.com/Quamolit/quamolit/issues/32). It is a design draft,
not a claim that the proposed APIs below are implemented.

## Preserve the model

Quamolit remains a declarative canvas animation library. Application and
animation state are explicit application data, not private state hidden in a
renderer. A component describes a scene from that state; an update receives an
event or frame sample and produces the next state. Rendering never advances the
clock, dispatches updates, or creates event handlers as a paint side effect.

The intended flow is:

```text
input + absolute time → update model → pure view → Scene IR → renderer
                                             └────→ hit index
```

The current `defcomp`/`Shape` tree is the migration source, not yet the new IR.
Today `on-tick` is invoked during `paint`, and hit areas are accumulated during
painting. Issues #33 and #34 separate these effects; until then, screenshot
tests must use the explicit clock helpers and redraw without ticking.

## Time contract

All framework time values are seconds. `step-frame(previous, current)` is a
pure operation returning `FrameSample {time, elapsed}`. Equal times yield zero
elapsed; a rewind raises. `reset-frame-clock!` is the explicit escape hatch for
seeking backward in legacy code. `advance-frame-clock!` now consumes the same
pure step calculation, so the current imperative entry and future evaluator
share monotonicity semantics.

The vNext frame evaluator should accept absolute time and the previous model
explicitly. Its result should include the next model and scene, with no canvas
or browser dependency. A visual fixture will reset its model and clock, replay
the required samples, and render the requested scene. Calling render twice on
the same result must neither tick again nor change its pixels. If an animation
uses randomness, the seed or generator state belongs in the model. Asynchronous
resources need a declared ready/failure state before a screenshot is asserted.

## Proposed public API boundaries

- **Component/view:** a pure function of props and model data returning
  declarative nodes. Stable keys identify repeated children; component names
  alone are not sufficient identity.
- **Update:** event and frame update functions change model data. Keyframes,
  easing, loop, and mirror may be convenient descriptors, but their current
  sampled values are evaluated from explicit time, not renderer-owned hooks.
- **Scene:** immutable, typed nodes for group, drawable, transform, clip, and
  eventually batch/instances. No DOM, Canvas2D, WebGPU, or JavaScript handles.
- **Renderer:** consumes a scene and resources. Canvas2D provides the reference
  implementation and a fallback; the eventual preferred backend is chosen from
  current platform support and measured results. WebGPU may consume selected
  batch layers without replacing the component/model API.
- **Interaction:** an index derived from the scene, with documented z-order,
  transform, clip, and pointer-capture behavior. It must be testable without
  painting. GPU picking is optional, not the normal 2D event path.
- **Host boundary:** generic browser FFI belongs in `calcit-lang/js-ffi`;
  Quamolit retains only a thin library-specific adapter.

The Scene IR must specify coordinate and angle units, colors, alpha
composition, clipping, image/text resource identity, draw order, and hit order.
Its first version need not expose all GPU concepts. A batch node may reference
typed arrays and dirty ranges, but ordinary components should not need to know
GPU buffer layouts.

## Migration order and compatibility

1. Specify and test the time, state, identity, and Scene IR contracts (M1).
2. Render the IR with Canvas2D, derive hit regions separately, and restore the
   real application entry rather than the compile-only bootstrap (M2).
3. Add a data-driven batch path, benchmark the complete frame, and prototype a
   WebGPU layer. Choose the preferred backend from those measurements, with
   Canvas2D available when WebGPU is unsuitable. Adopt Use.GPU internals if
   their measured benefit justifies the runtime and maintenance cost (M3).

The old `on-tick` callback and `defcomp` shape syntax remain legacy migration
inputs while M1 is underway. Their exact replacement and deprecation window
are deliberately unresolved in #30. Existing `yarn compile` validates only
the bootstrap entry; it does not validate the original application behavior.
