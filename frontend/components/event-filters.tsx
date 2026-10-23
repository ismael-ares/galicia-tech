'use client';
import type {ReactNode} from 'react';
import {eventSearchText} from '@/lib/event-content';
import type {Event} from '@/lib/data';
import {CollectionTools,type FilterField} from './collection-tools';

export type EventFiltersValue={query:string;city:string;community:string};
export const emptyEventFilters:EventFiltersValue={query:'',city:'',community:''};
const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function filterEvents(events:Event[],filters:EventFiltersValue,translations:Record<string,string>){
 return events.filter(event=>(!filters.city||event.city===filters.city)&&(!filters.community||event.community===filters.community)&&normalize(eventSearchText(event,translations)).includes(normalize(filters.query)));
}

export function EventFilters({events,value,onChange,searchLabel='Buscar eventos',extraFields=[],onApply,onClear,contextKey,children}:{events:Event[];value:EventFiltersValue;onChange:(value:EventFiltersValue)=>void;searchLabel?:string;extraFields?:FilterField[];onApply?:(value:EventFiltersValue,extra:Record<string,string>)=>void;onClear?:()=>void;contextKey?:string;children?:ReactNode}){
 const cities=[...new Set([...events.map(event=>event.city),...(value.city?[value.city]:[])])].sort();
 const communities=[...new Set([...events.map(event=>event.community),...(value.community?[value.community]:[])])].sort();
 const fields:FilterField[]=[{id:'city',label:'Localidad',value:value.city,options:[{value:'',label:'Toda Galicia'},...cities.map(city=>({value:city,label:city}))]},{id:'community',label:'Comunidad',value:value.community,options:[{value:'',label:'Todas'},...communities.map(community=>({value:community,label:community}))]},...extraFields];
 return <CollectionTools query={value.query} onSearch={query=>onChange({...value,query})} searchLabel={searchLabel} fields={fields} onApply={values=>{const next={...value,city:values.city,community:values.community};if(onApply)onApply(next,values);else onChange(next);}} onClear={onClear??(()=>onChange(emptyEventFilters))} contextKey={contextKey}>{children}</CollectionTools>;
}
