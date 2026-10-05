import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.STAGE_ORIGIN||'http://127.0.0.1:4180',url=origin+'/apps/codex-stage/reel-break/index.html';
const out=new URL('../output/reel-qa/',import.meta.url).pathname;await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const errors=[],requests=[],report={catches:[]};
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('request',r=>requests.push(r.url()));};
const ready=p=>p.waitForFunction(()=>window.reelPilot?.state().active,null,{timeout:30000});
const snapshot=p=>p.evaluate(()=>window.reelPilot.snapshot());
const hash=b=>createHash('sha256').update(b).digest('hex');
try{
  const p=await browser.newPage({viewport:{width:1360,height:1000},deviceScaleFactor:1});watch(p);assert.equal((await p.goto(url)).status(),200);await ready(p);
  assert.equal((await snapshot(p)).phase,'ready');await p.locator('canvas').focus();await p.keyboard.press('Shift');assert.equal((await snapshot(p)).phase,'ready');
  const colors=await p.locator('canvas').evaluate(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data,s=new Set();for(let i=0;i<a.length;i+=148)s.add(`${a[i]>>3},${a[i+1]>>3},${a[i+2]>>3}`);return s.size;});assert.ok(colors>300);
  await p.screenshot({path:out+'desktop-ready.png'});const first=hash(await p.locator('canvas').screenshot());await p.locator('#mute').click();
  for(let stage=0;stage<3;stage++){
    const rect=await p.locator('#reel').boundingBox();await p.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await p.mouse.down();let held=true,actionShot=false;const deadline=Date.now()+60000;
    while(Date.now()<deadline){const s=await snapshot(p);if(['caught','won','lost'].includes(s.phase))break;const want=!['surge','dive','turn'].includes(s.move);if(want&&!held){await p.mouse.down();held=true;}if(!want&&held){await p.mouse.up();held=false;}
      if(!want&&!actionShot){await p.screenshot({path:out+`fish-${stage}-action.png`});actionShot=true;}
      await p.waitForTimeout(20);
    }
    if(held)await p.mouse.up();const s=await snapshot(p);assert.equal(s.phase,stage===2?'won':'caught',JSON.stringify(s));assert.equal(s.catches,stage+1);assert.ok(actionShot);report.catches.push({stage,time:s.time,peak:s.peak});
    await p.waitForTimeout(950);await p.screenshot({path:out+`catch-${stage}.png`});console.log('Landed fish',stage+1);
    if(stage<2)await p.locator('#continue').click();
  }
  assert.notEqual(hash(await p.locator('canvas').screenshot()),first);await p.locator('#continue').click();assert.equal((await snapshot(p)).stage,0);
  await p.locator('canvas').focus();await p.keyboard.down('Space');await p.waitForFunction(()=>window.reelPilot.snapshot().phase==='lost',null,{timeout:12000});await p.keyboard.up('Space');assert.equal((await snapshot(p)).reason,'line');await p.screenshot({path:out+'line-break.png'});
  await p.locator('#continue').click();await p.locator('canvas').focus();await p.keyboard.down('Space');await p.waitForTimeout(350);await p.locator('#mute').focus();await p.keyboard.up('Space');assert.equal((await snapshot(p)).held,false,'releasing Space after a focus change must release the reel');
  await p.locator('#stop').click();const stopped=JSON.stringify(await snapshot(p)),frozen=hash(await p.locator('canvas').screenshot());await p.waitForTimeout(300);await p.keyboard.press('Space');
  assert.equal(JSON.stringify(await snapshot(p)),stopped);assert.equal(hash(await p.locator('canvas').screenshot()),frozen);assert.equal(await p.evaluate(()=>window.reelPilot.state().rendering),false);assert.equal(await p.evaluate(()=>window.reelPilot.state().voices),0);
  await p.reload();await ready(p);assert.equal((await snapshot(p)).phase,'ready');assert.equal((await snapshot(p)).held,false);assert.ok((await snapshot(p)).time>0);
  await p.context().setOffline(true);await p.locator('canvas').focus();await p.keyboard.down('Space');await p.waitForTimeout(200);await p.keyboard.up('Space');assert.equal((await snapshot(p)).phase,'playing');await p.context().setOffline(false);
  await p.evaluate(()=>window.reelPilot.destroy());await p.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('blur'));});assert.equal(await p.evaluate(()=>window.reelPilot.state().disposed),true);
  const mc=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'}),m=await mc.newPage();watch(m);await m.goto(url);await ready(m);
  assert.equal(await m.locator('#mute').getAttribute('aria-pressed'),'true');assert.equal(await m.locator('#motion').getAttribute('aria-pressed'),'true');await m.screenshot({path:out+'mobile-ready.png'});
  const r=await m.locator('#reel').boundingBox(),cdp=await mc.newCDPSession(m);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});await m.waitForTimeout(250);assert.equal((await snapshot(m)).held,true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal((await snapshot(m)).held,false);
  await m.evaluate(()=>window.reelPilot.pause(true));const pause=JSON.stringify(await snapshot(m));await m.waitForTimeout(250);assert.equal(JSON.stringify(await snapshot(m)),pause);
  await m.evaluate(()=>window.reelPilot.pause(false));await m.waitForTimeout(200);assert.ok((await snapshot(m)).time>JSON.parse(pause).time);
  await m.locator('#expand').tap();await m.waitForTimeout(100);await m.screenshot({path:out+'mobile-expanded.png'});
  assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);const framing=await m.evaluate(()=>window.reelPilot.state().fishFrame);assert.ok(framing.left>0&&framing.right<1&&framing.top>0&&framing.bottom<1);report.mobileFraming=framing;
  await m.locator('#stop').tap();assert.equal(await m.evaluate(()=>window.reelPilot.state().voices),0);await mc.close();
  const late=await browser.newPage();watch(late);await late.route('**/inlet.png',async route=>{await new Promise(r=>setTimeout(r,1000));try{await route.continue();}catch{}});await late.goto(url);await late.locator('#stop').click();await late.waitForTimeout(1300);assert.equal(await late.evaluate(()=>window.reelPilot.state().active),false);assert.equal(await late.evaluate(()=>window.reelPilot.state().rendering),false);
  assert.ok(requests.every(r=>r.startsWith(origin)||r.startsWith('blob:')||r.startsWith('data:')));assert.deepEqual(errors,[]);Object.assign(report,{browserErrors:errors,pixels:colors,realPointer:true,touchCancel:true,keyboard:true,focusRelease:true,stopFreeze:true,pause:true,offline:true,lateLoadRejected:true});
  await writeFile(out+'report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
