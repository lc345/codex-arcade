import {readFileSync} from 'node:fs';
import {createMatter} from '../vendor/matter.js';
import {createFiveKernel} from '../arcade-five/kernel.js';
import {createFivePainter} from '../arcade-five/painter.js';
import {createFiveSound} from '../arcade-five/sound.js';
import {createFiveRuntime} from '../arcade-five/runtime.js';
import {createOddKit,linesCross} from './kit.js';
import {ODD_WORLDS} from './worlds.js';
import {createOddSound} from './sound.js';
import {oddBrushes,paintVault,paintWash,paintZipper,paintAlarm,paintLander,paintJelly,paintBaggage,paintFuse,paintTower,paintSugar} from './painter.js';
const painters={'velvet-vault':paintVault,'power-wash':paintWash,'zipper-run':paintZipper,'alarm-alley':paintAlarm,'lunar-lease':paintLander,'jelly-shift':paintJelly,'baggage-boogie':paintBaggage,'fuse-salon':paintFuse,'tower-unplug':paintTower,'sugar-snip':paintSugar};
export function buildOddFactory(program){
  const world=ODD_WORLDS[program.id],paint=painters[program.id];if(!world||!paint)throw Error('Unknown Odd Ten pack');
  const png='data:image/png;base64,'+readFileSync(new URL(`./assets/${program.id}.png`,import.meta.url)).toString('base64');
  const physics=program.physics==='matter'?`const createMatter=${createMatter.toString()},M=createMatter();`:'';
  return `(()=>{${physics}const createFiveKernel=${createFiveKernel.toString()},createOddKit=${createOddKit.toString()},linesCross=${linesCross.toString()},createWorld=${world.toString()},oddBrushes=${oddBrushes.toString()},paintScene=${paint.toString()},createFivePainter=${createFivePainter.toString()},createFiveSound=${createFiveSound.toString()},createOddSound=${createOddSound.toString()},runtime=${createFiveRuntime.toString()},program=${JSON.stringify(program)},art=${JSON.stringify(png)};
    async function bitmap(){const response=await fetch(art);return createImageBitmap(await response.blob());}
    return (canvas,callbacks)=>runtime(canvas,program,{createWorld,createPainter:c=>createFivePainter(c,program,paintScene,bitmap),createSound:()=>createOddSound(program.id,{palette:program.sound})},callbacks);
  })()`;
}
