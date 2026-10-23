import {redirect} from 'next/navigation';
import {browseHref} from '@/lib/browse-navigation';
import {legacyCalendarHref,type PageSearchParams} from '@/lib/legacy-calendar';
export default async function Page({searchParams}:{searchParams:Promise<PageSearchParams>}){
 const params=await searchParams;
 const legacy=legacyCalendarHref(params,true);
 redirect(legacy||browseHref('/',{get:key=>typeof params[key]==='string'?params[key]:null},true));
}
