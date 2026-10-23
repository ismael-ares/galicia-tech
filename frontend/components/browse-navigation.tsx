'use client';
import Link from 'next/link';
import {usePathname,useSearchParams} from 'next/navigation';
import {Bookmark,CalendarDays,List,UserRound} from 'lucide-react';
import {browseHref} from '@/lib/browse-navigation';
import {useI18n} from './i18n';
import {useApp} from './shell';

export function BrowseNavigation({mobile=false}:{mobile?:boolean}){
 const {t}=useI18n();
 const pathname=usePathname(),params=useSearchParams();
 const {favorites,catalog}=useApp();
 const count=catalog.events.filter(event=>favorites.includes(event.id)).length;
 const browseParams=pathname==='/'||pathname==='/calendario'?params:{get:()=>null};
 const view=pathname==='/'?'agenda':pathname==='/calendario'?'calendar':pathname==='/guardados'?'saved':'other';
 return <nav className={mobile?'mobile-nav':'desktop-nav'} data-view={view} aria-label={t(mobile?'Navegación móvil':'Principal')}>
  <Link href={browseHref('/',browseParams)} aria-current={pathname==='/'?'page':undefined} className={pathname==='/'?'active':''}><List size={mobile?20:18} strokeWidth={1.7} aria-hidden="true"/><span>{t('Agenda')}</span></Link>
  <Link href={browseHref('/calendario',browseParams)} aria-current={pathname==='/calendario'?'page':undefined} className={pathname==='/calendario'?'active':''}><CalendarDays size={mobile?20:18} strokeWidth={1.7} aria-hidden="true"/><span>{t('Calendario')}</span></Link>
  <Link href="/guardados" aria-current={pathname==='/guardados'?'page':undefined} className={pathname==='/guardados'?'active':''}><Bookmark size={mobile?20:18} strokeWidth={1.7} aria-hidden="true"/><span>{t('Guardados')}{mobile&&<small>{count}</small>}</span>{!mobile&&<small className="nav-count">{count}</small>}</Link>
  {mobile&&<Link href="/cuenta" aria-current={pathname==='/cuenta'||pathname==='/login'||pathname.startsWith('/admin')?'page':undefined}><UserRound size={20}/><span>{t('Mi cuenta')}</span></Link>}
 </nav>;
}
