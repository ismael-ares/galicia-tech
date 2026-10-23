export type BrowseParams={get:(key:string)=>string|null};
const sharedKeys=['guardados','q','ciudad','comunidad','mes'];

// Scope and content filters belong to the collection, not to its presentation.
export function browseHref(path:'/'|'/calendario',params:BrowseParams,savedOnly?:boolean){
 const query=new URLSearchParams();
 for(const key of sharedKeys){const value=params.get(key);if(value)query.set(key,value);}
 if(savedOnly!==undefined){if(savedOnly)query.set('guardados','1');else query.delete('guardados');}
 return path+(query.size?'?'+query.toString():'');
}
