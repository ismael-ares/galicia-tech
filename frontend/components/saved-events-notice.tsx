'use client';
import Link from 'next/link';
import {useState} from 'react';
import {Bookmark,CloudUpload} from 'lucide-react';
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
  <Bookmark size={19} aria-hidden="true"/>
  <div><strong>{t(user?'Guardados en tu cuenta':'Guardados en este navegador')}</strong>
   <p>{t(user?'Disponibles al iniciar sesión desde otros dispositivos.':'No necesitas iniciar sesión. Se eliminan si borras los datos de este sitio.')}</p>
  </div>
  {user?pendingGuestFavorites.length>0&&<button className="button secondary" type="button" disabled={busy} onClick={importSaved}><CloudUpload size={16}/>{t(busy?'Añadiendo…':'Añadir guardados del navegador')}<span>({pendingGuestFavorites.length})</span></button>:<Link href="/login" className="text-action">{t('Iniciar sesión para sincronizar')}</Link>}
 </aside>;
}
