import {calendarDay} from '@/lib/calendar';
import {CalendarScreen} from '@/components/calendar-screen';
import {browseMetadata} from '@/lib/browse-metadata';
import type {PageSearchParams} from '@/lib/legacy-calendar';
export async function generateMetadata({searchParams}:{searchParams:Promise<PageSearchParams>}){
 return browseMetadata('calendar',await searchParams);
}
export default function Page(){return <CalendarScreen today={calendarDay(new Date())}/>;}
