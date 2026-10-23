"""Strict, side-effect-free YAML validation; usable before Django or its database starts."""
from copy import deepcopy
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
import hashlib
import json
import os
from pathlib import Path
import re
from urllib.parse import urlsplit
import yaml


class ConfigurationError(ValueError):
    pass


class UniqueLoader(yaml.SafeLoader):
    def construct_mapping(self, node, deep=False):
        pairs = super().construct_pairs(node, deep=deep)
        result = {}
        for key, value in pairs:
            if not isinstance(key, str) or key in result:
                raise ConfigurationError(f'Clave repetida o no textual en la línea {node.start_mark.line + 1}.')
            result[key] = value
        return result


@dataclass(frozen=True)
class LoadedConfiguration:
    document: dict
    path: str
    profile: str
    revision: str


def mapping(value, keys, path):
    if not isinstance(value, dict):
        raise ConfigurationError(f'{path}: se esperaba un objeto YAML.')
    unknown = set(value) - set(keys)
    missing = set(keys) - set(value)
    if unknown:
        raise ConfigurationError(f'{path}: claves desconocidas: {", ".join(sorted(unknown))}.')
    if missing:
        raise ConfigurationError(f'{path}: faltan claves: {", ".join(sorted(missing))}.')
    return value


def integer(value, low, high, path):
    if type(value) is not int or not low <= value <= high:
        raise ConfigurationError(f'{path}: debe ser un entero entre {low} y {high}.')


def boolean(value, path):
    if type(value) is not bool:
        raise ConfigurationError(f'{path}: debe ser true o false, sin comillas.')


def choice(value, choices, path):
    if value not in choices:
        raise ConfigurationError(f'{path}: valor no admitido.')


def text(value, maximum, path):
    if not isinstance(value, str) or not value.strip() or len(value) > maximum:
        raise ConfigurationError(f'{path}: texto vacío o demasiado largo.')


ACCESS = ('registration', 'local_test_accounts', 'require_admin_mfa', 'social_providers',
          'session_idle_minutes', 'session_max_hours', 'auth_attempts', 'auth_window_seconds')
COLLECTION = ('enabled', 'retrieval', 'weekdays', 'min_interval_hours', 'scheduler_minutes',
              'source_deadline_seconds', 'stale_run_minutes', 'max_details', 'max_events')
FETCH = ('allowed_hosts', 'max_bytes', 'max_redirects', 'connect_timeout_seconds', 'read_timeout_seconds')


