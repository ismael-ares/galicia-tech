import {calendarDay} from '@/lib/calendar';
import {CalendarScreen} from '@/components/calendar-screen';
import {browseMetadata} from '@/lib/browse-metadata';
import {redirect} from 'next/navigation';
import {savedCollectionHref} from '@/lib/browse-navigation';
import type {PageSearchParams} from '@/lib/legacy-calendar';
export async function generateMetadata(){
 return browseMetadata('calendar');
}
export default async function Page({searchParams}:{searchParams:Promise<PageSearchParams>}){
 const params=await searchParams;
 if(params.guardados==='1')redirect(savedCollectionHref({get:key=>typeof params[key]==='string'?params[key]:null}));
 return <CalendarScreen today={calendarDay(new Date())}/>;
}
