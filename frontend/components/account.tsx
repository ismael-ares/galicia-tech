'use client';
import {useI18n} from './i18n';
import Link from 'next/link';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowRight,Bookmark,Github,LockKeyhole,Mail,ShieldCheck,UserRound} from 'lucide-react';
import {SignOut,useApp} from './shell';
import {api,ApiError} from '@/lib/api';

export function Login(){
 const {t}=useI18n();const {refresh,csrfToken,providers}=useApp();const router=useRouter();
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [code,setCode]=useState('');
 const [mfa,setMfa]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(event:React.FormEvent){
  event.preventDefault();setBusy(true);setError('');
  try{
   await api('/_allauth/browser/v1/auth/'+(mfa?'2fa/authenticate':'login'),{method:'POST',body:JSON.stringify(mfa?{code}:{email,password})});
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
  <form onSubmit={submit}>{mfa?<label>{t('Código de verificación')}<input value={code} onChange={e=>setCode(e.target.value)} autoComplete="one-time-code" autoFocus required maxLength={32}/></label>:<><label>{t('Correo electrónico')}<div className="input-with-icon"><Mail size={17}/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="username"/></div></label><label>{t('Contraseña')}<div className="input-with-icon"><LockKeyhole size={17}/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required autoComplete="current-password"/></div></label></>}
  {error&&<p className="error-message" role="alert">{error}</p>}<button type="submit" disabled={busy} className="button primary w-full">{t(busy?'Comprobando…':mfa?'Verificar':'Entrar')}<ArrowRight size={17}/></button></form><Link className="text-action justify-center" href="/">{t('Volver a la agenda')}</Link></div></div>;
}

function Security(){
 const {t}=useI18n();const {user,refresh,providers,csrfToken}=useApp();const [reauth,setReauth]=useState<'setup'|'recovery'|null>(null);const [confirmation,setConfirmation]=useState('');const [secret,setSecret]=useState('');const [qr,setQr]=useState('');const [code,setCode]=useState('');const [codes,setCodes]=useState<string[]>([]);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function begin(){
  setBusy(true);setError('');
  try{await api('/_allauth/browser/v1/account/authenticators/totp');}
  catch(error){const failure=error as ApiError;const meta=failure.payload?.meta as {secret?:string;totp_url?:string}|undefined;
   if(failure.status===404&&meta?.secret&&meta.totp_url){setSecret(meta.secret);try{const result=await api<{image:string}>('/api/v1/account/mfa-qr/',{method:'POST',body:JSON.stringify({value:meta.totp_url})});setQr(result.image);}catch(e){setError((e as Error).message);}}
   else setError(failure.message);
  }finally{setBusy(false);}
 }
 async function activate(event:React.FormEvent){event.preventDefault();setBusy(true);setError('');try{await api('/_allauth/browser/v1/account/authenticators/totp',{method:'POST',body:JSON.stringify({code})});setSecret('');setQr('');setCode('');await refresh();await recovery();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 async function recovery(){setError('');try{const response=await api<{data:{unused_codes?:string[]}}>('/_allauth/browser/v1/account/authenticators/recovery-codes');setCodes(response.data.unused_codes||[]);}catch(e){setError((e as Error).message);}}
 async function confirm(event:React.FormEvent){event.preventDefault();setBusy(true);setError('');try{await api('/_allauth/browser/v1/auth/reauthenticate',{method:'POST',body:JSON.stringify({password:confirmation})});setConfirmation('');const action=reauth;setReauth(null);if(action==='recovery')await recovery();else await begin();}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 return <section className="panel"><div className="panel-title"><ShieldCheck size={22}/><h2>{t('Seguridad de la cuenta')}</h2></div><p>{t(user?.mfaEnabled?'Verificación en dos pasos activada.':'Protege tu cuenta con una aplicación de autenticación.')}</p>{!user?.mfaEnabled&&!secret&&!reauth&&<button className="button primary mt-5" disabled={busy} onClick={()=>setReauth('setup')}>{t('Configurar verificación en dos pasos')}</button>}
  {reauth&&<form onSubmit={confirm} className="mfa-enrollment"><label>{t('Confirma tu contraseña')}<input type="password" value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="current-password" required/></label><button className="button primary" disabled={busy}>{t('Continuar')}</button></form>}
  {secret&&<form onSubmit={activate} className="mfa-enrollment">{qr&&<img src={qr} width={180} height={180} alt={t('Código QR de configuración')}/>}<p>{t('Escanea el QR o añade esta clave manualmente a tu aplicación de autenticación.')}</p><code>{secret}</code><label>{t('Código de verificación')}<input value={code} onChange={e=>setCode(e.target.value)} autoComplete="one-time-code" inputMode="numeric" required pattern="[0-9]{6}"/></label><button className="button primary" disabled={busy}>{t('Activar')}</button></form>}
  {user?.mfaEnabled&&!codes.length&&!reauth&&<button className="button secondary mt-5" onClick={()=>setReauth('recovery')}>{t('Ver códigos de recuperación')}</button>}
  {codes.length>0&&<div className="recovery-codes"><p>{t('Guarda estos códigos en un lugar seguro. Cada uno se puede usar una vez.')}</p><pre>{codes.join('\n')}</pre><button className="button secondary" onClick={()=>setCodes([])}>{t('Ocultar códigos')}</button></div>}
  {providers.length>0&&<div className="social-buttons mt-5"><p>{t('Vincula una cuenta externa para usarla al iniciar sesión.')}</p>{providers.map(provider=><form key={provider} method="post" action="/_allauth/browser/v1/auth/provider/redirect"><input type="hidden" name="csrfmiddlewaretoken" value={csrfToken}/><input type="hidden" name="provider" value={provider}/><input type="hidden" name="process" value="connect"/><input type="hidden" name="callback_url" value="/cuenta"/><button className="button secondary" type="submit">{t('Vincular')} {provider==='google'?'Google':'GitHub'}</button></form>)}</div>}{error&&<p className="error-message" role="alert">{error}</p>}</section>;
}

export function Account(){const {t}=useI18n();const {role,user,favorites}=useApp();return <><div className="page-heading"><div><div className="eyebrow">{t('Espacio personal')}</div><h1>{t('Mi cuenta')}<span className="heading-dot">.</span></h1><p>{t(user?'Tus preferencias y accesos, en un mismo sitio.':'Accede para gestionar tu cuenta.')}</p></div></div><div className="account-grid"><section className="panel account-profile"><div className="profile-avatar"><UserRound size={30}/></div><h2>{user?user.name:t('Te damos la bienvenida')}</h2><p>{user?user.email:t('Puedes explorar todos los eventos sin registrarte.')}</p>{user?<SignOut/>:<Link href="/login" className="button primary">{t('Iniciar sesión')}<ArrowRight size={16}/></Link>}<Link className="account-list-link" href="/?guardados=1"><Bookmark size={19}/><span>{t('Eventos guardados')}</span><strong>{favorites.length}</strong></Link>{role==='admin'&&<Link href="/admin" className="admin-entry"><ShieldCheck size={23}/><div><strong>{t('Administración')}</strong><span>{t('Fuentes, revisión y configuración')}</span></div><ArrowRight size={19}/></Link>}</section>{user&&<Security/>}</div></>;}
