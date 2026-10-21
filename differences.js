(()=>{
'use strict';
const N=10,W=900,H=600;
const scenes=[
 {title:'Стаята на алхимика',sky:'#26324b',wall:'#4e3558',floor:'#513b37',accent:'#d6a76d',icons:['🧪','📜','🕯️','🔮','🗝️','🪶','📖','🦇','🧹','⌛','🕸️','🧿']},
 {title:'Пиратската каюта',sky:'#19394b',wall:'#56413d',floor:'#4a3026',accent:'#e6b779',icons:['⚓','🗺️','🪙','🦜','🧭','🏴‍☠️','🗝️','💎','🕯️','🪶','🔔','🐚']},
 {title:'Призрачната библиотека',sky:'#26243e',wall:'#443a56',floor:'#42352d',accent:'#b9a5e1',icons:['📕','📚','🕯️','🔑','🦉','🕰️','🪞','🧙','🦇','🔮','📜','🕸️']},
 {title:'Магазинът на вещицата',sky:'#1e3942',wall:'#3c4a40',floor:'#4a342f',accent:'#b6cf86',icons:['🎃','🧹','🧪','🕷️','🕯️','🍄','🦇','🐈','🔮','📜','🗝️','🧿']}
];
const anchors=[[130,125],[310,125],[490,125],[685,125],[165,285],[340,285],[520,285],[710,285],[140,455],[315,455],[520,455],[720,455]];
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function shuffle(arr,seed){let x=seed||1,a=[...arr];for(let i=a.length-1;i>0;i--){x^=x<<13;x^=x>>>17;x^=x<<5;let j=(x>>>0)%(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Sofia',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
let state=null;
function setup(){let day=today(),seed=hash(day+'-logikon-differences-v1');let scene=scenes[seed%scenes.length],order=shuffle([...Array(12).keys()],seed);let icons=shuffle(scene.icons,seed^0x5a7bcd);let differences=order.slice(0,N).map((pos,i)=>({x:anchors[pos][0],y:anchors[pos][1],icon:icons[i],replace:icons[(i+7)%12]}));let key='lg_differences_'+day;let found=[];try{found=JSON.parse(localStorage.getItem(key)||'[]')}catch{};state={day,scene,differences,found:new Set(Array.isArray(found)?found.filter(x=>Number.isInteger(x)&&x>=0&&x<N):[]),key};}
function svg(variant){const s=state.scene;let out=`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${variant?'Променена':'Оригинална'} сцена: ${s.title}"><defs><linearGradient id="bg${variant}" x2="0" y2="1"><stop stop-color="${s.sky}"/><stop offset="1" stop-color="${s.wall}"/></linearGradient><pattern id="bricks${variant}" width="130" height="75" patternUnits="userSpaceOnUse"><path d="M0 0H130M65 0V38M0 38H130M0 38V75M130 38V75" stroke="#ffffff" stroke-opacity=".07" fill="none"/></pattern></defs><rect width="900" height="600" fill="url(#bg${variant})"/><rect width="900" height="445" fill="url(#bricks${variant})"/><path d="M0 445H900V600H0Z" fill="${s.floor}"/><path d="M0 460H900M0 520H900M0 580H900" stroke="#f1d5a4" stroke-opacity=".12" stroke-width="4"/><path d="M0 200H900M0 370H900" stroke="${s.accent}" stroke-width="10" stroke-opacity=".7"/><path d="M0 210H900M0 380H900" stroke="#1b1423" stroke-width="6"/><rect x="28" y="24" width="844" height="550" rx="16" fill="none" stroke="${s.accent}" stroke-opacity=".4" stroke-width="9"/>`;
 // Scene dressing, identical in both variants
 for(let i=0;i<10;i++){let x=35+i*91;out+=`<path d="M${x} 210v-18m0 188v-18" stroke="${s.accent}" stroke-width="5" opacity=".45"/>`}
 state.differences.forEach((d,i)=>{let icon=variant?d.replace:d.icon;out+=`<g transform="translate(${d.x},${d.y})"><ellipse cx="0" cy="40" rx="39" ry="9" fill="#090814" opacity=".35"/><text x="0" y="18" text-anchor="middle" font-size="62" font-family="Apple Color Emoji,Segoe UI Emoji,Noto Color Emoji,sans-serif">${icon}</text></g>`});
 // two extra stable objects (not differences)
 const used=new Set(state.differences.map(d=>d.x+','+d.y));anchors.filter(([x,y])=>!used.has(x+','+y)).forEach(([x,y],i)=>{out+=`<g transform="translate(${x},${y})"><text x="0" y="18" text-anchor="middle" font-size="62">${s.icons[(i+10)%12]}</text></g>`});
 state.found.forEach(i=>{const d=state.differences[i];out+=`<circle class="diff-circle" cx="${d.x}" cy="${d.y}" r="47"/>`});
 out+=`<rect x="0" y="0" width="900" height="600" fill="transparent" data-diff-canvas="${variant}"/>`;
 // rings must be on top of transparent capture overlay
 state.found.forEach(i=>{const d=state.differences[i];out+=`<circle class="diff-circle" cx="${d.x}" cy="${d.y}" r="47"/>`});
 return out+'</svg>';
}
function draw(){if(!state)setup();const root=document.getElementById('diff-root');if(!root)return;const complete=state.found.size===N;root.innerHTML=`<div class="diff-header"><div class="diff-muted">🔎 ДНЕВНО ПРЕДИЗВИКАТЕЛСТВО · ${state.day}</div><h1>Открий разликите</h1><div class="diff-muted">Играта е в процес на разработка — изображенията и режимите ще се разширяват.</div></div><div class="diff-toolbar"><span class="diff-counter">Открити ${state.found.size} / ${N}</span><button type="button" id="diff-fullscreen">⛶ Цял екран</button></div><div class="diff-images"><div class="diff-frame"><span class="diff-frame-title">Оригинал</span>${svg(0)}</div><div class="diff-frame"><span class="diff-frame-title">Разлики</span>${svg(1)}</div></div>${complete?'<div class="diff-result">🎉 Браво! Откри всичките 10 разлики! Утре те очаква нова сцена.</div>':''}<div class="diff-instructions">Натисни точно върху разлика в която и да е снимка. Откритото място ще се огради в червено и на двете изображения. Няма наказание за натискане на друго място.</div><div class="diff-zoom-note">На телефон изображенията се подреждат едно под друго. За по-голям изглед използвай „Цял екран“.</div>`;
 root.querySelectorAll('[data-diff-canvas]').forEach(el=>el.addEventListener('click',ev=>{const svg=el.ownerSVGElement;const rect=svg.getBoundingClientRect();const x=(ev.clientX-rect.left)*W/rect.width,y=(ev.clientY-rect.top)*H/rect.height;const idx=state.differences.findIndex((d,i)=>!state.found.has(i)&&Math.hypot(x-d.x,y-d.y)<=43);if(idx>=0){state.found.add(idx);try{localStorage.setItem(state.key,JSON.stringify([...state.found]))}catch{};draw();if(typeof window.toast==='function')window.toast('Разлика открита!')} }));
 root.querySelector('#diff-fullscreen')?.addEventListener('click',()=>{const box=document.querySelector('.diff-page');if(document.fullscreenElement)document.exitFullscreen?.();else box?.requestFullscreen?.().catch(()=>{})});
}
window.differencesRender=function(){if(!state||state.day!==today())setup();const app=document.getElementById('app');app.innerHTML='<section class="diff-page"><div id="diff-root"></div></section>';draw()};
})();
