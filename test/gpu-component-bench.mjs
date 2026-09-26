// CPU 批次准备阶段微基准，不包括组件采样、GPU 提交或显示帧时间。
import {performance} from 'node:perf_hooks';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import * as gpu from '../target/js/gpu-component/quamolit.gpu-component.mjs';
import {start} from '../target/js/gpu-component/quamolit.test.retained-component-fixture.mjs';
import {sample_plan_at as sample} from '../target/js/gpu-component/quamolit.retained-component.mjs';
import {init_tags} from '../target/js/gpu-component/calcit.core.mjs';
const tags=init_tags(['delta','uploaded-bytes','candidates']);
const plans=Array.from({length:501},(_,i)=>sample(start(0,40,false,100),(i%101)/100));
function measure(cached){
 let batch=gpu.build_batch(plans[0]),previous=gpu.frame_of(batch.get(init_tags(['prepared']).prepared));
 const times=[];let bytes=0;
 for(let i=1;i<=500;i++){
  const before=performance.now();
  if(cached){batch=gpu.update_batch(batch,plans[i]);bytes+=batch.get(tags.delta).get(tags['uploaded-bytes']);}
  else {const next=gpu.frame_of(gpu.prepare_plan(plans[i]));bytes+=gpu.update_frame(previous,next).get(tags['uploaded-bytes']);previous=next;}
  times.push(performance.now()-before);
 }
 const sorted=times.toSorted((a,b)=>a-b),at=q=>sorted[Math.floor((sorted.length-1)*q)];
 return {p50Ms:at(.5),p95Ms:at(.95),p99Ms:at(.99),recordBytes:bytes,candidates:cached?batch.get(tags.candidates):65*501,samples:times};
}
measure(false);measure(true);
const runs=[];for(let i=0;i<3;i++)runs.push(i%2?{cached:measure(true),full:measure(false)}:{full:measure(false),cached:measure(true)});
process.stdout.write(JSON.stringify({scope:'CPU batch preparation only; not end-to-end/GPU performance',sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirty:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),node:process.version,os:`${os.platform()} ${os.release()} ${os.arch()}`,cpu:os.cpus()[0].model,nodes:65,dynamicNodes:1,warmupPasses:1,samplesPerRun:500,runs},null,2)+'\n');
