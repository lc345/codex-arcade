import {readFileSync} from 'node:fs';
import {createMatter} from '../vendor/matter.js';
import {createReturnWorld,STAGES} from '../return-fire/world.js';
import {createReturnPainter,REGIONS} from '../return-fire/painter.js';
import {createReturnSound} from '../return-fire/sound.js';
import {createCanvasPack} from './canvas-runtime.js';
import {createStatueWorld} from '../statue-act/world.js';
import {createStatuePainter} from '../statue-act/painter.js';
import {createStatueSound} from '../statue-act/sound.js';
import {buildFiveFactory} from '../arcade-five/build.js';
import {buildSportsFactory} from '../sports-ten/build.js';
import {buildOddFactory} from '../odd-ten/build.js';
import {buildChallengeFactory} from '../challenge-ten/build.js';
import {buildCenturyFactory} from '../century-ten/build.js';
import {buildGauntletFactory} from '../gauntlet-ten/build.js';
import {buildHardcoreFactory} from '../hardcore-ten/build.js';

import {buildExtremeFactory} from "../extreme-six/build.js";

export function buildCanvasFactory(program){
  if(program.packFamily==="extreme-six")return buildExtremeFactory(program);
  if(program.packFamily==='hardcore-ten')return buildHardcoreFactory(program);
  if(program.packFamily==='gauntlet-ten')return buildGauntletFactory(program);
  if(program.packFamily==='century-ten')return buildCenturyFactory(program);
  if(program.packFamily==='odd-ten')return buildOddFactory(program);
  if(program.packFamily==='challenge-ten')return buildChallengeFactory(program);
  if(program.packFamily==='sports-ten')return buildSportsFactory(program);
  if(program.packFamily==='arcade-five')return buildFiveFactory(program);
  const kind=program.id==='return-fire'?{files:['drydock.png','machines.png'],world:createReturnWorld,painter:createReturnPainter,sound:createReturnSound}:program.id==='statue-act'?{files:['museum.png','puppets.png'],world:createStatueWorld,painter:createStatuePainter,sound:createStatueSound}:null;
  if(!kind)throw Error('Unknown Canvas pack');
  const assets=Object.fromEntries(kind.files.map(n=>[n,'data:image/png;base64,'+readFileSync(new URL(`../${program.id}/assets/${n}`,import.meta.url)).toString('base64')]));
  return `(()=>{const assets=${JSON.stringify(assets)},STAGES=${JSON.stringify(STAGES)},REGIONS=${JSON.stringify(REGIONS)};
    const createMatter=${createMatter.toString()}, {Bodies,Body,Collision}=createMatter(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
    async function bitmap(name,signal){if(signal?.aborted)throw Error('Aborted');const r=await fetch(assets[name],{signal});return createImageBitmap(await r.blob());}
    const statueBitmap=bitmap,createWorld=${kind.world.toString()},createPainter=${kind.painter.toString()},createSound=${kind.sound.toString()},runtime=${createCanvasPack.toString()};
    return (canvas,callbacks)=>runtime(canvas,${JSON.stringify(program)},{createWorld,createPainter,createSound},callbacks);
  })()`;
}
