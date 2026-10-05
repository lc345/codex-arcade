// Three original sound palettes. Sources are synthesized locally; there are no recordings or downloads.
export function createContrastSound(id) {
  let context,muted=true,disposed=false;const voices=new Set();
  function stop(){for(const v of voices){try{v.stop();}catch{}}voices.clear();}
  function play(kind){
    if(muted||disposed||voices.size>16)return;context??=new AudioContext();if(context.state!=="running")return;const now=context.currentTime;
    function tone(hz,end,duration,volume,type="sine",delay=0){const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.setValueAtTime(hz,now+delay);o.frequency.exponentialRampToValueAtTime(end,now+delay+duration);g.gain.setValueAtTime(0,now);g.gain.setValueAtTime(volume,now+delay);g.gain.exponentialRampToValueAtTime(.0001,now+delay+duration);o.connect(g).connect(context.destination);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();g.disconnect();};o.start(now+delay);o.stop(now+delay+duration+.01);}
    function grain(duration,frequency,volume,pattern=0){const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*duration),context.sampleRate),data=buffer.getChannelData(0);let seed=971;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const t=i/data.length;data[i]=(seed/2147483648-1)*(1-t)**2*(pattern?(.2+.8*Math.abs(Math.sin(t*pattern))):1);}const o=context.createBufferSource(),f=context.createBiquadFilter(),g=context.createGain();o.buffer=buffer;f.type="bandpass";f.frequency.value=frequency;f.Q.value=.8;g.gain.value=volume;o.connect(f).connect(g).connect(context.destination);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();f.disconnect();g.disconnect();};o.start(now);}
    if(id==="rainline"){
      if(kind==="rain-jump")tone(240,850,.12,.035,"square");
      if(kind==="rain-dash"){grain(.16,3600,.075,22);tone(800,160,.16,.018,"sawtooth");}
      if(kind==="rain-parcel")[784,1175,1568].forEach((hz,i)=>tone(hz,hz,.075,.025,"square",i*.07));
      if(kind==="rain-fall")tone(280,70,.26,.025,"triangle");
      if(kind==="rain-delivered")[523,659,784,1047,1568].forEach((hz,i)=>tone(hz,hz,.18,.03,"square",i*.09));
    }else if(id==="ink-archive"){
      if(kind==="ink-rub")grain(.55,2800,.09,23);
      if(kind==="ink-found"){grain(.18,1900,.08,13);tone(980,980,.21,.009);}
      if(kind==="ink-dial")grain(.036,1200,.1,4);
      if(kind==="ink-wrong")grain(.17,340,.11,5);
      if(kind==="ink-open"){grain(.6,1700,.13,17);tone(120,80,.45,.025);}
    }else{
      if(kind==="lift-step"){grain(.095,410,.13,7);tone(86,48,.065,.02);}
      if(kind==="lift-metal"){grain(.045,4300,.08);[1440,2347,3901].forEach(hz=>tone(hz,hz*.98,.24,.009));}
      if(kind==="lift-locked"){grain(.05,740,.08);tone(92,70,.17,.035,"triangle");}
      if(kind==="lift-power"){grain(.27,420,.07,27);tone(58,116,.7,.025,"sawtooth");}
      if(kind==="lift-door"){grain(1.1,630,.11,12);tone(620,620,.45,.022);tone(465,465,.5,.015,"sine",.15);}
      if(kind==="lift-arrive"){tone(740,740,.65,.035);tone(554,554,.8,.025,"sine",.24);}
    }
  }
  return{play,stop,setMuted(v){muted=Boolean(v);if(muted)stop();},unlock(){if(muted||disposed)return;context??=new AudioContext();context.resume().catch(()=>{});},destroy(){if(disposed)return;disposed=true;stop();context?.close().catch(()=>{});}};
}
