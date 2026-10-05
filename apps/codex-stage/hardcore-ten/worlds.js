import {createOddKit} from '../odd-ten/kit.js';
import {hardRules} from './rules.js';
import {hardPhysics} from './physics.js';

export function createRatchet(options={}){
  const {k,s,api,bind}=createOddKit('ratchet-vault',options),{angle}=hardRules(),p=hardPhysics();let ball;
  bind({reset(){p.M.Composite.clear(p.engine.world,false);s.goal=6+s.stage*2;s.limit=95;s.catchRadius=[25,20,16][s.stage];s.orbitRadius=48;s.angularSpeed=2.25+s.stage*.15;s.speed=410;s.nodes=Array.from({length:s.goal+1},(_,i)=>({x:150+i*205,y:[370,215,355,185,330,225,365,195,340,205,355][i]}));s.node=0;s.mode='orbit';s.angle=Math.PI/2;s.player={x:150,y:418};s.trail=[];ball=p.disk(150,418,8,{isSensor:true});},
    tick(dt){if(s.mode==='orbit'){s.angle=angle(s.angle+s.angularSpeed*dt);const n=s.nodes[s.node];p.position(ball,n.x+Math.cos(s.angle)*48,n.y+Math.sin(s.angle)*48);}else{p.step(dt);const target=s.nodes[s.node+1];if(Math.hypot(ball.position.x-target.x,ball.position.y-target.y)<s.catchRadius){s.node++;s.progress=s.node;s.score=s.node*100;k.event('catch',{x:480,y:320});if(s.node===s.goal){k.finish(true,'十指没用，一指登顶');return;}s.angle=Math.atan2(ball.position.y-target.y,ball.position.x-target.x);s.mode='orbit';p.velocity(ball,0,0);}else if(s.time-s.launched>1.45){k.finish(false,'差这一点，接力断了');}}s.player={...ball.position};s.camera=Math.max(0,s.player.x-285);s.trail.push({...s.player});if(s.trail.length>30)s.trail.shift();},
    down(){if(s.mode!=='orbit')return false;s.mode='flight';s.launched=s.time;p.velocity(ball,-Math.sin(s.angle)*s.speed,Math.cos(s.angle)*s.speed);k.event('launch');},dispose:p.dispose});return api;
}

export function createHex(options={}){
  const {k,s,api,bind}=createOddKit('hex-panic',options),{angle}=hardRules();
  bind({reset(){s.goal=14+s.stage*4;s.limit=42;s.angle=-Math.PI/2;s.speed=3.4;s.gapWidth=[1.02,.86,.72][s.stage];s.interval=[1.35,1.18,1.04][s.stage];let gap=-1.7;s.rings=Array.from({length:s.goal},(_,i)=>{if(i)gap=angle(gap+[1.6,-1.85,.8,2.1,-1.9,.65,-2.15][(i-1)%7]);return {at:2+i*s.interval,gap,done:false};});},
    tick(dt){s.angle=angle(s.angle+(s.held?-1:1)*s.speed*dt);for(const ring of s.rings){const distance=(ring.at-s.time)*160;if(Math.abs(distance)<16&&Math.abs(angle(s.angle-ring.gap))>s.gapWidth/2-.055){k.finish(false,'红墙擦肩，没有第二条命');return;}if(!ring.done&&distance< -18){ring.done=true;s.progress++;s.score+=100;k.event('catch',{x:480,y:320});}}if(s.progress===s.goal)k.finish(true,'封锁线，全部穿过');},down(){},up(){}});return api;
}

