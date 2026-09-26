// 测试专用有界读回。复用实际 renderer 的 WGSL 与已安装参数，不进入正常帧路径。
export async function readScalarSample(host,index,time){
 if(host.disposed||!host.scalarReady||!Number.isSafeInteger(index)||index<0||index>=host.scalarCount||!Number.isFinite(time))throw Error('invalid-scalar-probe');
 const device=host.device;
 let uniform,result,staging;
 try{
  const module=device.createShaderModule({code:`${host.scalarSource}
@group(0) @binding(2) var<storage,read_write> result: array<f32>;
@compute @workgroup_size(1) fn probe(){
 result[0]=sampleMotion(motions[${index*2}u],0.0);
 result[1]=sampleMotion(motions[${index*2+1}u],0.0);
}`});
  const pipeline=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'probe'}});
  uniform=device.createBuffer({size:16,usage:0x40|0x08});
  result=device.createBuffer({size:8,usage:0x80|0x04});
  staging=device.createBuffer({size:8,usage:0x01|0x08});
  device.queue.writeBuffer(uniform,0,new Float32Array([host.canvas.width,host.canvas.height,time,0]));
  const bindGroup=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[
   {binding:0,resource:{buffer:uniform}},{binding:1,resource:{buffer:host.motions}},{binding:2,resource:{buffer:result}}
  ]});
  const encoder=device.createCommandEncoder(),pass=encoder.beginComputePass();
  pass.setPipeline(pipeline);pass.setBindGroup(0,bindGroup);pass.dispatchWorkgroups(1);pass.end();
  encoder.copyBufferToBuffer(result,0,staging,0,8);device.queue.submit([encoder.finish()]);
  await staging.mapAsync(0x01);
  return [...new Float32Array(staging.getMappedRange()).slice()];
 }finally{staging?.destroy();result?.destroy();uniform?.destroy();}
}
