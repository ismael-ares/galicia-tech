# Primera versión funcional · 0.1.0

Implementación inicial para probar en el homelab. El mock aprobado se conserva en `mock-next/` (puerto 8874). La aplicación con servidor y datos propios está en `frontend/`, `backend/` y el Compose de la raíz (puerto 8088 por defecto).

## Qué funciona

- Agenda como entrada principal; calendario mensual alternativo, fichas, fuentes originales, portadas automáticas y logos locales. Las cuatro hojas de estilo de las tarjetas aprobadas permanecen idénticas.
- Catálogo en PostgreSQL, relaciones evento/fuentes, observaciones, revisiones y auditoría. Ningún selector del navegador concede privilegios.
- Sesiones Django en base de datos; cookies HttpOnly, CSRF, permisos de servidor y registro público cerrado. Cuenta propietaria creada desde consola, sin credenciales por defecto.
- django-allauth headless: contraseña, reautenticación antes de configurar TOTP, QR local, secretos MFA cifrados, códigos de recuperación y desafío TOTP en accesos posteriores. Administración exige TOTP por defecto. Sesión limitada a 30 minutos de inactividad y 8 horas de duración máxima.
- Guardados por cuenta, creación/pausa de fuentes desde la interfaz, revisión con comprobación de versión para evitar sobrescribir otra decisión, configuración persistente con autoridad web o YAML. Pausar una fuente conserva los eventos publicados.
- Cola Q2 persistida en PostgreSQL; Redis dedicado a caché y límites de acceso. El limitador adicional usa incremento atómico con TTL y bloquea autenticaciones cuando Redis no está disponible.
- Consulta estructurada básica de fuentes HTTPS permitidas: GDG/JSON-LD/enlaces a fichas. Descargas con tamaño/tiempo acotados, IP pública comprobada y conexión TLS fijada a la dirección resuelta; las redirecciones se vuelven a comprobar. Cada observación nueva pasa por revisión. No encontrar un evento no lo cancela.
- Configuración GL/ES y claro/oscuro. Las traducciones de la muestra están asociadas a los textos originales; un texto cambiado no reutiliza una traducción anterior.

## Arranque en Debian 13

Requiere Docker Engine con Compose y Python 3 para generar secretos. El LXC debe tener ya comprobada la compatibilidad de Docker con su configuración Proxmox.

```sh
python3 tools/init_env.py
# Revisar .env antes de arrancar. El comando no sobrescribe archivos existentes.
sh infra/start.sh

docker compose exec backend python manage.py create_owner --email tu@correo.example
```

Abrir `http://127.0.0.1:8088/`, entrar con la cuenta creada y configurar la verificación en dos pasos en Mi cuenta. Los campos de contraseña ya son reales. Los usuarios normales no obtienen administración.

Para acceder por LAN/WireGuard, configurar `APP_BIND` con la interfaz del LXC o `0.0.0.0`, añadir la IP/nombre a `ALLOWED_HOSTS` y el origen completo a `CSRF_TRUSTED_ORIGINS`, y recrear los servicios. PostgreSQL, Redis, Django y Next no publican puertos individuales. Este perfil inicial usa HTTP local y `COOKIE_SECURE=false`; `check --deploy` mantiene los avisos de HTTPS/HSTS/cookies correspondientes a este perfil. X-Frame-Options se aplica en el gateway Nginx, aunque Django señala la ausencia de su middleware equivalente; TLS/Traefik requiere su configuración específica antes de publicar en Internet. El gateway sobrescribe las cabeceras de proxy y no confía en cabeceras aportadas por cualquier cliente.

`infra/start.sh` construye imágenes secuencialmente, espera las dependencias, migra una vez, incorpora únicamente las trece fuentes seleccionadas sin sobrescribir cambios, registra el programador y espera salud de los seis servicios. No requiere GitHub ni un registro remoto.

La base arranca sin eventos inventados. Para cargar explícitamente las convocatorias históricas con las que se diseñó el mock:

```sh
docker compose exec backend python manage.py import_sample
```

La web muestra entonces «Datos de muestra · octubre 2026». El importador conserva revisiones y cambios de fuentes existentes. En la prueba local del desarrollo se ha cargado esta muestra; las cuentas temporales utilizadas por las pruebas se eliminan.

## Consulta de fuentes y gasto

