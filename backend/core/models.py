import uuid
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.functions import Lower

class User(AbstractUser):
    public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    email = models.EmailField(unique=True)
    is_ephemeral = models.BooleanField(default=False, db_index=True)
    class Meta:
        constraints = [models.UniqueConstraint(Lower('email'), name='unique_user_email_casefold')]

class Source(models.Model):
    id = models.SlugField(primary_key=True, max_length=100)
    name = models.CharField(max_length=200)
    url = models.URLField(max_length=2048, unique=True)
    city = models.CharField(max_length=100)
    platform = models.CharField(max_length=50)
    enabled = models.BooleanField(default=True)
    checked_at = models.DateTimeField(null=True, blank=True)
    last_error = models.CharField(max_length=500, blank=True)

class Event(models.Model):
    id = models.SlugField(primary_key=True, max_length=100)
    canonical_url = models.URLField(max_length=2048, unique=True)
    title = models.CharField(max_length=500)
    start = models.DateTimeField(db_index=True)
    end = models.DateTimeField(null=True, blank=True)
    city = models.CharField(max_length=100, db_index=True)
    community = models.CharField(max_length=200)
    sources = models.ManyToManyField(Source, related_name='events')
    base_data = models.JSONField(default=dict)
    data = models.JSONField(default=dict)
    published = models.BooleanField(default=False, db_index=True)
    base_published = models.BooleanField(default=False)
    is_sample = models.BooleanField(default=False)
    cover = models.JSONField(null=True, blank=True)
    translations = models.JSONField(default=dict)
    updated_at = models.DateTimeField(auto_now=True)

class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['user', 'event'], name='unique_favorite')]

class ReviewCase(models.Model):
    id = models.SlugField(primary_key=True, max_length=100)
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='reviews')
    data = models.JSONField(default=dict)
    status = models.CharField(max_length=12, choices=[('pending','pending'),('approved','approved'),('discarded','discarded')], default='pending')
    value = models.CharField(max_length=2048, blank=True)
    note = models.CharField(max_length=1000, blank=True)
    version = models.PositiveIntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)

class AuditLog(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=100)
    target = models.CharField(max_length=200)
    details = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

class ProcessingConfig(models.Model):
    id = models.PositiveSmallIntegerField(primary_key=True, default=1, editable=False)
    retrieval = models.CharField(max_length=30, default='daily')
    frequency = models.CharField(max_length=30, default='twice-weekly')
    budget = models.DecimalField(max_digits=5, decimal_places=2, default='5.00')
    version = models.PositiveIntegerField(default=1)

class CollectionRun(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source = models.ForeignKey(Source, on_delete=models.CASCADE)
    status = models.CharField(max_length=15, default='queued')
    attempts = models.PositiveSmallIntegerField(default=0)
    count = models.PositiveIntegerField(default=0)
    error = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['source'], condition=models.Q(status__in=['queued','running']), name='one_active_run_per_source')]

class Observation(models.Model):
    source = models.ForeignKey(Source, on_delete=models.CASCADE)
    fingerprint = models.CharField(max_length=64)
    data = models.JSONField(default=dict)
    observed_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['source','fingerprint'], name='unique_source_observation')]
