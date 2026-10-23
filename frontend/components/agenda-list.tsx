'use client';
import {useRef,type ReactNode} from 'react';
import {ArrowUpRight,History} from 'lucide-react';
import type {Event} from '@/lib/data';
import {calendarDay,eventDays,moveDay} from '@/lib/calendar';
import {useI18n} from './i18n';
import {useAnimatedList} from './motion';

export function AgendaList({events,today,renderCard}:{events:Event[];today:string;renderCard:(event:Event)=>ReactNode}){
 const {t,formatDate}=useI18n();
 const listRef=useRef<HTMLDivElement>(null);
 const upcoming=events.filter(event=>eventDays(event).end>=today).sort((a,b)=>new Date(a.start).getTime()-new Date(b.start).getTime());
 const past=events.filter(event=>eventDays(event).end<today).sort((a,b)=>new Date(b.start).getTime()-new Date(a.start).getTime());
 const sections=[{id:'proximos',label:'Próximos',icon:ArrowUpRight,events:upcoming},{id:'pasados',label:'Pasados',icon:History,events:past}].filter(section=>section.events.length);
 useAnimatedList(listRef,sections.flatMap(section=>section.events.map(event=>event.id)).join('|'));
 return <div id="event-list" ref={listRef}>{sections.map(section=>{
  const months=[...new Set(section.events.map(event=>calendarDay(event.start).slice(0,7)))];
  return <section className="agenda-time-section" key={section.id} data-period={section.id} aria-labelledby={'agenda-'+section.id}>
   <div className="agenda-time-heading"><section.icon size={15}/><h3 id={'agenda-'+section.id}>{t(section.label)}</h3><i aria-hidden="true"/></div>
   {months.map((month,index)=>{const monthly=section.events.filter(event=>calendarDay(event.start).startsWith(month));const days=[...new Set(monthly.map(event=>calendarDay(event.start)))];
    return <div className="agenda-month-group" key={month}>
     <div className="agenda-month-header"><h4 className="agenda-month-heading">{formatDate(month+'-01T12:00:00Z',{month:'long',year:'numeric'})}</h4>{index===0&&<span className="agenda-month-period"><section.icon size={13}/>{t(section.label)}</span>}<i aria-hidden="true"/></div>
     {days.map(date=>{const group=monthly.filter(event=>calendarDay(event.start)===date),dateValue=date+'T12:00:00Z';const label=date===today?'Hoy':date===moveDay(today,1)?'Mañana':section.id==='proximos'&&date<today?'En curso':'';
      return <section className="date-group encounter-group" key={date} aria-label={formatDate(dateValue,{day:'numeric',month:'long',year:'numeric'})}><div className="date-heading"><time dateTime={date}><span className="group-weekday">{formatDate(dateValue,{weekday:'long'})}</span><span className="group-day">{formatDate(dateValue,{day:'2-digit'})}<span>{formatDate(dateValue,{month:'short'}).replace('.','')}</span></span></time>{label&&<span className="agenda-relative-day">{t(label)}</span>}<span className="group-count">{group.length} {t(group.length===1?'encuentro':'encuentros')}</span></div><div className="encounter-group-cards">{group.map(event=>renderCard(event))}</div></section>;
     })}
    </div>;
   })}
  </section>;
 })}</div>;
}
