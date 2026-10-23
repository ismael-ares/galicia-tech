import { calendarDay } from '@/lib/calendar';
import { Agenda } from '@/components/agenda';
import {redirect} from 'next/navigation';
import {legacyCalendarHref,type PageSearchParams} from '@/lib/legacy-calendar';
import {browseMetadata} from '@/lib/browse-metadata';
export async function generateMetadata({searchParams}:{searchParams:Promise<PageSearchParams>}){
 return browseMetadata('agenda',await searchParams);
}
export default async function Page({searchParams}:{searchParams:Promise<PageSearchParams>}){
 const legacy=legacyCalendarHref(await searchParams);
 if(legacy)redirect(legacy);
 return <Agenda today={calendarDay(new Date())}/>;
}
