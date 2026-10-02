import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import * as core from "../target/js/gpu-component/calcit.core.mjs";
import * as motion from "../target/js/gpu-component/quamolit.motion.mjs";
import * as scene from "../target/js/gpu-component/quamolit.scene-ir.mjs";
import * as program from "../target/js/gpu-component/quamolit.gpu-scalar-program.mjs";
import * as lowering from "../target/js/gpu-component/quamolit.motion-gpu.mjs";
import { dispose_renderer_$x_ } from "../target/js/gpu-component/quamolit.gpu-component.mjs";
import { start, start_mixed } from "../target/js/gpu-component/quamolit.test.retained-component-fixture.mjs";
import { sample_plan_at } from "../target/js/gpu-component/quamolit.retained-component.mjs";
import { extreme_plan } from "../target/js/gpu-component/quamolit.test.gpu-component-fixture.mjs";
const tags = core.init_tags([
  "slots",
  "descriptor",
  "motion",
  "target",
  "index",
  "parameters",
  "from",
  "to",
  "start",
  "duration",
  "easing",
  "constant",
  "tween",
  "time",
  "width",
  "linear",
  "smoothstep",
  "alpha",
  "opacity",
  "height",
  "x",
  "y",
  "scene",
  "nodes",
  "key",
  "frames",
  "loop",
  "clamp",
  "at",
  "value",
  "keyframes",
  "content",
  "repeat",
  "mirror",
]);
const js = core.to_js_data,
  get = (o, k) => o.get(tags[k]),
  set = (o, k, v) => o.assoc(tags[k], v);
const en = (type, tag, ...args) => core._PCT__$o__$o_(type, tags[tag], ...args);
const base = () => start(0, 40, false, 100);
const slot = () => get(base(), "slots").get(0);
const tween = () => core._$n_enum_$o_nth(get(get(slot(), "descriptor"), "motion"), 1);
const withMotion = (m) => set(slot(), "descriptor", set(get(slot(), "descriptor"), "motion", m));
const prepare = (t) => program.prepare_slot(withMotion(en(motion.ScalarMotion, "tween", t)));
const keyframeTrack = (frames, loop = "clamp") =>
  core._$n__PCT__$M_(
    motion.ScalarTrack,
    tags.frames,
    new core.CalcitSliceList(
      frames.map(([at, value, easing = "linear"]) =>
        core._$n__PCT__$M_(
          motion.ScalarKeyframe,
          tags.at,
          at,
          tags.value,
          value,
          tags.easing,
          en(motion.Easing, easing),
        ),
      ),
    ),
    tags.loop,
    en(motion.TrackLoop, loop),
  );

