'use client';
import {useState} from 'react';
import {Check,LoaderCircle} from 'lucide-react';
import type {Event} from '@/lib/data';
import {useApp} from './shell';
import {useI18n} from './i18n';

export function AttendanceButton({event}:{event:Event}){
 const {user,attended,setAttendance,notify}=useApp();const {t,eventText}=useI18n();const [busy,setBusy]=useState(false);
 const checked=attended.includes(event.id);
 if(!user||(!checked&&new Date(event.start).getTime()>Date.now()))return null;
 async function change(){setBusy(true);try{await setAttendance(event.id,!checked);notify(t(checked?'Asistencia retirada.':'Encuentro añadido a tu historial.'));}catch(error){notify(t((error as Error).message));}finally{setBusy(false);}}
 return <button type="button" className={'attendance-button '+(checked?'is-attended':'')} aria-pressed={checked} aria-label={t(checked?'Desmarcar asistencia: ':'Marcar como asistido: ')+eventText(event.title)} onClick={change} disabled={busy}>
  {busy?<LoaderCircle size={15} className="attendance-spinner"/>:<Check size={15}/>}<span>{t(busy?'Guardando…':checked?'Asistido':'Marcar como asistido')}</span>
 </button>;
}
