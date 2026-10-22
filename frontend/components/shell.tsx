'use client';
import { LanguageSwitch, useI18n } from './i18n';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowUpRight, Bookmark, Check, Compass, LogOut, Moon, Settings2, ShieldCheck, Sun, UserRound, X } from 'lucide-react';
import { shellSvg } from '@/lib/shell';
import { type Catalog, type Decision, type ReviewCase, type User } from '@/lib/data';
import { api } from '@/lib/api';
import { reducedMotion } from './motion';
type State={user:User|null;favorites:string[];catalog:Catalog;cases:ReviewCase[];csrfToken:string;providers:string[];requireAdminMfa:boolean};
const emptyCatalog:Catalog={events:[],sources:[],covers:[],ranking:[],translations:{},sample:false};
const initial:State={user:null,favorites:[],catalog:emptyCatalog,cases:[],csrfToken:'',providers:[],requireAdminMfa:true};
const Context=createContext({...initial,role:'visitor' as 'visitor'|'user'|'admin',disabled:[] as string[],ready:false,error:'',
 refresh:async()=>{},logout:async()=>{},toggleFavorite:async(_:string)=>{},toggleSource:async(_:string)=>{},decide:async(_:string,__:Decision)=>{},notify:(_:string)=>{}});
export const useApp=()=>useContext(Context);
export const useMock=useApp;
export function AppShell({children}:{children:React.ReactNode}) {const {t}=useI18n();
 const pathname=usePathname(); const [state,setState]=useState(initial); const [ready,setReady]=useState(false); const [dark,setDark]=useState(false); const [toast,setToast]=useState(''); const [motion,setMotion]=useState(false);
 const transitionRef=useRef<{skipTransition:()=>void}|null>(null);const themeGeneration=useRef(0);const requestedTheme=useRef<boolean|null>(null);
 useEffect(()=>{const preference=window.matchMedia('(prefers-reduced-motion: reduce)');const stop=()=>{if(preference.matches){transitionRef.current?.skipTransition();setMotion(false);}};preference.addEventListener('change',stop);return()=>{preference.removeEventListener('change',stop);transitionRef.current?.skipTransition();};},[]);
 const [error,setError]=useState('');
 async function refresh(){
  const [session,catalog]=await Promise.all([api<Omit<State,'catalog'|'cases'>>('/api/v1/session/'),api<Catalog>('/api/v1/catalog/')]);
  let cases:ReviewCase[]=[];
  if(session.user?.role==='admin'&&(!session.requireAdminMfa||session.user.mfaEnabled)){
   const [reviews,sources]=await Promise.all([api<ReviewCase[]>('/api/v1/admin/reviews/'),api<Catalog['sources']>('/api/v1/admin/sources/')]);
   cases=reviews;catalog.sources=sources;
  }
  setState({...session,catalog,cases});setError('');setReady(true);
 }
 useEffect(()=>{let active=true;refresh().catch(e=>{if(active){setError(e.message);setReady(true);}});setDark(document.documentElement.dataset.theme==='dark');return()=>{active=false;};},[]);
 useEffect(()=>{if(!toast)return; const timer=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(timer);},[toast]);
 function theme(){
  const next=!(requestedTheme.current??document.documentElement.dataset.theme==='dark');requestedTheme.current=next;
  const generation=++themeGeneration.current;transitionRef.current?.skipTransition();
  const apply=()=>{if(generation!==themeGeneration.current)return;document.documentElement.dataset.theme=next?'dark':'light';flushSync(()=>setDark(next));try{localStorage.setItem('galicia-tech-theme',next?'dark':'light');}catch{}};
  if(reducedMotion()||!document.startViewTransition){apply();document.documentElement.classList.remove('theme-changing');return;}
  try{document.documentElement.classList.add('theme-changing');const transition=document.startViewTransition(apply);transitionRef.current=transition;transition.ready.catch(()=>{});transition.finished.catch(()=>{}).finally(()=>{if(generation===themeGeneration.current){document.documentElement.classList.remove('theme-changing');transitionRef.current=null;}});}catch{apply();document.documentElement.classList.remove('theme-changing');}
 }
 const role:'visitor'|'user'|'admin'=state.user?.role||'visitor';
 const value={...state,role,ready,error,disabled:state.catalog.sources.filter(s=>!s.enabled).map(s=>s.id),refresh,notify:setToast,
  logout:async()=>{await api('/_allauth/browser/v1/auth/session',{method:'DELETE'}).catch(e=>{if(e.status!==401)throw e;});await refresh();},
  toggleFavorite:async(id:string)=>{if(!state.user)throw new Error(t('Inicia sesión para guardar encuentros.'));await api('/api/v1/favorites/'+id+'/',{method:state.favorites.includes(id)?'DELETE':'PUT'});await refresh();},
  toggleSource:async(id:string)=>{const source=state.catalog.sources.find(s=>s.id===id);if(!source)return;await api('/api/v1/admin/sources/'+id+'/',{method:'PATCH',body:JSON.stringify({enabled:!source.enabled})});await refresh();},
  decide:async(id:string,decision:Decision)=>{const item=state.cases.find(c=>c.id===id);if(!item)return;await api('/api/v1/admin/reviews/'+id+'/',{method:'PATCH',body:JSON.stringify({...decision,version:item.version})});await refresh();},
 };
 return <Context.Provider value={value}>
  <a href="#main" className="skip-link">{t("Saltar al contenido")}</a>
  {state.catalog.sample&&<div className="preview-bar"><span>{t('Datos de muestra · octubre 2026')}</span><span>{t('Versión 0.1 · homelab')}</span></div>}
  <header className="site-header"><div className="header-inner">
   <div className="brand"><button className={'brand-symbol '+(motion?'shell-play':'')} onClick={()=>{setMotion(false);if(!reducedMotion())requestAnimationFrame(()=>setMotion(true));}} onAnimationEnd={e=>{if(e.target===e.currentTarget)setMotion(false);}} aria-label={t("Animar la vieira")} dangerouslySetInnerHTML={{__html:shellSvg}}/><Link href="/" className="brand-word">galicia<span>tech<span className="brand-period">.</span></span></Link></div>
   <nav className="desktop-nav" aria-label={t("Principal")}><Link href="/" className={pathname==='/'?'active':''}><Compass size={17}/>{t("Explorar")}</Link><Link href="/guardados" className={pathname==='/guardados'?'active':''}><Bookmark size={16}/>{t("Guardados")}{state.favorites.length>0&&<span className="tiny-count">{state.favorites.length}</span>}</Link></nav>
   <div className="header-actions"><button className="icon-button" onClick={theme} aria-label={dark?t("Activar modo claro"):t("Activar modo oscuro")}><span className="theme-glyph" key={dark?'sun':'moon'}>{dark?<Sun size={19}/>:<Moon size={19}/>}</span></button><LanguageSwitch/><Link href={role==='visitor'?'/login':'/cuenta'} className="account-button" aria-label={t("Mi cuenta")}><UserRound size={17}/><span>{role==='visitor'?t("Mi cuenta"):state.user?.name}</span></Link></div>
  </div></header>
  <main id="main" className="page-container">{error?<div className="empty-state" role="alert"><h1>{t('No se ha podido cargar la agenda')}</h1><p>{error}</p><button className="button primary" onClick={()=>refresh().catch(e=>setError(e.message))}>{t('Reintentar')}</button></div>:!ready?<div className="empty-state" role="status">{t('Cargando agenda…')}</div>:children}</main>
  <footer className="site-footer"><span>galicia tech<span className="brand-period">.</span><small>{t("Comunidades y encuentros")}</small></span><div><span>{t("Horarios de Galicia")}</span></div></footer>
  <nav className="mobile-nav" aria-label={t("Navegación móvil")}><Link href="/" aria-current={pathname==='/'?'page':undefined}><Compass size={20}/>{t("Explorar")}</Link><Link href="/guardados" aria-current={pathname==='/guardados'?'page':undefined}><Bookmark size={20}/>{t("Guardados")}</Link><Link href="/cuenta" aria-current={pathname==='/cuenta'?'page':undefined}><UserRound size={20}/>{t("Mi cuenta")}</Link></nav>
  {toast&&<div className="toast" role="status"><Check size={17}/>{toast}<button onClick={()=>setToast('')} aria-label={t("Cerrar aviso")}><X size={16}/></button></div>}
 </Context.Provider>;
}
export function AdminGate({children}:{children:React.ReactNode}) {const {t}=useI18n();
 const {role,ready,user,requireAdminMfa}=useApp();
 if(!ready)return <div className="empty-state">{t('Cargando cuenta…')}</div>;
 if(role!=='admin')return <div className="center-card"><ShieldCheck size={32}/><h1>{t('Área de administración')}</h1><p>{t('Esta cuenta no tiene permisos de administración.')}</p><Link className="button primary" href={user?'/cuenta':'/login'}>{t('Ir a mi cuenta')}</Link></div>;
 if(requireAdminMfa&&!user?.mfaEnabled)return <div className="center-card"><ShieldCheck size={32}/><h1>{t('Activa la verificación en dos pasos')}</h1><p>{t('Configúrala en tu cuenta antes de acceder a la administración.')}</p><Link className="button primary" href="/cuenta">{t('Ir a mi cuenta')}</Link></div>;
 return <><div className="admin-heading"><div className="eyebrow"><ShieldCheck size={14}/>{t("Administración")}</div><Link href="/cuenta"><UserRound size={15}/>{t("Mi cuenta")}</Link></div><nav className="admin-tabs" aria-label={t("Administración")}>{[['/admin','Resumen'],['/admin/fuentes','Fuentes'],['/admin/revision','Revisión'],['/admin/ajustes','Configuración']].map(([href,label])=><AdminLink key={href} href={href} label={t(label)}/>)}</nav>{children}</>;
}
function AdminLink({href,label}:{href:string;label:string}){const {t}=useI18n();const path=usePathname();return <Link href={href} className={path===href?'active':''}>{t(label)}</Link>;}
export function SignOut(){const {t}=useI18n();const {logout,notify}=useApp();return <button className="button secondary" onClick={()=>logout().then(()=>notify(t('Sesión cerrada.'))).catch(e=>notify(e.message))}><LogOut size={16}/>{t('Cerrar sesión')}</button>;}
