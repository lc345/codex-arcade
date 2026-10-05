import {readFileSync} from 'node:fs';
import {createMatter} from '../vendor/matter.js';
import {createFiveKernel} from '../arcade-five/kernel.js';
import {createFivePainter} from '../arcade-five/painter.js';
import {createFiveSound} from '../arcade-five/sound.js';
import {createFiveRuntime} from '../arcade-five/runtime.js';
import {createOddKit} from '../odd-ten/kit.js';
import {splitGlass,glassStrokeCrosses} from './geometry.js';
import {CHALLENGE_WORLDS} from './worlds.js';
import {challengeBrushes,CHALLENGE_PAINTERS} from './painter.js';
export function buildChallengeFactory(program){
  const world=CHALLENGE_WORLDS[program.id],paint=CHALLENGE_PAINTERS[program.id];if(!world||!paint)throw Error('Unknown Challenge Ten pack');
  const png='data:image/png;base64,'+readFileSync(new URL(`./assets/${program.id}.png`,import.meta.url)).toString('base64');
  const physics=program.physics==='matter'?`const createMatter=${createMatter.toString()},M=createMatter();`:'';
  return `(()=>{${physics}const createFiveKernel=${createFiveKernel.toString()},createOddKit=${createOddKit.toString()},splitGlass=${splitGlass.toString()},glassStrokeCrosses=${glassStrokeCrosses.toString()},createWorld=${world.toString()},challengeBrushes=${challengeBrushes.toString()},paintScene=${paint.toString()},createFivePainter=${createFivePainter.toString()},createFiveSound=${createFiveSound.toString()},runtime=${createFiveRuntime.toString()},program=${JSON.stringify(program)},art=${JSON.stringify(png)};
    async function bitmap(){const response=await fetch(art);return createImageBitmap(await response.blob());}
    return (canvas,callbacks)=>runtime(canvas,program,{createWorld,createPainter:c=>createFivePainter(c,program,paintScene,bitmap),createSound:()=>createFiveSound(program.id,{palette:program.sound})},callbacks);
  })()`;
}
