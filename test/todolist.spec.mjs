import {test,expect} from "@playwright/test";

async function ready(page,time=0.8){await page.goto(`http://127.0.0.1:5180/examples/todolist/index.html?t=${time}`);await expect(page.locator("#status")).toHaveAttribute("data-result","pass");}
async function clickRow(page,id,action){
  const point=await page.evaluate(({id,action})=>{
    const s=window.todoDemo.snapshot(),kind=action==="toggle"?"rect":"text";
    const index=s.scene.nodes.findIndex(n=>n.id===`presence/${kind}/${id}/${action}`),m=s.transforms[index];
    if(!m)throw Error("missing row target");
    const x={toggle:-270,edit:-160,front:225,remove:270}[action];
    const c=document.querySelector("canvas"),b=c.getBoundingClientRect();
    return {x:b.x+(s.view.x+(m.e+x)*s.view.scale)*b.width/c.width,y:b.y+(s.view.y+m.f*s.view.scale)*b.height/c.height};
  },{id,action});
  await page.mouse.click(point.x,point.y);
}

test("Canvas 文字与矩形符合独立原生参考，固定时间截图",async({page},testInfo)=>{
  await ready(page);
  const result=await page.evaluate(async()=>{
    const t=await import("/target/js/todolist/quamolit.examples.todolist.mjs");
    const r=await import("/target/js/todolist/quamolit.retained-component.mjs");
    const create=()=>{const c=document.createElement("canvas");c.width=900;c.height=760;return c.getContext("2d");};
    const actual=create(),reference=create();actual.translate(450,380);reference.translate(450,380);
    r.draw_plan_$x_(actual,t.start_plan(t.replay(t.demo_log(),0.8),0.8));
    for(const [i,label]of["Explore","Animate","Sketch"].entries()){
      reference.save();reference.translate(0,-160+i*64);
      reference.fillStyle="rgb(26,41,59)";reference.fillRect(-300,-25,600,50);
      reference.fillStyle="rgb(51,77,107)";reference.fillRect(-282,-14,28,28);
      reference.textAlign="left";reference.textBaseline="middle";reference.direction="ltr";
      reference.fillStyle="rgb(224,237,250)";reference.font="18px monospace";reference.fillText(label,-234,0);
      reference.fillStyle="rgb(133,179,224)";reference.font="22px monospace";reference.fillText("↑",215,0);
      reference.fillStyle="rgb(250,133,133)";reference.font="24px monospace";reference.fillText("×",260,0);
      reference.restore();
    }
    const a=actual.getImageData(0,0,900,760).data,b=reference.getImageData(0,0,900,760).data;
    return {same:a.every((v,i)=>v===b[i]),actual:actual.canvas.toDataURL(),expected:reference.canvas.toDataURL()};
  });
  for(const name of ["actual","expected"])await testInfo.attach(name,{body:Buffer.from(result[name].split(",")[1],"base64"),contentType:"image/png"});
  expect(result.same).toBe(true);
  await page.locator("#panel-toggle").click();
  for(const time of [.25,1.65,1.7,2.6,4]){
    await page.evaluate(t=>window.todoDemo.seek(t),time);
    await page.screenshot({path:testInfo.outputPath(`todo-${time}.png`)});
  }
});

