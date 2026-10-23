import {Register} from '@/components/account';
import {getRequestLocale} from '@/lib/request-locale';
export async function generateMetadata(){return {title:'Galicia Tech · '+((await getRequestLocale())==='gl'?'Crear conta':'Crear cuenta')};}
export default function Page(){return <Register/>;}
