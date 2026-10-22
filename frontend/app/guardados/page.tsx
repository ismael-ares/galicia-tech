import { calendarDay } from '@/lib/calendar';
import { Agenda } from '@/components/agenda';
import {redirect} from 'next/navigation';
import {legacyCalendarHref,type PageSearchParams} from '@/lib/legacy-calendar';
export default async function Page({searchParams}:{searchParams:Promise<PageSearchParams>}){
 const legacy=legacyCalendarHref(await searchParams,true);
 if(legacy)redirect(legacy);
 return <Agenda savedOnly today={calendarDay(new Date())}/>;
}
