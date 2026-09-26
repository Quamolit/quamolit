import { test, expect } from "@playwright/test";
import { originalTree } from "./binary-tree-reference.mjs";

test("原树构图：乱序时间、独立画面对照与负例", async ({ page }, info) => {
  const errors=[];
  page.on("pageerror", e=>errors.push(e.message));
  await page.goto("examples/binary-tree/index.html?t=0");
  await page.waitForFunction(()=>window.treeDemo);
  for (const time of [5,0,2.5,10,5]) {
    await page.evaluate(t=>window.treeDemo.seek(t),time);
    const compare=async (erase=false)=>page.evaluate(({reference,erase})=>{
      const canvas=document.querySelector("canvas"), ctx=canvas.getContext("2d");
      const expected=document.createElement("canvas"); expected.width=canvas.width; expected.height=canvas.height;
      const ref=expected.getContext("2d"), scale=Math.min(canvas.width/1000,canvas.height/800);
      ref.setTransform(scale,0,0,scale,canvas.width/2,canvas.height/2+70*scale);
      ref.fillStyle="rgb(26,162,230)";
      // 独立世界坐标四边形；不复用被测的局部 transform + fillRect。
      for(const s of reference){
        const length=Math.hypot(s.x1-s.x0,s.y1-s.y0);
        const nx=-(s.y1-s.y0)/length*s.width/2,ny=(s.x1-s.x0)/length*s.width/2;
        ref.beginPath();ref.moveTo(s.x0+nx,s.y0+ny);ref.lineTo(s.x1+nx,s.y1+ny);
        ref.lineTo(s.x1-nx,s.y1-ny);ref.lineTo(s.x0-nx,s.y0-ny);ref.closePath();ref.fill();
      }
      if(erase){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.restore();}
      const a=ctx.getImageData(0,0,canvas.width,canvas.height).data,b=ref.getImageData(0,0,canvas.width,canvas.height).data;
      let count=0,error=0,solid=0,colorErrors=0;
      for(let i=3;i<a.length;i+=4) {
        if(a[i]||b[i]){count++;error+=Math.abs(a[i]-b[i]);}
        if(a[i]===255 && b[i]===255){solid++;if([1,2,3].some(d=>Math.abs(a[i-d]-b[i-d])>1)) colorErrors++;}
      }
      return {count,error:error/Math.max(1,count),solid,colorErrors};
    },{reference:originalTree(time),erase});
    const result=await compare();
    expect(result.count).toBeGreaterThan(2000);
    expect(result.error).toBeLessThan(4); // 仅覆盖画过的像素，不让大片背景稀释回归。
    expect(result.solid).toBeGreaterThan(100);
    expect(result.colorErrors).toBe(0);
    if(time===2.5) expect((await compare(true)).error).toBeGreaterThan(20);
    await page.evaluate(t=>window.treeDemo.seek(t),time);
    await page.locator("canvas").screenshot({path:info.outputPath(`tree-${time}.png`),style:"#panel,nav,#panel-toggle { visibility: hidden !important; }"});
    if(time===2.5) await page.screenshot({path:info.outputPath("tree-overlay.png")});
  }
  expect(errors).toEqual([]);
});

test("播放/暂停/分享时间、resize、浮层与 reduced-motion", async ({ page }, info) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("examples/binary-tree/index.html");
  await page.waitForFunction(()=>window.treeDemo);
  expect((await page.evaluate(()=>window.treeDemo.snapshot())).playing).toBe(false);
  await page.locator("#play").click();
  await expect.poll(()=>page.evaluate(()=>window.treeDemo.snapshot().time)).toBeGreaterThan(0.05);
  await page.locator("#play").click();
  const paused=await page.evaluate(()=>window.treeDemo.snapshot().time);
  await page.waitForTimeout(100);
  expect(await page.evaluate(()=>window.treeDemo.snapshot().time)).toBe(paused);
  await page.locator('[data-time="2.5"]').click();
  await page.locator("#share").click();
  await expect(page).toHaveURL(/t=2.5/);
  await page.reload();
  await page.waitForFunction(()=>window.treeDemo?.snapshot().time===2.5);
  const before=await page.evaluate(()=>window.treeDemo.snapshot());
  await page.setViewportSize({width:390,height:844});
  await expect.poll(()=>page.locator("canvas").evaluate(c=>c.width)).toBe(390);
  expect(await page.locator("canvas").boundingBox()).toEqual({x:0,y:0,width:390,height:844});
  expect(await page.evaluate(()=>window.treeDemo.snapshot().segments)).toEqual(before.segments);
  expect(await page.evaluate(()=>window.treeDemo.snapshot().samples)).toBe(before.samples);
  await page.locator("#panel-toggle").click();
  await expect(page.locator("#panel")).toBeHidden();
  expect(await page.evaluate(()=>document.elementFromPoint(195,422).tagName)).toBe("CANVAS");
  await page.screenshot({path:info.outputPath("tree-mobile.png")});
  await page.locator("#panel-toggle").focus(); await page.keyboard.press("Enter");
  await expect(page.locator("#panel")).toBeVisible();
});

test("DPR 2 与首个 rAF 时间戳早于注册时间", async ({ browser }) => {
  const context=await browser.newContext({viewport:{width:900,height:700},deviceScaleFactor:2,reducedMotion:"no-preference"});
  const page=await context.newPage(), errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try {
    await page.addInitScript(()=>{
      const request=window.requestAnimationFrame.bind(window); let first=true;
      window.requestAnimationFrame=callback=>request(time=>{ if(first){first=false;callback(0);}else callback(time); });
    });
    await page.goto("http://127.0.0.1:5190/preview/examples/binary-tree/index.html");
    await page.waitForFunction(()=>window.treeDemo?.snapshot().time>0.05);
    await page.evaluate(()=>window.treeDemo.seek(5));
    await expect.poll(()=>page.locator("canvas").evaluate(c=>[c.width,c.height])).toEqual([1800,1400]);
    const before=await page.evaluate(()=>window.treeDemo.snapshot());
    await page.setViewportSize({width:390,height:844});
    await expect.poll(()=>page.locator("canvas").evaluate(c=>[c.width,c.height])).toEqual([780,1688]);
    const after=await page.evaluate(()=>window.treeDemo.snapshot());
    expect(after.time).toBe(5); expect(after.segments).toEqual(before.segments); expect(after.samples).toBe(before.samples);
    expect(errors).toEqual([]);
  } finally { await context.close(); }
});
