/* Recorrido visual únicamente: sin validar, leer, enviar ni guardar credenciales. */
(()=>{
const $=id=>document.getElementById(id),form=$('login-form');
const destinations={'cuenta.html':'Mi cuenta'};
const params=new URLSearchParams(location.search),requested=params.get('next'),destination=Object.hasOwn(destinations,requested)?requested:'cuenta.html';
const states={inicio:'login',error:'error',caducada:'expired','segundo-factor':'mfa',salida:'signed-out'};
let state=states[params.get('estado')]||'login';
$('login-destination').textContent=destinations[destination];
function hidePassword(){const input=$('login-password');input.type='password';const button=$('toggle-password');button.setAttribute('aria-label','Mostrar contraseña');button.setAttribute('aria-pressed','false');button.title='Mostrar contraseña'}
function render(nextState,focus=false){
 state=nextState;const mfa=state==='mfa',backup=state==='backup',second=mfa||backup,recovery=state==='recovery',error=state==='error';
 $('login-title').textContent=recovery?'Recuperar el acceso':backup?'Usa un código de recuperación':mfa?'Verifica tu acceso':'Iniciar sesión';
 $('login-step').textContent=recovery?'AYUDA CON TU CUENTA':second?'SEGUNDO FACTOR':'ACCESO A TU CUENTA';
 $('login-intro').textContent=recovery?'Mantén una vía de recuperación para tu cuenta.':backup?'Introduce uno de los códigos que guardaste al configurar el segundo factor.':mfa?'Introduce el código de tu aplicación de autenticación.':'Accede a tu cuenta de Galicia Tech.';
 $('login-social').hidden=second||recovery;$('login-credentials').hidden=second||recovery;$('login-mfa').hidden=!mfa;$('login-backup').hidden=!backup;$('login-recovery-view').hidden=!recovery;$('login-submit-area').hidden=recovery;
 $('login-submit').innerHTML='Iniciar sesión <span aria-hidden="true">→</span>';
 const notice=$('login-notice');notice.hidden=!['error','expired','signed-out'].includes(state);notice.classList.toggle('is-error',error);notice.setAttribute('role',error?'alert':'status');notice.textContent=error?'No hemos podido iniciar sesión con esos datos. Inténtalo de nuevo.':state==='expired'?'Tu sesión ha caducado. Vuelve a identificarte para continuar.':state==='signed-out'?'Has salido de la demostración. Puedes volver a recorrer el acceso.':'';
 for(const id of ['login-user','login-password']){$(id).setAttribute('aria-invalid',String(error));$(id).setAttribute('aria-describedby',error?'login-notice login-demo-note':'login-demo-note')};
 hidePassword();document.querySelectorAll('[data-login-state]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.loginState===(state==='signed-out'?'login':state))));
 if(focus){$('login-title').tabIndex=-1;$('login-title').focus()}
}
function enter(provider='local'){form.reset();hidePassword();location.assign(destination+'?perfil=usuario&metodo='+provider)}
form.addEventListener('submit',event=>{event.preventDefault();enter()});
document.querySelectorAll('[data-social-login]').forEach(button=>{button.disabled=false;button.addEventListener('click',()=>{const provider=button.dataset.socialLogin;if(provider==='github'||provider==='google')enter(provider)})});
$('toggle-password').addEventListener('click',()=>{const input=$('login-password'),show=input.type==='password';input.type=show?'text':'password';const label=show?'Ocultar contraseña':'Mostrar contraseña';$('toggle-password').setAttribute('aria-label',label);$('toggle-password').setAttribute('aria-pressed',String(show));$('toggle-password').title=label});
$('open-recovery').addEventListener('click',()=>{form.reset();render('recovery',true)});$('open-recovery-mfa').addEventListener('click',()=>{form.reset();render('backup',true)});$('return-mfa').addEventListener('click',()=>{form.reset();render('mfa',true)});
$('return-login').addEventListener('click',()=>render('login',true));
document.querySelectorAll('[data-login-state]').forEach(button=>button.addEventListener('click',()=>{form.reset();render(button.dataset.loginState,true)}));
// Sin JavaScript los botones permanecen desactivados. Ningún campo tiene atributo name.
form.querySelectorAll('button').forEach(button=>button.disabled=false);document.querySelectorAll('[data-login-state]').forEach(button=>button.disabled=false);render(state);
})();
