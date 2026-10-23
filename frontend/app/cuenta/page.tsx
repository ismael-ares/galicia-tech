import { Account } from '@/components/account';
import {calendarDay} from '@/lib/calendar';
import {getRequestLocale} from '@/lib/request-locale';
export async function generateMetadata(){const locale=await getRequestLocale();return {title:'Galicia Tech · '+(locale==='gl'?'Os meus encontros':'Mis encuentros')};}
export default function Page(){return <Account today={calendarDay(new Date())}/>;}
