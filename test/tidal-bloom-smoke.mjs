import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/tidal-bloom/calcit.core.mjs";
import * as core from "../target/js/tidal-bloom/calcit.core.mjs";
import {
  declare_progress as declareProgress,
  initial_model as initialModel,
  initial_series_model as initialSeriesModel,
  interactive_scene_with_series_at as interactiveSceneWithSeriesAt,
  interactive_scene_at as interactiveSceneAt,
  scene_at as sceneAt,
  series_active_$q_ as seriesActive,
  series_position_at as seriesPositionAt,
  set_series as setSeries,
  set_view as setView,
  view_active_$q_ as viewActive,
  view_position_at as viewPositionAt,
  start_timeline as startTimeline,
  update_timeline as updateTimeline,
  declare_timeline as declareTimeline,
  timeline_request as timelineRequest,
} from "../target/js/tidal-bloom/quamolit.examples.tidal-bloom.mjs";
import {
  sample_plan_at as samplePlanAt,
  build_execution_plan as buildExecution,
  update_execution_plan as updateExecution,
} from "../target/js/tidal-bloom/quamolit.retained-component.mjs";

function assertTimelineReference(plan, time) {
  const actual = toJsData(plan).scene;
  const expected = frame(time);
  assert.deepEqual(
    actual.nodes.map((item) => item.id),
    expected.nodes.map((item) => item.id),
    `节点与卸载时点 ${time}`,
  );
  const near = (left, right, path) => {
    if (typeof left === "number" && typeof right === "number") {
      assert.ok(Math.abs(left - right) < 1e-10, `${time} ${path}: ${left} != ${right}`);
    } else if (Array.isArray(left)) {
      assert.equal(left.length, right.length, path);
      left.forEach((value, index) => near(value, right[index], `${path}/${index}`));
    } else if (left !== null && typeof left === "object") {
      assert.deepEqual(Object.keys(left), Object.keys(right), path);
      for (const key of Object.keys(left)) near(left[key], right[key], `${path}/${key}`);
    } else assert.equal(left, right, path);
  };
  for (let index = 0; index < actual.nodes.length; index++) {
    near(actual.nodes[index].content, expected.nodes[index].content, actual.nodes[index].id);
    assert.deepEqual(actual.nodes[index].interaction, expected.nodes[index].interaction);
  }
}

test("完整时间轴保留全部节点渐变和卸载；乱序及同时间失效对照原投影", () => {
  let plan = startTimeline(0);
  for (const time of [0, 0.325, 1.4, 3.7, 7, 3.55, 3.8, 3.95, 3.98, 4.16, 4.65, 5.23, 8, 1.4]) {
    plan = updateTimeline(plan, time, 0, 0);
    assertTimelineReference(plan, time);
  }
  const before = toJsData(plan);
  const modelChanged = updateTimeline(plan, 1.4, 1, 0);
  assert.equal(toJsData(modelChanged).declarations, before.declarations + 1);
  assertTimelineReference(modelChanged, 1.4);
  const viewportChanged = updateTimeline(modelChanged, 1.4, 1, 1);
  assert.equal(toJsData(viewportChanged)["plan-builds"], toJsData(modelChanged)["plan-builds"] + 1);
  assertTimelineReference(viewportChanged, 1.4);
  assert.deepEqual(toJsData(plan), before, "失效不修改旧计划");
});

test("完整概览和分析各1000时间帧只声明/构建一次，静态节点与绑定槽共享", () => {
  for (const [start, step] of [
    [0.2, 0.0027],
    [4.66, 0.0022],
  ]) {
    let declarationCalls = 0;
    const declare = (...args) => {
      declarationCalls++;
      return declareTimeline(...args);
    };
    let plan = buildExecution(timelineRequest(start, 0, 0), declare);
    const initial = plan;
    for (let index = 0; index < 1000; index++) {
      const time = start + ((index * 37) % 1000) * step;
      plan = updateExecution(plan, timelineRequest(time, 0, 0), declare);
      assertTimelineReference(plan, time);
    }
    const result = toJsData(plan);
    assert.equal(result.declarations, 1);
    assert.equal(result["plan-builds"], 1);
    assert.equal(declarationCalls, 1, "核对真实声明回调，不只信计划中的计数");
    const keys = core.init_tags(["slots", "scene", "nodes"]);
    assert.equal(plan.get(keys.slots), initial.get(keys.slots));
    assert.equal(plan.get(keys.scene).get(keys.nodes).get(0), initial.get(keys.scene).get(keys.nodes).get(0));
    const same = samplePlanAt(plan, result.time);
    assert.equal(toJsData(same)["binding-samples"], result["binding-samples"]);
  }
});

