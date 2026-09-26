import {test,expect} from '@playwright/test';

test('公共计划的整层 Canvas 回退与原参考一致',async({page},info)=>{
 await page.goto('/test/retained-component.html');
 await expect(page.locator('#gpu-status')).toHaveAttribute('data-backend','canvas');
 for(const label of ['1s','0s','0.5s','0.25s','1s']){
  await page.getByRole('button',{name:label,exact:true}).click();
  await page.getByRole('button',{name:'验证当前像素',exact:true}).click();
  await expect(page.locator('#gpu-pixels')).toHaveAttribute('data-result','pass');
 }
 await page.screenshot({path:info.outputPath('canvas-fallback.png'),fullPage:true});
});

test('非软件 GPU 同源像素、热上传、禁用与重建',async({page},info)=>{
 await page.goto('/test/retained-component.html');
 await page.getByRole('button',{name:'启用 / 重建 GPU',exact:true}).click();
 await expect(page.locator('#gpu-status')).not.toContainText('正在获取设备');
 const description=await page.locator('#gpu-status').textContent();
 // 缺硬件/软件 adapter 允许明确 skip；renderer 或 shader 错误必须失败。
 if(!description.startsWith('WebGPU')){
  expect(description).toMatch(/软件 adapter|unavailable|failed/);
  test.skip(true,description);
 }
 for(const label of ['1s','0s','0.5s','0.25s','1s']){
  await page.getByRole('button',{name:label,exact:true}).click();
  await expect(page.locator('#gpu-status')).toContainText('本帧记录上传 64 B');
  await page.getByRole('button',{name:'验证当前像素',exact:true}).click();
  await expect(page.locator('#gpu-pixels')).toHaveAttribute('data-result','pass');
 }
 await page.getByRole('button',{name:'禁用 GPU',exact:true}).click();
 await expect(page.locator('#gpu-status')).toContainText('手动禁用');
 await page.getByRole('button',{name:'验证当前像素',exact:true}).click();
 await expect(page.locator('#gpu-pixels')).toHaveAttribute('data-result','pass');
 await page.getByRole('button',{name:'启用 / 重建 GPU',exact:true}).click();
 await expect(page.locator('#gpu-status')).toContainText('本帧记录上传 4160 B');
 await page.screenshot({path:info.outputPath('gpu-component.png'),fullPage:true});
 await info.attach('GPU 对照',{path:info.outputPath('gpu-component.png'),contentType:'image/png'});
});

test('GPU 初始化等待期间，Canvas 回退仍可接受输入',async({page})=>{
 await page.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
   if(kind!=='webgpu')return original.call(this,kind,...args);
   return {configure(){},unconfigure(){},getCurrentTexture(){return {createView(){return {};}};}};
  };
  const device={limits:{maxBufferSize:1e7},lost:new Promise(()=>{}),destroy(){},pushErrorScope(){},
   popErrorScope(){return new Promise(resolve=>{window.releaseGpuValidation=()=>resolve(null);});},
   createShaderModule(){return {};},createRenderPipeline(){return {getBindGroupLayout(){return {};}};},
   createBuffer(){return {destroy(){}};},createBindGroup(){return {};},
   createCommandEncoder(){return {beginRenderPass(){return {setPipeline(){},setBindGroup(){},setVertexBuffer(){},draw(){},end(){}};},finish(){return {};}};},
   queue:{writeBuffer(){},submit(){}}};
  Object.defineProperty(navigator,'gpu',{value:{getPreferredCanvasFormat(){return 'bgra8unorm';},async requestAdapter(){return {info:{vendor:'test-mock',architecture:'mock',isFallbackAdapter:false},async requestDevice(){return device;}};}}});
 });
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/test/retained-component.html');
 await page.getByRole('button',{name:'启用 / 重建 GPU',exact:true}).click();
 await page.waitForFunction(()=>typeof window.releaseGpuValidation==='function');
 await page.getByRole('button',{name:'Model +1',exact:true}).click();
 await expect(page.locator('#status')).toContainText('y=63');
 await expect(page.locator('#gpu-status')).toHaveAttribute('data-backend','canvas');
 await page.evaluate(()=>window.releaseGpuValidation());
 await expect(page.locator('#gpu-status')).toHaveAttribute('data-backend','webgpu');
 expect(errors).toEqual([]);
});
