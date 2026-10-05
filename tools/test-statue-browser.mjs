import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.STAGE_ORIGIN||'http://127.0.0.1:4180',url=origin+'/apps/codex-stage/statue-act/index.html',out=new URL('../output/statue-qa/',import.meta.url).pathname;
await mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const errors=[],requests=[],report={stages:[]},hash=b=>createHash('sha256').update(b).digest('hex');
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));};
const ready=p=>p.waitForFunction(()=>window.statuePilot?.state().loaded),snap=p=>p.evaluate(()=>window.statuePilot.snapshot());
try{
  const p=await browser.newPage({viewport:{width:1380,height:1000}});watch(p);await p.goto(url);await ready(p);await p.screenshot({path:out+'ready.png'});
  await p.locator('#mute').click();
  for(let stage=0;stage<3;stage++){
    await p.locator('#action').click();const r=await p.locator('canvas').boundingBox();await p.mouse.move(r.x+r.width*.5,r.y+r.height*.82);
    let held=false,shot=false;const deadline=Date.now()+60000;
    while(Date.now()<deadline){const s=await snap(p);if(s.phase!=='playing')break;const want=s.guards.every(g=>g.mode==='away');if(want&&!held){await p.mouse.down();held=true;}if(!want&&held){await p.mouse.up();held=false;}
      if(!want&&!shot&&s.x>270){await p.screenshot({path:out+`stage-${stage}-pose.png`});shot=true;}await p.waitForTimeout(20);}
    if(held)await p.mouse.up();const s=await snap(p);assert.equal(s.phase,stage===2?'won':'caught',JSON.stringify(s));assert.ok(s.x>=820);report.stages.push({stage,time:s.time,rescues:s.rescues});await p.screenshot({path:out+`stage-${stage}-done.png`});
  }
  await p.locator('#stop').click();const stopped=JSON.stringify(await snap(p)),pixels=hash(await p.locator('canvas').screenshot());await p.waitForTimeout(250);assert.equal(JSON.stringify(await snap(p)),stopped);assert.equal(hash(await p.locator('canvas').screenshot()),pixels);assert.equal(await p.evaluate(()=>window.statuePilot.state().voices),0);
  await p.reload();await ready(p);assert.equal((await snap(p)).stage,2);assert.equal((await snap(p)).phase,'ready');
  await p.locator('#action').click();await p.locator('canvas').focus();await p.keyboard.down('Space');await p.waitForFunction(()=>window.statuePilot.snapshot().phase==='lost',null,{timeout:15000});await p.keyboard.up('Space');await p.screenshot({path:out+'caught.png'});await p.locator('#action').click();assert.equal((await snap(p)).stage,2);assert.equal((await snap(p)).held,false);
  await p.locator('canvas').focus();await p.keyboard.down('Space');await p.waitForTimeout(400);await p.locator('#mute').focus();await p.keyboard.up('Space');assert.equal((await snap(p)).held,false);
  await p.evaluate(()=>window.statuePilot.pause(true));const pause=JSON.stringify(await snap(p));await p.waitForTimeout(200);assert.equal(JSON.stringify(await snap(p)),pause);await p.evaluate(()=>window.statuePilot.pause(false));
  await p.context().setOffline(true);await p.locator('canvas').focus();await p.keyboard.down('Space');await p.waitForTimeout(250);await p.keyboard.up('Space');assert.ok((await snap(p)).x>100);await p.context().setOffline(false);
  await p.evaluate(()=>window.statuePilot.destroy());assert.equal(await p.evaluate(()=>window.statuePilot.state().rendering),false);
  const mc=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'}),m=await mc.newPage();watch(m);await m.goto(url);await ready(m);await m.screenshot({path:out+'mobile.png'});await m.locator('#action').tap();const r=await m.locator('canvas').boundingBox(),cdp=await mc.newCDPSession(m);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*.4,y:r.y+r.height*.8}]});await m.waitForTimeout(350);assert.equal((await snap(m)).held,true);assert.ok((await snap(m)).x>100);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal((await snap(m)).held,false);assert.equal(await m.locator('#motion').getAttribute('aria-pressed'),'true');await m.locator('#expand').tap();await m.screenshot({path:out+'mobile-expanded.png'});assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await m.locator('#stop').tap();await mc.close();
  const late=await browser.newPage();watch(late);await late.route('**/museum.png',async r=>{await new Promise(v=>setTimeout(v,700));try{await r.continue();}catch{}});await late.goto(url);await late.locator('#stop').click();await late.waitForTimeout(1100);assert.equal(await late.evaluate(()=>window.statuePilot.state().active),false);assert.equal(await late.evaluate(()=>window.statuePilot.state().rendering),false);
  assert.deepEqual(errors,[]);assert.ok(requests.every(u=>u.startsWith(origin)||u.startsWith('blob:')||u.startsWith('data:')));Object.assign(report,{errors,mouseWin:true,keyboardFailureRetry:true,focusRelease:true,touch:true,offline:true,stopFreeze:true,lateLoadRejected:true});await writeFile(out+'report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
