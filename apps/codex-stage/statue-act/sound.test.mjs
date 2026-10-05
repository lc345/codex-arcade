import test from 'node:test';
import assert from 'node:assert/strict';
import {createStatueSound} from './sound.js';
test('museum sound is opt-in, bounded, and silenced on stop or disposal',()=>{
  const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
  const node=()=>({connect(){},disconnect(){},start(){},stop(){},frequency:param(),gain:param()});
  class AudioContext {currentTime=1;destination={};resume(){return Promise.resolve();}close(){return Promise.resolve();}createOscillator(){return node();}createGain(){return node();}}
  const s=createStatueSound({AudioContext});s.unlock();s.event({type:'warning'});assert.equal(s.voices(),0);
  s.setMuted(false);s.event({type:'warning'});assert.ok(s.voices()>0);
  for(let i=0;i<100;i++)s.event({type:'step'});assert.ok(s.voices()<=10);
  s.setActive(false);assert.equal(s.voices(),0);s.event({type:'escape'});assert.equal(s.voices(),0);
  s.setActive(true);s.event({type:'pose'});assert.ok(s.voices()>0);s.setMuted(true);assert.equal(s.voices(),0);
  s.dispose();s.setMuted(false);s.event({type:'start'});assert.equal(s.voices(),0);
});
