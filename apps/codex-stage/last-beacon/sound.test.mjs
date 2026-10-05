import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattleSound} from './sound.js';
test('battle audio is opt-in, voice-bounded and silent after stop or disposal',()=>{
  const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}),node=()=>({connect(){},disconnect(){},start(){},stop(){},frequency:param(),gain:param()});
  class AudioContext {currentTime=1;sampleRate=8000;destination={};resume(){return Promise.resolve();}close(){return Promise.resolve();}createOscillator(){return node();}createGain(){return node();}createBiquadFilter(){return node();}createBufferSource(){return node();}createBuffer(_channels,length){return {getChannelData:()=>new Float32Array(length)};}}
  const s=createBattleSound({AudioContext});s.unlock();s.event({type:'shot',weapon:'rifle'});assert.equal(s.voices(),0);s.setMuted(false);s.event({type:'shot',weapon:'rifle'});assert.equal(s.voices(),2);
  for(let i=0;i<60;i++)s.event({type:'shot',weapon:'rifle'});assert.ok(s.voices()<=24);s.setActive(false);assert.equal(s.voices(),0);s.event({type:'win'});assert.equal(s.voices(),0);
  s.setActive(true);s.update({phase:'playing',time:80,player:{speed:4}});assert.ok(s.voices()>0);s.stop();s.update({phase:'playing',time:1,player:{speed:4}});assert.ok(s.voices()>0);
  s.setMuted(true);assert.equal(s.voices(),0);s.dispose();s.setMuted(false);s.event({type:'lose'});assert.equal(s.voices(),0);
});
