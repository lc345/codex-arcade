export function hardRules(){
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const angle=x=>Math.atan2(Math.sin(x),Math.cos(x));
  function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
  const corridorDistance=(p,path)=>Math.min(...path.slice(1).map((b,i)=>segmentDistance(p,path[i],b)));
  function knightMoves(i){const x=i%5,y=Math.floor(i/5);return [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].map(([dx,dy])=>[x+dx,y+dy]).filter(([a,b])=>a>=0&&a<5&&b>=0&&b<5).map(([a,b])=>a+b*5);}
  function knightPuzzle(stage){
    // A full tour supplies connected islands; the player is never given its traversal order.
    const route=[],used=new Set();
    function visit(i){route.push(i);used.add(i);if(route.length===25)return true;const next=knightMoves(i).filter(j=>!used.has(j)).sort((a,b)=>knightMoves(a).filter(j=>!used.has(j)).length-knightMoves(b).filter(j=>!used.has(j)).length);for(const j of next)if(visit(j))return true;used.delete(i);route.pop();return false;}
    visit(0);const tiles=route.slice(0,[12,18,24][stage]);return {tiles:tiles.slice().sort((a,b)=>a-b),start:tiles[0],exit:tiles.at(-1)};
  }
  function polarityMasks(stage){const masks=Array.from({length:16},(_,i)=>{const x=i%4,y=Math.floor(i/4),diagonal=stage===1||stage===2&&(x+y)%2===1,dirs=diagonal?[[0,0],[-1,-1],[-1,1],[1,-1],[1,1]]:[[0,0],[-1,0],[1,0],[0,-1],[0,1]];return dirs.reduce((m,[dx,dy])=>x+dx>=0&&x+dx<4&&y+dy>=0&&y+dy<4?m|1<<((y+dy)*4+x+dx):m,0);});for(let i=0;i<16;i++)for(let j=i+1;j<16;j++)if((masks[i]>>j&1)||(masks[j]>>i&1)){masks[i]|=1<<j;masks[j]|=1<<i;}return masks;}
  function solvePolarity(state,masks){let best=null;const sums=new Uint16Array(65536),counts=new Uint8Array(65536);for(let bits=1;bits<65536;bits++){const bit=bits&-bits,index=31-Math.clz32(bit),rest=bits^bit;sums[bits]=sums[rest]^masks[index];counts[bits]=counts[rest]+1;if(sums[bits]===state&&(!best||counts[bits]<best.length))best=Array.from({length:16},(_,i)=>i).filter(i=>bits>>i&1);}return state===0?[]:best;}
  function polarityPuzzle(stage){const masks=polarityMasks(stage);let seed=1709+stage*733;for(let attempt=0;attempt<100;attempt++){let bits=0;for(let i=0;i<7+stage;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;bits|=1<<(seed>>>16)%16;}let state=0;for(let i=0;i<16;i++)if(bits>>i&1)state^=masks[i];const solution=solvePolarity(state,masks);if(solution&&solution.length>=6+stage)return {state,masks,moves:solution.length+1};}throw Error('No suitable polarity board');}
  return {clamp,angle,segmentDistance,corridorDistance,knightMoves,knightPuzzle,polarityPuzzle,solvePolarity};
}
