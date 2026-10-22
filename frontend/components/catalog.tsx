'use client';
import { useI18n } from './i18n';
import { CommunityLogo } from './community-logo';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AgendaList } from './agenda-list';
import { CalendarView } from './calendar-view';
import { EventViewSwitch, type EventView } from './event-view-switch';
import { validMonth, calendarDay, moveDay } from '@/lib/calendar';
import { eventSearchText } from '@/lib/event-content';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Bookmark, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, ExternalLink, Info, MapPin, Search, SlidersHorizontal, Ticket, Users, X } from 'lucide-react';
import { type Event, topic } from '@/lib/data';
import { useMock } from './shell';
import { Disclosure, pressFeedback } from './motion';
import { CoverArt, coverIdentity } from './cover-art';
export function useEvents(){return useMock().catalog.events;}
export function Poster({event,featured=false,automatic=false,templateId}:{event:Event;featured?:boolean;automatic?:boolean;templateId?:string}){const {t,eventText,formatRange}=useI18n();
 const {covers}=useMock().catalog;const cover=covers.find(c=>c.id===event.id)?.selected;const [broken,setBroken]=useState(false); const image=!automatic&&cover&&!broken;
 const imageRef=useRef<HTMLImageElement>(null);
 useEffect(()=>{const element=imageRef.current;if(element?.complete&&element.naturalWidth===0)setBroken(true);},[cover?.url]);
 const startDate=new Date(event.start),endDate=event.end?new Date(event.end):startDate;
 const dateLabel=formatRange(event.start,endDate>=startDate?event.end??event.start:event.start);
 const identity=coverIdentity(event.id,templateId);
 return <div className={'poster '+(image?'official-poster':'auto-poster')+(featured?' featured-poster':'')} data-cover-pattern={identity.pattern} data-cover-tone={identity.tone} data-cover-layout={identity.layout} data-title-size={eventText(event.title).length>95?'long':eventText(event.title).length>55?'medium':'short'} style={featured&&image?{width:`clamp(240px, ${Math.min(46,Math.max(29,(cover.width/cover.height)*32))}%, 480px)`}:undefined}>
  {image?<img ref={imageRef} src={cover.url} alt={t("Portada de ")+eventText(event.title)} onError={()=>setBroken(true)} loading={featured?'eager':'lazy'}/>:<><div className="poster-top"><img src="/icon.svg" width="27" height="27" alt=""/><span>{t("ENCUENTROS")}<br/>{t("TECNOLOGÍA")}</span></div><div className="poster-art" aria-hidden="true"><CoverArt pattern={identity.pattern}/></div><div className="poster-bottom"><strong title={eventText(event.title)}>{eventText(event.title)}</strong><span>{dateLabel}</span></div><span className="automatic-label">{t("Portada automática")}</span></>}
 </div>;
}
function Save({event}:{event:Event}){const {t,eventText}=useI18n();const {favorites,toggleFavorite,notify}=useMock();const saved=favorites.includes(event.id);return <button className={'save-button '+(saved?'is-saved':'')} aria-label={(saved?t("Quitar de guardados: "):t("Guardar: "))+eventText(event.title)} aria-pressed={saved} onClick={e=>{pressFeedback(e.currentTarget);toggleFavorite(event.id).then(()=>notify(saved?t('Evento retirado de guardados.'):t('Encuentro guardado.'))).catch(e=>notify(e.message));}}><Bookmark size={19} fill={saved?'currentColor':'none'}/></button>;}
export function EncounterRow({event}:{event:Event}){const {t,eventText,formatDate,formatRange}=useI18n();
 const time=(value:string)=>formatDate(value,{hour:'2-digit',minute:'2-digit'});
 const localDay=(value:string)=>new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(value));
 const multiDay=!!event.end&&localDay(event.start)!==localDay(event.end);
 const uncertainEnd=/finalizaci/i.test(event.statusNote);
 const uncertainSchedule=/horari|hora|finalizaci/i.test(event.statusNote);
 const dateRange=multiDay?formatRange(event.start,event.end!,{day:'numeric',month:'short'}):'';
 const schedule=multiDay?(uncertainSchedule?t('Por confirmar'):t('Varias jornadas')):time(event.start)+(event.end&&!uncertainEnd?' – '+time(event.end):'');
 const scheduleNote=multiDay?dateRange:uncertainEnd?t('Fin por confirmar'):!event.end?t('Fin no indicado'):'';
 const unknownPrice=/no indicado/i.test(event.price);
 const logo=/GDG/i.test(event.community)?'gdg.png':/WordPress/i.test(event.community)?'wordpress.png':/JUG/i.test(event.community)?'corunajug.png':/Python/i.test(event.community)?'python.png':'gpul.svg';
 const parts=event.place.split(' · ');
 const venue=(parts[0].length<=8&&parts[1]?parts.slice(0,2).join(' · '):parts[0]).replace(/, (?:Rúa|Rua|Av[.]?|Avenida|Edificio)\b.*$/i, '').replace(/, Ourense$/, '');
 const generalNote=event.statusNote&&!uncertainSchedule?event.statusNote:'';
 return <article className="event-row encounter-card meet-card" data-motion-item={event.id}>
  <div className="meet-cover"><Poster event={event}/></div>
  <div className="meet-content">
   <div className="meet-organizer"><span className="meet-organizer-mark"><img src={'/assets/source-logos/'+logo} alt="" width="18" height="18"/></span><span>{event.community}</span></div>
   <Link href={'/evento/'+event.id} className="event-title-link meet-title"><h3>{eventText(event.title)}</h3></Link>
   <p className="meet-description">{eventText(event.description[0])}</p>
   <dl className="meet-facts">
    <div className="meet-fact"><dt><MapPin size={14}/><span>{t("Lugar")}</span></dt><dd>{event.city}<span className="meet-secondary" title={event.place}>{venue}</span></dd></div>
    <div className="meet-fact"><dt><Clock3 size={14}/><span>{t("Horario")}</span></dt><dd>{schedule}{scheduleNote&&<span className={'meet-secondary '+(uncertainSchedule?'meet-pending':'')}>{scheduleNote}</span>}</dd></div>
    <div className="meet-fact"><dt><Ticket size={14}/><span>{t("Entrada")}</span></dt><dd className={unknownPrice?'meet-unconfirmed':''}>{unknownPrice?t("Sin confirmar"):t(event.price)}</dd></div>
   </dl>
   <div className="meet-footer">
    <div className="meet-tags" aria-label={t("Temática y avisos")}><span>{t(topic(event))}</span>{[...new Set([event.cardNote,generalNote].filter((note):note is string=>!!note))].map(note=><span className="meet-tag-note" key={note}><Info size={11}/>{eventText(note)}</span>)}</div>
    <div className="meet-links">{event.sources[0]&&<a href={event.sources[0].url} target="_blank" rel="noreferrer" aria-label={t("Abrir fuente original de ")+eventText(event.title)}><ExternalLink size={12}/><span>{t("Fuente original")}</span></a>}{event.sources.length>1&&<Link className="meet-extra-source" href={'/evento/'+event.id+'#fuentes'} aria-label={t("Ver las ")+event.sources.length+t(" fuentes de ")+eventText(event.title)}>+{event.sources.length-1}</Link>}<span className="meet-open" aria-hidden="true"><ArrowUpRight size={17}/></span></div>
   </div>
  </div>
  <div className="meet-save"><Save event={event}/></div>
 </article>;
}