test("能力表区分候选 lowering 与真实标量执行；绑定回退定位逻辑 key", () => {
  const track = (count, loop) =>
    keyframeTrack(
      Array.from({ length: count }, (_, at) => [at, at]),
      loop,
    );
  const cases = [
    ["constant", en(motion.ScalarMotion, "constant", 0.5), "supported", "ready"],
    ["tween-linear", en(motion.ScalarMotion, "tween", tween()), "supported", "ready"],
    [
      "tween-smoothstep",
      en(motion.ScalarMotion, "tween", set(tween(), "easing", en(motion.Easing, "smoothstep"))),
      "supported",
      "ready",
    ],
    ["time", en(motion.ScalarMotion, "time", 1, 0), "supported", "fallback"],
    ["keyframes-2-clamp", en(motion.ScalarMotion, "keyframes", track(2)), "supported", "ready"],
    ["keyframes-2-repeat", en(motion.ScalarMotion, "keyframes", track(2, "repeat")), "supported", "fallback"],
    ["keyframes-2-mirror", en(motion.ScalarMotion, "keyframes", track(2, "mirror")), "supported", "fallback"],
    ["keyframes-3-clamp", en(motion.ScalarMotion, "keyframes", track(3)), "supported", "fallback"],
    ["keyframes-16", en(motion.ScalarMotion, "keyframes", track(16)), "supported", "fallback"],
    ["keyframes-17", en(motion.ScalarMotion, "keyframes", track(17)), "unsupported", "fallback"],
  ];
  const documented = Array.from(
    readFileSync(new URL("../docs/motion-gpu-contract.md", import.meta.url), "utf8").matchAll(
      /^\| ([a-z0-9-]+) \| yes \| (supported|unsupported) \| (ready|fallback) \|$/gm,
    ),
    ([, name, lower, execute]) => [name, lower, execute],
  );
  assert.deepEqual(
    documented,
    cases.map(([name, , lower, execute]) => [name, lower, execute]),
  );
  for (const [name, value, lower, execute] of cases) {
    const changed = withMotion(value);
    assert.equal(lowering.lower_scalar(get(changed, "descriptor")).tag.value, lower, name);
    assert.equal(program.prepare_slot(changed).tag.value, execute, name);
  }
  for (const target of ["x", "y", "alpha", "width", "height", "opacity"]) {
    const changed = set(withMotion(en(motion.ScalarMotion, "constant", 0.5)), "target", en(scene.ScalarTarget, target));
    assert.equal(
      program.prepare_slot(changed).tag.value,
      ["x", "y", "alpha", "width", "height"].includes(target) ? "ready" : "fallback",
      target,
    );
  }
  const p = base(),
    document = get(p, "scene"),
    nodes = get(document, "nodes"),
    changed = withMotion(en(motion.ScalarMotion, "time", 1, 0));
  const contextual = set(
    set(p, "scene", set(document, "nodes", nodes.assoc(64, set(nodes.get(64), "key", "stable-key")))),
    "slots",
    new core.CalcitSliceList([changed]),
  );
  assert.deepEqual(js(program.prepare_program(contextual)), [
    "fallback",
    "scalar-kernel-not-supported;key=stable-key;target=:x;motion=:time",
  ]);
  const sampled = sample_plan_at(contextual, 0.25);
  assert.equal(get(core._$n_enum_$o_nth(get(get(get(sampled, "scene"), "nodes").get(64), "content"), 1), "x"), 0.25);
  assert.equal(get(get(get(sampled, "scene"), "nodes").get(64), "key"), "stable-key");
});

test("两点 clamp 轨道复用 tween 编码，保留首帧 easing、绝对时间与精度合同", () => {
  for (const easing of ["linear", "smoothstep"]) {
    const track = keyframeTrack([
      [-2, 120, easing],
      [3, 80, easing === "linear" ? "smoothstep" : "linear"],
    ]);
    const changed = withMotion(en(motion.ScalarMotion, "keyframes", track));
    const source = set(base(), "slots", new core.CalcitSliceList([changed]));
    const snapshot = js(source);
    const prepared = program.prepare_program(source);
    assert.equal(prepared.tag.value, "ready");
    const encoded = js(get(prepared.extra[0], "parameters"))[0];
    assert.deepEqual(encoded, {
      index: 64,
      axis: 0,
      start: -2,
      duration: 5,
      from: 120,
      to: 80,
      easing: easing === "linear" ? 0 : 1,
    });
    const times = [3, -2, 0.5, -1, 3, -3, 4];
    let seed = 527;
    for (let i = 0; i < 100; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      times.push(-3 + (seed / 2 ** 32) * 7);
    }
    for (const time of times) {
      const linear = Math.max(0, Math.min(1, (time + 2) / 5));
      const ratio = easing === "linear" ? linear : linear * linear * (3 - 2 * linear);
      const expected = 120 * (1 - ratio) + 80 * ratio;
      assert.ok(Math.abs(motion.sample_track(track, time) - expected) <= 1e-12);
      assert.ok(program.time_supported_$q_(prepared.extra[0], time));
      assert.ok(Math.abs(reference(encoded, time, true) - expected) <= 1e-5 + 1e-5 * Math.abs(expected));
    }
    assert.deepEqual(js(source), snapshot, "冷归一化不能修改原轨道或 ComponentPlan");
  }
});

