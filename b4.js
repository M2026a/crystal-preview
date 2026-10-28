(()=>{
const trigger=document.querySelector('.b3-replay'), reduced=matchMedia('(prefers-reduced-motion: reduce)');let current=null;
const frames=[
 ['supra-landcruiser-private.png','cars-civic-workshop.png','スープラ・ランドクルーザー・シビック TYPE R','大切な一台は、人それぞれ。'],
 ['cars-alphard-black-bronze.png','cars-crown-hatch.png','アルファード・クラウン ほか','車種も、色も、こだわりも。'],
 ['body-polish.png','wheel-work.jpg','ボディ研磨 / ホイールコーティング 作業中','艶をつくる、細かな手仕事。'],
 ['headlight-film.png','moulding-film-work.jpg','ヘッドライト / モール フィルム施工中','きれいに整え、その先を守る。'],
 ['window-watercoat.png','wheel-off-car.jpg','窓の撥水コート / ホイールコーティング 作業中','窓から、足元まで。'],
 ['workshop-spacious-v13.png','cars-harrier-lexus.png','GLASS COATING / FILM / PROTECTION','まとめて相談。一台に合う施工を。']
];
function play(manual=false){if(current)return;const prev=document.activeElement,d=document.createElement('dialog');d.className='b3-intro';d.setAttribute('aria-label','Crystalの車と施工を紹介する約14秒のオープニング。スキップできます');
d.innerHTML='<div class="b3-film-stage"><div class="b3-film-pair"></div><div class="b3-film-pair"></div></div><div class="b3-intro-shade"></div><img class="b3-intro-logo" src="assets/crystal-logo.png" alt="Crystal"><div class="b3-intro-copy"><span></span><p></p></div><div class="b3-film-chapter" aria-hidden="true"></div><button class="b3-intro-close" type="button">スキップしてHPへ ↗</button><div class="b3-intro-progress" aria-hidden="true"></div>';
const pairs=[...d.querySelectorAll('.b3-film-pair')],copy=d.querySelector('.b3-intro-copy p'),label=d.querySelector('.b3-intro-copy span'),chapter=d.querySelector('.b3-film-chapter');let active=0;
frames.forEach(f=>f.slice(0,2).forEach(n=>{const i=new Image();i.src='assets/'+n}));
function frame(i){const next=pairs[active%2];next.innerHTML=frames[i].slice(0,2).map(n=>'<img src="assets/'+n+'" alt="">').join('');pairs.forEach(e=>e.classList.remove('is-current'));next.classList.add('is-current');active++;label.textContent=frames[i][2];copy.textContent=frames[i][3];chapter.textContent=String(i+1).padStart(2,'0')+' / 07';}
frame(0);document.body.append(d);current=d;const timers=[];
const finish=()=>{timers.forEach(clearTimeout);if(d.open)d.close()};
d.querySelector('button').addEventListener('click',finish);d.addEventListener('close',()=>{timers.forEach(clearTimeout);d.remove();current=null;if(manual&&prev instanceof HTMLElement)prev.focus()});d.showModal();
if(reduced.matches){d.querySelector('.b3-intro-progress').remove();d.querySelector('button').textContent='閉じてHPへ ↗';return;}
for(let i=1;i<frames.length;i++)timers.push(setTimeout(()=>frame(i),i*2000));
timers.push(setTimeout(()=>{d.classList.add('b3-intro-final');label.textContent='CRYSTAL / TOTAL BODY CARE';copy.textContent='愛車のこと、まず聞かせてください。';chapter.textContent='07 / 07'},12000),setTimeout(finish,14000));
}
trigger.addEventListener('click',()=>play(true));if(!reduced.matches){let first=true;try{first=!sessionStorage.getItem('crystal-b3-intro');sessionStorage.setItem('crystal-b3-intro','1')}catch{}if(first)play();}
})();
