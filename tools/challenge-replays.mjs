import {CHALLENGE_WORLDS} from '../apps/codex-stage/challenge-ten/worlds.js';
import {splitGlass} from '../apps/codex-stage/challenge-ten/geometry.js';
import {Matter as M} from '../apps/codex-stage/vendor/matter.js';
export function challengeCommand(s,memory={}){
  if(s.phase!=='playing')return null;
  const tap=point=>({type:'tap',point}),move=point=>({type:'move',point});
  switch(s.id){
    case 'crosswalk-zero':{if(s.jump)return null;const to=520-(s.row+1)*420/s.goal;let safe=true;for(let t=0;t<.3;t+=.015){const y=s.player.y+(to-s.player.y)*Math.min(1,t/.21);for(const lane of s.lanes)if(Math.abs(lane.y-y)<30)for(const c of lane.cars){const x=65+((c.x-65+lane.speed*t)%1020+1020)%1020;if(Math.abs(x-480)<c.w/2+24)safe=false;}}return safe?tap():null;}
    case 'faultline-drill':{const target=s.gates.find(g=>!g.passed);if(!target)return null;const dx=target.x-s.x;return s.direction>0&&dx< -23||s.direction<0&&dx>23?tap():null;}
    case 'laser-limbo':{const bar=s.bars.slice().reverse().find(b=>s.player.y>b.y-22);if(!bar)return move(s.target);const waitY=bar.y+34,gapFuture=480+Math.sin((s.time+.2)*bar.rate+bar.phase)*210;if(s.player.y>bar.y+22&&Math.abs(s.player.x-gapFuture)>s.gap/2-28)return move({x:gapFuture,y:Math.max(waitY,s.player.y)});return move({x:gapFuture,y:bar.y-34});}
    case 'blackout-bridge':{if(s.mode==='preview'){memory.route=s.hints.slice();return null;}return tap({x:340+(memory.route?.[s.row]??1)*140,y:496-s.row*65});}
    case 'glass-divide':{if(s.mode!=='aim')return null;let lo=200,hi=750;for(let i=0;i<25;i++){const x=(lo+hi)/2,parts=splitGlass(s.polygon,{x,y:70},{x,y:550}),left=M.Vertices.area(parts[0]),right=M.Vertices.area(parts[1]);if(left>right)hi=x;else lo=x;}return {type:'shot',start:{x:(lo+hi)/2,y:75},end:{x:(lo+hi)/2,y:550}};}
    case 'neon-coil':{if(s.queued||!s.food)return null;const f=s.food,h=s.head,d=s.direction,want=d===0&&h.x===f.x||d===1&&h.y===f.y||d===2&&h.x===f.x||d===3&&h.y===f.y;return want?tap():null;}
    case 'freeze-frame':{const saw=s.saws.find(b=>!b.passed);if(!saw)return null;const dx=saw.x-s.distance,entry=(dx-53)/s.speed,soon=350+Math.sin((s.machineTime+.1)*2.2+saw.phase)*137,want=dx> -58&&((s.held&&dx<250)||(saw.y<400&&(entry<.1||soon>400&&entry<1.3)));return want&&!s.held?{type:'down'}:!want&&s.held?{type:'up'}:null;}
    case 'copper-balance':return s.time>=s.readyAt&&s.placed<s.goal?tap({x:s.left<=s.right?325:635,y:400}):null;
    case 'traffic-tangle':{if(s.time<s.amberUntil)return null;const other=1-s.green,busy=s.cars.some(c=>c.axis===0?c.pos>291&&c.pos<409:c.pos>186&&c.pos<304);return !busy&&s.queues[other]>0&&(s.queues[other]>=2||s.queues[s.green]===0)?tap():null;}
    case 'shield-waltz':{const b=s.bolts.filter(b=>!b.checked).sort((a,b)=>a.radius-b.radius)[0];return b?move({x:480+Math.cos(b.angle)*200,y:320+Math.sin(b.angle)*200}):null;}
  }
}
export function playChallenge(id,{stepMs=1000/60}={}){const w=CHALLENGE_WORLDS[id](),memory={},stages=new Set();w.begin();for(let i=0;i<14000;i++){const s=w.snapshot();stages.add(s.stage);if(s.phase==='won'||s.phase==='lost')break;if(s.phase==='cleared'){w.next();w.begin();continue;}const c=challengeCommand(s,memory);if(c?.type==='tap'){w.down(c.point);w.up(c.point);}else if(c?.type==='shot'){w.down(c.start);w.move(c.end);w.up(c.end);}else if(c)w[c.type](c.point);w.step(stepMs);}const snapshot=w.snapshot();w.destroy();return {snapshot,stages:[...stages]};}
