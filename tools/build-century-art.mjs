import {mkdir,writeFile} from 'node:fs/promises';
import {centuryBackdrop} from '../apps/codex-stage/century-ten/art.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=new URL('../apps/codex-stage/century-ten/assets/',import.meta.url).pathname;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{const page=await browser.newPage({viewport:{width:960,height:640},deviceScaleFactor:1});for(const id of ['chromatic-lab','loop-lock','soda-strata','quarter-turn','stamp-storm','knot-office','shadow-tell']){const svg=centuryBackdrop(id);await writeFile(out+id+'.svg',svg);await page.setContent(`<style>body{margin:0}svg{display:block}</style>${svg}`);await page.screenshot({path:out+id+'.png'});console.log(id);}}finally{await browser.close();}
