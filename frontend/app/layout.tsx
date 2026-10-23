import type { Metadata } from 'next';
import { AppShell } from '@/components/shell';
import { LocaleProvider } from '@/components/i18n';
import { getRequestLocale } from '@/lib/request-locale';
import './globals.css';
import './encounters.css';
import './contrast.css';
import './palettes.css';
import './motion.css';
import './card-facts.css';
import './cover-variants.css';
import './encounter-redesign.css';
import './language.css';
import './calendar.css';
import './application.css';
import './navigation.css';
import './saved.css';
export async function generateMetadata():Promise<Metadata>{
 const locale=await getRequestLocale();
 return {title:locale==='gl'?'Galicia Tech · Axenda':'Galicia Tech · Agenda',description:locale==='gl'?'Axenda de encontros tecnolóxicos en Galicia. Comunidades e eventos de Galicia.':'Agenda de encuentros tecnológicos en Galicia. Comunidades e eventos de Galicia.',icons:{icon:'/icon.svg?v=pizarra-tinta-20261021'}};
}
const themeScript = `(function(){try{var t=localStorage.getItem('galicia-tech-theme');document.documentElement.dataset.theme=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light';var p=localStorage.getItem('galicia-tech-demo-palette-v2');if(['copper','petrol','ink'].includes(p))document.documentElement.dataset.palette=p}catch{}})()`;
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale=await getRequestLocale();
  return <html lang={locale} data-palette="ink" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html: themeScript}} /></head><body><LocaleProvider initialLocale={locale}><AppShell>{children}</AppShell></LocaleProvider></body></html>;
}
