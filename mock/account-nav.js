/* Navegación de perfiles de muestra: la URL controla solo la presentación, nunca permisos reales. */
(()=>{
const params=new URLSearchParams(location.search),profiles=['visitante','usuario','admin'],candidate=params.get('perfil'),profile=profiles.includes(candidate)?candidate:'visitante';
const pages=['agenda.html','evento.html','cuenta.html','admin.html','fuentes.html','revision.html','ajustes.html'],privatePages=['admin.html','fuentes.html','revision.html','ajustes.html'];
const filename=location.pathname.split('/').pop();
function prepare(link){try{const url=new URL(link.getAttribute('href'),location.href);if(url.origin!==location.origin||!pages.includes(url.pathname.split('/').pop()))return;if(link.hasAttribute('data-account-link')){url.pathname=new URL('cuenta.html',location.href).pathname;url.search='';if(profile!=='visitante')url.searchParams.set('perfil',profile)}else if(profiles.includes(candidate)&&!url.searchParams.has('perfil'))url.searchParams.set('perfil',profile);link.href=url.href}catch{}}
document.querySelectorAll('a[href]').forEach(prepare);document.addEventListener('click',event=>{const link=event.target.closest('a[href]');if(link)prepare(link)},{capture:true});
if(privatePages.includes(filename)&&profile!=='admin'){
 const main=document.querySelector('main');main.className='management-main';main.innerHTML='<section class="not-found"><span class="sample-label">Vista de muestra</span><h1>Acceso restringido</h1><p>Esta sección requiere un perfil con permisos de administración.</p><a href="cuenta.html">Ir a mi cuenta</a><p class="subtle">Los perfiles de esta demo solo cambian su presentación. No hay autorización conectada.</p></section>';main.querySelectorAll('a').forEach(prepare);
}
})();
