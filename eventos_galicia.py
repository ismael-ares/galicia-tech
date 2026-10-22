#!/usr/bin/env python3
"""Recopilador manual y local de páginas públicas tech de Galicia."""
import argparse, datetime as dt, hashlib, html, json, re, time, unicodedata
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

TZ = ZoneInfo('Europe/Madrid')
HEADERS = {'User-Agent':'EventosGaliciaLocal/0.1 (manual public-page reader)', 'Accept':'text/html,application/xhtml+xml'}
TIMEOUT, RETRIES = 18, 2
SOURCES = {
 'GDG A Coruña':'https://gdg.community.dev/gdg-a-coruna/',
 'GDG Ourense':'https://gdg.community.dev/gdg-ourense/',
 'GDG Santiago de Compostela':'https://gdg.community.dev/gdg-santiago-de-compostela/',
 'WordPress Coruña':'https://www.meetup.com/wordpresscoruna/'
}
class FetchError(Exception): pass

def fetch(url):
 last = None
 for attempt in range(RETRIES+1):
  try:
   req=Request(url,headers=HEADERS)
   with urlopen(req,timeout=TIMEOUT) as r:
    raw=r.read(8_000_001)
    if len(raw)>8_000_000: raise FetchError('respuesta mayor de 8 MB')
    return raw.decode(r.headers.get_content_charset() or 'utf-8','replace'),r.geturl()
  except (HTTPError,URLError,TimeoutError,OSError,FetchError) as e:
   last=e
   if attempt<RETRIES: time.sleep(.4*(attempt+1))
 raise FetchError(f'{type(last).__name__}: {last}')

def next_data(doc):
 m=re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>',doc,re.S)
 if not m: return None
 try:return json.loads(m.group(1))
 except json.JSONDecodeError:return None

def jsonlds(doc):
 out=[]
 for raw in re.findall(r'<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',doc,re.I|re.S):
  try:out.append(json.loads(html.unescape(raw)))
  except (json.JSONDecodeError,TypeError):pass
 return out

def events_in(x):
 if isinstance(x,dict):
  if x.get('@type')=='Event':yield x
  for y in x.values():yield from events_in(y)
 elif isinstance(x,list):
  for y in x:yield from events_in(y)

def parsed(value):
 if not value:return None
 try:
  d=dt.datetime.fromisoformat(value.replace('Z','+00:00'))
  return d if d.tzinfo else None
 except (ValueError,TypeError):return None

def local_iso(value):
 d=parsed(value)
 return d.astimezone(TZ).isoformat(timespec='seconds') if d else None

def text(x):return re.sub(r'\s+',' ',html.unescape(str(x or ''))).strip()

def price(offers):
 offers=offers if isinstance(offers,list) else [offers]
 vals=[]
 for o in offers:
  if isinstance(o,dict) and 'price' in o:
   p=str(o['price']); vals.append('Gratis' if p in ('0','0.0','0.00') else (p+' '+o['priceCurrency'] if o.get('priceCurrency') else p))
 return vals[0] if vals and len(set(vals))==1 else ('Ofertas con precios distintos; revisar ficha' if vals else None)

def notes(description):
 out=[]
 if re.search(r'USC students|estudiantes de la USC|estudantes da USC|todos os estudantes da USC',description,re.I):out.append('La fuente limita el acceso a estudiantes de la USC; revisar los detalles específicos de elegibilidad descritos por la organización.')
 months='January|February|March|April|May|June|July|August|September|October|November|December|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre'
 deadline=re.search(r'(?:by|before|antes del|antes de|até)\s+((?:'+months+r')\s+\d{1,2}(?:,?\s+\d{4})?|\d{1,2}\s+de\s+(?:'+months+r'))',description,re.I)
 if deadline:out.append('Plazo publicado: '+deadline.group(1).strip()+'.')
 return out

def canonical(url):
 if not url:return ''
 p=urlparse(url);return p._replace(query='',fragment='').geturl().rstrip('/')

