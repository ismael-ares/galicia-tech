import {getRequestLocale} from './request-locale';

export async function browseMetadata(view:'agenda'|'calendar'|'saved'){
 const locale=await getRequestLocale();
 const label=view==='saved'?(locale==='gl'?'Gardados':'Guardados'):view==='calendar'?'Calendario':locale==='gl'?'Axenda':'Agenda';
 return {title:'Galicia Tech · '+label};
}
