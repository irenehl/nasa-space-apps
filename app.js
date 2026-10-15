'use strict';
const $ = (id) => document.getElementById(id);
const canvas = $('badge');
const ctx = canvas.getContext('2d');
const config = window.SPACEAPPS_CONFIG || {};
const state = { format: 'post', theme: 'blue', photo: null, zoom: 1, position: .5 };
const palettes = { blue: ['#244bd3','#edfa59','#ffffff'], dark: ['#171b44','#edfa59','#ffffff'], orange: ['#ff8050','#22277b','#22277b'] };
const logo = new Image();
logo.onload = draw;
logo.src = 'assets/spaceapps-logo.png';
$('location').value = config.city || '';
function text(value,x,y,size,color,weight='bold',max=920){
  ctx.fillStyle=color;
  let fontSize=size;
  do {ctx.font=`${weight} ${fontSize}px "Trebuchet MS", sans-serif`;if(ctx.measureText(value).width<=max)break;fontSize-=1;}while(fontSize>12);
  ctx.fillText(value,x,y);
}
function star(x,y,r,color){ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4;const d=i%2?r*.23:r;ctx.lineTo(Math.cos(a)*d,Math.sin(a)*d);}ctx.closePath();ctx.fill();ctx.restore();}
function draw(){
  const story=state.format==='story', h=story?1920:1080;
  canvas.height=h;canvas.classList.toggle('story',story);
  const [bg,accent,fg]=palettes[state.theme];ctx.fillStyle=bg;ctx.fillRect(0,0,1080,h);
  ctx.strokeStyle=state.theme==='orange'?'#22277b28':'#ffffff28';ctx.lineWidth=1;
  for(let x=0;x<1080;x+=90){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=0;y<h;y+=90){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1080,y);ctx.stroke();}
  ctx.save();ctx.translate(790,story?780:450);ctx.rotate(-.5);ctx.lineWidth=2;ctx.strokeStyle=accent;ctx.beginPath();ctx.ellipse(0,0,490,190,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  if(logo.complete&&logo.naturalWidth){ctx.drawImage(logo,64,62,280,280*logo.naturalHeight/logo.naturalWidth);}
  text(config.edition || 'COMMUNITY / SPACE APPS',620,105,18,fg,'normal',395);
  const titleY=story?330:275;
  text('Mi próxima',64,titleY,story?100:94,fg);text('misión: crear.',64,titleY+110,story?100:94,accent);
  const cx=story?540:800,cy=story?955:652,r=story?300:196;
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
  ctx.fillStyle=state.theme==='dark'?'#303984':'#22277b';ctx.fillRect(cx-r,cy-r,r*2,r*2);
  if(state.photo){const img=state.photo;const scale=Math.max(r*2/img.width,r*2/img.height)*state.zoom;const w=img.width*scale,ph=img.height*scale;ctx.drawImage(img,cx-w/2,cy-r-(ph-r*2)*state.position,w,ph);}else{
    ctx.fillStyle='#657be4';ctx.beginPath();ctx.arc(cx,cy-r*.22,r*.31,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(cx,cy+r*.76,r*.7,r*.65,0,0,Math.PI*2);ctx.fill();
    star(cx+r*.58,cy-r*.57,24,accent);
  }ctx.restore();ctx.strokeStyle=accent;ctx.lineWidth=5;ctx.beginPath();ctx.arc(cx,cy,r+12,0,Math.PI*2);ctx.stroke();
  star(story?880:570,story?680:530,55,accent);star(115,story?1100:580,25,fg);
  if(!story){text('PARTE DE LA',64,695,20,fg,'normal',470);text('TRIPULACIÓN.',64,744,37,accent,'bold',470);}
  const name=$('name').value.trim()||'Tu nombre aquí', role=$('role').value.trim(), city=$('location').value.trim();
  const nameY=story?1425:885;
  text(name,64,nameY,story?78:65,fg,'bold',952);
  if(role)text(role,66,nameY+55,29,fg,'normal',950);
  ctx.fillStyle=accent;ctx.fillRect(0,h-115,1080,115);
  text(city||'UNA COMUNIDAD. INFINITAS POSIBILIDADES.',64,h-63,city?25:20,bg,'bold',720);
  text('#SpaceApps',820,h-63,27,bg,'bold',210);
  $('dimensions').textContent=`1080 × ${h} px`;
  canvas.setAttribute('aria-label',`Badge de ${name}, ${state.format==='story'?'story':'post'}, tema ${state.theme}`);
}
for(const id of ['name','role','location'])$(id).addEventListener('input',()=>{ $('message').textContent='';draw(); });
$('badge-form').addEventListener('submit',event=>event.preventDefault());
document.querySelectorAll('[data-format]').forEach(button=>button.addEventListener('click',()=>{state.format=button.dataset.format;document.querySelectorAll('[data-format]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));draw();}));
document.querySelectorAll('[data-theme]').forEach(button=>button.addEventListener('click',()=>{state.theme=button.dataset.theme;document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));draw();}));
let uploadVersion=0;
$('photo').addEventListener('change',async(event)=>{
  const file=event.target.files[0];if(!file)return;const version=++uploadVersion;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8*1024*1024){$('message').textContent='Elegí una imagen JPG, PNG o WebP de hasta 8 MB.';event.target.value='';return;}
  const url=URL.createObjectURL(file);const img=new Image();
  try{img.src=url;await img.decode();if(version!==uploadVersion)return;if(img.width*img.height>40000000)throw new Error('size');state.photo=img;state.zoom=1;state.position=.5;$('zoom').value='1';$('position').value='50';$('photo-controls').hidden=false;$('upload-label').textContent='Cambiar foto';$('message').textContent='Foto lista. Ajustá el encuadre a tu gusto.';draw();}
  catch{$('message').textContent='No pudimos abrir esa foto. Probá con otra imagen de menor tamaño.';event.target.value='';}finally{URL.revokeObjectURL(url);}
});
$('zoom').addEventListener('input',e=>{state.zoom=Number(e.target.value);draw();});
$('position').addEventListener('input',e=>{state.position=Number(e.target.value)/100;draw();});
$('remove-photo').addEventListener('click',()=>{uploadVersion++;state.photo=null;$('photo').value='';$('photo-controls').hidden=true;$('upload-label').textContent='Elegí una foto';draw();});
$('download').addEventListener('click',async()=>{
  if(!$('name').value.trim()){$('message').textContent='Agregá tu nombre para descargar tu badge.';$('name').focus();return;}
  const button=$('download');button.disabled=true;$('message').textContent='Preparando tu imagen…';
  try{if(!logo.complete)await logo.decode();draw();const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('export')),'image/png'));const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;const name=$('name').value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').toLowerCase().replace(/^-|-$/g,'')||'badge';a.download=`spaceapps-${name}-${state.format}.png`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);$('message').textContent='¡Tu badge está listo! Compartilo con #SpaceApps.';}
  catch{$('message').textContent='No pudimos generar la imagen. Volvé a intentar.';}finally{button.disabled=false;}
});
draw();
