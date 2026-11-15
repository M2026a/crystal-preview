(()=>{'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),small=matchMedia('(max-width:700px)');
const frames=[
['supra','カーコーティングで、愛車に艶を。','スープラのガラスコーティング',2800],
['film','カーフィルムで、車内を心地よく。','クラウンエステートの断熱フィルム施工',2600],
['seat','シートコーティングで、触れる場所も大切に。','マセラティのシートコーティング',2600],
['polish','仕上がりは、下地から。','塗装の状態に向き合う、丁寧な磨き。',3000],
['protect','大切なパーツを、きれいに守る。','ヘッドライトプロテクション',2600],
['wheel','ホイールまで、丁寧に。','ホイールコート',2200],
['glass','雨の日の視界も、心地よく。','ウインド撥水コート',2400],
['cars','新車も、乗り続けたい一台も。','愛車に合わせた施工をご相談ください。',2400],
['listen','話を聞いて、施工を選ぶ。','保管場所・乗り方・これからのことまで。',3200],
['logo','施工のあとも、相談できる。','愛車を長くきれいに。Crystal',3000]
];
let showing=null;
const customPhotos={supra:'assets/supra-glass-coating.jpg',film:'assets/service-photos/crown-estate-film-work.jpg',seat:'assets/service-photos/maserati-seat.jpg'};const photoURL=key=>customPhotos[key]||(key==='logo'?'assets/crystal-logo.png':key==='protect'?'assets/headlight-protection-detail.jpg':'assets/intro/'+key+'-'+(small.matches?'mobile':'desktop')+'.webp');
const cache=new Map();function photo(key){const url=photoURL(key);if(!cache.has(url))cache.set(url,new Promise((res,rej)=>{const i=new Image();i.decoding='async';i.onload=()=>i.decode().then(()=>res(i)).catch(()=>res(i));i.onerror=rej;i.src=url}));return cache.get(url)}
async function play(manual=false){if(showing)return;let firstPhoto;try{firstPhoto=await Promise.race([photo(frames[0][0]),new Promise((_,rej)=>setTimeout(()=>rej(Error('slow load')),manual?10000:10000))])}catch{return}if(showing)return;const previous=document.activeElement,d=document.createElement('dialog');d.className='c-opening';d.setAttribute('aria-label','Crystalの施工とお店の紹介。スキップできます');d.innerHTML='<div class="c-film-backdrop"></div><div class="c-film-photo"></div><div class="c-film-vignette"></div><div class="c-film-brand"><img src="assets/crystal-logo.png" width="1774" height="887" alt="Crystal — TOTAL BODY CARE / CARFILM &amp; COATING"></div><div class="c-film-caption"><span class="c-film-eyebrow"></span><p></p></div><button class="c-film-skip" type="button">スキップしてHPへ ↗</button><span class="c-film-count" aria-hidden="true"></span><div class="c-film-line" aria-hidden="true"></div>';
let cancelled=false,timer,sceneTimer;const stopPending=()=>{clearTimeout(sceneTimer);clearTimeout(timer)};showing=d;document.body.append(d);const stage=d.querySelector('.c-film-photo'),copy=d.querySelector('.c-film-caption p'),sub=d.querySelector('.c-film-eyebrow');
const finish=()=>{cancelled=true;stopPending();if(d.open)d.close()};d.querySelector('button').onclick=finish;d.addEventListener('close',()=>{cancelled=true;stopPending();d.remove();showing=null;if(manual)previous?.focus()},{once:true});d.showModal();
timer=setTimeout(finish,30000);d.style.setProperty('--film-duration',frames.reduce((sum,f)=>sum+f[3],0)+'ms');
for(let n=0;n<frames.length&&!cancelled;n++){
 let img;try{img=await Promise.race([n===0?Promise.resolve(firstPhoto):photo(frames[n][0]),new Promise((_,reject)=>setTimeout(()=>reject(Error('load timeout')),3000))])}catch{if(n===0){finish();return}continue}
 if(cancelled)return;const el=img.cloneNode();el.alt='';el.className='c-film-image';el.width=img.naturalWidth;el.height=img.naturalHeight;const old=stage.querySelector('.c-film-image:not(.is-leaving)');if(old){old.classList.add('is-leaving');setTimeout(()=>old.remove(),750)}stage.append(el);el.style.setProperty('--shot-time',frames[n][3]+'ms');d.dataset.scene=frames[n][0];d.classList.toggle('is-logo',frames[n][0]==='logo');copy.textContent=frames[n][1];sub.textContent=frames[n][2];for(const word of [copy,sub]){word.style.animation='none';void word.offsetWidth;word.style.animation='';}d.querySelector('.c-film-count').textContent=String(n+1).padStart(2,'0')+' / '+String(frames.length).padStart(2,'0');d.classList.add('has-photo');
 if(n+1<frames.length)photo(frames[n+1][0]).catch(()=>{});
 
 await new Promise(resolve=>sceneTimer=setTimeout(resolve,frames[n][3]));
 }
 if(!cancelled)finish();
}
document.querySelector('.b3-replay')?.addEventListener('click',()=>play(true));
let first=true;try{first=!sessionStorage.getItem('crystal-b3-intro')}catch{}if(first&&!reduced.matches)play();
const menu=document.querySelector('#c-jump-menu'),opener=document.querySelector('.c-jump-open');let oldFocus;
opener?.addEventListener('click',()=>{oldFocus=document.activeElement;menu.showModal();opener.setAttribute('aria-expanded','true')});
menu?.querySelector('.c-jump-close').addEventListener('click',()=>menu.close());menu?.addEventListener('click',e=>{if(e.target===menu)menu.close()});menu?.addEventListener('close',()=>{opener.setAttribute('aria-expanded','false');oldFocus?.focus()});
menu?.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const target=document.querySelector(a.hash);menu.close();requestAnimationFrame(()=>{history.replaceState(null,'',a.hash);target?.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true})}})}));
})();
