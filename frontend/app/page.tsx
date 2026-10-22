import { calendarDay } from '@/lib/calendar';
import { Agenda } from '@/components/agenda';
import {redirect} from 'next/navigation';
import {legacyCalendarHref,type PageSearchParams} from '@/lib/legacy-calendar';
export default async function Page({searchParams}:{searchParams:Promise<PageSearchParams>}){
 const legacy=legacyCalendarHref(await searchParams);
 if(legacy)redirect(legacy);
 return <Agenda today={calendarDay(new Date())}/>;
}
