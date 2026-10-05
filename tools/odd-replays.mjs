import {ODD_WORLDS} from '../apps/codex-stage/odd-ten/worlds.js';
export function oddCommand(s,memory={}){
  if(s.phase!=='playing')return null;
  const down=point=>({type:'down',point}),up=point=>({type:'up',point}),move=point=>({type:'move',point});
  switch(s.id){
    case 'velvet-vault':{const d=Math.atan2(Math.sin(s.angle-s.target),Math.cos(s.angle-s.target));return !s.held?down():Math.abs(d)<s.tolerance*.6?up():null;}
    case 'power-wash':{if(s.heat>.82||s.jammed)return s.held?up():null;if(!s.held&&s.heat>.15)return null;const cell=s.cells.find(c=>c.dirt>0);return cell?(s.held?move(cell):down(cell)):null;}
    case 'zipper-run':{if(!s.held)return down({x:s.x,y:s.y});const p=s.path.find(p=>p.y>s.y+8)||s.path.at(-1);return move(p);}
    case 'alarm-alley':{const c=s.clocks.find(c=>c.mode==='ring');return c?{type:'tap',point:c}:null;}
    case 'lunar-lease':{if(Math.abs(s.controlPoint.x-s.pad.x)>1)return move({x:s.pad.x,y:320});const want=s.ship.vy>(s.ship.y>450?1.8:2.2);return want&&!s.held?down():!want&&s.held?up():null;}
    case 'jelly-shift':{const gate=s.gates.find(g=>!g.passed);return gate?.low&&!s.held?down():!gate?.low&&s.held?up():null;}
    case 'baggage-boogie':{const bag=s.bags.find(b=>b.id===s.drag)||s.bags.find(b=>!b.dead);if(!bag)return null;const bin=s.bins[bag.type];if(!s.held)return down(bag);return Math.hypot(bag.x-bin.x,bag.y-bin.y)>5?move(bin):up(bin);}
    case 'fuse-salon':{const w=s.wires.find(w=>!w.cut);if(!w)return null;const point={x:650,y:w.y-20};if(s.held)return s.cutPoint?.y===w.y-20?move({x:650,y:w.y+20}):up();return down(point);}
    case 'tower-unplug':{if(s.progress>=s.goal)return s.held?up():null;const b=s.blocks.find(b=>b.id===s.drag)||s.blocks.slice().sort((a,b)=>b.id-a.id)[0];if(!b)return null;if(s.held&&s.drag===null)return up();if(!s.held){memory.direction=s.roof.x>480?-1:1;return down({x:b.x,y:b.y});}return move({x:b.x+(memory.direction||1)*20,y:b.y});}
    case 'sugar-snip':{if(s.cut)return null;const b=s.candy,vy=b.vy*60,remaining=s.basket.y-22-b.y,t=(-vy+Math.sqrt(vy*vy+1400*remaining))/700,x=b.x+b.vx*60*t,target=590+(s.stage?Math.sin((s.time+t)*.85)*105:0);return Math.abs(x-target)<s.basket.w/2-29?{type:'tap'}:null;}
  }
}
export function playOdd(id){const w=ODD_WORLDS[id](),stages=new Set(),memory={};w.begin();for(let n=0;n<26000;n++){const s=w.snapshot();stages.add(s.stage);if(s.phase==='won'||s.phase==='lost')break;if(s.phase==='cleared'){w.next();w.begin();continue;}const cmd=oddCommand(s,memory);if(cmd?.type==='tap'){w.down(cmd.point);w.up(cmd.point);}else if(cmd)w[cmd.type](cmd.point);w.step(1000/60);}const snapshot=w.snapshot();w.destroy();return {snapshot,stages:[...stages]};}
