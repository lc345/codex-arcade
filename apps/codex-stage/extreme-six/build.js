import {readFileSync} from 'node:fs';
import {createFiveKernel} from '../arcade-five/kernel.js';
import {createOddKit} from '../odd-ten/kit.js';
import {createFivePainter} from '../arcade-five/painter.js';
import {createFiveRuntime} from '../arcade-five/runtime.js';
import {createFiveSound} from '../arcade-five/sound.js';
import {createMatter} from '../vendor/matter.js';
import {hardPhysics} from '../hardcore-ten/physics.js';
import {extremeRules} from './rules.js';
import {EXTREME_WORLDS} from './worlds.js';
import {EXTREME_PAINTERS,extremeBrushes} from './painter.js';
export function buildExtremeFactory(program){
  const world=EXTREME_WORLDS[program.id],paint=EXTREME_PAINTERS[program.id];if(!world||!paint)throw Error('Unknown extreme game');
  const art='data:image/png;base64,'+readFileSync(new URL(`./assets/${program.id}.png`,import.meta.url)).toString('base64');
  const physics=program.physics==='matter'?`const createMatter=${createMatter.toString()},hardPhysics=${hardPhysics.toString()};`:'';
  return `(()=>{${physics}const createFiveKernel=${createFiveKernel.toString()},createOddKit=${createOddKit.toString()},extremeRules=${extremeRules.toString()},world=${world.toString()},extremeBrushes=${extremeBrushes.toString()},paint=${paint.toString()},createFivePainter=${createFivePainter.toString()},createFiveRuntime=${createFiveRuntime.toString()},createFiveSound=${createFiveSound.toString()},program=${JSON.stringify(program)},art=${JSON.stringify(art)};
    async function bitmap(){const r=await fetch(art);return createImageBitmap(await r.blob());}
    return (canvas,callbacks)=>createFiveRuntime(canvas,program,{createWorld:world,createPainter:c=>createFivePainter(c,program,paint,bitmap),createSound:()=>createFiveSound(program.id,{palette:program.sound})},callbacks);
  })()`;
}
