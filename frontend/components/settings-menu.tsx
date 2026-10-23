'use client';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {useEffect,useId,useRef,useState,type KeyboardEvent} from 'react';
import {ArrowUpRight,ChevronDown,LogIn,LogOut,Settings,ShieldCheck,SlidersHorizontal,UserRound} from 'lucide-react';
import {useApp} from './shell';
import {useI18n} from './i18n';

export function SettingsMenu(){
 const {t}=useI18n();const {user,role,logout,notify,registrationEnabled}=useApp();
 const pathname=usePathname(),router=useRouter(),id=useId();
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false);
 const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null),first=useRef(0);
 const items=()=>Array.from(panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)')??[]);
 function close(restore=false){setOpen(false);if(restore)trigger.current?.focus();}
 function show(last=false){first.current=last?-1:0;if(open){const choices=items();choices.at(first.current)?.focus();}else setOpen(true);}
 useEffect(()=>{setOpen(false);},[pathname,user?.id]);
 useEffect(()=>{
  if(!open)return;
  const choices=items();choices.at(first.current)?.focus();
  const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!root.current?.contains(event.target))setOpen(false);};
  document.addEventListener('pointerdown',outside);
  return()=>document.removeEventListener('pointerdown',outside);
 },[open]);
 function keys(event:KeyboardEvent<HTMLDivElement>){
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(true);return;}
  if(event.key==='Tab'){requestAnimationFrame(()=>setOpen(false));return;}
  if(event.key===' '){event.preventDefault();(document.activeElement as HTMLElement)?.click();return;}
  const choices=items(),index=choices.indexOf(document.activeElement as HTMLElement);
  const step=event.key==='ArrowDown'?1:event.key==='ArrowUp'?-1:0;
  if(!step&&event.key!=='Home'&&event.key!=='End')return;
  event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?choices.length-1:(index+step+choices.length)%choices.length;
  choices[next]?.focus();
 }
 async function signOut(){
  setBusy(true);
  try{await logout();close(true);router.push('/');notify(t('Sesión cerrada.'));}
  catch(error){notify((error as Error).message);}
  finally{setBusy(false);}
 }
 const links=[
  {href:'/cuenta',icon:UserRound,label:'Tu cuenta',description:'Planes, asistencias y actividad'},
  {href:'/preferencias',icon:SlidersHorizontal,label:'Preferencias',description:'Apariencia e idioma'},
  ...(role==='admin'?[{href:'/admin',icon:ShieldCheck,label:'Administración',description:'Fuentes y revisión editorial'}]:[]),
 ];
 return <div className="settings-menu" ref={root} onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setOpen(false);}}>
  <button ref={trigger} type="button" className="settings-trigger" id={id+'-trigger'} aria-label={t('Ajustes')} aria-haspopup="menu" aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>open?close():show()} onKeyDown={event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();show(event.key==='ArrowUp');}}}>
   <Settings size={18}/><span>{t('Ajustes')}</span><ChevronDown size={13} className="settings-chevron"/>
  </button>
  {open&&<div ref={panel} id={id} className="settings-popover" role="menu" aria-labelledby={id+'-trigger'} onKeyDown={keys}>
   <div className="settings-identity" role="presentation"><span className="settings-avatar" aria-hidden="true">{user?Array.from(user.name.replace(/@.*/, '')).slice(0,2).join('').toUpperCase():<UserRound size={21}/>}</span><div><strong>{user?user.name:t('Sin iniciar sesión')}</strong><span>{user?user.email:t('Preferencias en este navegador')}</span></div></div>
   <div className="settings-destinations" role="presentation">{links.map(item=><Link key={item.href} href={item.href} role="menuitem" tabIndex={-1} className="settings-menu-item" aria-current={pathname===item.href||item.href==='/admin'&&pathname.startsWith('/admin/')?'page':undefined} onClick={()=>close()}><span className="settings-item-icon"><item.icon size={18}/></span><span><strong>{t(item.label)}</strong><small>{t(item.description)}</small></span><ArrowUpRight size={14} className="settings-item-arrow"/></Link>)}</div>
   <div className="settings-session" role="presentation">{user?<button type="button" role="menuitem" tabIndex={-1} className="settings-session-action" disabled={busy} onClick={signOut}><LogOut size={16}/><span>{t(busy?'Cerrando sesión…':'Cerrar sesión')}</span></button>:<><Link href="/login" role="menuitem" tabIndex={-1} className="settings-session-action" onClick={()=>close()}><LogIn size={16}/><span>{t('Iniciar sesión')}</span><ArrowUpRight size={14}/></Link>{registrationEnabled&&<Link href="/registro" role="menuitem" tabIndex={-1} className="settings-create-account" onClick={()=>close()}>{t('Crear cuenta')}<ArrowUpRight size={13}/></Link>}</>}</div>
  </div>}
 </div>;
}
