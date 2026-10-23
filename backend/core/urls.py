from django.urls import path
from . import api
urlpatterns = [path('health/', api.health), path('session/', api.session), path('catalog/', api.catalog),
               path('account/mfa-qr/', api.mfa_qr), path('favorites/import/', api.import_favorites),
               path('favorites/<slug:event_id>/', api.favorite), path('attendance/<slug:event_id>/', api.attendance), path('admin/sources/', api.sources),
               path('admin/sources/<slug:source_id>/', api.source), path('admin/reviews/', api.reviews),
               path('admin/reviews/<slug:case_id>/', api.review), path('admin/configuration/', api.configuration),
               path('admin/collections/', api.collections)]
