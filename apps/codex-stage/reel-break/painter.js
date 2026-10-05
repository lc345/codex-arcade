import {stagePixelRatio} from '../packs/render-budget.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const SPRITES=[[0,480],[480,524],[1004,532]];
export async function createReelPainter(canvas,{signal}={}){
  const ctx=canvas.getContext('2d',{alpha:false}),assets=[];
  async function bitmap(name){const response=await fetch(new URL('./assets/'+name,import.meta.url),{signal});if(!response.ok)throw new Error('Missing local artwork');const img=await createImageBitmap(await response.blob());assets.push(img);if(signal?.aborted)throw new DOMException('Stopped','AbortError');return img;}
  let background,atlas,character;
  try{background=await bitmap('inlet.png');atlas=await bitmap('fish-v2.png');character=await bitmap('angler.png');}catch(error){assets.forEach(a=>a.close());throw error;}
  let disposed=false,frames=0,lastFish=null,lastPhase='',landingStart=0;
  const path=(d,fill,stroke='#1c3936',width=2)=>{const p=new Path2D(d);if(fill){ctx.fillStyle=fill;ctx.fill(p);}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke(p);}};
  const line=(points,color,width=2)=>{ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();};
  const ellipse=(x,y,rx,ry,fill)=>{ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();};
  function angler(x,y,scale,s,t){
    const load=Math.min(1.1,s.tension),lean=load*.10;
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.lineJoin='round';ctx.lineCap='round';
    ctx.rotate(-lean);
    ctx.drawImage(character,-37,-110,74,111);
    ellipse(19,-66,5,5,'#294e44');ellipse(19,-66,3.5,3.5,'#d0cfac');
    const spin=s.held?t*13:0;line([[19,-66],[19+Math.cos(spin)*6,-66+Math.sin(spin)*6]],'#173e34',1.8);
    ctx.restore();
    const base={x:x+(24*Math.cos(lean)-72*Math.sin(lean))*scale,y:y+(-24*Math.sin(lean)-72*Math.cos(lean))*scale},tip={x:x+(99+load*17)*scale,y:y+(-128+load*40)*scale};
    ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.quadraticCurveTo(x+57*scale,y-143*scale,tip.x,tip.y);ctx.strokeStyle='#183e36';ctx.lineWidth=4*scale;ctx.stroke();ctx.strokeStyle='#e5c677';ctx.lineWidth=1.7*scale;ctx.stroke();
    return tip;
  }
  function fish(s,x,y,width,t,reduced){
    const [sy,sh]=SPRITES[s.stage],height=width*sh/atlas.width;
    const active=['surge','dive','turn'].includes(s.move),frequency=active?16:s.move==='tell'?19:4;
    const angle=s.move==='dive'?-.48:s.move==='turn'?Math.sin(s.moveProgress*Math.PI*2)*.35:Math.sin(t*1.4)*.065;
    const facing=s.move==='turn'&&s.moveProgress>.2&&s.moveProgress<.7?-1:1;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(facing,1);
    // Bending strips animate the painted tail without changing the game's line-force rules.
    const strips=24,sw=atlas.width/strips;
    for(let i=0;i<strips;i++){
      const bend=reduced?0:Math.sin(t*frequency-i*.22)*Math.pow(i/strips,2)*height*(active?.1:.045);
      ctx.drawImage(atlas,i*sw,sy,sw,sh,-width/2+i*width/strips,-height/2+bend,width/strips+.6,height);
    }
    ctx.restore();
    const mouths=[[.085,.57],[.085,.60],[.064,.39]],mouth=mouths[s.stage],mx=(mouth[0]-.5)*width*facing,my=(mouth[1]-.5)*height;
    return {x:x+mx*Math.cos(angle)-my*Math.sin(angle),y:y+mx*Math.sin(angle)+my*Math.cos(angle),left:x-width*.59,right:x+width*.59,top:y-height*.72,bottom:y+height*.72};
  }
  function draw(s,{time=0,reduced=false}={}){
    if(disposed)return;frames++;
    const rect=canvas.getBoundingClientRect(),w=Math.max(1,rect.width),h=Math.max(1,rect.height),dpr=stagePixelRatio(canvas);
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    const zoom=Math.max(w/background.width,h/background.height),bw=background.width*zoom,bh=background.height*zoom;
    ctx.drawImage(background,(w-bw)/2,h*.254-bh*.254,bw,bh);
    const water=h*.254,t=reduced?s.time:time,scale=Math.min(w/650,h/550),ax=w*.16,ay=water-3;
    // A short wooden jetty and the angler form a separate animated foreground layer.
    path(`M0 ${water-12} L${w*.3} ${water-8} L${w*.3} ${water+3} L0 ${water+4} Z`,'#2f5748','#193f38',2);
    for(let j=0;j<7;j++)line([[j*w*.045,water-11],[j*w*.045+8,water+1]],'#90a184',1.5);
    for(const x of [w*.075,w*.265]){path(`M${x} ${water} l9 0 l-4 ${h*.12} l-6 0 Z`,'#365e4b',null);line([[x+2,water+10],[x+1,water+h*.1]],'#9ea775',1);}
    const tip=angler(ax,ay,scale,s,t),ratio=clamp((s.distance-1.2)/27,0,1),burst=['surge','dive','turn'].includes(s.move),caught=['caught','won'].includes(s.phase);
    if(s.phase!==lastPhase){lastPhase=s.phase;if(caught)landingStart=time;}
    let fx=w*(.42+ratio*.30)+Math.sin(t*1.5)*(burst?.033:.013)*w,fy=water+h*(.19+ratio*.31)+Math.sin(t*2.1)*h*.008;
    if(s.move==='dive')fy+=Math.sin(s.moveProgress*Math.PI)*h*.04;
    let fw=Math.min(w*.34,h*.46,310)*(s.stage===1?1.05:1);
    if(caught){
      const p=reduced?1:clamp((time-landingStart)/.85,0,1),e=1-(1-p)**3,endWidth=Math.min(w*.16,90);
      fx=fx*(1-e)+w*.263*e;fy=fy*(1-e)+(water-endWidth*.24)*e-Math.sin(p*Math.PI)*h*.15;fw=fw*(1-e)+endWidth*e;
      ellipse(w*.264,water+4,Math.min(w*.085,55),10,'#c4b575');
      ctx.strokeStyle='#3e6149';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(w*.264,water+3,Math.min(w*.085,55),10,0,0,Math.PI*2);ctx.stroke();
    }
    const mouth=fish(s,fx,fy,fw,t,reduced);lastFish={left:mouth.left/w,right:mouth.right/w,top:mouth.top/h,bottom:mouth.bottom/h};
    // Foam trails follow an actual surge; no ambient particle field hides the fish.
    if(burst&&s.phase==='playing')for(let j=0;j<8;j++){
      const q=((t*2+j*.13)%1),bx=fx+fw*.35+q*w*.08,by=fy+Math.sin(j*8.7)*h*.035;
      ctx.globalAlpha=(1-q)*.7;ellipse(bx,by,2+q*3,1.1+q*2,'#f5f6d6');ctx.globalAlpha=1;
    }
    const slack=(1-Math.min(1,s.tension))*(s.held?.03:.14)*h,snap=s.phase==='lost';
    ctx.beginPath();ctx.moveTo(tip.x,tip.y);
    if(snap)ctx.quadraticCurveTo(tip.x+20,water+30,tip.x-12,water+55);
    else ctx.quadraticCurveTo((tip.x+mouth.x)/2,(tip.y+mouth.y)/2+slack,mouth.x,mouth.y);
    ctx.strokeStyle=s.tension>.88?'#f56a4c':'#fcf3c6';ctx.lineWidth=s.tension>.88?2.6:1.65;ctx.stroke();
    if(!snap){ellipse(mouth.x,mouth.y,2.5,2.5,'#f8e6ad');
      const bx=tip.x+(mouth.x-tip.x)*.22,by=water+16;
      ellipse(bx,by,4,7,'#f2e7ac');ellipse(bx,by-3,4,3,'#df5941');
    }
    ctx.strokeStyle='#f9edc3';ctx.lineWidth=1;ctx.globalAlpha=.30;
    for(let j=0;j<4;j++){const wx=w*(.39+j*.17)+Math.sin(t+j)*5;ctx.beginPath();ctx.ellipse(wx,water+3,17+j*3,2.2,0,0,Math.PI);ctx.stroke();}ctx.globalAlpha=1;
    if(s.move==='tell'&&s.phase==='playing'){
      ctx.save();ctx.translate(fx+fw*.18,fy-fw*.30);ctx.rotate(-.12);path('M-9 3 L0 -18 L9 3 Z','#f5da78','#244f43',1.5);ctx.fillStyle='#254d40';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('!',0,0);ctx.restore();
    }
    // Print-style registration marks tie the interface to the illustrated field guide.
    ctx.strokeStyle='#e7edc4';ctx.globalAlpha=.7;ctx.lineWidth=1;
    for(const [x,y,dx,dy]of [[16,h-16,1,-1],[w-16,h-16,-1,-1]])line([[x+dx*12,y],[x,y],[x,y+dy*12]],'#e7edc4',1);ctx.globalAlpha=1;
  }
  return {draw,dispose(){if(disposed)return;disposed=true;assets.forEach(a=>a.close());},diagnostics:()=>({renderer:'canvas2d',frames,assets:assets.length,fishFrame:lastFish})};
}
