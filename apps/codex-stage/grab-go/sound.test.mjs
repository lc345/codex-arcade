import test from 'node:test';
import assert from 'node:assert/strict';
import {createGrabSound} from './sound.js';
test('claw sound is opt-in, bounded, and silenced immediately on mute, stop and disposal',()=>{
  const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}),node=()=>({connect(){},disconnect(){},start(){},stop(){},frequency:param(),gain:param()});
  class AudioContext {currentTime=1;destination={};resume(){return Promise.resolve();}close(){return Promise.resolve();}createOscillator(){return node();}createGain(){return node();}}
  const s=createGrabSound({AudioContext});s.unlock();s.event({type:'launch'});assert.equal(s.voices(),0);s.setMuted(false);s.event({type:'launch'});assert.ok(s.voices()>0);
  for(let i=0;i<100;i++)s.event({type:'delivered',value:200});assert.ok(s.voices()<=16);s.setActive(false);assert.equal(s.voices(),0);s.event({type:'win'});assert.equal(s.voices(),0);s.setActive(true);s.event({type:'catch'});assert.ok(s.voices()>0);
  s.setMuted(true);assert.equal(s.voices(),0);s.dispose();s.setMuted(false);s.event({type:'launch'});assert.equal(s.voices(),0);
});
