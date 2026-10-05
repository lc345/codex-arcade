import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.STAGE_ORIGIN||'http://127.0.0.1:4180',url=origin+'/apps/codex-stage/return-fire/index.html';
const out=new URL('../output/return-fire-qa/',import.meta.url).pathname;await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const errors=[],requests=[],report={stages:[]};
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('request',r=>requests.push(r.url()));};
const ready=p=>p.waitForFunction(()=>window.returnFirePilot?.state().active,null,{timeout:30000});
const snap=p=>p.evaluate(()=>window.returnFirePilot.snapshot());
const hash=b=>createHash('sha256').update(b).digest('hex');
try{
  const p=await browser.newPage({viewport:{width:1360,height:1040},deviceScaleFactor:1});watch(p);assert.equal((await p.goto(url)).status(),200);await ready(p);
  assert.equal((await snap(p)).phase,'ready');await p.screenshot({path:out+'desktop-ready.png'});
  const colors=await p.locator('canvas').evaluate(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data,s=new Set();for(let i=0;i<a.length;i+=148)s.add(`${a[i]>>3},${a[i+1]>>3},${a[i+2]>>3}`);return s.size;});assert.ok(colors>300);report.colors=colors;
  const alpha=await p.evaluate(async()=>{const im=await createImageBitmap(await(await fetch('./assets/machines.png')).blob());const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);const a=x.getImageData(0,0,c.width,c.height).data;let zero=0,opaque=0;for(let i=3;i<a.length;i+=4){if(a[i]===0)zero++;if(a[i]===255)opaque++;}return{zero,opaque,pixels:a.length/4};});report.alpha=alpha;assert.ok(alpha.zero>alpha.pixels*.1);
  await p.locator('#mute').click();await p.locator('#continue').click();
  const r=await p.locator('canvas').boundingBox();let held=false;const seen=new Set(),shots=new Set(),deadline=Date.now()+180000;
  while(Date.now()<deadline){
    const s=await snap(p);if(!seen.has(s.stage)){seen.add(s.stage);report.stages.push({stage:s.stage,time:s.time,hp:s.player.hp});}
    if(['won','lost'].includes(s.phase))break;
    let x=480;const hazard=s.hazards.find(h=>h.remaining>0&&h.y+h.h/2>480);
    if(hazard)x=hazard.x<480?Math.min(790,hazard.x+hazard.w/2+95):Math.max(170,hazard.x-hazard.w/2-95);
    await p.mouse.move(r.x+x/960*r.width,r.y+525/640*r.height);
    const want=s.heat<.78&&s.charge<7&&!s.lockout&&s.phase==='playing';
    if(want&&!held){await p.mouse.down();held=true;}if(!want&&held){await p.mouse.up();held=false;}
    if(s.charge>=4&&!shots.has(s.stage)){await p.screenshot({path:out+`phase-${s.stage}-absorb.png`});shots.add(s.stage);}
    if(s.hazards.length&&!shots.has('hazard')){await p.screenshot({path:out+'laser-warning.png'});shots.add('hazard');}
    if(s.stage===2&&s.boss.y>330&&!shots.has('ram')){await p.screenshot({path:out+'core-charge.png'});shots.add('ram');}
    await p.waitForTimeout(20);
  }
  if(held)await p.mouse.up();const won=await snap(p);report.outcome={phase:won.phase,time:won.time,hp:won.player.hp,absorbed:won.absorbed,shots:won.shots,overloads:won.overloads};
  await p.screenshot({path:out+'outcome.png'});assert.equal(won.phase,'won',JSON.stringify(report.outcome));assert.equal(seen.size,3);assert.ok(won.absorbed>15);
  await p.locator('#stop').click();await p.reload();await ready(p);assert.equal((await snap(p)).stage,2);assert.equal((await snap(p)).phase,'ready');assert.equal((await snap(p)).held,false);
  await p.locator('#continue').click();await p.locator('canvas').focus();await p.keyboard.down('Space');await p.waitForFunction(()=>window.returnFirePilot.snapshot().phase==='lost',null,{timeout:40000});await p.keyboard.up('Space');
  await p.screenshot({path:out+'failure.png'});assert.ok((await snap(p)).overloads>0);await p.locator('#continue').click();assert.equal((await snap(p)).stage,2);assert.equal((await snap(p)).held,false);report.failureAndRetry=true;report.persistedStage=2;
  await p.locator('canvas').focus();await p.keyboard.down('Space');await p.waitForTimeout(2300);await p.locator('#mute').focus();await p.keyboard.up('Space');assert.equal((await snap(p)).held,false);
  await p.locator('#stop').click();const stopped=JSON.stringify(await snap(p)),frozen=hash(await p.locator('canvas').screenshot());await p.waitForTimeout(400);await p.keyboard.press('Space');
  assert.equal(JSON.stringify(await snap(p)),stopped);assert.equal(hash(await p.locator('canvas').screenshot()),frozen);assert.equal(await p.evaluate(()=>window.returnFirePilot.state().voices),0);assert.equal(await p.evaluate(()=>window.returnFirePilot.state().rendering),false);
  await p.reload();await ready(p);assert.equal((await snap(p)).phase,'ready');assert.equal((await snap(p)).held,false);
  await p.context().setOffline(true);await p.locator('#continue').click();await p.locator('canvas').focus();const before=(await snap(p)).player.x;await p.keyboard.down('ArrowLeft');await p.waitForTimeout(250);await p.keyboard.up('ArrowLeft');assert.ok((await snap(p)).player.x<before-50);await p.context().setOffline(false);
  await p.evaluate(()=>window.returnFirePilot.destroy());assert.equal(await p.evaluate(()=>window.returnFirePilot.state().disposed),true);
  const mc=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'}),m=await mc.newPage();watch(m);await m.goto(url);await ready(m);await m.screenshot({path:out+'mobile-ready.png'});
  assert.equal(await m.locator('#motion').getAttribute('aria-pressed'),'true');assert.equal(await m.locator('#mute').getAttribute('aria-pressed'),'true');await m.locator('#continue').tap();
  const mr=await m.locator('canvas').boundingBox(),cdp=await mc.newCDPSession(m);const pos=(x,y)=>({x:mr.x+x/960*mr.width,y:mr.y+y/640*mr.height});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pos(480,525)]});await m.waitForTimeout(200);assert.equal((await snap(m)).held,true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[pos(270,500)]});await m.waitForTimeout(300);assert.ok((await snap(m)).player.x<380);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal((await snap(m)).held,false);assert.equal((await snap(m)).returns.length,0);
  await m.evaluate(()=>window.returnFirePilot.pause(true));const paused=JSON.stringify(await snap(m));await m.waitForTimeout(250);assert.equal(JSON.stringify(await snap(m)),paused);
  await m.evaluate(()=>window.returnFirePilot.pause(false));await m.waitForTimeout(200);assert.ok((await snap(m)).time>JSON.parse(paused).time);
  await m.screenshot({path:out+'mobile-playing.png'});await m.locator('#expand').tap();await m.screenshot({path:out+'mobile-expanded.png'});assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await m.locator('#stop').tap();await mc.close();
  const late=await browser.newPage();watch(late);await late.route('**/drydock.png',async route=>{await new Promise(r=>setTimeout(r,900));try{await route.continue();}catch{}});await late.goto(url);await late.locator('#stop').click();await late.waitForTimeout(1200);
  assert.equal(await late.evaluate(()=>window.returnFirePilot.state().active),false);assert.equal(await late.evaluate(()=>window.returnFirePilot.state().rendering),false);
  assert.deepEqual(errors,[]);assert.ok(requests.every(r=>r.startsWith(origin)||r.startsWith('blob:')||r.startsWith('data:')));
  Object.assign(report,{browserErrors:errors,realMouseWin:true,touchDrag:true,cancelNoShot:true,keyboard:true,stopFreeze:true,pause:true,offline:true,lateLoadRejected:true,coreChargeSeen:shots.has('ram')});
  await writeFile(out+'report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
