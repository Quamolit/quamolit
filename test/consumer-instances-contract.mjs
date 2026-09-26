import assert from "node:assert/strict";

// 公共 Canvas 10k 实例路径的独立计数断言；不依赖框架内部 JS 或 test/host。
export function verifyInstancesConsumer(app, core) {
  const declaration = core.to_js_data(app.instances_declaration());
  assert.equal(declaration.source.id, "consumer-particles");
  assert.equal(declaration.source.count, 10000);
  assert.equal(declaration.width, 3);
  assert.equal(declaration.height, 3);
  const context = {
    fillStyle: "#ffffff", globalAlpha: 1, calls: 0,
    save() { this.saved = [this.fillStyle, this.globalAlpha]; },
    restore() { [this.fillStyle, this.globalAlpha] = this.saved; },
    fillRect() { this.calls++; },
  };
  const positions = new Float32Array(declaration.source.count * 2);
  const metrics = core.to_js_data(app.draw_instances_$x_(context, positions));
  assert.deepEqual(metrics, {
    "boundary-calls": 1, "canvas-calls": 10000, instances: 10000, "position-bytes-read": 80000,
  });
  assert.equal(context.calls, 10000, "Canvas 参考仍逐实例 fillRect，不冒充 GPU draw");
  assert.equal(context.fillStyle, "#ffffff", "绘制后恢复调用者样式");
  assert.throws(() => app.draw_instances_$x_(context, [1, 2]), /Float32Array/, "非 Float32 源必须显式失败");
  return { boundaryCalls: metrics["boundary-calls"], canvasCalls: metrics["canvas-calls"], instances: metrics.instances, positionBytesRead: metrics["position-bytes-read"] };
}
