export function gauntletRules(){
  const neighbors=(i,w,h,diagonal=false)=>{const out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy||!diagonal&&Math.abs(dx)+Math.abs(dy)!==1)continue;const x=i%w+dx,y=Math.floor(i/w)+dy;if(x>=0&&x<w&&y>=0&&y<h)out.push(y*w+x);}return out;};
  function beam(mirrors,start,target,w=8,h=6){let {x,y,dx,dy}=start;const points=[{x:x-.8*dx,y:y-.8*dy}],seen=new Set();let hit=false;for(let n=0;n<100;n++){if(x<0||x>=w||y<0||y>=h)break;points.push({x,y});if(x===target.x&&y===target.y){hit=true;break;}const key=[x,y,dx,dy].join();if(seen.has(key))break;seen.add(key);const m=mirrors.find(m=>m.x===x&&m.y===y);if(m){[dx,dy]=m.slash?[-dy,-dx]:[dy,dx];}x+=dx;y+=dy;}points.push({x,y});return {points,hit};}
  function fold(points,axis,line){return [...new Map(points.map(p=>{const q={...p};if(q[axis]<line)q[axis]=2*line-q[axis];return [`${q.x},${q.y}`,q];})).values()];}
  function capture(board,w,h,enemy,path){const next=board.slice();for(const i of path)next[i]=1;const queue=Array.isArray(enemy)?enemy.slice():[enemy];if(queue.some(i=>next[i]))return null;const open=new Set(queue);while(queue.length){const i=queue.pop();for(const j of neighbors(i,w,h))if(!next[j]&&!open.has(j)){open.add(j);queue.push(j);}}return next.map((v,i)=>v||!open.has(i)?1:0);}
  function minePuzzle(stage){const w=6+stage,h=6,n=w*h,mines=Array.from({length:n},(_,i)=>((i*17+stage*11)%23)<4&&i>=w),counts=mines.map((_,i)=>neighbors(i,w,h,true).filter(j=>mines[j]).length),open=mines.map((v,i)=>!v&&(i<w||counts[i]===0));
    const deduce=()=>{const known=new Set(),safe=new Set(open.flatMap((v,i)=>v?[i]:[]));let changed=true;while(changed){changed=false;for(let i=0;i<n;i++){if(!safe.has(i))continue;const around=neighbors(i,w,h,true),unknown=around.filter(j=>!safe.has(j)&&!known.has(j)),need=counts[i]-around.filter(j=>known.has(j)).length;if(!unknown.length)continue;if(need===0)for(const j of unknown){safe.add(j);changed=true;}else if(need===unknown.length)for(const j of unknown){known.add(j);changed=true;}}}return safe;};
    // Add only enough given safe clues to make the deterministic layout guess-free.
    for(let n=0;n<50;n++){const safe=deduce(),left=mines.findIndex((v,i)=>!v&&!safe.has(i));if(left<0)break;open[left]=true;}
    return {w,h,mines,counts,open};
  }
  return {neighbors,beam,fold,capture,minePuzzle};
}