def normalize_event(node,community,source_url,observed):
 loc=node.get('location') if isinstance(node.get('location'),dict) else {}
 addr=loc.get('address') if isinstance(loc.get('address'),dict) else {}
 place=', '.join(dict.fromkeys(str(x).strip() for x in (loc.get('name'),addr.get('streetAddress'),addr.get('addressLocality')) if x and str(x).strip())) or None
 offers=node.get('offers'); ol=offers if isinstance(offers,list) else [offers]
 reg=next((o.get('url') for o in ol if isinstance(o,dict) and o.get('url')),None)
 desc=text(node.get('description'))[:1000]
 attendance=str(node.get('eventAttendanceMode') or '')
 mode='Presencial' if attendance.endswith('OfflineEventAttendanceMode') else ('En línea' if attendance.endswith('OnlineEventAttendanceMode') else ('Híbrido' if attendance.endswith('MixedEventAttendanceMode') else None))
 ev={'name':node.get('name'),'start':local_iso(node.get('startDate')),'end':local_iso(node.get('endDate')),
  'location':place,'mode':mode,'community':community,'description':desc or None,
  'source_url':node.get('url') or source_url,'source_page':source_url,'registration_url':reg,'price':price(offers),
  'requirements':notes(desc),'source_urls':[node.get('url') or source_url],'source_refs':[{'community':community,'url':node.get('url') or source_url}],'sources':[community],'status':node.get('eventStatus'),'observed_at':observed}
 ev['source_url']=canonical(ev['source_url'])
 ev['source_urls']=[ev['source_url']]
 ev['id']=hashlib.sha256((ev['source_url'] or f"{community}|{ev['name']}|{ev['start']}").encode()).hexdigest()[:20]
 return ev

def classify(e,as_of):
 missing=[k for k in ('name','start','location','community','source_url') if not e.get(k)]
 if missing:e['classification']='requires_review';e['review_reasons']=['Faltan campos básicos: '+', '.join(missing)];return
 end=parsed(e.get('end')) or parsed(e.get('start'))
 e['review_reasons']=list(e.get('review_reasons',[]))
 status=str(e.get('status') or '')
 if 'EventCancelled' in status:
  e['classification']='cancelled';e['review_reasons'].append('La fuente marca explícitamente el evento como cancelado.')
 elif e.get('registration_state') in ('invalid_mismatch','not_verified') or e.get('possible_duplicate') or e.get('review_reasons'):
  e['classification']='requires_review'
 elif end.astimezone(TZ).date()<as_of:e['classification']='past'
 else:e['classification']='publishable'

def gdg(community,url,observed):
 doc,final=fetch(url);state=next_data(doc)
 data=state.get('props',{}).get('pageProps',{}).get('prerenderData') if state else None
 listing=data.get('upcomingEvents') if isinstance(data,dict) else None
 if not isinstance(listing,dict) or not isinstance(listing.get('results'),list):raise FetchError('estructura upcomingEvents/results de GDG ausente o cambió')
 result=[];errors=[]
 if listing.get('next'):errors.append({'url':url,'error':'hay otra página de resultados GDG no recorrida; captura parcial'})
 for item in listing['results']:
  detail_url=item.get('url') or item.get('cohost_registration_url')
  if not detail_url:continue
  try:
   d,final_d=fetch(detail_url);nodes=[n for j in jsonlds(d) for n in events_in(j)]
   if not nodes:raise FetchError('ficha sin JSON-LD Event')
   e=normalize_event(nodes[0],community,final_d,observed)
   e['listing_url']=detail_url
   title=text(e.get('name')).lower()
   whole=text(re.sub(r'<[^>]+>',' ',d))
   e['requirements']=notes(whole)
   reg=e.get('registration_url')
   if reg and (urlparse(reg).netloc.endswith('meetup.com') or urlparse(reg).netloc.endswith('meetu.ps')):
    try:
     rd,final_r=fetch(reg); rn=[n for j in jsonlds(rd) for n in events_in(j)]
     start=parsed(e.get('start')); date=start.astimezone(TZ).date() if start else None
     candidates=[(n,parsed(n.get('startDate'))) for n in rn if parsed(n.get('startDate'))]
     same_date=[n for n,d in candidates if d.astimezone(TZ).date()==date]
     matching=any(text(n.get('name')).casefold()==text(e.get('name')).casefold() for n in same_date)
     if matching:e['registration_url']=final_r;e['registration_state']='verified_matching_event'
     elif candidates and not same_date:
      e['registration_candidate_url']=reg;e['registration_url']=None;e['registration_state']='invalid_mismatch';e['registration_note']='El enlace lleva a otra fecha; no se ofrece como inscripción vigente.';e.setdefault('review_reasons',[]).append('Enlace de inscripción con fecha distinta a la del evento.')
     else:
      e['registration_candidate_url']=reg;e['registration_url']=None;e['registration_state']='not_verified';e['registration_note']='No se pudo confirmar que el destino corresponde al mismo evento.';e.setdefault('review_reasons',[]).append('No se pudo verificar identidad del enlace de inscripción.')
    except FetchError as x:e['registration_candidate_url']=reg;e['registration_url']=None;e['registration_state']='not_verified';e['registration_note']=str(x);e.setdefault('review_reasons',[]).append('No se pudo verificar el destino de inscripción.')
   elif reg and reg.rstrip('/')==detail_url.rstrip('/'):e['registration_state']='integrated_on_source_page'
   elif reg:e['registration_state']='source_offer_url'
   else:e['registration_state']='not_listed'
   result.append(e)
  except FetchError as x:errors.append({'url':detail_url,'error':str(x)})
 return result,errors