test("重复时间保留右侧胜出与跳变回退；多段/循环仍回退且非法轨道仍拒绝", () => {
  const ready = (track) => program.prepare_slot(withMotion(en(motion.ScalarMotion, "keyframes", track)));
  const duplicate = keyframeTrack([
    [2, 80],
    [2, 20, "smoothstep"],
  ]);
  const prepared = ready(duplicate);
  assert.equal(prepared.tag.value, "ready");
  const encoded = js(prepared.extra[0]);
  assert.deepEqual([encoded.start, encoded.duration, encoded.from, encoded.to], [2, 0, 80, 20]);
  for (const time of [-3, 0, 2, 4, 2]) {
    const expected = time < 2 ? 80 : 20;
    assert.equal(motion.sample_track(duplicate, time), expected);
    assert.equal(reference(encoded, time, true), expected);
  }
  assert.deepEqual(
    js(
      program.prepare_program(
        set(base(), "slots", new core.CalcitSliceList([withMotion(en(motion.ScalarMotion, "keyframes", duplicate))])),
      ),
    ),
    ["fallback", "scalar-precision-budget"],
    "非恒定零时长跳变仍由原 program 精度门禁拒绝",
  );
  for (const loop of ["repeat", "mirror"]) {
    assert.deepEqual(
      js(
        ready(
          keyframeTrack(
            [
              [0, 0],
              [1, 1],
            ],
            loop,
          ),
        ),
      ),
      ["fallback", "scalar-kernel-not-supported"],
    );
  }
  assert.deepEqual(
    js(
      ready(
        keyframeTrack([
          [0, 0],
          [0.5, 1],
          [1, 0],
        ]),
      ),
    ),
    ["fallback", "scalar-kernel-not-supported"],
  );
  assert.throws(
    () =>
      ready(
        keyframeTrack([
          [1, 0],
          [0, 1],
        ]),
      ),
    /unordered-keyframes/,
  );
  assert.throws(
    () =>
      ready(
        keyframeTrack([
          [0, 0],
          [Infinity, 1],
        ]),
      ),
    /invalid-keyframe-time/,
  );
  const alpha = set(
    withMotion(
      en(
        motion.ScalarMotion,
        "keyframes",
        keyframeTrack([
          [0, 0],
          [1, 1.1],
        ]),
      ),
    ),
    "target",
    en(scene.ScalarTarget, "alpha"),
  );
  assert.equal(program.prepare_slot(alpha).tag.value, "fallback", "归一化后仍检查 alpha 端点域");
});

test("公共计划生成固定参数；乱序时间不改变描述符参数", () => {
  const p = base(),
    snapshot = js(p),
    first = program.prepare_program(p);
  assert.equal(first.tag.value, "ready");
  const params = js(get(first.extra[0], "parameters"));
  assert.deepEqual(params, [{ index: 64, axis: 0, start: 0, duration: 1, from: 80, to: 120, easing: 0 }]);
  for (const t of [1, 0, 0.5, 0.25, 1, -1]) {
    const result = program.prepare_program(sample_plan_at(p, t));
    assert.equal(result.tag.value, "ready");
    assert.deepEqual(js(get(result.extra[0], "parameters")), params);
  }
  assert.deepEqual(js(p), snapshot);
  assert.deepEqual(
    js(program.parameter_values(get(first.extra[0], "parameters").get(0))),
    [64, 0, 0, 1, 80, 120, 0, 0],
  );
});

test("constant、smoothstep 和零时长保留参数，不提前按某一时刻采样", () => {
  const constant = program.prepare_slot(withMotion(en(motion.ScalarMotion, "constant", 17)));
  assert.equal(constant.tag.value, "ready");
  assert.equal(js(constant.extra[0]).from, 17);
  assert.equal(js(constant.extra[0]).to, 17);
  const smooth = prepare(set(tween(), "easing", en(motion.Easing, "smoothstep")));
  assert.equal(js(smooth.extra[0]).easing, 1);
  const instant = prepare(set(set(tween(), "duration", 0), "start", 0.5));
  assert.equal(js(instant.extra[0]).duration, 0);
  assert.equal(js(instant.extra[0]).start, 0.5);
});