test("新增、Canvas 完成/编辑/置顶/删除、恢复与日志重放",async({page})=>{
  const errors=[];page.on("pageerror",e=>errors.push(e.message));await ready(page);
  await page.locator("#draft").fill("New motion");await page.locator("#submit").click();
  await page.evaluate(()=>window.todoDemo.pause());
  expect((await page.evaluate(()=>window.todoDemo.snapshot())).model.rows[0].text).toBe("New motion");
  // 跳到当前自定义日志的终点，使进入动画结束；不会恢复被截断的示范未来事件。
  await page.evaluate(()=>window.todoDemo.seek(2));
  await page.locator("#panel-toggle").click();
  await clickRow(page,"4","toggle");await page.evaluate(()=>window.todoDemo.pause());
  expect((await page.evaluate(()=>window.todoDemo.snapshot())).model.rows.find(r=>r.id==="4").done).toBe(true);
  await clickRow(page,"4","edit");await expect(page.locator("#panel")).toBeVisible();
  await page.locator("#draft").fill("Edited");await page.locator("#submit").click();await page.evaluate(()=>window.todoDemo.pause());
  await page.locator("#panel-toggle").click();
  await clickRow(page,"1","front");await page.evaluate(()=>window.todoDemo.pause());
  expect((await page.evaluate(()=>window.todoDemo.snapshot())).model.rows[0].id).toBe("1");
  await page.evaluate(()=>window.todoDemo.seek(3));
  await clickRow(page,"4","remove");await page.evaluate(()=>window.todoDemo.pause());
  expect((await page.evaluate(()=>window.todoDemo.snapshot())).model.rows.find(r=>r.id==="4").present).toBe(false);
  await page.locator("#panel-toggle").click();await page.locator("#restore").click();await page.evaluate(()=>window.todoDemo.pause());
  const snapshot=await page.evaluate(()=>window.todoDemo.seek(4));
  expect(snapshot.model.rows.find(r=>r.id==="4")).toMatchObject({text:"Edited",present:true,done:true});
  const imported=await page.evaluate(events=>{window.todoDemo.importEvents({version:1,events});return window.todoDemo.seek(4);},snapshot.events);
  expect(imported.scene).toEqual(snapshot.scene);expect(imported.transforms).toEqual(snapshot.transforms);
  expect(errors).toEqual([]);
});

test("终点释放后两秒无连续绘制，输入重新唤醒",async({page})=>{
  await ready(page,3.5);await page.locator("#play").click();
  await expect.poll(()=>page.evaluate(()=>window.todoDemo.snapshot().playing)).toBe(false);
  const before=await page.evaluate(()=>window.todoDemo.snapshot());
  expect(before.model.released).toBe(6);
  await page.waitForTimeout(2100);
  expect((await page.evaluate(()=>window.todoDemo.snapshot())).paints).toBe(before.paints);
  await page.locator("#reverse").click();
  await expect.poll(()=>page.evaluate(()=>window.todoDemo.snapshot().paints)).toBeGreaterThan(before.paints);
});

for(const dpr of [1,2])test(`全屏 DPR ${dpr}：暂停 resize 不推进 Model，浮层不误触`,async({browser},testInfo)=>{
  const context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:dpr});const page=await context.newPage();
  try{
    await ready(page,2.6);const original=await page.evaluate(()=>window.todoDemo.snapshot());
    for(const size of [{width:1280,height:900},{width:390,height:844}]){
      await page.setViewportSize(size);
      await expect.poll(()=>page.locator("canvas").evaluate(c=>[c.width,c.height])).toEqual([size.width*dpr,size.height*dpr]);
      expect(await page.locator("canvas").boundingBox()).toEqual({x:0,y:0,...size});
      const after=await page.evaluate(()=>window.todoDemo.snapshot());
      expect(after.model).toEqual(original.model);expect(after.time).toBe(original.time);expect(after.scene).toEqual(original.scene);
      await page.locator("#panel-toggle").click();await expect(page.locator("#panel")).toBeHidden();
      expect(await page.evaluate(()=>document.elementFromPoint(innerWidth/2,innerHeight/2).tagName)).toBe("CANVAS");
      await page.screenshot({path:testInfo.outputPath(`todolist-${size.width}-${dpr}.png`)});
      await page.locator("#panel-toggle").click();
      expect((await page.evaluate(()=>window.todoDemo.snapshot())).events).toEqual(original.events);
    }
  }finally{await context.close();}
});

test("非法日志不污染当前状态",async({page})=>{
  await ready(page);const result=await page.evaluate(()=>{
    const before=window.todoDemo.snapshot();let error="";
    try{window.todoDemo.importEvents({version:1,events:[{at:4,kind:"remove",id:"missing",text:""}]});}catch(e){error=e.message;}
    return {error,before,after:window.todoDemo.snapshot()};
  });expect(result.error).toContain("missing-active-todo-row");expect(result.after).toEqual(result.before);
});
