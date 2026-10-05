import {readFileSync} from 'node:fs';
import {createMatter} from '../vendor/matter.js';
import {createFiveKernel} from './kernel.js';
import {createPanWorld} from './pan-flip.js';
import {createBankWorld} from './bank-shot.js';
import {createPaperWorld} from './paper-racer.js';
import {createCapWorld} from './cap-cup.js';
import {createGliderWorld} from './paper-glider.js';
import {createFivePainter,paintPan,paintBank,paintPaper,paintCap,paintGlider} from './painter.js';
import {createFiveSound} from './sound.js';
import {createFiveRuntime} from './runtime.js';
const choices={'pan-flip':[createPanWorld,paintPan],'bank-shot':[createBankWorld,paintBank],'paper-racer':[createPaperWorld,paintPaper],'cap-cup':[createCapWorld,paintCap],'paper-glider':[createGliderWorld,paintGlider]};
export function buildFiveFactory(program){
  const chosen=choices[program.id];if(!chosen)throw Error('Unknown Arcade Five pack');
  const png='data:image/png;base64,'+readFileSync(new URL(`./assets/${program.id}.png`,import.meta.url)).toString('base64');
  return `(()=>{const createMatter=${createMatter.toString()},M=createMatter(),createFiveKernel=${createFiveKernel.toString()},createWorld=${chosen[0].toString()},paintScene=${chosen[1].toString()},createFivePainter=${createFivePainter.toString()},createFiveSound=${createFiveSound.toString()},runtime=${createFiveRuntime.toString()},program=${JSON.stringify(program)},art=${JSON.stringify(png)};
    async function bitmap(){const response=await fetch(art);return createImageBitmap(await response.blob());}
    return (canvas,callbacks)=>runtime(canvas,program,{createWorld,createPainter:c=>createFivePainter(c,program,paintScene,bitmap),createSound:()=>createFiveSound(program.id)},callbacks);
  })()`;
}
