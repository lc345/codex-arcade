export function createVarietySound(id) {
  let ctx,muted=true,disposed=false;const voices=new Set();
  function stop(){for(const o of voices){try{o.stop();}catch{}}voices.clear();}
  function play(type){if(muted||disposed||!type.startsWith("variety-"))return;ctx??=new AudioContext();if(ctx.state!=="running")return;const t=ctx.currentTime;
    function note(f,end,len=.12,delay=0,wave="sine",vol=.025){if(voices.size>=16)return;const o=ctx.createOscillator(),g=ctx.createGain();o.type=wave;o.frequency.setValueAtTime(f,t+delay);o.frequency.exponentialRampToValueAtTime(end,t+delay+len);g.gain.setValueAtTime(0,t);g.gain.setValueAtTime(vol,t+delay);g.gain.exponentialRampToValueAtTime(.0001,t+delay+len);o.connect(g).connect(ctx.destination);voices.add(o);o.onended=()=>{voices.delete(o);o.disconnect();g.disconnect();};o.start(t+delay);o.stop(t+delay+len+.015);}
    if(type==="variety-hit")note(600,160,.05,0,"triangle",.014);
    if(type==="variety-electric")note(970,270,.09,0,"square",.009);
    if(type==="variety-split")note(700,1400,.1);
    if(type==="variety-launch")note(120,480,.14,0,"triangle");
    if(type==="variety-build"){note(660,660,.17);note(990,990,.12,.05);}
    if(type==="variety-undo")note(520,320,.09);
    if(type==="variety-pull")note(95,65,.24,0,"triangle",.045);
    if(type==="variety-delivery"){note(260,120,.08,0,"triangle");note(780,780,.09,.08);}
    if(type==="variety-upgrade")note(500,1500,.22);
    if(type==="variety-fail")note(260,75,.27,0,"triangle");
    if(type==="variety-win")[523,659,784,1046].forEach((f,i)=>note(f,f,.22,i*.085,id==="pocket-town"?"sine":"triangle",.019));
  }
  return{play,stop,setMuted(v){muted=!!v;if(muted)stop();},unlock(){if(muted||disposed)return;ctx??=new AudioContext();ctx.resume().catch(()=>{});},destroy(){if(disposed)return;disposed=true;stop();ctx?.close().catch(()=>{});}};
}
