# Primera versión funcional · 0.1.0

Implementación inicial para probar en el homelab. El mock aprobado se conserva en `mock-next/` (puerto 8874). La aplicación con servidor y datos propios está en `frontend/`, `backend/` y el Compose de la raíz (puerto 8088 por defecto).

## Qué funciona

- Agenda como entrada principal; calendario mensual alternativo, fichas, fuentes originales, portadas automáticas y logos locales. Las cuatro hojas de estilo de las tarjetas aprobadas permanecen idénticas.
- Catálogo en PostgreSQL, relaciones evento/fuentes, observaciones, revisiones y auditoría. Ningún selector del navegador concede privilegios.
- Sesiones Django en base de datos; cookies HttpOnly, CSRF, permisos de servidor y registro público cerrado. Cuenta propietaria creada desde consola, sin credenciales por defecto.
- django-allauth headless: contraseña, reautenticación antes de configurar TOTP, QR local, secretos MFA cifrados, códigos de recuperación y desafío TOTP en accesos posteriores. Administración exige TOTP por defecto. Sesión limitada a 30 minutos de inactividad y 8 horas de duración máxima.
- Guardados sin cuenta en el navegador o asociados a una cuenta en el servidor, creación/pausa de fuentes desde la interfaz, revisión con comprobación de versión para evitar sobrescribir otra decisión, configuración persistente con autoridad web o YAML. Pausar una fuente conserva los eventos publicados.
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

## Guardados sin iniciar sesión

Los visitantes guardan únicamente identificadores de eventos en `localStorage`, con la clave versionada `galicia-tech-guest-favorites-v1`. La selección persiste al cerrar y volver a abrir el navegador y se actualiza entre pestañas del mismo origen. Agenda, detalle y calendario comparten esta selección; guardar o quitar un evento como visitante no escribe favoritos en el servidor.

Los guardados pertenecen a ese navegador y origen (protocolo, dirección y puerto). Borrar los datos del sitio los elimina; en navegación privada su duración depende del navegador. No se almacena el catálogo completo para consultarlo sin conexión. Si el navegador deniega el almacenamiento, se avisa y el marcador no aparenta haberse guardado.

Al iniciar sesión se muestran los guardados de la cuenta, mantenidos en PostgreSQL. No se sube automáticamente la selección local: en la pantalla Guardados aparece «Añadir guardados del navegador» para copiar expresamente los eventos publicados que falten. La operación autenticada `POST /api/v1/favorites/import/` es aditiva, transaccional, protegida por CSRF e idempotente. La lista local se conserva al importar y al cerrar sesión; los favoritos privados de la cuenta nunca se copian al almacenamiento local.

Prueba de navegador específica (requiere Playwright y una muestra local cargada): `node tools/check_guest_favorites.cjs`. Admite `PLAYWRIGHT_MODULE`, `PLAYWRIGHT_CHANNEL`, `DOCKER_BIN` y `APP_URL`. Crea y elimina una cuenta normal temporal, sin modificar cuentas existentes. Las capturas y el resultado quedan en `output/guest-favorites/`.

## Agenda, calendario y guardados

La aplicación ofrece Agenda (`/`, entrada predeterminada), Calendario (`/calendario`) y una colección independiente de Guardados (`/guardados`). Las tres secciones están integradas en la misma barra de navegación, con contador de guardados y una superficie que se desplaza a la sección activa. No existe un filtro global de guardados. En móvil, la barra inferior reúne Agenda, Calendario, Guardados y Mi cuenta. La administración sigue dentro de Mi cuenta y requiere permisos.

Guardados reúne toda la selección en una sola pantalla, con búsqueda, localidad y comunidad propias, y periodos Todos, Próximos y Pasados. Próximos incluye jornadas en curso; Pasados usa la fecha de finalización en Europe/Madrid. Los próximos se ordenan de más cercano a más lejano y los pasados de más reciente a más antiguo. Las fichas de esta colección se distribuyen en dos columnas en escritorio y una en móvil/tablet; integran fecha, portada, resumen, etiquetas, lugar, horario, entrada y fuentes. El próximo encuentro destaca de forma discreta. La ayuda de almacenamiento está en un desplegable y los filtros de localidad/comunidad se abren desde Filtros. Al quitar un marcador se actualizan la lista y los contadores, conservando el comportamiento local o de cuenta descrito arriba.

