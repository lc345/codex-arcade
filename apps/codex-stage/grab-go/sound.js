import {ITEMS} from './world.js';
export function createGrabSound({AudioContext}={}){
  let ctx,muted=true,active=true,disposed=false,pulse=-1;const voices=new Set();
  function unlock(){if(disposed)return;try{const C=AudioContext||globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return;ctx??=new C();void ctx.resume().catch(()=>{});}catch{}}
  function stop(){for(const v of voices){try{v.source.stop();}catch{}v.source.disconnect();v.gain.disconnect();}voices.clear();pulse=-1;}
  function tone(f,end,d=.13,volume=.03,delay=0,type='triangle'){
    if(!ctx||muted||!active||disposed||voices.size>=16)return;const source=ctx.createOscillator(),gain=ctx.createGain(),t=ctx.currentTime+delay;
    source.type=type;source.frequency.setValueAtTime(f,t);source.frequency.exponentialRampToValueAtTime(Math.max(30,end),t+d);gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(volume,t+.006);gain.gain.exponentialRampToValueAtTime(.001,t+d);
    source.connect(gain);gain.connect(ctx.destination);const v={source,gain};voices.add(v);source.onended=()=>{source.disconnect();gain.disconnect();voices.delete(v);};source.start(t);source.stop(t+d+.01);
  }
  function event(e){
    if(e.type==='launch'){tone(460,230,.12,.035);tone(150,390,.16,.02,.03);}
    if(e.type==='catch'){tone(940,370,.08,.055);tone(160,110,.12,.025,.03);}
    if(e.type==='blocked'){tone(115,60,.2,.07);tone(710,130,.07,.025);}
    if(e.type==='miss')tone(175,100,.18,.025);
    if(e.type==='delivered'){[660,880,1320].forEach((f,i)=>tone(f,f*.98,.19,.04,i*.07,'sine'));if(e.seconds)tone(1540,1800,.3,.025,.25,'sine');}
    if(e.type==='win')[523,659,784,1047].forEach((f,i)=>tone(f,f,.3,.045,i*.09,'sine'));
    if(e.type==='lose'){tone(310,170,.4,.025);tone(230,115,.4,.02,.15);}
  }
  return {unlock,event,stop,voices:()=>voices.size,
    update(s){if(s.phase!=='playing'||!['out','back'].includes(s.mode)||s.time-pulse<.11)return;pulse=s.time;const carried=s.items.find(i=>i.id===s.grabId),weight=carried?ITEMS[carried.kind].weight:0;const f=weight?160-weight*8:300;tone(f,f*.75,.055,.012);},
    setMuted(v){muted=Boolean(v);if(muted)stop();},setActive(v){active=Boolean(v);if(!active)stop();},dispose(){disposed=true;stop();void ctx?.close().catch(()=>{});},
  };
}
