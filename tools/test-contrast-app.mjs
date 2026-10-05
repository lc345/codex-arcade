import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||"playwright"),browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
const origin=process.env.STAGE_ORIGIN||"http://127.0.0.1:4175",out=new URL("../output/contrast-qa/",import.meta.url),errors=[],badRequests=[],packs=[];await mkdir(out,{recursive:true});
try{
  const page=await browser.newPage({viewport:{width:1380,height:1100}});page.on("pageerror",e=>errors.push(e.message));page.on("response",r=>{if(r.status()>=400)badRequests.push([r.url(),r.status()]);});page.on("request",r=>{if(/packs\/built\/.*\.js$/.test(r.url()))packs.push(r.url());});
  await page.clock.install({time:new Date("2026-09-20T00:00:00Z")});await page.clock.pauseAt(new Date("2026-09-20T00:00:01Z"));
  await page.goto(`${origin}/codex-stage?collection=contrast`);await page.waitForFunction(()=>document.querySelector("#stage-live").textContent.includes("三封急件"));await page.clock.runFor(100);
  assert.equal(await page.locator("[data-game]").count(),3);assert.equal(await page.locator("#library-drawer").evaluate(e=>e.open),true);assert.equal(packs.length,1);
  for(const id of ["rainline","ink-archive","last-lift"]){
    await page.locator(`[data-game="${id}"]`).click();await page.waitForFunction(()=>!document.querySelector("#fire").disabled);await page.clock.runFor(350);
    const aria=await page.locator("canvas").getAttribute("aria-label");assert.ok(aria.length>30);assert.equal(await page.locator(".level-strip").isVisible(),false);
    const stats=await page.locator("canvas").evaluate(c=>{const d=c.getContext("2d").getImageData(0,0,c.width,c.height).data,stride=Math.max(1,Math.floor(d.length/4000))*4;return new Set(Array.from({length:1000},(_,i)=>Array.from(d.slice(i*stride,i*stride+3)).join())).size;});assert.ok(stats>12);
    await page.screenshot({path:new URL(`${id}-app.png`,out).pathname});
    await page.locator("#stop").click();assert.equal(await page.locator("#fire").isDisabled(),true);const stopped=await page.locator("canvas").evaluate(c=>c.toDataURL());await page.clock.runFor(1200);assert.equal(await page.locator("canvas").evaluate(c=>c.toDataURL()),stopped);
    await page.locator("#demo").click();await page.waitForFunction(()=>!document.querySelector("#fire").disabled);await page.clock.runFor(100);
  }
  assert.equal(packs.length,3);await page.locator("#expand-stage").click();assert.equal(await page.locator("#expand-stage").getAttribute("aria-pressed"),"true");await page.clock.runFor(100);await page.screenshot({path:new URL("expanded.png",out).pathname});await page.keyboard.press("Escape");
  await page.setViewportSize({width:390,height:844});for(const id of ["rainline","ink-archive","last-lift"]){await page.locator(`[data-game="${id}"]`).click();await page.waitForFunction(()=>!document.querySelector("#fire").disabled);await page.clock.runFor(200);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:new URL(`${id}-app-mobile.png`,out).pathname});}
  assert.deepEqual(errors,[]);assert.deepEqual(badRequests,[]);const report={threeChoices:true,offlineLazyPacks:3,stop:true,restart:true,expand:true,mobileNoOverflow:true,errors,badRequests};await writeFile(new URL("app-report.json",out),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
