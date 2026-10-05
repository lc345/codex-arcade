import {readFileSync} from 'node:fs';
import {createFiveKernel} from '../arcade-five/kernel.js';
import {createOddKit} from '../odd-ten/kit.js';
import {createFivePainter} from '../arcade-five/painter.js';
import {createFiveRuntime} from '../arcade-five/runtime.js';
import {createFiveSound} from '../arcade-five/sound.js';
import {gauntletRules} from './rules.js';
import {GAUNTLET_WORLDS} from './worlds.js';
import {gauntletBrushes,GAUNTLET_PAINTERS} from './painter.js';
export function buildGauntletFactory(program){
 const world=GAUNTLET_WORLDS[program.id],paint=GAUNTLET_PAINTERS[program.id];if(!world||!paint)throw Error('Unknown gauntlet game');
 const art='data:image/png;base64,'+readFileSync(new URL(`./assets/${program.id}.png`,import.meta.url)).toString('base64');
 return `(()=>{const createFiveKernel=${createFiveKernel.toString()},createOddKit=${createOddKit.toString()},gauntletRules=${gauntletRules.toString()},world=${world.toString()},gauntletBrushes=${gauntletBrushes.toString()},paint=${paint.toString()},createFivePainter=${createFivePainter.toString()},createFiveRuntime=${createFiveRuntime.toString()},createFiveSound=${createFiveSound.toString()},program=${JSON.stringify(program)},art=${JSON.stringify(art)};
 async function bitmap(){const r=await fetch(art);return createImageBitmap(await r.blob());}
 return (canvas,callbacks)=>createFiveRuntime(canvas,program,{createWorld:world,createPainter:c=>createFivePainter(c,program,paint,bitmap),createSound:()=>createFiveSound(program.id,{palette:program.sound})},callbacks);
 })()`;
}
