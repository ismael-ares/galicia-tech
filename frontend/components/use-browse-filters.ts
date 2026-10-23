'use client';
import {usePathname,useSearchParams} from 'next/navigation';
import {browseHref} from '@/lib/browse-navigation';
import type {EventFiltersValue} from './event-filters';

export function useBrowseFilters(){
 const pathname=usePathname(),params=useSearchParams();
 const savedOnly=params.get('guardados')==='1';
 const filters={query:params.get('q')||'',city:params.get('ciudad')||'',community:params.get('comunidad')||''};
 function navigate(updates:Record<string,string|null>,replace=false){
  const url=new URL(window.location.href);
  for(const [key,value] of Object.entries(updates)){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}
  if(url.pathname+url.search===window.location.pathname+window.location.search)return;
  window.history[replace?'replaceState':'pushState'](null,'',url.pathname+url.search);
 }
 function changeFilters(value:EventFiltersValue){navigate({q:value.query,ciudad:value.city,comunidad:value.community},true);}
 return {params,savedOnly,filters,navigate,changeFilters,allEventsHref:browseHref(pathname==='/calendario'?'/calendario':'/',params,false)};
}
