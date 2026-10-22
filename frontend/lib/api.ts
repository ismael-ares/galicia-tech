export class ApiError extends Error{
 constructor(public status:number,public payload:Record<string,unknown>){
  const detail=typeof payload.detail==='string'?payload.detail:undefined;
  const errors=Array.isArray(payload.errors)?payload.errors:[];
  super(detail||errors[0]?.message||'No se ha podido completar la operación.');
 }
}
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 const method=options.method||'GET';
 const headers=new Headers(options.headers);
 if(options.body)headers.set('Content-Type','application/json');
 if(!['GET','HEAD','OPTIONS'].includes(method)){
  const csrf=document.cookie.split('; ').find(c=>c.startsWith('csrftoken='))?.slice('csrftoken='.length);
  if(csrf)headers.set('X-CSRFToken',decodeURIComponent(csrf));
 }
 const response=await fetch(path,{...options,headers,credentials:'same-origin',cache:'no-store'});
 if(response.status===204)return undefined as T;
 const body=await response.json().catch(()=>({detail:'El servidor no está disponible.'}));
 if(!response.ok)throw new ApiError(response.status,body);
 return body as T;
}
