// Calcit :ffi :js :file 单函数表达式。只持有设备资源和提交 ABI，不解释 Scene/Motion。
(canvas, device, format, capacity) => {
  if (!Number.isSafeInteger(capacity) || capacity <= 0 || capacity * 64 > device.limits.maxBufferSize) throw Error('invalid-gpu-component-capacity');
  if (!['rgba8unorm', 'bgra8unorm'].includes(format)) throw Error('invalid-gpu-component-format');
  const context = canvas.getContext('webgpu');
  if (!context) throw Error('gpu-component-context-unavailable');
  let vertices, params;
  try {
    const shader = device.createShaderModule({label:'Quamolit component rectangles',code:`
struct View { size: vec2f, padding: vec2f }
@group(0) @binding(0) var<uniform> view: View;
struct VertexOut { @builtin(position) position: vec4f, @location(0) color: vec4f }
@vertex fn vertex(@builtin(vertex_index) i: u32,
  @location(0) rect: vec4f, @location(1) color: vec4f,
  @location(2) matrix: vec4f, @location(3) offset: vec4f) -> VertexOut {
  let corners = array<vec2f,6>(vec2f(0,0),vec2f(1,0),vec2f(0,1),vec2f(0,1),vec2f(1,0),vec2f(1,1));
  let p = rect.xy + rect.zw * corners[i];
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
    const bindGroup=device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:params}}]});
    context.configure({device,format,alphaMode:'premultiplied'});
    return {canvas,device,context,capacity,vertices,params,pipeline,bindGroup,disposed:false,
      recordScratch:new Float32Array(16),viewScratch:new Float32Array(4),
      uploadedBytes:0,draws:0,submits:0};
  } catch(error) { vertices?.destroy();params?.destroy();throw error; }
}
