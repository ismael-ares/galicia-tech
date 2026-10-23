'use client';
import {useEffect,useId,useRef,useState,type ReactNode,type CSSProperties,type KeyboardEvent} from 'react';
import {createPortal} from 'react-dom';
import {Search,SlidersHorizontal,X} from 'lucide-react';
import {useI18n} from './i18n';

export type FilterField={id:string;label:string;value:string;defaultValue?:string;options:{value:string;label:string}[]};
export function FloatingPanel({title,anchor,onClose,children}:{title:string;anchor:HTMLElement;onClose:()=>void;children:ReactNode}){
 const {t}=useI18n(),id=useId();
 const ref=useRef<HTMLDialogElement>(null);
 function locate(){const bounds=anchor.getBoundingClientRect();return {'--panel-left':Math.max(16,Math.min(bounds.right-420,window.innerWidth-436))+'px','--panel-top':Math.max(16,Math.min(bounds.bottom+10,window.innerHeight-510))+'px'} as CSSProperties;}
 const [position,setPosition]=useState(locate);
 useEffect(()=>{
  const dialog=ref.current!,overflow=document.body.style.overflow;
  const resize=()=>setPosition(locate());window.addEventListener('resize',resize);
  dialog.showModal();document.body.style.overflow='hidden';
  dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
  return()=>{window.removeEventListener('resize',resize);dialog.close();document.body.style.overflow=overflow;if(anchor.isConnected)anchor.focus({preventScroll:true});};
 },[anchor]);
 function keyboard(event:KeyboardEvent<HTMLDialogElement>){
  if(event.key==='Escape'){event.preventDefault();event.stopPropagation();onClose();return;}
  if(event.key!=='Tab')return;
  const controls=[...event.currentTarget.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex]')].filter(node=>node.tabIndex>=0&&!node.matches(':disabled')&&node.getClientRects().length>0),first=controls[0],last=controls.at(-1);
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
 }
 return createPortal(<dialog ref={ref} className="collection-panel" style={position} aria-labelledby={id} onKeyDownCapture={keyboard} onCancel={event=>{event.preventDefault();onClose();}} onClick={event=>{if(event.target!==event.currentTarget)return;const box=event.currentTarget.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)onClose();}}>
  <header><h2 id={id}>{title}</h2><button type="button" className="icon-button" aria-label={t('Cerrar panel')} onClick={onClose}><X size={19}/></button></header>{children}
 </dialog>,document.body);
}

type Props={query:string;onSearch:(query:string)=>void;fields:FilterField[];onApply:(values:Record<string,string>)=>void;onClear:()=>void;searchLabel?:string;contextKey?:string;children?:ReactNode};
export function CollectionTools({query,onSearch,fields,onApply,onClear,searchLabel='Buscar eventos',contextKey='',children}:Props){
 const {t}=useI18n();
 const [panel,setPanel]=useState<'search'|'filters'|null>(null),[draftQuery,setDraftQuery]=useState(''),[draft,setDraft]=useState<Record<string,string>>({});
 const searchRef=useRef<HTMLButtonElement>(null),filterRef=useRef<HTMLButtonElement>(null);
 const signature=JSON.stringify([contextKey,query,fields.map(field=>[field.id,field.value])]);
 useEffect(()=>{setPanel(null);},[signature]);
 const active=fields.filter(field=>field.value!==(field.defaultValue??''));
 const summary=[...(query?[{id:'query',label:'«'+query+'»',remove:()=>onSearch('')}]:[]),...active.map(field=>({id:field.id,label:t(field.label)+': '+t(field.options.find(option=>option.value===field.value)?.label??field.value),remove:()=>onApply(Object.fromEntries(fields.map(item=>[item.id,item.id===field.id?(item.defaultValue??''):item.value])))}))];
 function open(kind:'search'|'filters'){setDraftQuery(query);setDraft(Object.fromEntries(fields.map(field=>[field.id,field.value])));setPanel(kind);}
 return <div className="collection-tools">
  <div className="collection-tools-head">{children}<div className="collection-actions">
   <button ref={searchRef} type="button" className="collection-search-trigger" data-active={!!query} aria-label={t('Abrir búsqueda')} aria-haspopup="dialog" aria-expanded={panel==='search'} onClick={()=>open('search')}><Search size={17}/><span>{t('Buscar')}</span>{!!query&&<i aria-hidden="true"/>}</button>
   <button ref={filterRef} type="button" className="collection-filter-trigger" data-active={!!active.length} aria-label={t('Abrir filtros')} aria-haspopup="dialog" aria-expanded={panel==='filters'} onClick={()=>open('filters')}><SlidersHorizontal size={17}/><span>{t('Filtros')}</span>{active.length>0&&<small>{active.length}</small>}</button>
  </div></div>
  {summary.length>0&&<div className="collection-summary" aria-label={t('Búsqueda y filtros activos')}><div>{summary.slice(0,3).map(item=><button className="collection-chip" type="button" key={item.id} title={item.label} aria-label={item.id==='query'?t('Borrar búsqueda'):t('Quitar filtro: ')+item.label} onClick={item.remove}><span>{item.label}</span><X size={12}/></button>)}{summary.length>3&&<button type="button" className="collection-chip" aria-label={t('Ver todos los filtros')} onClick={()=>open('filters')}>+{summary.length-3}</button>}</div><button className="collection-clear" type="button" onClick={onClear}>{t('Limpiar todo')}</button></div>}
  {panel&&<FloatingPanel title={t(panel==='search'?searchLabel:'Filtros')} anchor={(panel==='search'?searchRef:filterRef).current!} onClose={()=>setPanel(null)}>
   {panel==='search'?<form onSubmit={event=>{event.preventDefault();onSearch(draftQuery.trim());setPanel(null);}}><div className="collection-panel-fields"><label className="collection-query"><Search size={19}/><input type="search" data-autofocus aria-label={t(searchLabel)} placeholder={t('Escribe para buscar…')} value={draftQuery} onChange={event=>setDraftQuery(event.target.value)}/></label></div><footer><button type="button" className="text-action" onClick={()=>setDraftQuery('')}>{t('Borrar búsqueda')}</button><button type="submit" className="button primary">{t('Buscar')}<Search size={15}/></button></footer></form>:
   <form onSubmit={event=>{event.preventDefault();onApply(draft);setPanel(null);}}><div className="collection-panel-fields">{fields.map((field,index)=><label key={field.id}>{t(field.label)}<select data-autofocus={index===0?'':undefined} aria-label={t(field.label)} value={draft[field.id]??field.value} onChange={event=>setDraft({...draft,[field.id]:event.target.value})}>{field.options.map(option=><option value={option.value} key={option.value}>{t(option.label)}</option>)}</select></label>)}</div><footer><button type="button" className="text-action" onClick={()=>setDraft(Object.fromEntries(fields.map(field=>[field.id,field.defaultValue??''])))}>{t('Restablecer')}</button><button type="submit" className="button primary">{t('Aplicar filtros')}</button></footer></form>}
  </FloatingPanel>}
 </div>;
}
