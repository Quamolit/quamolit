import { expect, test } from "@playwright/test";

test("Scene IR 任意时间构造、序列化后可绘制准确中间帧", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/test/scene-core.html?time=0.5");
  const status = page.locator("#status");
  await expect(status).toContainText("t=0.5s · rect-center=108 · nodes=3 · instances=10000 · pixel=234,88,12,255");
  await expect(status).toContainText("bound=pass");
  for (const [time, x] of [[1, 128], [0, 88], [0.25, 98], [0.5, 108], [0.5, 108]]) {
    await page.getByRole("button", { name: `${time}s`, exact: true }).click();
    await expect(status).toContainText(`t=${time}s · rect-center=${x} · nodes=3 · instances=10000 · pixel=234,88,12,255`);
  }
  await page.reload();
  await expect(status).toContainText("t=0.5s · rect-center=108");
  expect(pageErrors).toEqual([]);
});

test("非法时间不能产生 PASS 场景", async ({ page }) => {
  await page.goto("/test/scene-core.html?time=NaN");
  await expect(page.locator("#status")).toHaveAttribute("data-result", "fail");
});

test("正式 Scene 矩形和圆角折线保持半透明层序", async ({ page }) => {
  await page.goto("/test/scene-core.html");
  const result = await page.evaluate(async () => {
    const core = await import("/target/js/motion/calcit.core.mjs");
    const ir = await import("/target/js/motion/quamolit.scene-ir.mjs");
    const motion = await import("/target/js/motion/quamolit.motion.mjs");
    const { draw_reference_$x_: draw } = await import("/target/js/motion/quamolit.canvas-reference.mjs");
    const tags = core.init_tags(["r","g","b","a","x","y","width","height","fill","points","stroke","id","key","parent","content","bindings","interaction","none","rect","polyline","nodes"]);
    const record = (type, fields) => core._$n__PCT__$M_(type, ...Object.entries(fields).flatMap(([k,v]) => [tags[k],v]));
    const list = xs => new core.CalcitSliceList(xs);
    const variant = (type, tag, ...xs) => core._PCT__$o__$o_(type, tags[tag], ...xs);
    const color = (r,g,b) => record(motion.ColorRgba,{r,g,b,a:0.5});
    const rect = record(ir.RectNode,{x:8,y:8,width:40,height:40,fill:color(1,0,0)});
    const path = record(ir.PolylineNode,{points:list([[10,32],[32,12],[52,32]].map(([x,y])=>record(motion.Vec2,{x,y}))),width:12,stroke:color(0,0,1)});
    const node = (id, kind, value) => record(ir.SceneNode,{id,key:id,parent:"",content:variant(ir.SceneContent,kind,value),bindings:list([]),interaction:variant(ir.SceneInteraction,"none")});
    const nodes = [node("red","rect",rect),node("blue","polyline",path)];
    const canvas = () => { const c=document.createElement("canvas");c.width=c.height=64;return c; };
    const actual=canvas(),expected=canvas(),reversed=canvas();
    draw(actual.getContext("2d"),record(ir.SceneDocument,{nodes:list(nodes)}));
    draw(reversed.getContext("2d"),record(ir.SceneDocument,{nodes:list([...nodes].reverse())}));
    const ctx=expected.getContext("2d");
    ctx.fillStyle="rgba(255,0,0,0.5)";ctx.fillRect(8,8,40,40);
    ctx.strokeStyle="rgba(0,0,255,0.5)";ctx.lineWidth=12;ctx.lineCap=ctx.lineJoin="round";
    ctx.beginPath();ctx.moveTo(10,32);ctx.lineTo(32,12);ctx.lineTo(52,32);ctx.stroke();
    const pixels = c => c.getContext("2d").getImageData(0,0,64,64).data;
    const a=pixels(actual),e=pixels(expected),r=pixels(reversed);
    return { maxError:Math.max(...a.map((v,i)=>Math.abs(v-e[i]))), reorderedChannels:a.filter((v,i)=>v!==r[i]).length };
  });
  expect(result.maxError).toBe(0);
  expect(result.reorderedChannels).toBeGreaterThan(100);
});
