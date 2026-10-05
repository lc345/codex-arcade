export function createFiveSound(id,{AudioContext,palette:customPalette}={}){
  let ctx,muted=true,active=true,disposed=false,pulse=-1;const voices=new Set();
  const palette=customPalette||{'pan-flip':[260,'triangle'],'bank-shot':[1180,'sine'],'paper-racer':[145,'sawtooth'],'cap-cup':[820,'sine'],'paper-glider':[440,'sine']}[id]||[440,'triangle'];
  function unlock(){if(disposed)return;try{const C=AudioContext||globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return;ctx??=new C();void ctx.resume().catch(()=>{});}catch{}}
  function stop(){for(const v of voices){try{v.o.stop();}catch{}v.o.disconnect();v.g.disconnect();}voices.clear();pulse=-1;}
  function tone(f,end,d=.15,volume=.03,delay=0,type=palette[1]){
    if(!ctx||muted||!active||disposed||voices.size>=12)return;const o=ctx.createOscillator(),g=ctx.createGain(),t=ctx.currentTime+delay;o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(Math.max(25,end),t+d);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(volume,t+.006);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(ctx.destination);const v={o,g};voices.add(v);o.onended=()=>{o.disconnect();g.disconnect();voices.delete(v);};o.start(t);o.stop(t+d+.01);
  }
  function event(e){const f=palette[0];if(e.type==='impact')tone(f,f*.55,.055,.028);if(e.type==='launch'){tone(f,f*1.9,.12,.035);tone(f*.5,f*.7,.1,.02,.02);}if(['break','catch','ring'].includes(e.type)){tone(f*1.5,f*1.48,.17,.04);tone(f*2.1,f*2,.12,.025,.04);}if(['hit','miss'].includes(e.type))tone(165,45,.2,.05,0,'triangle');if(e.type==='win')[1,1.25,1.5,2].forEach((v,i)=>tone(440*v,440*v,.28,.035,i*.085,'sine'));if(e.type==='lose'){tone(310,150,.3,.04);tone(230,95,.3,.025,.12);}}
  return {unlock,event,stop,voices:()=>voices.size,
    update(s){if(s.phase!=='playing'||s.time-pulse<.19)return;pulse=s.time;if(id==='pan-flip'&&!s.airborne)tone(2100+Math.sin(s.time*11)*650,320,.045,.006,0,'triangle');if(id==='paper-racer')tone(95+(s.held?18:0),80,.07,.008,0,'sawtooth');if(id==='paper-glider'&&s.held)tone(390,460,.18,.004,0,'sine');},
    setMuted(v){muted=Boolean(v);if(muted)stop();},setActive(v){active=Boolean(v);if(!active)stop();},dispose(){if(disposed)return;disposed=true;stop();void ctx?.close().catch(()=>{});},
  };
}
