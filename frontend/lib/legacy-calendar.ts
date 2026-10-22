import {validMonth} from './calendar';

export type PageSearchParams=Record<string,string|string[]|undefined>;
export function legacyCalendarHref(params:PageSearchParams,savedOnly=false){
 if(params.vista!=='calendario')return null;
 const query=new URLSearchParams();
 if(typeof params.mes==='string'&&validMonth(params.mes))query.set('mes',params.mes);
 if(savedOnly)query.set('guardados','1');
 return '/calendario'+(query.size?'?'+query.toString():'');
}
