'use client';
import { LanguageSwitch, useI18n } from './i18n';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Check, LogOut, Moon, ShieldCheck, Sun, UserRound, X } from 'lucide-react';
import { shellSvg } from '@/lib/shell';
import { type Catalog, type Decision, type ReviewCase, type User } from '@/lib/data';
import { api, ApiError } from '@/lib/api';
import {guestFavoritesKey,readGuestFavorites,toggleGuestFavorite} from '@/lib/guest-favorites';
import { reducedMotion } from './motion';
import {BrowseNavigation} from './browse-navigation';
import {SettingsMenu} from './settings-menu';
import {version as appVersion} from '../package.json';
type State={user:User|null;favorites:string[];attended:string[];catalog:Catalog;cases:ReviewCase[];csrfToken:string;providers:string[];requireAdminMfa:boolean;registrationEnabled:boolean;usernameLoginEnabled:boolean;collectionEnabled:boolean};
const emptyCatalog:Catalog={events:[],sources:[],covers:[],ranking:[],translations:{},sample:false};
const initial:State={user:null,favorites:[],attended:[],catalog:emptyCatalog,cases:[],csrfToken:'',providers:[],requireAdminMfa:true,registrationEnabled:false,usernameLoginEnabled:false,collectionEnabled:false};
const Context=createContext({...initial,role:'visitor' as 'visitor'|'user'|'admin',disabled:[] as string[],ready:false,error:'',appearance:'light' as 'light'|'dark',setAppearance:(_: 'light'|'dark')=>{},
 guestFavorites:[] as string[],pendingGuestFavorites:[] as string[],importGuestFavorites:async()=>{},refresh:async()=>{},logout:async()=>{},toggleFavorite:async(_:string)=>{},setAttendance:async(_:string,__:boolean)=>{},decide:async(_:string,__:Decision)=>{},notify:(_:string)=>{}});
