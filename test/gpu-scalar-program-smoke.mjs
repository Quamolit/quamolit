import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as core from '../target/js/gpu-component/calcit.core.mjs';
import * as motion from '../target/js/gpu-component/quamolit.motion.mjs';
import * as scene from '../target/js/gpu-component/quamolit.scene-ir.mjs';
import * as program from '../target/js/gpu-component/quamolit.gpu-scalar-program.mjs';
import {dispose_renderer_$x_} from '../target/js/gpu-component/quamolit.gpu-component.mjs';
import {start,start_mixed} from '../target/js/gpu-component/quamolit.test.retained-component-fixture.mjs';
import {sample_plan_at} from '../target/js/gpu-component/quamolit.retained-component.mjs';
import {extreme_plan} from '../target/js/gpu-component/quamolit.test.gpu-component-fixture.mjs';
const tags=core.init_tags(['slots','descriptor','motion','target','index','parameters','from','to','start','duration','easing','constant','tween','time','width','linear','smoothstep']);
const js=core.to_js_data, get=(o,k)=>o.get(tags[k]),set=(o,k,v)=>o.assoc(tags[k],v);
const en=(type,tag,...args)=>core._PCT__$o__$o_(type,tags[tag],...args);
const base=()=>start(0,40,false,100);
const slot=()=>get(base(),'slots').get(0);
const tween=()=>core._$n_enum_$o_nth(get(get(slot(),'descriptor'),'motion'),1);
const withMotion=m=>set(slot(),'descriptor',set(get(slot(),'descriptor'),'motion',m));
const prepare=t=>program.prepare_slot(withMotion(en(motion.ScalarMotion,'tween',t)));

test('公共计划生成固定参数；乱序时间不改变描述符参数',()=>{
 const p=base(),snapshot=js(p),first=program.prepare_program(p);
 assert.equal(first.tag.value,'ready');
 const params=js(get(first.extra[0],'parameters'));
 assert.deepEqual(params,[{index:64,axis:0,start:0,duration:1,from:80,to:120,easing:0}]);
 for(const t of [1,0,.5,.25,1,-1]){
  const result=program.prepare_program(sample_plan_at(p,t));
  assert.equal(result.tag.value,'ready');assert.deepEqual(js(get(result.extra[0],'parameters')),params);
 }
 assert.deepEqual(js(p),snapshot);
 assert.deepEqual(js(program.parameter_values(get(first.extra[0],'parameters').get(0))),[64,0,0,1,80,120,0,0]);
});

test('constant、smoothstep 和零时长保留参数，不提前按某一时刻采样',()=>{
 const constant=program.prepare_slot(withMotion(en(motion.ScalarMotion,'constant',17)));
 assert.equal(constant.tag.value,'ready');assert.equal(js(constant.extra[0]).from,17);assert.equal(js(constant.extra[0]).to,17);
 const smooth=prepare(set(tween(),'easing',en(motion.Easing,'smoothstep')));
 assert.equal(js(smooth.extra[0]).easing,1);
 const instant=prepare(set(set(tween(),'duration',0),'start',.5));
 assert.equal(js(instant.extra[0]).duration,0);assert.equal(js(instant.extra[0]).start,.5);
});

test('不支持算子/目标/CPU 变换均明确回退；重复绑定不能只保留一项',()=>{
 assert.deepEqual(js(program.prepare_slot(withMotion(en(motion.ScalarMotion,'time',1,0)))),['fallback','scalar-kernel-not-supported']);
 assert.deepEqual(js(program.prepare_slot(set(slot(),'target',en(scene.ScalarTarget,'width')))),['fallback','scalar-target-not-supported']);
 assert.deepEqual(js(program.prepare_program(start_mixed(0,40,false,100))),['fallback','cpu-transform-required']);
 const duplicate=set(base(),'slots',new core.CalcitSliceList([slot(),slot()]));
 assert.deepEqual(js(program.prepare_program(duplicate)),['fallback','duplicate-gpu-scalar-target']);
});

test('检查完整参数域；起点有效但终点越界也不能交给 GPU',()=>{
 assert.deepEqual(js(program.prepare_program(extreme_plan(0))),['fallback','scalar-parameters-outside-f32-domain']);
 for(const [key,value] of [['from',1e31],['to',1e31],['start',1e31],['duration',1e31],['duration',1e-40]]){
  assert.deepEqual(js(prepare(set(tween(),key,value))),['fallback','scalar-parameters-outside-f32-domain']);
 }
 assert.throws(()=>prepare(set(tween(),'duration',-1)),/negative-motion-duration/);
});

function mock(){
 const writes=[],buffers=[],shaders=[];
 const device={limits:{maxBufferSize:1e7,maxStorageBufferBindingSize:1e7},
  createShaderModule(v){shaders.push(v.code);return {};},
  createRenderPipeline(){return {getBindGroupLayout(){return {};}};},
  createBuffer(spec){const buffer={...spec,dead:0,destroy(){this.dead++;}};buffers.push(buffer);return buffer;},
  createBindGroup(){return {};},
  createCommandEncoder(){return {beginRenderPass(){return {setPipeline(){},setBindGroup(){},setVertexBuffer(){},draw(){},end(){}};},finish(){return {};}};},
  queue:{writeBuffer(buffer,offset,data){writes.push({label:buffer.label,offset,values:[...data],bytes:data.byteLength});},submit(){}}};
 const canvas={width:320,height:180,getContext(){return {configure(){},unconfigure(){},getCurrentTexture(){return {createView(){return {};}};}};}};
 return {device,canvas,writes,buffers,shaders};
}

