import hashlib
import hmac
import json
import time
from django.conf import settings
from django.contrib.auth import logout
from django.http import JsonResponse
from redis import Redis, RedisError

redis = Redis.from_url(settings.REDIS_URL, socket_connect_timeout=2, socket_timeout=2)
LIMIT = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],300) end; return n"

class AccessMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    def __call__(self, request):
        if request.path.startswith(('/api/', '/_allauth/', '/accounts/')):
            if request.user.is_authenticated:
                started = request.session.setdefault('auth_started', time.time())
                last = request.session.get('last_activity', time.time())
                if time.time() - last > 1800 or time.time() - started > 8 * 3600:
                    logout(request)
                else:
                    request.session['last_activity'] = time.time()
            if request.method not in ('GET', 'HEAD', 'OPTIONS') and request.path.startswith(('/_allauth/', '/accounts/')):
                # Gateway replaces XFF, so client-supplied chains cannot spoof the key.
                ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'unknown'))
                keys = [ip]
                try:
                    data = json.loads(request.body or b'{}')
                    if isinstance(data, dict) and isinstance(data.get('email'), str):
                        keys.append(data['email'].strip().casefold())
                except (ValueError, UnicodeDecodeError):
                    pass
                try:
                    for value in keys:
                        digest = hmac.new(settings.SECRET_KEY.encode(), value.encode(), hashlib.sha256).hexdigest()
                        if redis.eval(LIMIT, 1, 'auth:' + digest) > 30:
                            return JsonResponse({'detail': 'Demasiados intentos. Espera unos minutos.'}, status=429, headers={'Retry-After': '300', 'Cache-Control': 'no-store'})
                except RedisError:
                    return JsonResponse({'detail': 'El acceso no está disponible temporalmente.'}, status=503, headers={'Cache-Control': 'no-store'})
        response = self.get_response(request)
        if request.path.startswith(('/api/', '/_allauth/', '/accounts/')):
            response['Cache-Control'] = 'no-store'
        return response
