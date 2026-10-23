import {redirect} from 'next/navigation';
import {calendarDay} from '@/lib/calendar';
import {SavedEvents} from '@/components/saved-events';
import {savedCollectionHref} from '@/lib/browse-navigation';
import {browseMetadata} from '@/lib/browse-metadata';
import type {PageSearchParams} from '@/lib/legacy-calendar';

export async function generateMetadata(){return browseMetadata('saved');}
export default async function Page({searchParams}:{searchParams:Promise<PageSearchParams>}){
 const params=await searchParams;
 if(params.vista||params.guardados||params.mes)redirect(savedCollectionHref({get:key=>typeof params[key]==='string'?params[key]:null}));
 return <SavedEvents today={calendarDay(new Date())}/>;
}
