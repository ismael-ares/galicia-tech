'use client';
import Link from 'next/link';
import {useState,type CSSProperties} from 'react';
import {CalendarDays,ChevronLeft,ChevronRight,Info,MapPin,Users,ArrowUpRight} from 'lucide-react';
import {type Event,topic} from '@/lib/data';
import {useApp} from './shell';
import {useI18n} from './i18n';
import {Poster,Save} from './catalog';
import {Disclosure} from './motion';

export function FeaturedEvents(){
 const {t,eventText,formatRange}=useI18n();
 const {events:all,ranking,covers}=useApp().catalog;
 const [slide,setSlide]=useState(0),[explain,setExplain]=useState(false);
 const [direction,setDirection]=useState<'next'|'previous'>('next');
 const featured=ranking.map(r=>all.find(e=>e.id===r.id)).filter((e):e is Event=>!!e);
 const current=featured[slide%Math.max(featured.length,1)];
 const featuredCover=covers.find(c=>c.id===current?.id)?.selected;
 const imageWidth=featuredCover?Math.min(480,Math.max(245,350*featuredCover.width/featuredCover.height)):350;
 return <>{current&&<section className="featured-section" aria-labelledby="featured-heading"><div className="section-head"><h2 id="featured-heading"><span className="sparkle">✳</span> {t("Próximos destacados")}</h2><div className="carousel-tools"><span className="slide-count">0{slide%featured.length+1} <span>/ 0{featured.length}</span></span><button className="icon-button outlined" aria-label={t("Anterior destacado")} onClick={()=>{setDirection('previous');setSlide((slide+featured.length-1)%featured.length);}}><ChevronLeft size={18}/></button><button className="icon-button outlined" aria-label={t("Siguiente destacado")} onClick={()=>{setDirection('next');setSlide((slide+1)%featured.length);}}><ChevronRight size={18}/></button></div></div>
 <div className="featured-card" data-direction={direction} key={current.id}><Link className="featured-image-link" style={{'--cover-width':imageWidth+'px'} as CSSProperties} href={'/evento/'+current.id} aria-label={t("Ver ")+eventText(current.title)}><Poster event={current} featured/></Link><div className="featured-copy"><div className="flex items-center justify-between gap-3"><span className="pill filled"><span className="status-dot"/>{t(topic(current))}</span><Save event={current}/></div><div className="featured-date"><CalendarDays size={15}/>{formatRange(current.start,current.end??current.start,{weekday:"long",day:"numeric",month:"long"})}</div><Link href={'/evento/'+current.id}><h3>{eventText(current.title)}</h3></Link><div className="featured-meta"><span><MapPin size={15}/>{current.city}</span><span><Users size={15}/>{current.community}</span></div><p className="featured-description">{eventText(current.description[0])}</p><div className="featured-bottom"><Link href={'/evento/'+current.id} className="button primary">{t("Ver evento")} <ArrowUpRight size={17}/></Link><span className="price-tag">{t(current.price)}</span></div></div></div>
 <div className="featured-caption"><button onClick={()=>setExplain(!explain)} aria-expanded={explain}><Info size={13}/>{t("¿Por qué estos eventos?")}</button><div className="dots">{featured.map((e,i)=><button key={e.id} aria-label={t("Ver destacado ")+(i+1)} aria-pressed={slide%featured.length===i} onClick={()=>{setDirection(i<slide%featured.length?'previous':'next');setSlide(i);}}/>)}</div><span>{t("Selección editorial")}</span></div><Disclosure open={explain}><div className="inline-note">{eventText(ranking.find(r=>r.id===current.id)?.reason??'')} {t("Selección por proximidad de fecha. La priorización con LLM aún no está activada.")}</div></Disclosure>
 </section>}
</>;
}
