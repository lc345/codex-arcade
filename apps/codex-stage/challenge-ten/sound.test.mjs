import test from 'node:test';
import assert from 'node:assert/strict';
import {createFiveSound} from '../arcade-five/sound.js';
import {CHALLENGE_CATALOG} from './catalog.js';
test('all ten sound palettes are silent by default, bounded and synchronously stoppable',()=>{
  const param=()=>({setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}}),node=()=>({frequency:param(),gain:param(),connect(){},disconnect(){},start(){},stop(){}});
  class AudioContext{currentTime=1;destination={};resume(){return Promise.resolve();}close(){return Promise.resolve();}createOscillator(){return node();}createGain(){return node();}}
  for(const g of CHALLENGE_CATALOG){const s=createFiveSound(g.id,{AudioContext,palette:g.sound});s.unlock();s.event({type:'launch'});assert.equal(s.voices(),0);s.setMuted(false);for(let i=0;i<30;i++)s.event({type:'catch'});assert.ok(s.voices()>0&&s.voices()<=12);s.setMuted(true);assert.equal(s.voices(),0);s.setMuted(false);s.event({type:'win'});assert.ok(s.voices()>0);s.setActive(false);assert.equal(s.voices(),0);s.event({type:'launch'});assert.equal(s.voices(),0);s.dispose();s.setActive(true);s.event({type:'win'});assert.equal(s.voices(),0);}
});
