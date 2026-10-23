'use client';
import {useState} from 'react';
import {Check,Info,Search} from 'lucide-react';
import {calendarDay,eventDays,moveDay} from '@/lib/calendar';
import {useApp} from './shell';
import {useI18n} from './i18n';
import {CommunityLogo} from './community-logo';
import {AgendaList} from './agenda-list';
import {EncounterRow} from './catalog';
import {FeaturedEvents} from './featured-events';
import {emptyEventFilters,EventFilters,filterEvents} from './event-filters';
import {useBrowseFilters} from './use-browse-filters';

export function Agenda({today}:{today:string}){
 const {t}=useI18n();
 const {catalog}=useApp();
 const {filters,changeFilters}=useBrowseFilters();
 const [period,setPeriod]=useState('Todos');
 const inPeriod=catalog.events.filter(event=>period==='Todos'||(period==='past'?eventDays(event).end<today:calendarDay(event.start)<=moveDay(today,Number(period))&&eventDays(event).end>=today));
 const filtered=filterEvents(inPeriod,filters,catalog.translations);
 function reset(){changeFilters(emptyEventFilters);setPeriod('Todos');}
 return <div className="agenda-page">
  <section className="page-heading">
   <div><div className="eyebrow">{t('Galicia · Comunidades tecnológicas')}</div><h1>{t('Agenda tech')}<span className="heading-dot">.</span></h1><p>{t('Charlas, talleres y encuentros de las comunidades de Galicia.')}</p></div>
   <div className="heading-aside"><span className="mini-avatars">{['GDG','WordPress','Python'].map(identity=><span title={identity} key={identity}><CommunityLogo identity={identity} size={20}/></span>)}</span><span><strong>{catalog.sources.length} {t('comunidades')}</strong><small>{t('Una sola agenda')}</small></span></div>
  </section>
  <FeaturedEvents/>
  <section className="agenda-list encounters-view" aria-labelledby="events-heading">
   <div className="section-head list-head event-browser-toolbar"><div><h2 id="events-heading">{t('Todos los encuentros')}<span className="count-badge">{filtered.length}</span></h2><p>{t('Ordenados por fecha · Horarios de Galicia')}</p></div><span className="section-context"><span/>{t('Agenda de comunidades')}</span></div>
    <EventFilters events={catalog.events} value={filters} onChange={changeFilters}/>
    <div className="filter-chips"><div role="group" aria-label={t('Periodo')}>{[['Todos','Todos'],['7','Esta semana'],['30','Próximos 30 días'],['past','Pasados']].map(([value,label])=><button type="button" key={value} aria-pressed={period===value} className={period===value?'chip active':'chip'} onClick={()=>setPeriod(value)}>{period===value&&<Check size={13}/>} {t(label)}</button>)}</div><span>{filtered.length} {t('eventos encontrados')}</span></div>
   <AgendaList events={filtered} renderCard={event=><EncounterRow event={event} key={event.id}/>}/>
   {!filtered.length&&<div className="empty-state">
    <Search size={28}/><h3>{t('No hay coincidencias')}</h3>
    <p>{t('Prueba otra búsqueda o amplía los filtros.')}</p>
    <button type="button" className="button secondary" onClick={reset}>{t('Limpiar filtros')}</button>
   </div>}
  </section>
  <div className="sample-footnote"><Info size={14}/><span>{t('Confirma horarios, plazas y entradas en la fuente original.')}</span></div>
 </div>;
}
