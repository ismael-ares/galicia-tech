'use client';
import {useI18n} from './i18n';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import {ArrowRight,ArrowUpRight,Bookmark,CalendarDays,Check,Cloud,CloudUpload,Github,Languages,LockKeyhole,Mail,MapPin,Monitor,Moon,ShieldCheck,Sun,UserRound} from 'lucide-react';
import {SignOut,useApp} from './shell';
import {api,ApiError} from '@/lib/api';
import {eventDays} from '@/lib/calendar';
import {type Event} from '@/lib/data';
import {Poster} from './catalog';
import {CommunityLogo} from './community-logo';

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

function AccountPreferences(){
 const {t,locale,setLocale}=useI18n();const {appearance,setAppearance}=useApp();
 return <section className="personal-panel personal-preferences" aria-labelledby="personal-preferences-title">
  <div className="personal-section-title"><h2 id="personal-preferences-title">{t('A tu manera')}</h2><span><Monitor size={13}/>{t('Este navegador')}</span></div>
  <fieldset className="personal-preference"><legend><Languages size={16}/>{t('Idioma')}</legend><div className="personal-options">{(['gl','es'] as const).map(value=><label key={value}><input type="radio" name="account-language" value={value} checked={locale===value} onChange={()=>setLocale(value)}/><span><b aria-hidden="true">{value.toUpperCase()}</b>{value==='gl'?'Galego':'Castellano'}{locale===value&&<Check size={14} aria-hidden="true"/>}</span></label>)}</div></fieldset>
  <fieldset className="personal-preference"><legend><Sun size={16}/>{t('Apariencia')}</legend><div className="personal-options appearance-options">{(['light','dark'] as const).map(value=><label key={value}><input type="radio" name="account-appearance" value={value} checked={appearance===value} onChange={()=>setAppearance(value)}/><span>{value==='light'?<Sun size={16}/>:<Moon size={16}/>}<i className={'appearance-sample '+value} aria-hidden="true"><i/><i/><i/></i>{t(value==='light'?'Claro':'Oscuro')}{appearance===value&&<Check size={14} aria-hidden="true"/>}</span></label>)}</div></fieldset>
 </section>;
}

function AccountEvent({event,featured=false,past=false}:{event:Event;featured?:boolean;past?:boolean}){
 const {t,eventText,formatDate}=useI18n();
 return <Link href={'/evento/'+event.id} className={'personal-event '+(featured?'personal-event-featured':'')} data-account-event={event.id}>
  {featured?<div className="personal-event-cover"><Poster event={event}/></div>:<time className="personal-event-date" dateTime={event.start}><strong>{formatDate(event.start,{day:'2-digit'})}</strong><span>{formatDate(event.start,{month:'short'}).replace('.','')}</span></time>}
  <div className="personal-event-info"><span className="personal-event-community"><CommunityLogo identity={event.community} size={16}/>{event.community}</span><h3>{eventText(event.title)}</h3><div className="personal-event-facts">{featured&&<time dateTime={event.start}><CalendarDays size={13}/>{formatDate(event.start,{day:'numeric',month:'short'})}</time>}<span><MapPin size={13}/>{event.city}</span>{past&&<span className="personal-event-past">{t('Pasado')}</span>}</div></div><ArrowUpRight className="personal-event-arrow" size={19} aria-hidden="true"/>
 </Link>;
}

