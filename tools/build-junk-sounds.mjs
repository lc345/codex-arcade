import { mkdir, writeFile } from "node:fs/promises";
const dir = new URL("../games/junk-champion/assets/", import.meta.url); await mkdir(dir,{recursive:true});
const rate=22050;
for(const name of ["punch","block","parry","hurt","break","bell","swoosh"]){
  const duration=name==="bell"?.75:name==="parry"?.4:.22, count=Math.ceil(duration*rate), data=Buffer.alloc(44+count*2);
  data.write("RIFF");data.writeUInt32LE(36+count*2,4);data.write("WAVEfmt ",8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*2,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write("data",36);data.writeUInt32LE(count*2,40);
  let seed=17,low=0;
  for(let i=0;i<count;i++){
    const t=i/rate;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/2147483648-1;low=low*.76+noise*.24;
    let sample;
    if(name==="bell"||name==="parry"){const f=name==="bell"?680:980;sample=[1,2.71,4.12].reduce((sum,m,k)=>sum+Math.sin(t*f*m*Math.PI*2)*Math.exp(-t*(6+k*9))/(k+2),0);}
    else if(name==="swoosh")sample=(noise-low)*Math.sin(Math.PI*t/duration)*.24;
    else {const metal=name==="block"?310:name==="break"?130:name==="hurt"?66:95;sample=(low*.9+Math.sin(2*Math.PI*(metal*t-100*t*t))*.5+Math.sin(2*Math.PI*metal*3.43*t)*.12)*Math.exp(-t*(name==="break"?16:26));}
    sample*=Math.min(1,t/.003);data.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample))*.68*32767),44+i*2);
  }
  await writeFile(new URL(name+".wav",dir),data);
}
console.log("Built 7 original local sound samples");
