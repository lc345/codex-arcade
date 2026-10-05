import {mkdir,writeFile} from 'node:fs/promises';
import {ODD_CATALOG} from '../apps/codex-stage/odd-ten/catalog.js';
import {oddBackdrop} from '../apps/codex-stage/odd-ten/art.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=new URL('../apps/codex-stage/odd-ten/assets/',import.meta.url).pathname;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{const p=await browser.newPage({viewport:{width:960,height:640},deviceScaleFactor:1});for(const game of ODD_CATALOG){const svg=oddBackdrop(game.id);await writeFile(out+game.id+'.svg',svg);await p.setContent(`<style>body{margin:0}svg{display:block}</style>${svg}`);await p.screenshot({path:out+game.id+'.png'});console.log(game.id);}}finally{await browser.close();}
