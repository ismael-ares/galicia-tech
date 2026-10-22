import html
import json
import re
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, urlunsplit
from django.utils.dateparse import parse_datetime

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.links = []; self.jsonld = []; self.next_data = None; self.script = None; self.parts = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and attrs.get('href'):
            self.links.append(attrs['href'])
        if tag == 'script':
            self.script = 'jsonld' if attrs.get('type', '').lower() == 'application/ld+json' else 'next' if attrs.get('id') == '__NEXT_DATA__' else None
            self.parts = []
    def handle_data(self, data):
        if self.script:
            self.parts.append(data)
    def handle_endtag(self, tag):
        if tag == 'script' and self.script:
            try:
                data = json.loads(''.join(self.parts))
                if self.script == 'jsonld': self.jsonld.append(data)
                else: self.next_data = data
            except ValueError:
                pass
            self.script = None

def event_nodes(data):
    if isinstance(data, dict):
        kind = data.get('@type')
        if kind == 'Event' or isinstance(kind, list) and 'Event' in kind:
            yield data
        for value in data.values():
            yield from event_nodes(value)
    elif isinstance(data, list):
        for value in data:
            yield from event_nodes(value)

def clean(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', str(value or '')))).strip()

def canonical(url):
    parts = urlsplit(url)
    return urlunsplit((parts.scheme, parts.netloc, parts.path.rstrip('/'), '', ''))

def detail_links(parser, url):
    links = []
    state = parser.next_data or {}
    gdg = state.get('props', {}).get('pageProps', {}).get('prerenderData', {}).get('upcomingEvents', {})
    if isinstance(gdg, dict):
        links.extend(item.get('url') for item in gdg.get('results', []) if isinstance(item, dict) and item.get('url'))
    links.extend(urljoin(url, link) for link in parser.links if re.search(r'/events/\d+|/events/details/|/eventos/[^#?]+/|/evento/[^#?]+/', link))
    return list(dict.fromkeys(links))[:6]

def normalize(node, source, page_url):
    start = parse_datetime(str(node.get('startDate', '')))
    end = parse_datetime(str(node.get('endDate', '')))
    if not start or not start.tzinfo:
        raise ValueError('Fecha de inicio ausente o sin zona horaria.')
    if end and (not end.tzinfo or end < start):
        raise ValueError('Fecha de fin incoherente.')
    title = clean(node.get('name'))
    if not title:
        raise ValueError('Título ausente.')
    location = node.get('location') if isinstance(node.get('location'), dict) else {}
    address = location.get('address') if isinstance(location.get('address'), dict) else {}
    offers = node.get('offers') or []
    if isinstance(offers, dict): offers = [offers]
    prices = {str(offer['price']) for offer in offers if isinstance(offer, dict) and 'price' in offer}
    price = 'Precio no indicado'
    if len(prices) == 1:
        amount = next(iter(prices))
        currency = next((clean(o.get('priceCurrency')) for o in offers if isinstance(o, dict)), '')
        price = 'Gratis' if amount in ('0', '0.0', '0.00') else amount + (' €' if currency == 'EUR' else ' ' + currency)
    url = canonical(urljoin(page_url, str(node.get('url') or page_url)))
    parsed_url = urlsplit(url)
    if parsed_url.scheme not in ('https', 'http') or not parsed_url.hostname or parsed_url.username or parsed_url.password:
        raise ValueError('Enlace de convocatoria inválido.')
    return {'title': title[:500], 'start': start.isoformat(), 'end': end.isoformat() if end else None,
            'dateLabel': '', 'timeLabel': '', 'city': clean(address.get('addressLocality')) or source.city,
            'community': source.name, 'place': clean(location.get('name')) or 'Lugar por confirmar', 'price': price,
            'requirements': 'Consulta los requisitos en la fuente original.',
            'sourceStatus': str(node.get('eventStatus', '')), 'statusNote': 'Convocatoria pendiente de revisión.', 'description': [clean(node.get('description'))[:12000]],
            'sources': [{'label': 'Convocatoria oficial', 'url': url}], 'registration': None, 'sourceIds': [source.id]}
