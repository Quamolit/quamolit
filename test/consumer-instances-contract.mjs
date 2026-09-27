import assert from "node:assert/strict";

// 公共 Canvas 10k 实例路径的独立计数断言；不依赖框架内部 JS 或 test/host。
export function verifyInstancesConsumer(app, core) {
  const declaration = core.to_js_data(app.instances_declaration());
  assert.equal(declaration.source.id, "consumer-particles");
  assert.equal(declaration.source.count, 10000);
  assert.equal(declaration.width, 2);
  assert.equal(declaration.height, 2);
  const context = {
    fillStyle: "#ffffff", globalAlpha: 1, calls: 0,
    save() { this.saved = [this.fillStyle, this.globalAlpha]; },
    restore() { [this.fillStyle, this.globalAlpha] = this.saved; },
    fillRect(x, y) { if (this.calls === 5050) this.dynamicPosition = [x, y]; this.calls++; },
  };
  const positions = new Float32Array(declaration.source.count * 2);
  const metrics = core.to_js_data(app.draw_instances_$x_(context, positions));
  assert.deepEqual(metrics, {
    "boundary-calls": 1, "canvas-calls": 10000, instances: 10000, "position-bytes-read": 80000,
  });
  assert.equal(context.calls, 10000, "Canvas 参考仍逐实例 fillRect，不冒充 GPU draw");
  assert.equal(context.fillStyle, "#ffffff", "绘制后恢复调用者样式");
  assert.throws(() => app.draw_instances_$x_(context, [1, 2]), /Float32Array/, "非 Float32 源必须显式失败");
  const table = app.create_instances_table_$x_();
  app.register_instances_$x_(table, positions);
  let version = 1;
  assert.equal(app.instances_live_count(table), 1);
  for (let step = 0; step < 100; step++) {
    const time = step % 2;
    const frame = core.to_js_data(app.instance_frame_at(time));
    assert.deepEqual(frame, { index: 5050, x: 108 * (1 - time), y: 90 * (1 - time) });
    const next = version + 1;
    assert.equal(app.patch_instances_$x_(table, version, next, app.instance_frame_at(time), new Float32Array([frame.x, frame.y])), 8);
    assert.equal(app.release_instances_$x_(table, version), true);
    version = next;
    assert.equal(app.instances_live_count(table), 1, "连续更新只保留一个公开版本");
  }
  context.calls = 0;
  const resolved = core.to_js_data(app.draw_resolved_instances_$x_(context, table, version));
  assert.deepEqual(resolved, metrics);
  assert.deepEqual(context.dynamicPosition, [0, 0], "Canvas 必须消费 Calcit 帧函数产生的最后一版坐标");
  assert.equal(app.release_instances_$x_(table, version), true);
  assert.equal(app.instances_live_count(table), 0, "卸载后公开版本计数回到基线");
  return { boundaryCalls: metrics["boundary-calls"], canvasCalls: metrics["canvas-calls"], instances: metrics.instances,
    positionBytesRead: metrics["position-bytes-read"], dynamicPatchBytes: 8, dynamicUpdates: 100, liveAfterDispose: 0 };
}
