import assert from "node:assert/strict";
import { test } from "node:test";
import {
  to_js_data as toJsData,
  init_tags as initTags,
  assoc,
  CalcitSliceList,
} from "../target/js/curve/calcit.core.mjs";
import {
  curve_points as curvePoints,
  sampled_curve_points as sampledCurvePoints,
  scene_at as sceneAt,
  draw_$x_ as draw,
} from "../target/js/curve/quamolit.examples.curve.mjs";
import { validate_scene as validateScene } from "../target/js/curve/quamolit.scene-ir.mjs";
import {
  compile_hit_plan as compileHitPlan,
  hit_test_plan as hitTestPlan,
  local_hit_$q_ as localHit,
  compile_hit_plan_with_positions as compileWithPositions,
  instance_hit_index as instanceHitIndex,
} from "../target/js/curve/quamolit.scene-hit.mjs";
import {
  cubic_stroke_scene as cubicScene,
  instance_hit_document as instanceDocument,
  instance_hit_source as instanceSource,
} from "../target/js/curve/quamolit.test.scene-hit-fixture.mjs";

test("实例命中复用不可变位置快照，逆变换、祖先裁剪和倒序索引保持一致", () => {
  const tags = initTags(["candidates", "instance-points", "version"]);
  let calls = 0;
  const lookup = (source) => {
    calls++;
    return instanceSource(source);
  };
  const plan = compileWithPositions(instanceDocument(1), lookup);
  const points = plan.getRequired(tags.candidates).toArray()[0].getRequired(tags["instance-points"]);
  const index = (x, y) => toJsData(instanceHitIndex(plan, "dots", x, y));
  assert.deepEqual(index(80, 130), ["some", 1], "重叠处选最后绘制的实例");
  assert.deepEqual(index(80, 110), ["some", 0]);
  assert.deepEqual(index(80, 150), ["none"], "局部x=25仍在实例内，但在祖先clip外");
  assert.deepEqual(toJsData(instanceHitIndex(plan, "absent", 80, 130)), ["none"]);
  for (let frame = 0; frame < 1000; frame++) {
    assert.equal(toJsData(hitTestPlan(plan, 80, 130))[1].target, "dots-action");
    assert.deepEqual(index(80, 130), ["some", 1]);
  }
  assert.equal(calls, 1, "查询不得重新读取资源源或构建位置");
  assert.equal(plan.getRequired(tags.candidates).toArray()[0].getRequired(tags["instance-points"]), points);
  const next = compileWithPositions(instanceDocument(2), lookup);
  assert.deepEqual(toJsData(hitTestPlan(next, 80, 130)), ["miss", 1]);
  assert.deepEqual(index(80, 130), ["some", 1], "新版本不改变旧计划");
  assert.equal(calls, 2);
  assert.deepEqual(toJsData(hitTestPlan(compileHitPlan(instanceDocument(1)), 80, 130)), ["miss", 0]);
  for (const invalid of [NaN, Infinity, -Infinity]) {
    assert.throws(() => instanceHitIndex(plan, "dots", invalid, 130), /invalid-hit-coordinate/);
    assert.throws(() => instanceHitIndex(plan, "dots", 80, invalid), /invalid-hit-coordinate/);
  }
});

test("实例源拒绝身份、版本、数量与非有限坐标不匹配，失败不改变旧计划", () => {
  const tags = initTags(["source", "points", "id", "version", "count", "x", "y"]);
  const document = instanceDocument(1);
  const old = compileWithPositions(document, instanceSource);
  const invalidSources = [
    (resolved) => assoc(resolved, tags.source, assoc(resolved.getRequired(tags.source), tags.id, "other")),
    (resolved) => assoc(resolved, tags.source, assoc(resolved.getRequired(tags.source), tags.version, 2)),
    (resolved) => assoc(resolved, tags.source, assoc(resolved.getRequired(tags.source), tags.count, 3)),
    (resolved) => assoc(resolved, tags.points, new CalcitSliceList([])),
    ...[NaN, Infinity, -Infinity].flatMap((value) =>
      [tags.x, tags.y].map((axis) => (resolved) => {
        const points = resolved.getRequired(tags.points);
        return assoc(resolved, tags.points, assoc(points, 0, assoc(points.toArray()[0], axis, value)));
      }),
    ),
  ];
  for (const corrupt of invalidSources) {
    assert.throws(
      () => compileWithPositions(document, (source) => corrupt(instanceSource(source))),
      /invalid-instance-hit-source/,
    );
    assert.equal(toJsData(hitTestPlan(old, 80, 130))[1].target, "dots-action");
  }
});

