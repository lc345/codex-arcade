export function centuryRules(){
  function inside(poly,p){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;}
  function sodaGroup(board,index){const color=board[index];if(color<0||color===undefined)return [];const todo=[index],seen=new Set(todo);while(todo.length){const i=todo.pop(),x=i%6,y=Math.floor(i/6);for(const [a,b] of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const j=b*6+a;if(a>=0&&a<6&&b>=0&&b<5&&!seen.has(j)&&board[j]===color){seen.add(j);todo.push(j);}}}return [...seen];}
  function popSoda(board,group){const out=board.slice();for(const i of group)out[i]=-1;for(let x=0;x<6;x++){const col=[];for(let y=4;y>=0;y--)if(out[y*6+x]>=0)col.push(out[y*6+x]);for(let y=4;y>=0;y--)out[y*6+x]=col[4-y]??-1;}return out;}
  function rotateFour(board,q,turns=1){const out=board.slice(),x=q%2,y=Math.floor(q/2),a=y*3+x,ids=[a,a+1,a+4,a+3];for(let t=0;t<turns;t++){const v=ids.map(i=>out[i]);ids.forEach((i,j)=>out[i]=v[(j+3)%4]);}return out;}
  function crossings(nodes,edges){const hits=[];for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){const [a,b]=edges[i],[u,v]=edges[j];if([a,b].includes(u)||[a,b].includes(v))continue;const p=nodes[a],q=nodes[b],r=nodes[u],s=nodes[v],dx=q.x-p.x,dy=q.y-p.y,ex=s.x-r.x,ey=s.y-r.y,den=dx*ey-dy*ex;if(Math.abs(den)<1e-8){if(linesCross(p,q,r,s))hits.push({x:(p.x+q.x+r.x+s.x)/4,y:(p.y+q.y+r.y+s.y)/4});continue;}const t=((r.x-p.x)*ey-(r.y-p.y)*ex)/den,u2=((r.x-p.x)*dy-(r.y-p.y)*dx)/den;if(t>=0&&t<=1&&u2>=0&&u2<=1)hits.push({x:p.x+t*dx,y:p.y+t*dy});}return hits;}
  return {inside,sodaGroup,popSoda,rotateFour,crossings};
}
import {linesCross} from '../odd-ten/kit.js';
