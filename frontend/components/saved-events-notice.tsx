'use client';
import {useState} from 'react';
import {ChevronDown,Cloud,CloudUpload,Monitor} from 'lucide-react';
import {useApp} from './shell';
import {useI18n} from './i18n';

export function SavedEventsNotice(){
 const {t}=useI18n();
 const {user,pendingGuestFavorites,importGuestFavorites,notify}=useApp();
 const [busy,setBusy]=useState(false);
 async function importSaved(){
  setBusy(true);
  try{await importGuestFavorites();notify(t('Guardados añadidos a tu cuenta.'));}
  catch(error){notify((error as Error).message);}
  finally{setBusy(false);}
 }
 return <aside className="saved-events-notice" aria-label={t('Dónde se guardan tus eventos')}>
  <details className="saved-storage"><summary>{user?<Cloud size={14}/>:<Monitor size={14}/>}<span>{t(user?'Guardados en tu cuenta':'Guardados en este navegador')}</span><ChevronDown size={12}/></summary>
   <p>{t(user?'Disponibles al iniciar sesión desde otros dispositivos.':'No necesitas iniciar sesión. Se eliminan si borras los datos de este sitio.')}</p>
  </details>
  {user&&pendingGuestFavorites.length>0&&<button className="button secondary" type="button" disabled={busy} onClick={importSaved}><CloudUpload size={16}/>{t(busy?'Añadiendo…':'Añadir guardados del navegador')}<span>({pendingGuestFavorites.length})</span></button>}
 </aside>;
}