class Links(HTMLParser):
 def __init__(self):super().__init__();self.items=[]
 def handle_starttag(self,tag,attrs):
  h=dict(attrs).get('href')
  if tag=='a' and h:self.items.append(h)

def meetup(community,url,observed):
 doc,final=fetch(url);links=Links();links.feed(doc);urls=[]
 for h in links.items:
  x=urljoin(final,h)
  if re.search(r'meetup\.com/[^/]+/events/\d+',x) and x not in urls:urls.append(x)
 upcoming=[u for u in urls if 'eventOrigin=group_upcoming_events' in u]
 past=[u for u in urls if 'eventOrigin=group_past_events' in u]
 selected=upcoming + (past[:1] if past else [])
 if not upcoming and not past and not re.search(r'Upcoming events|Past events',text(re.sub(r'<[^>]+>',' ',doc)),re.I):raise FetchError('página Meetup sin eventos ni marcadores reconocibles de sección')
 result=[];errors=[]
 for u in selected:
  try:
   d,fd=fetch(u);nodes=[n for j in jsonlds(d) for n in events_in(j)]
   if not nodes:raise FetchError('ficha sin JSON-LD Event')
   event=normalize_event(nodes[0],community,fd,observed)
   event['listing_section']='upcoming' if 'eventOrigin=group_upcoming_events' in u else 'past'
   result.append(event)
  except FetchError as x:errors.append({'url':u,'error':str(x)})
 return result,errors,{'upcoming_links':len(upcoming),'past_links':len(past),'past_sample_count':min(1,len(past)),'capture_complete':not errors}

def fingerprint(e):return json.dumps({k:v for k,v in e.items() if k not in ('observed_at','change','change_details')},ensure_ascii=False,sort_keys=True)

def normalize_title(value):
 value=unicodedata.normalize('NFKD',text(value).casefold())
 return re.sub(r'[^a-z0-9]+',' ',''.join(c for c in value if not unicodedata.combining(c))).strip()

def deduplicate(events):
 out=[];by_url={};by_signature={}
 for event in events:
  key=canonical(event.get('source_url'))
  title=normalize_title(event.get('name'));sig=(title,event.get('start'),normalize_title(event.get('location')))
  match=by_url.get(key) if key else None
  if match is None and all(sig):match=by_signature.get(sig)
  if match is not None:
   match['source_refs']={ (x.get('community'),canonical(x.get('url'))):{'community':x.get('community'),'url':canonical(x.get('url'))} for x in match.get('source_refs',[])+event.get('source_refs',[]) }
   match['source_refs']=list(match['source_refs'].values())
   match['source_urls']=sorted({x['url'] for x in match['source_refs']})
   match['sources']=sorted({x['community'] for x in match['source_refs']})
   if event.get('registration_url') and not match.get('registration_url'):match['registration_url']=event['registration_url']
   continue
  event.setdefault('source_urls',[event.get('source_url')]);event.setdefault('sources',[event.get('community')]);event.setdefault('source_refs',[{'community':event.get('community'),'url':event.get('source_url')}])
  out.append(event)
  if key:by_url[key]=event
  if all(sig):by_signature[sig]=event
 # Similar title/date with conflicting place or time is retained but surfaced for review.
 seen={}
 for event in out:
  title=normalize_title(event.get('name'));start=parsed(event.get('start'))
  if not title or not start:continue
  key=(title,start.astimezone(TZ).date())
  if key in seen:
   other=seen[key]
   if event.get('id')!=other.get('id'):
    for item in (event,other):
     item.setdefault('review_reasons',[]).append('Posible duplicado: mismo nombre y fecha local, pero la identidad no es concluyente.')
     item['possible_duplicate']=True
  else:seen[key]=event
 return out

