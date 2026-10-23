export type BrowseParams={get:(key:string)=>string|null};
const sharedKeys=['q','ciudad','comunidad','mes'];

// Agenda and calendar share browsing filters; the saved collection is independent.
export function browseHref(path:'/'|'/calendario',params:BrowseParams){
 const query=new URLSearchParams();
 for(const key of sharedKeys){const value=params.get(key);if(value)query.set(key,value);}
 return path+(query.size?'?'+query.toString():'');
}

export function savedCollectionHref(params:BrowseParams){
 const query=new URLSearchParams();
 for(const key of ['q','ciudad','comunidad']){const value=params.get(key);if(value)query.set(key,value);}
 return '/guardados'+(query.size?'?'+query.toString():'');
}
