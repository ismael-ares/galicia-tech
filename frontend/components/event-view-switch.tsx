'use client';
import { CalendarDays, List } from 'lucide-react';
import { useI18n } from './i18n';

export type EventView='agenda'|'calendar';
export function EventViewSwitch({view,onChange}:{view:EventView;onChange:(view:EventView)=>void}){
 const {t}=useI18n();
 return <div className="event-view-switch" role="group" aria-label={t('Vista de los encuentros')}>
  <button type="button" aria-pressed={view==='agenda'} onClick={()=>onChange('agenda')}><List size={16}/>{t('Agenda')}</button>
  <button type="button" aria-pressed={view==='calendar'} onClick={()=>onChange('calendar')}><CalendarDays size={16}/>{t('Calendario')}</button>
 </div>;
}
