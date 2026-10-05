import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { bestMarbleShot, TOWN_ROUTE } from "./variety-replays.mjs";
import { createCodexStageInjectorSource } from "../packages/codex-stage/src/injector.js";
import { buildReviewedPack } from "../apps/codex-stage/packs/build.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH });
const origin=process.env.STAGE_ORIGIN||"http://127.0.0.1:4177",out=new URL("../output/variety-qa/",import.meta.url),errors=[],report={};
const titles={"marble-demolition":"弹珠拆迁队","pocket-town":"口袋小镇","clockout-clearout":"下班清场"},ids=Object.keys(titles);
await mkdir(out,{recursive:true});
async function setup(page,id,{fallback=false}={}) {
  page.on("pageerror",e=>errors.push(e.message));await page.goto(`${origin}/apps/codex-stage/studio/variety-catalog.js`);
  await page.clock.install({time:new Date("2026-09-29T00:00:00Z")});await page.clock.pauseAt(new Date("2026-09-29T00:00:01Z"));
  await page.evaluate(async({id,fallback})=>{
    document.body.replaceChildren();document.body.style.cssText="margin:0;background:#dcebe8";
    const meta=document.createElement("meta");meta.name="viewport";meta.content="width=device-width,initial-scale=1";document.head.append(meta);
    const canvas=document.createElement("canvas");canvas.tabIndex=0;canvas.style.cssText="display:block;width:100vw;aspect-ratio:16/9;touch-action:none";document.body.append(canvas);
    if(fallback){const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith("webgl")?null:get.call(this,type,...args);};}
    window.qa={audio:0};const start=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(...args){qa.audio++;return start.apply(this,args);};
    const {STUDIO_PACKS}=await import("/apps/codex-stage/studio/registry.js"),{VARIETY_CATALOG}=await import("/apps/codex-stage/studio/variety-catalog.js"),{createStudioRuntime}=await import("/apps/codex-stage/studio/runtime.js"),p=STUDIO_PACKS[id];
    qa.runtime=createStudioRuntime(canvas,VARIETY_CATALOG.find(p=>p.id===id),o=>qa.world=p.create(o),p.paint,{},(...args)=>qa.painter=p.createPainter(...args));qa.runtime.start();await qa.painter.ready;
  },{id,fallback});await page.clock.runFor(20);
}
const scene=page=>page.evaluate(()=>JSON.parse(JSON.stringify(qa.world.scene)));
const shot=(page,name)=>page.locator("canvas").screenshot({path:new URL(`${name}.png`,out).pathname});
async function at(page,p){const r=await page.locator("canvas").boundingBox();return{x:r.x+p.x*r.width/960,y:r.y+p.y*r.height/540};}
async function click(page,p,touch=false){const v=await at(page,p);if(touch)await page.touchscreen.tap(v.x,v.y);else await page.mouse.click(v.x,v.y);await page.clock.runFor(20);}
async function until(page,predicate,max=300,ms=48){for(let i=0;i<max;i++){if(predicate(await scene(page)))return;await page.clock.runFor(ms);}throw Error(`Timed out: ${JSON.stringify(await scene(page))}`);}
const project=(page,kind,i)=>page.evaluate(({kind,i})=>qa.painter[kind](i),{kind,i});
async function stopProof(page){await page.evaluate(()=>qa.runtime.stop());const read=()=>page.evaluate(()=>({cp:qa.runtime.checkpoint,s:qa.world.scene,a:qa.audio,image:document.querySelector("canvas").toDataURL()}));const before=await read();await page.clock.runFor(500);await page.keyboard.press("Space");await page.mouse.click(200,160);assert.deepEqual(await read(),before);}
try {
  for(const id of ids){
    const page=await browser.newPage({viewport:{width:1152,height:648},deviceScaleFactor:2});await setup(page,id);await shot(page,`${id}-start`);
    assert.equal(await page.locator("canvas").evaluate(c=>c.width),2304);
    const rich=await page.locator("canvas").evaluate(c=>{const p=c.getContext("2d").getImageData(0,0,c.width,c.height).data,colors=new Set();for(let i=0;i<p.length;i+=128)colors.add(`${p[i]>>4},${p[i+1]>>4},${p[i+2]>>4}`);return colors.size;});assert.ok(rich>30,`${id}: blank canvas`);
    if(id!=="marble-demolition")assert.equal(await page.evaluate(()=>qa.painter.diagnostics.renderer),"three-webgl2");
    await page.evaluate(()=>qa.runtime.setMuted(false));
    if(id==="marble-demolition"){
      for(let n=0;n<24&&(await scene(page)).phase!=="won";n++){
        if((await scene(page)).mode==="upgrade"){await shot(page,`${id}-upgrade`);await click(page,{x:340,y:300});continue;}
        const aim=bestMarbleShot(await page.evaluate(()=>qa.world.checkpoint()));await click(page,aim);await page.clock.runFor(220);await shot(page,`${id}-flight`);await until(page,s=>s.mode!=="flight");assert.notEqual((await scene(page)).phase,"lost");
      }
    }else if(id==="pocket-town"){
      for(const [n,i]of TOWN_ROUTE.entries()){await click(page,await project(page,"projectTile",i));assert.equal((await scene(page)).turn,n+1,`tile ${i}`);if(n===9)await shot(page,`${id}-middle`);}
      const before=await page.locator("canvas").evaluate(c=>c.toDataURL());await page.clock.runFor(500);assert.notEqual(await page.locator("canvas").evaluate(c=>c.toDataURL()),before,"train and town remain alive");
    }else{
      for(let chapter=0;chapter<3;chapter++){await click(page,await project(page,"projectSupport",0));assert.equal((await scene(page)).mode,"settling");await page.clock.runFor(950);await shot(page,`${id}-falling`);await until(page,s=>s.mode!=="settling");assert.equal((await scene(page)).delivered,(await scene(page)).items.length);if(chapter<2)await page.keyboard.press("Space");}
    }
    assert.equal((await scene(page)).phase,"won");assert.ok(await page.evaluate(()=>qa.audio>0));await shot(page,`${id}-won`);await stopProof(page);report[`${id}MouseCampaign`]=true;await page.close();
  }
  for(const id of ids){
    const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:"reduce"}),page=await ctx.newPage();await setup(page,id);await page.evaluate(()=>qa.runtime.setReduced(true));
    const p=id==="pocket-town"?await project(page,"projectTile",13):id==="clockout-clearout"?await project(page,"projectSupport",0):{x:470,y:220};
    // Touch cancellation must not fire or place anything.
    const session=await ctx.newCDPSession(page),v=await at(page,p),before=await page.evaluate(()=>qa.world.checkpoint());
    await session.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{...v,id:1}]});await session.send("Input.dispatchTouchEvent",{type:"touchCancel",touchPoints:[]});assert.deepEqual(await page.evaluate(()=>qa.world.checkpoint()),before);
    await click(page,p,true);await page.clock.runFor(120);assert.equal(await page.evaluate(()=>qa.audio),0);const s=await scene(page);assert.ok(id==="pocket-town"?s.turn===1:id==="clockout-clearout"?s.mode==="settling":s.mode==="flight");await shot(page,`${id}-touch`);await stopProof(page);report[`${id}TouchReduced`]=true;await ctx.close();
    if(id!=="marble-demolition") {const fallback=await browser.newPage({viewport:{width:960,height:540}});await setup(fallback,id,{fallback:true});assert.equal(await fallback.evaluate(()=>qa.painter.diagnostics.renderer),"canvas-fallback");await click(fallback,id==="pocket-town"?{x:578,y:280}:{x:498,y:335});assert.ok(id==="pocket-town"?(await scene(fallback)).turn===1:(await scene(fallback)).mode==="settling");await stopProof(fallback);await fallback.close();report[`${id}NoWebGL`]=true;}
    const app=await browser.newPage({viewport:{width:1440,height:1000}}),requests=[];app.on("pageerror",e=>errors.push(e.message));app.on("request",r=>requests.push(r.url()));await app.goto(`${origin}/codex-stage?game=${id}`);await app.waitForFunction(t=>document.querySelector("#game-title")?.textContent===t,titles[id]);await app.waitForTimeout(200);
    await app.locator("#stage-canvas").focus();await app.keyboard.press("Space");await app.waitForTimeout(120);assert.ok((await app.locator("#stage-live").textContent()).length);await app.locator("#expand-stage").click();await app.screenshot({path:new URL(`${id}-app.png`,out).pathname});await app.keyboard.press("Escape");await app.locator("#stop").click();
    assert.equal((await app.evaluate(id=>JSON.parse(localStorage.getItem(`agent-stage:checkpoint:v1:${id}`)),id)).id,id);await app.reload();await app.waitForTimeout(200);await app.setViewportSize({width:390,height:844});await app.locator("canvas").scrollIntoViewIfNeeded();assert.equal(await app.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await app.screenshot({path:new URL(`${id}-app-mobile.png`,out).pathname});assert.ok(!requests.some(u=>/^https?:/.test(u)&&!u.startsWith(origin)));
    await app.context().setOffline(true);await app.locator("#demo").click();await app.waitForTimeout(100);await app.locator("#stop").click();await app.close();report[`${id}OfflineSave`]=true;
  }
  const dock=await browser.newPage({viewport:{width:1100,height:850}});dock.on("pageerror",e=>errors.push(e.message));await dock.goto(`${origin}/apps/codex-stage/studio/variety-catalog.js`);await dock.setContent('<div id="shell" style="width:220px">Codex shell fixture</div><div id="dream-skin">Theme fixture</div>');await dock.evaluate(createCodexStageInjectorSource({lazy:true}));
  for(const id of ids){await dock.evaluate(id=>{const s=document.querySelector("agent-stage-dock").shadowRoot.querySelector("[data-game]");s.value=id;s.dispatchEvent(new Event("change"));window.__AGENT_STAGE_CODEX_DOCK__.dispatch({type:"turn.started",runId:id,spanId:id,operation:{family:"turn"}});},id);
    for(const r of await dock.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.pendingPacks())){const p=buildReviewedPack(r.id);await dock.evaluate(`window.__AGENT_STAGE_CODEX_DOCK__.acceptPack(${r.request},${JSON.stringify(r.id)},${p.factory})`);}
    await dock.waitForFunction(id=>window.__AGENT_STAGE_CODEX_DOCK__.snapshot()?.id===id,id);await dock.locator("agent-stage-dock canvas").focus();await dock.keyboard.press("Space");await dock.waitForTimeout(180);await dock.screenshot({path:new URL(`${id}-dock.png`,out).pathname});
    await dock.evaluate(id=>window.__AGENT_STAGE_CODEX_DOCK__.dispatch({type:"turn.completed",runId:id,operation:{family:"turn"}}),id);const snapshot=await dock.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.snapshot()),pixels=await dock.locator("agent-stage-dock canvas").evaluate(c=>c.toDataURL());assert.equal(snapshot.active,false);await dock.waitForTimeout(200);assert.deepEqual(await dock.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.snapshot()),snapshot);assert.equal(await dock.locator("agent-stage-dock canvas").evaluate(c=>c.toDataURL()),pixels);
  }
  await dock.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.cleanup());assert.equal(await dock.locator("#shell").evaluate(e=>e.offsetWidth),220);assert.equal(await dock.locator("#dream-skin").textContent(),"Theme fixture");await dock.close();report.mockDock=true;
  assert.deepEqual(errors,[]);console.log(JSON.stringify(report));
}finally{await browser.close();await writeFile(new URL("report.json",out),JSON.stringify({...report,errors},null,2));}
