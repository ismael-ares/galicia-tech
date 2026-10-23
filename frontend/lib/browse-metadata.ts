import {getRequestLocale} from './request-locale';
import type {PageSearchParams} from './legacy-calendar';

export async function browseMetadata(view:'agenda'|'calendar',params:PageSearchParams){
 const locale=await getRequestLocale();
 const label=view==='calendar'?'Calendario':locale==='gl'?'Axenda':'Agenda';
 const scope=params.guardados==='1'?(locale==='gl'?'Gardados':'Guardados')+' · ':'';
 return {title:'Galicia Tech · '+scope+label};
}