test("三次曲线命中计划只在编译时准备几何，查询不重新读取原始控制段", () => {
  const tags = initTags(["nodes", "content", "segments", "candidates", "curve-parts"]);
  const scene = cubicScene("arch"),
    plan = compileHitPlan(scene);
  const content = scene.getRequired(tags.nodes).toArray()[0].getRequired(tags.content);
  const segments = content.extra[0].getRequired(tags.segments).toArray();
  const parts = plan.getRequired(tags.candidates).toArray()[0].getRequired(tags["curve-parts"]);
  for (const segment of segments)
    Object.defineProperty(segment, "nthAt", {
      value() {
        throw Error("unexpected-curve-refinement");
      },
    });
  for (let index = 0; index < 1000; index++) {
    assert.equal(toJsData(hitTestPlan(plan, 50, 30))[0], "hit");
    assert.equal(toJsData(hitTestPlan(plan, 1000, 1000))[0], "miss");
  }
  assert.equal(plan.getRequired(tags.candidates).toArray()[0].getRequired(tags["curve-parts"]), parts);
  assert.throws(() => localHit(content, 50, 30), /unexpected-curve-refinement/, "负例证明读取保护实际生效");
});

test("共线三次曲线按参数次序保留真实极值，尖点覆盖而不是扩大到控制点", () => {
  const scene = cubicScene("reverse-line"),
    plan = compileHitPlan(scene);
  const hit = (x, y) => toJsData(hitTestPlan(plan, x, y))[0] === "hit";
  // 独立解析根：x(t)=20+240t-720t²+480t³；x'(t)=0。
  const at = (t) => 20 + 240 * t - 720 * t * t + 480 * t * t * t;
  const high = at((3 - Math.sqrt(3)) / 6),
    low = at((3 + Math.sqrt(3)) / 6);
  for (const x of [high + 9, low - 9]) {
    assert.equal(hit(x, 70), true);
    assert.equal(hit(x, 73), true);
    assert.equal(hit(x, 75), false);
  }
  assert.equal(hit(100, 70), false, "不能使用控制点的凸包替代真实曲线范围");
  assert.equal(hit(-60, 70), false);
  assert.equal(toJsData(hitTestPlan(compileHitPlan(cubicScene("collapsed")), 20, 70))[0], "miss");
});

test("32 段闭合曲线顶点数固定且只由绝对时间决定", () => {
  assert.equal(toJsData(curvePoints(0)).length, 98, "首尾闭合的 1 + 32 * 3 + 1 个控制点");
  assert.equal(toJsData(curvePoints(5)).length, 98);
  assert.deepEqual(toJsData(curvePoints(3)), toJsData(curvePoints(3)), "重复采样一致");
  assert.notDeepEqual(toJsData(curvePoints(0)), toJsData(curvePoints(50)), "旋转随时间改变顶点");
});