def refresh_absent(current,previous,observed_at,as_of):
 """Re-read only known future detail pages missing from a healthy group listing."""
 if not previous:return
 present={canonical(e.get('source_url')) for e in current.get('events',[])}
 refreshed=[]
 for old in previous.get('events',[]):
  url=canonical(old.get('source_url'));community=old.get('community')
  if not url or url in present:continue
  old_end=parsed(old.get('end')) or parsed(old.get('start'))
  if not old_end or old_end.astimezone(TZ).date()<as_of:continue
  if current.get('sources',{}).get(community,{}).get('status') not in ('ok','partial'):continue
  try:
   document,final=fetch(url);nodes=[n for block in jsonlds(document) for n in events_in(block)]
   if not nodes:raise FetchError('ficha conocida sin JSON-LD Event')
   fresh=normalize_event(nodes[0],community,final,observed_at)
   fresh['id']=old.get('id') or fresh['id'];fresh['observation_state']='not_in_listing_detail_refreshed'
   fresh['observation_note']='Ya no aparece en el listado de la comunidad; la ficha conocida sigue accesible y se conserva su estado explícito.'
   fresh['registration_state']=old.get('registration_state');fresh['registration_candidate_url']=old.get('registration_candidate_url')
   fresh['requirements']=old.get('requirements',[])
   current['events'].append(fresh);present.add(url);refreshed.append(fresh)
  except FetchError as exc:
   source=current['sources'][community];source.setdefault('detail_errors',[]).append({'url':url,'error':'reconsulta de evento no listado: '+str(exc)})
   source['status']='partial'
 for event in refreshed:
  # Keep prior source URL shape and use the current detail URL as provenance.
  event['source_url']=canonical(event.get('source_url'))

def reconcile(current,previous,as_of):
 old_events=(previous or {}).get('events',[]);sources=current.get('sources',{})
 current_urls={canonical(e.get('source_url')) for e in current.get('events',[]) if e.get('source_url')}
 old_by_url={canonical(e.get('source_url')):e for e in old_events if e.get('source_url')}
 for event in current.get('events',[]):
  before=old_by_url.get(canonical(event.get('source_url')))
  if before and event.get('id')!=before.get('id'):event['id']=before['id']
 now={e['id']:e for e in current.get('events',[]) if e.get('id')};seen_old_urls=set()
 for before in old_events:
  event_id=before.get('id');key=canonical(before.get('source_url'))
  if event_id in now or key in current_urls or (key and key in seen_old_urls):continue
  if key:seen_old_urls.add(key)
  community=before.get('community');source=sources.get(community,{})
  saved=dict(before);end=parsed(saved.get('end')) or parsed(saved.get('start'))
  detail_failed=any(canonical(x.get('url'))==key for x in source.get('detail_errors',[]))
  if source.get('status')=='failed':saved['retention_state']='preserved_due_fetch_failure'
  elif source.get('status')=='partial' or detail_failed:saved['retention_state']='preserved_due_partial_read'
  elif end and end.astimezone(TZ).date()<as_of:saved['classification']='past';saved['observation_state']='past_not_in_upcoming';saved['change']='pasado'
  else:
   saved['retention_state']='not_observed';saved['observation_state']='not_observed';saved['classification']='requires_review'
   saved['review_reasons']=list(saved.get('review_reasons',[]))
   reason='Ya no aparece en la selección actual; ausencia no confirma cancelación.'
   if reason not in saved['review_reasons']:saved['review_reasons'].append(reason)
  now[event_id]=saved
 current['events']=deduplicate(list(now.values()))
 return current

