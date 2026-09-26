import assert from "node:assert/strict";
import { test } from "node:test";
import { frame_at } from "../target/js/binary-tree/quamolit.examples.binary-tree.mjs";
import { draw_segments_$x_ } from "../target/js/binary-tree/quamolit.canvas-strokes.mjs";
import { to_js_data, init_tags, CalcitSliceList } from "../target/js/binary-tree/calcit.core.mjs";
import { originalTree } from "./binary-tree-reference.mjs";
const tags = init_tags(["scene", "width"]);
const segments = (t,depth=5) => frame_at(t,depth).get(tags.scene);

test("126 条分支与历史矩阵 oracle 一致，乱序/重复/倒放可重现", () => {
  for (const t of [10,0,2.5,5,1,0,-1,60]) {
    const actual = to_js_data(segments(t)), expected = originalTree(t);
    assert.equal(actual.length,126);
    assert.equal(new Set(actual.map(x=>x.id)).size,126);
    actual.forEach((s,i) => {
      assert.equal(s.id,expected[i].id);
      for (const key of ["x0","y0","x1","y1","width"]) assert.ok(Math.abs(s[key]-expected[i][key]) < 1e-10, `${t}/${i}/${key}`);
      assert.deepEqual(s.color,{r:0.1,g:19/30,b:0.9,a:1});
    });
  }
  assert.deepEqual(to_js_data(segments(5)),to_js_data(segments(5)));
  assert.notDeepEqual(to_js_data(segments(0)),to_js_data(segments(5)));
  const broken = originalTree(5); broken[12].x1 += 1;
  assert.throws(() => assert.ok(Math.abs(to_js_data(segments(5))[12].x1-broken[12].x1)<1e-10), "负例必须被 oracle 检出");
});

test("拒绝非有限时间和非法深度，容量有界", () => {
  for (const t of [NaN,Infinity,-Infinity]) assert.throws(()=>frame_at(t,5));
  for (const depth of [-1,1.5,9,NaN,Infinity]) assert.throws(()=>frame_at(0,depth));
  assert.equal(to_js_data(segments(0,0)).length,2);
  assert.equal(to_js_data(segments(0,8)).length,1022);
});

test("类型化 js-ffi 绘制边界：126 次矩形提交，状态恢复，非法输入先拒绝", () => {
  let calls=0, saved=0;
  const context = { fillStyle:"initial", stack:[], save(){saved++;this.stack.push(this.fillStyle);}, restore(){saved--;this.fillStyle=this.stack.pop();}, transform(...m){assert.ok(m.every(Number.isFinite));}, fillRect(x,y,w,h){calls++;assert.ok([x,y,w,h].every(Number.isFinite));} };
  draw_segments_$x_(context,segments(2.5));
  assert.equal(calls,126); assert.equal(saved,0); assert.equal(context.fillStyle,"initial");
  const invalid=segments(0).get(0).assoc(tags.width,-1);
  assert.throws(()=>draw_segments_$x_(context,new CalcitSliceList([invalid])));
  assert.equal(calls,126);
});
