import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {roadAt} from '../apps/codex-stage/cart-downhill/world.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.STAGE_ORIGIN||'http://127.0.0.1:4180',url=base+'/apps/codex-stage/cart-downhill/index.html';
const out=new URL('../output/cart-qa/',import.meta.url).pathname;await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),errors=[],requests=[];
const watch=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('request',r=>requests.push(r.url()));};
const ready=p=>p.waitForFunction(()=>window.cartPilot?.state().active,null,{timeout:30000});
const read=p=>p.evaluate(()=>window.cartPilot.snapshot());
const hash=b=>createHash('sha256').update(b).digest('hex');
const pixels=p=>p.locator('canvas').evaluate(c=>{const gl=c.getContext('webgl2'),w=c.width,h=c.height,a=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,a);const colors=new Set();for(let i=0;i<a.length;i+=124)colors.add(`${a[i]>>3},${a[i+1]>>3},${a[i+2]>>3}`);return colors.size;});
const report={};
try{
  const p=await browser.newPage({viewport:{width:1360,height:980},deviceScaleFactor:1});watch(p);await p.goto(url);await ready(p);
  assert.equal((await read(p)).phase,'ready');assert.ok(await pixels(p)>50,'3D scene contains nonblank geometry and materials');
  await p.locator('canvas').focus();await p.keyboard.press('Shift');assert.equal((await read(p)).phase,'ready','unrelated keys must not start driving');
  await p.screenshot({path:out+'desktop-ready.png'});const first=hash(await p.locator('canvas').screenshot());
  await p.locator('#mute').click();await p.locator('#drive').click();
  const rect=await p.locator('canvas').boundingBox();let held=false;const seen=new Set(),deadline=Date.now()+150000;
  while(Date.now()<deadline){
    const s=await read(p);if(['won','lost'].includes(s.phase))break;
    const target=roadAt(s.distance+9).center,steer=Math.max(-1,Math.min(1,(Math.atan2(target-s.x,9)-s.heading)*2));
    await p.mouse.move(rect.x+(steer+1)/2*rect.width,rect.y+rect.height*.65);
    const brake=s.speed>(s.distance>247?1.5:7);
    if(brake&&!held){await p.mouse.down();held=true;}if(!brake&&held){await p.mouse.up();held=false;}
    if(s.distance>[15,111,202][s.district]&&!seen.has(s.district)){seen.add(s.district);await p.screenshot({path:out+`district-${s.district}.png`});console.log('District',s.district+1);}
    await p.waitForTimeout(25);
  }
  if(held)await p.mouse.up();report.win=await read(p);assert.equal(report.win.phase,'won',JSON.stringify(report.win));assert.equal(seen.size,3);
  assert.notEqual(hash(await p.locator('canvas').screenshot()),first);await p.screenshot({path:out+'delivered.png'});
  await p.locator('#retry-result').click();await p.locator('#drive').click();
  await p.waitForFunction(()=>window.cartPilot.snapshot().crashes>0,null,{timeout:15000});await p.screenshot({path:out+'traffic-impact.png'});
  await p.waitForFunction(()=>window.cartPilot.snapshot().lostCargo>0,null,{timeout:5000});report.realTrafficCollision=true;
  await p.locator('#retry').click();
  await p.locator('canvas').focus();await p.keyboard.press('Enter');await p.waitForTimeout(350);await p.keyboard.down('ArrowRight');await p.waitForTimeout(100);await p.keyboard.up('ArrowRight');
  assert.equal((await read(p)).phase,'playing');assert.ok((await read(p)).distance>=180);
  await p.locator('#stop').click();const snap=JSON.stringify(await read(p)),img=hash(await p.locator('canvas').screenshot());await p.waitForTimeout(350);
  assert.equal(JSON.stringify(await read(p)),snap);assert.equal(hash(await p.locator('canvas').screenshot()),img);assert.equal(await p.evaluate(()=>window.cartPilot.state().rendering),false);assert.equal(await p.evaluate(()=>window.cartPilot.state().voices),0);
  await p.keyboard.press('Space');assert.equal(JSON.stringify(await read(p)),snap);await p.screenshot({path:out+'stopped.png'});
  await p.reload();await ready(p);assert.equal((await read(p)).phase,'ready');assert.equal((await read(p)).gate,2);assert.equal((await read(p)).speed,0);
  await p.context().setOffline(true);await p.locator('#drive').click();await p.waitForTimeout(300);assert.equal((await read(p)).phase,'playing');await p.context().setOffline(false);
  report.desktop=await p.evaluate(()=>window.cartPilot.state());await p.evaluate(()=>{window.cartPilot.destroy();document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('blur'));});assert.equal(await p.evaluate(()=>window.cartPilot.state().disposed),true);
  const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'}),m=await ctx.newPage();watch(m);await m.goto(url);await ready(m);
  assert.equal(await m.locator('#motion').getAttribute('aria-pressed'),'true');assert.equal(await m.locator('#mute').getAttribute('aria-pressed'),'true');assert.ok(await pixels(m)>50);
  await m.screenshot({path:out+'mobile-ready.png'});await m.locator('#drive').tap();const r=await m.locator('canvas').boundingBox(),cdp=await ctx.newCDPSession(m);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*.6,y:r.y+r.height*.6}]});await m.waitForTimeout(120);assert.ok((await read(m)).steer>.15);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal((await read(m)).steer,0);assert.equal((await read(m)).braking,false);
  await m.locator('#expand').tap();await m.waitForTimeout(300);await m.screenshot({path:out+'mobile-expanded.png'});assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  report.mobileFraming=await m.evaluate(()=>window.cartPilot.state().subjectFrame);
  assert.ok(report.mobileFraming.left>-.95&&report.mobileFraming.right<.95&&report.mobileFraming.bottom>-.95,'portrait camera must keep the cart and shopper inside the scene: '+JSON.stringify(report.mobileFraming));
  await m.evaluate(()=>window.cartPilot.pause(true));const paused=JSON.stringify(await read(m));await m.waitForTimeout(200);assert.equal(JSON.stringify(await read(m)),paused);assert.equal(await m.evaluate(()=>window.cartPilot.state().rendering),false);
  await m.evaluate(()=>window.cartPilot.pause(false));await m.waitForTimeout(200);assert.ok((await read(m)).time>JSON.parse(paused).time);
  await ctx.close();report.touchCancel=true;report.pause=true;report.stopResume=true;
  const late=await browser.newPage();watch(late);await late.route('**/seaside.glb',async route=>{await new Promise(r=>setTimeout(r,1000));try{await route.continue();}catch{}});await late.goto(url);await late.locator('#stop').click();await late.waitForTimeout(1300);assert.equal(await late.evaluate(()=>window.cartPilot.state().active),false);assert.equal(await late.evaluate(()=>window.cartPilot.state().rendering),false);report.lateLoadRejected=true;
  assert.ok(requests.every(r=>r.startsWith(base)||r.startsWith('data:')||r.startsWith('blob:')),'assets must stay local');assert.deepEqual(errors,[]);report.browserErrors=errors;
  await writeFile(out+'report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