def validate_document(document):
    mapping(document, ('version', 'access', 'collection', 'processing', 'fetch', 'sources'), 'app')
    integer(document['version'], 1, 1, 'version')
    access = mapping(document['access'], ACCESS, 'access')
    for key in ACCESS[:3]:
        boolean(access[key], 'access.' + key)
    providers = access['social_providers']
    if not isinstance(providers, list) or any(provider not in ('google', 'github') for provider in providers) or len(providers) != len(set(providers)):
        raise ConfigurationError('access.social_providers: lista de proveedores google/github sin duplicados.')
    for key, low, high in [('session_idle_minutes', 1, 240), ('session_max_hours', 1, 24), ('auth_attempts', 1, 100), ('auth_window_seconds', 60, 3600)]:
        integer(access[key], low, high, 'access.' + key)
    if access['session_idle_minutes'] > access['session_max_hours'] * 60:
        raise ConfigurationError('access: la inactividad no puede superar la duración máxima de sesión.')
    collection = mapping(document['collection'], COLLECTION, 'collection')
    boolean(collection['enabled'], 'collection.enabled')
    choice(collection['retrieval'], ('daily', 'twice-weekly'), 'collection.retrieval')
    days = collection['weekdays']
    if not isinstance(days, list) or len(days) != 2 or any(type(day) is not int or not 0 <= day <= 6 for day in days) or len(set(days)) != 2:
        raise ConfigurationError('collection.weekdays: indica dos días distintos entre 0 (lunes) y 6 (domingo).')
    for key, low, high in [('min_interval_hours', 1, 168), ('scheduler_minutes', 1, 60), ('source_deadline_seconds', 5, 65), ('stale_run_minutes', 5, 60), ('max_details', 0, 20), ('max_events', 1, 100)]:
        integer(collection[key], low, high, 'collection.' + key)
    processing = mapping(document['processing'], ('frequency', 'budget_eur', 'paid_calls_enabled'), 'processing')
    choice(processing['frequency'], ('twice-weekly', 'every-three-days'), 'processing.frequency')
    try:
        budget = Decimal(str(processing['budget_eur']))
        if not budget.is_finite() or not 0 <= budget <= 5 or budget.as_tuple().exponent < -2:
            raise ValueError()
    except (InvalidOperation, ValueError, TypeError):
        raise ConfigurationError('processing.budget_eur: importe entre 0 y 5, con hasta dos decimales.') from None
    boolean(processing['paid_calls_enabled'], 'processing.paid_calls_enabled')
    if processing['paid_calls_enabled']:
        raise ConfigurationError('processing.paid_calls_enabled: las llamadas LLM no están disponibles en esta versión.')
    fetch = mapping(document['fetch'], FETCH, 'fetch')
    hosts = fetch['allowed_hosts']
    if not isinstance(hosts, list) or not hosts or any(not isinstance(host, str) or not re.fullmatch(r'[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?', host) for host in hosts) or len(hosts) != len(set(hosts)):
        raise ConfigurationError('fetch.allowed_hosts: dominios en minúsculas, sin esquemas ni duplicados.')
    for key, low, high in [('max_bytes', 10000, 10000000), ('max_redirects', 0, 5), ('connect_timeout_seconds', 1, 8), ('read_timeout_seconds', 1, 10)]:
        integer(fetch[key], low, high, 'fetch.' + key)
    sources = document['sources']
    if not isinstance(sources, list) or len(sources) > 1000:
        raise ConfigurationError('sources: se esperaba una lista de hasta 1000 fuentes.')
    ids, urls = set(), set()
    for index, source in enumerate(sources):
        path = f'sources[{index}]'
        mapping(source, ('id', 'name', 'url', 'city', 'platform', 'enabled'), path)
        for key, maximum in [('id', 100), ('name', 200), ('url', 2048), ('city', 100), ('platform', 50)]:
            text(source[key], maximum, path + '.' + key)
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', source['id']) or source['id'] in ids:
            raise ConfigurationError(path + '.id: identificador inválido o repetido.')
        try:
            url = urlsplit(source['url'])
            if url.scheme != 'https' or url.hostname not in hosts or url.port not in (None, 443) or url.username or url.password or url.fragment:
                raise ValueError()
        except ValueError:
            raise ConfigurationError(path + '.url: requiere HTTPS, un dominio permitido y ningún dato de acceso.') from None
        normalized = source['url'].rstrip('/')
        if normalized in urls:
            raise ConfigurationError(path + '.url: convocatoria de fuente duplicada.')
        boolean(source['enabled'], path + '.enabled')
        ids.add(source['id']); urls.add(normalized)
    return document


def load_configuration(path, profile='production'):
    try:
        raw = Path(path).read_bytes()
        if len(raw) > 262144:
            raise ConfigurationError('El YAML supera el máximo de 256 KiB.')
        document = yaml.load(raw.decode('utf-8'), Loader=UniqueLoader)
    except (OSError, UnicodeError):
        raise ConfigurationError('No se puede leer el archivo de configuración YAML.') from None
    except yaml.YAMLError as error:
        mark = getattr(error, 'problem_mark', None)
        raise ConfigurationError('YAML inválido' + (f' en la línea {mark.line + 1}.' if mark else '.')) from None
    if not isinstance(document, dict):
        raise ConfigurationError('El archivo debe contener un objeto YAML.')
    profiles = document.pop('profiles', {})
    if not isinstance(profiles, dict) or any(name not in ('local',) for name in profiles):
        raise ConfigurationError('profiles: solo se admite el perfil local.')
    validate_document(document)
    variants = {'production': document}
    for name, overrides in profiles.items():
        mapping(overrides, ('access',), 'profiles.' + name)
        if not isinstance(overrides['access'], dict) or not set(overrides['access']) <= set(ACCESS):
            raise ConfigurationError('profiles.' + name + '.access: claves no admitidas.')
        effective = deepcopy(document)
        effective['access'].update(overrides['access'])
        variants[name] = validate_document(effective)
    if profile not in variants:
        raise ConfigurationError('APP_PROFILE no existe en el archivo YAML.')
    effective = variants[profile]
    revision = hashlib.sha256(json.dumps(effective, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
    return LoadedConfiguration(effective, str(path), profile, revision)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--path', default=os.environ.get('APP_CONFIG_PATH', '/app/configuration/app.yaml'))
    parser.add_argument('--profile', default=os.environ.get('APP_PROFILE', 'production'))
    options = parser.parse_args()
    try:
        config = load_configuration(options.path, options.profile)
    except ConfigurationError as error:
        parser.exit(2, f'Configuración inválida: {error}\n')
    print(f'YAML válido · perfil {config.profile} · {len(config.document["sources"])} fuentes · revisión {config.revision[:12]}')
