export function extremeBackdrop(id){
  const colors={'razor-wings':['#0b2428','#315448'],'wall-rebound':['#262335','#805374'],'twin-helix':['#ecefe8','#bccac0'],'dash-stitch':['#d8edf0','#9ab7ce'],'cursor-overdrive':['#182522','#708357'],'recoil-pilot':['#18282f','#56717c']},[bg,fg]=colors[id];
  let shapes='';
  if(id==='razor-wings')for(let i=0;i<22;i++){const x=i*53;shapes+=`<path d="M${x} 60 L${x+42} ${170+i%4*35} L${x+69} 60 M${x} 580 L${x+54} ${440-i%4*25} L${x+79} 580" fill="${i%2?'#225044':'#1c3c3c'}" stroke="${fg}"/>`;}
  if(id==='wall-rebound')for(let i=0;i<25;i++)shapes+=`<path d="M0 ${i*30} H960" stroke="${fg}" opacity=".14"/><rect x="${40+i%3*15}" y="${i*30}" width="16" height="18" fill="#ba6b78" opacity=".3"/><rect x="884" y="${i*30}" width="28" height="20" fill="#be846d" opacity=".2"/>`;
  if(id==='twin-helix')for(let i=0;i<12;i++)shapes+=`<path d="M${i*110-90} 60 L${i*110+155} 580" stroke="${fg}" opacity=".38"/><rect x="${40+i%2*770}" y="${100+i*32}" width="40" height="2" fill="#4f6462" opacity=".3"/>`;
  if(id==='dash-stitch')for(let i=0;i<12;i++){const x=i*100;shapes+=`<path d="M${x-60} 580 L${x+15} ${300+i%3*52} L${x+116} 580Z" fill="${i%2?'#b6d9df':'#bedde7'}"/><path d="M${x+15} ${300+i%3*52} L${x+30} 580 L${x+116} 580Z" fill="#9fbccd" opacity=".55"/>`;}
  if(id==='cursor-overdrive')for(let i=0;i<18;i++)shapes+=`<path d="M${i*62-100} 60 l90 35 M${i*62-100} 580 l90 -35" stroke="${fg}" stroke-width="9" opacity=".38"/>`;
  if(id==='recoil-pilot')for(let i=0;i<20;i++)shapes+=`<rect x="${30+i*49}" y="72" width="28" height="6" rx="2" fill="${fg}"/><rect x="${30+i*49}" y="565" width="28" height="3" fill="#ba9865" opacity=".5"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640" viewBox="0 0 960 640"><rect width="960" height="640" fill="${bg}"/>${shapes}</svg>`;
}
