import { to_js_data as toJsData, init_tags as initTags } from "../target/js/retained-component/calcit.core.mjs";
import { start, update_plan as updatePlan, draw_plan_$x_ as drawPlan, draw_reference_$x_ as drawReference, plan_scene as planScene } from "../target/js/retained-component/quamolit.test.retained-component-fixture.mjs";
import * as gpuComponent from "../target/js/retained-component/quamolit.gpu-component.mjs";
import { probe_$x_ as probeDevice } from "../target/js/retained-component/quamolit.webgpu-capabilities.mjs";

const tags = initTags(["declarations", "plan-builds", "binding-samples", "node-writes", "skipped-updates"]);
const state = { time: Number(new URLSearchParams(location.search).get("time") ?? 0.5), model: 40, ready: false, viewport: 100 };
const canvases = ["reference", "retained"].map((id) => document.getElementById(id));
const contexts = canvases.map((canvas) => canvas.getContext("2d", { willReadFrequently: true }));
const status = document.getElementById("status");
let plan;
let referenceDeclarations = 0;
let gpuHost, gpuDevice, gpuFrame=gpuComponent.empty_frame(), gpuGeneration=0;
let gpuCanvas=document.getElementById('gpu-component'), gpuReason='未启用 GPU';
const gpuStatus=document.getElementById('gpu-status');
let gpuAdapter='';
let gpuPaintRevision=0;
function newGpuCanvas() {
  const next=gpuCanvas.cloneNode(false);gpuCanvas.replaceWith(next);gpuCanvas=next;
}
function stopGpu(reason) {
  gpuGeneration++;
  if(gpuHost)gpuComponent.dispose_renderer_$x_(gpuHost);
  gpuHost=undefined;gpuDevice?.destroy();gpuDevice=undefined;
  gpuFrame=gpuComponent.empty_frame();gpuReason=reason;newGpuCanvas();
}
function paintGpu() {
  gpuPaintRevision++;
  const pixels=document.getElementById('gpu-pixels');pixels.dataset.result='pending';pixels.textContent='当前帧像素待验证';
  const prepared=gpuComponent.prepare_plan(plan);
  if(prepared.tag.value==='fallback' && gpuHost)stopGpu(prepared.extra[0]);
  if(gpuHost) {
    const next=prepared.extra[0];
    const delta=toJsData(gpuComponent.submit_frame_$x_(gpuHost,gpuFrame,next));gpuFrame=next;
    gpuStatus.dataset.backend='webgpu';
    gpuStatus.textContent=`WebGPU · ${gpuAdapter} · ${delta.instances} instances · 本帧记录上传 ${delta['uploaded-bytes']} B + 16 B viewport · 累计记录 ${gpuHost.uploadedBytes} B · draw ${gpuHost.draws} · pipeline 1 / buffers 2`;
  } else {
    const context=gpuCanvas.getContext('2d');context.fillStyle='white';context.fillRect(0,0,320,180);drawPlan(context,plan);
    gpuStatus.dataset.backend='canvas';gpuStatus.textContent=`Canvas 整层回退 · ${prepared.tag.value==='fallback'?prepared.extra[0]:gpuReason}`;
  }
}
async function enableGpu() {
  stopGpu('正在获取设备');paintGpu();const generation=gpuGeneration;
  const result=await probeDevice(navigator);
  if(result.tag.value!=='ready'){if(generation===gpuGeneration){gpuReason=JSON.stringify(toJsData(result));paintGpu();}return;}
  const ready=result.extra[0],device=ready.device;
  if(generation!==gpuGeneration){device.destroy();return;}
  if(ready.adapter.info?.isFallbackAdapter){device.destroy();gpuReason='软件 adapter，不计硬件验收';paintGpu();return;}
  let candidate;
  try {
    newGpuCanvas();device.pushErrorScope('validation');
    try {candidate=gpuComponent.create_renderer_$x_(gpuCanvas,device,ready.format,1024);}
    finally {const error=await device.popErrorScope();if(error)throw Error(error.message);}
    if(generation!==gpuGeneration){gpuComponent.dispose_renderer_$x_(candidate);device.destroy();return;}
    gpuHost=candidate;gpuDevice=device;gpuFrame=gpuComponent.empty_frame();
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
document.getElementById('gpu-disable').onclick=()=>{stopGpu('手动禁用');paintGpu();};
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
