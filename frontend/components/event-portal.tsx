'use client';
import Link from 'next/link';
import {useRef,useState,type CSSProperties,type KeyboardEvent} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {ArrowRight,ArrowUpRight,Bookmark,CalendarDays,ChartNoAxesColumn,Check,CheckCheck,ChevronDown,Clock3,CloudUpload,Compass,History,MapPin,Settings2,ShieldCheck,Ticket,Users,UserRound} from 'lucide-react';
import {calendarDay,eventDays,moveMonth} from '@/lib/calendar';
import type {Event} from '@/lib/data';
import {useApp,SignOut} from './shell';
import {useI18n} from './i18n';
import {Poster} from './catalog';
import {CommunityLogo} from './community-logo';
import {AccountPreferences,ConnectedProviders} from './account-settings';
import {AttendanceButton} from './attendance';
import {reducedMotion} from './motion';

type View='proximos'|'pasados'|'asistidos';

function PortalEvent({event,history=false}:{event:Event;history?:boolean}){
 const {eventText,t,formatDate}=useI18n();const {attended}=useApp();const checked=attended.includes(event.id);
 return <article className="portal-event" data-portal-event={event.id} data-attended={checked}>
  <Link href={'/evento/'+event.id} className="portal-event-cover" tabIndex={-1} aria-hidden="true"><Poster event={event}/></Link>
  <div className="portal-event-copy"><div className="portal-community"><CommunityLogo identity={event.community} size={16}/><span>{event.community}</span></div><Link href={'/evento/'+event.id} className="portal-event-title"><h3>{eventText(event.title)}</h3></Link><div className="portal-event-meta"><time dateTime={event.start}><CalendarDays size={13}/>{formatDate(event.start,{day:'numeric',month:'short',year:'numeric'})}</time><span><MapPin size={13}/>{event.city}</span></div></div>
  <div className="portal-event-actions">{history?<AttendanceButton event={event}/>:<Link href={'/evento/'+event.id} className="portal-event-open" aria-label={t('Ver encuentro: ')+eventText(event.title)}><ArrowUpRight size={19}/></Link>}</div>
 </article>;
}

function NextEncounter({event,today}:{event:Event;today:string}){
 const {t,eventText,formatDate}=useI18n();const range=eventDays(event);
 return <article className="portal-next" data-portal-event={event.id}>
  <div className="portal-next-cover"><Poster event={event}/></div><div className="portal-next-copy"><div className="portal-next-kicker"><span/><span>{t(range.start<today?'En curso':range.start===today?'Hoy':'Tu próximo encuentro')}</span><Bookmark size={13}/></div><div className="portal-community"><CommunityLogo identity={event.community} size={17}/>{event.community}</div><Link href={'/evento/'+event.id}><h3>{eventText(event.title)}</h3></Link><div className="portal-next-facts"><time dateTime={event.start}><CalendarDays size={15}/>{formatDate(event.start,{day:'numeric',month:'short',year:'numeric'})}</time><span><Clock3 size={15}/>{formatDate(event.start,{hour:'2-digit',minute:'2-digit'})}</span><span><MapPin size={15}/>{event.city}</span></div><div className="portal-next-actions"><Link href={'/evento/'+event.id} className="button primary">{t('Ver encuentro')}<ArrowUpRight size={16}/></Link><AttendanceButton event={event}/></div></div>
 </article>;
}

function ImportSaved(){
 const {user,pendingGuestFavorites,importGuestFavorites,notify}=useApp();const {t}=useI18n();const [busy,setBusy]=useState(false);
 if(!user||!pendingGuestFavorites.length)return null;
 async function add(){setBusy(true);try{await importGuestFavorites();notify(t('Guardados añadidos a tu cuenta.'));}catch(error){notify((error as Error).message);}finally{setBusy(false);}}
 return <aside className="portal-import"><CloudUpload size={20}/><p><strong>{pendingGuestFavorites.length} {t(pendingGuestFavorites.length===1?'guardado en este navegador':'guardados en este navegador')}</strong><span>{t('Añádelos a tus planes sin sustituir los que ya tienes.')}</span></p><button className="button secondary" type="button" onClick={add} disabled={busy}>{t(busy?'Añadiendo…':'Añadir guardados del navegador')}<ArrowRight size={14}/></button></aside>;
}

