'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { Languages } from 'lucide-react';
import {usePathname,useSearchParams} from 'next/navigation';
import { type Locale, localeCookie } from '@/lib/locale';
import galician from '@/lib/messages/gl.json';
import { localDate, localDateRange } from '@/lib/date-format';
import { useApp } from './shell';

const messages:Record<string,string>=galician;
const Context=createContext({locale:'gl' as Locale,setLocale:(_:Locale)=>{}});

export function LocaleProvider({initialLocale,children}:{initialLocale:Locale;children:React.ReactNode}){
 const [locale,setLocale]=useState(initialLocale);
 const pathname=usePathname();
 const params=useSearchParams();
 const savedOnly=(pathname==='/'||pathname==='/calendario')&&params.get('guardados')==='1';
 useEffect(()=>{
  document.documentElement.lang=locale;
  const section=pathname==='/calendario'?'Calendario':pathname==='/guardados'?(locale==='gl'?'Gardados':'Guardados'):(locale==='gl'?'Axenda':'Agenda');
  document.title='Galicia Tech · '+(savedOnly?(locale==='gl'?'Gardados':'Guardados')+' · ':'')+section;
 },[locale,pathname,savedOnly]);
 function select(value:Locale){
  setLocale(value);
  document.documentElement.lang=value;
  document.cookie=`${localeCookie}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;
 }
 return <Context.Provider value={{locale,setLocale:select}}>{children}</Context.Provider>;
}

export function useI18n(){
 const {locale,setLocale}=useContext(Context);
 const {catalog}=useApp();
 const t=(message:string)=>locale==='gl'?(messages[message]??message):message;
 const eventText=(text:string)=>locale==='gl'?(catalog.translations[text]??text):text;
 const intlLocale=locale==='gl'?'gl-ES':'es-ES';
 const formatDate=(value:string,options:Intl.DateTimeFormatOptions={weekday:'long',day:'numeric',month:'long',year:'numeric'})=>localDate(locale,value,options);
 const formatRange=(start:string,end:string,options:Intl.DateTimeFormatOptions={day:'numeric',month:'short',year:'numeric'})=>localDateRange(locale,start,end,options);
 return {locale,setLocale,t,eventText,intlLocale,formatDate,formatRange};
}

export function LanguageSwitch(){
 const {locale,setLocale,t}=useI18n();
 const action=locale==='gl'?'Cambiar a castelán':'Cambiar a galego';
 return <button className="icon-button language-button" type="button" onClick={()=>setLocale(locale==='gl'?'es':'gl')} aria-label={action} title={t('Idioma')+': '+(locale==='gl'?'Galego':'Castellano')+'. '+action}>
  <Languages size={18}/><span className="language-code" aria-hidden="true">{locale.toUpperCase()}</span>
 </button>;
}
