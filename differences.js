(()=>{
'use strict';
const puzzles=window.LOGIKON_DIFFERENCES_PUZZLES||[];
const TZ='Europe/Sofia',START='2026-10-28';
const halloweenPuzzles=window.LOGIKON_HALLOWEEN_DIFFERENCES||[];
function halloweenDay(){const [year,month,date]=day().split('-').map(Number);return month===10&&date>= (year===2026?29:25)&&date<=31;}
function halloweenPuzzle(){const [year,,date]=day().split('-').map(Number);const offset=year===2026?29:25;return halloweenPuzzles[(date-offset)%halloweenPuzzles.length];}

let mode='daily',practiceIndex=0,found=new Set(),loadedKey='',wrongAt=null;
const $=s=>document.querySelector(s);
function day(){return new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())}
function dayIndex(){const date=day();return Math.max(0,Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(START+'T12:00:00Z'))/86400000))}
function current(){return mode==='daily'&&halloweenDay()&&halloweenPuzzles.length?halloweenPuzzle():puzzles[mode==='daily'?dayIndex()%puzzles.length:practiceIndex%puzzles.length]}
function key(){return 'lg_diff_v35_'+mode+'_'+(mode==='daily'?day():practiceIndex)}
function load(){const k=key();if(k===loadedKey)return;loadedKey=k;try{const arr=JSON.parse(localStorage.getItem(k)||'[]');found=new Set(Array.isArray(arr)?arr.filter(x=>Number.isInteger(x)&&x>=0&&x<current().spots.length):[])}catch{found=new Set()}}
function save(){try{localStorage.setItem(key(),JSON.stringify([...found]))}catch{}}
function rings(p){return p.spots.map(([x,y],i)=>found.has(i)?`<span class="diff-ring" style="left:${x*100}%;top:${y*100}%" aria-hidden="true"></span>`:'').join('')}
function picture(p,side){return `<div class="diff-frame"><div class="diff-frame-title">${side==='a'?'Изображение 1':'Изображение 2'}</div><div class="diff-picture" data-side="${side}"><img src="${p[side]}" alt="${p.title} — ${side==='a'?'първо':'второ'} изображение" draggable="false">${rings(p)}</div></div>`}
function render(){const p=current();if(!p)return;load();const done=found.size===p.spots.length;const root=$('#diff-root');if(!root)return;
 root.innerHTML=`<div class="diff-header"><div class="diff-eyebrow">${mode==='daily'&&halloweenDay()?'🎃 ХЕЛОУИН · ДНЕВНА МИСИЯ':'🔎 ОТКРИЙ РАЗЛИКИТЕ'}</div><h1>${p.title}</h1><p>Открий разликите, като натискаш върху която и да е от двете картинки. Без таймер.</p></div><div class="diff-toolbar"><button type="button" data-mode="daily" class="${mode==='daily'?'active':''}">☀ Дневно предизвикателство</button><button type="button" data-mode="practice" class="${mode==='practice'?'active':''}">∞ Практика</button><span class="diff-counter">${found.size} / ${p.spots.length} открити</span><button type="button" id="diff-fullscreen">⛶ Цял екран</button></div><div class="diff-images">${picture(p,'a')}${picture(p,'b')}</div><div class="diff-progress"><div style="width:${found.size/p.spots.length*100}%"></div></div>${done?`<div class="diff-result">🎉 Браво! Откри всички ${p.spots.length} разлики! ${mode==='daily'?'Утре ще има нов пъзел.':'Можеш да продължиш с друг пъзел.'}</div>`:''}<div class="diff-bottom">${mode==='practice'?`<button type="button" id="diff-next">Следващ пъзел →</button>`:`<span>📅 Пъзел за ${day()} · ${puzzles.length} пъзела в библиотеката</span>`}<span>${p.source==='original-generated'?'Оригинална генерирана илюстрация':'Изображения: <a href="https://www.vecteezy.com/" target="_blank" rel="noopener noreferrer">Vecteezy</a>'}</span></div><p class="diff-help">Правилните места се ограждат и на двете изображения. Прогресът се запазва на това устройство. Практиката не носи точки за класацията.</p>`;
 root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;loadedKey='';render()});
 root.querySelectorAll('.diff-picture').forEach(el=>el.addEventListener('click',e=>{
 if(done)return;const rect=el.getBoundingClientRect();const x=(e.clientX-rect.left)/rect.width,y=(e.clientY-rect.top)/rect.height;
 const spots=p.spots;let best=-1,dist=Infinity;spots.forEach(([sx,sy],i)=>{if(found.has(i))return;const d=Math.hypot((sx-x)*rect.width,(sy-y)*rect.height);if(d<dist){dist=d;best=i}});
 const tolerance=Math.max(16,Math.min(40,rect.width*.055));if(best>=0&&dist<=tolerance){found.add(best);save();render();if(typeof window.toast==='function')window.toast('Разлика открита!')}else{el.classList.remove('diff-miss');void el.offsetWidth;el.classList.add('diff-miss');setTimeout(()=>el.classList.remove('diff-miss'),350)}
 }));
 root.querySelector('#diff-next')?.addEventListener('click',()=>{practiceIndex=(practiceIndex+1)%puzzles.length;loadedKey='';render()});
 root.querySelector('#diff-fullscreen')?.addEventListener('click',()=>{const el=$('.diff-page');if(document.fullscreenElement)document.exitFullscreen?.();else el?.requestFullscreen?.().catch(()=>{})});
}
window.differencesRender=()=>{const app=$('#app');if(!app)return;app.innerHTML='<section class="diff-page"><div id="diff-root"></div></section>';render()};
})();