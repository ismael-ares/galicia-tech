'use client';
import Link from 'next/link';
import {useEffect,useMemo,useRef,useState,type CSSProperties,type KeyboardEvent,type ReactNode} from 'react';
import {ArrowDown,ArrowRight,ArrowUp,ArrowUpRight,CalendarDays,ChevronDown,ChevronLeft,ChevronRight,Clock3,ExternalLink,Info,MapPin,Ticket} from 'lucide-react';
import {calendarMonth,eventDays,moveDay,moveMonth,validMonth} from '@/lib/calendar';
import {type Event,topic} from '@/lib/data';
import {useI18n} from './i18n';
import {CommunityLogo} from './community-logo';
import {FloatingPanel} from './collection-tools';

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
 const [monthPanel,setMonthPanel]=useState(false),[draftMonth,setDraftMonth]=useState(month);const monthTrigger=useRef<HTMLButtonElement>(null);
 useEffect(()=>{setMonthPanel(false);},[month]);
 const buttons=useRef(new Map<string,HTMLButtonElement>());
 const focusDate=useRef<string|null>(null);
 const {days:dates,monthly,byDay}=useMemo(()=>calendarMonth(events,month),[events,month]);
 const busyDays=dates.filter(day=>day.startsWith(month)&&!!byDay.get(day)?.length);
 const suggested=busyDays.find(day=>day>=today)||busyDays.at(-1)||(today.startsWith(month)?today:month+'-01');
 const selected=selection?.startsWith(month)?selection:suggested;
 const selectedEvents=[...(byDay.get(selected)??[])].sort((a,b)=>new Date(a.start).getTime()-new Date(b.start).getTime());
 const previousBusy=busyDays.filter(day=>day<selected).at(-1),nextBusy=busyDays.find(day=>day>selected);
 const otherMonths=[...new Set(events.flatMap(event=>{const range=eventDays(event);return [range.start.slice(0,7),range.end.slice(0,7)];}))].filter(value=>value!==month).sort();
 const nearbyMonth=otherMonths.find(value=>value>month)||otherMonths.at(-1);
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
  if(!multi)return start+(!compact&&end&&!/finalizaci/i.test(event.statusNote)?' – '+end:'');
  if(day===range.start)return t('Inicio')+' '+start;
  if(day===range.end)return t('Hasta')+' '+end;
  return t('Continúa');
 }
 return <div className="calendar-view" style={{'--calendar-weeks':weeks.length} as CSSProperties}>
  <div className="calendar-toolbar">
   <div className="calendar-month-heading"><h2 id="calendar-month-title" aria-live="polite"><button ref={monthTrigger} type="button" className="calendar-month-title-button" data-month={month} aria-haspopup="dialog" aria-expanded={monthPanel} onClick={()=>{setDraftMonth(month);setMonthPanel(true);}}>{title}<ChevronDown size={16}/></button></h2><p><strong>{monthly.length}</strong> {t(monthly.length===1?'encuentro':'encuentros')}<span aria-hidden="true"/> <strong>{busyDays.length}</strong> {t(busyDays.length===1?'día con encuentros':'días con encuentros')}</p></div>
   <div className="calendar-month-controls">
    <button className="calendar-today" type="button" onClick={()=>{setSelection(today);onMonthChange(today.slice(0,7));}}>{t('Hoy')}</button>

    <div className="calendar-arrows"><button className="icon-button" type="button" aria-label={t('Mes anterior')} onClick={()=>onMonthChange(moveMonth(month,-1))}><ChevronLeft size={18}/></button><button className="icon-button" type="button" aria-label={t('Mes siguiente')} onClick={()=>onMonthChange(moveMonth(month,1))}><ChevronRight size={18}/></button></div>
   </div>
  </div>
  {monthPanel&&<FloatingPanel title={t('Elegir mes')} anchor={monthTrigger.current!} onClose={()=>setMonthPanel(false)}><form onSubmit={event=>{event.preventDefault();if(validMonth(draftMonth)){onMonthChange(draftMonth);setMonthPanel(false);}}}><div className="collection-panel-fields"><label>{t('Ir a un mes')}<input className="collection-month-input" type="month" data-autofocus required aria-label={t('Ir a un mes')} value={draftMonth} onChange={event=>setDraftMonth(event.target.value)}/></label></div><footer><button type="button" className="text-action" onClick={()=>setMonthPanel(false)}>{t('Cancelar')}</button><button type="submit" className="button primary">{t('Ir al mes')}</button></footer></form></FloatingPanel>}
  <div className="calendar-layout">
   <div className="calendar-month" id="calendar-month-grid">
    <table aria-labelledby="calendar-month-title"><thead><tr>{weekdayDates.map((day,index)=><th key={day} scope="col" data-weekend={index>4}><abbr title={formatDate(day+'T12:00:00Z',{weekday:'long'})}>{formatDate(day+'T12:00:00Z',{weekday:'long'}).slice(0,3)}</abbr></th>)}</tr></thead>
     <tbody>{weeks.map(week=><tr key={week[0]}>{week.map((day,index)=>{
      const daily=byDay.get(day)??[],inMonth=day.startsWith(month),visible=daily.slice(0,daily.length>2?1:2);
      return <td key={day} data-day={day} data-outside={!inMonth} data-selected={day===selected} data-today={day===today} data-weekend={index>4} data-busy={daily.length>0}>
       <button ref={node=>{if(node)buttons.current.set(day,node);else buttons.current.delete(day);}} className="calendar-day-button" type="button" aria-label={formatDate(day+'T12:00:00Z',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+', '+daily.length+' '+(daily.length===1?t('encuentro'):t('encuentros'))} aria-pressed={day===selected} aria-current={day===today?'date':undefined} aria-controls="calendar-day-panel" tabIndex={day===selected?0:-1} onClick={()=>select(day)} onKeyDown={e=>keyboard(e,day)}>
        <span className="calendar-day-number">{Number(day.slice(-2))}</span>{daily.length>1&&<span className="calendar-day-count" aria-hidden="true">{daily.length}</span>}
       </button>
       <div className="calendar-cell-events" data-crowded={visible.length>1}>{visible.map(event=><Link className="calendar-event" data-tone={tone(event)} key={event.id} href={'/evento/'+event.id} title={eventText(event.title)+' · '+time(event,day)}>
        <span className="calendar-event-time"><span className="calendar-event-logo"><CommunityLogo identity={event.community} size={14}/></span><span className="calendar-event-hour">{time(event,day,true)}</span></span><strong>{eventText(event.title)}</strong>
       </Link>)}{daily.length>visible.length&&<button type="button" className="calendar-more" onClick={()=>select(day)}>+{daily.length-visible.length} {t('más')}<ChevronRight size={11}/></button>}</div>
       <div className="calendar-mobile-marks" aria-hidden="true">{daily.slice(0,1).map(event=><span key={event.id}><CommunityLogo identity={event.community} size={13}/></span>)}{daily.length>1&&<small>+{daily.length-1}</small>}</div>
      </td>;
     })}</tr>)}</tbody>
    </table>
    <div className="calendar-legend"><span><i/>{t('Hoy')}<span className="calendar-legend-selected"/>{t('Día seleccionado')}</span><span className="calendar-legend-hint">{t('Selecciona un día para ver sus eventos')}</span><a className="calendar-view-day" href="#calendar-day-panel">{t('Ver día seleccionado')}<ArrowDown size={12}/></a></div>
   </div>
   <aside className="calendar-day-panel" id="calendar-day-panel" aria-labelledby="calendar-day-title">
    <header><div className="calendar-panel-label"><CalendarDays size={13}/>{t('Día seleccionado')}<a href="#calendar-month-grid" className="calendar-back-to-month">{t('Volver al mes')}<ArrowUp size={12}/></a></div><h3 className="calendar-selected-date" id="calendar-day-title"><time dateTime={selected} aria-label={formatDate(selected+'T12:00:00Z')}><strong>{Number(selected.slice(-2))}</strong><span><b>{selected===today?t('Hoy'):formatDate(selected+'T12:00:00Z',{weekday:'long'})}</b><small>{formatDate(selected+'T12:00:00Z',{month:'long',year:'numeric'})}</small></span></time></h3><div className="calendar-day-panel-toolbar"><p role="status"><strong>{selectedEvents.length}</strong> {t(selectedEvents.length===1?'encuentro':'encuentros')}</p><div><button className="icon-button" type="button" aria-label={t('Día anterior con encuentros')} disabled={!previousBusy} onClick={()=>previousBusy&&select(previousBusy)}><ChevronLeft size={16}/></button><button className="icon-button" type="button" aria-label={t('Siguiente día con encuentros')} disabled={!nextBusy} onClick={()=>nextBusy&&select(nextBusy)}><ChevronRight size={16}/></button></div></div></header>
    {selectedEvents.length?<div className="calendar-day-events" key={selected}>{selectedEvents.map(event=>{
     const range=eventDays(event),multi=range.start!==range.end;
     const endNote=!multi?(/finalizaci/i.test(event.statusNote)?t('Fin por confirmar'):!event.end?t('Fin no indicado'):''):'';
     const notes=[...new Set([event.cardNote,!/horari|hora|finalizaci/i.test(event.statusNote)&&event.statusNote].filter((note):note is string=>!!note))];
     return <article className="calendar-day-event" key={event.id} data-calendar-event={event.id}>
      <div className="calendar-day-event-top"><div className="calendar-event-community"><span><CommunityLogo identity={event.community} size={17}/></span><small>{event.community}</small></div>{renderSave?.(event)}</div>
      <div className="calendar-day-event-heading"><Link className="calendar-thumbnail" href={'/evento/'+event.id} aria-label={t('Ver ficha')+': '+eventText(event.title)} tabIndex={-1}>{renderPoster(event)}</Link><Link href={'/evento/'+event.id}><h4>{eventText(event.title)}</h4></Link></div>
      {event.description[0]&&<p className="calendar-event-summary">{eventText(event.description[0])}</p>}
      <dl className="calendar-day-event-meta">
       <div><dt><Clock3 size={14}/><span>{t('Horario')}</span></dt><dd>{time(event,selected)}{endNote&&<small>{endNote}</small>}</dd></div>
       <div><dt><MapPin size={14}/><span>{t('Lugar')}</span></dt><dd>{event.city}<small>{event.place}</small></dd></div>
       <div><dt><Ticket size={14}/><span>{t('Entrada')}</span></dt><dd>{t(/no indicado/i.test(event.price)?'Sin confirmar':event.price)}</dd></div>
      </dl>
      <div className="calendar-day-tags"><span data-tone={tone(event)}>{t(topic(event))}</span>{notes.map(note=><span className="calendar-schedule-note" key={note}><Info size={11}/>{eventText(note)}</span>)}</div>
      <div className="calendar-day-event-bottom">{event.sources[0]&&<a className="calendar-original-source" href={event.sources[0].url} target="_blank" rel="noreferrer"><ExternalLink size={12}/>{t('Fuente original')}</a>}<Link href={'/evento/'+event.id}>{t('Ver ficha')}<ArrowUpRight size={14}/></Link></div>
     </article>;
    })}</div>:<div className="calendar-day-empty"><span className="calendar-empty-icon"><CalendarDays size={27}/></span><h4>{t(monthly.length?'No hay encuentros este día':'No hay encuentros este mes')}</h4><p>{t(monthly.length?'Prueba otra fecha o revisa los filtros.':'Cambia de mes o amplía los filtros.')}</p>{(nextBusy||busyDays[0])?<button type="button" onClick={()=>select(nextBusy||busyDays[0])}>{t('Ver un día con encuentros')}<ArrowRight size={15}/></button>:nearbyMonth&&<button type="button" onClick={()=>onMonthChange(nearbyMonth)}>{t('Ir a un mes con encuentros')}<ArrowRight size={15}/></button>}</div>}
   </aside>
  </div>
 </div>;
}
