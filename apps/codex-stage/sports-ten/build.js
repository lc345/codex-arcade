import {readFileSync} from 'node:fs';
import {createMatter} from '../vendor/matter.js';
import {createFiveKernel} from '../arcade-five/kernel.js';
import {createFivePainter} from '../arcade-five/painter.js';
import {createFiveSound} from '../arcade-five/sound.js';
import {createFiveRuntime} from '../arcade-five/runtime.js';
import {createSportsKit} from './physics.js';
import {SPORTS_WORLDS} from './worlds.js';
import {sportsBrushes,paintPocket,paintHoops,paintKick,paintTennis,paintPing,paintBowling,paintCurling,paintDomino,paintPlates,paintCrush} from './painter.js';
const painters={'pocket-six':paintPocket,'roof-hoops':paintHoops,'curve-kick':paintKick,'lawn-rally':paintTennis,'table-spin':paintPing,'pin-strike':paintBowling,'ice-stone':paintCurling,'domino-bridge':paintDomino,'plate-parade':paintPlates,'crush-hour':paintCrush};
export function buildSportsFactory(program){
  const world=SPORTS_WORLDS[program.id],paint=painters[program.id];if(!world||!paint)throw Error('Unknown Sports Ten pack');
  const png='data:image/png;base64,'+readFileSync(new URL(`./assets/${program.id}.png`,import.meta.url)).toString('base64');
  return `(()=>{const createMatter=${createMatter.toString()},M=createMatter(),createFiveKernel=${createFiveKernel.toString()},createSportsKit=${createSportsKit.toString()},createWorld=${world.toString()},sportsBrushes=${sportsBrushes.toString()},paintScene=${paint.toString()},createFivePainter=${createFivePainter.toString()},createFiveSound=${createFiveSound.toString()},runtime=${createFiveRuntime.toString()},program=${JSON.stringify(program)},art=${JSON.stringify(png)};
    async function bitmap(){const response=await fetch(art);return createImageBitmap(await response.blob());}
    return (canvas,callbacks)=>runtime(canvas,program,{createWorld,createPainter:c=>createFivePainter(c,program,paintScene,bitmap),createSound:()=>createFiveSound(program.id,{palette:program.sound})},callbacks);
  })()`;
}
