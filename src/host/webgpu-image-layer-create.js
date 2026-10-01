(canvas, device, format, capacity) => {
  if (!Number.isSafeInteger(capacity) || capacity < 1) throw new RangeError("invalid image capacity");
  if (format !== "rgba8unorm" && format !== "bgra8unorm") throw new RangeError("unsupported image target format");
  const context = canvas.getContext("webgpu");
  if (!context) throw new Error("WebGPU canvas unavailable");
  const stride = Math.max(256, device.limits.minUniformBufferOffsetAlignment);
  let buffer;
  try {
    const shader = device.createShaderModule({
      code: `
struct Params { viewport: vec4f, row0: vec4f, row1: vec4f, dest: vec4f, crop: vec4f, clip: vec4f }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var source: texture_2d<f32>;
@group(0) @binding(2) var filtering: sampler;
struct Vertex { @builtin(position) position: vec4f, @location(0) uv: vec2f }
@vertex fn vertex(@builtin(vertex_index) index: u32) -> Vertex {
  let corners = array<vec2f, 6>(vec2f(0,0), vec2f(1,0), vec2f(0,1), vec2f(0,1), vec2f(1,0), vec2f(1,1));
  let corner = corners[index];
  let local = params.dest.xy + corner * params.dest.zw;
  let point = vec3f(local, 1);
  let pixel = vec2f(dot(params.row0.xyz, point), dot(params.row1.xyz, point));
  var output: Vertex;
  output.position = vec4f(pixel.x / params.viewport.x * 2 - 1, 1 - pixel.y / params.viewport.y * 2, 0, 1);
  output.uv = params.crop.xy + corner * params.crop.zw;
  return output;
}
@fragment fn fragment(input: Vertex) -> @location(0) vec4f {
  if (input.position.x < params.clip.x || input.position.y < params.clip.y ||
      input.position.x >= params.clip.z || input.position.y >= params.clip.w) { discard; }
  let color = textureSample(source, filtering, input.uv);
  return vec4f(color.rgb * color.a, color.a);
}`,
    });
    const pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module: shader, entryPoint: "vertex" },
      fragment: {
        module: shader,
        entryPoint: "fragment",
        targets: [
          {
            format,
            blend: {
              color: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
              alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
            },
          },
        ],
      },
      primitive: { topology: "triangle-list" },
    });
    buffer = device.createBuffer({ size: capacity * stride, usage: 0x40 | 0x08 });
    const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });
    context.configure({ device, format, alphaMode: "premultiplied", usage: 0x10 | 0x01 });
    const slots = [];
    let encoder,
      pass,
      count = 0,
      disposed = false,
      frames = 0,
      uploaded = 0,
      bindGroups = 0;
    const live = () => {
      if (disposed) throw new Error("image layer disposed");
    };
    return Object.freeze({
      capacity,
      begin(width, height, r, g, b, a) {
        live();
        if (pass) throw new Error("image frame already active");
        if (![width, height].every((v) => Number.isFinite(v) && v > 0)) throw new RangeError("invalid viewport");
        encoder = device.createCommandEncoder();
        pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: context.getCurrentTexture().createView(),
              loadOp: "clear",
              storeOp: "store",
              clearValue: { r: r * a, g: g * a, b: b * a, a },
            },
          ],
        });
        count = 0;
        uploaded = 0;
        pass.setPipeline(pipeline);
      },
      image(texture, parameters) {
        live();
        if (!pass || count >= capacity) throw new RangeError("image frame capacity exceeded");
        if (!Array.isArray(parameters) || parameters.length !== 24 || !parameters.every(Number.isFinite)) {
          throw new TypeError("24 finite image parameters required");
        }
        let slot = slots[count];
        if (!slot || slot.texture !== texture) {
          slot = {
            texture,
            params: null,
            binding: device.createBindGroup({
              layout: pipeline.getBindGroupLayout(0),
              entries: [
                { binding: 0, resource: { buffer, offset: count * stride, size: 96 } },
                { binding: 1, resource: texture.createView() },
                { binding: 2, resource: sampler },
              ],
            }),
          };
          slots[count] = slot;
          bindGroups++;
        }
        const values = new Float32Array(parameters);
        if (!slot.params || values.some((v, index) => v !== slot.params[index])) {
          device.queue.writeBuffer(buffer, count * stride, values);
          slot.params = values;
          uploaded += 96;
        }
        pass.setBindGroup(0, slot.binding);
        pass.draw(6);
        count++;
      },
      submit() {
        live();
        if (!pass) throw new Error("image frame missing");
        pass.end();
        pass = null;
        device.queue.submit([encoder.finish()]);
        encoder = null;
        slots.length = count;
        frames++;
        return {
          frames,
          drawCalls: count,
          uniformBytesUploaded: uploaded,
          pipelinesCreated: 1,
          buffersCreated: 1,
          bindGroupsCreated: bindGroups,
        };
      },
      dispose() {
        if (disposed) return false;
        disposed = true;
        if (pass) pass.end();
        pass = encoder = null;
        slots.length = 0;
        buffer.destroy();
        context.unconfigure();
        return true;
      },
    });
  } catch (error) {
    buffer?.destroy();
    context.unconfigure();
    throw error;
  }
};
