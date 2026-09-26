// Calcit :ffi :js :file 单函数表达式。只持有设备资源和提交 ABI，不解释 Scene/Motion。
(canvas, device, format, capacity, scalar = false) => {
  if (!Number.isSafeInteger(capacity) || capacity <= 0 || capacity * 64 > device.limits.maxBufferSize) throw Error('invalid-gpu-component-capacity');
  if (!['rgba8unorm', 'bgra8unorm'].includes(format)) throw Error('invalid-gpu-component-format');
  const context = canvas.getContext('webgpu');
  if (!context) throw Error('gpu-component-context-unavailable');
  if (scalar && capacity * 64 > device.limits.maxStorageBufferBindingSize) throw Error('gpu-scalar-storage-capacity');
  let vertices, params, motions;
  try {
    // 同一段采样代码同时供 vertex 和有界测试读回使用，不另写测试版公式。
    const scalarSource = scalar ? `
struct View { size: vec2f, time: f32, padding: f32 }
@group(0) @binding(0) var<uniform> view: View;
struct Motion { interval: vec4f, flags: vec4f }
@group(0) @binding(1) var<storage, read> motions: array<Motion>;
fn sampleMotion(m: Motion, original: f32) -> f32 {
  if (m.flags.x == 0.0) { return original; }
  let fromValue = m.interval.x; let toValue = m.interval.y;
  let start = m.interval.z; let duration = m.interval.w;
  if (view.time < start) { return fromValue; }
  if (duration == 0.0 || view.time >= start + duration) { return toValue; }
  var ratio = clamp((view.time - start) / duration, 0.0, 1.0);
  if (m.flags.y == 1.0) { ratio = ratio * ratio * (3.0 - 2.0 * ratio); }
  return fromValue * (1.0 - ratio) + toValue * ratio;
}` : `struct View { size: vec2f, time: f32, padding: f32 }
@group(0) @binding(0) var<uniform> view: View;`;
    const shader = device.createShaderModule({label:'Quamolit component rectangles',code:`
${scalarSource}
struct VertexOut { @builtin(position) position: vec4f, @location(0) color: vec4f }
@vertex fn vertex(@builtin(vertex_index) i: u32, @builtin(instance_index) instance: u32,
  @location(0) rect: vec4f, @location(1) color: vec4f,
  @location(2) matrix: vec4f, @location(3) offset: vec4f) -> VertexOut {
  let corners = array<vec2f,6>(vec2f(0,0),vec2f(1,0),vec2f(0,1),vec2f(0,1),vec2f(1,0),vec2f(1,1));
  let origin = ${scalar ? 'vec2f(sampleMotion(motions[instance*2u], rect.x), sampleMotion(motions[instance*2u+1u], rect.y))' : 'rect.xy'};
  let p = origin + rect.zw * corners[i];
  let world = vec2f(matrix.x*p.x + matrix.z*p.y, matrix.y*p.x + matrix.w*p.y) + offset.xy;
  var result: VertexOut;
  result.position = vec4f(2.0*world.x/view.size.x-1.0, 1.0-2.0*world.y/view.size.y, 0, 1);
  result.color = color;
  return result;
}
@fragment fn fragment(in: VertexOut) -> @location(0) vec4f {
  return vec4f(in.color.rgb * in.color.a, in.color.a);
}`});
    const pipeline = device.createRenderPipeline({
      label:'Quamolit ordered component batch',layout:'auto',
      vertex:{module:shader,entryPoint:'vertex',buffers:[{arrayStride:64,stepMode:'instance',attributes:[0,1,2,3].map(i=>({shaderLocation:i,offset:i*16,format:'float32x4'}))}]},
      fragment:{module:shader,entryPoint:'fragment',targets:[{format,blend:{color:{srcFactor:'one',dstFactor:'one-minus-src-alpha',operation:'add'},alpha:{srcFactor:'one',dstFactor:'one-minus-src-alpha',operation:'add'}}}]},
      primitive:{topology:'triangle-list'},
    });
    vertices=device.createBuffer({size:capacity*64,usage:0x20|0x08,label:'Quamolit component records'});
    params=device.createBuffer({size:16,usage:0x40|0x08,label:'Quamolit component viewport'});
    const entries=[{binding:0,resource:{buffer:params}}];
    if(scalar){
      motions=device.createBuffer({size:capacity*64,usage:0x80|0x08,label:'Quamolit scalar parameters'});
      entries.push({binding:1,resource:{buffer:motions}});
    }
    const bindGroup=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries});
    context.configure({device,format,alphaMode:'premultiplied'});
    return {canvas,device,context,capacity,vertices,params,motions,pipeline,bindGroup,scalarSource,disposed:false,
      recordScratch:new Float32Array(16),viewScratch:new Float32Array(4),
      scalarScratch:scalar?new Float32Array(8):undefined,scalarCount:0,scalarReady:false,parameterBytes:0,
      uploadedBytes:0,draws:0,submits:0};
  } catch(error) { vertices?.destroy();params?.destroy();motions?.destroy();throw error; }
}
