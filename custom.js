// Crystal-specific behavior. The bundled script is preserved.
const crMenu=document.querySelector('.cr-menu');const crMobileMenu=document.querySelector('#mobile-menu');
function crCloseMenu(){crMenu.setAttribute('aria-expanded','false');crMobileMenu.hidden=true;}
crMenu.addEventListener('click',()=>{const open=crMenu.getAttribute('aria-expanded')==='true';crMenu.setAttribute('aria-expanded',String(!open));crMobileMenu.hidden=open;});
crMobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',crCloseMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!crMobileMenu.hidden){crCloseMenu();crMenu.focus();}});
const crHero=document.querySelector('.cr-hero');
const crPause=document.querySelector('.cr-motion');
const crReduced=matchMedia('(prefers-reduced-motion: reduce)');
let crHeroVisible=true;let crUserPaused=false;
function crSyncMotion(){const off=crReduced.matches||crUserPaused;document.body.classList.toggle('cr-motion-paused',off);document.body.classList.toggle('cr-motion-active',crHeroVisible&&!document.hidden&&!off);crPause.setAttribute('aria-pressed',String(crUserPaused));crPause.textContent=crUserPaused?'動きを再開する ▶':'動きを止める Ⅱ';}
crPause.addEventListener('click',()=>{crUserPaused=!crUserPaused;crSyncMotion();});
crReduced.addEventListener('change',crSyncMotion);document.addEventListener('visibilitychange',crSyncMotion);
const crHeroObserver=new IntersectionObserver(es=>{crHeroVisible=es[0].isIntersecting;crSyncMotion();},{threshold:0});crHeroObserver.observe(crHero);crSyncMotion();
