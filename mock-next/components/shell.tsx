'use client';
import { LanguageSwitch, useI18n } from './i18n';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { ArrowUpRight, Bookmark, Check, Compass, LogOut, Moon, Settings2, ShieldCheck, Sun, UserRound, X } from 'lucide-react';
import { shellSvg } from '@/lib/shell';
import { Decision } from '@/lib/data';
import { reducedMotion } from './motion';
type Role = 'visitor' | 'user' | 'admin';
type State = {role: Role; favorites: string[]; disabled: string[]; decisions: Record<string, Decision>};
const initial: State = {role:'visitor', favorites:[], disabled:[], decisions:{}};
const Context = createContext({ ...initial, ready:false, setRole: (_:Role)=>{}, toggleFavorite: (_:string)=>{}, toggleSource: (_:string)=>{}, decide: (_:string, __:Decision)=>{}, notify: (_:string)=>{} });
export const useMock = () => useContext(Context);
export function AppShell({children}:{children:React.ReactNode}) {const {t}=useI18n();
 const pathname=usePathname(); const [state,setState]=useState(initial); const [ready,setReady]=useState(false); const [dark,setDark]=useState(false); const [toast,setToast]=useState(''); const [motion,setMotion]=useState(false);
 const transitionRef=useRef<{skipTransition:()=>void}|null>(null);const themeGeneration=useRef(0);const requestedTheme=useRef<boolean|null>(null);
 useEffect(()=>{const preference=window.matchMedia('(prefers-reduced-motion: reduce)');const stop=()=>{if(preference.matches){transitionRef.current?.skipTransition();setMotion(false);}};preference.addEventListener('change',stop);return()=>{preference.removeEventListener('change',stop);transitionRef.current?.skipTransition();};},[]);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('galicia-tech-next-demo-v1')||'null');if(saved&&['visitor','user','admin'].includes(saved.role))setState({...initial,...saved, favorites:Array.isArray(saved.favorites)?saved.favorites.filter((x:unknown)=>typeof x==='string'):[], disabled:Array.isArray(saved.disabled)?saved.disabled.filter((x:unknown)=>typeof x==='string'):[], decisions:saved.decisions&&typeof saved.decisions==='object'?saved.decisions:{}});}catch{} setReady(true);setDark(document.documentElement.dataset.theme==='dark');},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem('galicia-tech-next-demo-v1',JSON.stringify(state));}catch{setToast(t("El navegador no permite guardar las preferencias."));}},[state,ready]);
 useEffect(()=>{if(!toast)return; const timer=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(timer);},[toast]);
 function theme(){
  const next=!(requestedTheme.current??document.documentElement.dataset.theme==='dark');requestedTheme.current=next;
  const generation=++themeGeneration.current;transitionRef.current?.skipTransition();
  const apply=()=>{if(generation!==themeGeneration.current)return;document.documentElement.dataset.theme=next?'dark':'light';flushSync(()=>setDark(next));try{localStorage.setItem('galicia-tech-theme',next?'dark':'light');}catch{}};
  if(reducedMotion()||!document.startViewTransition){apply();document.documentElement.classList.remove('theme-changing');return;}
  try{document.documentElement.classList.add('theme-changing');const transition=document.startViewTransition(apply);transitionRef.current=transition;transition.ready.catch(()=>{});transition.finished.catch(()=>{}).finally(()=>{if(generation===themeGeneration.current){document.documentElement.classList.remove('theme-changing');transitionRef.current=null;}});}catch{apply();document.documentElement.classList.remove('theme-changing');}
 }
 const value={...state,ready,setRole:(role:Role)=>setState(s=>({...s,role})),toggleFavorite:(id:string)=>setState(s=>({...s,favorites:s.favorites.includes(id)?s.favorites.filter(x=>x!==id):[...s.favorites,id]})),toggleSource:(id:string)=>setState(s=>({...s,disabled:s.disabled.includes(id)?s.disabled.filter(x=>x!==id):[...s.disabled,id]})),decide:(id:string,d:Decision)=>setState(s=>({...s,decisions:{...s.decisions,[id]:d}})),notify:setToast};
 return <Context.Provider value={value}>
  <a href="#main" className="skip-link">{t("Saltar al contenido")}</a>
  <div className="preview-bar"><span><span className="status-dot"/>{t("Prototipo interactivo")} <span className="preview-date">{t("· lecturas del 19–20 oct 2026")}</span></span><Link href="/cuenta">{state.role==='visitor'?t("Vista de visitante"):state.role==='admin'?t("Vista de administrador"):t("Vista de usuario")} <Settings2 size={12}/></Link></div>
  <header className="site-header"><div className="header-inner">
   <div className="brand"><button className={'brand-symbol '+(motion?'shell-play':'')} onClick={()=>{setMotion(false);if(!reducedMotion())requestAnimationFrame(()=>setMotion(true));}} onAnimationEnd={e=>{if(e.target===e.currentTarget)setMotion(false);}} aria-label={t("Animar la vieira")} dangerouslySetInnerHTML={{__html:shellSvg}}/><Link href="/" className="brand-word">galicia<span>tech<span className="brand-period">.</span></span></Link></div>
   <nav className="desktop-nav" aria-label={t("Principal")}><Link href="/" className={pathname==='/'?'active':''}><Compass size={17}/>{t("Explorar")}</Link><Link href="/guardados" className={pathname==='/guardados'?'active':''}><Bookmark size={16}/>{t("Guardados")}{state.favorites.length>0&&<span className="tiny-count">{state.favorites.length}</span>}</Link></nav>
   <div className="header-actions"><button className="icon-button" onClick={theme} aria-label={dark?t("Activar modo claro"):t("Activar modo oscuro")}><span className="theme-glyph" key={dark?'sun':'moon'}>{dark?<Sun size={19}/>:<Moon size={19}/>}</span></button><LanguageSwitch/><Link href={state.role==='visitor'?'/login':'/cuenta'} className="account-button" aria-label={t("Mi cuenta")}><UserRound size={17}/><span>{state.role==='visitor'?t("Mi cuenta"):'Isma'}</span></Link></div>
  </div></header>
  <main id="main" className="page-container">{children}</main>
  <footer className="site-footer"><span>galicia tech<span className="brand-period">.</span><small>{t("Comunidades y encuentros")}</small></span><div><span>{t("Horarios de Galicia")}</span><Link href="/portadas">{t("Portadas automáticas")} <ArrowUpRight size={13}/></Link><Link href="/demo">{t("Sobre esta muestra")} <ArrowUpRight size={13}/></Link></div></footer>
  <nav className="mobile-nav" aria-label={t("Navegación móvil")}><Link href="/" aria-current={pathname==='/'?'page':undefined}><Compass size={20}/>{t("Explorar")}</Link><Link href="/guardados" aria-current={pathname==='/guardados'?'page':undefined}><Bookmark size={20}/>{t("Guardados")}</Link><Link href="/cuenta" aria-current={pathname==='/cuenta'?'page':undefined}><UserRound size={20}/>{t("Mi cuenta")}</Link></nav>
  {toast&&<div className="toast" role="status"><Check size={17}/>{toast}<button onClick={()=>setToast('')} aria-label={t("Cerrar aviso")}><X size={16}/></button></div>}
 </Context.Provider>;
}
export function AdminGate({children}:{children:React.ReactNode}) {const {t}=useI18n();
 const {role,ready}=useMock();
 if(!ready)return <div className="empty-state">{t("Cargando vista de muestra…")}</div>;
 if(role!=='admin')return <div className="center-card"><ShieldCheck size={32}/><h1>{t("Área de administración")}</h1><p>{t("Esta vista está disponible para el perfil administrador de la muestra.")}</p><Link className="button primary" href="/cuenta">{t("Ir a mi cuenta")}</Link><small>{t("La autorización real se implementará en Django.")}</small></div>;
 return <><div className="admin-heading"><div className="eyebrow"><ShieldCheck size={14}/>{t("Administración")}</div><Link href="/cuenta"><UserRound size={15}/>{t("Mi cuenta")}</Link></div><nav className="admin-tabs" aria-label={t("Administración")}>{[['/admin','Resumen'],['/admin/fuentes','Fuentes'],['/admin/revision','Revisión'],['/admin/ajustes','Configuración']].map(([href,label])=><AdminLink key={href} href={href} label={t(label)}/>)}</nav>{children}</>;
}
function AdminLink({href,label}:{href:string;label:string}){const {t}=useI18n();const path=usePathname();return <Link href={href} className={path===href?'active':''}>{t(label)}</Link>;}
export function SignOut(){const {t}=useI18n();const {setRole,notify}=useMock();return <button className="button secondary" onClick={()=>{setRole('visitor');notify(t("Perfil de muestra cerrado."));}}><LogOut size={16}/>{t("Salir de la muestra")}</button>;}
