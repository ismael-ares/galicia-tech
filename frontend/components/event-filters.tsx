'use client';
import {useId,useState} from 'react';
import {MapPin,Search,SlidersHorizontal,X} from 'lucide-react';
import {eventSearchText} from '@/lib/event-content';
import type {Event} from '@/lib/data';
import {useI18n} from './i18n';
import {Disclosure} from './motion';

export type EventFiltersValue={query:string;city:string;community:string};
export const emptyEventFilters:EventFiltersValue={query:'',city:'',community:''};
const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function filterEvents(events:Event[],filters:EventFiltersValue,translations:Record<string,string>){
 return events.filter(event=>(!filters.city||event.city===filters.city)&&(!filters.community||event.community===filters.community)&&normalize(eventSearchText(event,translations)).includes(normalize(filters.query)));
}

export function EventFilters({events,value,onChange,searchLabel='Buscar eventos',compact=false}:{events:Event[];value:EventFiltersValue;onChange:(value:EventFiltersValue)=>void;searchLabel?:string;compact?:boolean}){
 const {t}=useI18n();
 const [expanded,setExpanded]=useState(false);
 const id=useId();
 const cities=[...new Set(events.map(event=>event.city))].sort();
 const communities=[...new Set(events.map(event=>event.community))].sort();
 return <div className="event-filters">
  <div className="filter-bar">
   <label className="search-field"><Search size={18}/><input aria-label={t(searchLabel)} value={value.query} onChange={e=>onChange({...value,query:e.target.value})} placeholder={t(searchLabel==='Buscar eventos'?'Busca un evento, una comunidad…':searchLabel)}/>{value.query&&<button type="button" onClick={()=>onChange({...value,query:''})} aria-label={t('Borrar búsqueda')}><X size={15}/></button>}</label>
   {!compact&&<label className="select-field"><MapPin size={16}/><select aria-label={t('Localidad')} value={value.city} onChange={e=>onChange({...value,city:e.target.value})}><option value="">{t('Toda Galicia')}</option>{cities.map(city=><option key={city}>{city}</option>)}</select></label>}
   <button type="button" className={'button filter-button '+(expanded||value.community||compact&&value.city?'selected':'')} onClick={()=>setExpanded(!expanded)} aria-expanded={expanded} aria-controls={id}><SlidersHorizontal size={17}/><span>{t('Filtros')}</span>{(value.community||compact&&value.city)&&<span className="filter-active-dot"/>}</button>
  </div>
  <Disclosure open={expanded} id={id}><div className="expanded-filters">{compact&&<label>{t('Localidad')}<select aria-label={t('Localidad')} value={value.city} onChange={e=>onChange({...value,city:e.target.value})}><option value="">{t('Toda Galicia')}</option>{cities.map(city=><option key={city}>{city}</option>)}</select></label>}<label>{t('Comunidad')}<select value={value.community} onChange={e=>onChange({...value,community:e.target.value})}><option value="">{t('Todas')}</option>{communities.map(community=><option key={community}>{community}</option>)}</select></label>{(value.query||value.city||value.community)&&<button className="text-action" type="button" onClick={()=>onChange(emptyEventFilters)}>{t('Limpiar filtros')}<X size={13}/></button>}</div></Disclosure>
 </div>;
}
