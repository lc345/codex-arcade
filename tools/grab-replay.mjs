import {ITEMS,STAGES} from '../apps/codex-stage/grab-go/world.js';

// A timing-only QA pilot: it reads the board and presses the same single button.
export function shouldGrab(s){
  if(s.phase!=='playing'||s.mode!=='aim')return false;
  const dx=Math.sin(s.angle),dy=Math.cos(s.angle),candidates=[];
  for(const i of s.items){
    if(i.collected)continue;let x=i.x,y=i.y;
    const def=STAGES[s.stage].items.find(d=>d.id===i.id),m=def.motion;
    if(m){const eta=Math.hypot(x-s.origin.x,y-s.origin.y)/640;x=def.x+Math.sin((s.time+eta)*m.speed+m.offset)*m.range;if(s.compact)x=480+(x-480)*.56;}
    const ax=x-s.origin.x,ay=y-s.origin.y,along=ax*dx+ay*dy,across=Math.abs(ax*dy-ay*dx);
    if(along>40&&across<i.r*.73)candidates.push({item:i,along,across});
  }
  candidates.sort((a,b)=>a.along-b.along);const best=candidates[0];if(!best||ITEMS[best.item.kind].value<60)return false;
  if(s.gate){const t=(s.gate.y-s.origin.y)/dy;if(t<best.along){const gx=480+Math.sin((s.time+t/640)*.86)*144*(s.compact?.56:1);if(Math.abs(s.origin.x+t*dx-gx)<s.gate.w/2+14)return false;}}
  return true;
}
export function playGrab(w,seconds=180){
  const stages=[];
  for(let i=0;i<seconds*120;i++){
    const s=w.snapshot();if(!stages.includes(s.stage))stages.push(s.stage);
    if(['won','lost'].includes(s.phase))return {snapshot:s,stages};
    if(s.phase==='ready')w.begin();else if(s.phase==='cleared')w.next();else if(shouldGrab(s))w.tap();
    w.step(1000/120);
  }
  return {snapshot:w.snapshot(),stages};
}
