# Deterministic frame testing

The clock uses absolute seconds. Reset before each independent case, then call
`advance-frame-clock!` with monotonically increasing timestamps. The returned
delta drives `on-tick`; passing the same timestamp gives a zero delta and
passing an earlier one raises. Use `sample-times` for inclusive sampling
(for example `sample-times 0 1 4` yields 0, 0.25, 0.5, 0.75, 1).

From the project directory, with Node.js 24 and Calcit 0.19.1:

```sh
yarn test:clock
yarn compile:visual
yarn vite
```

Open `http://localhost:5173/test/visual.html?time=0.5`. The page runs its
pixel checks at all five sampled times, verifies that redraw and a repeated
timestamp do not advance progress, and verifies that a rewind is rejected.
`PASS` below the canvas means the checks completed. Click a timestamp or
change the `time` query parameter to capture a particular frame. Each frame
starts from a reset clock, so screenshot results are independent of wall time,
animation-frame scheduling, and click order. The 280×160 canvas has a white
background; at time `t` the pink rectangle is centered at `x = 48 + 160t`,
`y = 80`.

The fixture uses the framework's component tree walker and the actual
rectangle painter. Other painter branches are not included yet because their
legacy strict-type diagnostics currently block the visual entry from compiling.
When those branches migrate, add focused fixtures for text, transforms, paths,
images, transparency, and event regions, then add image baselines in a pinned
browser environment. Until then the current browser check is a deterministic
pixel and screenshot harness, not a full visual-regression CI suite.

`yarn compile:visual` changes only ignored `js-out/` output. Run
`yarn compile` again before building the regular bootstrap entry.