test('编译后 file/inline 调用：参数常驻，1000 时间帧只更新 uniform',()=>{
 const m=mock(),h=program.create_renderer_$x_(m.canvas,m.device,'bgra8unorm',128);
 const prepared=program.prepare_program(base()).extra[0];
 assert.throws(()=>program.draw_at_$x_(h,prepared,0),/not-installed/);
 program.install_program_$x_(h,prepared);
 assert.equal(h.uploadedBytes,4160);assert.equal(h.parameterBytes,4192);
 const hotStart=m.writes.length;
 for(let i=0;i<1000;i++)program.draw_at_$x_(h,prepared,(i%101)/100);
 const hot=m.writes.slice(hotStart);
 assert.equal(hot.length,1000);assert.ok(hot.every(w=>w.bytes===16 && w.label==='Quamolit component viewport'));
 assert.equal(h.uploadedBytes,4160);assert.equal(h.parameterBytes,4192);assert.equal(m.buffers.length,3);
 assert.ok(m.shaders[0].includes('sampleMotion(motions[instance*2u]'));
 assert.equal(hot[25].values[2],.25);
 dispose_renderer_$x_(h);dispose_renderer_$x_(h);assert.ok(m.buffers.every(b=>b.dead===1));
 assert.throws(()=>program.draw_at_$x_(h,prepared,.5),/not-installed/);
});

test('同时间版本变化不能复用；重新安装清除旧参数槽',()=>{
 const m=mock(),h=program.create_renderer_$x_(m.canvas,m.device,'bgra8unorm',128),p=base();
 const prepared=program.prepare_program(p).extra[0];
 assert.equal(program.reusable_$q_(prepared,sample_plan_at(p,.5)),true);
 const more=core.init_tags(['versions','component','motion','model','input','resources','viewport']);
 for(const key of ['component','motion','model','input','resources','viewport']){
  const changed=p.assoc(more.versions,p.get(more.versions).assoc(more[key],7));
  assert.equal(program.reusable_$q_(prepared,changed),false);
 }
 program.install_program_$x_(h,prepared);
 const emptySlots=set(p,'slots',new core.CalcitSliceList([]));
 const reset=program.prepare_program(emptySlots).extra[0],before=m.writes.length;
 program.install_program_$x_(h,reset);
 assert.ok(m.writes[before].values.every(v=>v===0));
 dispose_renderer_$x_(h);
});

test('精度预算拒绝大时间短区间和跳变；拒绝帧没有上传副作用',()=>{
 const full=t=>program.prepare_program(set(base(),'slots',new core.CalcitSliceList([withMotion(en(motion.ScalarMotion,'tween',t))])));
 assert.deepEqual(js(full(set(set(tween(),'start',1e12),'duration',.01))),['fallback','scalar-precision-budget']);
 assert.deepEqual(js(full(set(tween(),'duration',0))),['fallback','scalar-precision-budget']);
 const p=program.prepare_program(base()).extra[0],m=mock(),h=program.create_renderer_$x_(m.canvas,m.device,'bgra8unorm',128);
 assert.equal(program.time_supported_$q_(p,.37),true);
 program.install_program_$x_(h,p);
 const count=m.writes.length;
 assert.throws(()=>program.draw_at_$x_(h,p,1e12),/gpu-scalar-time-domain/);
 assert.equal(m.writes.length,count);
 dispose_renderer_$x_(h);
});

// 独立 f32 运算模型，不读取 WGSL 字符串，不调用被测 Calcit sampler。
function reference(p,t,f32){
 const f=f32?Math.fround:x=>x;
 const from=f(p.from),to=f(p.to),start=f(p.start),duration=f(p.duration),time=f(t);
 if(time<start)return from;
 if(duration===0||time>=f(start+duration))return to;
 let ratio=Math.max(0,Math.min(1,f(f(time-start)/duration)));
 if(p.easing===1)ratio=f(f(ratio*ratio)*f(3-f(2*ratio)));
 return f(f(from*f(1-ratio))+f(to*ratio));
}

test('固定 seed 的独立 f32 模型：被预算接受的非整数样本满足既定误差',context=>{
 let seed=9481,accepted=0,rejected=0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 const precisionTags=core.init_tags(['precision-base','precision-slope']);
 const original=program.prepare_program(base()).extra[0];
 for(let i=0;i<400;i++){
  const startTime=(random()-.5)*2000,duration=10**(random()*5-2);
  let t=tween();
  for(const [key,value]of Object.entries({start:startTime,duration,from:(random()-.2)*400,to:(random()-.2)*400}))t=set(t,key,value);
  t=set(t,'easing',en(motion.Easing,i%2?'smoothstep':'linear'));
  const parameter=prepare(t).extra[0],p=js(parameter),cost=js(program.parameter_precision(parameter));
  const guarded=original.assoc(precisionTags['precision-base'],cost.x).assoc(precisionTags['precision-slope'],cost.y);
  for(let j=0;j<20;j++){
   const time=startTime+duration*(random()*1.4-.2);
   if(!program.time_supported_$q_(guarded,time)){rejected++;continue;}
   const expected=reference(p,time,false),actual=reference(p,time,true);
   assert.ok(Math.abs(actual-expected)<=1e-5+1e-5*Math.abs(expected),JSON.stringify({p,time,actual,expected,cost}));
   accepted++;
  }
 }
 assert.ok(accepted>500,`accepted=${accepted}`);assert.ok(rejected>500,`rejected=${rejected}`);
 context.diagnostic(`seed=9481，接受 ${accepted}，明确回退 ${rejected}；这不是实际 GPU 读回测试`);
});
