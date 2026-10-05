import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createCodexStageInjectorSource} from '../packages/codex-stage/src/injector.js';
import {buildReviewedPack} from '../apps/codex-stage/packs/build.js';
import {EXTREME_CATALOG} from '../apps/codex-stage/extreme-six/catalog.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.STAGE_ORIGIN||'http://127.0.0.1:4180',out=new URL('../output/extreme-six-qa/',import.meta.url).pathname;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),errors=[],results=[];
try{
  const p=await browser.newPage({viewport:{width:1100,height:850}});p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/__odd_dock',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:'<html><body><aside id="sidebar">Sidebar</aside><main id="editor">Editor</main><style id="dream-skin">body{--dream-test:keep}</style></body></html>'}));
  await p.goto(origin+'/__odd_dock');const source=createCodexStageInjectorSource({lazy:true});await p.evaluate(source);const dock=p.locator('agent-stage-dock');
  const event=(type,run)=>p.evaluate(({type,run})=>window.__AGENT_STAGE_CODEX_DOCK__.dispatch({type,runId:run,spanId:run,operation:{family:'turn'}}),{type,run});
  async function relay(){await p.waitForFunction(()=>{const a=window.__AGENT_STAGE_CODEX_DOCK__;return a.pendingPacks().length>0||a.snapshot().phase!=='loading';});for(const req of await p.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.pendingPacks())){const pack=buildReviewedPack(req.id);await p.evaluate(`window.__AGENT_STAGE_CODEX_DOCK__.acceptPack(${req.request},${JSON.stringify(req.id)},${pack.factory})`);}await p.waitForFunction(()=>{const t=window.__AGENT_STAGE_CODEX_DOCK__.host.shadowRoot.querySelector('[data-status]').textContent;return t&&!t.includes('加载');});}
  for(const [i,g] of EXTREME_CATALOG.entries()){
    const run='extreme-'+i;await event('turn.started',run);await relay();await dock.locator('[data-game]').selectOption(g.id);await relay();await dock.locator('[data-action=tap]').click();await p.waitForTimeout(80);const canvas=dock.locator('canvas');await canvas.focus();
    if(g.pointInput){await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowDown');}
    await p.keyboard.down('Space');await p.waitForTimeout(100);await p.keyboard.up('Space');await p.waitForTimeout(60);
    const s=await p.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.snapshot());assert.equal(s.id,g.id);assert.ok(s.time>0);assert.equal(s.held,false);await canvas.screenshot({path:out+g.id+'-dock.png'});
    await event('turn.completed',run);const stopped=await p.evaluate(()=>JSON.stringify(window.__AGENT_STAGE_CODEX_DOCK__.snapshot()));await p.waitForTimeout(120);assert.equal(await p.evaluate(()=>JSON.stringify(window.__AGENT_STAGE_CODEX_DOCK__.snapshot())),stopped);assert.equal(await p.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.input({type:'tap'})),false);
    results.push({id:g.id,keyboardRouted:true,turnStart:true,turnStop:true});console.log(JSON.stringify(results.at(-1)));
  }
  assert.equal((await p.evaluate(source)).reused,true);await p.evaluate(()=>window.__AGENT_STAGE_CODEX_DOCK__.cleanup());assert.equal(await dock.count(),0);assert.equal(await p.locator('#sidebar').textContent(),'Sidebar');assert.equal(await p.locator('#editor').textContent(),'Editor');assert.equal(await p.locator('#dream-skin').count(),1);assert.deepEqual(errors,[]);
  await writeFile(out+'dock-report.json',JSON.stringify({fixtureOnly:true,games:results,cleanup:true,errors},null,2)+'\n');
}finally{await browser.close();}
