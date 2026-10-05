export function createInkWorld(options = {}) {
  const scene={id:"ink-archive",level:0,phase:"playing",time:0,score:0,progress:0,goal:3,lens:{x:190,y:390},holding:false,selected:0,focus:-1,exposure:0,dials:[0,0,0],dial:0,seal:false,flash:0,
    clues:[{x:185,y:389,r:65,label:"停摆的怀表",detail:"指针背面刻着 VII",mark:"VII",digit:7,found:false},{x:507,y:388,r:48,label:"没有门的钥匙",detail:"钥匙的齿数是 II",mark:"II",digit:2,found:false},{x:783,y:424,r:67,label:"窗户的蓝图",detail:"窗棂下藏着 IV",mark:"IV",digit:4,found:false}],
    status:"档案 017 · 午夜书房的三处隐记",primaryLabel:"检视",secondaryLabel:"下一件证物"};
  let active=true,press=null;const emit=type=>{if(active)options.onEvent?.({type});};
  function focus(){scene.focus=scene.clues.findIndex(p=>Math.hypot(p.x-scene.lens.x,p.y-scene.lens.y)<p.r);}
  function expose(){if(!active||scene.seal||scene.phase!=="playing")return false;const p=scene.clues[scene.focus];if(!p||p.found)return false;scene.holding=true;scene.exposure=0;emit("ink-rub");return true;}
  function primary(){if(!active)return false;if(scene.phase==="won")return retry();if(scene.seal){if(scene.dials.every((n,i)=>n===scene.clues[i].digit)){scene.phase="won";scene.status="档案已解封 · 钟声之后，窗外的房间消失了。";scene.score=1000;emit("ink-open");return true;}scene.flash=550;scene.status="封条纹丝不动。三处隐记的顺序：表、钥匙、窗。";emit("ink-wrong");return false;}return expose();}
  function secondary(){if(!active||scene.phase!=="playing")return false;if(scene.seal){scene.dial=(scene.dial+1)%3;}else{scene.selected=(scene.selected+1)%3;const p=scene.clues[scene.selected];scene.lens={x:p.x,y:p.y};scene.holding=false;scene.exposure=0;focus();}return true;}
  function retry(){if(!active)return false;Object.assign(scene,{phase:"playing",time:0,score:0,progress:0,holding:false,selected:0,focus:-1,exposure:0,dials:[0,0,0],dial:0,seal:false,flash:0,status:"档案 017 · 午夜书房的三处隐记",primaryLabel:"检视",secondaryLabel:"下一件证物",lens:{x:190,y:390}});scene.clues.forEach(p=>p.found=false);press=null;focus();return true;}
  function turn(i){scene.dial=i;scene.dials[i]=(scene.dials[i]+1)%10;emit("ink-dial");}
  retry();
  return {scene,effects:[],primary,secondary,retry,
    step(ms){if(!active||!Number.isFinite(ms)||ms<=0)return;const dt=Math.min(ms,50);scene.time+=dt;scene.flash=Math.max(0,scene.flash-dt);if(scene.holding&&scene.focus>=0&&!scene.seal){const p=scene.clues[scene.focus];if(p.found)return;scene.exposure+=dt;if(scene.exposure>=700){p.found=true;scene.holding=false;scene.progress=scene.clues.filter(c=>c.found).length;scene.score=scene.progress*200;scene.status=`${p.label} · ${p.detail}`;emit("ink-found");if(scene.progress===3){scene.seal=true;scene.primaryLabel="揭开封条";scene.secondaryLabel="下一位";scene.status="三件证物已归档，封条等待正确的编号。";}}}},
    pointer(type,x,y){
      if(!active||![x,y].every(Number.isFinite)||x<0||x>960||y<0||y>540)return false;
      if(scene.seal){if(type==="down"){press={x,y};return true;}if(type==="up"&&press){const moved=Math.hypot(x-press.x,y-press.y);press=null;if(moved>20)return false;if(y>310&&y<410&&x>575&&x<845){turn(Math.min(2,Math.floor((x-575)/90)));return true;}if(y>430&&x>555)return primary();}return false;}
      const old=scene.focus;scene.lens={x,y};focus();if(old!==scene.focus){scene.exposure=0;scene.holding=false;}
      if(type==="down"){press={x,y};expose();return true;}if(type==="up"){scene.holding=false;press=null;return true;}return type==="hover"||type==="move";
    },
    key(key,down){if(!active)return false;if(key===" "){if(down)primary();else scene.holding=false;return true;}if(!down)return false;if(key==="Enter")return primary();if(key==="ArrowRight")return secondary();if(key==="ArrowLeft"){if(scene.seal)scene.dial=(scene.dial+2)%3;else{scene.selected=(scene.selected+2)%3;scene.lens={x:scene.clues[scene.selected].x,y:scene.clues[scene.selected].y};focus();}return true;}if(scene.seal&&["ArrowUp","ArrowDown"].includes(key)){scene.dials[scene.dial]=(scene.dials[scene.dial]+(key==="ArrowUp"?1:9))%10;emit("ink-dial");return true;}return false;},
    cancel(){scene.holding=false;press=null;},setLevel(n){return n===0&&retry();},
    snapshot(){return{id:scene.id,level:0,phase:scene.phase,time:scene.time,score:scene.score,progress:scene.progress,goal:3,status:scene.status,abilityAvailable:scene.phase==="playing",seal:scene.seal,dials:scene.dials.join("")};},
    stop(){if(!active)return;scene.holding=false;press=null;active=false;},destroy(){this.stop();},
  };
}
export function paintInk() {}