test("组件与实例共用参数编码：轴、索引和完整 f32 域保持同一规则", () => {
  assert.deepEqual(js(program.make_axis_parameter(7, 1, tween()).extra[0]), {
    ...js(prepare(tween()).extra[0]),
    index: 7,
    axis: 1,
  });
  for (const index of [-1, 0.5, NaN])
    assert.throws(() => program.make_axis_parameter(index, 0, tween()), /invalid-scalar-instance-index/);
  assert.throws(() => program.make_axis_parameter(0, 5, tween()), /invalid-scalar-instance-axis/);
  assert.deepEqual(js(program.make_axis_parameter(0, 0, set(tween(), "to", 1e31))), [
    "fallback",
    "scalar-parameters-outside-f32-domain",
  ]);
});

test("矩形 alpha 使用同一 sampler，端点限于单位区间；group opacity 仍回退", () => {
  const alpha = set(set(tween(), "from", 0), "to", 1);
  const alphaSlot = set(withMotion(en(motion.ScalarMotion, "tween", alpha)), "target", en(scene.ScalarTarget, "alpha"));
  const parameter = program.prepare_slot(alphaSlot);
  assert.equal(parameter.tag.value, "ready");
  assert.equal(js(parameter.extra[0]).axis, 2);
  assert.deepEqual(js(program.prepare_slot(set(alphaSlot, "target", en(scene.ScalarTarget, "opacity")))), [
    "fallback",
    "scalar-target-not-supported",
  ]);
  for (const [field, value] of [
    ["from", -0.1],
    ["to", 1.1],
  ]) {
    assert.deepEqual(js(program.make_axis_parameter(0, 2, set(alpha, field, value))), [
      "fallback",
      "scalar-alpha-outside-unit-interval",
    ]);
  }
  const alphaPlan = set(base(), "slots", new core.CalcitSliceList([alphaSlot]));
  const prepared = program.prepare_program(alphaPlan);
  assert.equal(prepared.tag.value, "ready");
  const m = mock(),
    host = program.create_renderer_$x_(m.canvas, m.device, "bgra8unorm", 128);
  try {
    program.install_program_$x_(host, prepared.extra[0]);
    const parameterWrite = m.writes.find((w) => w.label === "Quamolit scalar parameters" && w.bytes === 32);
    assert.equal(parameterWrite.offset, 64 * 160 + 2 * 32);
    assert.deepEqual(parameterWrite.values, [0, 1, 0, 1, 1, 0, 0, 0]);
    assert.ok(m.shaders[0].includes("sampleMotion(motions[instance*5u+2u], color.a)"));
    const cold = m.writes.length;
    for (const time of [1, 0, 0.5, 0.25, 1]) program.draw_at_$x_(host, prepared.extra[0], time);
    assert.ok(m.writes.slice(cold).every((w) => w.bytes === 16));
    assert.equal(m.buffers.length, 3);
  } finally {
    dispose_renderer_$x_(host);
  }
});

