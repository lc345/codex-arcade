import test from 'node:test';
import assert from 'node:assert/strict';
import {createReturnSound} from './sound.js';
test('arcade sound is opt-in, bounded and stopped synchronously',()=>{
  const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  const node=()=>({connect(){},disconnect(){},start(){},stop(){},frequency:param(),gain:param()});
  class AudioContext {currentTime=1;sampleRate=22050;destination={};resume(){return Promise.resolve();}close(){return Promise.resolve();}createOscillator(){return node();}createGain(){return node();}createBufferSource(){return node();}createBuffer(_c,n){return{getChannelData:()=>new Float32Array(n)};}}
  const s=createReturnSound({AudioContext});s.unlock();s.event({type:'absorb',count:4});assert.equal(s.voices(),0);
  s.setMuted(false);s.event({type:'release',count:6});assert.ok(s.voices()>0);
  for(let n=0;n<100;n++)s.event({type:'absorb',count:9});assert.ok(s.voices()<=14);
  s.setActive(false);assert.equal(s.voices(),0);s.event({type:'win'});assert.equal(s.voices(),0);
  s.setActive(true);s.event({type:'break'});assert.ok(s.voices()>0);s.setMuted(true);assert.equal(s.voices(),0);
  s.dispose();s.setMuted(false);s.event({type:'start'});assert.equal(s.voices(),0);
});
