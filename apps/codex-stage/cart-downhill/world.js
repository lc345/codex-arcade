import {createRapier} from '../vendor/rapier.js';
import {createThree} from '../vendor/three.js';

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), ease=x=>.5-Math.cos(clamp(x,0,1)*Math.PI)/2;
export function roadAt(d){
  const center=6*ease((d-48)/42)-12*ease((d-128)/45)+6*ease((d-208)/34);
  const height=30-.065*Math.min(d,242);
  return {center,height,width:11,district:d<88?0:d<178?1:2};
}
export function createCartWorld({checkpoint=null,onEvent=()=>{}}={}){
  const R=createRapier(), T=createThree(), dt=1/120;
  const valid=checkpoint?.version===1&&Number.isInteger(checkpoint.gate)&&checkpoint.gate>=0&&checkpoint.gate<=2&&Number.isFinite(checkpoint.cake)&&checkpoint.cake>=1&&checkpoint.cake<=100;
  let gate=valid?checkpoint.gate:0, cakeHealth=valid?checkpoint.cake:100;
  let physics,queue,cart,vehicle,cake,active=true,phase='ready',time=0,acc=0,steer=0,braking=false,tipTime=0,away=0,park=0,lastImpact=-5,hit=0,reason='',disposed=false;
  const cargo=[],props=[],traffic=[],cartColliders=new Set();let lostCargo=0,crashes=0;
  const qx=a=>({x:Math.sin(a/2),y:0,z:0,w:Math.cos(a/2)});
  const pose=b=>({p:{...b.translation()},q:{...b.rotation()}});
  const emit=(type,strength=1)=>{if(active)onEvent({type,strength:clamp(strength,0,1)});};
  const cp=()=>({version:1,gate,cake:Math.max(1,Math.round(cakeHealth))});
  function body(kind,x,y,z){return physics.createRigidBody((kind==='fixed'?R.RigidBodyDesc.fixed():kind==='kinematic'?R.RigidBodyDesc.kinematicPositionBased():R.RigidBodyDesc.dynamic()).setTranslation(x,y,z));}
  function box(b,w,h,d,m=0){const c=R.ColliderDesc.cuboid(w/2,h/2,d/2).setFriction(.65).setRestitution(.12);if(m)c.setMass(m);return physics.createCollider(c,b);}
  function load(){
    physics?.free();queue?.free();physics=new R.World({x:0,y:-9.81,z:0});physics.timestep=dt;queue=new R.EventQueue(true);
    cargo.length=props.length=traffic.length=0;cartColliders.clear();phase='ready';time=acc=tipTime=away=park=hit=0;steer=0;braking=false;reason='';crashes=lostCargo=0;lastImpact=-5;
    for(let d=-12;d<290;d+=2){const r=roadAt(d),b=body('fixed',r.center,r.height-.2,-d);b.setRotation(qx(d<242?-.065:0),true);box(b,13,.4,2.02);}
    const spawn=[0,91,180][gate],road=roadAt(spawn);
    cart=body('dynamic',road.center,road.height+.81,-spawn);cart.setLinearDamping(.04);cart.setAngularDamping(1.8);cart.enableCcd(true);
    const base=R.ColliderDesc.cuboid(.64,.12,.87).setMass(22).setFriction(.2).setActiveEvents(R.ActiveEvents.CONTACT_FORCE_EVENTS);
    cartColliders.add(physics.createCollider(base,cart).handle);
    for(const [x,y,z,w,h,d] of [[0,.28,0,1.22,.08,1.6],[-.64,.51,0,.06,.5,1.64],[.64,.51,0,.06,.5,1.64],[0,.51,-.82,1.3,.5,.06],[0,.51,.82,1.3,.5,.06]]){
      const c=physics.createCollider(R.ColliderDesc.cuboid(w/2,h/2,d/2).setTranslation(x,y,z).setMass(.3).setFriction(.45).setActiveEvents(R.ActiveEvents.CONTACT_FORCE_EVENTS),cart);cartColliders.add(c.handle);
    }
    vehicle=physics.createVehicleController(cart);vehicle.indexUpAxis=1;vehicle.setIndexForwardAxis=2;
    for(const z of [-.66,.66])for(const x of [-.65,.65]){
      const i=vehicle.numWheels();vehicle.addWheel({x,y:-.1,z},{x:0,y:-1,z:0},{x:-1,y:0,z:0},.28,.23);
      vehicle.setWheelSuspensionStiffness(i,36);vehicle.setWheelSuspensionCompression(i,4.2);vehicle.setWheelSuspensionRelaxation(i,5.8);vehicle.setWheelMaxSuspensionForce(i,1800);vehicle.setWheelMaxSuspensionTravel(i,.2);vehicle.setWheelFrictionSlip(i,2.2);vehicle.setWheelSideFrictionStiffness(i,1.1);
    }
    const items=[['cake',0,.61,-.22,.4],['box',-.34,.56,.55,.20],['box',.34,.56,.55,.20],['orange',-.34,.95,.55,.15],['orange',.34,.95,.55,.16]];
    for(const [id,x,y,z,r] of items){
      const b=body('dynamic',road.center+x,road.height+.81+y,-spawn+z);b.enableCcd(true);b.setLinearDamping(.12);b.setAngularDamping(.7);
      const desc=id==='orange'?R.ColliderDesc.ball(r):R.ColliderDesc.cuboid(r,id==='cake'?.24:r,r);
      const c=physics.createCollider(desc.setMass(id==='cake'?2.2:.45).setFriction(.42).setRestitution(id==='orange'?.45:.05).setActiveEvents(R.ActiveEvents.CONTACT_FORCE_EVENTS),b);
      cargo.push({id,body:b,collider:c,r,lost:false});if(id==='cake')cake=cargo.at(-1);
    }
    for(const [d,offset,n] of [[32,-2.5,3],[68,3.6,2],[107,-2.2,6],[119,2.6,4],[155,-3.4,5],[212,2.5,4]]){
      const r=roadAt(d);for(let i=0;i<n;i++){
        const isOrange=i%3===2,x=r.center+offset+(i%2)*.64,y=r.height+.32+Math.floor(i/2)*.6,z=-d;
        const b=body('dynamic',x,y,z);const c=isOrange?physics.createCollider(R.ColliderDesc.ball(.27).setMass(.5).setRestitution(.5),b):box(b,.58,.58,.58,2);
        b.setLinearDamping(.1);props.push({id:isOrange?'orange':'crate',body:b,collider:c,r:isOrange?.27:.29});
      }
    }
    for(const [d,offset] of [[137,.2],[194,2.7]]){const r=roadAt(d),b=body('kinematic',r.center+10,r.height+.62,-d);const c=box(b,2.7,1.2,1.6);traffic.push({body:b,collider:c,d,offset});}
    for(const [d,side]of [[104,-1],[118,1],[149,-1],[161,1]]){const r=roadAt(d),b=body('fixed',r.center+side*5.3,r.height+1,-d);box(b,1.4,.28,2.9);}
    // Raised market thresholds create genuine suspension and cargo motion.
    for(const d of [99,166]){const r=roadAt(d),b=body('fixed',r.center,r.height+.035,-d);box(b,10,.07,.75);}
    physics.step(queue);
  }
  function input(value,brake=false){if(!active||disposed||!Number.isFinite(value)||Math.abs(value)>1||!['ready','playing'].includes(phase))return false;if(phase==='ready'){phase='playing';emit('start');}if(brake&&!braking)emit('brake',.5);steer=value;braking=Boolean(brake);return true;}
  function fail(why){if(phase!=='playing')return;phase='lost';reason=why;braking=false;steer=0;emit('lose');}
  function update(){
    if(phase!=='playing')return;time+=dt;hit=Math.max(0,hit-dt);
    const p=cart.translation(),v=cart.linvel(),q=cart.rotation(),r=roadAt(-p.z),up=new T.Vector3(0,1,0).applyQuaternion(q),forward=new T.Vector3(0,0,-1).applyQuaternion(q),speed=Math.hypot(v.x,v.z);
    cart.resetForces(false);cart.resetTorques(false);
    // Modest low-speed assistance avoids stopping on a seam; gravity supplies the descent.
    const assist=braking?0:Math.max(0,1-speed/10)*22;
    cart.addForce({x:forward.x*assist-v.x*.3,y:0,z:forward.z*assist-v.z*.3},true);
    const desired=-steer*.40/(1+speed*.025);
    for(let i=0;i<4;i++){vehicle.setWheelSteering(i,i<2?desired:0);vehicle.setWheelBrake(i,braking?.16:0);}
    vehicle.updateVehicle(dt,R.QueryFilterFlags.EXCLUDE_DYNAMIC,undefined,c=>!cartColliders.has(c.handle));
    for(const t of traffic){const rd=roadAt(t.d),x=rd.center+Math.sin(time*.65+t.offset)*10;t.body.setNextKinematicTranslation({x,y:rd.height+.62,z:-t.d});}
    physics.step(queue);
    queue.drainContactForceEvents(e=>{
      const a=e.collider1(),b=e.collider2(),imp=e.totalForceMagnitude()*dt;
      if((cartColliders.has(a)||cartColliders.has(b))&&time-lastImpact>.45&&imp>3){lastImpact=time;hit=.6;crashes++;emit('crash',Math.max(.3,imp/50));}
      if((a===cake.collider.handle||b===cake.collider.handle)&&imp>5){cakeHealth=clamp(cakeHealth-(imp-5)*.45,0,100);if(time-lastImpact>.2)emit('cake',.5);}
    });
    const after=cart.translation(),d=-after.z,inv=new T.Quaternion(q.x,q.y,q.z,q.w).invert(),cakePos=cake.body.translation();
    for(const item of cargo){const c=item.body.translation(),local=new T.Vector3(c.x-after.x,c.y-after.y,c.z-after.z).applyQuaternion(inv);
      if(!item.lost&&Math.hypot(local.x,local.z)>2.8){item.lost=true;if(item.id!=='cake'){lostCargo++;emit('spill');}}
    }
    away=Math.hypot(cakePos.x-after.x,cakePos.z-after.z)>4?away+dt:0;
    tipTime=up.y<.48?tipTime+dt:Math.max(0,tipTime-dt*2);
    if(tipTime>.6)fail('购物车翻了');
    if(after.y<r.height-3||Math.abs(after.x-r.center)>10)fail('冲出了道路');
    if(away>1.8||cakeHealth<=0||cakePos.y<roadAt(-cakePos.z).height-.7)fail('蛋糕没保住');
    if(d>281)fail('错过了派对');
    if(d>91&&gate===0&&Math.abs(after.x-roadAt(d).center)<4){gate=1;emit('gate');}
    if(d>180&&gate===1&&Math.abs(after.x-roadAt(d).center)<4){gate=2;emit('gate');}
    const atBay=d>254&&d<271&&Math.abs(after.x-roadAt(d).center)<2.3&&speed<2.2&&away===0;
    park=atBay?park+dt:0;
    if(park>.65&&phase==='playing'){phase='won';steer=0;braking=false;reason='蛋糕送到了';emit('win');}
  }
  function snapshot(){const p=cart.translation(),v=cart.linvel(),up=new T.Vector3(0,1,0).applyQuaternion(cart.rotation()),d=Math.max(0,-p.z);return {active,phase,time,distance:d,speed:Math.hypot(v.x,v.z),x:p.x,offset:p.x-roadAt(d).center,heading:Math.atan2(-2*(cart.rotation().x*cart.rotation().z+cart.rotation().w*cart.rotation().y),1-2*(cart.rotation().x**2+cart.rotation().y**2)),steer,braking,cake:Math.round(cakeHealth),gate,district:roadAt(d).district,tilt:Math.acos(clamp(up.y,-1,1)),lostCargo,crashes,hit,reason,park};}
  load();
  return {input,cancel(){steer=0;braking=false;},step(ms){if(!active||disposed||!Number.isFinite(ms)||ms<=0||phase!=='playing')return;acc+=Math.min(ms,50)/1000;while(acc>=dt){acc-=dt;update();}},snapshot,checkpoint:cp,
    state(){return {...snapshot(),cart:pose(cart),wheels:Array.from({length:4},(_,i)=>({length:vehicle.wheelSuspensionLength(i),rotation:vehicle.wheelRotation(i),steer:vehicle.wheelSteering(i),contact:vehicle.wheelIsInContact(i)})),cargo:cargo.map(c=>({id:c.id,r:c.r,lost:c.lost,...pose(c.body)})),props:props.map(c=>({id:c.id,r:c.r,...pose(c.body)})),traffic:traffic.map(c=>({...pose(c.body),d:c.d}))};},
    stop(){active=false;steer=0;braking=false;},resume(){if(disposed)return;active=true;load();},retry(){if(!active||disposed)return false;cakeHealth=100;load();return true;},destroy(){if(disposed)return;active=false;disposed=true;physics.free();queue.free();},
  };
}