test("宽高共享标量编码：零尺寸合法，负端点整层回退，两个尺寸槽独立", () => {
  const slots = ["width", "height"].map((target, index) => {
    const motionValue = set(set(tween(), "from", 20 + index * 10), "to", 40 + index * 10);
    const bound = set(
      withMotion(en(motion.ScalarMotion, "tween", motionValue)),
      "target",
      en(scene.ScalarTarget, target),
    );
    assert.equal(js(program.prepare_slot(bound).extra[0]).axis, 3 + index);
    assert.equal(program.make_axis_parameter(0, 3 + index, set(motionValue, "to", 0)).tag.value, "ready");
    for (const field of ["from", "to"]) {
      const invalid = set(
        bound,
        "descriptor",
        set(get(bound, "descriptor"), "motion", en(motion.ScalarMotion, "tween", set(motionValue, field, -1))),
      );
      assert.deepEqual(js(program.prepare_program(set(base(), "slots", new core.CalcitSliceList([invalid])))), [
        "fallback",
        `scalar-size-negative;key=badge;target=:${target};motion=:tween`,
      ]);
    }
    return bound;
  });
  const source = set(set(base(), "slots", new core.CalcitSliceList(slots)), "time", -1);
  const prepared = program.prepare_program(source);
  assert.equal(prepared.tag.value, "ready");
  const m = mock(),
    host = program.create_renderer_$x_(m.canvas, m.device, "bgra8unorm", 128);
  try {
    program.install_program_$x_(host, prepared.extra[0]);
    assert.deepEqual(
      m.writes.filter((w) => w.label === "Quamolit scalar parameters" && w.bytes === 32).map((w) => w.offset),
      [64 * 160 + 96, 64 * 160 + 128],
    );
    for (const time of [1, 0, 0.5, 0.25, 1]) {
      const sampled = sample_plan_at(source, time);
      const rect = core._$n_enum_$o_nth(get(get(get(sampled, "scene"), "nodes").get(64), "content"), 1);
      assert.equal(get(rect, "width"), 20 + 20 * time);
      assert.equal(get(rect, "height"), 30 + 20 * time);
      program.draw_at_$x_(host, prepared.extra[0], time);
      assert.equal(m.writes.at(-1).bytes, 16);
    }
  } finally {
    dispose_renderer_$x_(host);
  }
});

test("不支持算子/目标/CPU 变换均明确回退；重复绑定不能只保留一项", () => {
  assert.deepEqual(js(program.prepare_slot(withMotion(en(motion.ScalarMotion, "time", 1, 0)))), [
    "fallback",
    "scalar-kernel-not-supported",
  ]);
  assert.deepEqual(js(program.prepare_slot(set(slot(), "target", en(scene.ScalarTarget, "opacity")))), [
    "fallback",
    "scalar-target-not-supported",
  ]);
  assert.deepEqual(js(program.prepare_program(start_mixed(0, 40, false, 100))), ["fallback", "cpu-transform-required"]);
  const duplicate = set(base(), "slots", new core.CalcitSliceList([slot(), slot()]));
  assert.deepEqual(js(program.prepare_program(duplicate)), [
    "fallback",
    "duplicate-gpu-scalar-target;key=badge;target=:x;motion=:tween",
  ]);
});

test("检查完整参数域；起点有效但终点越界也不能交给 GPU", () => {
  assert.deepEqual(js(program.prepare_program(extreme_plan(0))), [
    "fallback",
    "scalar-parameters-outside-f32-domain;key=badge;target=:x;motion=:tween",
  ]);
  for (const [key, value] of [
    ["from", 1e31],
    ["to", 1e31],
    ["start", 1e31],
    ["duration", 1e31],
    ["duration", 1e-40],
  ]) {
    assert.deepEqual(js(prepare(set(tween(), key, value))), ["fallback", "scalar-parameters-outside-f32-domain"]);
  }
  assert.throws(() => prepare(set(tween(), "duration", -1)), /negative-motion-duration/);
});

function mock() {
  const writes = [],
    buffers = [],
    shaders = [];
  const device = {
    limits: { maxBufferSize: 1e7, maxStorageBufferBindingSize: 1e7 },
    createShaderModule(v) {
      shaders.push(v.code);
      return {};
    },
    createRenderPipeline() {
      return {
        getBindGroupLayout() {
          return {};
        },
      };
    },
    createBuffer(spec) {
      const buffer = {
        ...spec,
        dead: 0,
        destroy() {
          this.dead++;
        },
      };
      buffers.push(buffer);
      return buffer;
    },
    createBindGroup() {
      return {};
    },
    createCommandEncoder() {
      return {
        beginRenderPass() {
          return { setPipeline() {}, setBindGroup() {}, setVertexBuffer() {}, draw() {}, end() {} };
        },
        finish() {
          return {};
        },
      };
    },
    queue: {
      writeBuffer(buffer, offset, data) {
        writes.push({ label: buffer.label, offset, values: [...data], bytes: data.byteLength });
      },
      submit() {},
    },
  };
  const canvas = {
    width: 320,
    height: 180,
    getContext() {
      return {
        configure() {},
        unconfigure() {},
        getCurrentTexture() {
          return {
            createView() {
              return {};
            },
          };
        },
      };
    },
  };
  return { device, canvas, writes, buffers, shaders };
}

