'use client';
import {useI18n} from './i18n';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowRight,Github,LockKeyhole,Mail,UserRound} from 'lucide-react';
import {useApp} from './shell';
import {api,ApiError} from '@/lib/api';

export function Login(){
 const {t}=useI18n();const {refresh,csrfToken,providers,registrationEnabled,usernameLoginEnabled,user}=useApp();const router=useRouter();
 useEffect(()=>{if(user)router.replace('/cuenta');},[user,router]);
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [code,setCode]=useState('');
 const [mfa,setMfa]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(event:React.FormEvent){
  event.preventDefault();setBusy(true);setError('');
  try{
   const identity=email.trim(),credentials=usernameLoginEnabled&&!identity.includes('@')?{username:identity,password}:{email:identity,password};
   await api('/_allauth/browser/v1/auth/'+(mfa?'2fa/authenticate':'login'),{method:'POST',body:JSON.stringify(mfa?{code}:credentials)});
   setPassword('');setCode('');await refresh();router.replace('/cuenta');
  }catch(error){
   const failure=error as ApiError;
   const data=failure.payload?.data as {flows?:{id:string;is_pending?:boolean}[]}|undefined;
   if(failure.status===401&&data?.flows?.some(flow=>flow.id==='mfa_authenticate'&&flow.is_pending)){setMfa(true);setPassword('');}
   else setError(failure.message);
  }finally{setBusy(false);}
 }
 return <div className="login-wrap"><div className="login-card"><img src="/icon.svg" alt="" width={60} height={60}/><div className="eyebrow">{t('Tu cuenta en Galicia Tech')}</div><h1>{t(mfa?'Verificación en dos pasos':'Inicia sesión')}</h1><p>{t(mfa?'Introduce el código de tu aplicación o un código de recuperación.':'Sincroniza tus eventos guardados entre dispositivos.')}</p>
  {!mfa&&providers.length>0&&<><div className="social-buttons">{providers.map(provider=><form key={provider} action="/_allauth/browser/v1/auth/provider/redirect" method="post"><input type="hidden" name="csrfmiddlewaretoken" value={csrfToken}/><input type="hidden" name="provider" value={provider}/><input type="hidden" name="process" value="login"/><input type="hidden" name="callback_url" value="/cuenta"/><button className="button secondary w-full" type="submit">{provider==='github'?<Github size={19}/>:<img src="/assets/login/google.png" alt="" width={19} height={19}/>} {t(provider==='github'?'Continuar con GitHub':'Continuar con Google')}</button></form>)}</div><div className="login-divider"><span/>{t('o con tu correo')}<span/></div></>}
  <form onSubmit={submit}>{mfa?<label>{t('Código de verificación')}<input value={code} onChange={e=>setCode(e.target.value)} autoComplete="one-time-code" autoFocus required maxLength={32}/></label>:<><label>{t(usernameLoginEnabled?'Usuario o correo electrónico':'Correo electrónico')}<div className="input-with-icon">{usernameLoginEnabled?<UserRound size={17}/>:<Mail size={17}/>}<input type={usernameLoginEnabled?'text':'email'} value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username"/></div></label><label>{t('Contraseña')}<div className="input-with-icon"><LockKeyhole size={17}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></div></label></>}
  {error&&<p className="error-message" role="alert">{error}</p>}<button type="submit" disabled={busy} className="button primary w-full">{t(busy?'Comprobando…':mfa?'Verificar':'Entrar')}<ArrowRight size={17}/></button></form>{!mfa&&registrationEnabled&&<p className="auth-switch">{t('¿No tienes cuenta?')} <Link href="/registro">{t('Crear cuenta')}</Link></p>}<Link className="text-action justify-center" href="/">{t('Volver a la agenda')}</Link></div></div>;
}

export function Register(){
 const {t}=useI18n();const {registrationEnabled,user,refresh}=useApp();const router=useRouter();
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(user)router.replace('/cuenta');},[user,router]);
 async function submit(event:React.FormEvent){
  event.preventDefault();setError('');if(password!==confirmation){setError(t('Las contraseñas no coinciden.'));return;}
  setBusy(true);
  try{await api('/_allauth/browser/v1/auth/signup',{method:'POST',body:JSON.stringify({email:email.trim(),password})});setPassword('');setConfirmation('');await refresh();router.replace('/cuenta');}
  catch(error){setError((error as Error).message);}finally{setBusy(false);}
 }
 if(user)return null;
 return <div className="login-wrap"><div className="login-card register-card"><img src="/icon.svg" alt="" width={60} height={60}/><div className="eyebrow">{t('Tu cuenta en Galicia Tech')}</div><h1>{t(registrationEnabled?'Crear cuenta':'Registro cerrado')}</h1>
  <p>{t(registrationEnabled?'Guarda tus encuentros y accede a ellos desde cualquier dispositivo.':'En este momento no se admiten nuevas cuentas.')}</p>
  {registrationEnabled&&<form onSubmit={submit}><label>{t('Correo electrónico')}<div className="input-with-icon"><Mail size={17}/><input type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="username" maxLength={254} required/></div></label>
   <label>{t('Contraseña')}<div className="input-with-icon"><LockKeyhole size={17}/><input type="password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="new-password" minLength={12} required aria-describedby="signup-password-hint"/></div></label><small className="auth-hint" id="signup-password-hint">{t('Al menos 12 caracteres. Evita contraseñas comunes.')}</small>
   <label>{t('Repite la contraseña')}<div className="input-with-icon"><LockKeyhole size={17}/><input type="password" value={confirmation} onChange={event=>setConfirmation(event.target.value)} autoComplete="new-password" minLength={12} required/></div></label>
   {error&&<p className="error-message" role="alert">{error}</p>}<button type="submit" disabled={busy} className="button primary w-full">{t(busy?'Creando cuenta…':'Crear cuenta')}<ArrowRight size={17}/></button>
  </form>}
  <p className="auth-switch">{registrationEnabled&&t('¿Ya tienes cuenta?')+' '}<Link href="/login">{t('Iniciar sesión')}</Link></p><Link className="text-action justify-center" href="/">{t('Volver a la agenda')}</Link>
 </div></div>;
}

export {EventPortal as Account} from './event-portal';
