import assert from "node:assert/strict";
import { test } from "node:test";
import {
  _$n__PCT__$M_ as structWith,
  init_tags as initTags,
  to_js_data as toJsData,
} from "../target/js/motion/calcit.core.mjs";
import { InstanceNode, InstanceSource } from "../target/js/motion/quamolit.scene-ir.mjs";
import { ColorRgba } from "../target/js/motion/quamolit.motion.mjs";
import { draw_instances_$x_ as drawInstances } from "../target/js/motion/quamolit.canvas-reference.mjs";

const tags = initTags(["id", "version", "count", "source", "width", "height", "fill", "r", "g", "b", "a"]);

function instanceNode(count) {
  const source = structWith(InstanceSource, tags.id, "particles", tags.version, 1, tags.count, count);
  const color = structWith(ColorRgba, tags.r, 0.917, tags.g, 0.345, tags.b, 0.047, tags.a, 1);
  return structWith(InstanceNode, tags.source, source, tags.width, 2, tags.height, 2, tags.fill, color);
}

function fakeContext() {
  return {
    fillStyle: "#ffffff", globalAlpha: 1, calls: 0,
    save() { this.saved = [this.fillStyle, this.globalAlpha]; },
    restore() { [this.fillStyle, this.globalAlpha] = this.saved; },
    fillRect() { this.calls++; },
  };
}

test("公共 draw-instances! 用一次 Canvas 批次绘制 10k 实例并返回类型化计数", () => {
  const context = fakeContext();
  const positions = new Float32Array(20000);
  const metrics = toJsData(drawInstances(context, instanceNode(10000), positions));
  assert.deepEqual(metrics, {
    "boundary-calls": 1, "canvas-calls": 10000, instances: 10000, "position-bytes-read": 80000,
  });
  assert.equal(context.calls, 10000, "Canvas 参考仍逐实例 fillRect，不冒充 GPU draw");
  assert.equal(context.fillStyle, "#ffffff", "绘制后恢复调用者样式");
});

test("零实例与非法源类型显式失败，不静默漏绘", () => {
  const context = fakeContext();
  assert.deepEqual(toJsData(drawInstances(context, instanceNode(0), new Float32Array(0))), {
    "boundary-calls": 1, "canvas-calls": 0, instances: 0, "position-bytes-read": 0,
  });
  assert.equal(context.calls, 0);
  assert.throws(() => drawInstances(context, instanceNode(4), [1, 2, 3, 4]), /Float32Array/);
});