test("编译后 file/inline 调用：参数常驻，1000 时间帧只更新 uniform", () => {
  const m = mock(),
    h = program.create_renderer_$x_(m.canvas, m.device, "bgra8unorm", 128);
  assert.equal(h.capacity, 128);
  assert.equal(h.disposed, false);
  const prepared = program.prepare_program(base()).extra[0];
  assert.throws(() => program.draw_at_$x_(h, prepared, 0), /not-installed/);
  program.install_program_$x_(h, prepared);
  assert.equal(h.uploadedBytes, 4160);
  assert.equal(h.parameterBytes, 10432);
  const hotStart = m.writes.length;
  for (let i = 0; i < 1000; i++) program.draw_at_$x_(h, prepared, (i % 101) / 100);
  const hot = m.writes.slice(hotStart);
  assert.equal(hot.length, 1000);
  assert.ok(hot.every((w) => w.bytes === 16 && w.label === "Quamolit component viewport"));
  assert.equal(h.uploadedBytes, 4160);
  assert.equal(h.parameterBytes, 10432);
  assert.equal(m.buffers.length, 3);
  assert.ok(m.shaders[0].includes("sampleMotion(motions[instance*5u]"));
  assert.equal(hot[25].values[2], 0.25);
  dispose_renderer_$x_(h);
  dispose_renderer_$x_(h);
  assert.equal(h.disposed, true);
  assert.equal(h.scalarProgram, null, "释放不得保留旧 Calcit program 引用");
  assert.ok(m.buffers.every((b) => b.dead === 1));
  assert.throws(() => program.draw_at_$x_(h, prepared, 0.5), /not-installed/);
});

test("同时间版本变化不能复用；重新安装清除旧参数槽", () => {
  const m = mock(),
    h = program.create_renderer_$x_(m.canvas, m.device, "bgra8unorm", 128),
    p = base();
  const prepared = program.prepare_program(p).extra[0];
  assert.equal(program.reusable_$q_(prepared, sample_plan_at(p, 0.5)), true);
  const more = core.init_tags(["versions", "component", "motion", "model", "input", "resources", "viewport"]);
  for (const key of ["component", "motion", "model", "input", "resources", "viewport"]) {
    const changed = p.assoc(more.versions, p.get(more.versions).assoc(more[key], 7));
    assert.equal(program.reusable_$q_(prepared, changed), false);
  }
  program.install_program_$x_(h, prepared);
  const emptySlots = set(p, "slots", new core.CalcitSliceList([]));
  const reset = program.prepare_program(emptySlots).extra[0],
    before = m.writes.length;
  program.install_program_$x_(h, reset);
  assert.ok(m.writes[before].values.every((v) => v === 0));
  const installedWrites = m.writes.length;
  const installedTime = h.viewScratch[2],
    installedDraws = h.draws;
  assert.throws(() => program.draw_at_$x_(h, prepared, 0.5), /gpu-scalar-program-not-installed/);
  assert.equal(m.writes.length, installedWrites, "旧 program 不得更新时间或产生 GPU 上传");
  assert.equal(h.viewScratch[2], installedTime);
  assert.equal(h.draws, installedDraws);
  program.draw_at_$x_(h, reset, 0.5);
  assert.equal(m.writes.length, installedWrites + 1);
  const writeBuffer = m.device.queue.writeBuffer;
  m.device.queue.writeBuffer = () => {
    throw Error("injected-install-write-failure");
  };
  assert.throws(() => program.install_program_$x_(h, prepared), /injected-install-write-failure/);
  assert.equal(h.scalarProgram, null);
  assert.throws(() => program.draw_at_$x_(h, reset, 0.5), /not-installed/);
  m.device.queue.writeBuffer = writeBuffer;
  program.install_program_$x_(h, reset);
  program.draw_at_$x_(h, reset, 0.5);
  dispose_renderer_$x_(h);
});

