// 浏览器入口只负责 DOM、事件传输、时钟与视口。Model/命中/过渡/重放/绘制在 Calcit。
import * as todo from "../../target/js/todolist/quamolit.examples.todolist.mjs";
import { draw_plan_$x_ } from "../../target/js/todolist/quamolit.retained-component.mjs";
import { init_tags, to_js_data } from "../../target/js/todolist/calcit.core.mjs";
const tags = init_tags(["model", "rows", "revision", "released", "plan-builds", "cursor", "time", "scene", "transforms"]);
const canvas = document.querySelector("#scene"), ctx = canvas.getContext("2d");
const panel = document.querySelector("#panel"), toggle = document.querySelector("#panel-toggle");
const status = document.querySelector("#status"), message = document.querySelector("#message"), slider = document.querySelector("#time");
const play = document.querySelector("#play"), draft = document.querySelector("#draft");
let log = todo.demo_log(), session = todo.initial_session(), plan, time = 0;
let playing = false, raf = null, timer = null, anchor = 0, started = 0, paints = 0, editId = "";
let view = {scale:1, x:0, y:0};
const model = () => session.get(tags.model);
let cachedModel, cachedData;
const data = () => { const value=model(); if(value!==cachedModel){cachedModel=value;cachedData=to_js_data(value);}return cachedData; };
function draw() {
  const bounds = canvas.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  const width = Math.max(1, Math.round(bounds.width*dpr)), height = Math.max(1, Math.round(bounds.height*dpr));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  // 8 行以内固定构图；更长列表适配为全景，不改变 Calcit 逻辑坐标。
  const count = data().rows.length, stageHeight = Math.max(760, count*64+240);
  view = {scale:Math.min(width/900,height/stageHeight), x:width/2, y:height/2};
  view.y -= Math.max(0,(count-6)*32)*view.scale;
  ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,width,height);
  ctx.setTransform(view.scale,0,0,view.scale,view.x,view.y);
  draw_plan_$x_(ctx,plan); paints++;
  slider.max = String(Math.max(5,time)); slider.value = String(time);
  const snapshot = data();
  status.textContent = `t = ${time.toFixed(2)} s · ${playing ? "播放" : "暂停"}\n${snapshot.rows.filter(r=>r.present).length} 行 / ${snapshot.rows.length} 保留行\n计划构建 ${plan.get(tags["plan-builds"])} · 绘制 ${paints}\n逻辑释放 ${snapshot.released} · 日志 ${to_js_data(log).length} 条`;
  status.dataset.result = "pass";
  document.querySelector("#restore").disabled = !snapshot["undo-id"];
}
function sample(t, reset = false) {
  const next = todo.advance(reset ? todo.initial_session() : session,log,t);
  const nextPlan = reset || !plan ? todo.start_plan(next.get(tags.model),t) : todo.update_plan(plan,next.get(tags.model),t);
  session = next; plan = nextPlan; time = t; draw();
}
function stop() {
  playing = false;
  if (raf !== null) cancelAnimationFrame(raf);
  if (timer !== null) clearTimeout(timer);
  raf = timer = null; play.textContent = "播放";
}
function schedule() {
  if (!playing) return;
  if (todo.needs_frame_$q_(model(),time)) raf = requestAnimationFrame(tick);
  else {
    const next = todo.next_event_at(session,log);
    if (next < 0) stop();
    else timer = setTimeout(()=>tick(performance.now()),Math.max(1,(next-time)*1000));
  }
}
function tick(now) {
  raf = timer = null;
  if (!playing) return;
  safely(()=>{ sample(anchor+Math.max(0,now-started)/1000); schedule(); });
}
function start() {
  if (playing) return;
  anchor = time; started = performance.now(); playing = true; play.textContent = "暂停"; schedule();
}
function seek(t) { stop(); sample(t,true); return snapshot(); }
function cancelEdit() { editId = ""; document.querySelector("#submit").textContent = "新增"; document.querySelector("#cancel-edit").hidden = true; }
function send(kind,id="",label="") {
  const eventTime = playing ? anchor+Math.max(0,performance.now()-started)/1000 : time;
  stop();
  if(eventTime>time)sample(eventTime);
  // 校验成功后才替换日志；在历史时刻编辑会明确丢弃其后的事件分支。
  const candidate = todo.append_event(todo.events_through(log,time),time,kind,id,label);
  const next = todo.advance(session,candidate,time);
  const nextPlan = todo.update_plan(plan,next.get(tags.model),time);
  log = candidate; session = next; plan = nextPlan; draw(); start();
  return snapshot();
}
function safely(action) { try { message.textContent = ""; return action(); } catch(error) { stop(); message.textContent = error.message; } }
function snapshot() {
  return {time,playing,paints,model:data(),events:to_js_data(log),scene:to_js_data(plan.get(tags.scene)),transforms:to_js_data(plan.get(tags.transforms)),builds:plan.get(tags["plan-builds"]),width:canvas.width,height:canvas.height,view:{...view}};
}
document.querySelector("#entry-form").onsubmit = event => { event.preventDefault(); safely(()=>{send(editId?"edit":"add",editId,draft.value);cancelEdit();draft.value="";}); };
document.querySelector("#cancel-edit").onclick = cancelEdit;
for (const kind of ["restore","reverse","clear"]) document.querySelector(`#${kind}`).onclick=()=>safely(()=>send(kind));
play.onclick=()=>playing?stop():start();
document.querySelector("#reset").onclick=()=>safely(()=>{stop();log=todo.demo_log();cancelEdit();sample(0,true);start();});
document.querySelector("#live").onclick=()=>safely(()=>{stop();log=todo.events_through(todo.demo_log(),0);cancelEdit();sample(1,true);});
slider.oninput=()=>safely(()=>seek(Number(slider.value)));
document.querySelectorAll("[data-time]").forEach(button=>button.onclick=()=>safely(()=>seek(Number(button.dataset.time))));
canvas.onclick=event=>safely(()=>{
  const bounds=canvas.getBoundingClientRect();
  const x=((event.clientX-bounds.left)*canvas.width/bounds.width-view.x)/view.scale;
  const y=((event.clientY-bounds.top)*canvas.height/bounds.height-view.y)/view.scale;
  const hit=to_js_data(todo.hit_at(model(),time,x,y));
  if (!hit.id) return;
  if(hit.action==="edit") {stop();editId=hit.id;draft.value=hit.text;panel.hidden=false;toggle.setAttribute("aria-expanded","true");toggle.textContent="收起面板";document.querySelector("#submit").textContent="保存";document.querySelector("#cancel-edit").hidden=false;draft.focus();}
  else send(hit.action,hit.id);
});
toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute("aria-expanded",String(!panel.hidden));toggle.textContent=panel.hidden?"展开面板":"收起面板";};
document.querySelector("#export").onclick=()=>{
  const blob=new Blob([JSON.stringify({version:1,events:to_js_data(log)},null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download="quamolit-todolist-events.json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
function importEvents(value) {
  if(value.version!==1 || !Array.isArray(value.events) || value.events.length>2000)throw Error("日志格式或容量无效");
  let candidate=todo.empty_events();
  for(const event of value.events) {
    if(typeof event.at!=="number" || ![event.kind,event.id,event.text].every(x=>typeof x==="string"))throw Error("日志字段类型无效");
    candidate=todo.append_event(candidate,event.at,event.kind,event.id,event.text);
  }
  // 整个日志先经过 Calcit 状态机验证，包括未来事件；失败不替换当前日志。
  todo.replay(candidate,Math.max(0,...value.events.map(e=>e.at))+2);
  stop();log=candidate;cancelEdit();sample(0,true);
}
document.querySelector("#import").onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try {if(file.size>1e6)throw Error("日志文件过大");const value=JSON.parse(await file.text());safely(()=>importEvents(value));}catch(error){message.textContent=error.message;}
};
new ResizeObserver(()=>{if(plan)draw();}).observe(canvas);
let resolution;
function watchDpr(){resolution?.removeEventListener("change",watchDpr);resolution=matchMedia(`(resolution: ${devicePixelRatio||1}dppx)`);resolution.addEventListener("change",watchDpr);if(plan)draw();}
watchDpr();
document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();});
window.addEventListener("pagehide",stop);
window.todoDemo={seek,snapshot,send,pause:stop,play:start,importEvents};
const params=new URLSearchParams(location.search),requested=Number(params.get("t")||0);
sample(Number.isFinite(requested)&&requested>=0?requested:0,true);
if(!params.has("t")&&!matchMedia("(prefers-reduced-motion: reduce)").matches)start();
