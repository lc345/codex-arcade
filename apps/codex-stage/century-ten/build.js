import {readFileSync} from 'node:fs';
import {createMatter} from '../vendor/matter.js';
import {createFiveKernel} from '../arcade-five/kernel.js';
import {createFivePainter} from '../arcade-five/painter.js';
import {createFiveSound} from '../arcade-five/sound.js';
import {createFiveRuntime} from '../arcade-five/runtime.js';
import {createOddKit,linesCross} from '../odd-ten/kit.js';
import {centuryRules} from './rules.js';
import {CENTURY_WORLDS} from './worlds.js';
import {centuryBrushes,CENTURY_PAINTERS} from './painter.js';
export function buildCenturyFactory(program){
  const world=CENTURY_WORLDS[program.id],paint=CENTURY_PAINTERS[program.id];if(!world||!paint)throw Error('Unknown Century Ten pack');
  const png='data:image/png;base64,'+readFileSync(new URL(`./assets/${program.id}.png`,import.meta.url)).toString('base64');
  const physics=program.physics==='matter'?`const createMatter=${createMatter.toString()},M=createMatter();`:'';
  return `(()=>{${physics}const createFiveKernel=${createFiveKernel.toString()},createOddKit=${createOddKit.toString()},linesCross=${linesCross.toString()},centuryRules=${centuryRules.toString()},createWorld=${world.toString()},centuryBrushes=${centuryBrushes.toString()},paintScene=${paint.toString()},createFivePainter=${createFivePainter.toString()},createFiveSound=${createFiveSound.toString()},runtime=${createFiveRuntime.toString()},program=${JSON.stringify(program)},art=${JSON.stringify(png)};
    async function bitmap(){const response=await fetch(art);return createImageBitmap(await response.blob());}
    return (canvas,callbacks)=>runtime(canvas,program,{createWorld,createPainter:c=>createFivePainter(c,program,paintScene,bitmap),createSound:()=>createFiveSound(program.id,{palette:program.sound})},callbacks);
  })()`;
}
