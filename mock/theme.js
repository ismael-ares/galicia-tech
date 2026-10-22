/* Aplica el tema antes de pintar la página y comparte la elección entre pestañas. */
(()=>{
const key='galicia-tech-theme',root=document.documentElement,system=matchMedia('(prefers-color-scheme: dark)');
let preference=null;
try{const saved=localStorage.getItem(key);if(saved==='light'||saved==='dark')preference=saved}catch{}
const icons={dark:'<path d="M20.2 15.5A8.5 8.5 0 0 1 8.5 3.8 8.5 8.5 0 1 0 20.2 15.5Z"/>',light:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'};
function syncBrand(dark){
 document.querySelectorAll('img.brand-logo,img[data-brand-symbol]').forEach(image=>{
  const url=new URL(image.getAttribute('src'),document.baseURI);
  const file=image.hasAttribute('data-brand-symbol')?'galicia-tech-symbol-compact':'galicia-tech-logo';
  const parts=url.pathname.split('/'),name=parts.pop();
  if(name!==file+'.svg'&&name!==file+'-dark.svg')return;
  parts.push(file+(dark?'-dark':'')+'.svg');url.pathname=parts.join('/');
  url.searchParams.set('v','brand-motion-dark-20261020');
  if(image.src!==url.href)image.src=url.href;
 });
}
function apply(){const theme=preference||(system.matches?'dark':'light'),dark=theme==='dark';if(root.dataset.theme!==theme){root.classList.add('theme-changing');requestAnimationFrame(()=>requestAnimationFrame(()=>root.classList.remove('theme-changing')))}root.dataset.theme=theme;root.style.colorScheme=theme;syncBrand(dark);document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#101918':'#edf4f2');document.querySelectorAll('[data-theme-toggle]').forEach(button=>{const label=dark?'Activar modo claro':'Activar modo oscuro';button.setAttribute('aria-label',label);button.setAttribute('title',label);button.setAttribute('aria-pressed',String(dark));button.innerHTML=`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[dark?'light':'dark']}</svg>`})}
apply();
document.addEventListener('DOMContentLoaded',()=>{apply();document.querySelectorAll('[data-theme-toggle]').forEach(button=>button.addEventListener('click',()=>{preference=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem(key,preference)}catch{}apply()}))},{once:true});
system.addEventListener('change',()=>{if(!preference)apply()});
addEventListener('storage',event=>{if(event.key!==key&&event.key!==null)return;preference=event.newValue==='light'||event.newValue==='dark'?event.newValue:null;apply()});
})();
