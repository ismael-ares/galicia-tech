'use client';
import Link from 'next/link';
import {Bookmark,CalendarDays,Info,ArrowRight,ArrowUpRight,X} from 'lucide-react';
import {eventDays,eventsInMonth,validMonth} from '@/lib/calendar';
import {useApp} from './shell';
import {useI18n} from './i18n';
import {Poster,Save} from './catalog';
import {CalendarView} from './calendar-view';
import {SavedEventsNotice} from './saved-events-notice';
import {emptyEventFilters,EventFilters,filterEvents} from './event-filters';
import {useBrowseFilters} from './use-browse-filters';

export function CalendarScreen({today}:{today:string}){
 const {t}=useI18n();
 const {catalog,favorites}=useApp();
 const {params,savedOnly,filters,navigate,changeFilters}=useBrowseFilters();
 const requestedMonth=params.get('mes');
 const month=validMonth(requestedMonth)?requestedMonth:today.slice(0,7);
 const selection=savedOnly?catalog.events.filter(event=>favorites.includes(event.id)):catalog.events;
 const filtered=filterEvents(selection,filters,catalog.translations);
 const activeFilters=!!(filters.query||filters.city||filters.community);
 const missingSavedMonth=savedOnly&&filtered.length>0&&!eventsInMonth(filtered,month).length;
 const months=[...new Set(filtered.flatMap(event=>{const range=eventDays(event);return [range.start.slice(0,7),range.end.slice(0,7)];}))].sort();
 const nextSavedMonth=months.find(value=>value>month)||months.at(-1);
 return <div className={'calendar-page '+(savedOnly?'saved-scope':'')}>
  <section className="page-heading calendar-page-heading"><div><div className="eyebrow"><CalendarDays size={13}/>{t(savedOnly?'Calendario · Solo guardados':'Galicia · Encuentros por fecha')}</div><h1>{t(savedOnly?'Tus guardados':'Calendario')}<span className="heading-dot">.</span></h1><p>{t(savedOnly?'Tu selección, mes a mes.':'Todos los encuentros, mes a mes.')}</p></div><span className="calendar-heading-mark" aria-hidden="true"><CalendarDays size={44} strokeWidth={1.2}/><span/><span/></span></section>
  {savedOnly&&<SavedEventsNotice/>}
  <section aria-label={t('Calendario de encuentros')}>
   <EventFilters events={catalog.events} value={filters} onChange={changeFilters}/>
   <div className="calendar-filter-summary" aria-live="polite"><span>{t('Horarios de Galicia')}{activeFilters&&' · '+filtered.length+' '+t('eventos encontrados')}</span>{activeFilters&&<button type="button" onClick={()=>changeFilters(emptyEventFilters)}>{t('Limpiar filtros')}<X size={12}/></button>}</div>
   {savedOnly&&!selection.length&&<div className="calendar-saved-empty"><Bookmark size={19}/><div><strong>{t('Todavía no has guardado eventos')}</strong><p>{t('Guarda los que te interesen y aparecerán aquí.')}</p></div><Link href="/" className="text-action">{t('Explorar eventos')}<ArrowUpRight size={15}/></Link></div>}
   {missingSavedMonth&&nextSavedMonth&&<div className="calendar-saved-month-empty"><Bookmark size={18}/><p>{t('No tienes guardados en este mes.')}</p><button type="button" onClick={()=>navigate({mes:nextSavedMonth})}>{t('Ir a un mes con guardados')}<ArrowRight size={15}/></button></div>}
   <CalendarView events={filtered} month={month} today={today} onMonthChange={next=>navigate({mes:next})} renderPoster={event=><Poster event={event}/>} renderSave={event=><Save event={event}/>}/>
  </section>
  <div className="sample-footnote"><Info size={14}/><span>{t('Confirma horarios, plazas y entradas en la fuente original.')}</span></div>
 </div>;
}
