import {CENTURY_WORLDS} from '../apps/codex-stage/century-ten/worlds.js';
import {centuryRules} from '../apps/codex-stage/century-ten/rules.js';
const {sodaGroup,popSoda,rotateFour}=centuryRules();
export function solveSoda(board,moves){
  const seen=new Set();function visit(b,left){if(b.every(v=>v<0))return [];if(!left)return null;const key=b.join(',')+':'+left;if(seen.has(key))return null;seen.add(key);const checked=new Set(),groups=[];for(let i=0;i<b.length;i++){if(b[i]<0||checked.has(i))continue;const group=sodaGroup(b,i);group.forEach(v=>checked.add(v));if(group.length>=3)groups.push(group);}groups.sort((a,b)=>b.length-a.length);for(const group of groups){const tail=visit(popSoda(b,group),left-1);if(tail)return [group[0],...tail];}return null;}return visit(board,moves);
}
export function solveQuarter(board){
  const key=b=>b.join(''),goal='012345678',queue=[[board,[]]],seen=new Set([key(board)]);for(let at=0;at<queue.length;at++){const [b,path]=queue[at];if(key(b)===goal)return path;if(path.length>=8)continue;for(let q=0;q<4;q++){const next=rotateFour(b,q),str=key(next);if(!seen.has(str)){seen.add(str);queue.push([next,[...path,q]]);}}}return null;
}
export function solveFridge(s){
  const occupied=new Set(),answer=[];function visit(i){if(i===s.pieces.length)return true;const b=s.pieces[i];for(let y=0;y<s.rows;y++)for(let x=0;x<s.cols;x++){const cells=b.cells.map(([a,c])=>[a+x,c+y]);if(cells.some(([a,c])=>a>=s.cols||c>=s.rows||occupied.has(c*s.cols+a)))continue;cells.forEach(([a,c])=>occupied.add(c*s.cols+a));answer.push({id:b.id,x,y});if(visit(i+1))return true;answer.pop();cells.forEach(([a,c])=>occupied.delete(c*s.cols+a));}return false;}return visit(0)?answer:null;
}
export function centuryCommand(s,memory={}){
  if(s.phase!=='playing')return null;const tap=point=>({type:'tap',point});
  switch(s.id){
    case 'chromatic-lab':{let i=s.amounts.findIndex((n,j)=>n<s.target[j]*100-.12);if(i<0)i=s.target.findLastIndex(n=>n>0);const point={x:280+i*200,y:175};return {type:s.held?'move':'down',point};}
    case 'loop-lock':{const gems=s.objects.filter(o=>o.kind==='gem'&&!o.taken),a=gems[0];if(!a)return null;const group=gems.filter(b=>Math.hypot(a.x-b.x,a.y-b.y)<115),x1=Math.min(...group.map(b=>b.x))-30,x2=Math.max(...group.map(b=>b.x))+30,y1=Math.min(...group.map(b=>b.y))-30,y2=Math.max(...group.map(b=>b.y))+30;return {type:'stroke',points:[{x:x1,y:y1},{x:(x1+x2)/2,y:y1},{x:x2,y:y1},{x:x2,y:(y1+y2)/2},{x:x2,y:y2},{x:(x1+x2)/2,y:y2},{x:x1,y:y2},{x:x1,y:(y1+y2)/2},{x:x1,y:y1}]};}
    case 'ink-rail':return s.mode==='draw'?{type:'stroke',points:[{x:165,y:320},...s.tickets.map(t=>({x:t.x,y:t.y+21})),{x:795,y:430}]}:null;
    case 'soda-strata':{if(s.time<s.readyAt)return null;const path=solveSoda(s.board,s.moves);if(!path?.length)return null;const i=path[0];return tap({x:320+i%6*64,y:184+Math.floor(i/6)*72});}
    case 'leak-patrol':{const v=s.valves.filter(v=>v.leaking).sort((a,b)=>a.since-b.since)[0];return v?{type:s.held?'move':'down',point:{x:v.x,y:v.y}}:s.held?{type:'up'}:null;}
    case 'quarter-turn':{if(s.time<s.readyAt)return null;if(memory.quarterStage!==s.stage){memory.quarterStage=s.stage;memory.quarter=solveQuarter(s.board);}const q=memory.quarter?.shift();return q!==undefined?tap({x:400+q%2*90,y:265+Math.floor(q/2)*90}):null;}
    case 'stamp-storm':return s.time>=s.readyAt?tap({x:s.seals.every((v,i)=>v===s.sample[i])?650:310,y:493}):null;
    case 'fridge-fit':{if(memory.fridgeStage!==s.stage){memory.fridgeStage=s.stage;memory.fridge=solveFridge(s);}const target=memory.fridge?.find(t=>!s.pieces[t.id].placed);if(!target)return null;const b=s.pieces[target.id],cell=b.cells[0],start={x:b.x+cell[0]*54+27,y:b.y+cell[1]*54+27},end={x:s.bx+(target.x+cell[0])*54+27,y:s.by+(target.y+cell[1])*54+27};return {type:'stroke',points:[start,{x:(start.x+end.x)/2,y:(start.y+end.y)/2},end]};}
    case 'knot-office':{if(memory.knotStage!==s.stage){memory.knotStage=s.stage;memory.knotIndex=0;}const i=memory.knotIndex++,n=s.nodes.length;if(i>=n*2)return null;const id=i%n,start=s.nodes[id],end=i<n?{x:225+id*95,y:507}:{x:480+Math.cos(id/n*Math.PI*2-Math.PI/2)*215,y:325+Math.sin(id/n*Math.PI*2-Math.PI/2)*185};return {type:'stroke',points:[{x:start.x,y:start.y},end]};}
    case 'shadow-tell':{if(s.time<s.readyAt)return null;const card=s.cards.find(c=>c.variant!==c.shadowVariant);return tap({x:card.x,y:card.y});}
  }
}
export function playCentury(id,{stepMs=1000/60}={}){const w=CENTURY_WORLDS[id](),memory={},stages=new Set();w.begin();for(let i=0;i<14000;i++){const s=w.snapshot();stages.add(s.stage);if(['won','lost'].includes(s.phase))break;if(s.phase==='cleared'){w.next();w.begin();continue;}const c=centuryCommand(s,memory);if(c?.type==='tap'){w.down(c.point);w.up(c.point);}else if(c?.type==='stroke'){w.down(c.points[0]);for(const p of c.points.slice(1))w.move(p);w.up(c.points.at(-1));}else if(c)w[c.type](c.point);w.step(stepMs);}const snapshot=w.snapshot();w.destroy();return {snapshot,stages:[...stages]};}
