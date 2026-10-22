'use client';
import { useRef, type ReactNode } from 'react';
import type { Event } from '@/lib/data';
import { calendarDay } from '@/lib/calendar';
import { useI18n } from './i18n';
import { useAnimatedList } from './motion';

export function AgendaList({events,renderCard}:{events:Event[];renderCard:(event:Event)=>ReactNode}){
 const {t,formatDate}=useI18n();
 const listRef=useRef<HTMLDivElement>(null);
 const groups=[...new Set(events.map(event=>calendarDay(event.start)))];
 useAnimatedList(listRef,events.map(event=>event.id).join('|'));
 return <div id="event-list" ref={listRef}>{groups.map(date=>{
  const group=events.filter(event=>calendarDay(event.start)===date),dateValue=date+'T12:00:00Z';
  return <section className="date-group encounter-group" key={date} aria-label={formatDate(dateValue,{day:'numeric',month:'long'})}><div className="date-heading"><time dateTime={date}><span className="group-weekday">{formatDate(dateValue,{weekday:'long'})}</span><span className="group-day">{formatDate(dateValue,{day:'2-digit'})}<span>{formatDate(dateValue,{month:'short'}).replace('.','')}</span></span></time><span className="group-count">{group.length} {group.length===1?t('encuentro'):t('encuentros')}</span></div><div className="encounter-group-cards">{group.map(event=>renderCard(event))}</div></section>;
 })}</div>;
}
