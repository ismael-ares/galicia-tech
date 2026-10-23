'use client';
import Link from 'next/link';
import {ArrowLeft,ArrowUpRight,Monitor,SlidersHorizontal} from 'lucide-react';
import {useI18n} from './i18n';
import {AccountPreferences} from './account-settings';

export function Preferences(){
 const {t}=useI18n();
 return <div className="preferences-page">
  <Link href="/" className="back-link"><ArrowLeft size={15}/>{t('Volver a la agenda')}</Link>
  <header className="preferences-heading"><div className="eyebrow"><SlidersHorizontal size={13}/>{t('Ajustes personales')}</div><h1>{t('Preferencias')}<span className="heading-dot">.</span></h1><p>{t('Elige cómo quieres ver Galicia Tech.')}</p></header>
  <AccountPreferences/>
  <div className="preferences-foot"><p><Monitor size={16}/>{t('Los cambios se aplican al momento y se recuerdan en este navegador.')}</p><Link href="/cuenta">{t('Ir a mis encuentros')}<ArrowUpRight size={15}/></Link></div>
 </div>;
}
