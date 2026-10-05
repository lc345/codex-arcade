import {mkdir,writeFile} from 'node:fs/promises';
import {challengeBackdrop} from '../apps/codex-stage/challenge-ten/art.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=new URL('../apps/codex-stage/challenge-ten/assets/',import.meta.url).pathname;
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try{const page=await browser.newPage({viewport:{width:960,height:640},deviceScaleFactor:1});for(const id of ['crosswalk-zero','laser-limbo','glass-divide','neon-coil','traffic-tangle','shield-waltz']){const svg=challengeBackdrop(id);await writeFile(out+id+'.svg',svg);await page.setContent(`<style>body{margin:0}svg{display:block}</style>${svg}`);await page.screenshot({path:out+id+'.png'});console.log(id);}}finally{await browser.close();}
