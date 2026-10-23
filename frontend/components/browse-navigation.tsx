'use client';
import Link from 'next/link';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {Bookmark,CalendarDays,List,UserRound} from 'lucide-react';
import {browseHref} from '@/lib/browse-navigation';
import {useI18n} from './i18n';

export function BrowseNavigation({mobile=false}:{mobile?:boolean}){
 const {t}=useI18n();
 const pathname=usePathname(),params=useSearchParams();
 const view=pathname==='/'?'agenda':pathname==='/calendario'?'calendar':'other';
 return <nav className={mobile?'mobile-nav':'desktop-nav'} data-view={view} aria-label={t(mobile?'Navegación móvil':'Principal')}>
  <Link href={browseHref('/',params)} aria-current={pathname==='/'?'page':undefined} className={pathname==='/'?'active':''}><List size={mobile?20:18} strokeWidth={1.7} aria-hidden="true"/><span>{t('Agenda')}</span></Link>
  <Link href={browseHref('/calendario',params)} aria-current={pathname==='/calendario'?'page':undefined} className={pathname==='/calendario'?'active':''}><CalendarDays size={mobile?20:18} strokeWidth={1.7} aria-hidden="true"/><span>{t('Calendario')}</span></Link>
  {mobile&&<Link href="/cuenta" aria-current={pathname==='/cuenta'||pathname==='/login'||pathname.startsWith('/admin')?'page':undefined}><UserRound size={20}/><span>{t('Mi cuenta')}</span></Link>}
 </nav>;
}

export function SavedFilterButton({count}:{count:number}){
 const {t}=useI18n();
 const pathname=usePathname(),params=useSearchParams(),router=useRouter();
 const isBrowse=pathname==='/'||pathname==='/calendario';
 const active=isBrowse&&params.get('guardados')==='1';
 const target=browseHref(pathname==='/calendario'?'/calendario':'/',params,!active);
 function toggle(){
  if(isBrowse)window.history.pushState(null,'',target);
  else router.push(target);
  window.scrollTo({top:0,behavior:'instant'});
 }
 return <button type="button" className={'saved-filter-button '+(active?'is-active':'')} aria-label={t(active?'Mostrar todos los eventos':'Mostrar solo guardados')} title={t(active?'Mostrar todos los eventos':'Mostrar solo guardados')} aria-pressed={active} onClick={toggle}>
  <Bookmark size={17} strokeWidth={1.7} fill={active?'currentColor':'none'} aria-hidden="true"/><span>{t('Guardados')}</span><small>{count}</small>
 </button>;
}
