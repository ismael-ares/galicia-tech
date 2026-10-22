import type {Event} from './data';
export function eventSearchText(event:Event,translations:Record<string,string>={}){return [event.title,translations[event.title]??'',event.city,event.community].join(' ');}
