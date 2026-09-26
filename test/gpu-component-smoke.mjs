import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as gpu from '../target/js/gpu-component/quamolit.gpu-component.mjs';
import * as fixture from '../target/js/gpu-component/quamolit.test.retained-component-fixture.mjs';
import {sample_plan_at as sample} from '../target/js/gpu-component/quamolit.retained-component.mjs';
import {init_tags,to_js_data as js,_$n_enum_$o_nth as nth,CalcitSliceList} from '../target/js/gpu-component/calcit.core.mjs';
const tags=init_tags(['scene','nodes','content','x','y','width','height','fill','a','b','c','d','e','f','transforms','records','id','rect','matrix','writes','instances','uploaded-bytes']);
const get=(o,k)=>o.get(tags[k]);
const set=(o,k,v)=>o.assoc(tags[k],v);
const list=xs=>new CalcitSliceList(xs);
const base=()=>fixture.start(0,40,false,100);
const frame=p=>{const result=gpu.prepare_plan(p);assert.equal(js(result)[0],'rects');return nth(result,1);};
const nodes=p=>get(get(p,'scene'),'nodes');
const withNodes=(p,xs)=>set(p,'scene',set(get(p,'scene'),'nodes',list(xs)));

test('公共 ComponentPlan 直接转换，顺序与全部字段保留',()=>{
 const p=base(),f=frame(p),source=js(nodes(p)),records=js(get(f,'records'));
 assert.equal(records.length,65);
 records.forEach((r,i)=>{
  assert.equal(r.id,source[i].id);assert.deepEqual(r.rect,source[i].content[1]);
  assert.deepEqual(r.matrix,{a:1,b:0,c:0,d:1,e:0,f:0});
  const packed=js(gpu.record_values(get(f,'records').get(i)));
  const {rect,matrix:m}=r,c=rect.fill;
  const byte=v=>Math.round(v*255)/255;
  assert.deepEqual(packed,[rect.x,rect.y,rect.width,rect.height,byte(c.r),byte(c.g),byte(c.b),c.a,m.a,m.b,m.c,m.d,m.e,m.f,0,0]);
 });
 assert.deepEqual(js(gpu.update_frame(gpu.empty_frame(),f)).writes.map(w=>w.index),Array.from({length:65},(_,i)=>i));
});

test('1000 时间帧只有一个动态记录变化，乱序与全量参考一致',()=>{
 let p=base(),old=gpu.empty_frame();
 for(let i=0;i<1000;i++){
  const t=(i%101)/100;p=sample(p,t);const next=frame(p),delta=js(gpu.update_frame(old,next));
  assert.deepEqual(js(next),js(frame(fixture.start(t,40,false,100))));
  assert.equal(delta['uploaded-bytes'],i===0?4160:64);
  if(i>0)assert.deepEqual(delta.writes.map(w=>w.index),[64]);
  old=next;
 }
 assert.equal(js(gpu.update_frame(old,old))['uploaded-bytes'],0);
});

test('删除/重排按绘制索引更新，不按颜色排序或沿用陈旧槽位',()=>{
 const p=base(),a=nodes(p).get(0),b=nodes(p).get(64);
 const before=frame(withNodes(p,[a,b])),reversed=frame(withNodes(p,[b,a]));
 assert.deepEqual(js(gpu.update_frame(before,reversed)).writes.map(w=>w.index),[0,1]);
 const removed=frame(withNodes(p,[a])),delta=js(gpu.update_frame(before,removed));
 assert.equal(delta.instances,1);assert.equal(delta.writes.length,0);
 const empty=js(gpu.update_frame(before,gpu.empty_frame()));
 assert.equal(empty.instances,0);assert.equal(empty['uploaded-bytes'],0);
});

test('CPU 变换原样保留；非矩形整层回退，不返回部分 GPU 内容',()=>{
 const mixed=fixture.start_mixed(0.25,40,false,100),ns=nodes(mixed);
 assert.deepEqual(js(gpu.prepare_plan(mixed)),['fallback','unsupported-node:polyline']);
 // 保留同一已注册 CPU sampler，只取矩形及其对应采样矩阵。
 const rects=withNodes(mixed,Array.from({length:65},(_,i)=>ns.get(i)));
 const transforms=get(mixed,'transforms');
 const transformed=set(rects,'transforms',list(Array.from({length:65},(_,i)=>transforms.get(i))));
 assert.deepEqual(js(get(frame(transformed),'records')).map(r=>r.matrix),js(get(transformed,'transforms')));
 assert.throws(()=>gpu.prepare_plan(set(transformed,'transforms',list([]))),/invalid-gpu-component-transforms/);
});