def compare(current,previous):
 old={e['id']:e for e in (previous or {}).get('events',[]) if e.get('id')};old_urls={canonical(e.get('source_url')):e for e in (previous or {}).get('events',[]) if e.get('source_url')};out=[]
 for event in current.get('events',[]):
  before=old.get(event.get('id')) or old_urls.get(canonical(event.get('source_url')))
  event['change']='nuevo' if not before else ('cambios detectados' if fingerprint(event)!=fingerprint(before) else ('sin cambios' if not event.get('retention_state') else event['retention_state']))
  if before:
   fields=('name','start','end','location','mode','description','registration_url','registration_candidate_url','registration_state','price','requirements','status','classification','review_reasons','source_refs')
   changes={k:(before.get(k),event.get(k)) for k in fields if before.get(k)!=event.get(k)}
   if changes:event['change_details']=changes
  out.append(event)
 return out

def report(as_of,events,sources,note=None):
 lines=[f'# Recopilación manual de eventos — {as_of.isoformat()}','', 'Horas en Europe/Madrid. Lectura directa puntual; no hay servicio diario.','']
 if note:lines.insert(2,'**'+note+'**')
 for label,cls in [('Publicables','publishable'),('Requieren revisión','requires_review'),('Pasados, fuera de agenda','past'),('Cancelados según fuente','cancelled')]:
  lines += ['## '+label,'']; group=[e for e in events if e.get('classification')==cls]
  if not group:lines += ['No hay eventos en esta categoría.',''];continue
  for e in group:
   s=parsed(e.get('start'));end=parsed(e.get('end'));when=s.astimezone(TZ).strftime('%Y-%m-%d %H:%M %Z') if s else 'no identificada'
   if end:
    le=end.astimezone(TZ);when+=('–'+le.strftime('%H:%M %Z') if s and le.date()==s.astimezone(TZ).date() else ' → '+le.strftime('%Y-%m-%d %H:%M %Z'))
   lines += [f"### {e.get('name') or 'Evento sin nombre'}",'',f"- **Fecha/hora:** {when}",f"- **Lugar/modalidad:** {e.get('location') or 'No consta'}; {e.get('mode') or 'no indicada'}",f"- **Comunidad:** {e.get('community')}",f"- **Descripción:** {e.get('description') or 'No consta'}",f"- **Precio:** {e.get('price') or 'No indicado'}",f"- **Requisitos/plazo:** {'; '.join(e.get('requirements') or []) or 'No constan'}",f"- **Fuentes:** {'; '.join(f"[{ref.get('community')}]({ref.get('url')})" for ref in e.get('source_refs',[{'community':e.get('community'),'url':e.get('source_url')}]))}"]
   if e.get('registration_url'):
    label={'integrated_on_source_page':'Registro integrado en la ficha fuente','source_offer_url':'Registro externo enlazado por la fuente','verified_matching_event':'Registro verificado para este evento'}.get(e.get('registration_state'),'Registro según fuente')
    lines.append(f"- **Inscripción:** [{label}]({e['registration_url']})")
   elif e.get('registration_state') in ('invalid_mismatch','not_verified'):
    candidate=e.get('registration_candidate_url')
    link=f"[{candidate}]({candidate})" if candidate else 'no disponible'
    lines.append(f"- **Inscripción:** enlace candidato no verificado: {link}. No se ofrece como inscripción válida. Motivo: {e.get('registration_note')}")
   if e.get('review_reasons'):lines.append('- **Motivo de revisión:** '+'; '.join(e['review_reasons']))
   if e.get('change'):lines.append('- **Comparación:** '+e['change']+(' — '+e['observation_note'] if e.get('observation_note') else ''))
   if e.get('change_details'):lines.append('- **Antes → ahora:** '+ '; '.join(f"{k}: {v[0]} → {v[1]}" for k,v in e['change_details'].items()))
   if e.get('retention_state'):lines.append('- **Conservación:** '+e['retention_state'])
   if e.get('observation_note'):lines.append('- **Aviso de observación:** '+e['observation_note'])
   lines.append('')
 lines += ['## Lectura de fuentes','']
 for c,s in sources.items():
  if s.get('error'):lines.append(f"- **{c}:** error: {s['error']}; datos previos preservados, no implica cancelación.")
  else:
   lines.append(f"- **{c}:** lectura {s.get('status')}; {s.get('count',0)} fichas.")
   if c=='WordPress Coruña':lines.append(f"  - Cobertura visible: {s.get('upcoming_links',0)} enlaces próximos y {s.get('past_links',0)} pasados; se recuperó {s.get('past_sample_count',0)} ficha pasada como evidencia. No se recorren todos los pasados.")
   for x in s.get('detail_errors',[]):lines.append(f"  - Ficha inaccesible {x['url']}: {x['error']}.")
 lines += ['','La falta de un evento en una página se informa como “no observado”, nunca como cancelación. Una captura puntual no demuestra revisión diaria ni detección continua.','']
 return '\n'.join(lines)

