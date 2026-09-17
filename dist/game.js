import {World,TYPES,MODES,BOUNDS} from './physics.js';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const W=500,H=600,N=18,TAU=Math.PI*2,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let score=0,best=0,energy=100,aim=250,current=0,next=0,cooldown=0,paused=false,ended=false,muted=true,audio,loaded=false,hasWon=false,toastUntil=0,heldTilt=0,combo=0,lastMerge=-10;
let effects=[],ripples=[],sprites=[],last=0,accumulator=0,uiClock=0;
const keys=new Set(),dialog=$('dialog');
const savedTheme=localStorage.getItem('fruit-lab-theme')||'lavender';
document.documentElement.dataset.theme=savedTheme;
document.querySelectorAll('[data-theme]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.theme===savedTheme));button.addEventListener('click',()=>{document.documentElement.dataset.theme=button.dataset.theme;localStorage.setItem('fruit-lab-theme',button.dataset.theme);document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));});});
try{best=Math.max(0,Number(localStorage.getItem('melon-lab-best'))||0);}catch{}
$('best').textContent=best;
function tone(frequency=420,length=.09){if(muted)return;try{audio??=new (window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume().catch(()=>{});const oscillator=audio.createOscillator(),gain=audio.createGain();oscillator.type='sine';oscillator.frequency.setValueAtTime(frequency,audio.currentTime);oscillator.frequency.exponentialRampToValueAtTime(frequency*.55,audio.currentTime+length);gain.gain.setValueAtTime(.11,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+length);oscillator.connect(gain).connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+length);}catch{}}
function toast(text){$('toast').textContent=text;$('toast').classList.add('visible');toastUntil=performance.now()+1800;}
function syncUI(){ $('score').textContent=score;$('best').textContent=best;$('energy').value=energy;$('energy-value').textContent=Math.floor(energy);$('stir').disabled=energy<30||ended||paused;$('game').dataset.fruits=world.bodies.length;$('game').dataset.phase=ended?'ended':paused?'paused':'playing';}
function showDialog(title,body,button,action,closable=true){paused=true;keys.clear();heldTilt=0;$('dialog-title').textContent=title;$('dialog-body').innerHTML=body;$('dialog-action').textContent=button;$('dialog-action').onclick=()=>{dialog.close();action();};$('dialog-close').hidden=!closable;if(!dialog.open)dialog.showModal();syncUI();}
function resume(){paused=false;$('pause').querySelector('span').textContent='暂停';$('pause').setAttribute('aria-label','暂停');syncUI();}
function finish(){if(ended)return;ended=true;showDialog('果池满了，休息一下',`这一次的合成分数<strong>${score}</strong><p>试试切换流动性，给大水果腾出一点空间。</p>`,'再来一池',reset,false);}
const world=new World(event=>{
  combo=world.time-lastMerge<1.2?combo+1:1;lastMerge=world.time;const bonus=event.points*Math.min(combo,4);score+=bonus;energy=Math.min(100,energy+8);
  if(score>best){best=score;try{localStorage.setItem('melon-lab-best',String(best));}catch{}}
  effects.push({x:event.x,y:event.y,text:`+${bonus}${combo>1?' · '+combo+' 连融':''}`,life:1.2});ripples.push({x:event.x,y:event.y,life:.6,r:TYPES[event.type].r,color:TYPES[event.type].color});tone(330+event.type*80,.16);
  const step=document.querySelector(`[data-fruit="${event.type}"]`);if(step){step.classList.remove('new');void step.offsetWidth;step.classList.add('new');}
  if(event.type===8&&!hasWon){hasWon=true;queueMicrotask(()=>{if(ended)return;showDialog('一颗会流动的大西瓜！',`你把柔软的水果，融成了夏天。<strong>${score}</strong><p>继续合成两颗西瓜，可以释放大片空间。</p>`,'继续实验',resume);});}
  syncUI();
});
function reset(){world.reset();world.mode=document.querySelector('[data-mode][aria-pressed=true]').dataset.mode;score=0;energy=100;current=0;next=0;cooldown=0;aim=250;ended=false;hasWon=false;paused=false;effects=[];ripples=[];combo=0;lastMerge=-10;keys.clear();heldTilt=0;if(dialog.open)dialog.close();updateNext();resume();$('aim-tip').textContent='移动瞄准 · 点击投放';}
function pickFruit(){return Math.floor(Math.random()**1.65*4);}
function drop(){if(!loaded||paused||ended||world.time<cooldown)return;const r=TYPES[current].r;aim=Math.max(BOUNDS.left+r+3,Math.min(BOUNDS.right-r-3,aim));world.add(current,aim,65,world.tilt*20,70);current=next;next=pickFruit();cooldown=world.time+.42;updateNext();tone(240,.06);syncUI();}
function stir(){if(!loaded||paused||ended||energy<30)return;energy-=30;world.stir();ripples.push({x:250,y:430,life:1,r:130,color:'#9b85db'});tone(150,.3);toast('轻轻搅一搅，好事会相遇。');syncUI();}
function updateNext(){if(!loaded)return;const c=$('next-fruit').getContext('2d');c.clearRect(0,0,144,144);c.drawImage(sprites[next],8,8,128,128);$('next-fruit').setAttribute('aria-label',`下一颗水果：${TYPES[next].name}`);}
function glassPath(){ctx.beginPath();ctx.moveTo(31,49);ctx.lineTo(19,49);ctx.quadraticCurveTo(14,49,14,59);ctx.lineTo(14,548);ctx.quadraticCurveTo(14,590,55,590);ctx.lineTo(445,590);ctx.quadraticCurveTo(486,590,486,548);ctx.lineTo(486,59);ctx.quadraticCurveTo(486,49,469,49);}
function drawGlass(front=false){
  if(!front){const fill=ctx.createLinearGradient(0,70,0,588);fill.addColorStop(0,'#ffffff08');fill.addColorStop(.85,'#d5c9ff09');fill.addColorStop(1,'#b2a0db30');ctx.fillStyle=fill;ctx.beginPath();ctx.roundRect(20,50,460,534,[4,4,34,34]);ctx.fill();return;}
  ctx.save();glassPath();ctx.lineJoin='round';ctx.lineCap='round';ctx.shadowBlur=9;ctx.shadowColor='#80719b2d';ctx.shadowOffsetY=6;ctx.strokeStyle='#b1a6d6';ctx.lineWidth=10;ctx.stroke();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle='#ece8ff';ctx.lineWidth=6.5;ctx.stroke();ctx.strokeStyle='#ffffffc9';ctx.lineWidth=2;ctx.stroke();ctx.restore();
  ctx.save();ctx.font='9px "Avenir Next",sans-serif';ctx.textAlign='left';ctx.fillStyle='#a297b8';ctx.lineWidth=1;ctx.strokeStyle='#b9abd180';for(let y=170;y<560;y+=50){ctx.beginPath();ctx.moveTo(29,y);ctx.lineTo(35,y);ctx.stroke();ctx.fillText(String(600-y),38,y+3);}ctx.restore();
}
function pathBody(body){const p=body.p;ctx.beginPath();ctx.moveTo((p[N-1].x+p[0].x)/2,(p[N-1].y+p[0].y)/2);for(let i=0;i<N;i++){const q=p[(i+1)%N];ctx.quadraticCurveTo(p[i].x,p[i].y,(p[i].x+q.x)/2,(p[i].y+q.y)/2);}ctx.closePath();}
function triangle(image,source,dest){
  const [s0,s1,s2]=source,[d0,d1,d2]=dest;
  const sx1=s1.x-s0.x,sy1=s1.y-s0.y,sx2=s2.x-s0.x,sy2=s2.y-s0.y,det=sx1*sy2-sx2*sy1;
  if(Math.abs(det)<.001)return;
  const dx1=d1.x-d0.x,dy1=d1.y-d0.y,dx2=d2.x-d0.x,dy2=d2.y-d0.y;
  const a=(dx1*sy2-dx2*sy1)/det,b=(dy1*sy2-dy2*sy1)/det,c=(dx2*sx1-dx1*sx2)/det,d=(dy2*sx1-dy1*sx2)/det;
  ctx.save();ctx.beginPath();for(let i=0;i<3;i++){const p=dest[i],x=p.x+(p.x-(d0.x+d1.x+d2.x)/3)*.012,y=p.y+(p.y-(d0.y+d1.y+d2.y)/3)*.012;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();ctx.clip();ctx.transform(a,b,c,d,d0.x-a*s0.x-c*s0.y,d0.y-b*s0.x-d*s0.y);ctx.drawImage(image,0,0);ctx.restore();
}
const sourceRim=Array.from({length:N},(_,i)=>({x:128+Math.cos(TAU*i/N)*128,y:128+Math.sin(TAU*i/N)*128}));
function drawBody(body){
  ctx.save();pathBody(body);ctx.shadowColor=TYPES[body.type].color+'40';ctx.shadowBlur=9;ctx.shadowOffsetY=3;ctx.fillStyle=TYPES[body.type].color+'42';ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.clip();
  for(let i=0;i<N;i++)triangle(sprites[body.type],[{x:128,y:128},sourceRim[i],sourceRim[(i+1)%N]],[{x:body.x,y:body.y},body.p[i],body.p[(i+1)%N]]);
  ctx.restore();
}
function render(){
  ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.clearRect(0,0,W,H);drawGlass();
  const danger=Math.max(0,...world.bodies.map(b=>b.danger));ctx.save();ctx.setLineDash([8,8]);ctx.lineCap='round';ctx.strokeStyle=danger>0?'#ed637d':'#ff8b98';ctx.lineWidth=danger>0?2.5:1.8;ctx.beginPath();ctx.moveTo(26,BOUNDS.line);ctx.lineTo(474,BOUNDS.line);ctx.stroke();ctx.restore();
  if(loaded){for(const body of world.bodies)drawBody(body);if(!paused&&!ended){const r=TYPES[current].r,x=Math.max(BOUNDS.left+r+3,Math.min(BOUNDS.right-r-3,aim));ctx.save();ctx.setLineDash([4,8]);ctx.strokeStyle='#a99ac780';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,65+r+10);ctx.lineTo(x,570);ctx.stroke();ctx.globalAlpha=world.time<cooldown?.3:.85;ctx.drawImage(sprites[current],x-r,65-r,r*2,r*2);ctx.restore();}}
  drawGlass(true);
  for(const e of ripples){ctx.save();ctx.strokeStyle=e.color;ctx.globalAlpha=e.life*.3;ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(e.x,e.y,e.r*(2-e.life),e.r*(2-e.life)*.65,0,0,TAU);ctx.stroke();ctx.restore();}
  for(const e of effects){ctx.save();ctx.globalAlpha=Math.min(1,e.life*2);ctx.font='600 21px "Avenir Next","PingFang SC",sans-serif';ctx.textAlign='center';ctx.fillStyle='#7563af';ctx.strokeStyle='#f7f3ff';ctx.lineWidth=4;ctx.strokeText(e.text,e.x,e.y);ctx.fillText(e.text,e.x,e.y);ctx.restore();}
  if(danger>0){ctx.save();ctx.font='600 13px "PingFang SC",sans-serif';ctx.textAlign='center';ctx.fillStyle='#d95970';ctx.fillText(`快满了！${Math.max(1,Math.ceil(3-danger))} 秒`,250,104);ctx.restore();}
}
function frame(now){const dt=Math.min((now-last)/1000||0, .065);last=now;if(loaded&&!paused&&!ended&&!document.hidden){accumulator+=dt;world.tilt=heldTilt||(keys.has('a')?-1:0)+(keys.has('d')?1:0);if(keys.has('arrowleft'))aim-=250*dt;if(keys.has('arrowright'))aim+=250*dt;aim=Math.max(45,Math.min(455,aim));while(accumulator>=1/120){world.step(1/120);accumulator-=1/120;}energy=Math.min(100,energy+dt*2.3);for(const e of effects){e.life-=dt;e.y-=dt*27;}effects=effects.filter(e=>e.life>0);for(const e of ripples)e.life-=dt;ripples=ripples.filter(e=>e.life>0);if(world.bodies.some(b=>b.danger>=3))finish();}else accumulator=0;uiClock+=dt;if(uiClock>.1){uiClock=0;syncUI();}if(now>toastUntil)$('toast').classList.remove('visible');render();requestAnimationFrame(frame);}
function pointerAim(event){const rect=canvas.getBoundingClientRect();const contentWidth=Math.min(rect.width,rect.height*W/H);const left=rect.left+(rect.width-contentWidth)/2;aim=(event.clientX-left)*W/contentWidth;}
let pointer=null;
canvas.addEventListener('pointerdown',e=>{e.preventDefault();if(pointer!==null)return;pointer=e.pointerId;canvas.setPointerCapture(e.pointerId);canvas.classList.add('pointer-focused');canvas.focus({preventScroll:true});pointerAim(e);});
canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'||pointer===e.pointerId)pointerAim(e);});
canvas.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;pointerAim(e);pointer=null;drop();});canvas.addEventListener('pointercancel',()=>pointer=null);
for(const[id,direction]of[['tilt-left',-1],['tilt-right',1]]){const button=$(id);button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);heldTilt=direction;});for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>heldTilt=0);}
document.addEventListener('keydown',e=>{if(dialog.open)return;canvas.classList.remove('pointer-focused');const key=e.key.toLowerCase();if(['arrowleft','arrowright','a','d'].includes(key)){e.preventDefault();keys.add(key);}if((key===' '||key==='enter')&&!e.repeat&&!['BUTTON','A'].includes(document.activeElement.tagName)){e.preventDefault();key===' '?stir():drop();}if(key==='p'&&!e.repeat)$('pause').click();});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();heldTilt=0;pointer=null;});document.addEventListener('visibilitychange',()=>{keys.clear();heldTilt=0;last=performance.now();});
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>{world.mode=button.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));$('mode-desc').textContent=MODES[world.mode].label;tone(250,.05);}));
$('stir').addEventListener('click',stir);
$('sound').addEventListener('click',()=>{muted=!muted;$('sound').setAttribute('aria-pressed',String(!muted));$('sound').querySelector('span').textContent=muted?'静音':'声音';tone();});
$('pause').addEventListener('click',()=>{if(ended)return;showDialog('让果冻歇一会儿','水果和时间都停在这里。','继续游戏',resume);});
$('restart').addEventListener('click',()=>{if(score===0){reset();return;}showDialog('开始一池新的水果？','本局分数将清零，最佳分数会保留。','重新开始',reset);});
$('help').addEventListener('click',()=>showDialog('一点物理，一点好运','<p>移动鼠标瞄准，点击投放。手机上拖动瞄准，松手投放。</p><p>同类水果碰到一起就会融合。切换「果冻 / 半流体 / 果汁」，感受不同弹性与流动性。</p><p>按 A / D 倾斜果池，按空格搅动。搅动消耗 30 能量；合成与等待可恢复。</p><p>水果稳定越过虚线 3 秒，本局结束。合出西瓜后可以继续挑战。</p>','开始实验',resume));
$('dialog-close').addEventListener('click',()=>{dialog.close();resume();});dialog.addEventListener('cancel',e=>{if(ended){e.preventDefault();return;}resume();});
function resize(){const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*ratio);canvas.height=Math.round(H*ratio);}
resize();window.addEventListener('resize',resize);
const atlas=new Image();atlas.onload=()=>{const cell=atlas.width/3;for(let i=0;i<9;i++){const sprite=document.createElement('canvas');sprite.width=256;sprite.height=256;sprite.getContext('2d').drawImage(atlas,i%3*cell,Math.floor(i/3)*cell,cell,cell,0,0,256,256);sprites.push(sprite);const step=document.createElement('span');step.className='fruit-step';step.dataset.fruit=i;step.title=TYPES[i].name;const preview=document.createElement('canvas');preview.width=144;preview.height=144;preview.setAttribute('role','img');preview.setAttribute('aria-label',TYPES[i].name);preview.getContext('2d').drawImage(sprite,6,6,132,132);step.append(preview);if(i<8)step.insertAdjacentHTML('beforeend','<svg aria-hidden="true"><use href="#i-chevron"/></svg>');$('fruit-route').append(step);}loaded=true;$('loading').hidden=true;reset();};atlas.onerror=()=>{$('loading').textContent='水果素材加载失败，请刷新重试。';};atlas.src='fruits.png';
requestAnimationFrame(frame);

// Optional page tools use the same controls and state as the game.
if(document.modelContext?.registerTool){
 const lifecycle=new AbortController();
 const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 register({name:'read_game_state',description:'Read the current fruit game score, mode, energy and phase.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({score,best,energy:Math.floor(energy),mode:world.mode,phase:ended?'ended':paused?'paused':'playing',fruits:world.bodies.length})});
 register({name:'set_physics_mode',description:'Change the visible fruit physics mode.',inputSchema:{type:'object',properties:{mode:{type:'string',enum:['jelly','fluid','juice']}},required:['mode'],additionalProperties:false},execute:input=>{if(!input||!Object.hasOwn(MODES,input.mode))throw new Error('Invalid physics mode');document.querySelector(`[data-mode="${input.mode}"]`).click();return {mode:world.mode};}});
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
