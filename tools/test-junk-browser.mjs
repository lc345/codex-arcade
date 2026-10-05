import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||"playwright");
const base=process.env.STAGE_ORIGIN||"http://127.0.0.1:4180", url=base+"/apps/codex-stage/godot-junk/index.html";
const out=new URL("../output/junk-qa/",import.meta.url).pathname;await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"});
const errors=[],requests=[],report={};
const hash=b=>createHash('sha256').update(b).digest('hex');
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('request',r=>requests.push(r.url()));};
const ready=p=>p.waitForFunction(()=>window.agentStagePilot?.state()==='playing'&&window.agentStagePilot.snapshot(),null,{timeout:45000});
const game=p=>p.frames().find(f=>f.url().endsWith('/built/game.html'));
const read=p=>game(p).evaluate(()=>window.agentStageSnapshot());
try{
  const page=await browser.newPage({viewport:{width:1280,height:960},deviceScaleFactor:2});watch(page);
  const t=Date.now();await page.goto(url);await ready(page);report.coldReadyMs=Date.now()-t;
  assert.equal((await read(page)).phase,'ready');assert.equal((await read(page)).time,0);
  await page.screenshot({path:out+'desktop-ready.png'});
  const canvas=game(page).locator('canvas'), b=await canvas.boundingBox();
  await page.locator('#mute').click();await page.mouse.move(b.x+b.width*.3,b.y+b.height*.65);
  const idle=hash(await canvas.screenshot());
  await page.mouse.down();await page.waitForTimeout(60);await page.mouse.up();
  await page.waitForTimeout(200);assert.notEqual(hash(await canvas.screenshot()),idle,'real input animates the rig');
  const rounds=[];
  for(let round=0;round<3;round++){
    if(round){await page.locator('#next').click();await page.mouse.move(b.x+b.width*.3,b.y+b.height*.65);await page.mouse.down();await page.waitForTimeout(60);await page.mouse.up();}
    let held=false,last=null,shot=false;const initialHits=(await read(page)).hits;
    const deadline=Date.now()+70000;
    while(Date.now()<deadline){
      const s=await read(page);last=s;
      if(s.phase==='won'||s.phase==='lost')break;
      if(s.enemy_phase==='windup'&&s.enemy_left<.13&&!held){await page.mouse.down();held=true;}
      if(s.enemy_phase==='recover'&&held){await page.mouse.up();held=false;}
      if(s.enemy_phase==='idle'&&held){await game(page).evaluate(()=>window.agentStageCommand('cancel'));held=false;await page.mouse.up();}
      if(!shot&&s.hits>initialHits){await page.screenshot({path:out+`round-${round+1}-hit.png`});shot=true;}
      await page.waitForTimeout(8);
    }
    if(held)await page.mouse.up();
    await page.screenshot({path:out+`round-${round+1}-result.png`});
    assert.equal(last.phase,'won',JSON.stringify(last));assert.ok(last.hits>0&&last.parries>0);
    rounds.push({round,hp:last.hp,enemyHP:last.enemy_hp,hits:last.hits,parries:last.parries,time:last.time});
    console.log('Real pointer round',round+1,'won');
  }
  report.rounds=rounds;
  await page.locator('#retry').click();await canvas.focus();await page.keyboard.down('Space');await page.waitForTimeout(350);await page.keyboard.up('Space');await page.waitForTimeout(150);
  assert.ok((await read(page)).time>0,'keyboard starts play');
  await page.locator('#stop').click();await page.waitForTimeout(120);
  assert.equal((await read(page)).rendering,false,'task stop disables the render loop');
  assert.equal((await read(page)).voices,0,'task stop silences every audio voice');
  assert.equal(await page.evaluate(()=>window.agentStagePilot.snapshot().task_active),false,'host snapshot stops synchronously');
  const stopped=JSON.stringify(await read(page)), pixels=hash(await canvas.screenshot());await page.waitForTimeout(400);
  assert.equal(JSON.stringify(await read(page)),stopped);assert.equal(hash(await canvas.screenshot()),pixels,'task stop freezes pixels');
  await page.keyboard.press('Space');assert.equal(JSON.stringify(await read(page)),stopped);
  await page.screenshot({path:out+'stopped.png'});
  const saved=JSON.parse(await page.evaluate(()=>localStorage.getItem('agent-stage:junk-champion:v1')));
  await page.reload();await ready(page);assert.equal((await read(page)).round,saved.round);assert.equal((await read(page)).hp,saved.hp);assert.equal((await read(page)).held,false);assert.equal((await read(page)).rendering,true);
  await page.context().setOffline(true);await game(page).locator('canvas').focus();await page.keyboard.down('Space');await page.waitForTimeout(80);await page.keyboard.up('Space');assert.equal((await read(page)).active,true);await page.context().setOffline(false);
  report.stopAndResume=true;
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  const mobile=await ctx.newPage();watch(mobile);await mobile.goto(url);await ready(mobile);
  assert.equal(await mobile.locator('#mute').getAttribute('aria-pressed'),'true');assert.equal(await mobile.locator('#reduced').getAttribute('aria-pressed'),'true');
  const mb=await game(mobile).locator('canvas').boundingBox(),cdp=await ctx.newCDPSession(mobile);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:mb.x+mb.width*.3,y:mb.y+mb.height*.7}]});await mobile.waitForTimeout(160);
  assert.equal((await read(mobile)).held,true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await mobile.waitForTimeout(120);
  assert.equal((await read(mobile)).held,false);assert.equal((await read(mobile)).swing,0,'cancel must not punch');
  await mobile.screenshot({path:out+'mobile.png'});assert.equal(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await mobile.locator('#expand').tap();await mobile.screenshot({path:out+'mobile-expanded.png'});
  await mobile.evaluate(()=>window.agentStagePilot.pause(true));assert.equal((await read(mobile)).rendering,false);assert.equal((await read(mobile)).voices,0);assert.equal(await mobile.evaluate(()=>window.agentStagePilot.snapshot().paused),true);const paused=JSON.stringify(await read(mobile));await mobile.waitForTimeout(300);assert.equal(JSON.stringify(await read(mobile)),paused);
  await mobile.evaluate(()=>window.agentStagePilot.pause(false));assert.equal((await read(mobile)).rendering,true);
  await mobile.evaluate(()=>window.agentStagePilot.destroy());assert.equal(await mobile.locator('iframe').count(),0);await ctx.close();
  report.touchCancel=true;report.reducedAndMuted=true;report.destroy=true;
  const late=await browser.newPage();watch(late);await late.route('**/game.wasm',async route=>{await new Promise(r=>setTimeout(r,800));try{await route.continue();}catch{}});
  await late.goto(url);await late.locator('#stop').click();await late.waitForTimeout(1000);assert.equal(await late.locator('iframe').count(),0);assert.equal(await late.evaluate(()=>window.agentStagePilot.state()),'stopped');report.lateLoadRejected=true;
  assert.ok(requests.every(r=>r.startsWith(base)||r.startsWith('blob:')||r.startsWith('data:')),'no runtime external dependencies');
  assert.deepEqual(errors,[]);report.browserErrors=errors;await writeFile(out+'report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
