from django.urls import include, path
urlpatterns = [path('api/v1/', include('core.urls')), path('_allauth/', include('allauth.headless.urls')),
               path('accounts/', include('allauth.urls'))]
