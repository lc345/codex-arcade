export function createReelSound({AudioContext}={}){
  let context,muted=true,active=true,disposed=false,lastClick=-1,noise;
  const voices=new Set();
  const allowed=()=>context&&!muted&&active&&!disposed;
  function unlock(){if(disposed)return;const Constructor=AudioContext||globalThis.AudioContext||globalThis.webkitAudioContext;if(!Constructor)return;try{context??=new Constructor();void context.resume().catch(()=>{});}catch{}}
  function stop(){for(const v of voices){try{v.source.stop();}catch{}v.source.disconnect();v.gain.disconnect();v.filter?.disconnect();}voices.clear();lastClick=-1;}
  function play(start,end,duration,volume=.08,delay=0,type='sine'){
    if(!allowed()||voices.size>=10)return;const source=context.createOscillator(),gain=context.createGain(),t=context.currentTime+delay;
    source.type=type;source.frequency.setValueAtTime(start,t);source.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);
    gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(volume,t+.007);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
    source.connect(gain);gain.connect(context.destination);const v={source,gain};voices.add(v);source.onended=()=>{source.disconnect();gain.disconnect();voices.delete(v);};source.start(t);source.stop(t+duration+.01);
  }
  function splash(){
    if(!allowed()||voices.size>=10)return;
    if(!noise){noise=context.createBuffer(1,context.sampleRate*.5,context.sampleRate);let seed=11;const data=noise.getChannelData(0);for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296-.5)*.8;}}
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain(),t=context.currentTime;source.buffer=noise;filter.type='lowpass';filter.frequency.setValueAtTime(1500,t);filter.frequency.exponentialRampToValueAtTime(180,t+.4);
    gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(.11,t+.035);gain.gain.exponentialRampToValueAtTime(.001,t+.45);
    source.connect(filter);filter.connect(gain);gain.connect(context.destination);const v={source,filter,gain};voices.add(v);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();voices.delete(v);};source.start();source.stop(t+.49);
  }
  function event({type}){
    if(!allowed())return;
    if(type==='hook'){play(360,650,.16);play(740,460,.17,.04,.1);}
    if(type==='warn'){play(680,880,.10,.04);play(680,1050,.13,.04,.16);}
    if(type==='splash')splash();
    if(type==='snap'){play(1500,120,.12,.10,0,'triangle');play(150,65,.25,.05,.1);}
    if(type==='escape'){play(410,220,.3,.055);splash();}
    if(type==='land'){splash();for(const [i,n]of [392,494,587,784].entries())play(n,n,.3,.06,i*.1);}
  }
  return {unlock,event,update(s){
    if(!allowed()||s.phase!=='playing'||!s.held)return;
    const now=Math.floor(s.time*(s.tension>.8?13:9));if(now!==lastClick){lastClick=now;play(700+s.tension*420,220,.028,.015,0,'triangle');}
  },stop,setMuted(v){muted=Boolean(v);if(muted)stop();},setActive(v){active=Boolean(v);if(!active)stop();},dispose(){if(disposed)return;disposed=true;stop();void context?.close().catch(()=>{});},voices:()=>voices.size};
}