export function createDownshaft(options={}){
  const {k,s,api,bind,clamp}=createOddKit('downshaft',options),p=hardPhysics();let body;
  const gap=g=>g.center+Math.sin(s.time*.85+g.id)*18;
  bind({reset(){p.M.Composite.clear(p.engine.world,false);p.engine.gravity.y=.72;s.goal=6+s.stage*2;s.limit=70;s.opening=[102,86,70][s.stage];s.targetX=480;s.fuel=3;s.brakeAt=-1;s.player={x:480,y:30};s.camera=0;s.gates=Array.from({length:s.goal},(_,i)=>({id:i,y:330+i*300,center:[350,605,370,615,325,550,370,620,380,560][i],done:false}));body=p.disk(480,30,10,{isSensor:true});},
    tick(dt){const vx=clamp((s.targetX-body.position.x)*5,-255,255);p.velocity(body,vx,Math.min(370+s.stage*35,body.velocity.y*60));p.step(dt);s.player={...body.position};s.vy=body.velocity.y*60;s.camera=Math.max(0,s.player.y-250);for(const g of s.gates){g.x=gap(g);if(Math.abs(s.player.y-g.y)<24&&Math.abs(s.player.x-g.x)>s.opening/2-10){k.finish(false,'靴子撞到了断层');return;}if(!g.done&&s.player.y>g.y+28){g.done=true;s.progress++;s.score+=100;s.fuel=3;k.event('catch',{x:s.player.x,y:275});}}if(s.progress===s.goal)k.finish(true,'井底，不是终点，是出口');},
    move(q){s.targetX=clamp(q.x,165,795);},down(q){if(q)s.targetX=clamp(q.x,165,795);if(s.fuel<=0||s.time-s.brakeAt<.28)return false;s.fuel--;s.brakeAt=s.time;p.velocity(body,body.velocity.x*60,45);k.event('launch');},dispose:p.dispose});return api;
}

export function createMagnet(options={}){
  const {k,s,api,bind,clamp}=createOddKit('magnet-suture',options),{corridorDistance}=hardRules(),p=hardPhysics();let body;
  bind({reset(){p.M.Composite.clear(p.engine.world,false);s.path=[{x:120,y:450},{x:290,y:450},{x:290,y:220},{x:490,y:220},{x:490,y:450},{x:730,y:450},{x:730,y:150},{x:842,y:150}];s.halfWidth=[42,34,28][s.stage];s.limit=90-s.stage*8;s.goal=s.path.length-1;s.target={...s.path[0]};s.player={...s.target};s.velocity={x:0,y:0};s.trail=[];body=p.disk(s.player.x,s.player.y,8,{frictionAir:.075,isSensor:true});},
    tick(dt){const dx=clamp(s.target.x-body.position.x,-110,110),dy=clamp(s.target.y-body.position.y,-110,110);p.M.Body.applyForce(body,body.position,{x:dx*body.mass*.000008,y:dy*body.mass*.000008});p.step(dt);s.player={...body.position};s.velocity={x:body.velocity.x*60,y:body.velocity.y*60};s.trail.push({...s.player});if(s.trail.length>25)s.trail.shift();if(corridorDistance(s.player,s.path)>s.halfWidth-8){k.finish(false,'碰壁了，手术重来');return;}const n=s.path[s.progress+1];if(n&&Math.hypot(s.player.x-n.x,s.player.y-n.y)<17){s.progress++;s.score+=100;k.event('catch',{x:n.x,y:n.y});if(s.progress===s.goal)k.finish(true,'穿过全部检查环');}},
    move(q){s.target={x:clamp(q.x,40,920),y:clamp(q.y,80,545)};},dispose:p.dispose});return api;
}

export function createDojo(options={}){
  const {k,s,api,bind}=createOddKit('flash-dojo',options);
  bind({reset(){s.goal=8+s.stage*2;s.limit=40;s.window=[.21,.17,.135][s.stage];s.cursor=0;let t=1.6;s.duels=Array.from({length:s.goal},(_,i)=>{t+=[1.15,1.7,1.35,1.95,.95][i%5];return {at:t,feint:i%3!==0,hit:false};});s.cutAt=-1;},
    tick(){const n=s.duels[s.cursor];s.signal=n&&s.time>=n.at&&s.time<=n.at+s.window?'strike':n&&n.feint&&s.time>=n.at-.65&&s.time<n.at-.43?'feint':'wait';if(n&&s.time>n.at+s.window)k.finish(false,'刀已经落下，慢了一拍');},
    down(){const n=s.duels[s.cursor];if(!n)return false;if(s.time<n.at||s.time>n.at+s.window){k.finish(false,'出刀太早，被佯攻骗到了');return;}n.hit=true;s.cutAt=s.time;s.cursor++;s.progress++;s.score+=100;k.event('break',{x:590,y:320});if(s.progress===s.goal)k.finish(true,'十二分专注，一刀不多');}});return api;
}

