'use client';
import { useLayoutEffect, useRef, type RefObject } from 'react';

export const reducedMotion=()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function pressFeedback(element:HTMLElement){
 if(reducedMotion())return;
 element.animate([{transform:'scale(1)'},{transform:'scale(.91)',offset:.35},{transform:'scale(1)'}],{duration:220,easing:'cubic-bezier(.2,.8,.2,1)'});
}

// Reordena los elementos reales sin retrasar filtros, mantener duplicados ni bloquear clics.
export function useAnimatedList(ref:RefObject<HTMLElement|null>,signature:string){
 const previous=useRef(new Map<string,{top:number;left:number}>());
 useLayoutEffect(()=>{
  const elements=[...(ref.current?.querySelectorAll<HTMLElement>('[data-motion-item]')||[])];
  const next=new Map<string,{top:number;left:number}>();
  const measurements=elements.map(element=>{const rect=element.getBoundingClientRect();const position={top:rect.top+window.scrollY,left:rect.left+window.scrollX};next.set(element.dataset.motionItem!,position);return {element,position,old:previous.current.get(element.dataset.motionItem!)};});
  const animations:Animation[]=[];
  if(!reducedMotion())for(const [index,{element,position,old}] of measurements.entries()){
   if(element.contains(document.activeElement))continue;
   if(!old){animations.push(element.animate([{opacity:.25,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,delay:Math.min(index*22,110),easing:'cubic-bezier(.2,.8,.2,1)'}));}
   else{const y=old.top-position.top,x=old.left-position.left;if((Math.abs(y)>1||Math.abs(x)>1)&&Math.abs(y)<500)animations.push(element.animate([{transform:`translate(${x}px, ${y}px)`},{transform:'translate(0, 0)'}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'}));}
  }
  previous.current=next;
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const cancel=()=>{if(preference.matches)animations.forEach(a=>a.cancel());};preference.addEventListener('change',cancel);
  return()=>{preference.removeEventListener('change',cancel);animations.forEach(a=>a.cancel());};
 },[ref,signature]);
}

export function Disclosure({open,children,id}:{open:boolean;children:React.ReactNode;id?:string}){
 return <div className="motion-disclosure" data-open={open} aria-hidden={!open} id={id}><div className="motion-disclosure-clip" inert={!open}>{children}</div></div>;
}
