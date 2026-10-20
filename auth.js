(()=>{'use strict';
const config=window.LOGIKON_AUTH_CONFIG||{};
let ready=false;
let client=null;
async function initializeAuth(){
  if(!config.url||!config.anonKey) return;
  if(!window.supabase){
    for(const src of ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js','https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js']){
      try { await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.head.appendChild(script)}); if(window.supabase)break; } catch(e){console.warn('Supabase CDN unavailable',src)}
    }
  }
  if(!window.supabase)return;
  try{client=window.supabase.createClient(config.url,config.anonKey);ready=true;}catch(e){console.error('Supabase initialization error',e)}
}
let user=null;
const $=s=>document.querySelector(s);
const safe=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const errorMessage=e=>({"Invalid login credentials":"Невалиден имейл или парола.","Email not confirmed":"Потвърдете имейла си, преди да влезете.","User already registered":"Този имейл вече е регистриран.","Password should be at least 6 characters":"Паролата е твърде кратка.","For security purposes, you can only request this after":"Изчакайте малко, преди да опитате отново."}[e?.message]||e?.message||'Възникна грешка.');
function sync(){const b=$('#authButton');if(!b)return;const name=user?.user_metadata?.username||user?.email?.split('@')[0];b.textContent=user?'👤 '+String(name).slice(0,20):'Влез';b.title=user?'Моят профил':'Влез или се регистрирай';}
function modal(mode='login'){
  $('#authOverlay')?.remove();const overlay=document.createElement('div');overlay.id='authOverlay';overlay.className='auth-overlay';overlay.innerHTML=`<div class="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="authTitle"><button class="auth-close" type="button" aria-label="Затвори">×</button><div class="auth-mark">♞</div><h2 id="authTitle"></h2><p class="auth-subtitle">Твоето място за логически предизвикателства</p><div id="authContent"></div><p class="auth-feedback" role="status" aria-live="polite"></p></div>`;document.body.append(overlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('.auth-close'))overlay.remove()});
  overlay.addEventListener('click',e=>{const m=e.target.closest('[data-auth-mode]');if(m)render(m.dataset.authMode)});
  document.addEventListener('keydown',function escKey(e){if(e.key==='Escape'){overlay.remove();document.removeEventListener('keydown',escKey)}},{once:false});
  function feedback(message,success=false){const el=overlay.querySelector('.auth-feedback');el.textContent=message;el.classList.toggle('success',success)}
  function render(m){mode=m;feedback('');const title={login:'Вход',register:'Регистрация',reset:'Забравена парола',profile:'Моят профил'};$('#authTitle').textContent=title[m]||title.login;
    if(m==='profile'){$('#authContent').innerHTML=`<div class="auth-profile"><div class="auth-avatar">👤</div><strong>${safe(user?.user_metadata?.username||'Играч')}</strong><small>${safe(user?.email)}</small></div><button class="auth-submit" id="authLogout">Изход от профила</button>`;$('#authLogout').onclick=async()=>{const {error}=await client.auth.signOut();if(error)feedback(errorMessage(error));else overlay.remove()};return}
    const fields=m==='register'?'<label>Потребителско име<input name="username" minlength="3" maxlength="24" pattern="[A-Za-zА-Яа-яЍѝ0-9_]+" autocomplete="nickname" required></label>':'';
    $('#authContent').innerHTML=`${!ready?'<div class="auth-notice">Регистрацията ще заработи след свързване със Supabase. Виж AUTH-SETUP.txt.</div>':''}<form id="authForm">${fields}<label>Имейл<input name="email" type="email" autocomplete="email" required></label>${m!=='reset'?`<label>Парола<input name="password" type="password" minlength="8" autocomplete="${m==='register'?'new-password':'current-password'}" required></label>`:''}${m==='register'?'<label>Потвърди паролата<input name="confirm" type="password" minlength="8" autocomplete="new-password" required></label>':''}<button class="auth-submit" type="submit" ${!ready?'disabled':''}>${m==='login'?'Влез':m==='register'?'Създай профил':'Изпрати имейл за възстановяване'}</button></form><div class="auth-switch">${m==='login'?'<button data-auth-mode="reset">Забравена парола?</button><span>Нямаш профил? <button data-auth-mode="register">Регистрирай се</button></span>':m==='register'?'<span>Имаш профил? <button data-auth-mode="login">Влез</button></span>':'<button data-auth-mode="login">Назад към вход</button>'}</div>`;
    $('#authForm').onsubmit=async e=>{e.preventDefault();if(!client)return;const form=e.currentTarget;const data=new FormData(form),email=String(data.get('email')||'').trim(),password=String(data.get('password')||'');const submit=form.querySelector('[type=submit]');if(m==='register'){const name=String(data.get('username')||'').trim();if(!/^[\p{L}\p{N}_]{3,24}$/u.test(name))return feedback('Името трябва да е 3–24 букви, цифри или _.');if(password!==data.get('confirm'))return feedback('Паролите не съвпадат.');}submit.disabled=true;feedback('Моля, изчакайте…');try{let result;if(m==='login')result=await client.auth.signInWithPassword({email,password});else if(m==='register')result=await client.auth.signUp({email,password,options:{data:{username:String(data.get('username')).trim()}}});else result=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(result.error)throw result.error;if(m==='login'){overlay.remove();sync()}else if(m==='register'){feedback(result.data.session?'Профилът е създаден успешно!':'Проверете имейла си за потвърждение.',true)}else feedback('Ако имейлът е регистриран, ще получите инструкции.',true)}catch(err){feedback(errorMessage(err))}finally{submit.disabled=false}};
  }render(user?'profile':mode);overlay.querySelector('.auth-close').focus();}
  document.addEventListener('DOMContentLoaded',async()=>{await initializeAuth();const btn=$('#authButton');if(!btn)return;btn.onclick=()=>modal();if(client){client.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;sync()});const {data}=await client.auth.getSession();user=data.session?.user||null;sync();if(location.hash.includes('type=recovery')){modal('reset');const note=$('.auth-feedback');if(note)note.textContent='Използвайте имейла за възстановяване на паролата.';}}else sync()});
})();
