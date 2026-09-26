import { to_js_data as toJsData, init_tags as initTags } from "../target/js/retained-component/calcit.core.mjs";
import { start, update_plan as updatePlan, draw_plan_$x_ as drawPlan, draw_reference_$x_ as drawReference, plan_scene as planScene } from "../target/js/retained-component/quamolit.test.retained-component-fixture.mjs";
import * as gpuComponent from "../target/js/retained-component/quamolit.gpu-component.mjs";
import * as gpuScalar from "../target/js/retained-component/quamolit.gpu-scalar-program.mjs";
import {readScalarSample} from './host/gpu-scalar-readback.mjs';
import { probe_$x_ as probeDevice } from "../target/js/retained-component/quamolit.webgpu-capabilities.mjs";

const tags = initTags(["declarations", "plan-builds", "binding-samples", "node-writes", "skipped-updates", "prepared", "delta", "full-builds", "candidates", "instances", "uploaded-bytes"]);
const state = { time: Number(new URLSearchParams(location.search).get("time") ?? 0.5), model: 40, ready: false, viewport: 100 };
const canvases = ["reference", "retained"].map((id) => document.getElementById(id));
const contexts = canvases.map((canvas) => canvas.getContext("2d", { willReadFrequently: true }));
const status = document.getElementById("status");
let plan;
let referenceDeclarations = 0;
let gpuHost, gpuDevice, gpuBatch, gpuGeneration=0;
let gpuCanvas=document.getElementById('gpu-component'), gpuReason='未启用 GPU';
const gpuStatus=document.getElementById('gpu-status');
let gpuAdapter='';
let gpuPaintRevision=0;
let scalarMode=false, scalarProgram;
function newGpuCanvas() {
  const next=gpuCanvas.cloneNode(false);gpuCanvas.replaceWith(next);gpuCanvas=next;
}
function stopGpu(reason) {
  gpuGeneration++;
  if(gpuHost)gpuComponent.dispose_renderer_$x_(gpuHost);
  gpuHost=undefined;gpuDevice?.destroy();gpuDevice=undefined;
  scalarProgram=undefined;
  gpuBatch=undefined;gpuReason=reason;newGpuCanvas();
}
function paintGpu() {
  gpuPaintRevision++;
  const pixels=document.getElementById('gpu-pixels');pixels.dataset.result='pending';pixels.textContent='当前帧像素待验证';
  if(gpuHost && scalarMode){
    const before=gpuHost.uploadedBytes,parametersBefore=gpuHost.parameterBytes;
    if(!scalarProgram || !gpuScalar.reusable_$q_(scalarProgram,plan)){
      const candidate=gpuScalar.prepare_program(plan);
      if(candidate.tag.value==='fallback'){stopGpu(candidate.extra[0]);paintGpu();return;}
      scalarProgram=candidate.extra[0];gpuScalar.install_program_$x_(gpuHost,scalarProgram);
    }else {
      if(!gpuScalar.time_supported_$q_(scalarProgram,state.time)){stopGpu('scalar-time-precision');paintGpu();return;}
      gpuScalar.draw_at_$x_(gpuHost,scalarProgram,state.time);
    }
    gpuStatus.dataset.backend='webgpu';gpuStatus.dataset.motion='gpu';
    gpuStatus.textContent=`WebGPU 标量采样 · ${gpuAdapter} · 本帧记录上传 ${gpuHost.uploadedBytes-before} B · 参数上传 ${gpuHost.parameterBytes-parametersBefore} B + 16 B time/viewport · pipeline 1 / buffers 3`;
    return;
  }
  gpuStatus.dataset.motion='cpu';
  gpuBatch=gpuBatch?gpuComponent.update_batch(gpuBatch,plan):gpuComponent.build_batch(plan);
  const prepared=gpuBatch.get(tags.prepared);
  if(prepared.tag.value==='fallback' && gpuHost)stopGpu(prepared.extra[0]);
  if(gpuHost) {
    gpuComponent.submit_batch_$x_(gpuHost,gpuBatch);
    const delta=gpuBatch.get(tags.delta);
    gpuStatus.dataset.backend='webgpu';
    gpuStatus.textContent=`WebGPU · ${gpuAdapter} · ${delta.get(tags.instances)} instances · 本帧记录上传 ${delta.get(tags['uploaded-bytes'])} B + 16 B viewport · 累计记录 ${gpuHost.uploadedBytes} B · draw ${gpuHost.draws} · pipeline 1 / buffers 2 · 批次构建 ${gpuBatch.get(tags['full-builds'])} · 候选记录 ${gpuBatch.get(tags.candidates)}`;
  } else {
    const context=gpuCanvas.getContext('2d');context.fillStyle='white';context.fillRect(0,0,320,180);drawPlan(context,plan);
    gpuStatus.dataset.backend='canvas';gpuStatus.textContent=`Canvas 整层回退 · ${prepared.tag.value==='fallback'?prepared.extra[0]:gpuReason}`;
  }
}
async function enableGpu(motion=false) {
  scalarMode=motion;
  stopGpu('正在获取设备');paintGpu();const generation=gpuGeneration;
  const result=await probeDevice(navigator);
  if(result.tag.value!=='ready'){if(generation===gpuGeneration){gpuReason=JSON.stringify(toJsData(result));paintGpu();}return;}
  const ready=result.extra[0],device=ready.device;
  if(generation!==gpuGeneration){device.destroy();return;}
  if(ready.adapter.info?.isFallbackAdapter){device.destroy();gpuReason='软件 adapter，不计硬件验收';paintGpu();return;}
  let candidate;
  try {
    const candidateCanvas=gpuCanvas.cloneNode(false);device.pushErrorScope('validation');
    try {candidate=(motion?gpuScalar:gpuComponent).create_renderer_$x_(candidateCanvas,device,ready.format,1024);}
    finally {const error=await device.popErrorScope();if(error)throw Error(error.message);}
    if(generation!==gpuGeneration){gpuComponent.dispose_renderer_$x_(candidate);device.destroy();return;}
    gpuCanvas.replaceWith(candidateCanvas);gpuCanvas=candidateCanvas;
    gpuHost=candidate;gpuDevice=device;gpuBatch=undefined;
    const info=ready.adapter.info;
    gpuAdapter=`${info?.vendor||'unknown'}/${info?.architecture||'unknown'} · software=${String(info?.isFallbackAdapter)}`;
    gpuStatus.dataset.adapter=gpuAdapter;
    device.lost.then(()=>{if(gpuDevice===device){stopGpu('设备丢失，请重建');paintGpu();}});
    paintGpu();
  } catch(error) {
    if(candidate)gpuComponent.dispose_renderer_$x_(candidate);device.destroy();
    if(generation===gpuGeneration){gpuHost=undefined;gpuDevice=undefined;gpuReason=error.message;newGpuCanvas();paintGpu();}
  }
}
document.getElementById('gpu-enable').onclick=()=>enableGpu().catch(error=>{stopGpu(error.message);paintGpu();});
document.getElementById('gpu-motion').onclick=()=>enableGpu(true).catch(error=>{stopGpu(error.message);paintGpu();});
document.getElementById('gpu-disable').onclick=()=>{stopGpu('手动禁用');paintGpu();};
document.getElementById('gpu-numeric').onclick=async()=>{
  const output=document.getElementById('gpu-numeric-status'),host=gpuHost,generation=gpuGeneration;
  output.dataset.result='pending';output.textContent='正在验证 GPU 非整数数值';
  try{
    if(!host||!scalarMode||!scalarProgram)throw Error('请先启用 GPU 动画采样');
    const samples=[];
    for(const time of [.37,.81,.4999999,-.1,1.1]){
      if(!gpuScalar.time_supported_$q_(scalarProgram,time))throw Error('scalar-time-precision');
      const [actual]=await readScalarSample(host,64,time),expected=80+40*Math.max(0,Math.min(1,time));
      if(Math.abs(actual-expected)>1e-5+1e-5*Math.abs(expected))throw Error(`t=${time}: ${actual} != ${expected}`);
      samples.push({time,actual,expected});
    }
    if(generation!==gpuGeneration||host!==gpuHost)return;
    output.dataset.result='pass';output.textContent=`PASS · 实际 GPU 读回 ${JSON.stringify(samples)} · 总读回 40 B`;
  }catch(error){if(generation!==gpuGeneration||host!==gpuHost)return;output.dataset.result='fail';output.textContent=error.message;}
};
document.getElementById('gpu-verify').onclick=async()=>{
  const output=document.getElementById('gpu-pixels');
  const expected=contexts[1].getImageData(0,0,320,180).data;
  try {
    // WebGPU 呈现后当前 texture 可被回收；同一任务内提交诊断帧再捕获。
    paintGpu();
    const revision=gpuPaintRevision;
    const bitmap=await createImageBitmap(gpuCanvas),reference=document.createElement('canvas');reference.width=320;reference.height=180;
    if(revision!==gpuPaintRevision){bitmap.close();return;}
    const context=reference.getContext('2d');context.drawImage(bitmap,0,0);bitmap.close();
    const actual=context.getImageData(0,0,320,180).data;
    let differences=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])differences++;
    output.dataset.result=differences===0?'pass':'fail';output.textContent=`${differences===0?'PASS':'FAIL'} · 230400 通道 · 差异 ${differences}（不放宽阈值；亚像素/仿射边缘不承诺相同）`;
  }catch(error){output.dataset.result='fail';output.textContent=error.message;}
};
window.addEventListener('pagehide',()=>stopGpu('页面卸载'));