def write(path,content):
 path.parent.mkdir(parents=True,exist_ok=True);tmp=path.with_suffix(path.suffix+'.tmp');tmp.write_text(content,encoding='utf8');tmp.replace(path)

def run(as_of,output,reuse=False):
 folder=output/'real';latest=folder/'latest.json';previous=json.loads(latest.read_text()) if latest.exists() else None
 if reuse:
  if not previous:raise SystemExit('No existe snapshot para --reuse-snapshot')
  current=dict(previous);current['run_note']='Reutilizado explícitamente; no es una segunda captura de red.';sources=current['sources']
 else:
  now=dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds');all_events=[];sources={};failed=[]
  for community,url in SOURCES.items():
   try:
    if community=='WordPress Coruña':found,errors,coverage=meetup(community,url,now)
    else:found,errors=gdg(community,url,now);coverage={}
    all_events.extend(found);sources[community]={'url':url,'status':'partial' if errors else 'ok','count':len(found),'detail_errors':errors,'checked_at':now,**coverage}
   except FetchError as x:failed.append(community);sources[community]={'url':url,'status':'failed','error':str(x),'checked_at':now}
  all_events=deduplicate(all_events)
  for e in all_events:classify(e,as_of)
  current={'version':1,'as_of':as_of.isoformat(),'timezone':'Europe/Madrid','captured_at':now,'sources':sources,'failed_sources':failed,'events':all_events}
  refresh_absent(current,previous,now,as_of)
  for e in current['events']:classify(e,as_of)
  reconcile(current,previous,as_of)
 compared=compare(current,previous)
 stamp=dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
 if reuse:
  replay=output/'replay';write(replay/f'report-{as_of.isoformat()}-{stamp}.md',report(as_of,compared,sources,'REPRODUCCIÓN: snapshot reutilizado; no se consultó la red y latest.json no se modificó.'))
  return current
 snap=folder/f'snapshot-{stamp}.json';n=1
 while snap.exists():snap=folder/f'snapshot-{stamp}-{n}.json';n+=1
 write(snap,json.dumps(current,ensure_ascii=False,indent=2)+'\n');write(latest,json.dumps(current,ensure_ascii=False,indent=2)+'\n')
 write(folder/f'report-{as_of.isoformat()}-{stamp}.md',report(as_of,compared,sources))
 return current

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--as-of',default='2026-10-19');p.add_argument('--output',type=Path,default=Path('output'));p.add_argument('--reuse-snapshot',action='store_true');a=p.parse_args()
 data=run(dt.date.fromisoformat(a.as_of),a.output,a.reuse_snapshot)
 counts={c:sum(e.get('classification')==c for e in data['events']) for c in ('publishable','requires_review','past','cancelled')}
 print(json.dumps({'sources_ok':sum(s.get('status')=='ok' for s in data['sources'].values()),'sources_failed':data['failed_sources'],'events':len(data['events']),'counts':counts,'latest_modified':not a.reuse_snapshot,'output':str(a.output/('replay' if a.reuse_snapshot else 'real'))},ensure_ascii=False,indent=2))
if __name__=='__main__':main()
