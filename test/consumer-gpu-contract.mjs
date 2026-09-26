import assert from "node:assert/strict";

// 仅通过消费者编译入口调用，不导入任何 Quamolit namespace/宿主/夹具。
// 原生设备 mock 记录实际 ABI 调用，不执行 WGSL，不能作为硬件验收。
function nativeDevice() {
  const buffers = [], writes = [], draws = [];
  let pipelines = 0, submissions = 0, unconfigured = 0;
  const device = {
    limits: { maxBufferSize: 1e7, maxStorageBufferBindingSize: 1e7 },
    createShaderModule({ code }) {
      assert.ok(code.includes("sampleMotion(motions[instance*2u]"));
      return {};
    },
    createRenderPipeline() { pipelines++; return { getBindGroupLayout() { return {}; } }; },
    createBuffer(spec) {
      const buffer = { ...spec, destroyed: 0, destroy() { this.destroyed++; } };
      buffers.push(buffer);
      return buffer;
    },
    createBindGroup() { return {}; },
    createCommandEncoder() {
      return { beginRenderPass() {
        return { setPipeline() {}, setBindGroup() {}, setVertexBuffer() {},
          draw(...args) { draws.push(args); }, end() {} };
      }, finish() { return {}; } };
    },
    queue: {
      writeBuffer(buffer, offset, data) {
        assert.equal(buffer.destroyed, 0);
        writes.push({ label: buffer.label, offset, bytes: data.byteLength, values: [...data] });
      },
      submit() { submissions++; },
    },
  };
  const canvas = { width: 320, height: 180, getContext(kind) {
    assert.equal(kind, "webgpu");
    return { configure() {}, unconfigure() { unconfigured++; },
      getCurrentTexture() { return { createView() { return {}; } }; } };
  } };
  return { device, canvas, buffers, writes, draws,
    counts: () => ({ pipelines, submissions, unconfigured }) };
}

export function verifyGpuConsumer(app, core) {
  assert.deepEqual(core.to_js_data(app.prepare_gpu(app.start(0, 40, false, 100))),
    ["fallback", "cpu-transform-required"], "混合场景不能为通过 GPU 验收静默漏画折线");
  const source = app.start_rects(0, 40, false, 100);
  const before = core.to_js_data(source);
  const prepared = app.prepare_gpu(source);
  assert.equal(prepared.tag.value, "ready");
  const program = prepared.extra[0];
  const fields = core.init_tags(["parameters", "scene", "declarations", "plan-builds", "binding-samples"]);
  assert.deepEqual(core.to_js_data(program.get(fields.parameters)),
    [{ index: 1, axis: 0, start: 0, duration: 1, from: 80, to: 120, easing: 0 }]);
  const m = nativeDevice();
  const host = app.create_gpu_$x_(m.canvas, m.device, "bgra8unorm", 2);
  try {
    app.install_gpu_$x_(host, program);
    const coldWrites = m.writes.length;
    assert.equal(host.uploadedBytes, 128);
    assert.equal(host.parameterBytes, 160);
    for (let frame = 0; frame < 1000; frame++) {
      // 无逐帧 update_rects/CPU sampler；只传已安装 program 和绝对时间。
      app.draw_gpu_$x_(host, program, (frame % 101) / 100);
    }
    const hotWrites = m.writes.slice(coldWrites);
    assert.equal(hotWrites.length, 1000);
    assert.ok(hotWrites.every(w => w.bytes === 16 && w.label === "Quamolit component viewport"));
    assert.equal(host.uploadedBytes, 128);
    assert.equal(host.parameterBytes, 160);
    assert.equal(m.buffers.length, 3);
    assert.equal(m.counts().pipelines, 1);
    assert.equal(m.draws.length, 1001);
    assert.ok(m.draws.every(args => args[0] === 6 && args[1] === 2));
    assert.equal(m.counts().submissions, 1001);
    for (const time of [1, 0, 0.5, 0.25, 1]) {
      app.draw_gpu_$x_(host, program, time);
      assert.equal(m.writes.at(-1).values[2], time);
      const reference = app.update_rects(source, time, 40, false, 100);
      assert.equal(app.gpu_reusable_$q_(program, reference), true);
      assert.equal(core.to_js_data(reference.get(fields.scene)).nodes[1].content[1].x, 80 + 40 * time);
    }
    for (const [model, ready, viewport] of [[41, false, 100], [40, true, 100], [40, false, 200]]) {
      const changed = app.update_rects(source, 0, model, ready, viewport);
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
  assert.ok(m.buffers.every(b => b.destroyed === 1));
  assert.equal(m.counts().unconfigured, 1);
  assert.throws(() => app.draw_gpu_$x_(host, program, 0), /not-installed/);
  return { backend: "native-device-mock", frames: 1000, coldRecordsBytes: 128,
    coldParametersBytes: 160, hotRecordsBytes: 0, hotParametersBytes: 0,
    hotUniformBytes: 16000, pipelines: 1, buffers: 3, hardware: "未验证" };
}
