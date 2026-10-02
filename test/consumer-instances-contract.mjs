import assert from "node:assert/strict";

// 公共 Canvas 10k 实例路径的独立计数断言；不依赖框架内部 JS 或 test/host。
export function verifyInstancesConsumer(app, core) {
  const declaration = core.to_js_data(app.instances_declaration());
  assert.equal(declaration.source.id, "consumer-particles");
  assert.equal(declaration.source.count, 10000);
  assert.equal(declaration.width, 2);
  assert.equal(declaration.height, 2);
  const context = {
    fillStyle: "#ffffff",
    globalAlpha: 1,
    calls: 0,
    save() {
      this.saved = [this.fillStyle, this.globalAlpha];
    },
    restore() {
      [this.fillStyle, this.globalAlpha] = this.saved;
    },
    fillRect(x, y) {
      if (this.calls === 5050) this.dynamicPosition = [x, y];
      this.calls++;
    },
  };
  const positions = new Float32Array(declaration.source.count * 2);
  const metrics = core.to_js_data(app.draw_instances_$x_(context, positions));
  assert.deepEqual(metrics, {
    "boundary-calls": 1,
    "canvas-calls": 10000,
    instances: 10000,
    "position-bytes-read": 80000,
  });
  assert.equal(context.calls, 10000, "Canvas 参考仍逐实例 fillRect，不冒充 GPU draw");
  assert.equal(context.fillStyle, "#ffffff", "绘制后恢复调用者样式");
  assert.throws(() => app.draw_instances_$x_(context, [1, 2]), /Float32Array/, "非 Float32 源必须显式失败");
  const table = app.create_instances_table_$x_();
  app.register_instances_$x_(table, positions);
  let version = 1;
  assert.equal(app.instances_live_count(table), 1);
  const hitPlan = app.instances_hit_plan(table, 1);
  assert.deepEqual(
    core.to_js_data(app.instances_hit_index(hitPlan, 1, 1)),
    ["some", 9999],
    "重叠实例选择最后绘制的源索引",
  );
  assert.deepEqual(core.to_js_data(app.instances_hit_index(hitPlan, 109, 91)), ["none"]);
  let hitBuilds = 1;
  for (let step = 0; step < 100; step++) {
    const time = step % 2;
    const frame = core.to_js_data(app.instance_frame_at(time));
    assert.deepEqual(frame, { index: 5050, x: 108 * (1 - time), y: 90 * (1 - time) });
    const next = version + 1;
    assert.equal(
      app.patch_instances_$x_(table, version, next, app.instance_frame_at(time), new Float32Array([frame.x, frame.y])),
      8,
    );
    if (step < 2) {
      const nextHitPlan = app.instances_hit_plan(table, next);
      hitBuilds++;
      assert.deepEqual(
        core.to_js_data(app.instances_hit_index(nextHitPlan, 109, 91)),
        step === 0 ? ["some", 5050] : ["none"],
      );
      assert.deepEqual(
        core.to_js_data(app.instances_hit_index(hitPlan, 109, 91)),
        ["none"],
        "新版本位置不得改写旧命中计划",
      );
    }
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
  assert.deepEqual(
    core.to_js_data(app.instances_hit_index(hitPlan, 1, 1)),
    ["some", 9999],
    "源释放后旧计划仍持有不可变位置，不再次解析宿主表",
  );
  assert.throws(() => app.instances_hit_plan(table, version), "新计划不能解析已释放的源版本");
  const motions = app.independent_instance_motions();
  const declarations = core.to_js_data(motions);
  assert.equal(declarations.length, 10000);
  assert.equal(new Set(declarations.map((item) => item.id)).size, 10000, "独立动画须保持不同身份");
  let initial, final;
  for (const time of [1, 0, 0.5, 0.25, 1]) {
    const sampled = core.to_js_data(app.independent_instance_positions(motions, time));
    assert.equal(sampled.length, 20000);
    for (let index = 0; index < 10000; index++) {
      let progress = Math.min(1, Math.max(0, (time - 0.012 * (index % 13)) / (0.45 + 0.02 * (index % 17))));
      if (index % 2 === 1) progress = progress * progress * (3 - 2 * progress);
      const x = 8 + 2 * (index % 125) + (1 + (index % 7)) * progress;
      const y = 10 + 2 * Math.floor(index / 125) + ((index % 5) - 2) * progress;
      assert.ok(Math.abs(sampled[index * 2] - x) < 1e-10, `独立 x: ${index}/${time}`);
      assert.ok(Math.abs(sampled[index * 2 + 1] - y) < 1e-10, `独立 y: ${index}/${time}`);
    }
    if (time === 0) initial = sampled;
    if (time === 1) final = sampled;
  }
  assert.equal(final.filter((value, index) => index % 2 === 0 && value !== initial[index]).length, 10000);
  assert.deepEqual(core.to_js_data(motions), declarations, "乱序采样不能改写声明");
  assert.throws(() => app.independent_instance_positions(motions, NaN), /invalid-motion-time/);
  return {
    boundaryCalls: metrics["boundary-calls"],
    canvasCalls: metrics["canvas-calls"],
    instances: metrics.instances,
    positionBytesRead: metrics["position-bytes-read"],
    dynamicPatchBytes: 8,
    dynamicUpdates: 100,
    liveAfterDispose: 0,
    hitPlan: {
      builds: hitBuilds,
      instances: 10000,
      versions: [1, 2, 3],
      scope: "Calcit解析资源表与命中；不包含实例级capture或性能验收",
    },
    independent: { instances: 10000, sampledTimes: [1, 0, 0.5, 0.25, 1], changedInstances: 10000 },
  };
}
