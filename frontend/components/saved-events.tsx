'use client';
import Link from 'next/link';
import {useRef} from 'react';
import {ArrowUpRight,Bookmark,CalendarDays,History,Search} from 'lucide-react';
import {eventDays} from '@/lib/calendar';
import {useApp} from './shell';
import {useI18n} from './i18n';
import {EncounterRow,Poster} from './catalog';
import {SavedEventsNotice} from './saved-events-notice';
import {EventFilters,filterEvents} from './event-filters';
import {useBrowseFilters} from './use-browse-filters';
import {useAnimatedList} from './motion';
import {AttendanceButton} from './attendance';

export function SavedEvents({today}:{today:string}){
 const {catalog,favorites}=useApp();
 const {t,formatDate}=useI18n();
 const {params,filters,navigate,changeFilters}=useBrowseFilters();
 const requested=params.get('periodo');
 const period=requested==='proximos'||requested==='pasados'?requested:'todos';
 const selection=catalog.events.filter(event=>favorites.includes(event.id));
 const upcoming=selection.filter(event=>eventDays(event).end>=today).sort((a,b)=>new Date(a.start).getTime()-new Date(b.start).getTime());
 const past=selection.filter(event=>eventDays(event).end<today).sort((a,b)=>new Date(b.start).getTime()-new Date(a.start).getTime());
 const preview=[...upcoming,...past].slice(0,3);
 const communities=new Set(selection.map(event=>event.community)).size;
 const groups=[{id:'proximos',label:'Próximos',events:upcoming,icon:CalendarDays},{id:'pasados',label:'Pasados',events:past,icon:History}]
  .filter(group=>period==='todos'||period===group.id)
  .map(group=>({...group,events:filterEvents(group.events,filters,catalog.translations)}));
 const count=groups.reduce((total,group)=>total+group.events.length,0);
 const activeFilters=!!(filters.query||filters.city||filters.community);
 const listRef=useRef<HTMLDivElement>(null);
 useAnimatedList(listRef,groups.flatMap(group=>group.events.map(event=>event.id)).join('|'),'.saved-entry[data-motion-item]');
 function reset(){navigate({q:null,ciudad:null,comunidad:null,periodo:null},true);}
 return <div className="saved-page">
  <section className="page-heading saved-page-heading">
   <div className="saved-heading-copy"><div className="eyebrow"><Bookmark size={13}/>{t('Tu colección')}</div><h1>{t('Guardados')}<span className="heading-dot">.</span></h1><p className="saved-description"><strong>{selection.length}</strong> {t(selection.length===1?'encuentro':'encuentros')}<span aria-hidden="true"/> <strong>{communities}</strong> {t(communities===1?'comunidad':'comunidades')}</p><SavedEventsNotice/></div>
   {selection.length>0&&<div className="saved-heading-visual"><div className="saved-cover-stack" aria-hidden="true">{preview.map(event=><div className="saved-stack-cover" key={event.id}><Poster event={event}/></div>)}</div><Link href="/" className="text-action saved-explore">{t('Explorar eventos')}<ArrowUpRight size={15}/></Link></div>}
  </section>
  {selection.length>0&&<section className="saved-tools" aria-label={t('Organizar guardados')}>
   <EventFilters events={selection} value={filters} onChange={changeFilters} searchLabel="Buscar en guardados" onClear={reset}
    extraFields={[{id:'period',label:'Periodo de guardados',value:period,defaultValue:'todos',options:[{value:'todos',label:'Todos'},{value:'proximos',label:'Próximos'},{value:'pasados',label:'Pasados'}]}]}
    onApply={(value,extra)=>navigate({ciudad:value.city||null,comunidad:value.community||null,periodo:extra.period==='todos'?null:extra.period})}/>
   {activeFilters&&<span className="collection-result-status" role="status">{count} {t('eventos encontrados')}</span>}
  </section>}
  <div ref={listRef} className="saved-collection encounters-view">
   {groups.filter(group=>group.events.length>0).map(group=><section className="saved-group" key={group.id} aria-labelledby={'saved-'+group.id}>
    <div className="saved-group-heading"><group.icon size={17}/><h2 id={'saved-'+group.id}>{t(group.label)}</h2><span>{group.events.length}</span><i aria-hidden="true"/></div>
    <div className="saved-group-list">{group.events.map(event=>{const range=eventDays(event),next=group.id==='proximos'&&event.id===upcoming[0]?.id;
     const status=group.id==='pasados'?'':range.start<today?'En curso':range.start===today?'Hoy':next?'El próximo':'';
     return <div className="saved-entry" key={event.id} data-next={next} data-period={group.id} data-motion-item={'saved-'+event.id}>
     <div className="saved-entry-header"><time dateTime={event.start}><strong>{formatDate(event.start,{day:'2-digit'})}</strong><span><b>{formatDate(event.start,{month:'short',year:'numeric'}).replace('.','')}</b><small>{formatDate(event.start,{weekday:'long'})}</small></span></time>{status&&<span className="saved-entry-status"><i/>{t(status)}</span>}{group.id==='pasados'&&<AttendanceButton event={event}/>}</div>
     <EncounterRow event={event}/>
    </div>;})}</div>
   </section>)}
  </div>
  {!count&&<div className="empty-state saved-empty">
   <div className="saved-empty-mark" aria-hidden="true"><span/><span/>{!selection.length?<Bookmark size={30}/>:<Search size={28}/>}</div>
   <h2>{t(!selection.length?'Todavía no has guardado eventos':activeFilters?'No hay coincidencias':period==='pasados'?'No tienes encuentros pasados':'No tienes encuentros por venir')}</h2>
   <p>{t(!selection.length?'Usa el marcador de un evento para guardarlo.':activeFilters?'Prueba otra búsqueda o amplía los filtros.':'Puedes consultar toda tu colección al quitar el filtro de periodo.')}</p>
   {!selection.length?<Link className="button primary" href="/">{t('Explorar eventos')}<ArrowUpRight size={16}/></Link>:<button type="button" className="button secondary" onClick={reset}>{t(activeFilters?'Limpiar filtros':'Ver todos mis guardados')}</button>}
  </div>}
 </div>;
}
