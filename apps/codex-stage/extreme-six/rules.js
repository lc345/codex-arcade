export function extremeRules(){
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function waveY(points,x){let i=0;while(i<points.length-2&&x>points[i+1].x)i++;const a=points[i],b=points[i+1];return a.y+(b.y-a.y)*clamp((x-a.x)/(b.x-a.x),0,1);}
  function sliderPoint(note,t){const u=clamp(t,0,1),v=1-u;return {x:v*v*note.a.x+2*v*u*note.b.x+u*u*note.c.x,y:v*v*note.a.y+2*v*u*note.b.y+u*u*note.c.y};}
  function dashNode(n,t){return {x:n.x,y:n.y+Math.sin(t*2.2+n.phase)*n.amplitude};}
  function slitRects(angle,width){const offset=Math.abs(Math.cos(angle)*86),holes=offset<width/2?[{a:480-width/2,b:480+width/2}]:[{a:480-offset-width/2,b:480-offset+width/2},{a:480+offset-width/2,b:480+offset+width/2}];let x=310;const rects=[];for(const h of holes){if(h.a>x)rects.push({x,w:h.a-x});x=h.b;}if(x<650)rects.push({x,w:650-x});return rects;}
  return {clamp,waveY,sliderPoint,dashNode,slitRects};
}
