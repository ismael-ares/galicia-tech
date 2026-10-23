'use client';
import Link from 'next/link';
import {useId,useState,type CSSProperties} from 'react';
import {ArrowUpRight,CalendarDays,ChevronLeft,ChevronRight,Info,MapPin,Ticket} from 'lucide-react';
import {eventDays} from '@/lib/calendar';
import {type Event} from '@/lib/data';
import {useApp} from './shell';
import {useI18n} from './i18n';
import {Poster,Save} from './catalog';
import {CommunityLogo} from './community-logo';
import {Disclosure} from './motion';

export function FeaturedEvents({today}:{today:string}){
 const {t,eventText,formatRange,formatDate}=useI18n();
 const {events:all,ranking,covers}=useApp().catalog;
 const [slide,setSlide]=useState(0),[explain,setExplain]=useState(false);
 const [direction,setDirection]=useState<'next'|'previous'>('next');
 const reasonId=useId();
 const upcoming=all.filter(event=>eventDays(event).end>=today).sort((a,b)=>new Date(a.start).getTime()-new Date(b.start).getTime());
 const ranked=[...new Set(ranking.map(item=>item.id))].map(id=>upcoming.find(event=>event.id===id)).filter((event):event is Event=>!!event);
 const featured=ranked.length?ranked:upcoming.slice(0,3);
 const position=slide%Math.max(featured.length,1),current=featured[position];
 if(!current)return null;
 const featuredCover=covers.find(cover=>cover.id===current.id)?.selected;
 const imageWidth=featuredCover?Math.min(320,Math.max(205,280*featuredCover.width/featuredCover.height)):260;
 const rail=featured.length>2?[featured[(position+1)%featured.length],featured[(position+2)%featured.length]]:[];
 const range=eventDays(current);
 function change(index:number){setDirection(index<position?'previous':'next');setSlide(index);}
 return <section className="featured-section" aria-labelledby="featured-heading" aria-roledescription={t('Carrusel de eventos')}>
  <div className="section-head"><h2 id="featured-heading"><span className="featured-heading-mark" aria-hidden="true"/><span>{t('Próximos destacados')}</span></h2><div className="carousel-tools"><span className="slide-count">{String(position+1).padStart(2,'0')}<span>/ {String(featured.length).padStart(2,'0')}</span></span>{featured.length>1&&<><button type="button" className="icon-button outlined" aria-label={t('Anterior destacado')} aria-controls="featured-current" onClick={()=>{setDirection('previous');setSlide((position+featured.length-1)%featured.length);}}><ChevronLeft size={18}/></button><button type="button" className="icon-button outlined" aria-label={t('Siguiente destacado')} aria-controls="featured-current" onClick={()=>{setDirection('next');setSlide((position+1)%featured.length);}}><ChevronRight size={18}/></button></>}</div></div>
  <div className={'featured-layout '+(rail.length?'has-rail':'')}>
   <article className="featured-card" id="featured-current" data-direction={direction} key={current.id}>
    <Link className="featured-image-link" style={{'--cover-width':imageWidth+'px'} as CSSProperties} href={'/evento/'+current.id} aria-label={t('Ver ')+eventText(current.title)}><Poster event={current} featured/></Link>
    <div className="featured-copy">
     <div className="featured-date"><CalendarDays size={14}/><time dateTime={current.start}>{formatRange(range.start+'T12:00:00Z',range.end+'T12:00:00Z',{weekday:'long',day:'numeric',month:'long'})}</time></div>
     <Link className="featured-title" href={'/evento/'+current.id}><h3>{eventText(current.title)}</h3></Link>
     <div className="featured-meta"><span><MapPin size={14}/>{current.city}</span><span><Ticket size={14}/>{t(/no indicado/i.test(current.price)?'Sin confirmar':current.price)}</span></div>
     <p className="featured-description">{eventText(current.description[0])}</p>
     <div className="featured-bottom"><Link href={'/evento/'+current.id} className="button primary">{t('Ver evento')}<ArrowUpRight size={16}/></Link><span className="featured-organizer" title={current.community}><CommunityLogo identity={current.community} size={17}/><span>{current.community}</span></span></div>
     <div className="featured-save"><Save event={current}/></div>
    </div>
   </article>
   {rail.length>0&&<aside className="featured-rail" aria-label={t('Otros destacados')}>{rail.map(event=><Link className="featured-preview" href={'/evento/'+event.id} key={event.id}>
    <div className="featured-preview-cover"><Poster event={event}/></div><span className="featured-preview-copy"><time dateTime={event.start}>{formatDate(event.start,{day:'numeric',month:'short'})}</time><strong>{eventText(event.title)}</strong><small>{event.city}</small></span><ArrowUpRight size={14} aria-hidden="true"/>
   </Link>)}</aside>}
  </div>
  <div className="featured-caption"><button type="button" onClick={()=>setExplain(!explain)} aria-expanded={explain} aria-controls={reasonId}><Info size={13}/>{t('¿Por qué estos eventos?')}</button><div className="dots" aria-label={t('Elegir destacado')}>{featured.map((event,index)=><button type="button" key={event.id} aria-label={t('Ver destacado ')+(index+1)} aria-pressed={position===index} onClick={()=>change(index)}/>)}</div><span className="featured-selection-label">{t('Selección de la agenda')}</span><span className="featured-live" role="status">{eventText(current.title)}</span></div>
  <Disclosure open={explain} id={reasonId}><div className="inline-note">{eventText(ranking.find(item=>item.id===current.id)?.reason??t('Selección por proximidad de fecha.'))}</div></Disclosure>
 </section>;
}
