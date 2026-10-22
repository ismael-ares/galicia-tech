'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, ExternalLink, MapPin, Ticket } from 'lucide-react';
import { calendarMonth, eventDays, moveDay, moveMonth, validMonth } from '@/lib/calendar';
import { type Event, topic } from '@/lib/data';
import { useI18n } from './i18n';
import { CommunityLogo } from './community-logo';

type Props={events:Event[];month:string;today:string;onMonthChange:(month:string)=>void;renderPoster:(event:Event)=>ReactNode;renderSave?:(event:Event)=>ReactNode};
function tone(event:Event){
 if(/devfest/i.test(event.title))return 'conference';
 if(/wordpress/i.test(event.community))return 'community';
 if(/python/i.test(event.community))return 'code';
 return 'tech';
}
export function CalendarView({events,month,today,onMonthChange,renderPoster,renderSave}:Props){
 const {t,eventText,formatDate}=useI18n();
 const [selection,setSelection]=useState<string|null>(null);
 const buttons=useRef(new Map<string,HTMLButtonElement>());
 const focusDate=useRef<string|null>(null);
 const {days:dates,monthly,byDay}=useMemo(()=>calendarMonth(events,month),[events,month]);
 const selected=selection?.startsWith(month)?selection:today.startsWith(month)?today:monthly.length?eventDays(monthly[0]).start<month+'-01'?month+'-01':eventDays(monthly[0]).start:month+'-01';
 const selectedEvents=byDay.get(selected)??[];
 const busyDays=dates.filter(day=>day.startsWith(month)&&!!byDay.get(day)?.length);
 const previousBusy=busyDays.filter(day=>day<selected).at(-1);
 const nextBusy=busyDays.find(day=>day>selected);
 const title=formatDate(month+'-01T12:00:00Z',{month:'long',year:'numeric'});
 const weeks=Array.from({length:dates.length/7},(_,index)=>dates.slice(index*7,index*7+7));
 const weekdayDates=Array.from({length:7},(_,i)=>moveDay('2026-10-19',i));
 useEffect(()=>{if(focusDate.current===selected){buttons.current.get(selected)?.focus();focusDate.current=null;}},[month,selected]);
 function select(day:string){setSelection(day);if(!day.startsWith(month))onMonthChange(day.slice(0,7));}
 function keyboard(event:KeyboardEvent<HTMLButtonElement>,day:string){
  let next:string|undefined;
  const weekday=(new Date(day+'T12:00:00Z').getUTCDay()+6)%7;
  if(event.key==='ArrowRight')next=moveDay(day,1);
  if(event.key==='ArrowLeft')next=moveDay(day,-1);
  if(event.key==='ArrowDown')next=moveDay(day,7);
  if(event.key==='ArrowUp')next=moveDay(day,-7);
  if(event.key==='Home')next=moveDay(day,-weekday);
  if(event.key==='End')next=moveDay(day,6-weekday);
  if(next){event.preventDefault();focusDate.current=next;select(next);}
 }
 function time(event:Event,day:string,compact=false){
  const range=eventDays(event),multi=range.start!==range.end;
  if(multi&&/horari|hora|finalizaci/i.test(event.statusNote))return t(compact?'Varias jornadas':'Horario por confirmar');
  const start=formatDate(event.start,{hour:'2-digit',minute:'2-digit'});
  const end=event.end?formatDate(event.end,{hour:'2-digit',minute:'2-digit'}):'';
  if(!multi)return start+(!compact&&end&&!/finalizaci/i.test(event.statusNote)?'–'+end:'');
  if(day===range.start)return t('Inicio')+' '+start;
  if(day===range.end)return t('Hasta')+' '+end;
  return t('Continúa');
 }
 return <div className="calendar-view">
  <div className="calendar-toolbar">
   <div className="calendar-month-heading"><span className="calendar-eyebrow"><span/>{t('Vista mensual')}</span><h3 id="calendar-month-title" aria-live="polite">{title}</h3><p>{monthly.length} {monthly.length===1?t('encuentro este mes'):t('encuentros este mes')}</p></div>
   <div className="calendar-month-controls">
    <button className="calendar-today" type="button" onClick={()=>{setSelection(today);onMonthChange(today.slice(0,7));}}>{t('Hoy')}</button>
    <label className="calendar-month-picker"><CalendarDays size={16}/><input type="month" aria-label={t('Ir a un mes')} value={month} onChange={e=>{if(validMonth(e.target.value))onMonthChange(e.target.value);}}/></label>
    <div className="calendar-arrows"><button className="icon-button" type="button" aria-label={t('Mes anterior')} onClick={()=>onMonthChange(moveMonth(month,-1))}><ChevronLeft size={18}/></button><button className="icon-button" type="button" aria-label={t('Mes siguiente')} onClick={()=>onMonthChange(moveMonth(month,1))}><ChevronRight size={18}/></button></div>
   </div>
  </div>
  <div className="calendar-layout">
   <div className="calendar-month">
    <table aria-labelledby="calendar-month-title"><thead><tr>{weekdayDates.map((day,index)=><th key={day} scope="col" data-weekend={index>4}><abbr title={formatDate(day+'T12:00:00Z',{weekday:'long'})}>{formatDate(day+'T12:00:00Z',{weekday:'long'}).slice(0,3)}</abbr></th>)}</tr></thead>
     <tbody>{weeks.map(week=><tr key={week[0]}>{week.map((day,index)=>{
      const daily=byDay.get(day)??[],inMonth=day.startsWith(month);
      return <td key={day} data-day={day} data-outside={!inMonth} data-selected={day===selected} data-today={day===today} data-weekend={index>4} data-busy={daily.length>0}>
       <button ref={node=>{if(node)buttons.current.set(day,node);else buttons.current.delete(day);}} className="calendar-day-button" type="button" aria-label={formatDate(day+'T12:00:00Z',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+', '+daily.length+' '+(daily.length===1?t('encuentro'):t('encuentros'))} aria-pressed={day===selected} aria-current={day===today?'date':undefined} aria-controls="calendar-day-panel" tabIndex={day===selected?0:-1} onClick={()=>select(day)} onKeyDown={e=>keyboard(e,day)}>
        <span className="calendar-day-number">{Number(day.slice(-2))}</span>{daily.length>0&&<span className="calendar-day-count" aria-hidden="true">{daily.length}</span>}
       </button>
       <div className="calendar-cell-events">{daily.slice(0,1).map(event=><Link className="calendar-event" data-tone={tone(event)} key={event.id} href={'/evento/'+event.id} title={eventText(event.title)+' · '+time(event,day)}>
        <span className="calendar-event-time"><span className="calendar-event-logo"><CommunityLogo identity={event.community} size={14}/></span>{time(event,day,true)}</span><strong>{eventText(event.title)}</strong><span className="calendar-event-city">{event.city}</span>
       </Link>)}{daily.length>1&&<button type="button" className="calendar-more" onClick={()=>select(day)}>+{daily.length-1} {t('más')}</button>}</div>
       <div className="calendar-mobile-dots" aria-hidden="true">{daily.slice(0,3).map(event=><i data-tone={tone(event)} key={event.id}/>)}</div>
      </td>;
     })}</tr>)}</tbody>
    </table>
    <div className="calendar-legend"><span><Clock3 size={13}/>{t('Horarios de Galicia')}</span><span>{t('Selecciona un día para ver sus eventos')}</span></div>
    {busyDays.length>0&&<nav className="calendar-jump-days" aria-label={t('Días con encuentros')}><span>{t('Días con encuentros')}</span><div>{busyDays.map(day=><button key={day} type="button" aria-pressed={day===selected} aria-controls="calendar-day-panel" onClick={()=>select(day)}><strong>{Number(day.slice(-2))}</strong><span>{formatDate(day+'T12:00:00Z',{weekday:'short'})}<small>{byDay.get(day)!.length} {byDay.get(day)!.length===1?t('encuentro'):t('encuentros')}</small></span></button>)}</div></nav>}
   </div>
   <aside className="calendar-day-panel" id="calendar-day-panel" aria-labelledby="calendar-day-title">
    <header><div className="calendar-selected-date"><strong aria-hidden="true">{Number(selected.slice(-2))}</strong><div><span>{selected===today?t('Hoy'):formatDate(selected+'T12:00:00Z',{weekday:'long'})}</span><h3 id="calendar-day-title">{formatDate(selected+'T12:00:00Z',{day:'numeric',month:'long'})}</h3></div></div><div className="calendar-day-panel-toolbar"><p role="status">{selectedEvents.length} {selectedEvents.length===1?t('encuentro'):t('encuentros')}</p><div><button className="icon-button" type="button" aria-label={t('Día anterior con encuentros')} disabled={!previousBusy} onClick={()=>previousBusy&&select(previousBusy)}><ChevronLeft size={15}/></button><button className="icon-button" type="button" aria-label={t('Siguiente día con encuentros')} disabled={!nextBusy} onClick={()=>nextBusy&&select(nextBusy)}><ChevronRight size={15}/></button></div></div></header>
    {selectedEvents.length?<div className="calendar-day-events" key={selected}>{selectedEvents.map(event=><article className="calendar-day-event" key={event.id} data-calendar-event={event.id}>
     <div className="calendar-day-event-top"><div className="calendar-event-community"><span><CommunityLogo identity={event.community} size={17}/></span><small>{event.community}</small></div>{renderSave?.(event)}</div>
     <div className="calendar-day-event-heading"><div><Link href={'/evento/'+event.id}><h4>{eventText(event.title)}</h4></Link>{event.description[0]&&<p className="calendar-event-summary">{eventText(event.description[0])}</p>}</div><Link className="calendar-thumbnail" href={'/evento/'+event.id} aria-label={t('Ver ficha')+': '+eventText(event.title)} tabIndex={-1}>{renderPoster(event)}</Link></div>
     <div className="calendar-day-event-meta"><span><Clock3 size={13}/>{time(event,selected)}</span><span><MapPin size={13}/>{event.city}</span><span><Ticket size={13}/>{t(event.price)}</span></div>
     <div className="calendar-day-tags"><span data-tone={tone(event)}>{t(topic(event))}</span>{/finalizaci/i.test(event.statusNote)&&<span className="calendar-schedule-note">{t('Fin por confirmar')}</span>}</div>
     <div className="calendar-day-event-bottom">{event.sources[0]&&<a className="calendar-original-source" href={event.sources[0].url} target="_blank" rel="noreferrer"><ExternalLink size={12}/>{t('Fuente original')}</a>}<Link href={'/evento/'+event.id}>{t('Ver ficha')}<ArrowUpRight size={14}/></Link></div>
    </article>)}</div>:<div className="calendar-day-empty"><span className="calendar-empty-icon"><CalendarDays size={27}/></span><h4>{t('No hay encuentros este día')}</h4><p>{t('Prueba otra fecha o revisa los filtros.')}</p>{(nextBusy||busyDays[0])&&<button type="button" onClick={()=>select(nextBusy||busyDays[0])}>{t('Ver un día con encuentros')}<ArrowRight size={15}/></button>}</div>}
   </aside>
  </div>
 </div>;
}
