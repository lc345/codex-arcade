import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {shouldGrab} from './grab-replay.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.STAGE_ORIGIN||'http://127.0.0.1:4180',url=origin+'/apps/codex-stage/grab-go/index.html',out=new URL('../output/grab-qa/',import.meta.url).pathname;
await mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const errors=[],requests=[],report={rounds:[]},hash=b=>createHash('sha256').update(b).digest('hex');
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('request',r=>requests.push(r.url()));};
const ready=p=>p.waitForFunction(()=>window.grabPilot?.state().active,null,{timeout:30000}),snap=p=>p.evaluate(()=>window.grabPilot.snapshot());
const colors=p=>p.locator('#game').evaluate(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data,s=new Set();for(let i=0;i<a.length;i+=188)s.add(`${a[i]>>3},${a[i+1]>>3},${a[i+2]>>3}`);return s.size;});
try{
  const p=await browser.newPage({viewport:{width:1360,height:1000}});watch(p);await p.goto(url);await ready(p);assert.equal((await snap(p)).phase,'ready');report.colors=await colors(p);assert.ok(report.colors>350);await p.screenshot({path:out+'desktop-ready.png'});
  const alpha=await p.evaluate(async()=>{const im=await createImageBitmap(await(await fetch('./assets/treasures.png')).blob()),c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const a=x.getImageData(0,0,c.width,c.height).data;let zero=0;for(let i=3;i<a.length;i+=4)if(a[i]===0)zero++;return{zero,total:a.length/4};});assert.ok(alpha.zero>alpha.total*.2);report.alpha=alpha;
  await p.locator('#mute').focus();await p.keyboard.press('Space');assert.equal(await p.locator('#mute').getAttribute('aria-pressed'),'false','native Space activation must work on toolbar buttons');await p.locator('#continue').click();await p.keyboard.press('Escape');await p.locator('#continue').click();assert.equal((await snap(p)).shots,0,'resuming must not fire a hook');const r=await p.locator('#game').boundingBox(),deadline=Date.now()+210000,seen=new Set(),captures=new Set();
  while(Date.now()<deadline){
    const s=await snap(p);if(!seen.has(s.stage)){seen.add(s.stage);await p.screenshot({path:out+`round-${s.stage+1}.png`});}
    if(s.grabId&&!captures.has(s.stage)){captures.add(s.stage);await p.screenshot({path:out+`round-${s.stage+1}-haul.png`});}
    if(s.phase==='cleared'){report.rounds.push({stage:s.stage,score:s.score,seconds:s.time,shots:s.shots,misses:s.misses});await p.locator('#continue').click();continue;}
    if(['won','lost'].includes(s.phase))break;
    if(shouldGrab(s))await p.mouse.click(r.x+r.width*.5,r.y+r.height*.6);
    await p.waitForTimeout(10);
  }
  const won=await snap(p);report.rounds.push({stage:won.stage,score:won.score,seconds:won.time,shots:won.shots,misses:won.misses});report.outcome=won.phase;await p.screenshot({path:out+'victory.png'});assert.equal(won.phase,'won',JSON.stringify(report.rounds));assert.equal(seen.size,3);
  await p.locator('#stop').click();await p.reload();await ready(p);assert.equal((await snap(p)).phase,'won');await p.locator('#continue').click();assert.equal((await snap(p)).stage,0);
  await p.locator('#game').focus();await p.keyboard.down('Space');await p.waitForTimeout(80);assert.equal((await snap(p)).shots,1);await p.keyboard.down('Space');assert.equal((await snap(p)).shots,1);await p.keyboard.up('Space');
  await p.locator('#stop').click();const stop=JSON.stringify(await snap(p)),image=hash(await p.locator('#game').screenshot());await p.waitForTimeout(350);await p.keyboard.press('Space');assert.equal(JSON.stringify(await snap(p)),stop);assert.equal(hash(await p.locator('#game').screenshot()),image);assert.equal(await p.evaluate(()=>window.grabPilot.state().voices),0);assert.equal(await p.evaluate(()=>window.grabPilot.state().rendering),false);
  await p.reload();await ready(p);assert.equal((await snap(p)).phase,'ready');assert.equal((await snap(p)).shots,1);await p.context().setOffline(true);await p.locator('#continue').click();await p.waitForTimeout(600);assert.ok((await snap(p)).time>JSON.parse(stop).time);await p.context().setOffline(false);
  await p.evaluate(()=>window.grabPilot.pause(true));const paused=JSON.stringify(await snap(p));await p.waitForTimeout(250);assert.equal(JSON.stringify(await snap(p)),paused);await p.locator('#continue').click();assert.equal(await p.evaluate(()=>window.grabPilot.state().paused),false);
  await p.evaluate(()=>window.grabPilot.destroy());assert.equal(await p.evaluate(()=>window.grabPilot.state().disposed),true);
  const mc=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'}),m=await mc.newPage();watch(m);await m.goto(url);await ready(m);await m.screenshot({path:out+'mobile-ready.png'});assert.equal((await snap(m)).compact,true);assert.equal(await m.locator('#motion').getAttribute('aria-pressed'),'true');assert.equal(await m.locator('#mute').getAttribute('aria-pressed'),'true');
  await m.locator('#continue').tap();const mr=await m.locator('#game').boundingBox(),cdp=await mc.newCDPSession(m),point={x:mr.x+mr.width*.45,y:mr.y+mr.height*.5};
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal((await snap(m)).shots,0);
  await m.locator('#game').tap({position:{x:mr.width*.45,y:mr.height*.5}});assert.equal((await snap(m)).shots,1);await m.waitForTimeout(900);await m.screenshot({path:out+'mobile-haul.png'});assert.ok(await colors(m)>300);assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await m.locator('#expand').tap();await m.screenshot({path:out+'mobile-expanded.png'});await m.locator('#stop').tap();await mc.close();
  const late=await browser.newPage();watch(late);await late.route('**/treasures.png',async route=>{await new Promise(r=>setTimeout(r,700));try{await route.continue();}catch{}});await late.goto(url);await late.locator('#stop').click();await late.waitForTimeout(1100);assert.equal(await late.evaluate(()=>window.grabPilot.state().active),false);assert.equal(await late.evaluate(()=>window.grabPilot.state().rendering),false);
  assert.deepEqual(errors,[]);assert.ok(requests.every(r=>r.startsWith(origin)||r.startsWith('data:')||r.startsWith('blob:')));
  Object.assign(report,{errors,realMouseThreeRoundWin:true,touch:true,cancelNoShot:true,keyboardNoRepeat:true,keyboardToolbar:true,resumeNoShot:true,stopFreeze:true,resume:true,offlineAfterLoad:true,lateLoadRejected:true});await writeFile(out+'report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
