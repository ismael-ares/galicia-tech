'use client';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {Bookmark,CalendarDays,Info,ArrowUpRight,X} from 'lucide-react';
import {validMonth} from '@/lib/calendar';
import {useApp} from './shell';
import {useI18n} from './i18n';
import {Poster,Save} from './catalog';
import {CalendarView} from './calendar-view';
import {emptyEventFilters,EventFilters,filterEvents,type EventFiltersValue} from './event-filters';

export function CalendarScreen({today}:{today:string}){
 const {t}=useI18n();
 const {catalog,favorites}=useApp();
 const params=useSearchParams();
 const requestedMonth=params.get('mes');
 const month=validMonth(requestedMonth)?requestedMonth:today.slice(0,7);
 const savedOnly=params.get('guardados')==='1';
 const filters={query:params.get('q')||'',city:params.get('ciudad')||'',community:params.get('comunidad')||''};
 const selection=savedOnly?catalog.events.filter(event=>favorites.includes(event.id)):catalog.events;
 const filtered=filterEvents(selection,filters,catalog.translations);
 const activeFilters=!!(filters.query||filters.city||filters.community);
 function navigate(updates:Record<string,string|null>,replace=false){
  const url=new URL(window.location.href);
  for(const [key,value] of Object.entries(updates)){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}
  // Month/scope changes are navigable with Back; typing only replaces the current entry.
  window.history[replace?'replaceState':'pushState'](null,'',url.pathname+url.search);
 }
 function changeFilters(value:EventFiltersValue){navigate({q:value.query,ciudad:value.city,comunidad:value.community},true);}
 return <div className="calendar-page">
  <section className="page-heading calendar-page-heading"><div><div className="eyebrow"><CalendarDays size={13}/>{t('Galicia · Encuentros por fecha')}</div><h1>{t('Calendario')}<span className="heading-dot">.</span></h1><p>{t('Todos los encuentros, mes a mes.')}</p></div><span className="calendar-heading-mark" aria-hidden="true"><CalendarDays size={44} strokeWidth={1.2}/><span/><span/></span></section>
  <section aria-label={t('Calendario de encuentros')}>
   <div className="calendar-browse-bar"><div className="calendar-scope" role="group" aria-label={t('Eventos del calendario')}><button type="button" aria-pressed={!savedOnly} onClick={()=>navigate({guardados:null})}>{t('Todos los eventos')}</button><button type="button" aria-pressed={savedOnly} onClick={()=>navigate({guardados:'1'})}><Bookmark size={14}/>{t('Solo guardados')}<span>{favorites.filter(id=>catalog.events.some(event=>event.id===id)).length}</span></button></div><Link href="/guardados" className="calendar-selection-link">{t('Mi selección')}<ArrowUpRight size={14}/></Link></div>
   <EventFilters events={catalog.events} value={filters} onChange={changeFilters}/>
   <div className="calendar-filter-summary" aria-live="polite"><span>{t(savedOnly?'Mostrando tu selección':'Mostrando todos los encuentros')}{activeFilters&&' · '+filtered.length+' '+t('eventos encontrados')}</span>{activeFilters&&<button type="button" onClick={()=>changeFilters(emptyEventFilters)}>{t('Limpiar filtros')}<X size={12}/></button>}</div>
   {savedOnly&&!selection.length&&<div className="calendar-saved-empty"><Bookmark size={19}/><div><strong>{t('Todavía no has guardado eventos')}</strong><p>{t('Guarda los que te interesen y aparecerán aquí.')}</p></div><Link href="/" className="text-action">{t('Explorar eventos')}<ArrowUpRight size={15}/></Link></div>}
   <CalendarView events={filtered} month={month} today={today} onMonthChange={next=>navigate({mes:next})} renderPoster={event=><Poster event={event}/>} renderSave={event=><Save event={event}/>}/>
  </section>
  <div className="sample-footnote"><Info size={14}/><span>{t('Confirma horarios, plazas y entradas en la fuente original.')}</span></div>
 </div>;
}