export function createRotor(options={}){
  const {k,s,api,bind,clamp}=createOddKit('rotor-courier',options),{corridorDistance}=hardRules(),p=hardPhysics();let rod;
  bind({reset(){p.M.Composite.clear(p.engine.world,false);s.path=[{x:145,y:450},{x:350,y:450},{x:350,y:215},{x:615,y:215},{x:615,y:435},{x:810,y:435}];s.goal=5;s.limit=90;s.halfWidth=[38,32,26][s.stage];s.pocket=76;s.length=102;s.angle=0;s.turnSpeed=.85;s.moveSpeed=300;s.player={...s.path[0]};s.target={...s.player};rod=p.box(s.player.x,s.player.y,s.length,12,{isSensor:true});},
    tick(dt){const dx=s.target.x-s.player.x,dy=s.target.y-s.player.y,d=Math.hypot(dx,dy),speed=Math.min(d,s.moveSpeed*dt);if(d>0)p.position(rod,s.player.x+dx/d*speed,s.player.y+dy/d*speed);s.angle+=s.turnSpeed*dt;p.M.Body.setAngle(rod,s.angle);s.player={...rod.position};for(const v of rod.vertices){if(corridorDistance(v,s.path)>s.halfWidth&&s.path.every(n=>Math.hypot(v.x-n.x,v.y-n.y)>s.pocket)){k.finish(false,'杆尖碰墙，整件退回');return;}}const n=s.path[s.progress+1];if(n&&Math.hypot(s.player.x-n.x,s.player.y-n.y)<12){s.progress++;s.score+=100;k.event('catch',{x:n.x,y:n.y});if(s.progress===s.goal)k.finish(true,'一厘米也没刮到');}},
    move(q){s.target={x:clamp(q.x,50,910),y:clamp(q.y,85,545)};},dispose:p.dispose});return api;
}

export function createKnight(options={}){
  const {k,s,api,bind}=createOddKit('knight-fall',options),{knightPuzzle,knightMoves}=hardRules();
  bind({reset(){Object.assign(s,knightPuzzle(s.stage));s.player=s.start;s.visited=[s.start];s.goal=s.tiles.length;s.progress=1;s.limit=110;s.legal=knightMoves(s.player).filter(i=>s.tiles.includes(i));s.controlPoint={x:306,y:150};},tick(){},
    down(p){const x=Math.round((p.x-306)/87),y=Math.round((p.y-150)/87),i=x+y*5;if(x<0||x>4||y<0||y>4||!s.legal.includes(i))return false;s.player=i;s.visited.push(i);s.progress=s.visited.length;s.score+=100;s.legal=knightMoves(i).filter(j=>s.tiles.includes(j)&&!s.visited.includes(j));k.event('catch',{x:306+x*87,y:150+y*87});if(i===s.exit){k.finish(s.progress===s.goal,s.progress===s.goal?'最后一跳，没有浪费一座桥':'太早到了出口，还有孤岛没走');}else if(!s.legal.length)k.finish(false,'前后都是断桥，无路可走');}});return api;
}

export function createPolarity(options={}){
  const {k,s,api,bind}=createOddKit('polarity-lock',options),{polarityPuzzle}=hardRules();
  bind({reset(){Object.assign(s,polarityPuzzle(s.stage));s.goal=16;s.limit=60-s.stage*5;s.progress=16-s.state.toString(2).replaceAll('0','').length;s.focus=-1;s.controlPoint={x:336,y:180};},tick(){},
    move(p){const x=Math.round((p.x-336)/96),y=Math.round((p.y-180)/96);s.focus=x>=0&&x<4&&y>=0&&y<4?y*4+x:-1;},
    down(p){const x=Math.round((p.x-336)/96),y=Math.round((p.y-180)/96);if(x<0||x>3||y<0||y>3||Math.abs(p.x-(336+x*96))>38||Math.abs(p.y-(180+y*96))>38)return false;const i=y*4+x;s.state^=s.masks[i];s.moves--;s.progress=16-s.state.toString(2).replaceAll('0','').length;s.score=s.progress*100;k.event('ring',{x:p.x,y:p.y});if(!s.state)k.finish(true,'所有灯熄灭，极性归零');else if(s.moves===0)k.finish(false,'开关次数用完，熔炉还亮着');}});return api;
}

