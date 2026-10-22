import { cookies, headers } from 'next/headers';
import { localeCookie, resolveLocale } from './locale';

export async function getRequestLocale(){
 const [cookieStore,requestHeaders]=await Promise.all([cookies(),headers()]);
 return resolveLocale(cookieStore.get(localeCookie)?.value,requestHeaders.get('accept-language')??'');
}