const frame = (time) => toJsData(sceneAt(time));
const node = (scene, id) => scene.nodes.find((entry) => entry.id === id);
const content = (scene, id) => node(scene, id).content[1];
const interactiveFrame = (model, time) => toJsData(interactiveSceneAt(model, time));
const seriesFrame = (view, series, time) => toJsData(interactiveSceneWithSeriesAt(view, series, time));

test("图表 UI 组件进场、退场和真实增删按绝对时间可乱序重放", () => {
  const start = frame(0);
  const overview = frame(1.4);
  const exit = frame(3.7);
  const overlap = frame(4);
  const analytics = frame(7);
  assert.equal(start.nodes.length, 50);
  assert.equal(content(start, "brand").text, "METRIC / FLOW");
  assert.equal(content(start, "hero-card").fill.a, 0);
  assert.equal(content(overview, "hero-card").fill.a, 1);
  assert.ok(content(overview, "hero-card").width > 356);
  assert.ok(content(overview, "queue-card").x > 146);
  assert.ok(content(exit, "hero-card").fill.a < 1);
  assert.ok(node(exit, "kpi-a-card"), "新 KPI 在旧卡片退出时加入");
  assert.equal(node(exit, "chart-card"), undefined, "图表稍后才加入");
  assert.equal(node(overlap, "hero-card"), undefined, "退出完成后旧卡片卸载");
  assert.ok(node(overlap, "activity-card"), "活动组件稍后退出");
  assert.ok(node(overlap, "chart-card"), "趋势图在第二波加入");
  assert.equal(node(overlap, "breakdown-card"), undefined);
  assert.equal(node(analytics, "activity-card"), undefined);
  assert.equal(content(analytics, "kpi-a-card").fill.a, 1);
  assert.equal(content(analytics, "bar-value-11").height, 126);
  assert.equal(content(analytics, "channel-direct-fill").width, 42);
  assert.deepEqual(frame(1.4), overview);
  assert.deepEqual(frame(7), analytics);
});

test("两屏组件产出有效几何、颜色和互不重复的节点身份", () => {
  for (const time of [0, 1.4, 3.7, 4, 5, 7, 8]) {
    const scene = frame(time);
    assert.equal(new Set(scene.nodes.map((entry) => entry.id)).size, scene.nodes.length);
    for (const entry of scene.nodes) {
      const [kind, shape] = entry.content;
      assert.ok(kind === "rect" || kind === "text");
      assert.ok(Number.isFinite(shape.x) && Number.isFinite(shape.y));
      if (kind === "rect") {
        assert.ok(Number.isFinite(shape.width) && shape.width >= 0);
        assert.ok(Number.isFinite(shape.height) && shape.height >= 0);
      } else {
        assert.ok(shape.text.length > 0 && shape.size > 0);
      }
      for (const channel of [shape.fill.r, shape.fill.g, shape.fill.b, shape.fill.a]) {
        assert.ok(Number.isFinite(channel) && channel >= 0 && channel <= 1);
      }
    }
  }
});

test("进度组件公开 Scene 绑定与版本化 Motion 描述，而非宿主 JS 补间", () => {
  const declaration = toJsData(declareProgress(-190, 0, 0, 0, 0));
  assert.deepEqual(
    declaration.motions.map((item) => item.id),
    ["progress/width", "progress/draft", "progress/done"],
  );
  assert.deepEqual(
    declaration.scene.nodes.map((item) => item.bindings[0]?.["motion-id"]),
    [undefined, "progress/width", "progress/draft", "progress/done"],
  );
  assert.deepEqual(declaration.motions[0].motion[1], {
    start: 18,
    duration: 24,
    from: 68,
    to: 310,
    easing: ["smoothstep"],
  });
});