export const useApp=()=>useContext(Context);
export const useMock=useApp;
export function AppShell({children}:{children:React.ReactNode}) {const {t}=useI18n();
 const [state,setState]=useState(initial); const [ready,setReady]=useState(false); const [dark,setDark]=useState(false); const [toast,setToast]=useState(''); const [motion,setMotion]=useState(false);
 const transitionRef=useRef<{skipTransition:()=>void}|null>(null);const themeGeneration=useRef(0);const requestedTheme=useRef<boolean|null>(null);
 useEffect(()=>{const preference=window.matchMedia('(prefers-reduced-motion: reduce)');const stop=()=>{if(preference.matches){transitionRef.current?.skipTransition();setMotion(false);}};preference.addEventListener('change',stop);return()=>{preference.removeEventListener('change',stop);transitionRef.current?.skipTransition();};},[]);
 const [error,setError]=useState('');
 const [guestFavorites,setGuestFavorites]=useState<string[]>([]);
 useEffect(()=>{
  const reload=()=>{try{setGuestFavorites(readGuestFavorites(window.localStorage));}catch{setGuestFavorites([]);}};
  const changed=(event:StorageEvent)=>{if(event.key===guestFavoritesKey||event.key===null)reload();};
  reload();window.addEventListener('storage',changed);
  return()=>window.removeEventListener('storage',changed);
 },[]);
 async function refresh(){
  const [session,catalog]=await Promise.all([api<Omit<State,'catalog'|'cases'>>('/api/v1/session/'),api<Catalog>('/api/v1/catalog/')]);
  let cases:ReviewCase[]=[];
  if(session.user?.role==='admin'&&(!session.requireAdminMfa||session.user.mfaEnabled)){
   const [reviews,sources]=await Promise.all([api<ReviewCase[]>('/api/v1/admin/reviews/'),api<Catalog['sources']>('/api/v1/admin/sources/')]);
   cases=reviews;catalog.sources=sources;
  }
  setState({...session,attended:session.attended??[],catalog,cases});setError('');setReady(true);
 }
 useEffect(()=>{let active=true;refresh().catch(e=>{if(active){setError(e.message);setReady(true);}});setDark(document.documentElement.dataset.theme==='dark');return()=>{active=false;};},[]);
 useEffect(()=>{if(!toast)return; const timer=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(timer);},[toast]);
 function theme(value?:boolean){
  const current=requestedTheme.current??document.documentElement.dataset.theme==='dark';
  const next=value??!current;if(next===current)return;requestedTheme.current=next;
  const generation=++themeGeneration.current;transitionRef.current?.skipTransition();
  const apply=()=>{if(generation!==themeGeneration.current)return;document.documentElement.dataset.theme=next?'dark':'light';flushSync(()=>setDark(next));try{localStorage.setItem('galicia-tech-theme',next?'dark':'light');}catch{}};
  if(reducedMotion()||!document.startViewTransition){apply();document.documentElement.classList.remove('theme-changing');return;}
  try{document.documentElement.classList.add('theme-changing');const transition=document.startViewTransition(apply);transitionRef.current=transition;transition.ready.catch(()=>{});transition.finished.catch(()=>{}).finally(()=>{if(generation===themeGeneration.current){document.documentElement.classList.remove('theme-changing');transitionRef.current=null;}});}catch{apply();document.documentElement.classList.remove('theme-changing');}
 }
 const role:'visitor'|'user'|'admin'=state.user?.role||'visitor';
 const favorites=state.user?state.favorites:guestFavorites;
 const publishedIds=new Set(state.catalog.events.map(event=>event.id));
 const pendingGuestFavorites=guestFavorites.filter(id=>publishedIds.has(id)&&!state.favorites.includes(id));
 const value={...state,favorites,guestFavorites,pendingGuestFavorites,role,ready,error,appearance:dark?'dark' as const:'light' as const,setAppearance:(value:'light'|'dark')=>theme(value==='dark'),disabled:state.catalog.sources.filter(s=>!s.enabled).map(s=>s.id),refresh,notify:setToast,
  logout:async()=>{await api('/_allauth/browser/v1/auth/session',{method:'DELETE'}).catch(e=>{if(e.status!==401)throw e;});await refresh();},
  toggleFavorite:async(id:string)=>{
   if(!state.user){
    try{setGuestFavorites(toggleGuestFavorite(window.localStorage,id));}
    catch{throw new Error(t('El navegador no permite guardar encuentros en este equipo.'));}
    return;
   }
   try{await api('/api/v1/favorites/'+id+'/',{method:state.favorites.includes(id)?'DELETE':'PUT'});await refresh();}
   catch(error){if(error instanceof ApiError&&error.status===401){await refresh();throw new Error(t('Tu sesión ha caducado. Puedes seguir guardando en este navegador.'));}throw error;}
  },
  importGuestFavorites:async()=>{
   if(!state.user)return;
   const ids=pendingGuestFavorites.slice(0,1000);
   if(!ids.length)return;
   await api('/api/v1/favorites/import/',{method:'POST',body:JSON.stringify({ids})});
   // Keep the original local list: logging out must restore the visitor's
   // own selection, never a copy of the account's private saved events.
   await refresh();
  },
  setAttendance:async(id:string,value:boolean)=>{
   await api('/api/v1/attendance/'+id+'/',{method:value?'PUT':'DELETE'});
   await refresh();
  },
  decide:async(id:string,decision:Decision)=>{const item=state.cases.find(c=>c.id===id);if(!item)return;await api('/api/v1/admin/reviews/'+id+'/',{method:'PATCH',body:JSON.stringify({...decision,version:item.version})});await refresh();},
 };
 return <Context.Provider value={value}>
  <a href="#main" className="skip-link">{t("Saltar al contenido")}</a>
  {state.catalog.sample&&<div className="preview-bar"><span>{t('Datos de muestra · octubre 2026')}</span><span>{t('Versión')} {appVersion.split('.').slice(0,2).join('.')} · homelab</span></div>}
  <header className="site-header"><div className="header-inner">
   <div className="brand"><button className={'brand-symbol '+(motion?'shell-play':'')} onClick={()=>{setMotion(false);if(!reducedMotion())requestAnimationFrame(()=>setMotion(true));}} onAnimationEnd={e=>{if(e.target===e.currentTarget)setMotion(false);}} aria-label={t("Animar la vieira")} dangerouslySetInnerHTML={{__html:shellSvg}}/><Link href="/" className="brand-word">galicia<span>tech<span className="brand-period">.</span></span></Link></div>
   <BrowseNavigation/>
   <div className="header-actions"><button className="icon-button" onClick={()=>theme()} aria-label={dark?t("Activar modo claro"):t("Activar modo oscuro")}><span className="theme-glyph" key={dark?'sun':'moon'}>{dark?<Sun size={19}/>:<Moon size={19}/>}</span></button><LanguageSwitch/><SettingsMenu/></div>
  </div></header>
  <main id="main" className="page-container">{error?<div className="empty-state" role="alert"><h1>{t('No se ha podido cargar la agenda')}</h1><p>{error}</p><button className="button primary" onClick={()=>refresh().catch(e=>setError(e.message))}>{t('Reintentar')}</button></div>:!ready?<div className="empty-state" role="status">{t('Cargando agenda…')}</div>:children}</main>
  <footer className="site-footer"><span>galicia tech<span className="brand-period">.</span><small>{t("Comunidades y encuentros")}</small></span><div><span>{t("Horarios de Galicia")}</span></div></footer>
  <BrowseNavigation mobile/>
  {toast&&<div className="toast" role="status"><Check size={17}/>{toast}<button onClick={()=>setToast('')} aria-label={t("Cerrar aviso")}><X size={16}/></button></div>}
 </Context.Provider>;
}
export function AdminGate({children}:{children:React.ReactNode}) {const {t}=useI18n();
 const {role,ready,user,requireAdminMfa}=useApp();
 if(!ready)return <div className="empty-state">{t('Cargando cuenta…')}</div>;
 if(role!=='admin')return <div className="center-card"><ShieldCheck size={32}/><h1>{t('Área de administración')}</h1><p>{t('Esta cuenta no tiene permisos de administración.')}</p><Link className="button primary" href={user?'/cuenta':'/login'}>{t('Ir a mi cuenta')}</Link></div>;
 if(requireAdminMfa&&!user?.mfaEnabled)return <div className="center-card"><ShieldCheck size={32}/><h1>{t('Activa la verificación en dos pasos')}</h1><p>{t('Este servidor exige verificación adicional para administrar.')}</p><Link className="button primary" href="/admin/acceso">{t('Configurar acceso')}</Link></div>;
 return <><div className="admin-heading"><div className="eyebrow"><ShieldCheck size={14}/>{t("Administración")}</div><Link href="/cuenta"><UserRound size={15}/>{t("Mi cuenta")}</Link></div><nav className="admin-tabs" aria-label={t("Administración")}>{[['/admin','Resumen'],['/admin/fuentes','Fuentes'],['/admin/revision','Revisión'],['/admin/ajustes','Configuración']].map(([href,label])=><AdminLink key={href} href={href} label={t(label)}/>)}</nav>{children}</>;
}
function AdminLink({href,label}:{href:string;label:string}){const {t}=useI18n();const path=usePathname();return <Link href={href} className={path===href?'active':''}>{t(label)}</Link>;}
export function SignOut(){const {t}=useI18n();const {logout,notify}=useApp();return <button className="button secondary" onClick={()=>logout().then(()=>notify(t('Sesión cerrada.'))).catch(e=>notify(e.message))}><LogOut size={16}/>{t('Cerrar sesión')}</button>;}
