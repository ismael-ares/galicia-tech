import type { Event } from './data';
import type { Locale } from './locale';
import galician from './messages/events-gl.json';

const translations:Record<string,string>=galician;

// An exact source text is its own version key. Revised text cannot reuse an old
// translation, and display language never changes dates, IDs or review logic.
export function translateEventText(text:string,locale:Locale){
 return locale==='gl'?(translations[text]??text):text;
}

export function eventSearchText(event:Event){
 return [event.title,translateEventText(event.title,'gl'),event.community,event.city].join(' ');
}
