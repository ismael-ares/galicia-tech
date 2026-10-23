'use client';
import {useState} from 'react';
import Link from 'next/link';
import {ShieldCheck} from 'lucide-react';
import {useI18n} from './i18n';
import {useApp} from './shell';
import {api,ApiError} from '@/lib/api';

export function AdminSecurity(){
 const {t}=useI18n();const {user,refresh}=useApp();const [reauth,setReauth]=useState<'setup'|'recovery'|null>(null);const [confirmation,setConfirmation]=useState('');const [secret,setSecret]=useState('');const [qr,setQr]=useState('');const [code,setCode]=useState('');const [codes,setCodes]=useState<string[]>([]);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
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
  {error&&<p className="error-message" role="alert">{error}</p>}</section>;
}

export function AdminAccess(){
 const {t}=useI18n();const {role}=useApp();
 if(role!=='admin')return <div className="center-card"><h1>{t('Área de administración')}</h1><p>{t('Esta cuenta no tiene permisos de administración.')}</p><Link href="/cuenta" className="button primary">{t('Ir a mi cuenta')}</Link></div>;
 return <div className="admin-access"><Link href="/admin" className="back-link">← {t('Administración')}</Link><AdminSecurity/></div>;
}
