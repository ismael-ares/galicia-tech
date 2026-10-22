'use client';
import { useI18n } from './i18n';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Bookmark, CalendarDays, Clock3, ExternalLink, Info, MapPin, Ticket, Users } from 'lucide-react';
import { type Event, topic } from '@/lib/data';
import { useMock } from './shell';
import { pressFeedback } from './motion';
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
export function Save({event}:{event:Event}){const {t,eventText}=useI18n();const {favorites,toggleFavorite,notify}=useMock();const saved=favorites.includes(event.id);return <button className={'save-button '+(saved?'is-saved':'')} aria-label={(saved?t("Quitar de guardados: "):t("Guardar: "))+eventText(event.title)} aria-pressed={saved} onClick={e=>{pressFeedback(e.currentTarget);toggleFavorite(event.id).then(()=>notify(saved?t('Evento retirado de guardados.'):t('Encuentro guardado.'))).catch(e=>notify(e.message));}}><Bookmark size={19} fill={saved?'currentColor':'none'}/></button>;}
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

export function EventDetail({id}:{id:string}){const {t,eventText,formatRange}=useI18n();
 const event=useEvents().find(e=>e.id===id);
 if(!event)return <div className="empty-state"><h1>{t("Evento no disponible")}</h1><p>{t('La convocatoria no está publicada o ya no está disponible.')}</p><Link href="/" className="button primary">{t("Volver a la agenda")}</Link></div>;
 return <><Link className="back-link" href="/"><ArrowLeft size={16}/>{t("Volver a la agenda")}</Link><div className="event-detail"><div><div className="detail-poster"><Poster event={event}/></div><div className="eyebrow mt-8">{event.community} · {t(topic(event))}</div><h1>{eventText(event.title)}</h1><div className="detail-description">{event.description.map((p,i)=><p key={i}>{eventText(p)}</p>)}</div>{event.statusNote&&<div className="inline-note warning"><Info size={18}/>{eventText(event.statusNote)}</div>}<section className="detail-section"><h2>{t("Antes de ir")}</h2><p>{eventText(event.requirements)}</p></section><section className="detail-section" id="fuentes"><h2>{t("Fuentes originales")} <span className="count-badge">{event.sources.length}</span></h2><p>{t("Consulta la convocatoria completa y los cambios de la organización.")}</p><div className="source-links">{event.sources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer"><ExternalLink size={16}/>{eventText(s.label)}<ArrowUpRight size={17}/></a>)}</div></section></div><aside className="event-sidebar"><span className="pill filled">{t(event.price)}</span><h2>{t("Información del encuentro")}</h2><div className="info-line"><CalendarDays size={20}/><div><strong>{formatRange(event.start,event.end??event.start)}</strong><span>{eventText(event.timeLabel)}</span></div></div><div className="info-line"><MapPin size={20}/><div><strong>{event.city}</strong><span>{event.place}</span></div></div><div className="info-line"><Users size={20}/><div><strong>{t("Organiza")}</strong><span>{event.community}</span></div></div>{event.registration?<a className="button primary w-full" href={event.registration.url} target="_blank" rel="noreferrer">{t("Ir a la inscripción")} <ArrowUpRight size={17}/></a>:<p>{t("Inscripción no confirmada.")}</p>}<div className="detail-save"><Save event={event}/><span>{t("Guardar para más tarde")}</span></div><small>{t("La inscripción se realiza en la web del organizador.")}</small></aside></div></>;
}
