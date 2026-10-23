'use client';
import {Check,Github,Languages,Monitor,Moon,Sun} from 'lucide-react';
import {useI18n} from './i18n';
import {useApp} from './shell';

export function AccountPreferences(){
 const {t,locale,setLocale}=useI18n();const {appearance,setAppearance}=useApp();
 return <section className="personal-panel personal-preferences" aria-labelledby="personal-preferences-title">
  <div className="personal-section-title"><h2 id="personal-preferences-title">{t('A tu manera')}</h2><span><Monitor size={13}/>{t('Este navegador')}</span></div>
  <fieldset className="personal-preference"><legend><Languages size={16}/>{t('Idioma')}</legend><div className="personal-options">{(['gl','es'] as const).map(value=><label key={value}><input type="radio" name="account-language" value={value} checked={locale===value} onChange={()=>setLocale(value)}/><span><b aria-hidden="true">{value.toUpperCase()}</b>{value==='gl'?'Galego':'Castellano'}{locale===value&&<Check size={14} aria-hidden="true"/>}</span></label>)}</div></fieldset>
  <fieldset className="personal-preference"><legend><Sun size={16}/>{t('Apariencia')}</legend><div className="personal-options appearance-options">{(['light','dark'] as const).map(value=><label key={value}><input type="radio" name="account-appearance" value={value} checked={appearance===value} onChange={()=>setAppearance(value)}/><span>{value==='light'?<Sun size={16}/>:<Moon size={16}/>}<i className={'appearance-sample '+value} aria-hidden="true"><i/><i/><i/></i>{t(value==='light'?'Claro':'Oscuro')}{appearance===value&&<Check size={14} aria-hidden="true"/>}</span></label>)}</div></fieldset>
 </section>;
}


export function ConnectedProviders(){
 const {t}=useI18n();const {providers,csrfToken}=useApp();
 if(!providers.length)return null;
 return <section className="personal-panel personal-connections"><div className="personal-section-title"><h2>{t('Formas de entrar')}</h2></div><p>{t('Vincula una cuenta externa para usarla al iniciar sesión.')}</p><div className="social-buttons">{providers.map(provider=><form key={provider} method="post" action="/_allauth/browser/v1/auth/provider/redirect"><input type="hidden" name="csrfmiddlewaretoken" value={csrfToken}/><input type="hidden" name="provider" value={provider}/><input type="hidden" name="process" value="connect"/><input type="hidden" name="callback_url" value="/cuenta"/><button className="button secondary w-full" type="submit">{provider==='github'?<Github size={17}/>:<img src="/assets/login/google.png" alt="" width={17} height={17}/>} {t('Vincular')} {provider==='google'?'Google':'GitHub'}</button></form>)}</div></section>;
}