export function Agenda({savedOnly=false,today}:{savedOnly?:boolean;today:string}){const {t,eventText,formatRange}=useI18n();
 const {ranking,covers,sources,translations:translationsMap}=useMock().catalog;
 const params=useSearchParams();
 const view:EventView=params.get('vista')==='calendario'?'calendar':'agenda';
 const requestedMonth=params.get('mes');
 const displayedMonth=validMonth(requestedMonth)?requestedMonth:today.slice(0,7);
 const previousView=useRef(view);
 function navigateView(next:EventView,month=displayedMonth){
  const url=new URL(window.location.href);
  if(next==='calendar'){url.searchParams.set('vista','calendario');url.searchParams.set('mes',month);}else url.searchParams.delete('vista');
  url.hash='events-heading';
  if(url.href!==window.location.href)window.history.pushState(null,'',url.pathname+url.search+url.hash);
 }
 useEffect(()=>{if(previousView.current!==view){previousView.current=view;document.getElementById('events-heading')?.scrollIntoView({block:'start',behavior:'instant'});}},[view]);
 const all=useEvents(); const {favorites}=useMock(); const [query,setQuery]=useState(''); const [city,setCity]=useState('Todas');const [period,setPeriod]=useState('Todos');const [community,setCommunity]=useState('Todas');const [slide,setSlide]=useState(0);const [explain,setExplain]=useState(false);const [extra,setExtra]=useState(false);const [direction,setDirection]=useState<'next'|'previous'>('next');
 const featured=ranking.map(r=>all.find(e=>e.id===r.id)).filter((e):e is Event=>!!e);const current=featured[slide%Math.max(featured.length,1)];
 const featuredCover=covers.find(c=>c.id===current?.id)?.selected;
 const imageWidth=featuredCover?Math.min(480,Math.max(245,350*featuredCover.width/featuredCover.height)):350;
 const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const filtered=all.filter(e=>(!savedOnly||favorites.includes(e.id))&&(city==='Todas'||e.city===city)&&(community==='Todas'||e.community===community)&&normalize(eventSearchText(e,translationsMap)).includes(normalize(query))&&(period==='Todos'||(calendarDay(e.start)<=moveDay(today,Number(period))&&calendarDay(e.end??e.start)>=today)));
 const cities=[...new Set(all.map(e=>e.city))].sort();
 function reset(){setCity('Todas');setQuery('');setPeriod('Todos');setCommunity('Todas');}
 return <>
 <section className="page-heading"><div><div className="eyebrow">{t("Galicia · Comunidades tecnológicas")}</div><h1>{savedOnly?t("Tus guardados"):t("Agenda tech")}<span className="heading-dot">.</span></h1><p>{savedOnly?t("Los encuentros que quieres tener a mano."):t("Charlas, talleres y encuentros de las comunidades de Galicia.")}</p></div><div className="heading-aside"><span className="mini-avatars"><span title="GDG"><CommunityLogo identity="GDG" size={20}/></span><span title="WordPress"><CommunityLogo identity="WordPress" size={20}/></span><span title="Python"><CommunityLogo identity="Python" size={20}/></span></span><span><strong>{sources.length} {t('comunidades')}</strong><small>{t("Una sola agenda")}</small></span></div></section>
 {view==='agenda'&&!savedOnly&&current&&<section className="featured-section" aria-labelledby="featured-heading"><div className="section-head"><h2 id="featured-heading"><span className="sparkle">✳</span> {t("Próximos destacados")}</h2><div className="carousel-tools"><span className="slide-count">0{slide%featured.length+1} <span>/ 0{featured.length}</span></span><button className="icon-button outlined" aria-label={t("Anterior destacado")} onClick={()=>{setDirection('previous');setSlide((slide+featured.length-1)%featured.length);}}><ChevronLeft size={18}/></button><button className="icon-button outlined" aria-label={t("Siguiente destacado")} onClick={()=>{setDirection('next');setSlide((slide+1)%featured.length);}}><ChevronRight size={18}/></button></div></div>
 <div className="featured-card" data-direction={direction} key={current.id}><Link className="featured-image-link" style={{'--cover-width':imageWidth+'px'} as CSSProperties} href={'/evento/'+current.id} aria-label={t("Ver ")+eventText(current.title)}><Poster event={current} featured/></Link><div className="featured-copy"><div className="flex items-center justify-between gap-3"><span className="pill filled"><span className="status-dot"/>{t(topic(current))}</span><Save event={current}/></div><div className="featured-date"><CalendarDays size={15}/>{formatRange(current.start,current.end??current.start,{weekday:"long",day:"numeric",month:"long"})}</div><Link href={'/evento/'+current.id}><h3>{eventText(current.title)}</h3></Link><div className="featured-meta"><span><MapPin size={15}/>{current.city}</span><span><Users size={15}/>{current.community}</span></div><p className="featured-description">{eventText(current.description[0])}</p><div className="featured-bottom"><Link href={'/evento/'+current.id} className="button primary">{t("Ver evento")} <ArrowUpRight size={17}/></Link><span className="price-tag">{t(current.price)}</span></div></div></div>
 <div className="featured-caption"><button onClick={()=>setExplain(!explain)} aria-expanded={explain}><Info size={13}/>{t("¿Por qué estos eventos?")}</button><div className="dots">{featured.map((e,i)=><button key={e.id} aria-label={t("Ver destacado ")+(i+1)} aria-pressed={slide%featured.length===i} onClick={()=>{setDirection(i<slide%featured.length?'previous':'next');setSlide(i);}}/>)}</div><span>{t("Selección editorial")}</span></div><Disclosure open={explain}><div className="inline-note">{eventText(ranking.find(r=>r.id===current.id)?.reason??'')} {t("Selección por proximidad de fecha. La priorización con LLM aún no está activada.")}</div></Disclosure>
 </section>}
 <section className="agenda-list encounters-view" aria-labelledby="events-heading"><div className="section-head list-head event-browser-toolbar"><div><h2 id="events-heading">{savedOnly?t("Eventos guardados"):view==='calendar'?t('Calendario de encuentros'):t("Todos los encuentros")} <span className="count-badge">{filtered.length}</span></h2><p>{view==='calendar'?t('Mes a mes · Horarios de Galicia'):t("Ordenados por fecha · Horarios de Galicia")}</p></div><EventViewSwitch view={view} onChange={navigateView}/></div>
 <div className="filter-bar"><label className="search-field"><Search size={18}/><input aria-label={t("Buscar eventos")} value={query} onChange={e=>setQuery(e.target.value)} placeholder={t("Busca un evento, una comunidad…")}/>{query&&<button onClick={()=>setQuery('')} aria-label={t("Borrar búsqueda")}><X size={15}/></button>}</label><label className="select-field"><MapPin size={16}/><select aria-label={t("Localidad")} value={city} onChange={e=>setCity(e.target.value)}><option value="Todas">{t("Toda Galicia")}</option>{cities.map(c=><option key={c}>{c}</option>)}</select></label><button className={'button filter-button '+(extra?'selected':'')} onClick={()=>setExtra(!extra)} aria-expanded={extra} aria-controls="extra-filters"><SlidersHorizontal size={17}/><span>{t("Filtros")}</span></button></div>
 <Disclosure open={extra} id="extra-filters"><div className="expanded-filters"><label>{t("Comunidad")}<select value={community} onChange={e=>setCommunity(e.target.value)}><option value="Todas">{t("Todas")}</option>{[...new Set(all.map(e=>e.community))].map(c=><option key={c}>{c}</option>)}</select></label><span>{t("Los periodos se calculan desde hoy.")}</span></div></Disclosure>
 <div className="filter-chips"><div role="group" aria-label={t("Periodo")}>{[['Todos','Todos'],['7','Esta semana'],['30','Próximos 30 días']].map(([value,label])=><button key={value} aria-pressed={period===value} className={period===value?'chip active':'chip'} onClick={()=>setPeriod(value)}>{period===value&&<Check size={13}/>} {t(label)}</button>)}</div><span>{filtered.length} {t("eventos encontrados")}</span></div>
 {view==='agenda'?<AgendaList events={filtered} renderCard={event=><EncounterRow event={event} key={event.id}/>}/>:<CalendarView events={filtered} month={displayedMonth} today={today} onMonthChange={month=>navigateView('calendar',month)} renderPoster={event=><Poster event={event}/>}/>}
 {view==='agenda'&&!filtered.length&&<div className="empty-state"><Search size={28}/><h3>{savedOnly&&!favorites.length?t("Todavía no has guardado eventos"):t("No hay coincidencias")}</h3><p>{savedOnly&&!favorites.length?t("Usa el marcador de un evento para guardarlo en este navegador."):t("Prueba otra búsqueda o amplía los filtros.")}</p>{savedOnly&&!favorites.length?<Link className="button primary" href="/">{t("Explorar eventos")}</Link>:<button className="button secondary" onClick={reset}>{t("Limpiar filtros")}</button>}</div>}
 </section><div className="sample-footnote"><Info size={14}/><span>{t('Confirma horarios, plazas y entradas en la fuente original.')}</span></div>
 </>;
}
export function EventDetail({id}:{id:string}){const {t,eventText,formatRange}=useI18n();
 const event=useEvents().find(e=>e.id===id);
 if(!event)return <div className="empty-state"><h1>{t("Evento no disponible")}</h1><p>{t('La convocatoria no está publicada o ya no está disponible.')}</p><Link href="/" className="button primary">{t("Volver a la agenda")}</Link></div>;
 return <><Link className="back-link" href="/"><ArrowLeft size={16}/>{t("Volver a la agenda")}</Link><div className="event-detail"><div><div className="detail-poster"><Poster event={event}/></div><div className="eyebrow mt-8">{event.community} · {t(topic(event))}</div><h1>{eventText(event.title)}</h1><div className="detail-description">{event.description.map((p,i)=><p key={i}>{eventText(p)}</p>)}</div>{event.statusNote&&<div className="inline-note warning"><Info size={18}/>{eventText(event.statusNote)}</div>}<section className="detail-section"><h2>{t("Antes de ir")}</h2><p>{eventText(event.requirements)}</p></section><section className="detail-section" id="fuentes"><h2>{t("Fuentes originales")} <span className="count-badge">{event.sources.length}</span></h2><p>{t("Consulta la convocatoria completa y los cambios de la organización.")}</p><div className="source-links">{event.sources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer"><ExternalLink size={16}/>{eventText(s.label)}<ArrowUpRight size={17}/></a>)}</div></section></div><aside className="event-sidebar"><span className="pill filled">{t(event.price)}</span><h2>{t("Información del encuentro")}</h2><div className="info-line"><CalendarDays size={20}/><div><strong>{formatRange(event.start,event.end??event.start)}</strong><span>{eventText(event.timeLabel)}</span></div></div><div className="info-line"><MapPin size={20}/><div><strong>{event.city}</strong><span>{event.place}</span></div></div><div className="info-line"><Users size={20}/><div><strong>{t("Organiza")}</strong><span>{event.community}</span></div></div>{event.registration?<a className="button primary w-full" href={event.registration.url} target="_blank" rel="noreferrer">{t("Ir a la inscripción")} <ArrowUpRight size={17}/></a>:<p>{t("Inscripción no confirmada.")}</p>}<div className="detail-save"><Save event={event}/><span>{t("Guardar para más tarde")}</span></div><small>{t("La inscripción se realiza en la web del organizador.")}</small></aside></div></>;
}
