import assert from 'node:assert/strict';
import test from 'node:test';
import { createFloat32RectBatch } from '../src/host/webgpu-rect-batches.mjs';

/** Deterministic host-double checks shared by Node and Chromium. */
async function testWebGpuRectBatches(a) {
  const writes = [];
  const draws = [];
  let pipelines = 0;
  let computePipelines = 0;
  let createdBuffers = 0;
  let destroyedBuffers = 0;
  let configurations = 0;
  let unconfigurations = 0;
  const device = {
    limits: { maxBufferSize: 80000 },
    queue: {
      writeBuffer(...args) { writes.push(args); },
      submit(commandBuffers) { a.equal(commandBuffers.length, 1); },
    },
    createShaderModule(descriptor) {
      a.equal(descriptor.code.includes('@vertex') || descriptor.code.includes('@compute'), true);
      a.equal(descriptor.code.includes('params.translationTiming'), true);
      a.equal(descriptor.code.includes('fn sampledTranslation()'), true);
      return {};
    },
    async createRenderPipelineAsync(descriptor) {
      pipelines++;
      a.equal(descriptor.vertex.buffers[0].stepMode, 'instance');
      a.equal(descriptor.fragment.targets[0].blend.color.srcFactor, 'one');
      return { getBindGroupLayout() { return {}; } };
    },
    async createComputePipelineAsync(descriptor) {
      computePipelines++;
      a.equal(descriptor.compute.entryPoint, 'probe');
      return { getBindGroupLayout() { return {}; } };
    },
    createBuffer(descriptor) {
      createdBuffers++;
      return {
        descriptor,
        async mapAsync() {},
        getMappedRange() { return descriptor.size === 8 ? new Float32Array([88, 90]).buffer : new Uint8Array([12, 88, 234, 255]).buffer; },
        unmap() {},
        destroy() { destroyedBuffers++; },
      };
    },
    createBindGroup(descriptor) { a.equal([1, 2].includes(descriptor.entries.length), true); return {}; },
    createCommandEncoder() {
      return {
        copyBufferToBuffer(source, sourceOffset, destination, destinationOffset, size) {
          a.equal(source.descriptor.size, 8);
          a.equal(destination.descriptor.size, 8);
          a.equal(sourceOffset, 0);
          a.equal(destinationOffset, 0);
          a.equal(size, 8);
        },
        beginComputePass() {
          return { setPipeline() {}, setBindGroup() {}, dispatchWorkgroups(count) { a.equal(count, 1); }, end() {} };
        },
        copyTextureToBuffer(source, destination, extent) {
          a.equal(source.origin.x, 1);
          a.equal(destination.bytesPerRow, 256);
          a.equal(extent.width, 1);
        },
        beginRenderPass(descriptor) {
          a.equal(descriptor.colorAttachments[0].clearValue.r, 1);
          return {
            setPipeline() {}, setBindGroup() {}, setVertexBuffer() {},
            draw(...args) { draws.push(args); }, end() {},
          };
        },
        finish() { return {}; },
      };
    },
  };
  const context = {
    configure(options) { configurations++; a.equal(options.format, 'bgra8unorm'); },
    getCurrentTexture() { return { createView() { return {}; } }; },
    unconfigure() { unconfigurations++; },
  };
  const canvas = { width: 320, height: 100, getContext(name) { a.equal(name, 'webgpu'); return context; } };
  const batch = await createFloat32RectBatch(canvas, device, 'bgra8unorm', 10000);
  a.equal(pipelines, 1);
  a.equal(createdBuffers, 2);
  a.equal(configurations, 1);
  a.equal(batch.activeCount, 0);
  let beforeDrawError;
  try { await batch.readTranslation(); } catch (error) { beforeDrawError = error; }
  a.equal(/draw required/.test(String(beforeDrawError)), true);
  const positions = new Float32Array(20000);
  positions[0] = 40;
  positions[1] = 50;
  a.equal(batch.upload(positions).positionBytesUploaded, 80000);
  a.equal(batch.activeCount, 10000);
  a.equal(writes[0][1], 0);
  a.equal(writes[0][3], 0);
  a.equal(writes[0][4], 20000);
  const fill = { r: 234 / 255, g: 88 / 255, b: 12 / 255, a: 1 };
  const cold = batch.draw({ width: 8, height: 8, fill, alpha: 0.5 });
  a.equal(cold.drawCalls, 1);
  a.equal(cold.instances, 10000);
  a.equal(cold.positionBytesUploaded, 80000);
  a.equal(cold.uniformBytesUploaded, 64);
  a.equal(draws[0].join(','), '6,10000,0,0');
  a.equal(writes[1][2][7], 0.5);
  const warm = batch.draw({ width: 8, height: 8, fill });
  a.equal(warm.positionBytesUploaded, 0);
  a.equal(warm.pipelinesCreated, 1);
  a.equal(warm.buffersCreated, 2);
  a.equal(pipelines, 1);
  a.equal(createdBuffers, 2);
  positions[2] = 80;
  a.equal(batch.upload(positions, 1, 1).positionBytesUploaded, 8);
  a.equal(writes[3][1], 8);
  a.equal(writes[3][3], 2);
  a.equal(writes[3][4], 2);
  const dirty = batch.draw({ start: 1, count: 1, width: 8, height: 8, fill });
  a.equal(dirty.positionBytesUploaded, 8);
  a.equal(draws[2].join(','), '6,1,0,1');
  a.equal((await batch.readPixel(1, 1)).join(','), '234,88,12,255');
  a.equal(createdBuffers, 3);
  a.equal(destroyedBuffers, 1);
  const translated = batch.draw({ width: 8, height: 8, fill, translation: {
    from: { x: 48, y: 80 }, to: { x: 208, y: 120 }, time: 0.25, start: 0, duration: 1, easing: 'linear',
  } });
  a.equal(translated.positionBytesUploaded, 0);
  a.equal(translated.uniformBytesUploaded, 64);
  a.equal(writes.at(-1)[2].length, 16);
  a.equal(Array.from(writes.at(-1)[2].slice(8)).join(','), '48,80,208,120,0.25,0,1,1');
  a.equal((await batch.readTranslation()).x, 88);
  a.equal((await batch.readTranslation()).y, 90);
  a.equal(computePipelines, 1);
  a.equal(createdBuffers, 7);
  a.equal(destroyedBuffers, 5);
  a.throws(() => batch.draw({ width: 8, height: 8, fill, translation: {
    from: { x: 0, y: 0 }, to: { x: 1, y: 1 }, time: 0, start: 0, duration: -1, easing: 'linear',
  } }), /duration/);
  a.throws(() => batch.draw({ width: 8, height: 8, fill, translation: {
    from: { x: 0, y: 0 }, to: { x: 1, y: 1 }, time: 0, start: 0, duration: 1, easing: 'cubic',
  } }), /easing/);
  a.throws(() => batch.upload(positions, 10000, 1), /range/);
  positions[0] = Number.NaN;
  a.throws(() => batch.upload(positions), /non-finite/);
  positions[0] = 40;
  a.throws(() => batch.draw({ width: -1, height: 8, fill }), /dimensions/);
  a.throws(() => batch.draw({ width: 8, height: 8, fill, alpha: 2 }), /alpha/);
  a.equal(batch.dispose(), true);
  a.equal(batch.dispose(), false);
  a.equal(unconfigurations, 1);
  a.equal(destroyedBuffers, 7);
  a.throws(() => batch.draw({ width: 8, height: 8, fill }), /disposed/);
  a.throws(() => batch.upload(positions), /disposed/);
  let rejected = false;
  try { await createFloat32RectBatch({ getContext: () => null }, device, 'bgra8unorm', 1); }
  catch (error) { rejected = /context unavailable/.test(String(error)); }
  a.equal(rejected, true);
}

test('Quamolit WebGPU rect host validates 10k instances, dirty upload, readback and release', async () => {
  await testWebGpuRectBatches(assert);
});
