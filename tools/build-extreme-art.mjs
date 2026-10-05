import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {extremeBackdrop} from '../apps/codex-stage/extreme-six/art.js';
import {EXTREME_CATALOG} from '../apps/codex-stage/extreme-six/catalog.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=new URL('../apps/codex-stage/extreme-six/assets/',import.meta.url).pathname;
await mkdir(out+'covers',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{const page=await browser.newPage({viewport:{width:960,height:640},deviceScaleFactor:1}),files=[];
 for(const {id}of EXTREME_CATALOG){const svg=extremeBackdrop(id);await writeFile(out+id+'.svg',svg);await page.setContent(`<style>body{margin:0}svg{display:block}</style>${svg}`);await page.screenshot({path:out+id+'.png'});for(const ext of ['svg','png']){const b=await readFile(out+id+'.'+ext);files.push({path:id+'.'+ext,sha256:createHash('sha256').update(b).digest('hex'),bytes:b.length,source:'Original project-authored SVG, rasterized locally with Chromium',license:'Apache-2.0'});}console.log(id);}
 await writeFile(out+'provenance.json',JSON.stringify({license:'Apache-2.0',files},null,2)+'\n');
}finally{await browser.close();}
