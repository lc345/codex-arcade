import assert from "node:assert/strict";
import { mkdir,writeFile } from "node:fs/promises";
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||"playwright");
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
const origin=process.env.STAGE_ORIGIN||"http://127.0.0.1:4175",out=new URL("../output/contrast-qa/",import.meta.url),errors=[],report={};await mkdir(out,{recursive:true});
async function setup(page,id){
  page.on("pageerror",e=>errors.push(e.message));await page.goto(`${origin}/apps/codex-stage/studio/contrast-catalog.js`);
  await page.clock.install({time:new Date("2026-09-20T00:00:00Z")});await page.clock.pauseAt(new Date("2026-09-20T00:00:01Z"));
  await page.evaluate(async id=>{
    document.body.replaceChildren();document.body.style.margin="0";const meta=document.createElement("meta");meta.name="viewport";meta.content="width=device-width,initial-scale=1";document.head.append(meta);const canvas=document.createElement("canvas");canvas.tabIndex=0;canvas.style.cssText="display:block;width:100vw;aspect-ratio:16/9;touch-action:none";document.body.append(canvas);
    window.qa={audio:0};for(const P of [OscillatorNode,AudioBufferSourceNode]){const start=P.prototype.start;P.prototype.start=function(...a){qa.audio++;return start.apply(this,a);};}
    const {STUDIO_PACKS}=await import("/apps/codex-stage/studio/registry.js"),{CONTRAST_CATALOG}=await import("/apps/codex-stage/studio/contrast-catalog.js"),{createStudioRuntime}=await import("/apps/codex-stage/studio/runtime.js"),pack=STUDIO_PACKS[id];await pack.prepare?.();
    qa.runtime=createStudioRuntime(canvas,CONTRAST_CATALOG.find(p=>p.id===id),opts=>qa.world=pack.create(opts),pack.paint,{},(...a)=>qa.painter=pack.createPainter(...a));qa.runtime.start();await qa.painter.ready;qa.painter.draw(qa.world);
  },id);await page.clock.runFor(50);
}
async function point(page,x,y){const b=await page.locator("canvas").boundingBox();return{x:b.x+x*b.width/960,y:b.y+y*b.height/540};}
async function click(page,x,y){const p=await point(page,x,y);await page.mouse.click(p.x,p.y);}
async function hold(page,x,y){const p=await point(page,x,y);await page.mouse.move(p.x,p.y);await page.mouse.down();await page.clock.runFor(800);await page.mouse.up();}
async function move(page,key,ms){await page.locator("canvas").focus();await page.keyboard.down(key);await page.clock.runFor(ms);await page.keyboard.up(key);}
async function inspect(page,id){const pixels=await page.locator("canvas").evaluate(c=>{const d=c.getContext("2d").getImageData(0,0,c.width,c.height).data;let light=0,sat=0;const colors=new Set();for(let i=0;i<d.length;i+=32){const a=d[i],b=d[i+1],e=d[i+2];if(a+b+e>120)light++;sat+=Math.max(a,b,e)-Math.min(a,b,e);colors.add(`${a},${b},${e}`);}return{colors:colors.size,lightFraction:light/(d.length/32),saturation:sat/(d.length/32)};});assert.ok(pixels.colors>60);assert.ok(pixels.lightFraction>.12,`${id} is not blank`);report[id]={pixels,diagnostics:await page.evaluate(()=>qa.painter.diagnostics)};await page.screenshot({path:new URL(`${id}-desktop.png`,out).pathname});}
try{
  for(const id of ["rainline","ink-archive","last-lift"]){
    const page=await browser.newPage({viewport:{width:1280,height:720}});await setup(page,id);await inspect(page,id);
    if(process.env.INITIAL_ONLY){await page.evaluate(()=>qa.runtime.destroy());await page.close();continue;}
    if(id==="rainline"){
      await click(page,480,280);await page.clock.runFor(550);assert.ok(await page.evaluate(()=>qa.world.scene.player.x)>150);await page.keyboard.press(" ");await page.keyboard.press("b");await page.clock.runFor(300);
      assert.ok(await page.evaluate(()=>qa.world.scene.cooldown)>0);await page.screenshot({path:new URL(`${id}-motion.png`,out).pathname});
    }else if(id==="ink-archive"){
      for(const p of await page.evaluate(()=>qa.world.scene.clues))await hold(page,p.x,p.y);assert.equal(await page.evaluate(()=>qa.world.scene.seal),true);await page.screenshot({path:new URL(`${id}-seal.png`,out).pathname});
      for(let i=0;i<3;i++)for(let j=0;j<[7,2,4][i];j++)await click(page,620+i*90,355);
      await click(page,720,455);assert.equal(await page.evaluate(()=>qa.world.scene.phase),"won");
    }else{
      assert.equal(report[id].diagnostics.renderer,"three-perspective");await move(page,"w",950);await move(page,"a",690);
      async function item(x,y,z){const p=await page.evaluate(p=>qa.painter.project(...p),[x,y,z]);await click(page,p.x,p.y);await page.clock.runFor(30);}
      await item(-2.43,1.36,.8);assert.equal(await page.evaluate(()=>qa.world.scene.fuse),true,JSON.stringify(await page.evaluate(()=>qa.world.scene.player)));
      await move(page,"d",1380);await move(page,"w",1100);await item(2.68,1.57,-1.8);assert.equal(await page.evaluate(()=>qa.world.scene.power),true);
      await page.screenshot({path:new URL(`${id}-power.png`,out).pathname});await move(page,"a",690);await move(page,"w",1100);await item(1.27,1.43,-4.77);assert.equal(await page.evaluate(()=>qa.world.scene.opened),true);
      await page.clock.runFor(1700);await move(page,"w",1900);assert.equal(await page.evaluate(()=>qa.world.scene.phase),"won",JSON.stringify(await page.evaluate(()=>qa.world.scene.player)));
    }
    assert.equal(await page.evaluate(()=>qa.audio),0);await page.evaluate(()=>{qa.runtime.setMuted(false);qa.runtime.input("retry");qa.runtime.input("tap");});
    if(id==="ink-archive")await hold(page,185,389);if(id==="last-lift")await move(page,"w",650);
    assert.ok(await page.evaluate(()=>qa.audio)>0,`${id} sound`);
    await page.evaluate(()=>qa.runtime.setPaused(true));const paused=await page.evaluate(()=>JSON.stringify(qa.world.scene));await page.clock.runFor(500);assert.equal(await page.evaluate(()=>JSON.stringify(qa.world.scene)),paused);
    await page.evaluate(()=>{qa.runtime.setPaused(false);qa.runtime.stop();});const stopped=await page.evaluate(()=>({state:JSON.stringify(qa.world.scene),audio:qa.audio,pixels:document.querySelector("canvas").toDataURL()}));await page.keyboard.press(" ");await page.clock.runFor(1000);assert.deepEqual(await page.evaluate(()=>({state:JSON.stringify(qa.world.scene),audio:qa.audio,pixels:document.querySelector("canvas").toDataURL()})),stopped);
    await page.evaluate(()=>qa.runtime.destroy());assert.equal(await page.evaluate(()=>qa.painter.diagnostics.contexts),0);await page.close();report[id].lifecycle=true;
    const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,reducedMotion:"reduce"}),mobile=await mobileContext.newPage();await setup(mobile,id);await mobile.evaluate(()=>qa.runtime.setReduced(true));const p=await point(mobile,id==="ink-archive"?185:480,id==="ink-archive"?389:290),cdp=await mobileContext.newCDPSession(mobile);
    await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[p]});await mobile.clock.runFor(800);await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});await mobile.clock.runFor(300);
    if(id==="rainline")assert.ok(await mobile.evaluate(()=>qa.world.scene.player.x)>90);if(id==="ink-archive")assert.equal(await mobile.evaluate(()=>qa.world.scene.progress),1);if(id==="last-lift")assert.ok(await mobile.evaluate(()=>qa.world.scene.player.z)<4);
    await mobile.screenshot({path:new URL(`${id}-mobile.png`,out).pathname});await mobile.evaluate(()=>qa.runtime.destroy());await mobileContext.close();report[id].touch=true;
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify(report));
}finally{await browser.close();await writeFile(new URL("report.json",out),JSON.stringify({...report,errors},null,2));}
