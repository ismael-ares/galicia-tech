'use client';
import {CalendarDays,Info,X} from 'lucide-react';
import {validMonth} from '@/lib/calendar';
import {useApp} from './shell';
import {useI18n} from './i18n';
import {Poster,Save} from './catalog';
import {CalendarView} from './calendar-view';
import {emptyEventFilters,EventFilters,filterEvents} from './event-filters';
import {useBrowseFilters} from './use-browse-filters';

export function CalendarScreen({today}:{today:string}){
 const {t}=useI18n();
 const {catalog}=useApp();
 const {params,filters,navigate,changeFilters}=useBrowseFilters();
 const requestedMonth=params.get('mes');
 const month=validMonth(requestedMonth)?requestedMonth:today.slice(0,7);
 const filtered=filterEvents(catalog.events,filters,catalog.translations);
 const activeFilters=!!(filters.query||filters.city||filters.community);
 return <div className="calendar-page">
  <section className="page-heading calendar-page-heading"><div><div className="eyebrow"><CalendarDays size={13}/>{t('Galicia · Encuentros por fecha')}</div><h1>{t('Calendario')}<span className="heading-dot">.</span></h1><p>{t('Todos los encuentros, mes a mes.')}</p></div><span className="calendar-heading-mark" aria-hidden="true"><CalendarDays size={44} strokeWidth={1.2}/><span/><span/></span></section>
  <section aria-label={t('Calendario de encuentros')}>
   <EventFilters events={catalog.events} value={filters} onChange={changeFilters}/>
   <div className="calendar-filter-summary" aria-live="polite"><span>{t('Horarios de Galicia')}{activeFilters&&' · '+filtered.length+' '+t('eventos encontrados')}</span>{activeFilters&&<button type="button" onClick={()=>changeFilters(emptyEventFilters)}>{t('Limpiar filtros')}<X size={12}/></button>}</div>
   <CalendarView events={filtered} month={month} today={today} onMonthChange={next=>navigate({mes:next})} renderPoster={event=><Poster event={event}/>} renderSave={event=><Save event={event}/>}/>
  </section>
  <div className="sample-footnote"><Info size={14}/><span>{t('Confirma horarios, plazas y entradas en la fuente original.')}</span></div>
 </div>;
}
