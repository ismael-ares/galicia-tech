# Historial de cambios

## v0.2 · 23 de octubre de 2026

Versión interna: `0.2.0`. Reúne las mejoras de `feat/mejoras-v0.1` sobre la aplicación inicial.

- Agenda con próximos y archivo separados, destacados y filtros temporales coherentes.
- Calendario mensual rediseñado con inspector del día y navegación independiente.
- Guardados como colección propia; almacenamiento local sin cuenta e importación expresa a una cuenta.
- Búsqueda y filtros separados, cerrados por defecto en las distintas colecciones.
- Portal personal con próximos guardados, pasados, asistencias reversibles y estadísticas reales.
- Registro configurable y perfil local con `admin/admin`, `user/user` y cuentas registradas temporales que se eliminan al reiniciar el backend.
- Menú de Ajustes con cuenta, preferencias, administración según permisos y acceso unificado para iniciar sesión o registrarse. Preferencias de idioma y apariencia disponibles sin cuenta.
- Fuentes y política de la aplicación gestionadas exclusivamente desde `configuration/app.yaml`, con validación, perfiles, sincronización transaccional y recarga ordenada. El panel muestra fuentes y parámetros en solo lectura.
- Versiones de la interfaz, API e imágenes Docker actualizadas; acceso local fijo en `http://127.0.0.1:8088/`.

Continúan pendientes la integración LLM, los callbacks OAuth con credenciales reales, el despliegue en el LXC y la preparación para publicación en Internet. El entorno conserva datos de muestra y no se presenta como una entrega lista para producción pública.

## 0.1 · Base inicial

Aplicación Dockerizada con Next.js, Django, PostgreSQL, Redis, Q2 y Nginx; catálogo, sesiones y permisos de servidor, revisión editorial y primeras pantallas funcionales.
