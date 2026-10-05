export function createReturnSound({AudioContext}={}) {
  let context,muted=true,active=true,disposed=false,noise;
  const voices=new Set();
  const allowed=()=>context&&!muted&&active&&!disposed;
  function unlock(){if(disposed)return;try{const C=AudioContext||globalThis.AudioContext||globalThis.webkitAudioContext;if(!C)return;context??=new C();void context.resume().catch(()=>{});}catch{}}
  function stop(){for(const v of voices){try{v.source.stop();}catch{}v.source.disconnect();v.gain.disconnect();}voices.clear();}
  function tone(from,to,duration,volume=.035,delay=0,type='square'){
    if(!allowed()||voices.size>=14)return;
    const source=context.createOscillator(),gain=context.createGain(),t=context.currentTime+delay;
    source.type=type;source.frequency.setValueAtTime(from,t);source.frequency.exponentialRampToValueAtTime(Math.max(20,to),t+duration);
    gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(volume,t+.008);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
    source.connect(gain);gain.connect(context.destination);const v={source,gain};voices.add(v);
    source.onended=()=>{source.disconnect();gain.disconnect();voices.delete(v);};source.start(t);source.stop(t+duration+.02);
  }
  function crash(){
    if(!allowed()||voices.size>=14)return;
    if(!noise){noise=context.createBuffer(1,context.sampleRate*.4,context.sampleRate);const a=noise.getChannelData(0);let seed=7;for(let n=0;n<a.length;n++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;a[n]=(seed/4294967296-.5)*.5;}}
    const source=context.createBufferSource(),gain=context.createGain(),t=context.currentTime;source.buffer=noise;gain.gain.setValueAtTime(.15,t);gain.gain.exponentialRampToValueAtTime(.001,t+.4);source.connect(gain);gain.connect(context.destination);
    const v={source,gain};voices.add(v);source.onended=()=>{source.disconnect();gain.disconnect();voices.delete(v);};source.start();source.stop(t+.42);
  }
  function event({type,count=1}){
    if(!allowed())return;
    if(type==='absorb')tone(430+count*85,750+count*100,.065,.023,0,'triangle');
    if(type==='release'){tone(160+count*30,50,.22,.07,0,'sawtooth');tone(880,180,.12,.035);}
    if(type==='enemy')tone(100,50,.055,.009,0,'triangle');
    if(type==='impact')tone(130,45,.065,.035,0,'triangle');
    if(type==='warning'){tone(660,660,.1,.025);tone(440,440,.12,.025,.17);}
    if(type==='overload'||type==='hurt'){tone(180,65,.2,.045,0,'sawtooth');crash();}
    if(type==='break'){crash();tone(70,25,.45,.09,0,'triangle');tone(262,524,.22,.025,.3);}
    if(type==='start'||type==='phase'){tone(220,440,.13);tone(440,880,.18,.035,.15);}
    if(type==='win'){crash();for(const [n,f] of [262,330,392,523,784].entries())tone(f,f,.24,.03,n*.11,'triangle');}
    if(type==='lose')tone(240,40,.55,.04,0,'triangle');
  }
  return {unlock,event,stop,setMuted(v){muted=Boolean(v);if(muted)stop();},setActive(v){active=Boolean(v);if(!active)stop();},dispose(){if(disposed)return;disposed=true;stop();void context?.close().catch(()=>{});},voices:()=>voices.size};
}
