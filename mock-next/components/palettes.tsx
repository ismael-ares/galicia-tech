'use client';
import { useI18n } from './i18n';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { EncounterRow } from './catalog';
import { events } from '@/lib/data';
const variants=[
 {id:'copper',name:'Grafito y cobre',description:'Cálida y editorial. Blanco roto en claro; carbón con acentos cobre en oscuro.',colors:['#f6f4f0','#292724','#9a512b','#e5ae86']},
 {id:'petrol',name:'Neutro y petróleo',description:'Más orgánica y discreta. Grises suaves con verde profundo y salvia.',colors:['#f4f5f3','#26312e','#326758','#aed1bf']},
 {id:'ink',name:'Pizarra y tinta',description:'Sobria y técnica. Blanco y grafito con un azul grisáceo contenido.',colors:['#f6f7f9','#242b35','#34597c','#afc7e4']}
] as const;
type Palette=typeof variants[number]['id'];
export function Palettes(){const {t}=useI18n();
 const [selected,setSelected]=useState<Palette>('ink');const [ready,setReady]=useState(false);
 function apply(value:Palette){document.documentElement.dataset.palette=value;setSelected(value);try{localStorage.setItem('galicia-tech-demo-palette-v2',value)}catch{}}
 useEffect(()=>{let saved:string|null=null;try{saved=localStorage.getItem('galicia-tech-demo-palette-v2')}catch{}apply(variants.some(v=>v.id===saved)?saved as Palette:'ink');setReady(true)},[]);
 return <><div className="page-heading"><div><div className="eyebrow">{t("Estudio de color · Solo en el mock")}</div><h1>{t("Probemos el color")}<span className="heading-dot">.</span></h1><p>{t("Tres direcciones sobre el mismo diseño. Usa el botón de sol o luna para compararlas en ambos modos.")}</p></div></div>
 <div className="palette-options" role="group" aria-label={t("Paleta de la muestra")}>{variants.map(v=><button key={v.id} className="palette-option" aria-pressed={ready&&selected===v.id} onClick={()=>apply(v.id)}><span className="palette-colors" aria-hidden="true">{v.colors.map(c=><i key={c} style={{background:c}}/>)}</span><span><strong>{t(v.name)}</strong><small>{t(v.description)}</small></span><span className="palette-option-label">{ready&&selected===v.id?<><Check size={14}/>{t("Aplicada a la muestra")}</>:t("Probar esta paleta")}</span></button>)}</div>
 <section className="encounters-view palette-preview" aria-labelledby="palette-preview-title"><div className="palette-preview-heading"><div><h2 id="palette-preview-title">{t(variants.find(v=>v.id===selected)?.name??'')}</h2><p>{t("La selección se conserva al navegar por la agenda.")}</p></div><Link href="/#events-heading" className="button primary">{t("Ver en toda la agenda")} <ArrowRight size={16}/></Link></div><div className="encounter-group-cards">{['extreme-ai-engineering','santiago'].map(id=>events.find(e=>e.id===id)).filter(e=>!!e).map(e=><EncounterRow key={e.id} event={e}/>)}</div></section></>;
}
