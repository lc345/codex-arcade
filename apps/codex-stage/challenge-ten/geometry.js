export function splitGlass(poly,a,b){
  const side=p=>(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x),parts=[[],[]];
  for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],u=side(p),v=side(q);parts[u>=0?0:1].push({...p});if(u*v<0){const t=u/(u-v),hit={x:p.x+(q.x-p.x)*t,y:p.y+(q.y-p.y)*t};parts[0].push(hit);parts[1].push({...hit});}}
  return parts;
}
export function glassStrokeCrosses(polygon,a,b){
  const dx=b.x-a.x,dy=b.y-a.y,hits=[];
  for(let i=0;i<polygon.length;i++){
    const p=polygon[i],q=polygon[(i+1)%polygon.length],ex=q.x-p.x,ey=q.y-p.y,cross=dx*ey-dy*ex;
    if(Math.abs(cross)<1e-8)continue;
    const px=p.x-a.x,py=p.y-a.y,t=(px*ey-py*ex)/cross,u=(px*dy-py*dx)/cross;
    if(u>=0&&u<=1&&!hits.some(v=>Math.abs(v-t)<1e-7))hits.push(t);
  }
  return hits.length===2&&Math.min(...hits)>=0&&Math.max(...hits)<=1;
}
