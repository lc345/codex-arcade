export function createStatueSound({AudioContext}={}){
  let ctx,muted=true,active=true,disposed=false;const voices=new Set();
  function unlock(){if(disposed)return;try{const C=AudioContext||globalThis.AudioContext||globalThis.webkitAudioContext;if(C){ctx??=new C();void ctx.resume().catch(()=>{});}}catch{}}
  function stop(){for(const v of voices){try{v.o.stop();}catch{}v.o.disconnect();v.g.disconnect();}voices.clear();}
  function note(f,end,d=.12,delay=0,volume=.035,type='sine'){if(!ctx||muted||!active||disposed||voices.size>=10)return;const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(end,t+d);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(volume,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(ctx.destination);const v={o,g};voices.add(v);o.onended=()=>{o.disconnect();g.disconnect();voices.delete(v);};o.start(t);o.stop(t+d+.01);}
  function event({type}){
    if(type==='step'){note(150,85,.035,0,.018,'triangle');note(320,170,.024,.018,.009);}
    if(type==='pose')note(820,350,.08,0,.025,'triangle');
    if(type==='warning'){note(310,260,.12,0,.04,'triangle');note(410,340,.15,.16,.035,'triangle');}
    if(type==='safe'){note(520,680,.13,0,.025);note(760,760,.1,.1,.025);}
    if(type==='caught'){note(900,1250,.16,0,.05);note(1250,300,.35,.17,.04);}
    if(type==='escape')for(const [i,f]of [392,494,587,784].entries())note(f,f,.2,i*.09,.035,'triangle');
    if(type==='start')note(370,550,.14,0,.02,'triangle');
  }
  return {unlock,event,stop,setMuted(v){muted=Boolean(v);if(muted)stop();},setActive(v){active=Boolean(v);if(!active)stop();},voices:()=>voices.size,dispose(){disposed=true;stop();void ctx?.close().catch(()=>{});}};
}
