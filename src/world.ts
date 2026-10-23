import {artUrl} from './assets';
import {type Level,type Mechanism,type Target,worldSize} from './levels';
export type WorldEvent={type:'find';index:number;x:number;y:number}|{type:'mechanism';id:string;message:string}|{type:'notice';message:string}|{type:'miss';x:number;y:number};
interface Particle {x:number;y:number;vx:number;vy:number;life:number;max:number;color:string;size:number}
const TAU=Math.PI*2;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export class World {
 readonly canvas:HTMLCanvasElement;
 private ctx:CanvasRenderingContext2D;
 private image:HTMLImageElement|null=null;
 private images=new Map<string,Promise<HTMLImageElement>>();
 level!:Level;
 found=new Set<number>();gates=new Set<string>();phase=0;weather=0;
 zoom=1;panX=0;panY=0;paused=false;reducedMotion=false;
 private width=390;private height=580;private scale=1;private offsetX=0;private offsetY=0;
 private pointers=new Map<number,{x:number;y:number}>();private start={x:0,y:0};private last={x:0,y:0};private dragged=false;private pinched=false;private pinchDistance=0;private rubbing=false;private draggingMechanism:string|null=null;private fogProgress=0;private starBits=new Set<number>();
 private particles:Particle[]=[];private pops:{x:number;y:number;t:number;color:string}[]=[];private hintIndex=-1;private hintUntil=0;private clock=0;private lastFrame=0;private shake=0;private destroyed=false;
 private gateTimes=new Map<string,number>();private resizeObserver:ResizeObserver;
 onEvent:(e:WorldEvent)=>void=()=>{};
 constructor(canvas:HTMLCanvasElement){
  this.canvas=canvas;this.ctx=canvas.getContext('2d')!;
  this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(canvas);
  canvas.addEventListener('pointerdown',this.down);canvas.addEventListener('pointermove',this.move);canvas.addEventListener('pointerup',this.up);canvas.addEventListener('pointercancel',this.cancel);
  canvas.addEventListener('wheel',e=>{e.preventDefault();if(!this.paused)this.zoomAt(e.offsetX,e.offsetY,this.zoom*Math.exp(-e.deltaY*.0015))},{passive:false});
  canvas.addEventListener('dblclick',e=>{if(!this.paused)this.zoomAt(e.offsetX,e.offsetY,this.zoom>1.6?1:2)});
  requestAnimationFrame(this.frame);
 }
 preload(id:string){if(!this.images.has(id))this.images.set(id,new Promise<HTMLImageElement>((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{this.images.delete(id);reject(new Error('The illustration could not load. Please refresh.'))};im.src=artUrl(id);}));return this.images.get(id)!;}
 async setLevel(level:Level){this.level=level;this.image=null;this.found.clear();this.gates.clear();this.gateTimes.clear();this.starBits.clear();this.fogProgress=0;this.phase=0;this.weather=0;this.hintIndex=-1;this.particles=[];this.pops=[];this.reset();const id=level.id;const image=await this.preload(id);if(this.level.id===id)this.image=image;}
 reset(){this.zoom=1;this.panX=0;this.panY=0;this.shake=0;this.updateCamera();}
 resize(){const r=this.canvas.getBoundingClientRect();this.width=r.width;this.height=r.height;const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.width*dpr);this.canvas.height=Math.round(this.height*dpr);this.updateCamera();}
 private updateCamera(){this.scale=Math.max(this.width/worldSize.width,this.height/worldSize.height)*this.zoom;const excessX=Math.max(0,(worldSize.width*this.scale-this.width)/2),excessY=Math.max(0,(worldSize.height*this.scale-this.height)/2);this.panX=clamp(this.panX,-excessX,excessX);this.panY=clamp(this.panY,-excessY,excessY);this.offsetX=(this.width-worldSize.width*this.scale)/2+this.panX;this.offsetY=(this.height-worldSize.height*this.scale)/2+this.panY;}
 screenToWorld(x:number,y:number){return{x:(x-this.offsetX)/this.scale,y:(y-this.offsetY)/this.scale};}
 worldToScreen(x:number,y:number){return{x:x*this.scale+this.offsetX,y:y*this.scale+this.offsetY};}
 zoomAt(x:number,y:number,value:number){const before=this.screenToWorld(x,y);this.zoom=clamp(value,1,3);this.updateCamera();const after=this.worldToScreen(before.x,before.y);this.panX+=x-after.x;this.panY+=y-after.y;this.updateCamera();}
 zoomIn(){this.zoomAt(this.width/2,this.height/2,this.zoom*1.35);}
 visible(t:Target){if(!t.requires)return true;if(t.requires.startsWith('phase:'))return this.phase===Number(t.requires.split(':')[1]);if(t.requires.startsWith('weather:'))return this.weather===Number(t.requires.split(':')[1]);return this.gates.has(t.requires);}
 private position(e:PointerEvent){const r=this.canvas.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
 private down=(e:PointerEvent)=>{
  if(this.paused||!this.level)return;e.preventDefault();this.canvas.setPointerCapture(e.pointerId);const p=this.position(e);this.pointers.set(e.pointerId,p);
  if(this.pointers.size===1){this.start=this.last=p;this.dragged=false;this.pinched=false;const w=this.screenToWorld(p.x,p.y);this.rubbing=this.level.mechanisms.some(m=>m.kind==='fog'&&!this.gates.has(m.id)&&this.inside(m,w.x,w.y));this.draggingMechanism=this.level.mechanisms.find(m=>['crate','telescope','valve'].includes(m.kind)&&!this.gates.has(m.id)&&this.inside(m,w.x,w.y))?.id??null;}
  if(this.pointers.size===2){this.pinched=true;this.rubbing=false;this.draggingMechanism=null;const [a,b]=[...this.pointers.values()];this.pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);}
 };
 private move=(e:PointerEvent)=>{
  if(!this.pointers.has(e.pointerId)||this.paused)return;const p=this.position(e);this.pointers.set(e.pointerId,p);
  if(this.pointers.size===2){const [a,b]=[...this.pointers.values()];const distance=Math.hypot(a.x-b.x,a.y-b.y);if(this.pinchDistance>0)this.zoomAt((a.x+b.x)/2,(a.y+b.y)/2,this.zoom*distance/this.pinchDistance);this.pinchDistance=distance;this.dragged=true;return;}
  if(this.pointers.size!==1)return;
  const dx=p.x-this.last.x,dy=p.y-this.last.y;if(Math.hypot(p.x-this.start.x,p.y-this.start.y)>6)this.dragged=true;
  if(this.rubbing&&this.dragged){this.fogProgress=clamp(this.fogProgress+Math.hypot(dx,dy)/180,0,1);if(this.fogProgress>=1){this.activate('mist');this.rubbing=false;}}
  else if(this.draggingMechanism&&this.dragged){if(Math.hypot(p.x-this.start.x,p.y-this.start.y)>32){this.activate(this.draggingMechanism);this.draggingMechanism=null;}}
  else if(this.dragged){this.panX+=dx;this.panY+=dy;this.updateCamera();}
  this.last=p;
 };
 private up=(e:PointerEvent)=>{if(!this.pointers.has(e.pointerId))return;const p=this.position(e);this.pointers.delete(e.pointerId);if(!this.paused&&!this.dragged&&!this.pinched)this.tap(p.x,p.y);if(this.pointers.size===0){this.pinched=false;this.rubbing=false;}};
 private cancel=(e:PointerEvent)=>{this.pointers.delete(e.pointerId);this.dragged=true;this.rubbing=false;};
 private inside(m:Mechanism,x:number,y:number){return Math.abs(x-m.x)<m.w*.62&&Math.abs(y-m.y)<m.h*.65;}
 tap(x:number,y:number){
  if(this.paused||!this.level)return;const w=this.screenToWorld(x,y);let nearest=-1,dist=Infinity;
  this.level.targets.forEach((t,i)=>{if(this.found.has(i)||!this.visible(t))return;const d=Math.hypot(w.x-t.x,w.y-t.y);if(d<dist){dist=d;nearest=i;}});
  const radius=clamp(22/this.scale,34,64);
  if(nearest>=0&&dist<radius){this.collect(nearest);return;}
  for(const m of this.level.mechanisms){if(!this.gates.has(m.id)&&this.inside(m,w.x,w.y)){
   if(m.kind==='fog'){this.onEvent({type:'notice',message:'Swipe across the misted glass to wipe it clear.'});return;}
   if(m.kind==='stars'){const points=this.starPoints(m);let bit=0,min=Infinity;points.forEach((p,i)=>{const d=Math.hypot(w.x-p.x,w.y-p.y);if(d<min){min=d;bit=i;}});this.starBits.add(bit);const p=points[bit];this.burst(p.x,p.y,'#f9e1a1',12);if(this.starBits.size<3){this.onEvent({type:'notice',message:`A little constellation… ${this.starBits.size} / 3 stars`});return;}}
   this.activate(m.id);return;
  }}
  this.pops.push({x:w.x,y:w.y,t:this.clock,color:'#fff8e8'});this.onEvent({type:'miss',x,y});
 }
 activate(id:string){if(this.gates.has(id))return;const m=this.level.mechanisms.find(m=>m.id===id);if(!m)return;this.gates.add(id);this.gateTimes.set(id,this.clock);this.burst(m.x,m.y,'#f6dfab',14);this.onEvent({type:'mechanism',id,message:m.message});}
 private collect(index:number){if(this.found.has(index))return;this.found.add(index);const t=this.level.targets[index];this.burst(t.x,t.y,['#eab578','#78a991','#db9991','#f6e0a3'][index%4],32);this.pops.push({x:t.x,y:t.y,t:this.clock,color:'#fff1b6'});if(!this.reducedMotion)this.shake=3;const p=this.worldToScreen(t.x,t.y);this.onEvent({type:'find',index,x:p.x,y:p.y});}
 hint(index:number){this.hintIndex=index;this.hintUntil=this.clock+7;const t=this.level.targets[index];this.zoom=1.5;this.updateCamera();this.panX=(450-t.x)*this.scale;this.panY=(675-t.y)*this.scale;this.updateCamera();}
 setPhase(value:number){this.phase=value%this.level.phases.length;this.burst(450,400,'#f8e5b4',10);}
 setWeather(value:number){this.weather=value%this.level.weather.length;}
 private burst(x:number,y:number,color:string,count:number){if(this.reducedMotion)count=6;for(let i=0;i<count;i++){const a=Math.random()*TAU,s=45+Math.random()*120;this.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-65,life:.6+Math.random()*.55,max:1.15,color:i%3===0?'#fff3cd':color,size:3+Math.random()*5});}}
 private frame=(now:number)=>{
  if(this.destroyed)return;const dt=Math.min((now-this.lastFrame)/1000,.035);this.lastFrame=now;if(!this.paused)this.clock+=dt;
  const c=this.ctx,dpr=Math.min(devicePixelRatio||1,2);c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,this.width,this.height);c.fillStyle='#e9e2c9';c.fillRect(0,0,this.width,this.height);
  if(this.level){this.updateCamera();c.save();const shake=this.reducedMotion?0:this.shake;this.shake*=.88;c.translate(this.offsetX+(Math.random()-.5)*shake,this.offsetY+(Math.random()-.5)*shake);c.scale(this.scale,this.scale);
   if(this.image)c.drawImage(this.image,0,0,900,1350);
   this.drawLight(c);
   this.level.targets.forEach((t,i)=>{if(!this.found.has(i)&&this.visible(t))this.drawGuy(c,t,i);});
   this.level.mechanisms.forEach(m=>this.drawMechanism(c,m));
   this.drawWeather(c);
   if(this.hintUntil>this.clock&&this.hintIndex>=0){const t=this.level.targets[this.hintIndex],m=this.level.mechanisms.find(m=>m.id===t.requires);const p=!this.visible(t)&&m?m:t;const r=52+Math.sin(this.clock*3)*5;c.save();c.strokeStyle='#fff9d3';c.lineWidth=4;c.setLineDash([8,8]);c.beginPath();c.arc(p.x,p.y,r,0,TAU);c.stroke();c.restore();}
   this.particles=this.particles.filter(p=>p.life>0);for(const p of this.particles){if(!this.paused){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=170*dt;}c.globalAlpha=clamp(p.life/.4,0,1);c.fillStyle=p.color;c.save();c.translate(p.x,p.y);c.rotate(p.life*3);c.fillRect(-p.size/2,-p.size/2,p.size,p.size*.65);c.restore();}c.globalAlpha=1;
   this.pops=this.pops.filter(p=>this.clock-p.t<.65);for(const p of this.pops){const a=(this.clock-p.t)/.65;c.globalAlpha=1-a;c.strokeStyle=p.color;c.lineWidth=4*(1-a);c.beginPath();c.arc(p.x,p.y,12+a*72,0,TAU);c.stroke();}c.globalAlpha=1;c.restore();
  }
  requestAnimationFrame(this.frame);
 };
 private drawGuy(c:CanvasRenderingContext2D,t:Target,i:number){
  c.save();c.translate(t.x,t.y);c.rotate(((t.rotation||0)+[0,65,-28,90][t.pose])*Math.PI/180);c.scale(t.pose===2?.92:1,t.pose===3?.86:1);const breathe=this.reducedMotion?0:Math.sin(this.clock*1.6+i)*.7;c.translate(0,breathe);
  c.fillStyle=t.color;c.strokeStyle=this.darken(t.color,.74);c.lineWidth=2.4;c.lineJoin='round';c.lineCap='round';
  c.beginPath();c.arc(0,-15,11.5,0,TAU);c.fill();c.stroke();
  c.beginPath();c.moveTo(-7,-5);c.bezierCurveTo(-15,-2,-17,6,-14,9);c.quadraticCurveTo(-10,13,-6,4);c.lineTo(-7,19);c.quadraticCurveTo(-8,26,-2,25);c.lineTo(1,14);c.lineTo(4,25);c.quadraticCurveTo(11,27,10,19);c.lineTo(8,3);c.quadraticCurveTo(14,12,17,7);c.quadraticCurveTo(16,1,8,-5);c.closePath();c.fill();c.stroke();
  // Small hand-painted flecks keep the character inside the illustration's texture.
  c.globalAlpha=.14;c.fillStyle='#fff3d8';c.beginPath();c.ellipse(-3,-18,4,2,-.3,0,TAU);c.fill();c.fillRect(-3,4,5,1);c.restore();
 }
 private darken(hex:string,n:number){const v=parseInt(hex.slice(1),16);return `rgb(${Math.round((v>>16)*n)},${Math.round(((v>>8)&255)*n)},${Math.round((v&255)*n)})`;}
 private rounded(c:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,r:number,fill:string,stroke='#796c50'){c.fillStyle=fill;c.strokeStyle=stroke;c.lineWidth=3;c.beginPath();c.roundRect(x,y,w,h,r);c.fill();c.stroke();c.save();c.clip();c.globalAlpha=.13;c.fillStyle='#fff3d6';for(let i=0;i<24;i++){const px=x+((i*37)%97)/97*w,py=y+((i*53)%89)/89*h;c.fillRect(px,py,2+(i%4),1);}c.restore();}
 private drawMechanism(c:CanvasRenderingContext2D,m:Mechanism){
  const open=this.gates.has(m.id),since=this.clock-(this.gateTimes.get(m.id)??-100),a=open?clamp(since/.55,0,1):0;
  c.save();c.translate(m.x,m.y);
  if(m.kind==='shutter'){
   c.save();c.globalAlpha=1-a*.7;const w=m.w/2*(1-a*.85);for(const side of [-1,1]){const x=side<0?-m.w/2:m.w/2-w;this.rounded(c,x,-m.h/2,w,m.h,4,'#7caaa0','#527b70');c.strokeStyle='#547e73';c.lineWidth=3;for(let j=0;j<7;j++){c.beginPath();c.moveTo(x+7,-m.h/2+14+j*15);c.lineTo(x+w-7,-m.h/2+14+j*15);c.stroke();}}c.restore();
  } else if(m.kind==='fog'){
   if(a<1){c.save();c.globalAlpha=(1-this.fogProgress*.85)*(1-a);this.rounded(c,-m.w/2,-m.h/2,m.w,m.h,12,'#b6cec4','#789a90');c.fillStyle='rgba(247,247,225,.32)';for(let j=0;j<14;j++){c.beginPath();c.ellipse(Math.sin(j*3)*70,Math.cos(j*5)*70,45,24,j,0,TAU);c.fill();}c.strokeStyle='#eff3db';c.lineWidth=7;c.beginPath();c.moveTo(-35,15);c.quadraticCurveTo(0,-35,35,0);c.stroke();if(this.fogProgress>0){c.fillStyle='#eee8cc';c.fillRect(-65,67,130,6);c.fillStyle='#4a8c80';c.fillRect(-65,67,130*this.fogProgress,6);}c.restore();}
  } else if(m.kind==='crate'){
   c.save();c.translate(a*140,-a*18);this.rounded(c,-m.w/2,-m.h/2,m.w,m.h,5,'#bc9466','#8d6e49');c.strokeStyle='#8d6e49';c.lineWidth=4;for(let y=-42;y<60;y+=28){c.beginPath();c.moveTo(-m.w/2+5,y);c.lineTo(m.w/2-5,y);c.stroke();}c.lineWidth=12;c.beginPath();c.moveTo(-60,-55);c.lineTo(60,55);c.stroke();c.restore();
  } else if(m.kind==='breeze'){
   if(a<1){c.save();c.globalAlpha=1-a;c.fillStyle='#91a371';for(let j=0;j<9;j++){c.beginPath();c.ellipse(Math.sin(j*2)*39,Math.cos(j*3)*35,20,11,j,0,TAU);c.fill();}c.restore();}
   c.save();c.translate(48,38);c.strokeStyle='#8f7956';c.lineWidth=4;c.beginPath();c.moveTo(0,0);c.lineTo(0,54);c.stroke();c.rotate(open?this.clock*3:Math.sin(this.clock)*.07);for(let j=0;j<4;j++){c.rotate(Math.PI/2);c.fillStyle=j%2?'#bfa77a':'#d9b5a0';c.beginPath();c.moveTo(0,0);c.lineTo(28,-8);c.lineTo(22,18);c.closePath();c.fill();}c.restore();
  } else if(m.kind==='valve'){
   const target=this.level.targets.find(t=>t.requires==='water')!;
   if(!open){c.save();c.translate(target.x-m.x,target.y-m.y);c.globalAlpha=.3;c.fillStyle='#87b8a8';c.beginPath();c.ellipse(0,0,91,48,0,0,TAU);c.fill();c.strokeStyle='#d9e6bf';c.lineWidth=2;for(let i=0;i<3;i++){c.beginPath();c.ellipse(0,4+i*9,35+i*13,8,0,0,TAU);c.stroke();}c.restore();}
   if(since<.8){c.save();c.rotate(a*Math.PI*1.2);c.strokeStyle='#e6c68a';c.lineWidth=3;c.beginPath();c.arc(0,0,24,0,TAU);c.stroke();c.restore();}
  } else if(m.kind==='lamp'){
   if(open){const g=c.createRadialGradient(0,0,0,0,0,190);g.addColorStop(0,'rgba(255,221,124,.42)');g.addColorStop(1,'rgba(255,221,124,0)');c.fillStyle=g;c.fillRect(-190,-190,380,380);}
   c.save();c.translate(open?70:0,0);c.strokeStyle='#8e734f';c.lineWidth=4;c.beginPath();c.moveTo(-25,-54);c.lineTo(0,-78);c.lineTo(25,-54);c.stroke();this.rounded(c,-30,-52,60,92,8,open?'#f5d78c':'#a5a693','#8e734f');c.strokeStyle='#8e734f';c.beginPath();c.moveTo(-35,-48);c.lineTo(35,-48);c.moveTo(-35,37);c.lineTo(35,37);c.stroke();if(open){c.fillStyle='#fff1bc';c.beginPath();c.ellipse(0,-4,9,20,0,0,TAU);c.fill();}c.restore();
  } else if(m.kind==='telescope'){
   if(open){c.save();c.rotate(-.6);const g=c.createLinearGradient(0,0,0,-500);g.addColorStop(0,'rgba(247,236,184,.19)');g.addColorStop(1,'rgba(247,236,184,0)');c.fillStyle=g;c.beginPath();c.moveTo(-12,0);c.lineTo(-100,-500);c.lineTo(100,-500);c.lineTo(12,0);c.fill();c.restore();}
  } else if(m.kind==='stars'){
   const p=this.starPoints(m).map(p=>({x:p.x-m.x,y:p.y-m.y}));c.strokeStyle='#d4d7b0';c.lineWidth=2;c.setLineDash([5,7]);c.beginPath();p.forEach((s,i)=>{if(i)c.lineTo(s.x,s.y);else c.moveTo(s.x,s.y);});c.stroke();c.setLineDash([]);p.forEach((s,i)=>{c.save();c.translate(s.x,s.y);c.rotate(Math.PI/4);c.fillStyle=this.starBits.has(i)||open?'#fff1b4':'#acb9bb';const r=8+(this.reducedMotion?0:Math.sin(this.clock*2+i)*2);c.fillRect(-r,-r,r*2,r*2);c.restore();});
  }
  if(!open){const bx=m.kind==='stars'?0:m.w/2-7,by=m.kind==='stars'?m.h/2+6:-m.h/2+4;c.save();c.translate(bx,by);const pulse=this.reducedMotion?1:1+Math.sin(this.clock*2)*.045;c.scale(pulse,pulse);c.fillStyle='rgba(253,244,213,.95)';c.strokeStyle='#ad956c';c.lineWidth=2;c.beginPath();c.arc(0,0,15,0,TAU);c.fill();c.stroke();c.strokeStyle='#796f54';c.lineWidth=2;c.beginPath();if(m.kind==='fog'){c.moveTo(-6,4);c.quadraticCurveTo(0,-9,6,0);}else{c.moveTo(-5,0);c.lineTo(5,0);c.moveTo(0,-5);c.lineTo(0,5);}c.stroke();c.restore();}
  c.restore();
 }
 private starPoints(m:Mechanism){return[{x:m.x-88,y:m.y-20},{x:m.x+8,y:m.y-52},{x:m.x+88,y:m.y+25}];}
 private drawLight(c:CanvasRenderingContext2D){
  if(this.phase===1){c.fillStyle=this.level.id==='moon'?'rgba(99,112,168,.15)':this.level.id==='market'?'rgba(76,64,108,.18)':'rgba(230,164,88,.13)';c.fillRect(0,0,900,1350);}
  if(this.level.id==='moon'){c.fillStyle='rgba(56,72,115,.26)';c.fillRect(0,0,900,1350);const g=c.createRadialGradient(600,50,30,430,450,900);g.addColorStop(0,'rgba(233,238,214,.12)');g.addColorStop(1,'rgba(66,79,119,.12)');c.fillStyle=g;c.fillRect(0,0,900,1350);}
 }
 private drawWeather(c:CanvasRenderingContext2D){
  const t=this.clock;
  if(this.level.id==='greenhouse'&&this.weather===0){c.save();c.strokeStyle='rgba(225,243,234,.52)';c.lineWidth=2;const count=this.reducedMotion?12:65;for(let i=0;i<count;i++){const x=(i*137+t*90)%1000-50,y=(i*191+t*500)%1450-50;c.beginPath();c.moveTo(x,y);c.lineTo(x-12,y+32);c.stroke();}c.restore();}
  if(this.weather===1&&(this.level.id==='courtyard'||this.level.id==='market')){for(let i=0;i<11;i++){const x=(i*131+t*45)%1100-100,y=150+(i*163+t*24)%1200;c.save();c.translate(x,y);c.rotate(Math.sin(t+i));c.fillStyle=i%2?'rgba(148,160,100,.7)':'rgba(229,178,145,.7)';c.beginPath();c.ellipse(0,0,8,3,0,0,TAU);c.fill();c.restore();}}
  if(this.level.id==='moon'){for(let i=0;i<20;i++){const x=70+(i*137)%780+Math.sin(t*.4+i)*15,y=70+(i*193)%1170+Math.cos(t*.3+i)*12;c.globalAlpha=.22+(Math.sin(t*1.7+i)+1)*.24;c.fillStyle='#fff1ac';c.beginPath();c.arc(x,y,2.8,0,TAU);c.fill();}c.globalAlpha=1;if(this.weather===1){c.fillStyle='rgba(201,212,216,.09)';for(let i=0;i<3;i++){c.beginPath();c.ellipse((t*22+i*400)%1400-200,120+i*130,240,48,-.13,0,TAU);c.fill();}}}
 }
 debug(){return{level:this.level.id,found:[...this.found],gates:[...this.gates],phase:this.phase,weather:this.weather,zoom:this.zoom,fog:this.fogProgress,targets:this.level.targets.map((t,i)=>({...this.worldToScreen(t.x,t.y),visible:this.visible(t),found:this.found.has(i),requires:t.requires})),mechanisms:this.level.mechanisms.map(m=>({...m,screen:this.worldToScreen(m.x,m.y),stars:m.kind==='stars'?this.starPoints(m).map(p=>this.worldToScreen(p.x,p.y)):undefined}))};}
 destroy(){this.destroyed=true;this.resizeObserver.disconnect();}
}
