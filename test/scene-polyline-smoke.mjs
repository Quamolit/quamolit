import assert from "node:assert/strict";
import { test } from "node:test";
import * as core from "../target/js/binary-tree/calcit.core.mjs";
import * as ir from "../target/js/binary-tree/quamolit.scene-ir.mjs";
import { scene_at, frame_at } from "../target/js/binary-tree/quamolit.examples.binary-tree.mjs";
import { draw_reference_$x_ as draw } from "../target/js/binary-tree/quamolit.canvas-reference.mjs";
import { diff_scene } from "../target/js/binary-tree/quamolit.scene-diff.mjs";
import { apply_scalar } from "../target/js/binary-tree/quamolit.scene-binding.mjs";
const tags=core.init_tags(["nodes","scene","points","width","stroke","content","x","y","r","id","key","parent","bindings","rect","polyline","instances","group","none","source","count","version","height","fill","a","b","c","d","e","f","transform","clip","opacity","motion-id","target"]);
const L=items=>new core.CalcitSliceList(items);
const E=(type,kind,...values)=>core._PCT__$o__$o_(type,tags[kind],...values);
const R=(type,values)=>core._$n__PCT__$M_(type,...Object.entries(values).flatMap(([key,value])=>[tags[key],value]));
const plain=core.to_js_data;
const nodeOf=doc=>doc.get(tags.nodes).get(0);
const pathOf=node=>node.get(tags.content).extra[0];
const docWith=(doc,nodes)=>doc.assoc(tags.nodes,L(nodes));
const pathNode=(node,path)=>node.assoc(tags.content,E(ir.SceneContent,"polyline",path));

test("树的正式 Scene 保持身份、层序、坐标，且不含宿主句柄",()=>{
  for(const time of [5,0,2.5,10,5,-1]){
    const doc=scene_at(time,5),wire=plain(doc);
    assert.equal(ir.validate_scene(doc),true);
    assert.deepEqual(JSON.parse(JSON.stringify(wire)),wire);
    const paths=plain(frame_at(time,5).get(tags.scene));
    assert.equal(wire.nodes.length,63);
    wire.nodes.forEach((node,i)=>{
      assert.equal(node.id,paths[i].id);assert.equal(node.key,node.id);assert.equal(node.parent,"");
      assert.deepEqual(node.bindings,[]);assert.deepEqual(node.interaction,["none"]);
      assert.deepEqual(node.content,["polyline",{points:paths[i].points,stroke:paths[i].color,width:paths[i].width}]);
    });
  }
});

test("Scene diff 区分路径几何、宽度与颜色，不伪造资源变更",()=>{
  const base=scene_at(0,0),node=nodeOf(base),path=pathOf(node);
  for(const [changed,field] of [
    [path.assoc(tags.width,9),"geometry"],
    [path.assoc(tags.points,L([path.get(tags.points).get(0).assoc(tags.x,99),path.get(tags.points).get(1)])),"geometry"],
    [path.assoc(tags.stroke,path.get(tags.stroke).assoc(tags.r,0.5)),"properties"],
  ]){
    const delta=plain(diff_scene(base,docWith(base,[pathNode(node,changed)]),0,0));
    assert.equal(delta.changes.length,1);assert.equal(delta.changes[0][0],"updated");
    const flags=delta.changes[0][2];
    assert.equal(flags[field],true);assert.equal(flags[field==="geometry"?"properties":"geometry"],false);
    assert.equal(flags.resources,false);assert.equal(flags.reference,false);
  }
  assert.deepEqual(plain(diff_scene(base,base,0,1)),{changes:[],"time-changed":true});
  const rect=R(ir.RectNode,{x:0,y:0,width:4,height:5,fill:path.get(tags.stroke)});
  const swapped=docWith(base,[node.assoc(tags.content,E(ir.SceneContent,"rect",rect))]);
  assert.deepEqual(plain(diff_scene(base,swapped,0,0)).changes.map(x=>x[0]).sort(),["added","removed"]);
});

test("统一参考先拒绝整个非法/不支持场景，保留矩形与路径透明绘制顺序",()=>{
  const base=scene_at(0,0),node=nodeOf(base),path=pathOf(node),calls=[];
  const context={save(){calls.push("save");},restore(){calls.push("restore");},beginPath(){},moveTo(){},lineTo(){},stroke(){calls.push("path");},fillRect(){calls.push("rect");}};
  const rect=R(ir.RectNode,{x:0,y:0,width:4,height:5,fill:path.get(tags.stroke)});
  const rectangle=node.assoc(tags.id,"rect").assoc(tags.key,"rect").assoc(tags.content,E(ir.SceneContent,"rect",rect));
  draw(context,docWith(base,[rectangle,node,rectangle.assoc(tags.id,"last").assoc(tags.key,"last")]));
  assert.deepEqual(calls.filter(x=>x==="rect"||x==="path"),["rect","path","rect"]);
  const source=R(ir.InstanceSource,{id:"test",version:0,count:1});
  const instance=R(ir.InstanceNode,{source,width:4,height:4,fill:path.get(tags.stroke)});
  const matrix=R(ir.Matrix2D,{a:1,b:0,c:0,d:1,e:0,f:0});
  const group=R(ir.GroupNode,{transform:matrix,clip:E(ir.ClipSpec,"none"),opacity:1});
  const bads=[
    pathNode(node,path.assoc(tags.width,-1)),
    pathNode(node,path.assoc(tags.points,L([]))),
    pathNode(node,path.assoc(tags.points,L([path.get(tags.points).get(0)]))),
    pathNode(node,path.assoc(tags.points,L([path.get(tags.points).get(0).assoc(tags.x,Infinity),path.get(tags.points).get(1)]))),
    pathNode(node,path.assoc(tags.stroke,path.get(tags.stroke).assoc(tags.r,NaN))),
    node.assoc(tags.content,E(ir.SceneContent,"instances",instance)),
    node.assoc(tags.content,E(ir.SceneContent,"group",group)),
  ];
  for(const bad of bads){calls.length=0;assert.throws(()=>draw(context,docWith(base,[rectangle,bad])));assert.deepEqual(calls,[]);}
  calls.length=0;draw(context,docWith(base,[pathNode(node,path.assoc(tags.width,0))]));assert.deepEqual(calls,[]);
  const binding=R(ir.ScalarBinding,{"motion-id":"x",version:0,target:E(ir.ScalarTarget,"width")});
  // Tag keys above intentionally come from the compiler's runtime registry.
  assert.throws(()=>ir.validate_scene(docWith(base,[node.assoc(tags.bindings,L([binding]))])),/invalid-scene-node/);
  assert.throws(()=>apply_scalar(node.get(tags.content),E(ir.ScalarTarget,"width"),4),/unsupported-polyline-binding/);
});