function AccountCollection({today}:{today:string}){
 const {t}=useI18n();const {user,catalog,favorites,pendingGuestFavorites,importGuestFavorites,notify}=useApp();
 const [busy,setBusy]=useState(false);
 const selection=catalog.events.filter(event=>favorites.includes(event.id));
 const upcoming=selection.filter(event=>eventDays(event).end>=today).sort((a,b)=>new Date(a.start).getTime()-new Date(b.start).getTime());
 const past=selection.filter(event=>eventDays(event).end<today).sort((a,b)=>new Date(b.start).getTime()-new Date(a.start).getTime());
 const preview=(upcoming.length?upcoming:past).slice(0,3);
 async function importSaved(){setBusy(true);try{await importGuestFavorites();notify(t('Guardados añadidos a tu cuenta.'));}catch(error){notify((error as Error).message);}finally{setBusy(false);}}
 return <section className="personal-panel personal-collection" aria-labelledby="personal-collection-title">
  <div className="personal-section-title"><div><span className="personal-kicker"><Bookmark size={13}/>{t(user?'Tu colección':'En este dispositivo')}</span><h2 id="personal-collection-title">{t(!selection.length?'Aquí empieza tu próxima quedada':upcoming.length?'Tus próximos encuentros':'De tu archivo')}</h2></div>{selection.length>0&&<Link href="/guardados" className="personal-all">{t('Ver todos')}<ArrowRight size={15}/></Link>}</div>
  {preview.length>0?<div className="personal-events">{preview.map((event,index)=><AccountEvent key={event.id} event={event} featured={index===0} past={!upcoming.length}/>)}</div>:<div className="personal-empty"><div className="personal-empty-art" aria-hidden="true"><span/><span/><Bookmark size={33} strokeWidth={1.5}/></div><h3>{t('Encuentra algo que te apetezca')}</h3><p>{t('Guarda una charla, un taller o un encuentro. Tu selección aparecerá aquí.')}</p><Link href="/" className="button primary">{t('Explorar eventos')}<ArrowUpRight size={16}/></Link></div>}
  {selection.length>0&&<div className="personal-collection-foot"><span>{user?<Cloud size={14}/>:<Monitor size={14}/>} {t(user?'Disponibles desde cualquier dispositivo.':'Guardados solo en este navegador.')}</span><Link href="/" className="text-action">{t('Seguir explorando')}<ArrowUpRight size={14}/></Link></div>}
  {user&&pendingGuestFavorites.length>0&&<div className="personal-import"><CloudUpload size={20}/><div><strong>{t('Trae tus guardados del navegador')}</strong><p>{pendingGuestFavorites.length} {t('por añadir a tu cuenta. Tu colección actual se conserva.')}</p></div><button type="button" className="button secondary" disabled={busy} onClick={importSaved}>{t(busy?'Añadiendo…':'Añadir guardados del navegador')}</button></div>}
 </section>;
}

function ConnectedProviders(){
 const {t}=useI18n();const {providers,csrfToken}=useApp();
 if(!providers.length)return null;
 return <section className="personal-panel personal-connections"><div className="personal-section-title"><h2>{t('Formas de entrar')}</h2></div><p>{t('Vincula una cuenta externa para usarla al iniciar sesión.')}</p><div className="social-buttons">{providers.map(provider=><form key={provider} method="post" action="/_allauth/browser/v1/auth/provider/redirect"><input type="hidden" name="csrfmiddlewaretoken" value={csrfToken}/><input type="hidden" name="provider" value={provider}/><input type="hidden" name="process" value="connect"/><input type="hidden" name="callback_url" value="/cuenta"/><button className="button secondary w-full" type="submit">{provider==='github'?<Github size={17}/>:<img src="/assets/login/google.png" alt="" width={17} height={17}/>} {t('Vincular')} {provider==='google'?'Google':'GitHub'}</button></form>)}</div></section>;
}

