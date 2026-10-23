'use client';
import {useSearchParams} from 'next/navigation';
import type {EventFiltersValue} from './event-filters';

export function useBrowseFilters(){
 const params=useSearchParams();
 const filters={query:params.get('q')||'',city:params.get('ciudad')||'',community:params.get('comunidad')||''};
 function navigate(updates:Record<string,string|null>,replace=false){
  const url=new URL(window.location.href);
  for(const [key,value] of Object.entries(updates)){if(value)url.searchParams.set(key,value);else url.searchParams.delete(key);}
  if(url.pathname+url.search===window.location.pathname+window.location.search)return;
  window.history[replace?'replaceState':'pushState'](null,'',url.pathname+url.search);
 }
 function changeFilters(value:EventFiltersValue){navigate({q:value.query,ciudad:value.city,comunidad:value.community},true);}
 return {params,filters,navigate,changeFilters};
}