export function EventPortal({today}:{today:string}){
 const {t,formatDate}=useI18n();const {user,role,catalog,favorites,attended,registrationEnabled}=useApp();
 const router=useRouter(),params=useSearchParams();const selected=params.get('seccion');const view:View=selected==='pasados'||selected==='asistidos'?selected:'proximos';
 const tabsRef=useRef<(HTMLButtonElement|null)[]>([]),settingsRef=useRef<HTMLDetailsElement>(null);
 const selection=catalog.events.filter(event=>favorites.includes(event.id));
 const upcoming=selection.filter(event=>eventDays(event).end>=today&&!attended.includes(event.id)).sort((a,b)=>new Date(a.start).getTime()-new Date(b.start).getTime());
 const past=selection.filter(event=>eventDays(event).end<today).sort((a,b)=>new Date(b.start).getTime()-new Date(a.start).getTime());
 const history=catalog.events.filter(event=>attended.includes(event.id)).sort((a,b)=>new Date(b.start).getTime()-new Date(a.start).getTime());
 const cities=new Set(history.map(event=>event.city)).size,communities=new Map<string,number>();
 history.forEach(event=>communities.set(event.community,(communities.get(event.community)||0)+1));
 const topCommunities=[...communities].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,3);
 const months=Array.from({length:6},(_,index)=>moveMonth(today.slice(0,7),index-5)).map(month=>({month,count:history.filter(event=>calendarDay(event.start).startsWith(month)).length}));
 const max=Math.max(1,...months.map(month=>month.count)),recent=months.reduce((total,month)=>total+month.count,0);
 const unmarked=past.filter(event=>!attended.includes(event.id)).length;
 const list=view==='proximos'?upcoming:view==='pasados'?past:history;
 const name=user?.name.includes('@')?user.name.split('@')[0]:user?.name;
 const tabs=[{id:'proximos' as const,label:'Próximos guardados',count:upcoming.length,icon:CalendarDays},{id:'pasados' as const,label:'Pasados guardados',count:past.length,icon:History},{id:'asistidos' as const,label:'Asistidos',count:history.length,icon:CheckCheck}];
 function navigate(value:View){const next=new URLSearchParams(params.toString());if(value==='proximos')next.delete('seccion');else next.set('seccion',value);router.push('/cuenta'+(next.size?'?'+next.toString():''),{scroll:false});}
 function tabKey(event:KeyboardEvent<HTMLButtonElement>,index:number){const step=event.key==='ArrowRight'?1:event.key==='ArrowLeft'?-1:0;if(!step&&event.key!=='Home'&&event.key!=='End')return;event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?2:(index+step+3)%3;navigate(tabs[next].id);tabsRef.current[next]?.focus();}
 function settings(){if(!settingsRef.current)return;settingsRef.current.open=true;settingsRef.current.scrollIntoView({behavior:reducedMotion()?'instant':'smooth',block:'start'});settingsRef.current.querySelector('summary')?.focus({preventScroll:true});}
 return <div className="event-portal" data-authenticated={!!user}>
  <header className="portal-heading"><div><div className="eyebrow"><Compass size={13}/>{t('Tu espacio de encuentros')}</div><h1>{t('Mis encuentros')}<span className="heading-dot">.</span></h1><p>{t('Tus próximos planes y tu historial de asistencia.')}</p></div><div className="portal-user-tools">{user&&<span className="portal-user"><span aria-hidden="true">{Array.from(name||'').slice(0,2).join('').toUpperCase()}</span><span><strong title={name}>{name}</strong><small>{t('Tu actividad en Galicia')}</small></span></span>}<button type="button" className="portal-settings-button" onClick={settings} aria-label={t('Abrir ajustes de cuenta')}><Settings2 size={17}/><span>{t('Ajustes')}</span></button>{role==='admin'&&<Link href="/admin" className="admin-entry portal-admin" aria-label={t('Administración')}><ShieldCheck size={17}/></Link>}</div></header>
  {!user&&<aside className="portal-signup"><div><UserRound size={22}/><p><strong>{t('Tu historial también tiene sitio aquí.')}</strong><span>{t('Crea una cuenta para registrar asistencias y llevar tus guardados contigo.')}</span></p></div><div>{registrationEnabled&&<Link href="/registro" className="button primary">{t('Crear cuenta')}<ArrowRight size={15}/></Link>}<Link href="/login" className="portal-login">{t('Iniciar sesión')}<ArrowUpRight size={14}/></Link></div></aside>}
  <div className="portal-stats" aria-label={t('Tus estadísticas de eventos')}><button type="button" className="portal-stat portal-stat-attended" onClick={()=>navigate('asistidos')}><div><span><CheckCheck size={17}/>{t('Asistidos')}</span><ArrowUpRight size={16}/></div><strong data-stat="attended">{user?history.length.toString().padStart(2,'0'):'—'}</strong><small>{t('Confirmados por ti')}</small></button><button type="button" className="portal-stat" onClick={()=>navigate('proximos')}><div><span><CalendarDays size={17}/>{t('Por venir')}</span><ArrowUpRight size={16}/></div><strong data-stat="upcoming">{upcoming.length.toString().padStart(2,'0')}</strong><small>{t('En tus guardados')}</small></button><div className="portal-stat"><div><span><MapPin size={17}/>{t('Localidades')}</span></div><strong data-stat="cities">{user?cities.toString().padStart(2,'0'):'—'}</strong><small>{t('En las que has estado')}</small></div><div className="portal-stat"><div><span><Users size={17}/>{t('Comunidades')}</span></div><strong data-stat="communities">{user?communities.size.toString().padStart(2,'0'):'—'}</strong><small>{t('De tus asistencias')}</small></div></div>
  <ImportSaved/>
  <div className="portal-body"><section className="portal-plans" aria-label={t('Tus encuentros')}><div className="portal-tabs" role="tablist" aria-label={t('Tus encuentros')}>{tabs.map((tab,index)=><button key={tab.id} ref={element=>{tabsRef.current[index]=element;}} id={'portal-tab-'+tab.id} role="tab" type="button" aria-controls="portal-event-panel" aria-selected={view===tab.id} tabIndex={view===tab.id?0:-1} onKeyDown={event=>tabKey(event,index)} onClick={()=>navigate(tab.id)}><tab.icon size={16}/><span>{t(tab.label)}</span><small>{tab.count}</small></button>)}</div><div className="portal-panel" id="portal-event-panel" role="tabpanel" tabIndex={0} aria-labelledby={'portal-tab-'+view}>
   <div className="portal-panel-heading"><div><h2>{t(view==='proximos'?'Tu agenda personal':view==='pasados'?'Los encuentros que guardaste':'Los encuentros que viviste')}</h2><p>{t(view==='proximos'?'Tus próximos guardados, por fecha.':view==='pasados'?'¿Estuviste allí? Añádelo a tu historial.':'Tu asistencia, registrada por ti.')}</p></div><Link href={view==='asistidos'?'/cuenta?seccion=pasados':view==='pasados'?'/?periodo=pasados':'/'} className="portal-explore">{t(view==='asistidos'?'Añadir asistencias':'Explorar')}<ArrowUpRight size={15}/></Link></div>
   {list.length>0?<div className="portal-event-list" key={view}>{view==='proximos'&&<NextEncounter event={list[0]} today={today}/>}{(view==='proximos'?list.slice(1):list).map(event=><PortalEvent key={event.id} event={event} history={view!=='proximos'}/>)}</div>:<div className="portal-empty">{view==='asistidos'?<CheckCheck size={32}/>:view==='pasados'?<History size={32}/>:<Bookmark size={32}/>}<h3>{t(view==='asistidos'?'Tu historia aún está por escribir':view==='pasados'?'Aún no hay pasados guardados':'Tu próximo plan está por descubrir')}</h3><p>{t(view==='asistidos'?(user?'Marca como asistidos los encuentros en los que hayas estado.':'Inicia sesión para construir tu historial de encuentros.'):'Guarda encuentros de la agenda para reunirlos en este espacio.')}</p><Link className="button primary" href={view==='asistidos'?(user?'/cuenta?seccion=pasados':'/login'):view==='pasados'?'/?periodo=pasados':'/'}>{t(view==='asistidos'?(user?'Ver pasados guardados':'Iniciar sesión'):view==='pasados'?'Explorar archivo':'Explorar eventos')}<ArrowRight size={15}/></Link></div>}
   {list.length>0&&<div className="portal-list-foot"><span>{view==='asistidos'?<CheckCheck size={13}/>:<Bookmark size={13}/>} {view==='asistidos'?history.length:selection.length} {t(view==='asistidos'?'asistencias registradas':'guardados en total')}</span><Link href={view==='asistidos'?'/?periodo=pasados':'/guardados'}>{t(view==='asistidos'?'Explorar archivo':'Ver colección completa')}<ArrowUpRight size={14}/></Link></div>}
  </div></section><aside className="portal-activity"><section className="portal-activity-card"><header><div><span className="portal-kicker"><ChartNoAxesColumn size={14}/>{t('Tu actividad')}</span><h2>{t('Asistencias por mes')}<span className="heading-dot">.</span></h2></div></header><div className="portal-activity-total"><strong>{user?recent:'—'}</strong><span>{t('asistencias')}<small>{t('Últimos 6 meses')}</small></span></div><ol className="portal-chart" aria-label={t('Asistencia por mes')}>{months.map(month=><li key={month.month} aria-label={formatDate(month.month+'-01T12:00:00Z',{month:'long',year:'numeric'})+': '+month.count+' '+t('asistencias')}><span className="portal-chart-track" aria-hidden="true" style={{'--bar-height':month.count/max*100+'%'} as CSSProperties}><b>{month.count||''}</b><i data-empty={!month.count}/></span><small>{formatDate(month.month+'-01T12:00:00Z',{month:'short'}).replace('.','')}</small></li>)}</ol><p className="portal-chart-caption">{t('Según la fecha de los encuentros que marcas como asistidos.')}</p>
   {topCommunities.length>0?<div className="portal-communities"><h3>{t('Comunidades de tu recorrido')}</h3>{topCommunities.map(([community,count])=><div key={community}><span><CommunityLogo identity={community} size={20}/></span><strong>{community}</strong><small>{count}</small></div>)}</div>:<div className="portal-history-hint"><Ticket size={22}/><div><strong>{t('De guardado a recuerdo')}</strong><p>{t('Marca dónde has estado y aquí verás crecer tu recorrido.')}</p></div></div>}
  </section>{user&&unmarked>0&&<button type="button" className="portal-unmarked" onClick={()=>navigate('pasados')}><span><Check size={20}/></span><div><strong>{unmarked} {t('por recordar')}</strong><p>{t('Tienes pasados guardados sin marcar asistencia.')}</p></div><ArrowRight size={17}/></button>}</aside></div>
  <details key={user?.id||'guest'} className="portal-account-settings" id="portal-account-settings" ref={settingsRef}><summary><Settings2 size={17}/><span>{t('Perfil y preferencias')}<small>{user?.email||t('Este navegador')}</small></span><ChevronDown size={17}/></summary><div className="portal-settings-content"><section className="portal-profile-details"><UserRound size={23}/><h2>{t('Tu cuenta')}</h2>{user?<><strong>{name}</strong><p>{user.email}</p><SignOut/></>:<><p>{t('También puedes seguir guardando sin cuenta.')}</p><Link href="/login" className="button secondary">{t('Iniciar sesión')}</Link></>}</section><AccountPreferences/>{user&&<ConnectedProviders/>}</div></details>
 </div>;
}
