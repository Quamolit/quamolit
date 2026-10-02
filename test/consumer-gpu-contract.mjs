import assert from "node:assert/strict";

// 仅通过消费者编译入口调用，不导入任何 Quamolit namespace/宿主/夹具。
// 原生设备 mock 记录实际 ABI 调用，不执行 WGSL，不能作为硬件验收。
function nativeDevice() {
  const buffers = [],
    writes = [],
    draws = [];
  let pipelines = 0,
    submissions = 0,
    unconfigured = 0;
  const device = {
    limits: { maxBufferSize: 1e7, maxStorageBufferBindingSize: 1e7 },
    createShaderModule({ code }) {
      assert.ok(code.includes("sampleMotion(motions[instance*5u]"));
      return {};
    },
    createRenderPipeline() {
      pipelines++;
      return {
        getBindGroupLayout() {
          return {};
        },
      };
    },
    createBuffer(spec) {
      const buffer = {
        ...spec,
        destroyed: 0,
        destroy() {
          this.destroyed++;
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
          return {
            setPipeline() {},
            setBindGroup() {},
            setVertexBuffer() {},
            draw(...args) {
              draws.push(args);
            },
            end() {},
          };
        },
        finish() {
          return {};
        },
      };
    },
    queue: {
      writeBuffer(buffer, offset, data) {
        assert.equal(buffer.destroyed, 0);
        writes.push({ label: buffer.label, offset, bytes: data.byteLength, values: [...data] });
      },
      submit() {
        submissions++;
      },
    },
  };
  const canvas = {
    width: 320,
    height: 180,
    getContext(kind) {
      assert.equal(kind, "webgpu");
      return {
        configure() {},
        unconfigure() {
          unconfigured++;
        },
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
  return { device, canvas, buffers, writes, draws, counts: () => ({ pipelines, submissions, unconfigured }) };
}

export function verifyIndependentGpuConsumer(app, core) {
  const motions = app.independent_instance_motions(),
    prepared = app.prepare_independent_gpu(motions, 0);
  assert.equal(prepared.tag.value, "ready");
  const program = prepared.extra[0],
    tags = core.init_tags(["parameters", "motions", "id", "frame", "records", "precision-base"]),
    parameters = core.to_js_data(program.get(tags.parameters));
  assert.equal(parameters.length, 20000);
  assert.equal(program.get(tags.frame).get(tags.records).len(), 10000);
  for (let index = 0; index < 10000; index++) {
    const x = 8 + 2 * (index % 125),
      y = 10 + 2 * Math.floor(index / 125);
    for (let axis = 0; axis < 2; axis++)
      assert.deepEqual(parameters[index * 2 + axis], {
        index,
        axis,
        start: 0.012 * (index % 13),
        duration: 0.45 + 0.02 * (index % 17),
        from: axis === 0 ? x : y,
        to: axis === 0 ? x + 1 + (index % 7) : y + (index % 5) - 2,
        easing: index % 2,
      });
  }
  assert.throws(() => app.prepare_independent_gpu(new core.CalcitSliceList([]), 0), /gpu-instance-motion-count/);
  const duplicate = motions.assoc(1, motions.get(0));
  assert.throws(() => app.prepare_independent_gpu(duplicate, 0), /duplicate-gpu-instance-motion-id/);
  assert.deepEqual(core.to_js_data(app.prepare_independent_gpu(motions, 1e12)), [
    "fallback",
    "scalar-precision-budget",
  ]);
  const m = nativeDevice(),
    host = app.create_gpu_$x_(m.canvas, m.device, "bgra8unorm", 10000);
  try {
    assert.throws(() => app.draw_independent_gpu_$x_(host, program, 0), /not-installed/);
    app.install_independent_gpu_$x_(host, program, 0);
    assert.equal(host.uploadedBytes, 640000);
    assert.equal(host.parameterBytes, 2240000);
    const cold = m.writes.length;
    for (let index = 0; index < 1000; index++)
      app.draw_independent_gpu_$x_(host, program, [1, 0, 0.5, 0.25, 1][index % 5]);
    const hot = m.writes.slice(cold);
    assert.equal(hot.length, 1000);
    assert.ok(hot.every((w) => w.bytes === 16 && w.label === "Quamolit component viewport"));
    assert.deepEqual(m.draws.at(-1), [6, 10000]);
    assert.equal(host.uploadedBytes, 640000);
    assert.equal(host.parameterBytes, 2240000);
    const before = m.writes.length;
    const beforeTime = host.viewScratch[2],
      beforeDraws = m.draws.length;
    const differentProgram = app.prepare_independent_gpu(motions, 0.25).extra[0];
    assert.throws(() => app.draw_independent_gpu_$x_(host, differentProgram, 0.25), /gpu-scalar-program-not-installed/);
    assert.equal(m.writes.length, before, "另一份合法 program 未安装也不能更新时间或上传");
    assert.equal(host.viewScratch[2], beforeTime);
    assert.equal(m.draws.length, beforeDraws);
    assert.throws(() => app.draw_independent_gpu_$x_(host, program, NaN), /gpu-scalar-time-domain/);
    assert.throws(
      () => app.install_independent_gpu_$x_(host, program.assoc(tags["precision-base"], 0), 0),
      /gpu-instance-program-mismatch/,
    );
    assert.equal(m.writes.length, before, "非法时间或伪造程序不能发生任何上传");
  } finally {
    app.dispose_gpu_$x_(host);
    app.dispose_gpu_$x_(host);
  }
  assert.ok(m.buffers.every((b) => b.destroyed === 1));
  assert.equal(m.counts().pipelines, 1);
  return {
    instances: 10000,
    parameters: 20000,
    coldRecordBytes: 640000,
    coldParameterBytes: 2240000,
    hotFrames: 1000,
    hotPositionBytes: 0,
    hotUniformBytes: 16000,
    buffers: 3,
    pipelines: 1,
  };
}

export function verifyGpuConsumer(app, core, alpha = false) {
  assert.deepEqual(
    core.to_js_data(app.prepare_gpu(app.start(0, 40, false, 100))),
    ["fallback", "cpu-transform-required"],
    "混合场景不能为通过 GPU 验收静默漏画折线",
  );
  const source = (alpha ? app.start_alpha : app.start_rects)(0, 40, false, 100);
  const update = alpha ? app.update_alpha : app.update_rects;
  const before = core.to_js_data(source);
  const prepared = app.prepare_gpu(source);
  assert.equal(prepared.tag.value, "ready");
  const program = prepared.extra[0];
  const fields = core.init_tags(["parameters", "scene", "declarations", "plan-builds", "binding-samples", "slots"]);
  const bound = source.get(fields.slots).get(0);
  assert.deepEqual(
    core.to_js_data(app.prepare_gpu(source.assoc(fields.slots, new core.CalcitSliceList([bound, bound])))),
    [
      "fallback",
      `duplicate-gpu-scalar-target;key=badge;target=:${alpha ? "alpha" : "x"};motion=:${alpha ? "keyframes" : "tween"}`,
    ],
    "干净安装的公共入口须返回完整绑定诊断，不能部分绘制或仅测根仓库源码",
  );
  assert.deepEqual(core.to_js_data(program.get(fields.parameters)), [
    alpha
      ? { index: 1, axis: 2, start: 0, duration: 1, from: 0, to: 1, easing: 1 }
      : { index: 1, axis: 0, start: 0, duration: 1, from: 80, to: 120, easing: 0 },
  ]);
  const m = nativeDevice();
  const host = app.create_gpu_$x_(m.canvas, m.device, "bgra8unorm", 2);
  try {
    app.install_gpu_$x_(host, program);
    const coldWrites = m.writes.length;
    assert.equal(host.uploadedBytes, 128);
    assert.equal(host.parameterBytes, 352);
    for (let frame = 0; frame < 1000; frame++) {
      // 无逐帧 update_rects/CPU sampler；只传已安装 program 和绝对时间。
      app.draw_gpu_$x_(host, program, (frame % 101) / 100);
    }
    const hotWrites = m.writes.slice(coldWrites);
    assert.equal(hotWrites.length, 1000);
    assert.ok(hotWrites.every((w) => w.bytes === 16 && w.label === "Quamolit component viewport"));
    assert.equal(host.uploadedBytes, 128);
    assert.equal(host.parameterBytes, 352);
    assert.equal(m.buffers.length, 3);
    assert.equal(m.counts().pipelines, 1);
    assert.equal(m.draws.length, 1001);
    assert.ok(m.draws.every((args) => args[0] === 6 && args[1] === 2));
    assert.equal(m.counts().submissions, 1001);
    for (const time of [1, 0, 0.5, 0.25, 1]) {
      app.draw_gpu_$x_(host, program, time);
      assert.equal(m.writes.at(-1).values[2], time);
      const reference = update(source, time, 40, false, 100);
      assert.equal(app.gpu_reusable_$q_(program, reference), true);
      const rect = core.to_js_data(reference.get(fields.scene)).nodes[1].content[1];
      if (alpha) assert.equal(rect.fill.a, time * time * (3 - 2 * time));
      else assert.equal(rect.x, 80 + 40 * time);
    }
    for (const [model, ready, viewport] of [
      [41, false, 100],
      [40, true, 100],
      [40, false, 200],
    ]) {
      const changed = update(source, 0, model, ready, viewport);
      assert.equal(app.gpu_reusable_$q_(program, changed), false);
      const next = app.prepare_gpu(changed);
      assert.equal(next.tag.value, "ready");
      app.install_gpu_$x_(host, next.extra[0]);
    }
    assert.deepEqual(core.to_js_data(source), before, "GPU 提交不得改变原 ComponentPlan");
    for (const key of ["declarations", "plan-builds", "binding-samples"]) assert.equal(source.get(fields[key]), 1);
    const count = m.writes.length;
    for (const time of [NaN, Infinity, 1e12]) {
      assert.throws(() => app.draw_gpu_$x_(host, program, time), /gpu-scalar-time-domain/);
    }
    assert.equal(m.writes.length, count, "非法时间不可产生 GPU 写入");
  } finally {
    app.dispose_gpu_$x_(host);
    app.dispose_gpu_$x_(host);
  }
  assert.ok(m.buffers.every((b) => b.destroyed === 1));
  assert.equal(m.counts().unconfigured, 1);
  assert.throws(() => app.draw_gpu_$x_(host, program, 0), /not-installed/);
  return {
    backend: "native-device-mock",
    frames: 1000,
    coldRecordsBytes: 128,
    coldParametersBytes: 352,
    hotRecordsBytes: 0,
    hotParametersBytes: 0,
    hotUniformBytes: 16000,
    pipelines: 1,
    buffers: 3,
    hardware: "未验证",
  };
}

export function verifyDualGpuConsumer(app, core) {
  const source = app.start_dual(0, 40, false, 100);
  const prepared = app.prepare_gpu(source);
  assert.equal(prepared.tag.value, "ready");
  const program = prepared.extra[0],
    fields = core.init_tags(["parameters", "scene"]);
  assert.deepEqual(core.to_js_data(program.get(fields.parameters)), [
    { index: 1, axis: 0, start: 0, duration: 1, from: 80, to: 144, easing: 1 },
    { index: 1, axis: 1, start: 0, duration: 1, from: 62, to: 94, easing: 1 },
    { index: 1, axis: 3, start: 0, duration: 1, from: 10, to: 74, easing: 1 },
    { index: 1, axis: 4, start: 0, duration: 1, from: 20, to: 52, easing: 1 },
  ]);
  const m = nativeDevice(),
    host = app.create_gpu_$x_(m.canvas, m.device, "bgra8unorm", 2);
  try {
    app.install_gpu_$x_(host, program);
    const parameters = m.writes.filter((w) => w.label === "Quamolit scalar parameters" && w.bytes === 32);
    assert.deepEqual(
      parameters.map((p) => [p.offset, p.values]),
      [
        [160, [80, 144, 0, 1, 1, 1, 0, 0]],
        [192, [62, 94, 0, 1, 1, 1, 0, 0]],
        [256, [10, 74, 0, 1, 1, 1, 0, 0]],
        [288, [20, 52, 0, 1, 1, 1, 0, 0]],
      ],
      "x/y/width/height 使用独立参数槽，不覆盖 alpha 槽",
    );
    assert.equal(host.parameterBytes, 448);
    const coldWrites = m.writes.length;
    for (let i = 0; i < 1000; i++) app.draw_gpu_$x_(host, program, (i % 101) / 100);
    assert.equal(m.writes.length - coldWrites, 1000);
    assert.ok(m.writes.slice(coldWrites).every((w) => w.bytes === 16 && w.label === "Quamolit component viewport"));
    assert.equal(m.buffers.length, 3);
    for (const time of [1, 0, 0.5, 0.25, 1, 0.37, 0.81, -0.1, 1.1]) {
      const p = app.update_dual(source, time, 40, false, 100);
      const rect = core.to_js_data(p.get(fields.scene)).nodes[1].content[1];
      const t = Math.max(0, Math.min(1, time)),
        eased = t * t * (3 - 2 * t);
      for (const [axis, expected] of [
        ["x", 80 + 64 * eased],
        ["y", 62 + 32 * eased],
        ["width", 10 + 64 * eased],
        ["height", 20 + 32 * eased],
      ]) {
        assert.ok(Math.abs(rect[axis] - expected) <= 8 * Number.EPSILON * Math.abs(expected), `${axis} at ${time}`);
      }
    }
    const before = m.writes.length;
    const linear = app.prepare_gpu(app.start_rects(0, 40, false, 100)).extra[0];
    app.install_gpu_$x_(host, linear);
    assert.equal(m.writes[before].bytes, 320);
    assert.ok(
      m.writes[before].values.every((v) => v === 0),
      "切回单轴必须清除旧 y/width/height 动画槽",
    );
  } finally {
    app.dispose_gpu_$x_(host);
  }
  assert.ok(m.buffers.every((b) => b.destroyed === 1));
  return {
    backend: "native-device-mock",
    mode: "smoothstep-xy-size",
    frames: 1000,
    coldParametersBytes: 448,
    hotParametersBytes: 0,
    hotUniformBytes: 16000,
    buffers: 3,
    alpha: verifyGpuConsumer(app, core, true),
  };
}
