const obstacles=[];
const box=(id,x,z,w,d,h,kind='barrier')=>obstacles.push({id,x,z,w,d,h,kind});
const buildings=[{x:-23,z:11,w:16,d:18,color:'#c6cec8'},{x:25,z:-19,w:18,d:14,color:'#929f9b'},{x:-27,z:-32,w:13,d:12,color:'#bac7c3'}];
for(const [i,b] of buildings.entries()){
  box(`hall-${i}-west`,b.x-b.w/2,b.z,.45,b.d,4,'wall');
  box(`hall-${i}-east`,b.x+b.w/2,b.z,.45,b.d,4,'wall');
  box(`hall-${i}-back`,b.x,b.z-b.d/2,b.w,.45,4,'wall');
  for(const side of [-1,1])box(`hall-${i}-door-${side}`,b.x+side*(b.w/4+1),b.z+b.d/2,b.w/2-2,.45,4,'wall');
  for(let j=0;j<4;j++)box(`crate-${i}-${j}`,b.x-b.w/2+2+(j%2)*1.4,b.z-b.d/2+2+Math.floor(j/2)*2,1.2,1.1,1.1,'crate');
}
for(const [i,p]of [[-7,25,3,8],[9,17,3,8],[13,2,8,3],[-10,-11,8,3],[33,25,3,8],[-39,-9,3,8],[5,-37,8,3]].entries())box('container-'+i,...p,2.7,'container');
for(const [i,p]of [[-3,37,5,1.2],[12,34,1.2,6],[-12,3,1.2,5],[2,-5,6,1.2],[21,-2,4,1.2],[-27,28,6,1.2],[34,-34,5,1.2]].entries())box('concrete-'+i,...p,1.35,'barrier');
for(const [i,p]of [[-45,25,4,3,2.8],[39,5,5,4,3.2],[-43,-41,6,5,3.8],[25,43,5,4,3.1],[12,-49,5,4,3.3],[-18,43,4,4,2.9]].entries())box('rock-'+i,...p,'rock');
box('tower',3,-24,3,3,5,'tower');
for(const [i,p]of [[-43,2],[36,13],[-10,-44]].entries())box('wreck-'+i,...p,2.4,4.3,2.15,'wreck');
const loot=[
  ['starter','rifle',0,44],['vest','armor',2,44],['first-aid','med',-2,44],
  ['warehouse-gun','rifle',-23,12],['warehouse-ammo','ammo',-27,8],['workshop-gun','scatter',25,-17],
  ['watch-ammo','ammo',2,-19],['west-armor','armor',-30,-30],['west-med','med',-25,-34],
  ['east-med','med',31,26],['east-ammo','ammo',30,30],['south-ammo','ammo',-10,27],
  ['north-ammo','ammo',8,-36],['north-armor','armor',8,-41],['center-med','med',8,-4],
].map(([id,kind,x,z])=>({id,kind,x,z}));
export const BEACON_MAP={radius:62,buildings,obstacles,loot,spawns:[{x:0,z:48},{x:0,z:18},{x:-29,z:15},{x:30,z:-16},{x:-28,z:-34},{x:30,z:32},{x:-41,z:-8},{x:14,z:-43}]};
