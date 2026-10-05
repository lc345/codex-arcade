import test from 'node:test';
import assert from 'node:assert/strict';
import {createFiveRuntime} from './runtime.js';
import {createFiveSound} from './sound.js';
function fixture(t,load,inputMode='tap',pointInput=false){
  const names=['document','window','requestAnimationFrame','cancelAnimationFrame'],saved=Object.fromEntries(names.map(n=>[n,Object.getOwnPropertyDescriptor(globalThis,n)])),frames=new Map();let serial=0;
  const document=new EventTarget();document.hidden=false;Object.assign(globalThis,{document,window:new EventTarget(),requestAnimationFrame:f=>{frames.set(++serial,f);return serial;},cancelAnimationFrame:i=>frames.delete(i)});
  const canvas=new EventTarget();canvas.focus=()=>{};canvas.setPointerCapture=()=>{};
  const stats={paints:0,disposed:0,stopped:0,sound:false,shots:0,moves:0},state={phase:'ready',stage:0,held:false,score:0,time:0,controlPoint:{x:480,y:526}};
  const deps={createWorld:()=>({snapshot:()=>({...state}),begin(){state.phase='playing';},down(){state.held=true;stats.shots++;},up(){state.held=false;},move(){},step(){},cancel(){state.held=false;},stop(){stats.stopped++;},destroy(){},retry(){state.phase='ready';},checkpoint:()=>({version:1,id:'cap-cup',stage:0,phase:'ready'})}),createPainter:async()=>{await load?.();return {draw(){stats.paints++;},point:(x,y)=>({x,y}),dispose(){stats.disposed++;}};},createSound:()=>({setActive:v=>stats.sound=v,setMuted(){},unlock(){},stop(){},dispose(){},update(){},event(){},voices:()=>0})};
  stats.cancels=0;const make=deps.createWorld;deps.createWorld=()=>({...make(),cancel(){stats.cancels++;state.held=false;},move(p){stats.moves++;state.controlPoint={...p};}});
  const r=createFiveRuntime(canvas,{id:'cap-cup',inputMode,pointInput,levels:['one'],goals:['three']},deps);t.after(()=>{r.destroy();for(const [n,d]of Object.entries(saved)){if(d)Object.defineProperty(globalThis,n,d);else delete globalThis[n];}});
  const fire=(type,extra={})=>{const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:1,clientX:300,clientY:220,button:0,...extra});canvas.dispatchEvent(e);};
  return {r,stats,state,frames,fire};
}
test('a cancelled tap cannot launch; ready and paused controls never double as game input',async t=>{const {r,stats,fire}=fixture(t);await r.start();fire('pointerdown');fire('pointerup');assert.equal(stats.shots,0);fire('pointerdown');fire('pointercancel');fire('pointerup');assert.equal(stats.shots,0);fire('pointerdown');fire('pointerup');assert.equal(stats.shots,1);r.setPaused(true);fire('pointerdown');fire('pointerup');assert.equal(stats.shots,1);r.stop();assert.equal(r.input('tap'),false);});
test('late artwork is disposed and cannot paint or play after task completion',async t=>{let resolve;const {r,stats,frames}=fixture(t,()=>new Promise(r=>resolve=r));const p=r.start();r.stop();resolve();await p;assert.equal(stats.paints,0);assert.equal(stats.disposed,1);assert.equal(frames.size,0);assert.equal(stats.sound,false);});
test('a press crossing the finish frame cannot accidentally restart the completed run',async t=>{
  const {r,state,fire}=fixture(t);await r.start();r.input('tap');state.phase='won';
  assert.equal(r.input('tap'),false);fire('pointerdown');fire('pointerup');assert.equal(state.phase,'won');
});
test('normal pointer release does not cancel a tap animation on lost capture',async t=>{
  const {r,stats,fire}=fixture(t);await r.start();r.input('tap');fire('pointerdown');fire('pointerup');const count=stats.cancels;fire('lostpointercapture');assert.equal(stats.cancels,count);
  fire('pointerdown');fire('lostpointercapture');assert.equal(stats.cancels,count+1);
});
test('track games follow mouse and keyboard only while playing and retain touch cancellation',async t=>{
  const {r,stats,state,fire}=fixture(t,null,'track');await r.start();fire('pointermove',{pointerType:'mouse'});assert.equal(stats.moves,0);
  r.input('tap');fire('pointermove',{pointerType:'mouse',clientX:620});assert.equal(state.controlPoint.x,620);
  fire('keydown',{code:'ArrowLeft'});assert.equal(state.controlPoint.x,596);
  const before=stats.moves;fire('pointermove',{pointerType:'touch'});assert.equal(stats.moves,before);
  fire('pointerdown',{pointerType:'touch'});fire('pointermove',{pointerType:'touch',clientX:340});assert.equal(state.controlPoint.x,340);fire('pointercancel');fire('pointermove',{pointerType:'touch'});assert.equal(state.held,false);
  r.setPaused(true);const paused=stats.moves;fire('pointermove',{pointerType:'mouse'});fire('keydown',{code:'ArrowRight'});assert.equal(stats.moves,paused);
});
test('mute, stop and disposal synchronously remove all synthesized voices',()=>{
  const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}),node=()=>({connect(){},disconnect(){},start(){},stop(){},frequency:param(),gain:param()});
  class AudioContext{currentTime=1;destination={};resume(){return Promise.resolve();}close(){return Promise.resolve();}createOscillator(){return node();}createGain(){return node();}}
  for(const id of ['pan-flip','bank-shot','paper-racer','cap-cup','paper-glider']){const sound=createFiveSound(id,{AudioContext});sound.unlock();sound.event({type:'launch'});assert.equal(sound.voices(),0);sound.setMuted(false);for(let i=0;i<30;i++)sound.event({type:'catch'});assert.ok(sound.voices()>0&&sound.voices()<=12);sound.setActive(false);assert.equal(sound.voices(),0);sound.dispose();sound.setActive(true);sound.event({type:'win'});assert.equal(sound.voices(),0);}
});
test('point-input games navigate all four axes without assuming a ball object',async t=>{
  const {r,state,fire}=fixture(t,null,'drag',true);await r.start();r.input('tap');fire('keydown',{code:'ArrowUp'});fire('keydown',{code:'ArrowRight'});assert.deepEqual(state.controlPoint,{x:504,y:502});fire('keydown',{code:'Space'});assert.equal(state.held,true);fire('pointercancel');assert.equal(state.held,false);
});
test('point-input holds follow only their captured pointer and stop on cancellation',async t=>{
  const {r,state,stats,fire}=fixture(t,null,'hold',true);await r.start();r.input('tap');
  fire('pointermove',{clientX:680});assert.equal(stats.moves,0);
  fire('pointerdown');fire('pointermove',{pointerId:2,clientX:680});assert.equal(stats.moves,0);
  fire('pointermove',{clientX:680,clientY:175});assert.deepEqual(state.controlPoint,{x:680,y:175});
  fire('pointercancel');const count=stats.moves;fire('pointermove');assert.equal(stats.moves,count);assert.equal(state.held,false);
  r.stop();fire('pointerdown');fire('pointermove');assert.equal(stats.moves,count);
});
test('legacy non-positional hold games do not gain pointer tracking',async t=>{
  const {r,stats,fire}=fixture(t,null,'hold',false);await r.start();r.input('tap');fire('pointerdown');fire('pointermove',{clientX:680});assert.equal(stats.moves,0);
});
