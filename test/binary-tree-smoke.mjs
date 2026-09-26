import assert from "node:assert/strict";
import { test } from "node:test";
import { frame_at } from "../target/js/binary-tree/quamolit.examples.binary-tree.mjs";
import { draw_polylines_$x_ } from "../target/js/binary-tree/quamolit.canvas-strokes.mjs";
import { to_js_data, init_tags, CalcitSliceList } from "../target/js/binary-tree/calcit.core.mjs";
import { originalTree } from "./binary-tree-reference.mjs";
const tags = init_tags(["scene", "width", "points", "x"]);
const paths = (t,depth=5) => frame_at(t,depth).get(tags.scene);
const segments = (t,depth=5) => to_js_data(paths(t,depth)).flatMap(p => [0,2].map((end,i) => ({
  id:p.id+(i===0?"L":"R"),x0:p.points[1].x,y0:p.points[1].y,
  x1:p.points[end].x,y1:p.points[end].y,width:p.width,color:p.color,
})));

test("126 条分支与历史矩阵 oracle 一致，乱序/重复/倒放可重现", () => {
  for (const t of [10,0,2.5,5,1,0,-1,60]) {
    const actual = segments(t), expected = originalTree(t);
    assert.equal(to_js_data(paths(t)).length,63);
    assert.equal(actual.length,126);
    assert.equal(new Set(actual.map(x=>x.id)).size,126);
    actual.forEach((s,i) => {
      assert.equal(s.id,expected[i].id);
      for (const key of ["x0","y0","x1","y1","width"]) assert.ok(Math.abs(s[key]-expected[i][key]) < 1e-10, `${t}/${i}/${key}`);
      assert.deepEqual(s.color,{r:0.1,g:19/30,b:0.9,a:1});
    });
  }
  assert.deepEqual(segments(5),segments(5));
  assert.notDeepEqual(segments(0),segments(5));
  const broken = originalTree(5); broken[12].x1 += 1;
  assert.throws(() => assert.ok(Math.abs(segments(5)[12].x1-broken[12].x1)<1e-10), "负例必须被 oracle 检出");
});

test("拒绝非有限时间和非法深度，容量有界", () => {
  for (const t of [NaN,Infinity,-Infinity]) assert.throws(()=>frame_at(t,5));
  for (const depth of [-1,1.5,9,NaN,Infinity]) assert.throws(()=>frame_at(0,depth));
  assert.equal(segments(0,0).length,2);
  assert.equal(segments(0,8).length,1022);
});

test("63 次连接描边，状态恢复、零宽不绘制，非法整批先拒绝", () => {
  let calls=0, saved=0, points=[];
  const keys=["strokeStyle","lineWidth","lineCap","lineJoin"];
  const context = {strokeStyle:"initial",lineWidth:7,lineCap:"square",lineJoin:"bevel",stack:[],
    save(){saved++;this.stack.push(keys.map(k=>this[k]));},
    restore(){saved--;this.stack.pop().forEach((v,i)=>this[keys[i]]=v);},
    beginPath(){points=[];},moveTo(x,y){points.push([x,y]);},lineTo(x,y){points.push([x,y]);},
    stroke(){calls++;assert.equal(points.length,3);assert.ok(points.flat().every(Number.isFinite));assert.equal(this.lineCap,"round");assert.equal(this.lineJoin,"round");}
  };
  draw_polylines_$x_(context,paths(2.5));
  assert.equal(calls,63);assert.equal(saved,0);
  assert.deepEqual(keys.map(k=>context[k]),["initial",7,"square","bevel"]);
  const good=paths(0).get(0);
  const badPoint=good.get(tags.points).get(0).assoc(tags.x,NaN);
  for(const invalid of [good.assoc(tags.width,-1),good.assoc(tags.width,Infinity),good.assoc(tags.points,new CalcitSliceList([])),good.assoc(tags.points,new CalcitSliceList([badPoint,badPoint]))]) {
    assert.throws(()=>draw_polylines_$x_(context,new CalcitSliceList([good,invalid])));
    assert.equal(calls,63);assert.equal(saved,0);
  }
  draw_polylines_$x_(context,new CalcitSliceList([good.assoc(tags.width,0)]));
  assert.equal(calls,63);
});