test("交互 Model 在反向打断时保持位置连续，且历史帧可乱序重放", () => {
  const initial = initialModel(0);
  const entering = setView(initial, 1, 0);
  const quarter = viewPositionAt(entering, 0.3);
  const reversing = setView(entering, 0, 0.3);
  assert.equal(quarter, 0.15625);
  assert.equal(viewPositionAt(reversing, 0.3), quarter);
  assert.ok(viewPositionAt(reversing, 0.6) < quarter);
  const interrupted = setView(reversing, 1, 0.6);
  assert.equal(viewPositionAt(interrupted, 0.6), viewPositionAt(reversing, 0.6));
  assert.deepEqual(interactiveFrame(interrupted, 0.3), interactiveFrame(reversing, 0.3));
  assert.equal(interactiveFrame(interrupted, 0).nodes.length, 50);
  const midway = interactiveFrame(initialModel(0.5), 0);
  assert.equal(node(midway, "hero-card"), undefined);
  assert.ok(node(midway, "kpi-a-card"));
  assert.equal(node(midway, "chart-card"), undefined);
  assert.equal(node(interactiveFrame(interrupted, 1.8), "hero-card"), undefined);
  assert.ok(node(interactiveFrame(interrupted, 1.8), "bar-value-11"));
  assert.equal(viewActive(interrupted, 1.8), false);
  assert.equal(toJsData(interrupted).events.length, 3);
  assert.throws(() => setView(interrupted, 0.4, 0.8));
  assert.throws(() => setView(interrupted, 0, 0.4));
});

test("交互视图往返 100 次后仅保留当前屏组件，并可分享中间位置", () => {
  let model = initialModel(0);
  for (let index = 0; index < 100; index++) {
    model = setView(model, index % 2 === 0 ? 1 : 0, index * 1.2);
    const scene = interactiveFrame(model, index * 1.2 + 1.2);
    assert.equal(new Set(scene.nodes.map((entry) => entry.id)).size, scene.nodes.length);
    assert.equal(Boolean(node(scene, "hero-card")), index % 2 !== 0);
    assert.equal(Boolean(node(scene, "kpi-a-card")), index % 2 === 0);
    assert.equal(viewActive(model, index * 1.2 + 1.2), false);
  }
  assert.equal(toJsData(model).events.length, 100);
  const shared = initialModel(0.42);
  assert.deepEqual(interactiveFrame(shared, 0), interactiveFrame(shared, 10));
});

test("图表数据系列在打断与反向时保持柱子身份和高度连续", () => {
  const view = initialModel(1);
  const visitors = initialSeriesModel(0);
  const revenue = setSeries(visitors, 1, 0);
  assert.equal(content(seriesFrame(view, revenue, 0), "bar-value-0").height, 42);
  assert.equal(content(seriesFrame(view, revenue, 0.45), "bar-value-0").height, 81.5);
  assert.equal(content(seriesFrame(view, revenue, 0.9), "bar-value-0").height, 121);
  const reversing = setSeries(revenue, 0, 0.45);
  assert.equal(seriesPositionAt(reversing, 0.45), seriesPositionAt(revenue, 0.45));
  assert.deepEqual(seriesFrame(view, reversing, 0.2), seriesFrame(view, revenue, 0.2));
  assert.ok(content(seriesFrame(view, reversing, 0.7), "bar-value-0").height < 81.5);
  assert.equal(content(seriesFrame(view, reversing, 1.35), "bar-value-0").height, 42);
  assert.equal(seriesActive(reversing, 1.35), false);
  for (const scene of [
    seriesFrame(view, revenue, 0),
    seriesFrame(view, revenue, 0.45),
    seriesFrame(view, revenue, 0.9),
  ]) {
    assert.equal(new Set(scene.nodes.map((entry) => entry.id)).size, scene.nodes.length);
    assert.equal(scene.nodes.filter((entry) => entry.id.startsWith("bar-value-")).length, 12);
  }
  assert.throws(() => setSeries(reversing, 0.3, 1.4));
  assert.throws(() => setSeries(reversing, 1, 0.2));
});

test("数据系列反复切换 100 次后可重放，并仅保留有界事件", () => {
  const view = initialModel(1);
  let series = initialSeriesModel(0);
  for (let index = 0; index < 100; index++) {
    series = setSeries(series, index % 2 === 0 ? 1 : 0, index);
    const scene = seriesFrame(view, series, index + 0.9);
    assert.equal(content(scene, "bar-value-0").height, index % 2 === 0 ? 121 : 42);
  }
  assert.equal(toJsData(series).events.length, 100);
  assert.deepEqual(seriesFrame(view, series, 3.5), seriesFrame(view, series, 3.5));
  assert.deepEqual(seriesFrame(view, initialSeriesModel(0.4), 0), seriesFrame(view, initialSeriesModel(0.4), 9));
});
