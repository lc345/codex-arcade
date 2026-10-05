import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {extremeCommand} from './extreme-replays.mjs';
import {EXTREME_CATALOG} from '../apps/codex-stage/extreme-six/catalog.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.STAGE_ORIGIN||'http://127.0.0.1:4180',out=new URL('../output/extreme-six-qa/',import.meta.url).pathname,covers=new URL('../apps/codex-stage/extreme-six/assets/covers/',import.meta.url).pathname;
await mkdir(out,{recursive:true});await mkdir(covers,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),errors=[],requests=[],report={games:[]};
const reportFile=process.env.EXTREME_GAME?`report-${process.env.EXTREME_GAME}.json`:'report.json';
const hash=b=>createHash('sha256').update(b).digest('hex');
const fixture=`<!doctype html><html lang="zh-CN"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#dae5e2;color:#233c41;font:16px system-ui}main{max-width:960px;margin:20px auto}canvas{display:block;width:100%;aspect-ratio:3/2;touch-action:none}button{padding:10px;margin:10px 4px}#notice{padding:8px 12px}</style></head><body><main><canvas width="960" height="640" tabindex="0" aria-label="极限六式"></canvas><button id="begin">开始</button><button id="stop">结束任务</button><button id="sound">声音</button><div id="notice" aria-live="polite"></div></main><script type="module">import {loadReviewedPack} from '/apps/codex-stage/packs/loader.js';const id=new URLSearchParams(location.search).get('game');const factory=await loadReviewedPack(id);window.play=factory(document.querySelector('canvas'),{onFeedback:e=>document.querySelector('#notice').textContent=e.text});document.querySelector('#begin').onclick=()=>play.input('tap');document.querySelector('#stop').onclick=()=>play.stop();document.querySelector('#sound').onclick=()=>play.setMuted(false);await play.start();window.ready=true;</script></body></html>`;
async function page(context){const p=await(context||browser).newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('request',r=>requests.push(r.url()));await p.route('**/__extreme_test?*',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:fixture}));return p;}
const load=async(p,id)=>{await p.goto(`${origin}/__extreme_test?game=${id}`);await p.waitForFunction(()=>window.ready&&window.play.diagnostics.loaded);};
const snap=p=>p.evaluate(()=>window.play.snapshot);
const pixelColors=p=>p.locator('canvas').evaluate(c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data,seen=new Set();for(let i=0;i<a.length;i+=228)seen.add(`${a[i]>>3},${a[i+1]>>3},${a[i+2]>>3}`);return seen.size;});
try{
 for(const game of EXTREME_CATALOG.filter(g=>!process.env.EXTREME_GAME||g.id===process.env.EXTREME_GAME)){
  const p=await page();await p.setViewportSize({width:1200,height:850});await load(p,game.id);
  await p.clock.install({time:new Date('2026-10-02T00:00:00Z')});await p.clock.pauseAt(new Date('2026-10-02T00:00:01Z'));
  await p.locator('#sound').click();await p.locator('#begin').click();await p.clock.runFor(20);assert.ok(await pixelColors(p)>32,game.id+' gameplay pixels');await p.locator('canvas').screenshot({path:covers+game.id+'.png'});
  const rect=await p.locator('canvas').boundingBox(),xy=point=>({x:rect.x+point.x/960*rect.width,y:rect.y+point.y/640*rect.height}),center=xy({x:480,y:320}),stages=new Set(),shots=new Set();let mouse=false;const memory={};
  for(let n=0;n<18000;n++){
   const s=await snap(p);stages.add(s.stage);if(s.phase==='won'||s.phase==='lost')break;
   if(s.phase==='cleared'){if(mouse){await p.mouse.up();mouse=false;}await p.clock.runFor(380);await p.locator('#begin').click();continue;}
   if(!shots.has(s.stage)&&s.time>1){const shot=await p.locator('canvas').screenshot({path:out+`${game.id}-${s.stage+1}.png`});if(s.stage===0)await writeFile(covers+game.id+'.png',shot);shots.add(s.stage);}
   const cmd=extremeCommand(s,memory);
   if(cmd?.type==='tap'){const a=xy(cmd.point||{x:480,y:320});await p.mouse.click(a.x,a.y);}
   else if(cmd?.type==='stroke'){const first=xy(cmd.points[0]);await p.mouse.move(first.x,first.y);await p.mouse.down();for(const point of cmd.points.slice(1)){const a=xy(point);await p.mouse.move(a.x,a.y,{steps:5});}await p.mouse.up();}
   else if(cmd?.type==='shot'){const a=xy(cmd.start),b=xy(cmd.end);await p.mouse.move(a.x,a.y);await p.mouse.down();await p.mouse.move(b.x,b.y,{steps:5});await p.mouse.up();}
   else if(cmd?.type==='move'){const a=xy(cmd.point);await p.mouse.move(a.x,a.y);}
   else if(cmd?.type==='down'){const a=xy(cmd.point||s.controlPoint||{x:480,y:320});await p.mouse.move(a.x,a.y);if(game.inputMode==='tap')await p.mouse.click(a.x,a.y);else{await p.mouse.down();mouse=true;}}
   else if(cmd?.type==='up'){await p.mouse.up();mouse=false;}
   const passive=false;
   await p.clock.runFor(passive?120:16);
  }
  if(mouse)await p.mouse.up();const result=await snap(p);await p.screenshot({path:out+`${game.id}-result.png`});
  assert.equal(result.phase,'won',game.id+': '+JSON.stringify(result));assert.equal(stages.size,3);
  await p.locator('#stop').click();const stopped=JSON.stringify(await snap(p)),frozen=hash(await p.locator('canvas').screenshot());await p.clock.runFor(600);assert.equal(JSON.stringify(await snap(p)),stopped);assert.equal(hash(await p.locator('canvas').screenshot()),frozen);assert.equal(await p.evaluate(()=>play.diagnostics.voices),0);assert.equal(await p.evaluate(()=>play.diagnostics.rendering),false);assert.equal(await p.evaluate(()=>play.input('tap')),false);
  await p.context().setOffline(true);await p.evaluate(()=>play.start());assert.equal((await snap(p)).phase,'won');await p.context().setOffline(false);await p.evaluate(()=>play.destroy());
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,reducedMotion:'reduce'}),m=await page(mobile);await load(m,game.id);await m.evaluate(()=>play.setReduced(true));await m.locator('#begin').tap();
  const mr=await m.locator('canvas').boundingBox(),touch={x:mr.x+mr.width*.4,y:mr.y+mr.height*.5},cdp=await mobile.newCDPSession(m),before=await snap(m);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert.equal((await snap(m)).held,false);if(game.inputMode==='drag')assert.equal((await snap(m)).shots,before.shots);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touch]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touch.x+25,y:touch.y+25}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await m.screenshot({path:out+game.id+'-mobile.png'});assert.ok(await pixelColors(m)>32);assert.equal(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.ok(await m.locator('#notice').textContent());
  await m.locator('#stop').tap();const midStop=JSON.stringify(await snap(m)),midPixels=hash(await m.locator('canvas').screenshot());await m.waitForTimeout(140);assert.equal(JSON.stringify(await snap(m)),midStop);assert.equal(hash(await m.locator('canvas').screenshot()),midPixels);assert.equal(await m.evaluate(()=>play.diagnostics.voices),0);assert.equal(await m.evaluate(()=>play.diagnostics.rendering),false);await m.evaluate(()=>play.start());assert.equal((await snap(m)).phase,'ready');assert.equal((await snap(m)).held,false);await mobile.close();await p.close();report.games.push({id:game.id,threeRoundMouseWin:true,touch:true,cancel:true,stopFreeze:true,silentAfterStop:true,offlineRestart:true,midTaskStop:true});console.log(JSON.stringify(report.games.at(-1)));
  await writeFile(out+reportFile,JSON.stringify(report,null,2)+'\n');
 }
 const main=await page();await main.setViewportSize({width:1300,height:1000});await main.goto(origin+'/codex-stage?collection=extreme-six');await main.waitForFunction(()=>document.querySelector('#feedback').textContent&&!document.querySelector('#feedback').textContent.includes('加载'));assert.equal(await main.locator('[data-game]').count(),6);
 for(const game of EXTREME_CATALOG){await main.locator(`[data-game="${game.id}"]`).click();await main.waitForFunction(()=>document.querySelector('#feedback').textContent&&!document.querySelector('#feedback').textContent.includes('加载'));assert.equal(await main.locator('#game-title').textContent(),game.title);assert.ok(!(await main.locator('#feedback').textContent()).includes('失败'));await main.locator('#fire').click();await main.waitForTimeout(120);await main.locator('#stop').click();assert.equal(await main.locator('#fire').isDisabled(),true);await main.locator('#demo').click();}
 await main.evaluate(()=>scrollTo(0,0));await main.waitForTimeout(200);await main.screenshot({path:out+'collection.png'});await main.setViewportSize({width:390,height:844});await main.evaluate(()=>scrollTo(0,0));await main.waitForTimeout(200);await main.screenshot({path:out+'collection-mobile.png'});assert.equal(await main.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.equal(await main.locator('.masthead').count(),1);
 assert.deepEqual(errors,[]);assert.ok(requests.every(u=>u.startsWith(origin)||u.startsWith('data:')||u.startsWith('blob:')));report.errors=errors;report.libraryCount=6;report.localOnly=true;await writeFile(out+reportFile,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
