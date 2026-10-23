import {validMonth} from './calendar';
import {browseHref,savedCollectionHref} from './browse-navigation';

export type PageSearchParams=Record<string,string|string[]|undefined>;
export function legacyCalendarHref(params:PageSearchParams){
 if(params.guardados==='1')return savedCollectionHref({get:key=>typeof params[key]==='string'?params[key]:null});
 if(params.vista!=='calendario')return null;
 return browseHref('/calendario',{get(key){
  const value=params[key];
  if(typeof value!=='string'||key==='mes'&&!validMonth(value))return null;
  return value;
 }});
}