test("精度预算拒绝大时间短区间和跳变；拒绝帧没有上传副作用", () => {
  const full = (t) =>
    program.prepare_program(
      set(base(), "slots", new core.CalcitSliceList([withMotion(en(motion.ScalarMotion, "tween", t))])),
    );
  assert.deepEqual(js(full(set(set(tween(), "start", 1e12), "duration", 0.01))), [
    "fallback",
    "scalar-precision-budget",
  ]);
  assert.deepEqual(js(full(set(tween(), "duration", 0))), ["fallback", "scalar-precision-budget"]);
  const p = program.prepare_program(base()).extra[0],
    m = mock(),
    h = program.create_renderer_$x_(m.canvas, m.device, "bgra8unorm", 128);
  assert.equal(program.time_supported_$q_(p, 0.37), true);
  program.install_program_$x_(h, p);
  const count = m.writes.length;
  assert.throws(() => program.draw_at_$x_(h, p, 1e12), /gpu-scalar-time-domain/);
  assert.equal(m.writes.length, count);
  dispose_renderer_$x_(h);
});

// 独立 f32 运算模型，不读取 WGSL 字符串，不调用被测 Calcit sampler。
function reference(p, t, f32) {
  const f = f32 ? Math.fround : (x) => x;
  const from = f(p.from),
    to = f(p.to),
    start = f(p.start),
    duration = f(p.duration),
    time = f(t);
  if (time < start) return from;
  if (duration === 0 || time >= f(start + duration)) return to;
  let ratio = Math.max(0, Math.min(1, f(f(time - start) / duration)));
  if (p.easing === 1) ratio = f(f(ratio * ratio) * f(3 - f(2 * ratio)));
  return f(f(from * f(1 - ratio)) + f(to * ratio));
}

test("固定 seed 的独立 f32 模型：被预算接受的非整数样本满足既定误差", (context) => {
  let seed = 9481,
    accepted = 0,
    rejected = 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  const precisionTags = core.init_tags(["precision-base", "precision-slope"]);
  const original = program.prepare_program(base()).extra[0];
  for (let i = 0; i < 400; i++) {
    const startTime = (random() - 0.5) * 2000,
      duration = 10 ** (random() * 5 - 2);
    let t = tween();
    for (const [key, value] of Object.entries({
      start: startTime,
      duration,
      from: (random() - 0.2) * 400,
      to: (random() - 0.2) * 400,
    }))
      t = set(t, key, value);
    t = set(t, "easing", en(motion.Easing, i % 2 ? "smoothstep" : "linear"));
    const parameter = prepare(t).extra[0],
      p = js(parameter),
      cost = js(program.parameter_precision(parameter));
    const guarded = original
      .assoc(precisionTags["precision-base"], cost.x)
      .assoc(precisionTags["precision-slope"], cost.y);
    for (let j = 0; j < 20; j++) {
      const time = startTime + duration * (random() * 1.4 - 0.2);
      if (!program.time_supported_$q_(guarded, time)) {
        rejected++;
        continue;
      }
      const expected = reference(p, time, false),
        actual = reference(p, time, true);
      assert.ok(
        Math.abs(actual - expected) <= 1e-5 + 1e-5 * Math.abs(expected),
        JSON.stringify({ p, time, actual, expected, cost }),
      );
      accepted++;
    }
  }
  assert.ok(accepted > 500, `accepted=${accepted}`);
  assert.ok(rejected > 500, `rejected=${rejected}`);
  context.diagnostic(`seed=9481，接受 ${accepted}，明确回退 ${rejected}；这不是实际 GPU 读回测试`);
});
