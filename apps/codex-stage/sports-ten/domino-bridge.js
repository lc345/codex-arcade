import {Matter as M} from '../vendor/matter.js';
import {createSportsKit} from './physics.js';

export function createDominoWorld(options={}){
  const q=createSportsKit('domino-bridge',options,.0009),{k,s,api,box,body}=q;
  let pieces=[],bridge,bridgeX=610,mode='aim',elapsed=0,fallen=0;
  const width=()=>154-s.stage*12;
  function reset(){bridgeX=610;mode='aim';elapsed=0;fallen=0;box(245,518,410,36,{isStatic:true});box(745,518,390,36,{isStatic:true});bridge=box(bridgeX,510,width(),20,{isStatic:true,friction:.7});
    pieces=Array.from({length:20},(_,i)=>box(160+i*34,467,13,66,{friction:.35,frictionAir:.001,restitution:.04,density:.004}));s.notice='把桥停在缺口，再推倒第一块';}
  q.bind({reset,restoreCompleted(){fallen=20;s.score=200;mode='done';pieces.forEach((b,i)=>{M.Body.setPosition(b,{x:176+i*34,y:490});M.Body.setAngle(b,Math.PI/2);});s.notice='一路倒到终点';},tick(dt){
    if(mode==='aim'){if(s.held){bridgeX=500+Math.sin(s.time*(1.65+s.stage*.2)+1.6)*112;M.Body.setPosition(bridge,{x:bridgeX,y:510});}return;}
    elapsed+=dt;q.step(dt);const count=pieces.filter(p=>Math.abs(p.angle)>.75).length;if(count>fallen){fallen=count;k.event('break',{x:pieces[Math.min(19,fallen)].position.x,y:470});}s.score=fallen*10;
    const last=pieces.at(-1);if(last.angle>.9&&last.position.x>817){k.finish(true,'一路倒到终点');return;}if(elapsed>18)k.finish(false,'连锁在缺口断了');
  },read(){return {pieces:pieces.map(body),bridge:{x:bridgeX,y:510,w:width()},mode,elapsed,fallen,progress:fallen,goal:20};}});
  api.down=p=>k.input(()=>{if(mode!=='aim')return false;s.held=true;},p);api.up=p=>k.input(()=>{if(!s.held||mode!=='aim')return false;s.held=false;mode='fall';elapsed=0;M.Body.setAngularVelocity(pieces[0],.13);M.Body.setVelocity(pieces[0],{x:1.4,y:0});k.event('launch');},p);return api;
}
