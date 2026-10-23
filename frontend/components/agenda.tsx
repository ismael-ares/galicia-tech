'use client';
import {ArrowDownWideNarrow,CalendarDays,Clock3,Info,Search,X} from 'lucide-react';
import {calendarDay,eventDays,moveDay} from '@/lib/calendar';
import {useApp} from './shell';
import {useI18n} from './i18n';
import {CommunityLogo} from './community-logo';
import {AgendaList} from './agenda-list';
import {EncounterRow} from './catalog';
import {FeaturedEvents} from './featured-events';
import {emptyEventFilters,EventFilters,filterEvents} from './event-filters';
import {useBrowseFilters} from './use-browse-filters';

const periods=[['todos','Todos'],['proximos','Próximos'],['7','Próximos 7 días'],['30','Próximos 30 días'],['pasados','Pasados']] as const;
export function Agenda({today}:{today:string}){
 const {t}=useI18n();
 const {catalog}=useApp();
 const {params,filters,navigate,changeFilters}=useBrowseFilters();
 const requested=params.get('periodo'),period=periods.some(([value])=>value===requested)?requested!:'todos';
 const contentFilters=!!(filters.query||filters.city||filters.community);
 const active=contentFilters||period!=='todos';
 const inPeriod=catalog.events.filter(event=>{
  const range=eventDays(event);
  if(period==='todos')return true;
  if(period==='pasados')return range.end<today;
  if(range.end<today)return false;
  return period==='proximos'||calendarDay(event.start)<=moveDay(today,Number(period)-1);
 });
 const filtered=filterEvents(inPeriod,filters,catalog.translations);
 function reset(){changeFilters(emptyEventFilters);navigate({periodo:null},true);}
 return <div className="agenda-page">
  <section className="page-heading agenda-page-heading">
   <div><div className="eyebrow"><CalendarDays size={13}/>{t('Galicia · Comunidades tecnológicas')}</div><h1>{t('Agenda')}<span className="heading-dot">.</span></h1><p>{t('Charlas, talleres y encuentros de las comunidades de Galicia.')}</p></div>
   <div className="agenda-sources-context"><span className="mini-avatars">{['GDG','WordPress','Python'].map(identity=><span title={identity} key={identity}><CommunityLogo identity={identity} size={20}/></span>)}</span><span><strong>{catalog.sources.filter(source=>source.enabled).length} {t('fuentes')}</strong><small>{t('Comunidades de Galicia')}</small></span></div>
  </section>
  <section className="agenda-controls" aria-label={t('Explorar encuentros')}>
   <EventFilters events={catalog.events} value={filters} onChange={changeFilters} compact showReset={false}/>
   <div className="agenda-refine"><div className="agenda-periods" role="group" aria-label={t('Periodo')}>{periods.map(([value,label])=><button type="button" key={value} aria-pressed={period===value} className={period===value?'is-active':''} onClick={()=>navigate({periodo:value==='todos'?null:value})}>{t(label)}</button>)}</div><span className="agenda-timezone"><Clock3 size={13}/>{t('Horarios de Galicia')}</span></div>
   {contentFilters&&<div className="agenda-applied" role="status"><div>{filters.city&&<button type="button" onClick={()=>changeFilters({...filters,city:''})} aria-label={t('Quitar filtro: ')+filters.city}>{filters.city}<X size={12}/></button>}{filters.community&&<button type="button" onClick={()=>changeFilters({...filters,community:''})} aria-label={t('Quitar filtro: ')+filters.community}>{filters.community}<X size={12}/></button>}</div><button className="agenda-reset" type="button" onClick={reset}>{t('Limpiar filtros')}<X size={12}/></button></div>}
  </section>
  {!active&&<FeaturedEvents today={today}/>}
  <section className="agenda-list encounters-view" aria-labelledby="events-heading">
   <div className="section-head list-head event-browser-toolbar"><div><h2 id="events-heading">{t(period==='pasados'?'Encuentros pasados':period==='todos'?'Todos los encuentros':'Próximos encuentros')}<span className="count-badge">{filtered.length}</span></h2></div><span className="agenda-result-caption"><ArrowDownWideNarrow size={14}/>{t('Ordenados por fecha')}</span></div>
   <AgendaList events={filtered} today={today} renderCard={event=><EncounterRow event={event} key={event.id}/>}/>
   {!filtered.length&&<div className="empty-state agenda-empty">
    <span className="agenda-empty-icon">{catalog.events.length?<Search size={28}/>:<CalendarDays size={28}/>}</span><h3>{t(catalog.events.length?'No hay coincidencias':'Todavía no hay encuentros publicados')}</h3>
    <p>{t(catalog.events.length?'Prueba otra búsqueda o amplía los filtros.':'Los nuevos encuentros aparecerán aquí.')}</p>
    {active&&<button type="button" className="button secondary" onClick={reset}>{t('Limpiar filtros')}</button>}
   </div>}
  </section>
  <div className="sample-footnote"><Info size={14}/><span>{t('Confirma horarios, plazas y entradas en la fuente original.')}</span></div>
 </div>;
}
