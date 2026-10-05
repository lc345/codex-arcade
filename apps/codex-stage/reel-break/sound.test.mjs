import test from 'node:test';
import assert from 'node:assert/strict';
import {createReelSound} from './sound.js';
test('fishing audio is opt-in, bounded and cannot sound after stop or disposal',()=>{
  const param=()=>({value:0,setValueAtTime(){},setTargetAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  const node=()=>({connect(){},disconnect(){},start(){},stop(){},frequency:param(),gain:param()});
  class AudioContext {currentTime=1;sampleRate=22050;destination={};resume(){return Promise.resolve();}close(){return Promise.resolve();}createOscillator(){return node();}createGain(){return node();}createBiquadFilter(){return node();}createBufferSource(){return node();}createBuffer(_c,n){return{getChannelData:()=>new Float32Array(n)};}}
  const sound=createReelSound({AudioContext});sound.unlock();sound.event({type:'hook'});assert.equal(sound.voices(),0);
  sound.setMuted(false);sound.event({type:'splash'});assert.ok(sound.voices()>0);
  for(let i=0;i<100;i++)sound.event({type:'warn'});assert.ok(sound.voices()<=10);
  sound.setActive(false);assert.equal(sound.voices(),0);sound.event({type:'land'});assert.equal(sound.voices(),0);
  sound.setActive(true);sound.event({type:'land'});assert.ok(sound.voices()>0);sound.setMuted(true);assert.equal(sound.voices(),0);
  sound.dispose();sound.setMuted(false);sound.unlock();sound.event({type:'hook'});assert.equal(sound.voices(),0);
});
