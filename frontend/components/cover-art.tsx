import templates from '@/lib/cover-templates.json';
export const coverPatterns=templates.map(template=>template.id);
export function coverIdentity(id:string,templateId?:string){
 let hash=2166136261;for(const char of id)hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;
 const template=templates.find(t=>t.id===templateId)||templates[hash%templates.length];
 return {pattern:template.id,tone:template.tone,layout:template.layout};
}
export function CoverArt({pattern}:{pattern:string}){
 const template=templates.find(t=>t.id===pattern)||templates[0];
 return <svg viewBox="0 0 360 320" fill="none" aria-hidden="true" preserveAspectRatio="xMidYMid slice" dangerouslySetInnerHTML={{__html:'<g stroke="currentColor" stroke-width="1.8">'+template.artwork+'</g>'}}/>;
}
