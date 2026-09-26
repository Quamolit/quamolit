import assert from "node:assert/strict";
import {test} from "node:test";
import * as todo from "../target/js/todolist/quamolit.examples.todolist.mjs";
import {sample_plan_at as sample} from "../target/js/todolist/quamolit.retained-component.mjs";
import {sample_transition as transitionAt} from "../target/js/todolist/quamolit.transition.mjs";
import {init_tags,to_js_data as js,_$n_enum_$o_nth as enumNth} from "../target/js/todolist/calcit.core.mjs";
import {draw_text_$x_ as drawText} from "../target/js/todolist/quamolit.canvas-reference.mjs";
import {geometry_signature as geometry,property_signature as properties,resource_signature as resources} from "../target/js/todolist/quamolit.scene-diff.mjs";
const tags=init_tags(["model","rows","y","id","scene","nodes","plan-builds","slots","revision","content","size","fill","text"]);
const field=(x,k)=>x.get(tags[k]);
const rows=m=>js(m).rows;
const live=()=>todo.replay(todo.events_through(todo.demo_log(),0),1);
const scene=p=>js(field(p,"scene"));

test("固定日志直接跳转与顺序游标得到相同逻辑 Model、画面与释放计数",()=>{
  const log=todo.demo_log();let session=todo.initial_session();
  const expected=new Map();
  const normalize=model=>{const value=js(model);delete value.revision;return value;};
  for(const t of [0,0.1,0.25,0.5,0.9,1,1.2,1.5,1.65,1.7,2,2.3,2.45,2.6,3,3.5,4]){
    session=todo.advance(session,log,t);
    const direct=todo.replay(log,t);
    // revision 是实际缓存失效次数，逐帧结算次数可不同；可观察 Model 和画面必须相同。
    expected.set(t,normalize(field(session,"model")));
    assert.deepEqual(normalize(field(session,"model")),normalize(direct),`model t=${t}`);
    assert.deepEqual(scene(todo.start_plan(field(session,"model"),t)),scene(todo.start_plan(direct,t)),`scene t=${t}`);
  }
  for(const t of [4,0,2.6,1.65,0.25,4]) assert.deepEqual(normalize(todo.replay(log,t)),expected.get(t));
  const end=todo.replay(log,4);
  assert.deepEqual(rows(end).map(r=>[r.id,r.text,r.done]),[["2","Create",true],["3","Explore",false]]);
  assert.equal(js(end).released,6);assert.equal(todo.needs_frame_$q_(end,4),false);
});

test("完成宽度手算中间帧，稳定内容跨 1000 时间帧共享",()=>{
  const model=todo.dispatch(live(),1,"toggle","2","");
  let plan=todo.start_plan(model,1), nodes=field(field(plan,"scene"),"nodes");
  const stable=nodes.get(0), slots=field(plan,"slots");
  for(let i=0;i<1000;i++){
    const t=1+(i%401)/1000;plan=sample(plan,t);
    assert.equal(field(field(plan,"scene"),"nodes").get(0),stable);
    assert.equal(field(plan,"slots"),slots);
  }
  const middle=scene(sample(plan,1.2)).nodes.find(n=>n.id==="presence/rect/2/checked");
  assert.ok(Math.abs(middle.content[1].width-14)<1e-12);
  assert.equal(field(plan,"plan-builds"),1);
});

test("重排在 25/50/75% 打断时位置连续，原 Model 不被修改",()=>{
  for(const progress of [.25,.5,.75]){
    const initial=live();const moving=todo.dispatch(initial,1,"reverse","","");
    const before=js(moving), at=1+0.4*progress;
    const next=todo.dispatch(moving,at,"front","3","");
    for(const id of ["1","2","3"]){
      const old=todo.find_row(moving,id),fresh=todo.find_row(next,id);
      assert.ok(Math.abs(transitionAt(field(old,"y"),at)-transitionAt(field(fresh,"y"),at))<1e-12);
    }
    assert.deepEqual(js(moving),before);
  }
});

