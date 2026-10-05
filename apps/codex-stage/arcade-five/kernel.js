// Three-round checkpoint contract shared by this reviewed batch, not a community-code sandbox.
export function createFiveKernel(id,{checkpoint,onEvent=()=>{}}={}){
  const s={id,stage:0,phase:'ready',time:0,score:0,held:false,notice:'',lastEvent:null};
  let active=true,disposed=false,acc=0,serial=0,hooks={};
  const valid=checkpoint?.version===1&&checkpoint.id===id&&Number.isInteger(checkpoint.stage)&&checkpoint.stage>=0&&checkpoint.stage<3&&['ready','cleared','won'].includes(checkpoint.phase)&&(checkpoint.phase!=='won'||checkpoint.stage===2);
  function event(type,extra={}){if(!active||disposed)return;s.lastEvent={type,at:s.time,serial:++serial,...extra};onEvent(s.lastEvent);}
  function reset(stage){s.stage=stage;s.phase='ready';s.time=0;s.score=0;s.held=false;s.notice='';s.lastEvent=null;acc=0;hooks.reset?.();}
  const api={
    begin(){if(!active||disposed||s.phase!=='ready')return false;s.phase='playing';event('start');return true;},
    step(ms){if(!active||disposed||s.phase!=='playing'||!Number.isFinite(ms)||ms<=0)return;acc+=Math.min(ms,50);while(acc>=1000/120&&s.phase==='playing'){acc-=1000/120;s.time+=1/120;hooks.tick?.(1/120);}},
    cancel(){s.held=false;hooks.clear?.();},
    retry(){if(!active||disposed)return false;reset(s.stage);return true;},
    next(){if(!active||disposed||s.phase!=='cleared'||s.stage>=2)return false;reset(s.stage+1);return true;},
    restart(){if(!active||disposed)return false;reset(0);return true;},
    snapshot(){return {...s,active,level:s.stage,primaryEnabled:true,abilityAvailable:false,...hooks.read?.(),lastEvent:s.lastEvent?{...s.lastEvent}:null};},
    checkpoint(){return {version:1,id,stage:s.stage,phase:['cleared','won'].includes(s.phase)?s.phase:'ready'};},
    stop(){if(!active)return;api.cancel();active=false;},
    destroy(){if(disposed)return;api.stop();disposed=true;hooks.dispose?.();},
  };
  return {s,api,event,
    configure(value){hooks=value;reset(valid?checkpoint.stage:0);if(valid&&checkpoint.phase!=='ready'){s.phase=checkpoint.phase;hooks.restoreCompleted?.();}},
    input(fn,p){if(!active||disposed||s.phase!=='playing'||p&&(!Number.isFinite(p.x)||!Number.isFinite(p.y)))return false;return fn(p)!==false;},
    finish(won,notice){if(s.phase!=='playing')return;s.held=false;hooks.clear?.();s.phase=won?(s.stage===2?'won':'cleared'):'lost';s.notice=notice;event(won?'win':'lose');},
  };
}
