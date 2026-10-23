import {validMonth} from './calendar';
import {browseHref} from './browse-navigation';

export type PageSearchParams=Record<string,string|string[]|undefined>;
export function legacyCalendarHref(params:PageSearchParams,savedOnly=false){
 if(params.vista!=='calendario')return null;
 return browseHref('/calendario',{get(key){
  const value=params[key];
  if(typeof value!=='string'||key==='mes'&&!validMonth(value))return null;
  return value;
 }},savedOnly||params.guardados==='1');
}