test("退出中禁命中、恢复保持 alpha；终点后恢复重新进入",()=>{
  const initial=live(),exiting=todo.dispatch(initial,1,"remove","3","");
  assert.equal(js(todo.hit_at(exiting,1.2,-270,-160)).id,"");
  const at=1.3, revived=todo.dispatch(exiting,at,"restore","","");
  const old=rows(exiting).find(r=>r.id==="3"), next=rows(revived).find(r=>r.id==="3");
  assert.equal(old.present,false);assert.equal(next.present,true);
  const a=scene(todo.start_plan(exiting,at)).nodes.find(n=>n.id==="presence/rect/3/card").content[1].fill.a;
  const b=scene(todo.start_plan(revived,at)).nodes.find(n=>n.id==="presence/rect/3/card").content[1].fill.a;
  assert.equal(a,b);
  const settled=todo.settle(exiting,2), readded=todo.dispatch(settled,2,"restore","","");
  assert.equal(js(settled).released,6);
  assert.equal(scene(todo.start_plan(readded,2)).nodes.find(n=>n.id==="presence/rect/3/card").content[1].fill.a,0);
});

test("错峰进入与退出，100 次装卸返回空 Model，结算不重复释放",()=>{
  const model=todo.replay(todo.events_through(todo.demo_log(),0),0);
  const start=scene(todo.start_plan(model,0.08)).nodes.filter(n=>n.id.endsWith("/card"));
  assert.ok(start[0].content[1].fill.a>start[1].content[1].fill.a);
  assert.ok(start[1].content[1].fill.a>start[2].content[1].fill.a);
  const clearing=todo.dispatch(live(),1,"clear","","");
  const exit=scene(todo.start_plan(clearing,1.08)).nodes.filter(n=>n.id.endsWith("/card"));
  assert.ok(exit[0].content[1].fill.a>exit[1].content[1].fill.a);
  assert.ok(exit[1].content[1].fill.a>exit[2].content[1].fill.a);
  let state=todo.initial();
  for(let i=0;i<100;i++){
    const t=i*3;state=todo.dispatch(state,t,"add","","Cycle");
    state=todo.settle(state,t+1);state=todo.dispatch(state,t+1,"clear","","");
    state=todo.settle(state,t+2);
    assert.equal(rows(state).length,0);assert.equal(js(state).presence.items.length,0);
    assert.equal(js(state).released,(i+1)*6);assert.equal(todo.needs_frame_$q_(state,t+2),false);
    assert.deepEqual(js(todo.settle(state,t+2)),js(state));
  }
});

test("事件失败保留旧状态；未知事件、时序和容量有界",()=>{
  const model=live(),before=js(model);
  for(const args of [[-1,"add","","Bad"],[1,"bad","",""],[1,"edit","2",""],[1,"remove","missing",""]])assert.throws(()=>todo.dispatch(model,...args));
  assert.throws(()=>todo.append_event(todo.demo_log(),1,"clear","",""),/nonmonotonic/);
  assert.throws(()=>todo.advance(todo.advance(todo.initial_session(),todo.demo_log(),2),todo.demo_log(),1),/invalid-todo-advance/);
  assert.deepEqual(js(model),before);
  let full=todo.initial();for(let i=0;i<24;i++)full=todo.dispatch(full,0,"add","","Row");
  assert.throws(()=>todo.dispatch(full,0,"add","","Overflow"),/todo-capacity/);
  const removed=todo.settle(todo.dispatch(full,2,"remove","1",""),5);
  const refilled=todo.dispatch(removed,5,"add","","Replacement");
  assert.throws(()=>todo.dispatch(refilled,5,"restore","",""),/todo-capacity/);
});

test("文字 diff 分类与宿主状态恢复；非法字号在绘制前拒绝",()=>{
  const red=todo.color(1,0,0,1),blue=todo.color(0,0,1,1);
  const before=todo.text(0,"Calcit",18,red),recolor=todo.text(0,"Calcit",18,blue),edited=todo.text(0,"Canvas",18,red);
  assert.deepEqual(js(geometry(before)),js(geometry(recolor)));
  assert.notDeepEqual(js(properties(before)),js(properties(recolor)));
  assert.notDeepEqual(js(geometry(before)),js(geometry(edited)));
  assert.deepEqual(js(resources(before)),["none"]);
  const calls=[];const context={save(){calls.push("save");},restore(){calls.push("restore");},fillText(){calls.push("fillText");throw Error("host-failure");}};
  const text=enumNth(before,1);
  assert.throws(()=>drawText(context,text),/host-failure/);
  assert.deepEqual(calls,["save","fillText","restore"]);
  for(const size of [0,-1,NaN,Infinity])assert.throws(()=>drawText(context,text.assoc(tags.size,size)),/invalid-scene-text/);
  assert.deepEqual(calls,["save","fillText","restore"]);
});
