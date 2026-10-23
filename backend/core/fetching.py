"""Bounded fetcher: allowlisted hosts, public IPs, pinned TLS connections, checked redirects."""
import ipaddress
import socket
from urllib.parse import urljoin, urlsplit
import urllib3
from django.conf import settings

def fetch_html(url):
    for _ in range(settings.FETCH_MAX_REDIRECTS + 1):
        parsed = urlsplit(url)
        if parsed.scheme != 'https' or parsed.port not in (None, 443) or parsed.username or parsed.password or parsed.hostname not in settings.FETCH_ALLOWED_HOSTS:
            raise ValueError('URL fuera de las fuentes HTTPS permitidas.')
        addresses = {record[4][0] for record in socket.getaddrinfo(parsed.hostname, 443, type=socket.SOCK_STREAM)}
        if not addresses or any(not ipaddress.ip_address(address).is_global for address in addresses):
            raise ValueError('La fuente resuelve a una dirección no pública.')
        # Connect to a checked address; do not perform a second DNS lookup.
        pool = urllib3.HTTPSConnectionPool(next(iter(addresses)), port=443, server_hostname=parsed.hostname,
                                           assert_hostname=parsed.hostname, timeout=urllib3.Timeout(connect=settings.FETCH_CONNECT_TIMEOUT, read=settings.FETCH_READ_TIMEOUT), maxsize=1)
        response = None
        try:
            response = pool.request('GET', (parsed.path or '/') + ('?' + parsed.query if parsed.query else ''),
                                    headers={'Host': parsed.hostname, 'User-Agent': 'GaliciaTech/0.1 (+trusted public event reader)',
                                             'Accept': 'text/html,application/xhtml+xml', 'Accept-Encoding': 'identity'},
                                    redirect=False, retries=False, preload_content=False)
            if response.status in (301, 302, 303, 307, 308):
                url = urljoin(url, response.headers.get('Location', ''))
                continue
            if response.status != 200:
                raise ValueError(f'La fuente devuelve HTTP {response.status}.')
            if 'html' not in response.headers.get('Content-Type', ''):
                raise ValueError('La fuente no devuelve HTML.')
            raw = response.read(settings.FETCH_MAX_BYTES + 1, decode_content=False)
            if len(raw) > settings.FETCH_MAX_BYTES:
                raise ValueError('La página supera el tamaño permitido en YAML.')
            return raw.decode('utf-8', errors='replace'), url
        finally:
            if response:
                response.close()
            pool.close()
    raise ValueError('Demasiadas redirecciones.')
