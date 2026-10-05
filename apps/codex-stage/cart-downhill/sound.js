export function createCartSound(){
  let context,muted=true,active=true,rolling=null,buffer=null,closed=false;const voices=new Set();
  const unlock=()=>{if(closed)return;context??=new (window.AudioContext||window.webkitAudioContext)();void context.resume();};
  function stop(){for(const v of voices){try{v.source.stop();}catch{}v.source.disconnect();v.filter?.disconnect();v.gain.disconnect();}voices.clear();rolling=null;}
  function update(speed,braking){
    if(!context||closed||muted||!active)return;
    if(speed<.1){if(rolling){rolling.source.stop();rolling.source.disconnect();rolling.filter.disconnect();rolling.gain.disconnect();voices.delete(rolling);rolling=null;}return;}
    if(!rolling){
      if(!buffer){buffer=context.createBuffer(1,context.sampleRate,context.sampleRate);const data=buffer.getChannelData(0);let seed=37;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296-.5)*.5;}}
      const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=buffer;source.loop=true;filter.type='lowpass';source.connect(filter);filter.connect(gain);gain.connect(context.destination);gain.gain.value=0;rolling={source,filter,gain};voices.add(rolling);source.start();
    }
    rolling.filter.frequency.setValueAtTime(160+speed*55,context.currentTime);rolling.gain.gain.setTargetAtTime(Math.min(.05,speed*.004)*(braking?1.3:1),context.currentTime,.05);
  }
  function event({type,strength=1}){
    if(!context||muted||!active)return;
    const notes={start:[350,550,.18],gate:[520,780,.2],spill:[230,100,.12],crash:[100,36,.22],cake:[150,65,.15],win:[580,920,.4],lose:[190,65,.35],brake:[310,170,.10]};
    const [a,b,d]=notes[type]||notes.spill;if(voices.size>=6)return;
    const source=context.createOscillator(),gain=context.createGain(),t=context.currentTime;
    source.type=type==='crash'?'triangle':'sine';source.frequency.setValueAtTime(a,t);source.frequency.exponentialRampToValueAtTime(b,t+d);
    gain.gain.setValueAtTime(.001,t);gain.gain.linearRampToValueAtTime(.08*strength,t+.012);gain.gain.exponentialRampToValueAtTime(.001,t+d);
    source.connect(gain);gain.connect(context.destination);const v={source,gain};voices.add(v);source.onended=()=>{source.disconnect();gain.disconnect();voices.delete(v);};source.start();source.stop(t+d+.02);
  }
  return {event,update,unlock,setMuted(v){muted=v;if(v)stop();},setActive(v){active=v;if(!v)stop();},stop,dispose(){closed=true;stop();void context?.close();},voices:()=>voices.size};
}
