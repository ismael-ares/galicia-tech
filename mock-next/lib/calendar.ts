import type { Event } from './data';

export function calendarDay(value:string|Date){
 const parts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:'Europe/Madrid'}).formatToParts(new Date(value));
 const get=(type:string)=>parts.find(p=>p.type===type)!.value;
 return `${get('year')}-${get('month')}-${get('day')}`;
}
export function validMonth(value:string|null):value is string{return !!value&&/^\d{4}-(0[1-9]|1[0-2])$/.test(value)&&!value.startsWith('0000');}
export function moveDay(day:string,amount:number){const date=new Date(day+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+amount);return date.toISOString().slice(0,10);}
export function moveMonth(month:string,amount:number){const date=new Date(month+'-01T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+amount);return date.toISOString().slice(0,7);}
export function monthDays(month:string){
 const first=month+'-01',last=moveDay(moveMonth(month,1)+'-01',-1);
 const offset=(new Date(first+'T12:00:00Z').getUTCDay()+6)%7;
 const start=moveDay(first,-offset);
 const count=Math.ceil((offset+Number(last.slice(-2)))/7)*7;
 return Array.from({length:count},(_,index)=>moveDay(start,index));
}
export function eventDays(event:Event){
 const start=calendarDay(event.start),endTime=event.end?new Date(event.end).getTime():NaN;
 // End is exclusive at midnight; an event ending at 00:00 does not fill the next day.
 const end=Number.isFinite(endTime)&&endTime>new Date(event.start).getTime()?calendarDay(new Date(endTime-1)):start;
 return {start,end};
}
export function eventsOnDay(events:Event[],day:string){return events.filter(event=>{const range=eventDays(event);return range.start<=day&&range.end>=day;});}
export function eventsInMonth(events:Event[],month:string){const first=month+'-01',last=moveDay(moveMonth(month,1)+'-01',-1);return events.filter(event=>{const range=eventDays(event);return range.start<=last&&range.end>=first;});}
export function calendarMonth(events:Event[],month:string){
 const days=monthDays(month),byDay=new Map(days.map(day=>[day,[] as Event[]]));
 const monthly:Event[]=[],first=month+'-01',last=moveDay(moveMonth(month,1)+'-01',-1);
 for(const event of events){
  const range=eventDays(event);
  if(range.start<=last&&range.end>=first)monthly.push(event);
  for(const day of days)if(range.start<=day&&range.end>=day)byDay.get(day)!.push(event);
 }
 return {days,byDay,monthly};
}
