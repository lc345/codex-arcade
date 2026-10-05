import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createCodexStageInjectorSource} from '../packages/codex-stage/src/injector.js';
import {buildReviewedPack} from '../apps/codex-stage/packs/build.js';
import {GAME_CATALOG} from '../apps/codex-stage/collection/catalog.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.STAGE_ORIGIN||'http://127.0.0.1:4180',out=new URL('../output/curated-qa/',import.meta.url).pathname;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const errors=[],requests=[],report={},hash=b=>createHash('sha256').update(b).digest('hex'),expected=GAME_CATALOG.filter(g=>g.curated).map(g=>g.id).sort();
const watch=p=>{p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));};
async function loaded(p){await p.waitForFunction(()=>{const t=document.querySelector('#feedback').textContent;return t&&!t.includes('加载');});assert.ok(!(await p.locator('#feedback').textContent()).includes('失败'));}
async function colors(c){return c.evaluate(el=>{const d=el.getContext('2d').getImageData(0,0,el.width,el.height).data,s=new Set();for(let i=0;i<d.length;i+=400)s.add(`${d[i]},${d[i+1]},${d[i+2]}`);return s.size;});}
try{
  const p=await browser.newPage({viewport:{width:1380,height:1050}});watch(p);await p.goto(origin+'/codex-stage?collection=curated');await loaded(p);
  assert.equal(await p.locator('[data-game]').count(),7);assert.equal(await p.locator('#random').isChecked(),true);
  const ids=[];
  for(let i=0;i<7;i++){if(i){await p.locator('#stop').click();await p.locator('#demo').click();await loaded(p);}ids.push(await p.locator('[data-game][aria-pressed=true]').getAttribute('data-game'));assert.ok(await colors(p.locator('canvas'))>24);}
  assert.deepEqual(ids.slice().sort(),expected);report.rotation=ids;
  await p.locator('[data-game=return-fire]').click();await loaded(p);assert.equal(await p.locator('#random').isChecked(),false);
  await p.locator('#fire').click();const r=await p.locator('canvas').boundingBox();await p.mouse.move(r.x+r.width*.5,r.y+r.height*.83);await p.mouse.down();await p.waitForTimeout(450);await p.mouse.up();
  await p.screenshot({path:out+'curated-return-fire.png'});await p.locator('#stop').click();const h=hash(await p.locator('canvas').screenshot());await p.waitForTimeout(150);assert.equal(hash(await p.locator('canvas').screenshot()),h);assert.equal(await p.locator('#fire').isDisabled(),true);
  assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('agent-stage:checkpoint:v1:return-fire')).version),1);
  await p.goto(origin+'/codex-stage?game=statue-act');await loaded(p);assert.match(await p.locator('canvas').getAttribute('aria-label'),/假装是雕像/);await p.locator('#fire').click();await p.locator('canvas').focus();await p.keyboard.down('Space');await p.waitForTimeout(400);await p.keyboard.up('Space');
  await p.screenshot({path:out+'statue-pack.png'});assert.ok(await colors(p.locator('canvas'))>200);await p.locator('#stop').click();assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('agent-stage:checkpoint:v1:statue-act')).stage),0);
  await p.setViewportSize({width:390,height:844});await p.screenshot({path:out+'statue-pack-mobile.png'});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);

  // This is our own fixture, not a live Codex tab; exercise the production lazy relay.
  const d=await browser.newPage({viewport:{width:1100,height:850}});watch(d);await d.route('**/__stage_dock_test',route=>route.fulfill({contentType:'text/html',body:'<html><body style="margin:0;background:#dce7e3"><aside id="sidebar">Fixture sidebar</aside><main id="editor">Fixture editor</main><style id="dream-skin">body{--dream-test:keep}</style></body></html>'}));await d.goto(origin+'/__stage_dock_test');
  const source=createCodexStageInjectorSource({lazy:true});assert.equal((await d.evaluate(source)).version,'0.11.0');const dock=d.locator('agent-stage-dock');
  async function relay(){await d.waitForFunction(()=>{const a=window.__AGENT_STAGE_CODEX_DOCK__;return a.pendingPacks().length>0||a.snapshot().phase!=='loading';});for(const req of await d.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.pendingPacks())){const pack=buildReviewedPack(req.id);await d.evaluate(`window.__AGENT_STAGE_CODEX_DOCK__.acceptPack(${req.request},${JSON.stringify(req.id)},${pack.factory})`);}await d.waitForFunction(()=>{const t=window.__AGENT_STAGE_CODEX_DOCK__.host.shadowRoot.querySelector('[data-status]').textContent;return t&&!t.includes('加载');});}
  const dispatch=(type,run='fixture-1')=>d.evaluate(({type,run})=>window.__AGENT_STAGE_CODEX_DOCK__.dispatch({type,runId:run,spanId:run,operation:{family:'turn'}}),{type,run});
  await dispatch('turn.started','fixture-0');await relay();await dock.locator('[data-game]').selectOption('curated');await dispatch('turn.completed','fixture-0');await dispatch('turn.started');await relay();const chosen=await d.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.program());assert.ok(expected.includes(chosen));
  await dispatch('turn.started');assert.equal(await d.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.program()),chosen);assert.equal(await d.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.pendingPacks().length),0);
  await dock.locator('[data-game]').selectOption('statue-act');await relay();await dock.locator('[data-action=tap]').click();await dock.locator('canvas').focus();await d.keyboard.down('Space');await d.waitForTimeout(500);await d.keyboard.up('Space');
  assert.ok(await d.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.snapshot().x)>100);assert.equal(await d.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.snapshot().held),false);
  await d.screenshot({path:out+'dock-statue.png'});await dock.locator('[data-action=resize]').click();await d.screenshot({path:out+'dock-expanded.png'});
  await dispatch('turn.completed');const stopped=await d.evaluate(()=>JSON.stringify(window.__AGENT_STAGE_CODEX_DOCK__.snapshot()));await d.waitForTimeout(200);assert.equal(await d.evaluate(()=>JSON.stringify(window.__AGENT_STAGE_CODEX_DOCK__.snapshot())),stopped);assert.equal(await d.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.input({type:'tap'})),false);
  assert.equal((await d.evaluate(source)).reused,true);await d.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.cleanup());assert.equal(await dock.count(),0);assert.equal(await d.locator('#editor').textContent(),'Fixture editor');assert.equal(await d.locator('#sidebar').textContent(),'Fixture sidebar');assert.equal(await d.locator('#dream-skin').count(),1);
  assert.deepEqual(errors,[]);assert.ok(requests.every(u=>u.startsWith(origin)||u.startsWith('data:')||u.startsWith('blob:')));
  Object.assign(report,{reviewedReturnFire:true,reviewedStatue:true,canvasNonblank:true,checkpoint:true,stopFreeze:true,mobileNoOverflow:true,lazyDock:true,dockHold:true,dockCleanup:true,errors});
  await writeFile(out+'report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
