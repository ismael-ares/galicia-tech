export type Locale = 'gl' | 'es';
export const localeCookie = 'galicia-tech-locale';
export const defaultLocale: Locale = 'gl';

export function supportedLocale(value?: string | null): Locale | undefined {
 const language=value?.trim().toLowerCase().split(/[-_]/)[0];
 return language==='gl'||language==='es'?language:undefined;
}

// Respect preference order and q weights, including regional browser languages.
export function resolveLocale(saved?: string | null, acceptLanguage=''): Locale {
 if(saved==='gl'||saved==='es')return saved;
 const preferences=acceptLanguage.split(',').map((part,index)=>{
  const [language,...parameters]=part.trim().split(';');
  const quality=parameters.find(p=>p.trim().startsWith('q='));
  const weight=quality?Number(quality.trim().slice(2)):1;
  return {language,index,weight};
 }).filter(p=>Number.isFinite(p.weight)&&p.weight>0&&p.weight<=1)
 .sort((a,b)=>b.weight-a.weight||a.index-b.index);
 for(const preference of preferences){const locale=supportedLocale(preference.language);if(locale)return locale;}
 return defaultLocale;
}
