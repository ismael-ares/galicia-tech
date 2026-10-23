'use client';
import {ArrowDownWideNarrow,ArrowRight,CalendarDays,History,Info,Search} from 'lucide-react';
import {calendarDay,eventDays,moveDay,validMonth} from '@/lib/calendar';
import {useApp} from './shell';
import {useI18n} from './i18n';
import {CommunityLogo} from './community-logo';
import {AgendaList} from './agenda-list';
import {EncounterRow} from './catalog';
import {FeaturedEvents} from './featured-events';
import {EventFilters,filterEvents} from './event-filters';
import {useBrowseFilters} from './use-browse-filters';

export function Agenda({today}:{today:string}){
 const {t,formatDate}=useI18n();
 const {catalog}=useApp();
 const {params,filters,navigate,changeFilters}=useBrowseFilters();
 const requested=params.get('periodo'),archived=requested==='pasados';
 const period=!archived&&(requested==='7'||requested==='30')?requested:'';
 const month=archived&&validMonth(params.get('archivo'))?params.get('archivo')!:'';
 const contentFilters=!!(filters.query||filters.city||filters.community);
 const active=contentFilters||!!period||!!month;
 const matching=filterEvents(catalog.events,filters,catalog.translations);
 const upcoming=matching.filter(event=>eventDays(event).end>=today);
 const past=matching.filter(event=>eventDays(event).end<today);
 const filtered=archived?past.filter(event=>!month||calendarDay(event.start).startsWith(month)):upcoming.filter(event=>!period||calendarDay(event.start)<=moveDay(today,Number(period)-1));
 const archiveMonths=[...new Set([...past.map(event=>calendarDay(event.start).slice(0,7)),...(month?[month]:[])])].sort().reverse();
 function switchSection(archive:boolean){if(archive!==archived)navigate({periodo:archive?'pasados':null,archivo:null});}
 function reset(){navigate({q:null,ciudad:null,comunidad:null,periodo:archived?'pasados':null,archivo:null},true);}
 const emptyTitle=!catalog.events.length?'Todavía no hay encuentros publicados':active?'No hay coincidencias':archived?'El archivo está vacío':'No hay próximos encuentros';
 const emptyDescription=!catalog.events.length?'Los nuevos encuentros aparecerán aquí.':active?'Prueba otra búsqueda o amplía los filtros.':archived?'Los encuentros aparecerán aquí cuando finalicen.':'Las próximas convocatorias aparecerán aquí.';
 return <div className="agenda-page" data-section={archived?'archivo':'proximos'}>
  <section className="page-heading agenda-page-heading">
   <div><div className="eyebrow"><CalendarDays size={13}/>{t('Galicia · Comunidades tecnológicas')}</div><h1>{t('Agenda')}<span className="heading-dot">.</span></h1><p>{t('Charlas, talleres y encuentros de las comunidades de Galicia.')}</p></div>
   <div className="agenda-sources-context"><span className="mini-avatars">{['GDG','WordPress','Python'].map(identity=><span title={identity} key={identity}><CommunityLogo identity={identity} size={20}/></span>)}</span><span><strong>{catalog.sources.filter(source=>source.enabled).length} {t('fuentes')}</strong><small>{t('Comunidades de Galicia')}</small></span></div>
  </section>
  <section className="agenda-controls" aria-label={t('Explorar encuentros')}>
   <EventFilters events={catalog.events} value={filters} onChange={changeFilters} contextKey={archived?'archive':'upcoming'} onClear={reset}
    extraFields={[archived?{id:'archiveMonth',label:'Mes del archivo',value:month,options:[{value:'',label:'Cualquier mes'},...archiveMonths.map(value=>({value,label:formatDate(value+'-01T12:00:00Z',{month:'long',year:'numeric'})}))]}:{id:'range',label:'Rango de fechas',value:period,options:[{value:'',label:'Desde hoy'},{value:'7',label:'Próximos 7 días'},{value:'30',label:'Próximos 30 días'}]}]}
    onApply={(value,extra)=>navigate({ciudad:value.city||null,comunidad:value.community||null,periodo:archived?'pasados':extra.range||null,archivo:archived?extra.archiveMonth||null:null})}>
    <div className="agenda-scopes" role="group" aria-label={t('Estado de los encuentros')}>
     {[{archive:false,label:'Próximos',count:upcoming.length,icon:CalendarDays},{archive:true,label:'Archivo',count:past.length,icon:History}].map(item=><button type="button" key={item.label} aria-pressed={archived===item.archive} aria-controls="agenda-results" onClick={()=>switchSection(item.archive)}><item.icon size={17} aria-hidden="true"/><span>{t(item.label)}</span><small>{item.count}</small></button>)}
    </div>
   </EventFilters>
  </section>
  {!archived&&!active&&<FeaturedEvents today={today}/>}
  <section className="agenda-list encounters-view" id="agenda-results" aria-labelledby="events-heading">
   <div className="section-head list-head event-browser-toolbar"><div><h2 id="events-heading">{t(archived?'Archivo de encuentros':'Próximos encuentros')}<span className="count-badge" role="status" aria-label={t('eventos encontrados')}>{filtered.length}</span></h2><p>{t(archived?'Encuentros finalizados':'En curso y por venir')}</p></div><span className="agenda-result-caption"><ArrowDownWideNarrow size={14}/>{t(archived?'Más recientes primero':'Más cercanos primero')}</span></div>
   <AgendaList events={filtered} today={today} period={archived?'pasados':'proximos'} renderCard={event=><EncounterRow event={event} key={event.id}/>}/>
   {!filtered.length&&<div className="empty-state agenda-empty">
    <span className="agenda-empty-icon">{active?<Search size={28}/>:archived?<History size={28}/>:<CalendarDays size={28}/>}</span><h3>{t(emptyTitle)}</h3><p>{t(emptyDescription)}</p>
    {active&&<button type="button" className="button secondary" onClick={reset}>{t('Limpiar filtros')}</button>}
    {!archived&&past.length>0&&<button type="button" className="text-action agenda-empty-archive" onClick={()=>switchSection(true)}>{t('Ver archivo')}<ArrowRight size={15}/></button>}
   </div>}
  </section>
  <div className="sample-footnote"><Info size={14}/><span>{t('Confirma horarios, plazas y entradas en la fuente original.')}</span></div>
 </div>;
}
