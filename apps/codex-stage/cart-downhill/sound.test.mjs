import test from 'node:test';
import assert from 'node:assert/strict';
import {createCartSound} from './sound.js';
test('rolling sound is local, opt-in and synchronously silent after stop',()=>{
  const node=()=>({connect(){},disconnect(){},start(){},stop(){},frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},gain:{value:0,setTargetAtTime(){},setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}});
  class Context {currentTime=0;sampleRate=22050;destination={};resume(){return Promise.resolve();}close(){return Promise.resolve();}createOscillator(){return node();}createGain(){return node();}createBuffer(_c,n){return{getChannelData:()=>new Float32Array(n)};}createBufferSource(){return node();}createBiquadFilter(){return node();}}
  globalThis.window={AudioContext:Context};const sound=createCartSound();sound.unlock();sound.update(5,false);assert.equal(sound.voices(),0);sound.setMuted(false);sound.update(5,false);assert.ok(sound.voices()>0);sound.event({type:'win'});sound.update(0,false);assert.equal(sound.voices(),1,'game result stops rolling but preserves its short chime');sound.setActive(false);assert.equal(sound.voices(),0);sound.update(7,true);assert.equal(sound.voices(),0);sound.dispose();delete globalThis.window;
});