`COLLECTION_ENABLED=false` es el valor inicial. Al habilitarlo y recrear backend/worker, el programador comprueba cada hora si toca descargar. La configuración permite una consulta diaria o lunes/jueves. El botón Consultar en Fuentes encola una lectura manual. Solo se permiten los dominios de `FETCH_ALLOWED_HOSTS`; añadir una fuente nueva no amplía esa lista automáticamente.

El conector es deliberadamente conservador y limitado: hasta seis fichas enlazadas por consulta, HTML/JSON-LD y estado estructurado GDG. Una fuente que necesite JavaScript, otro formato o tenga más páginas puede quedar parcial. Los errores figuran en la fuente y en la API de ejecuciones. No se ha demostrado en esta entrega una lectura completa y actual de los trece sitios reales.

**No hay adaptador LLM ni llamadas de pago en 0.1.** Frecuencia y presupuesto quedan guardados para la siguiente fase. No se promete que guardar un presupuesto implemente una reserva transaccional. La priorización actual es por proximidad de fecha. Traducción automática de contenido nuevo, deduplicación semántica, extracción más amplia y selección/descarga de imágenes nuevas siguen pendientes. Las portadas automáticas cubren los eventos que no tienen imagen local verificada.

## Acceso social y recuperación

Google/GitHub son opcionales: sin credenciales sus botones no aparecen. Configurar `GOOGLE_CLIENT_ID/SECRET` o `GITHUB_CLIENT_ID/SECRET`, registrar los callbacks oficiales `/accounts/google/login/callback/` y `/accounts/github/login/callback/` para el origen elegido y comprobar el flujo real. Una cuenta existente puede vincular su identidad desde Mi cuenta. No se enlazan cuentas automáticamente por coincidencia de email y el registro público permanece cerrado. Esta entrega no ha probado callbacks con aplicaciones reales ni ha contratado servicios externos.

No hay envío SMTP ni restablecimiento por correo anunciado. Recuperación de la persona propietaria desde el servidor:

```sh
docker compose exec backend python manage.py recover_owner --email tu@correo.example
# Solo si se ha perdido también el autenticador:
docker compose exec backend python manage.py recover_owner --email tu@correo.example --reset-mfa
```

Requiere contraseña nueva válida, confirma expresamente la retirada de MFA si se solicita, revoca sesiones y registra la recuperación. Conservar la clave MFA de `.env` junto a los respaldos cifrados del despliegue.

## Copias, actualización y pruebas

```sh
sh infra/backup.sh /ruta/privada/fuera-del-lxc
# Guardar .env y configuration de forma cifrada fuera del servidor.
# Antes de actualizar: copia, construir, migrar una sola vez y recrear servicios.
docker compose run --rm backend python manage.py test core.tests --noinput
```

Se restauró una copia `pg_dump` en otra base de datos temporal y se comprobó el número de eventos. Esto valida el mecanismo local; no configura aún la copia diaria externa ni su retención.

Evidencias locales en `output/v1/`: resultados de navegador y operación, capturas y copia de la prueba de restauración. Las suites de navegador/operación modifican la muestra y reinician servicios de este proyecto: ejecutarlas únicamente en un despliegue de prueba.

Verificado: construcción de imágenes, TypeScript, 23 pruebas Django sobre PostgreSQL real, cuenta/contraseña/TOTP, permisos, CSRF, guardados y fuentes persistentes, revisión, calendario, GL/ES y ambos temas. Operación: tarea encolada mientras worker estaba parado y ejecutada después; recreación de PostgreSQL conservando volumen; autenticación bloqueada y catálogo público disponible con Redis detenido; seis healthchecks.

Pendiente de la siguiente fase: despliegue y medición en el LXC real, TLS, alta de la cuenta propietaria definitiva, pruebas OAuth reales, integración/evaluación LLM con reservas de presupuesto, traducciones nuevas, conectores completos, administración editorial ampliada, política de copias externa y validación de carga. Esta versión no se declara preparada para exposición pública.

## Referencias utilizadas

- [Django 5.2](https://docs.djangoproject.com/en/5.2/).
- [Instalación de allauth headless](https://docs.allauth.org/en/latest/headless/installation.html).
- [Límites de acceso de allauth](https://docs.allauth.org/en/latest/account/rate_limits.html).
- [Configuración de Django Q2](https://django-q2.readthedocs.io/en/master/configure.html).

Las versiones exactas de Python están en `backend/requirements.lock`; Next/React/Tailwind en `frontend/pnpm-lock.yaml`; las bases de imagen están fijadas por digest en los Dockerfiles y Compose. Las fuentes consultadas no sustituyen las pruebas del conjunto integrado.
