import assert from "node:assert/strict";
import { test } from "node:test";
import { to_js_data as toJsData } from "../target/js/tidal-bloom/calcit.core.mjs";
import {
  declare_progress as declareProgress,
  scene_at as sceneAt,
} from "../target/js/tidal-bloom/quamolit.examples.tidal-bloom.mjs";

const frame = (time) => toJsData(sceneAt(time));
const node = (scene, id) => scene.nodes.find((entry) => entry.id === id);
const content = (scene, id) => node(scene, id).content[1];

test("图表 UI 组件进场、退场和真实增删按绝对时间可乱序重放", () => {
  const start = frame(0);
  const overview = frame(1.4);
  const exit = frame(3.7);
  const overlap = frame(4);
  const analytics = frame(7);
  assert.equal(start.nodes.length, 50);
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