export function createDiscs(options={}){
  const {k,s,api,bind,clamp}=createOddKit('disc-vault',options),p=hardPhysics();let player,discs=[];
  const keys=[{x:745,y:170},{x:220,y:455},{x:740,y:460},{x:225,y:165},{x:710,y:315},{x:250,y:320},{x:480,y:475},{x:485,y:150}];
  bind({reset(){p.M.Composite.clear(p.engine.world,false);s.goal=6+s.stage;s.limit=65;s.player={x:480,y:320};s.target={...s.player};s.keys=keys.slice(0,s.goal);s.progress=0;for(const [x,y,w,h]of [[480,92,760,30],[480,548,760,30],[107,320,30,450],[853,320,30,450]])p.box(x,y,w,h,{isStatic:true});player=p.disk(480,320,11,{isSensor:true});discs=Array.from({length:3+s.stage*2},(_,i)=>{const x=[250,705,240,720,390,580,500][i],y=[165,450,430,190,140,495,160][i],b=p.disk(x,y,21,{restitution:1,frictionAir:0});p.velocity(b,Math.cos(i*2.4+.6)*(145+s.stage*28),Math.sin(i*2.4+.6)*(145+s.stage*28));return b;});s.discs=discs.map(b=>({x:b.position.x,y:b.position.y,vx:b.velocity.x*60,vy:b.velocity.y*60,r:21}));},
    tick(dt){const dx=s.target.x-player.position.x,dy=s.target.y-player.position.y,d=Math.hypot(dx,dy),step=Math.min(d,240*dt);if(d)p.position(player,player.position.x+dx/d*step,player.position.y+dy/d*step);p.step(dt);s.player={...player.position};s.discs=discs.map(b=>({x:b.position.x,y:b.position.y,vx:b.velocity.x*60,vy:b.velocity.y*60,r:21}));if(discs.some(b=>p.overlap(player,b))){k.finish(false,'碰到刀盘，钥匙全掉了');return;}const key=s.keys[s.progress];if(key&&Math.hypot(key.x-s.player.x,key.y-s.player.y)<25){s.progress++;s.score+=100;k.event('catch',{x:key.x,y:key.y});if(s.progress===s.goal)k.finish(true,'最后一把钥匙，开门');}},
    move(q){s.target={x:clamp(q.x,139,821),y:clamp(q.y,126,514)};},dispose:p.dispose});return api;
}

export function createEcho(options={}){
  const {k,s,api,bind}=createOddKit('echo-rewind',options);
  bind({reset(){s.sequence=[[0,4,2,7,3,8],[2,6,1,8,4,0,7,3],[4,0,8,2,6,1,5,7,0,3]][s.stage];s.goal=s.sequence.length;s.period=[.64,.58,.52][s.stage];s.revealEnd=1+s.period*s.goal;s.limit=s.revealEnd+25;s.lit=-1;s.mode='show';s.entered=[];s.controlPoint={x:354,y:201};},
    tick(){if(s.time>=s.revealEnd){s.mode='recall';s.lit=-1;}else{const t=s.time-1,index=Math.floor(t/s.period);s.lit=t>=0&&t%s.period<s.period*.62?s.sequence[index]??-1:-1;if(s.lit>=0&&s.previousLit!==s.lit)k.event('ring',{note:s.lit});s.previousLit=s.lit;}},
    down(p){if(s.mode!=='recall')return false;const x=Math.round((p.x-354)/126),y=Math.round((p.y-201)/126);if(x<0||x>2||y<0||y>2||Math.abs(p.x-(354+x*126))>48||Math.abs(p.y-(201+y*126))>48)return false;const i=x+y*3;if(i!==s.sequence[s.goal-1-s.progress]){k.finish(false,'倒带错了一拍，从头记');return;}s.entered.push(i);s.progress++;s.score+=100;k.event('catch',{x:p.x,y:p.y});if(s.progress===s.goal)k.finish(true,'十拍回声，一拍不差');}});return api;
}

export const HARDCORE_WORLDS={'ratchet-vault':createRatchet,'hex-panic':createHex,'downshaft':createDownshaft,'magnet-suture':createMagnet,'flash-dojo':createDojo,'rotor-courier':createRotor,'knight-fall':createKnight,'polarity-lock':createPolarity,'disc-vault':createDiscs,'echo-rewind':createEcho};
