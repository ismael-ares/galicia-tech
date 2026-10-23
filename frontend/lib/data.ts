export type Event = {
 id:string; title:string; start:string; end:string|null; dateLabel:string; timeLabel:string;
 city:string; community:string; place:string; price:string; requirements:string; statusNote:string;
 cardNote?:string; description:string[]; sourceIds?:string[];
 sources:{label:string;url:string}[]; registration:{label:string;url:string}|null;
};
export type Source={id:string;name:string;url:string;city:string;platform:string;enabled:boolean;managed?:boolean;checkedAt?:string|null;lastError?:string};
export type Decision={status:'approved'|'pending'|'discarded';value?:string;note?:string};
export type ReviewCase={id:string;eventId:string;title:string;summary:string;type:string;version:number;decision:Decision;
 field:{kind:'url'|'choice'|'confirmation';label:string;options?:{value:string;label:string}[]};
 evidence:{label:string;value:string;detail:string;url:string}[]};
export type Cover={id:string;selected:{url:string;width:number;height:number}|null};
export type Catalog={events:Event[];sources:Source[];covers:Cover[];ranking:{id:string;reason:string}[];translations:Record<string,string>;sample:boolean};
export type User={id:string;name:string;email:string;role:'user'|'admin';mfaEnabled:boolean};
export type ProcessingConfig={authority:'web'|'yaml';retrieval:string;frequency:string;budget:string;version:number;paidCallsEnabled:boolean;warning?:string;file:string;profile:string;revision:string;fileStatus:'active'|'pending'|'invalid';sourceCount:number;yaml:string;validationError?:string;access:{registration:boolean;local_test_accounts:boolean;require_admin_mfa:boolean;session_idle_minutes:number;session_max_hours:number;auth_attempts:number;auth_window_seconds:number;social_providers:string[]};collection:{enabled:boolean;weekdays:number[];min_interval_hours:number;scheduler_minutes:number;source_deadline_seconds:number;max_details:number;max_events:number};fetch:{allowed_hosts:string[];max_bytes:number;max_redirects:number;connect_timeout_seconds:number;read_timeout_seconds:number}};
export const day=(value:string)=>new Intl.DateTimeFormat('es-ES',{day:'2-digit',timeZone:'Europe/Madrid'}).format(new Date(value));
export const month=(value:string)=>new Intl.DateTimeFormat('es-ES',{month:'short',timeZone:'Europe/Madrid'}).format(new Date(value)).replace('.','');
export function topic(event:Event){
 if(/flutter/i.test(event.title))return 'Desarrollo móvil';
 if(/hacktober/i.test(event.title))return 'Open source';
 if(/wordpress/i.test(event.community))return 'Comunidad';
 if(/devfest/i.test(event.title))return 'Conferencia';
 if(/\bia\b|\bai\b|coding/i.test(event.title))return 'Inteligencia artificial';
 return 'Tecnología';
}
