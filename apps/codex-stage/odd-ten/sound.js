import {createFiveSound} from '../arcade-five/sound.js';
export function createOddSound(id,options){
  const audio=createFiveSound(id,options);let last=-1;
  return {...audio,update(s){audio.update(s);if(s.time<last)last=-1;if(s.phase!=='playing'||!s.held||s.time-last<.18)return;
    if(id==='power-wash'&&!s.jammed||id==='zipper-run'||id==='lunar-lease'&&s.fuel>0||id==='velvet-vault'){last=s.time;audio.event({type:'impact'});}
  }};
}
