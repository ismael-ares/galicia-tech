import type { Locale } from './locale';
import galician from './messages/gl-date-parts.json';

// Use the same format on server and browser. Some Chromium builds omit Galician
// ICU data and silently fall back to Spanish, causing mismatched rendered dates.
function display(locale:Locale,parts:Intl.DateTimeFormatPart[]){
 return parts.map(part=>{
  if(locale==='gl'&&(part.type==='month'||part.type==='weekday')){
   const names:Record<string,string>=galician[part.type];
   return names[part.value]??part.value;
  }
  return part.value;
 }).join('');
}

export function localDate(locale:Locale,value:string,options:Intl.DateTimeFormatOptions){
 return display(locale,new Intl.DateTimeFormat('es-ES',{...options,timeZone:'Europe/Madrid'}).formatToParts(new Date(value)));
}

export function localDateRange(locale:Locale,start:string,end:string,options:Intl.DateTimeFormatOptions){
 return display(locale,new Intl.DateTimeFormat('es-ES',{...options,timeZone:'Europe/Madrid'}).formatRangeToParts(new Date(start),new Date(end)));
}