function paint() {
  for (const context of contexts) { context.fillStyle = "white"; context.fillRect(0, 0, 320, 180); }
  drawReference(contexts[0], state.time, state.model, state.ready, state.viewport);
  referenceDeclarations++;
  drawPlan(contexts[1], plan);
  const expected = contexts[0].getImageData(0, 0, 320, 180).data;
  const actual = contexts[1].getImageData(0, 0, 320, 180).data;
  if (!expected.every((value, i) => value === actual[i])) throw new Error("保留画面与全量参考不一致");
  const rect = toJsData(planScene(plan)).nodes.at(-1).content[1];
  const counts = Object.fromEntries(Object.entries(tags).map(([name, tag]) => [name, plan.get(tag)]));
  document.getElementById("time").value = state.time;
  document.getElementById("time-label").value = `${state.time.toFixed(2)} s`;
  document.getElementById("counts").textContent = `参考声明 ${referenceDeclarations} 次 · 保留声明 ${counts.declarations} 次 · 计划构建 ${counts["plan-builds"]} 次 · 绑定采样 ${counts["binding-samples"]} 次`;
  status.dataset.result = "pass";
  status.textContent = `PASS · 两侧全部像素一致 · t=${state.time}s · x=${rect.x} · y=${rect.y} · width=${rect.width} · ready=${state.ready}`;
  paintGpu();
  return { counts, rect, referenceDeclarations };
}
function safely(action) {
  try { return action(); } catch (error) {
    status.dataset.result = "fail";
    status.textContent = `FAIL · ${error.message}`;
    throw error;
  }
}
function render() {
  return safely(() => { plan = updatePlan(plan, state.time, state.model, state.ready, state.viewport); return paint(); });
}
function reset() {
  Object.assign(state, { time: 0.5, model: 40, ready: false, viewport: 100 });
  referenceDeclarations = 0;
  plan = start(state.time, state.model, state.ready, state.viewport);
  return paint();
}
for (const time of [1, 0, 0.5, 0.25]) {
  const button = document.createElement("button"); button.textContent = `${time}s`;
  button.onclick = () => { state.time = time; render(); }; document.getElementById("times").append(button);
}
document.getElementById("time").oninput = (event) => { state.time = Number(event.target.value); render(); };
document.getElementById("model").onclick = () => { state.model++; render(); };
document.getElementById("resource").onclick = () => { state.ready = !state.ready; render(); };
document.getElementById("viewport").onclick = () => { state.viewport = state.viewport === 100 ? 110 : 100; render(); };
document.getElementById("reset").onclick = () => safely(reset);
document.getElementById("run").onclick = () => safely(() => {
  reset();
  for (let i = 1; i <= 1000; i++) { state.time = i / 1000; render(); }
});
safely(() => { plan = start(state.time, state.model, state.ready, state.viewport); paint(); });
window.quamolitRetainedComponent = { state, render };
