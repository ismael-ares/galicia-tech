'use client';
import {useRef,type ReactNode} from 'react';
import type {Event} from '@/lib/data';
import {calendarDay,moveDay} from '@/lib/calendar';
import {useI18n} from './i18n';
import {useAnimatedList} from './motion';

export function AgendaList({events,today,period,renderCard}:{events:Event[];today:string;period:'proximos'|'pasados';renderCard:(event:Event)=>ReactNode}){
 const {t,formatDate}=useI18n();
 const listRef=useRef<HTMLDivElement>(null);
 const ordered=[...events].sort((a,b)=>(new Date(a.start).getTime()-new Date(b.start).getTime())*(period==='pasados'?-1:1));
 const months=[...new Set(ordered.map(event=>calendarDay(event.start).slice(0,7)))];
 useAnimatedList(listRef,ordered.map(event=>event.id).join('|'));
 return <div id="event-list" ref={listRef} data-period={period}>
   {months.map(month=>{const monthly=ordered.filter(event=>calendarDay(event.start).startsWith(month));const days=[...new Set(monthly.map(event=>calendarDay(event.start)))];
    return <div className="agenda-month-group" key={month}>
     <div className="agenda-month-header"><h3 className="agenda-month-heading">{formatDate(month+'-01T12:00:00Z',{month:'long',year:'numeric'})}</h3><i aria-hidden="true"/></div>
     {days.map(date=>{const group=monthly.filter(event=>calendarDay(event.start)===date),dateValue=date+'T12:00:00Z';const label=period==='pasados'?'':date===today?'Hoy':date===moveDay(today,1)?'Mañana':date<today?'En curso':'';
      return <section className="date-group encounter-group" key={date} aria-label={formatDate(dateValue,{day:'numeric',month:'long',year:'numeric'})}><div className="date-heading"><time dateTime={date}><span className="group-weekday">{formatDate(dateValue,{weekday:'long'})}</span><span className="group-day">{formatDate(dateValue,{day:'2-digit'})}<span>{formatDate(dateValue,{month:'short'}).replace('.','')}</span></span></time>{label&&<span className="agenda-relative-day">{t(label)}</span>}<span className="group-count">{group.length} {t(group.length===1?'encuentro':'encuentros')}</span></div><div className="encounter-group-cards">{group.map(event=>renderCard(event))}</div></section>;
     })}
    </div>;
   })}
 </div>;
}
