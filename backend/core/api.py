from django.conf import settings
from django.db import connection, transaction
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.http import require_GET
from rest_framework import serializers, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, BasePermission, IsAuthenticated
from rest_framework.response import Response
from allauth.mfa.models import Authenticator
from redis import Redis, RedisError
from .models import Attendance, AuditLog, CollectionRun, Event, Favorite, ProcessingConfig, ReviewCase, Source
from .services import decide_case, processing_config, public_url

class SessionAuth(SessionAuthentication):
    def authenticate_header(self, request):
        return 'Session'

class IsManager(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated or not request.user.is_staff:
            return False
        if settings.REQUIRE_ADMIN_MFA and not Authenticator.objects.filter(user=request.user, type='totp').exists():
            return False
        return True

def user_data(user):
    return {'id': str(user.public_id), 'name': user.first_name or user.username, 'email': user.email,
            'role': 'admin' if user.is_staff else 'user', 'mfaEnabled': Authenticator.objects.filter(user=user, type='totp').exists()}

def source_data(source, private=False):
    result = {'id': source.id, 'name': source.name, 'url': source.url, 'city': source.city, 'platform': source.platform, 'enabled': source.enabled}
    if private:
        result.update(checkedAt=source.checked_at.isoformat() if source.checked_at else None, lastError=source.last_error)
    return result

def review_data(case):
    return {**case.data, 'id': case.id, 'eventId': case.event_id, 'decision': {'status': case.status, 'value': case.value, 'note': case.note}, 'version': case.version}

@require_GET
def health(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        Redis.from_url(settings.REDIS_URL, socket_connect_timeout=2, socket_timeout=2).ping()
        return JsonResponse({'status': 'ok', 'version': '0.1.0'})
    except Exception:
        return JsonResponse({'status': 'unavailable'}, status=503)

@require_GET
def session(request):
    token = get_token(request)
    authenticated = request.user.is_authenticated
    return JsonResponse({'csrfToken': token, 'user': user_data(request.user) if authenticated else None,
                         'favorites': list(Favorite.objects.filter(user=request.user).values_list('event_id', flat=True)) if authenticated else [],
                         'attended': list(Attendance.objects.filter(user=request.user).values_list('event_id', flat=True)) if authenticated else [],
                         'providers': list(settings.SOCIALACCOUNT_PROVIDERS), 'requireAdminMfa': settings.REQUIRE_ADMIN_MFA,
                         'registrationEnabled': settings.ALLOW_REGISTRATION,
                         'usernameLoginEnabled': settings.LOCAL_TEST_ACCOUNTS})

@api_view(['GET'])
@permission_classes([AllowAny])
def catalog(request):
    queryset = Event.objects.filter(published=True).order_by('start', 'id').prefetch_related('sources')
    events = []; covers = []; translations = {}
    for event in queryset:
        events.append({**event.data, 'sourceIds': [s.id for s in event.sources.all()]})
        if event.cover:
            covers.append({'id': event.id, 'selected': event.cover})
        translations.update(event.translations)
    return Response({'events': events, 'covers': covers, 'sources': [source_data(s) for s in Source.objects.order_by('name')],
                     'ranking': [{'id': event['id'], 'reason': ''} for event in events if timezone.datetime.fromisoformat(event['start']) >= timezone.now()][:3],
                     'translations': translations, 'sample': queryset.filter(is_sample=True).exists()})

@api_view(['PUT', 'DELETE'])
@authentication_classes([SessionAuth])
@permission_classes([IsAuthenticated])
def favorite(request, event_id):
    try:
        event = Event.objects.get(pk=event_id, published=True)
    except Event.DoesNotExist:
        raise NotFound()
    if request.method == 'PUT':
        Favorite.objects.get_or_create(user=request.user, event=event)
    else:
        Favorite.objects.filter(user=request.user, event=event).delete()
    return Response(status=204)

@api_view(['PUT', 'DELETE'])
@authentication_classes([SessionAuth])
@permission_classes([IsAuthenticated])
def attendance(request, event_id):
    # Removing a mark stays possible even if an event was withdrawn or rescheduled.
    if request.method == 'DELETE':
        Attendance.objects.filter(user=request.user, event_id=event_id).delete()
        return Response(status=204)
    try:
        event = Event.objects.get(pk=event_id, published=True)
    except Event.DoesNotExist:
        raise NotFound()
    if event.start > timezone.now():
        return Response({'detail': 'Solo puedes marcar asistencia cuando el evento haya comenzado.'}, status=400)
    Attendance.objects.get_or_create(user=request.user, event=event)
    return Response(status=204)

class FavoriteImportSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.RegexField(r'^[A-Za-z0-9_-]{1,100}$'),
                                allow_empty=False, max_length=1000)

@api_view(['POST'])
@authentication_classes([SessionAuth])
@permission_classes([IsAuthenticated])
@transaction.atomic
def import_favorites(request):
    serializer = FavoriteImportSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    # A single authenticated request copies only public events into this account.
    # Unknown or withdrawn IDs never expose unpublished event data.
    events = Event.objects.filter(pk__in=set(serializer.validated_data['ids']), published=True)
    Favorite.objects.bulk_create([Favorite(user=request.user, event=event) for event in events], ignore_conflicts=True)
    return Response({'favorites': list(Favorite.objects.filter(user=request.user).values_list('event_id', flat=True))})

class SourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Source
        fields = ['id', 'name', 'url', 'city', 'platform', 'enabled']
    def validate_url(self, value):
        return public_url(value)

@api_view(['GET', 'POST'])
@authentication_classes([SessionAuth])
@permission_classes([IsManager])
def sources(request):
    if request.method == 'POST':
        serializer = SourceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        source = serializer.save()
        AuditLog.objects.create(actor=request.user, action='source.create', target=source.id)
        return Response(source_data(source, True), status=201)
    return Response([source_data(s, True) for s in Source.objects.order_by('name')])

@api_view(['PATCH'])
@authentication_classes([SessionAuth])
@permission_classes([IsManager])
def source(request, source_id):
    try:
        instance = Source.objects.get(pk=source_id)
    except Source.DoesNotExist:
        raise NotFound()
    if 'id' in request.data:
        raise serializers.ValidationError({'id': 'El identificador no se modifica.'})
    serializer = SourceSerializer(instance, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    with transaction.atomic():
        instance = serializer.save()
        AuditLog.objects.create(actor=request.user, action='source.update', target=instance.id, details={'fields': list(serializer.validated_data)})
    return Response(source_data(instance, True))

@api_view(['GET'])
@authentication_classes([SessionAuth])
@permission_classes([IsManager])
def reviews(request):
    return Response([review_data(case) for case in ReviewCase.objects.select_related('event').order_by('id')])

class DecisionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['pending', 'approved', 'discarded'])
    value = serializers.CharField(max_length=2048, required=False, allow_blank=True)
    note = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    version = serializers.IntegerField(min_value=1)

@api_view(['PATCH'])
@authentication_classes([SessionAuth])
@permission_classes([IsManager])
def review(request, case_id):
    if not ReviewCase.objects.filter(pk=case_id).exists():
        raise NotFound()
    values = DecisionSerializer(data=request.data)
    values.is_valid(raise_exception=True)
    return Response(review_data(decide_case(case_id, request.user, values.validated_data)))

class ConfigSerializer(serializers.Serializer):
    retrieval = serializers.ChoiceField(choices=['daily', 'twice-weekly'])
    frequency = serializers.ChoiceField(choices=['twice-weekly', 'every-three-days'])
    budget = serializers.DecimalField(max_digits=5, decimal_places=2, min_value=0, max_value=5)
    version = serializers.IntegerField(min_value=1)

@api_view(['GET', 'PUT'])
@authentication_classes([SessionAuth])
@permission_classes([IsManager])
def configuration(request):
    if request.method == 'PUT':
        if settings.CONFIG_AUTHORITY != 'web':
            raise PermissionDenied('La configuración procede del archivo del servidor.')
        values = ConfigSerializer(data=request.data)
        values.is_valid(raise_exception=True)
        with transaction.atomic():
            config, _ = ProcessingConfig.objects.select_for_update().get_or_create(pk=1)
            if config.version != values.validated_data['version']:
                return Response({'detail': 'La configuración ha cambiado. Recarga la página.'}, status=409)
            for key in ('retrieval', 'frequency', 'budget'):
                setattr(config, key, values.validated_data[key])
            config.version += 1
            config.save()
            AuditLog.objects.create(actor=request.user, action='configuration.update', target='processing', details={'version': config.version})
    return Response(processing_config())

@api_view(['GET', 'POST'])
@authentication_classes([SessionAuth])
@permission_classes([IsManager])
def collections(request):
    from .tasks import enqueue_source
    if request.method == 'POST':
        if not settings.COLLECTION_ENABLED:
            return Response({'detail': 'Activa COLLECTION_ENABLED en el servidor para consultar fuentes.'}, status=409)
        source_id = request.data.get('sourceId')
        if not isinstance(source_id, str) or not Source.objects.filter(pk=source_id, enabled=True).exists():
            raise serializers.ValidationError({'sourceId': 'Selecciona una fuente activa.'})
        run = enqueue_source(source_id)
        AuditLog.objects.create(actor=request.user, action='collection.enqueue', target=str(run.id))
        return Response({'id': str(run.id), 'status': run.status}, status=202)
    return Response([{'id': str(r.id), 'sourceId': r.source_id, 'status': r.status, 'count': r.count, 'error': r.error,
                      'createdAt': r.created_at.isoformat()} for r in CollectionRun.objects.order_by('-created_at')[:50]])

@api_view(['POST'])
@authentication_classes([SessionAuth])
@permission_classes([IsAuthenticated])
def mfa_qr(request):
    import base64
    from io import BytesIO
    import qrcode
    import qrcode.image.svg
    value = request.data.get('value')
    if not isinstance(value, str) or len(value) > 1000 or not value.startswith('otpauth://totp/'):
        raise serializers.ValidationError('Configuración de autenticador inválida.')
    output = BytesIO()
    qrcode.make(value, image_factory=qrcode.image.svg.SvgPathImage).save(output)
    return Response({'image': 'data:image/svg+xml;base64,' + base64.b64encode(output.getvalue()).decode()})
