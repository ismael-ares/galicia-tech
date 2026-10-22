'use client';
import Link from 'next/link';
import {useState} from 'react';
import {ArrowUpRight,Bookmark,CalendarDays,Check,Info,Search} from 'lucide-react';
import {calendarDay,eventDays,moveDay} from '@/lib/calendar';
import {useApp} from './shell';
import {useI18n} from './i18n';
import {CommunityLogo} from './community-logo';
import {AgendaList} from './agenda-list';
import {EncounterRow} from './catalog';
import {FeaturedEvents} from './featured-events';
import {SavedEventsNotice} from './saved-events-notice';
import {emptyEventFilters,EventFilters,filterEvents} from './event-filters';

export function Agenda({savedOnly=false,today}:{savedOnly?:boolean;today:string}){
 const {t}=useI18n();
 const {catalog,favorites}=useApp();
 const [filters,setFilters]=useState(emptyEventFilters);
 const [period,setPeriod]=useState('Todos');
 const [collection,setCollection]=useState('all');
 const selection=savedOnly?catalog.events.filter(event=>favorites.includes(event.id)):catalog.events;
 const upcoming=selection.filter(event=>eventDays(event).end>=today);
 const pastCount=selection.length-upcoming.length;
 const inPeriod=savedOnly?selection.filter(event=>collection==='all'||(collection==='upcoming'?eventDays(event).end>=today:eventDays(event).end<today)):selection.filter(event=>period==='Todos'||(calendarDay(event.start)<=moveDay(today,Number(period))&&eventDays(event).end>=today));
 const filtered=filterEvents(inPeriod,filters,catalog.translations);
 const firstUpcoming=upcoming[0]?calendarDay(upcoming[0].start):null;
 const calendarMonth=firstUpcoming?(firstUpcoming<today?today:firstUpcoming).slice(0,7):selection.at(-1)?calendarDay(selection.at(-1)!.start).slice(0,7):today.slice(0,7);
 const calendarHref='/calendario?guardados=1&mes='+calendarMonth;
 const filteredLabel=savedOnly?t('Tu selección'):t('Todos los encuentros');
 function reset(){setFilters(emptyEventFilters);setPeriod('Todos');setCollection('all');}
 return <div className={savedOnly?'collection-page':'agenda-page'}>
  <section className={'page-heading '+(savedOnly?'collection-heading':'')}>
   <div><div className="eyebrow">{savedOnly?<><Bookmark size={13}/>{t('Tu selección personal')}</>:t('Galicia · Comunidades tecnológicas')}</div><h1>{t(savedOnly?'Tus guardados':'Agenda tech')}<span className="heading-dot">.</span></h1><p>{t(savedOnly?'Los encuentros que quieres tener a mano.':'Charlas, talleres y encuentros de las comunidades de Galicia.')}</p></div>
   {savedOnly?selection.length>0&&<Link className="collection-calendar-link" href={calendarHref}><span className="collection-calendar-icon"><CalendarDays size={23}/></span><span><strong>{t('Ver en calendario')}</strong><small>{t('Solo tu selección, mes a mes')}</small></span><ArrowUpRight size={19}/></Link>:<div className="heading-aside"><span className="mini-avatars">{['GDG','WordPress','Python'].map(identity=><span title={identity} key={identity}><CommunityLogo identity={identity} size={20}/></span>)}</span><span><strong>{catalog.sources.length} {t('comunidades')}</strong><small>{t('Una sola agenda')}</small></span></div>}
  </section>
  {savedOnly?<SavedEventsNotice/>:<FeaturedEvents/>}
  <section className="agenda-list encounters-view" aria-labelledby="events-heading">
   <div className="section-head list-head event-browser-toolbar"><div><h2 id="events-heading">{filteredLabel}<span className="count-badge">{filtered.length}</span></h2><p>{t('Ordenados por fecha · Horarios de Galicia')}</p></div>{!savedOnly&&<span className="section-context"><span/>{t('Agenda de comunidades')}</span>}</div>
   {(!savedOnly||selection.length>0)&&<>
    {savedOnly&&<div className="collection-toolbar"><div className="collection-segments" role="group" aria-label={t('Filtrar guardados')}>{[['all','Todos',selection.length],['upcoming','Por venir',upcoming.length],['past','Pasados',pastCount]].map(([value,label,total])=><button type="button" key={value} aria-pressed={collection===value} onClick={()=>setCollection(String(value))}>{t(String(label))}<span>{total}</span></button>)}</div><span className="collection-total"><Bookmark size={13}/>{selection.length} {t('en tu selección')}</span></div>}
    <EventFilters events={selection} value={filters} onChange={setFilters}/>
    {!savedOnly&&<div className="filter-chips"><div role="group" aria-label={t('Periodo')}>{[['Todos','Todos'],['7','Esta semana'],['30','Próximos 30 días']].map(([value,label])=><button type="button" key={value} aria-pressed={period===value} className={period===value?'chip active':'chip'} onClick={()=>setPeriod(value)}>{period===value&&<Check size={13}/>} {t(label)}</button>)}</div><span>{filtered.length} {t('eventos encontrados')}</span></div>}
   </>}
   <AgendaList events={filtered} renderCard={event=><EncounterRow event={event} key={event.id}/>}/>
   {!filtered.length&&<div className={'empty-state '+(savedOnly&&!selection.length?'collection-empty':'')}>
    {savedOnly&&!selection.length?<Bookmark size={29}/>:<Search size={28}/>}<h3>{savedOnly&&!selection.length?t('Todavía no has guardado eventos'):savedOnly&&collection==='past'&&pastCount===0?t('No tienes encuentros pasados'):savedOnly&&collection==='upcoming'&&upcoming.length===0?t('No tienes encuentros por venir'):t('No hay coincidencias')}</h3>
    <p>{savedOnly&&!selection.length?t('Usa el marcador de un evento para guardarlo.'):t('Prueba otra búsqueda o amplía los filtros.')}</p>
    {savedOnly&&!selection.length?<Link className="button primary" href="/">{t('Explorar eventos')}<ArrowUpRight size={16}/></Link>:<button type="button" className="button secondary" onClick={reset}>{t('Limpiar filtros')}</button>}
   </div>}
  </section>
  <div className="sample-footnote"><Info size={14}/><span>{t('Confirma horarios, plazas y entradas en la fuente original.')}</span></div>
 </div>;
}