test("Scene 直接保留 32 段原生三次贝塞尔，不把生产绘制降级为折线", () => {
  const scene = toJsData(sceneAt(30));
  const controls = toJsData(curvePoints(30));
  const sampled = toJsData(sampledCurvePoints(30));
  assert.equal(validateScene(sceneAt(30)), true);
  assert.equal(scene.nodes.length, 1);
  assert.equal(scene.nodes[0].content[0], "cubic-path");
  assert.equal(scene.nodes[0].content[1].segments.length, 32);
  assert.deepEqual(scene.nodes[0].content[1].start, controls[0]);
  assert.equal(sampled.length, 1 + 32 * 16);
  assert.notDeepEqual(sampled, controls);
  for (let segment = 0; segment < 32; segment += 1) {
    const [p0, p1, p2, p3] = controls.slice(segment * 3, segment * 3 + 4);
    const actualEnd = sampled[(segment + 1) * 16];
    assert.ok(Math.hypot(actualEnd.x - p3.x, actualEnd.y - p3.y) < 1e-9);
    const u = 0.5,
      v = 1 - u;
    const expected = {
      x: v ** 3 * p0.x + 3 * v ** 2 * u * p1.x + 3 * v * u ** 2 * p2.x + u ** 3 * p3.x,
      y: v ** 3 * p0.y + 3 * v ** 2 * u * p1.y + 3 * v * u ** 2 * p2.y + u ** 3 * p3.y,
    };
    const midpoint = sampled[segment * 16 + 8];
    assert.ok(Math.hypot(midpoint.x - expected.x, midpoint.y - expected.y) < 1e-9);
  }
});

test("旧 16 步折线在 4 倍放大与 DPR2 下超过 1px，生产路径调用 32 次原生 bezierCurveTo", () => {
  const controls = toJsData(curvePoints(30));
  const cubic = (p0, p1, p2, p3, t) => {
    const u = 1 - t;
    return {
      x: u ** 3 * p0.x + 3 * u ** 2 * t * p1.x + 3 * u * t ** 2 * p2.x + t ** 3 * p3.x,
      y: u ** 3 * p0.y + 3 * u ** 2 * t * p1.y + 3 * u * t ** 2 * p2.y + t ** 3 * p3.y,
    };
  };
  const distanceToSegment = (point, start, end) => {
    const dx = end.x - start.x,
      dy = end.y - start.y,
      position = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(point.x - start.x - position * dx, point.y - start.y - position * dy);
  };
  let maximumError = 0;
  for (let segment = 0; segment < 32; segment += 1) {
    const [p0, p1, p2, p3] = controls.slice(segment * 3, segment * 3 + 4);
    const approximation = Array.from({ length: 17 }, (_, index) => cubic(p0, p1, p2, p3, index / 16));
    for (let index = 0; index <= 1024; index += 1) {
      const point = cubic(p0, p1, p2, p3, index / 1024);
      let error = Infinity;
      for (let edge = 0; edge < 16; edge += 1)
        error = Math.min(error, distanceToSegment(point, approximation[edge], approximation[edge + 1]));
      maximumError = Math.max(maximumError, error);
    }
  }
  assert.ok(maximumError * 4 * 2 > 1, `旧折线边界误差应超过 1 设备像素，实际 ${maximumError * 8}`);

  const calls = [];
  const context = {
    strokeStyle: "initial",
    lineWidth: 7,
    lineCap: "square",
    lineJoin: "bevel",
    miterLimit: 1,
    save() {
      this.saved = [this.strokeStyle, this.lineWidth, this.lineCap, this.lineJoin, this.miterLimit];
    },
    restore() {
      [this.strokeStyle, this.lineWidth, this.lineCap, this.lineJoin, this.miterLimit] = this.saved;
    },
    beginPath() {
      calls.push("begin");
    },
    moveTo() {
      calls.push("move");
    },
    bezierCurveTo() {
      calls.push("bezier");
    },
    stroke() {
      assert.deepEqual([this.lineCap, this.lineJoin, this.miterLimit], ["butt", "miter", 10]);
      calls.push("stroke");
    },
  };
  draw(context, 30);
  assert.equal(calls.filter((call) => call === "bezier").length, 32);
  assert.deepEqual(calls.slice(0, 2), ["begin", "move"]);
  assert.equal(calls.at(-1), "stroke");
  assert.deepEqual(
    [context.strokeStyle, context.lineWidth, context.lineCap, context.lineJoin, context.miterLimit],
    ["initial", 7, "square", "bevel", 1],
  );
});