test('数值域失败回退；非法 Scene 明确拒绝，输入不变',()=>{
 const p=base(),before=js(p),node=nodes(p).get(64),content=get(node,'content'),rect=nth(content,1);
 // 通过同一 Enum 构造器的 assoc 不可移植，直接修改记录测试 f32 转换域。
 const record=get(frame(p),'records').get(64);
 assert.equal(gpu.valid_record_$q_(set(record,'rect',set(rect,'x',1e39))),false);
 const huge=set(set(set(get(record,'matrix'),'a',3e38),'c',-3e38),'e',0);
 assert.equal(gpu.finite_corner_$q_(huge,2,2),false,'中间乘法溢出不能因最终相消而通过');
 assert.throws(()=>gpu.prepare_plan(withNodes(p,[node,node])),/duplicate-scene-id-or-sibling-key/);
 assert.deepEqual(js(p),before);
});

function mockDevice(){
 const calls={writes:[],draws:[],buffers:[],pipelines:0,submits:0,unconfigured:0};
 const context={configure(){},unconfigure(){calls.unconfigured++;},getCurrentTexture(){return {createView(){return {};}};}};
 const canvas={width:320,height:180,getContext(kind){assert.equal(kind,'webgpu');return context;}};
 const device={limits:{maxBufferSize:1e7},
  createShaderModule(value){assert.match(value.code,/matrix\.x\*p\.x/);return {};},
  createRenderPipeline(){calls.pipelines++;return {getBindGroupLayout(){return {};}};},
  createBuffer(spec){const buffer={...spec,destroyed:0,destroy(){this.destroyed++;}};calls.buffers.push(buffer);return buffer;},
  createBindGroup(){return {};},
  createCommandEncoder(){return {beginRenderPass(){return {setPipeline(){},setBindGroup(){},setVertexBuffer(){},draw(...args){calls.draws.push(args);},end(){}};},finish(){return {};}};},
  queue:{writeBuffer(buffer,offset,data){calls.writes.push({buffer,offset,data:Array.from(data)});},submit(){calls.submits++;}},
 };
 return {device,canvas,calls};
}

test('编译后的 file/inline 真实调用：冷上传、稀疏热上传、稳定资源和幂等释放',()=>{
 const {device,canvas,calls}=mockDevice();
 const host=gpu.create_renderer_$x_(canvas,device,'bgra8unorm',128),initial=frame(base());
 gpu.submit_frame_$x_(host,gpu.empty_frame(),initial);
 assert.equal(calls.writes.length,66);assert.deepEqual(calls.draws,[[6,65]]);
 assert.equal(host.uploadedBytes,4160);
 const changed=frame(sample(base(),0.5));
 gpu.submit_frame_$x_(host,initial,changed);
 assert.equal(host.uploadedBytes,4224);assert.equal(calls.writes.at(-2).offset,64*64);
 assert.equal(calls.writes.at(-2).data.length,16);assert.deepEqual(calls.writes.at(-1).data,[320,180,0,0]);
 for(let i=0;i<100;i++)gpu.submit_frame_$x_(host,changed,changed);
 assert.equal(host.uploadedBytes,4224);assert.equal(calls.pipelines,1);assert.equal(calls.buffers.length,2);
 gpu.submit_frame_$x_(host,changed,gpu.empty_frame());
 assert.equal(calls.draws.length,102);assert.equal(calls.submits,103);
 gpu.dispose_renderer_$x_(host);gpu.dispose_renderer_$x_(host);
 assert.equal(calls.unconfigured,1);assert.deepEqual(calls.buffers.map(b=>b.destroyed),[1,1]);
 assert.throws(()=>gpu.submit_frame_$x_(host,gpu.empty_frame(),initial),/disposed/);
});

test('构造失败销毁已分配 GPU 对象',()=>{
 const {device,canvas,calls}=mockDevice();
 device.createBindGroup=()=>{throw Error('mock-bindgroup-failure');};
 assert.throws(()=>gpu.create_renderer_$x_(canvas,device,'bgra8unorm',128),/mock-bindgroup-failure/);
 assert.deepEqual(calls.buffers.map(b=>b.destroyed),[1,1]);
});

test('容量不足与非法记录在任何上传之前失败',()=>{
 const {device,canvas,calls}=mockDevice(),host=gpu.create_renderer_$x_(canvas,device,'bgra8unorm',1);
 assert.throws(()=>gpu.submit_frame_$x_(host,gpu.empty_frame(),frame(base())),/capacity/);
 assert.equal(calls.writes.length,0);assert.equal(calls.submits,0);
 const record=get(frame(base()),'records').get(0);
 assert.equal(gpu.valid_record_$q_(set(record,'rect',set(get(record,'rect'),'width',-1))),false);
 gpu.dispose_renderer_$x_(host);
});