Agenda conserva las tarjetas aprobadas. La búsqueda y los periodos están antes de los destacados; al filtrar, la selección destacada se oculta por debajo de esos controles sin desplazar el buscador. El carrusel solo muestra eventos próximos o en curso, mantiene su altura al alternar portadas y ofrece accesos a otros destacados en escritorio. Si la selección editorial no contiene eventos vigentes, usa los próximos por fecha. La entrada predeterminada muestra exclusivamente Próximos (incluidos eventos en curso); no existe una opción Todos que mezcle el futuro con el histórico. Un selector con contadores separa Próximos y Archivo. Próximos se ordena de más cercano a más lejano y permite Desde hoy, Próximos 7 días y Próximos 30 días. Archivo contiene exclusivamente los encuentros finalizados, del más reciente al más antiguo, con selector de mes/año según la fecha de inicio; no muestra destacados. Ambos listados se agrupan por mes y año conservando las tarjetas. Los contadores de apartado responden a búsqueda, localidad y comunidad; el contador del listado refleja también las fechas elegidas. Cambiar de apartado conserva búsqueda/localidad/comunidad y limpia la selección temporal del otro apartado. Limpiar filtros conserva el apartado elegido, y pulsar el apartado ya activo conserva sus filtros. `periodo=pasados` abre Archivo y `archivo=AAAA-MM` filtra su mes; `periodo=7|30` limita próximos. Los enlaces antiguos `periodo=todos|proximos` muestran únicamente próximos; los valores inválidos usan el valor predeterminado de su apartado. Recarga y Atrás/Adelante recuperan selección y filtros. Las ventanas incluyen hoy y seis o veintinueve días más, respectivamente; la fecha de fin en Europe/Madrid separa próximos de archivo y la medianoche es exclusiva, como en Calendario y Guardados. Si no quedan próximos, se muestra un estado vacío con acceso al archivo cuando hay resultados anteriores. `node tools/check_agenda.cjs` verifica composición, carrusel, filtros, orden, periodos, casos vacíos y GL/ES en ambos temas; las evidencias quedan en `output/agenda-redesign/`. Calendario sigue mostrando todos los encuentros del mes y permite guardarlos desde las fichas del día. Al alternar entre Agenda y Calendario se mantienen búsqueda (`q`), localidad (`ciudad`), comunidad (`comunidad`) y mes (`mes=AAAA-MM`). Los filtros de Guardados pertenecen únicamente a su colección y no se trasladan a las otras pantallas. La búsqueda reemplaza la entrada del historial y los cambios de periodo y mes permiten Atrás/Adelante.

Calendario integra la navegación de mes, la cuadrícula y el panel del día en un mismo tablero. Al entrar selecciona un día con eventos: el próximo disponible, o el último si ese mes ya pasó. Una selección expresa puede mostrar días vacíos; Hoy vuelve a la fecha actual. Los meses sin encuentros ofrecen un salto a otro mes con resultados cuando existe. Los eventos que terminan a medianoche no ocupan el día siguiente.

Las celdas muestran hasta dos convocatorias; los días más concurridos muestran una y una acción con el número restante. El inspector conserva portada, resumen, horario, lugar, entrada, avisos, guardado y fuentes; en escritorio permite recorrer los días concurridos con desplazamiento propio. En móvil, las marcas de las comunidades y el contador sustituyen los títulos dentro de las celdas; los enlaces Ver día seleccionado y Volver al mes facilitan el desplazamiento. Los filtros de localidad y comunidad se despliegan desde Filtros. `node tools/check_calendar.cjs` valida meses de cuatro a seis semanas, días concurridos, jornadas múltiples, medianoche, teclado, historial y ambas lenguas/temas; sus evidencias quedan en `output/calendar-redesign/`.

Los enlaces anteriores `/?guardados=1` y `/calendario?guardados=1` llevan a `/guardados`, conservando búsqueda, localidad y comunidad. Las variantes `/guardados?vista=calendario&mes=...` también terminan en la colección, sin una segunda vista de calendario. La variante pública `/?vista=calendario&mes=...` sigue llevando al calendario del mes elegido.

`node tools/check_navigation.cjs` comprueba navegación independiente, aislamiento de filtros, clasificación temporal, historial, enlaces anteriores, guardado y retirada, estados vacíos y GL/ES con ambos temas. Las evidencias quedan en `output/navigation/`.

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

Verificado: construcción de imágenes, TypeScript, 28 pruebas Django sobre PostgreSQL real, cuenta/contraseña/TOTP, permisos, CSRF, guardados y fuentes persistentes, revisión, calendario, GL/ES y ambos temas. Guardados sin cuenta: reinicio real de Chrome, pestañas, detalle/calendario, importación expresa, separación entre cuenta y navegador, errores de almacenamiento y vista móvil de 320/390 px. Operación (validación inicial de 0.1): tarea encolada mientras worker estaba parado y ejecutada después; recreación de PostgreSQL conservando volumen; autenticación bloqueada y catálogo público disponible con Redis detenido; seis healthchecks.

Pendiente de la siguiente fase: despliegue y medición en el LXC real, TLS, alta de la cuenta propietaria definitiva, pruebas OAuth reales, integración/evaluación LLM con reservas de presupuesto, traducciones nuevas, conectores completos, administración editorial ampliada, política de copias externa y validación de carga. Esta versión no se declara preparada para exposición pública.

## Referencias utilizadas

- [Django 5.2](https://docs.djangoproject.com/en/5.2/).
- [Instalación de allauth headless](https://docs.allauth.org/en/latest/headless/installation.html).
- [Límites de acceso de allauth](https://docs.allauth.org/en/latest/account/rate_limits.html).
- [Configuración de Django Q2](https://django-q2.readthedocs.io/en/master/configure.html).

Las versiones exactas de Python están en `backend/requirements.lock`; Next/React/Tailwind en `frontend/pnpm-lock.yaml`; las bases de imagen están fijadas por digest en los Dockerfiles y Compose. Las fuentes consultadas no sustituyen las pruebas del conjunto integrado.