export function Account({today}:{today:string}){
 const {t}=useI18n();const {role,user,catalog,favorites,registrationEnabled,cases}=useApp();
 const selection=catalog.events.filter(event=>favorites.includes(event.id));
 const upcoming=selection.filter(event=>eventDays(event).end>=today);
 const discovery=catalog.events.filter(event=>eventDays(event).end>=today).sort((a,b)=>new Date(a.start).getTime()-new Date(b.start).getTime()).slice(0,3);
 const name=user?.name.includes('@')?user.name.split('@')[0]:user?.name;
 const initials=Array.from(name||'').slice(0,2).join('').toUpperCase();
 return <div className="personal-page" data-authenticated={!!user}>
  {user?<header className="personal-heading"><div><div className="eyebrow">{t('Espacio personal')}</div><h1>{t('Mi cuenta')}<span className="heading-dot">.</span></h1></div><Link href="/" className="personal-back">{t('Volver a la agenda')}<ArrowUpRight size={15}/></Link></header>:null}
  {user?<section className="personal-identity" aria-label={t('Tu perfil')}><div className="personal-avatar" aria-hidden="true">{initials}<img src="/icon.svg" alt="" width={24} height={24}/></div><div className="personal-identity-copy"><span className="personal-membership">{t(role==='admin'?'Administración':'Miembro de Galicia Tech')}</span><h2 title={name}>{name}</h2><p>{user.email}</p></div><dl className="personal-stats"><div><dt>{t('Guardados')}</dt><dd>{selection.length.toString().padStart(2,'0')}</dd></div><div><dt>{t('Por venir')}</dt><dd>{upcoming.length.toString().padStart(2,'0')}</dd></div></dl><div className="personal-signout"><SignOut/></div></section>:
  <section className="personal-welcome"><div className="personal-welcome-copy"><div className="eyebrow"><img src="/icon.svg" alt="" width={23} height={23}/>{t('Tu cuenta en Galicia Tech')}</div><h1>{t('Tus guardados,')}<br/><span>{t('en cualquier dispositivo.')}</span></h1><p>{t('Reúne los encuentros que te interesan y recupera tu colección al iniciar sesión, estés donde estés.')}</p><div className="personal-welcome-actions">{registrationEnabled?<><Link href="/registro" className="button primary">{t('Crear cuenta')}<ArrowRight size={17}/></Link><Link href="/login" className="personal-login">{t('Iniciar sesión')}<ArrowUpRight size={15}/></Link></>:<Link href="/login" className="button primary">{t('Iniciar sesión')}<ArrowRight size={17}/></Link>}</div><span className="personal-welcome-note"><Bookmark size={13}/>{t('También puedes seguir guardando sin cuenta.')}</span></div><div className="personal-welcome-visual" aria-hidden="true"><div className="personal-orbit"/><div className="personal-preview-covers">{discovery.map(event=><div key={event.id}><Poster event={event}/></div>)}{!discovery.length&&<div className="personal-preview-placeholder"><Bookmark size={58} strokeWidth={1}/></div>}</div><div className="personal-sync-label"><Cloud size={17}/><span>{t('Tu colección, contigo')}</span><Check size={14}/></div></div></section>}
  <div className="personal-layout"><div className="personal-main"><AccountCollection today={today}/>{!user&&<div className="personal-benefits"><div><Bookmark size={19}/><strong>{t('Una colección propia')}</strong><p>{t('Charlas, talleres y encuentros reunidos por ti.')}</p></div><div><Cloud size={19}/><strong>{t('De un dispositivo a otro')}</strong><p>{t('Entra con tu cuenta y encuentra tus guardados.')}</p></div><div><CloudUpload size={19}/><strong>{t('Con lo que ya tenías')}</strong><p>{t('Añade los guardados de este navegador cuando quieras.')}</p></div></div>}</div><aside className="personal-sidebar"><AccountPreferences/>{user&&<ConnectedProviders/>}{role==='admin'&&<Link href="/admin" className="admin-entry personal-admin"><span className="personal-admin-icon"><ShieldCheck size={22}/></span><div><strong>{t('Administración')}</strong><span>{t('Fuentes, revisión y configuración')}</span>{cases.some(item=>item.decision.status==='pending')&&<small>{cases.filter(item=>item.decision.status==='pending').length} {t('casos por revisar')}</small>}</div><ArrowUpRight size={18}/></Link>}</aside></div>
 </div>;
}
