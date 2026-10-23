'use client';
import Link from 'next/link';
import {useRef} from 'react';
import {ArrowUpRight,Bookmark,CalendarDays,History,Search} from 'lucide-react';
import {eventDays} from '@/lib/calendar';
import {useApp} from './shell';
import {useI18n} from './i18n';
import {EncounterRow} from './catalog';
import {SavedEventsNotice} from './saved-events-notice';
import {emptyEventFilters,EventFilters,filterEvents} from './event-filters';
import {useBrowseFilters} from './use-browse-filters';
import {useAnimatedList} from './motion';

export function SavedEvents({today}:{today:string}){
 const {catalog,favorites}=useApp();
 const {t,formatDate}=useI18n();
 const {params,filters,navigate,changeFilters}=useBrowseFilters();
 const requested=params.get('periodo');
 const period=requested==='proximos'||requested==='pasados'?requested:'todos';
 const selection=catalog.events.filter(event=>favorites.includes(event.id));
 const upcoming=selection.filter(event=>eventDays(event).end>=today).sort((a,b)=>new Date(a.start).getTime()-new Date(b.start).getTime());
 const past=selection.filter(event=>eventDays(event).end<today).sort((a,b)=>new Date(b.start).getTime()-new Date(a.start).getTime());
 const groups=[{id:'proximos',label:'Próximos',events:upcoming,icon:CalendarDays},{id:'pasados',label:'Pasados',events:past,icon:History}]
  .filter(group=>period==='todos'||period===group.id)
  .map(group=>({...group,events:filterEvents(group.events,filters,catalog.translations)}));
 const count=groups.reduce((total,group)=>total+group.events.length,0);
 const activeFilters=!!(filters.query||filters.city||filters.community);
 const listRef=useRef<HTMLDivElement>(null);
 useAnimatedList(listRef,groups.flatMap(group=>group.events.map(event=>event.id)).join('|'));
 function reset(){changeFilters(emptyEventFilters);navigate({periodo:null},true);}
 return <div className="saved-page">
  <section className="page-heading saved-page-heading">
   <div><div className="eyebrow"><Bookmark size={13}/>{t('Tu colección')}</div><h1>{t('Guardados')}<span className="heading-dot">.</span><span className="saved-total">{selection.length}</span></h1><p>{t('Los encuentros que quieres tener a mano.')}</p></div>
   <Link href="/" className="button secondary saved-explore">{t('Explorar eventos')}<ArrowUpRight size={16}/></Link>
  </section>
  <SavedEventsNotice/>
  {selection.length>0&&<section className="saved-tools" aria-label={t('Organizar guardados')}>
   <div className="saved-periods" role="group" aria-label={t('Periodo de guardados')}>
    {[{id:'todos',label:'Todos',count:selection.length},{id:'proximos',label:'Próximos',count:upcoming.length},{id:'pasados',label:'Pasados',count:past.length}].map(item=><button type="button" key={item.id} className={period===item.id?'is-active':''} aria-pressed={period===item.id} onClick={()=>navigate({periodo:item.id==='todos'?null:item.id})}>{t(item.label)}<span>{item.count}</span></button>)}
   </div>
   <EventFilters events={selection} value={filters} onChange={changeFilters} searchLabel="Buscar en guardados"/>
   {activeFilters&&<div className="saved-results" role="status"><span>{count} {t('eventos encontrados')}</span><button type="button" onClick={()=>changeFilters(emptyEventFilters)}>{t('Limpiar filtros')}</button></div>}
  </section>}
  <div ref={listRef} className="saved-collection encounters-view">
   {groups.filter(group=>group.events.length>0).map(group=><section className="saved-group" key={group.id} aria-labelledby={'saved-'+group.id}>
    <div className="saved-group-heading"><group.icon size={17}/><h2 id={'saved-'+group.id}>{t(group.label)}</h2><span>{group.events.length}</span><i aria-hidden="true"/></div>
    <div className="saved-group-list">{group.events.map(event=><div className="saved-entry" key={event.id}>
     <time dateTime={event.start}>{formatDate(event.start,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</time>
     <EncounterRow event={event}/>
    </div>)}</div>
   </section>)}
  </div>
  {!count&&<div className="empty-state saved-empty">
   {!selection.length?<Bookmark size={30}/>:<Search size={28}/>}
   <h2>{t(!selection.length?'Todavía no has guardado eventos':activeFilters?'No hay coincidencias':period==='pasados'?'No tienes encuentros pasados':'No tienes encuentros por venir')}</h2>
   <p>{t(!selection.length?'Usa el marcador de un evento para guardarlo.':activeFilters?'Prueba otra búsqueda o amplía los filtros.':'El resto de tu colección sigue en Todos.')}</p>
   {!selection.length?<Link className="button primary" href="/">{t('Explorar eventos')}<ArrowUpRight size={16}/></Link>:<button type="button" className="button secondary" onClick={reset}>{t(activeFilters?'Limpiar filtros':'Ver todos mis guardados')}</button>}
  </div>}
 </div>;
}
