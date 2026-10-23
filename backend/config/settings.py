import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

def secret(name, default=None):
    filename = os.environ.get(name + '_FILE')
    value = Path(filename).read_text().strip() if filename else os.environ.get(name, default)
    if value is None:
        raise RuntimeError(f'Missing {name} or {name}_FILE')
    return value

def flag(name, default=False):
    return os.environ.get(name, str(default)).lower() in ('1', 'true', 'yes')

SECRET_KEY = secret('DJANGO_SECRET_KEY')
DEBUG = False
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1,backend').split(',')
CSRF_TRUSTED_ORIGINS = [v for v in os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',') if v]
INSTALLED_APPS = [
    'django.contrib.auth', 'django.contrib.contenttypes', 'django.contrib.sessions',
    'django.contrib.messages', 'django.contrib.staticfiles', 'rest_framework',
    'allauth', 'allauth.account', 'allauth.headless', 'allauth.socialaccount',
    'allauth.socialaccount.providers.google', 'allauth.socialaccount.providers.github',
    'allauth.mfa', 'django_q', 'core',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware', 'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware', 'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware', 'django.contrib.messages.middleware.MessageMiddleware',
    'allauth.account.middleware.AccountMiddleware', 'core.middleware.AccessMiddleware',
]
ROOT_URLCONF = 'config.urls'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates', 'APP_DIRS': True,
              'OPTIONS': {'context_processors': ['django.template.context_processors.request', 'django.contrib.auth.context_processors.auth', 'django.contrib.messages.context_processors.messages']}}]
WSGI_APPLICATION = 'config.wsgi.application'
DATABASES = {'default': {'ENGINE': 'django.db.backends.postgresql', 'NAME': os.environ.get('POSTGRES_DB', 'galiciatech'),
                         'USER': os.environ.get('POSTGRES_USER', 'galiciatech'), 'PASSWORD': secret('POSTGRES_PASSWORD'),
                         'HOST': os.environ.get('POSTGRES_HOST', 'db'), 'PORT': os.environ.get('POSTGRES_PORT', '5432'),
                         'CONN_MAX_AGE': 60, 'CONN_HEALTH_CHECKS': True}}
REDIS_URL = os.environ.get('REDIS_URL', 'redis://redis:6379/0')
CACHES = {'default': {'BACKEND': 'django.core.cache.backends.redis.RedisCache', 'LOCATION': REDIS_URL,
                       'KEY_PREFIX': 'galicia-tech', 'TIMEOUT': 300}}
AUTH_USER_MODEL = 'core.User'
AUTHENTICATION_BACKENDS = ['django.contrib.auth.backends.ModelBackend', 'allauth.account.auth_backends.AuthenticationBackend']
PASSWORD_HASHERS = ['django.contrib.auth.hashers.Argon2PasswordHasher', 'django.contrib.auth.hashers.PBKDF2PasswordHasher']
AUTH_PASSWORD_VALIDATORS = [{'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
                            {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 12}},
                            {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
                            {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'}]
LANGUAGE_CODE = 'es'
TIME_ZONE = 'Europe/Madrid'
USE_I18N = True
USE_TZ = True
STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
DATA_UPLOAD_MAX_MEMORY_SIZE = 131072
SESSION_COOKIE_NAME = 'galicia_session'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = flag('COOKIE_SECURE')
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 8 * 3600
CSRF_COOKIE_SECURE = SESSION_COOKIE_SECURE
CSRF_COOKIE_SAMESITE = 'Lax'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'same-origin'
X_FRAME_OPTIONS = 'DENY'
# The gateway overwrites these headers; backend has no published port.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
ALLAUTH_TRUSTED_PROXY_COUNT = 1
ACCOUNT_LOGIN_METHODS = {'email'}
ACCOUNT_SIGNUP_FIELDS = ['email*', 'password1*', 'password2*']
ACCOUNT_EMAIL_VERIFICATION = 'none'  # local signup has no email delivery; registration stays closed by default
ACCOUNT_UNIQUE_EMAIL = True
ACCOUNT_ADAPTER = 'core.adapters.AccountAdapter'
ALLOW_REGISTRATION = flag('ALLOW_REGISTRATION', False)
ACCOUNT_RATE_LIMITS = {'login': '20/m/ip', 'login_failed': '5/5m/key,20/5m/ip'}
HEADLESS_ONLY = True
HEADLESS_CLIENTS = ('browser',)
HEADLESS_SERVE_SPECIFICATION = False
HEADLESS_FRONTEND_URLS = {'account_confirm_email': '/cuenta', 'account_reset_password_from_key': '/login',
                          'account_signup': '/login', 'socialaccount_login_error': '/login'}
SOCIALACCOUNT_ADAPTER = 'core.adapters.SocialAdapter'
SOCIALACCOUNT_EMAIL_AUTHENTICATION = False
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT = False
SOCIALACCOUNT_LOGIN_ON_GET = False
SOCIALACCOUNT_PROVIDERS = {}
for provider in ('google', 'github'):
    client_id = os.environ.get(provider.upper() + '_CLIENT_ID')
    client_secret = secret(provider.upper() + '_CLIENT_SECRET', '')
    if client_id and client_secret:
        SOCIALACCOUNT_PROVIDERS[provider] = {'APPS': [{'client_id': client_id, 'secret': client_secret, 'key': ''}]}
MFA_SUPPORTED_TYPES = ['totp', 'recovery_codes']
MFA_ADAPTER = 'core.adapters.MFAAdapter'
MFA_ENCRYPTION_KEY = secret('MFA_ENCRYPTION_KEY')
REQUIRE_ADMIN_MFA = flag('REQUIRE_ADMIN_MFA', True)
EMAIL_BACKEND = 'django.core.mail.backends.dummy.EmailBackend'  # no mail delivery is advertised
LOGIN_REDIRECT_URL = '/cuenta'
REST_FRAMEWORK = {'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework.authentication.SessionAuthentication'],
                  'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
                  'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer']}
Q_CLUSTER = {'name': 'galicia-tech', 'workers': 1, 'orm': 'default', 'timeout': 90,
             'retry': 180, 'max_attempts': 2, 'queue_limit': 1, 'bulk': 1,
             'catch_up': False, 'save_limit': 500, 'recycle': 100}
CONFIG_AUTHORITY = os.environ.get('CONFIG_AUTHORITY', 'web')
CONFIG_YAML_PATH = os.environ.get('CONFIG_YAML_PATH', '/app/configuration/processing.yaml')
COLLECTION_ENABLED = flag('COLLECTION_ENABLED', False)
FETCH_ALLOWED_HOSTS = os.environ.get('FETCH_ALLOWED_HOSTS', 'gdg.community.dev,www.meetup.com,meetup.com,gpul.org,corunajug.org').split(',')
LOGGING = {'version': 1, 'disable_existing_loggers': False,
           'handlers': {'console': {'class': 'logging.StreamHandler'}},
           'root': {'handlers': ['console'], 'level': 'INFO'}}
