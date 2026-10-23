# Primera versión funcional · 0.1.0

Implementación inicial para probar en el homelab. El mock aprobado se conserva en `mock-next/` (puerto 8874). La aplicación con servidor y datos propios está en `frontend/`, `backend/` y el Compose de la raíz (puerto 8088 por defecto).

## Qué funciona

- Agenda como entrada principal; calendario mensual alternativo, fichas, fuentes originales, portadas automáticas y logos locales. Las cuatro hojas de estilo de las tarjetas aprobadas permanecen idénticas.
- Catálogo en PostgreSQL, relaciones evento/fuentes, observaciones, revisiones y auditoría. Ningún selector del navegador concede privilegios.
- Sesiones Django en base de datos; cookies HttpOnly, CSRF, permisos de servidor y registro público cerrado por defecto. Cuenta administradora provisionada desde consola; perfil local opcional con accesos fijos y registro temporal para pruebas.
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

Abrir `http://127.0.0.1:8088/`, entrar con la cuenta creada y acceder a Administración desde Mi cuenta. Si el servidor exige verificación en dos pasos, su puerta de acceso lleva a la configuración específica de administración (`/admin/acceso`). Los campos de contraseña ya son reales. Los usuarios normales no obtienen administración.

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

Guardados reúne toda la selección en una sola pantalla, con búsqueda, localidad y comunidad propias, y periodos Todos, Próximos y Pasados. Próximos incluye jornadas en curso; Pasados usa la fecha de finalización en Europe/Madrid. Los próximos se ordenan de más cercano a más lejano y los pasados de más reciente a más antiguo. Las fichas de esta colección se distribuyen en dos columnas en escritorio y una en móvil/tablet; integran fecha, portada, resumen, etiquetas, lugar, horario, entrada y fuentes. El próximo encuentro destaca de forma discreta. La ayuda de almacenamiento está en un desplegable; periodo, localidad y comunidad están recogidos dentro de Filtros. Al quitar un marcador se actualizan la lista y los contadores, conservando el comportamiento local o de cuenta descrito arriba.

Agenda conserva las tarjetas aprobadas. Los accesos Buscar y Filtros están antes de los destacados; al confirmar búsqueda o filtros, la selección destacada se oculta por debajo de esos controles. El carrusel solo muestra eventos próximos o en curso, mantiene su altura al alternar portadas y ofrece accesos a otros destacados en escritorio. Si la selección editorial no contiene eventos vigentes, usa los próximos por fecha. La entrada predeterminada muestra exclusivamente Próximos (incluidos eventos en curso); no existe una opción Todos que mezcle el futuro con el histórico. Un selector con contadores separa Próximos y Archivo. Próximos se ordena de más cercano a más lejano y permite Desde hoy, Próximos 7 días y Próximos 30 días. Archivo contiene exclusivamente los encuentros finalizados, del más reciente al más antiguo, con selector de mes/año según la fecha de inicio; no muestra destacados. Ambos listados se agrupan por mes y año conservando las tarjetas. Los contadores de apartado responden a búsqueda, localidad y comunidad; el contador del listado refleja también las fechas elegidas. Cambiar de apartado conserva búsqueda/localidad/comunidad y limpia la selección temporal del otro apartado. Limpiar filtros conserva el apartado elegido, y pulsar el apartado ya activo conserva sus filtros. `periodo=pasados` abre Archivo y `archivo=AAAA-MM` filtra su mes; `periodo=7|30` limita próximos. Los enlaces antiguos `periodo=todos|proximos` muestran únicamente próximos; los valores inválidos usan el valor predeterminado de su apartado. Recarga y Atrás/Adelante recuperan selección y filtros. Las ventanas incluyen hoy y seis o veintinueve días más, respectivamente; la fecha de fin en Europe/Madrid separa próximos de archivo y la medianoche es exclusiva, como en Calendario y Guardados. Si no quedan próximos, se muestra un estado vacío con acceso al archivo cuando hay resultados anteriores. `node tools/check_agenda.cjs` verifica composición, carrusel, filtros, orden, periodos, casos vacíos y GL/ES en ambos temas; las evidencias quedan en `output/agenda-redesign/`. Calendario sigue mostrando todos los encuentros del mes y permite guardarlos desde las fichas del día. Al alternar entre Agenda y Calendario se mantienen búsqueda (`q`), localidad (`ciudad`), comunidad (`comunidad`) y mes (`mes=AAAA-MM`). Los filtros de Guardados pertenecen únicamente a su colección y no se trasladan a las otras pantallas. La búsqueda confirmada reemplaza la entrada del historial y la aplicación de filtros y los cambios de periodo y mes permiten Atrás/Adelante.

Calendario integra la navegación de mes, la cuadrícula y el panel del día en un mismo tablero. Al entrar selecciona un día con eventos: el próximo disponible, o el último si ese mes ya pasó. Una selección expresa puede mostrar días vacíos; Hoy vuelve a la fecha actual. Los meses sin encuentros ofrecen un salto a otro mes con resultados cuando existe. Los eventos que terminan a medianoche no ocupan el día siguiente.

Las celdas muestran hasta dos convocatorias; los días más concurridos muestran una y una acción con el número restante. El inspector conserva portada, resumen, horario, lugar, entrada, avisos, guardado y fuentes; en escritorio permite recorrer los días concurridos con desplazamiento propio. En móvil, las marcas de las comunidades y el contador sustituyen los títulos dentro de las celdas; los enlaces Ver día seleccionado y Volver al mes facilitan el desplazamiento. Los filtros de localidad y comunidad se despliegan desde Filtros. `node tools/check_calendar.cjs` valida meses de cuatro a seis semanas, días concurridos, jornadas múltiples, medianoche, teclado, historial y ambas lenguas/temas; sus evidencias quedan en `output/calendar-redesign/`.

Los enlaces anteriores `/?guardados=1` y `/calendario?guardados=1` llevan a `/guardados`, conservando búsqueda, localidad y comunidad. Las variantes `/guardados?vista=calendario&mes=...` también terminan en la colección, sin una segunda vista de calendario. La variante pública `/?vista=calendario&mes=...` sigue llevando al calendario del mes elegido.

`node tools/check_navigation.cjs` comprueba navegación independiente, aislamiento de filtros, clasificación temporal, historial, enlaces anteriores, guardado y retirada, estados vacíos y GL/ES con ambos temas. Las evidencias quedan en `output/navigation/`.

## Búsqueda y filtros bajo demanda

Agenda, Calendario, Guardados, Fuentes y Revisión comparten el componente `CollectionTools`. La vista inicial solo presenta dos accesos separados: Buscar (lupa en móvil) y Filtros. No hay campos ni selectores de búsqueda/filtro abiertos inicialmente, ni al recargar un enlace con restricciones. Próximos/Archivo sigue visible como navegación de Agenda. En Calendario permanecen mes, Hoy y flechas; pulsar el nombre del mes abre su selector.

Buscar abre un panel dedicado y enfoca el campo. Enter o Buscar confirma el texto, actualiza resultados y cierra. Filtros permite editar varias opciones en borrador; Aplicar filtros las confirma juntas y cierra. Restablecer solo reinicia el borrador. Cerrar con la cruz, Escape o el fondo descarta cambios sin aplicar y conserva lo ya aplicado. El diálogo retiene el foco mientras está abierto, lo devuelve al acceso de origen al cerrar y bloquea el desplazamiento del fondo. En escritorio flota junto al acceso; en móvil se abre desde abajo, con área interna desplazable y animación reducida cuando procede.

La búsqueda activa tiene su propio indicador; Filtros muestra únicamente el número de criterios no predeterminados. Un resumen compacto muestra hasta tres chips eliminables y un acceso al resto; Limpiar todo borra búsqueda y restricciones. En Agenda se conserva Próximos o Archivo al limpiar. Las tarjetas y los mecanismos de guardado no cambian.

Fechas de Agenda y periodo de Guardados se incluyen dentro de Filtros. Fuentes recoge localidad, plataforma, estado y orden; Revisión recoge el estado y añade búsqueda de casos. Los filtros administrativos se conservan en su URL pero no se trasladan a la agenda pública; Guardados sigue siendo una colección independiente. Los parámetros existentes de descubrimiento y sus enlaces anteriores se conservan.

`node tools/check_collection_tools.cjs` valida controles inicialmente recogidos, borradores y confirmación, cierre, teclado/foco, chips, enlaces, historial, selector de mes y las cinco pantallas en 320–1440 px. La administración usa respuestas aisladas de navegador; no crea usuarios con permisos ni modifica fuentes o revisiones reales. Capturas y resultados en `output/collection-tools/`. Las suites existentes de Agenda, Calendario y navegación usan `tools/browse_controls.cjs` para interactuar mediante estos accesos.

## Espacio personal

Mi cuenta (`/cuenta`) tiene una presentación para visitantes con acceso al registro cuando esté habilitado, inicio de sesión y una vista de sus guardados locales. Explica que la cuenta permite consultar la colección desde otros dispositivos, conservando la posibilidad de guardar sin cuenta. El botón de cuenta de la cabecera lleva a esta pantalla tanto en escritorio como en móvil; el formulario de login sigue centrado en `/login`.

Al entrar se muestran identidad, correo, número de encuentros guardados y número por venir. La colección destaca el próximo guardado y presenta hasta otros dos próximos. Si solo hay históricos, se identifica como archivo y los eventos como pasados; no mezcla ambos periodos. Se puede abrir una ficha, la colección completa o la agenda. Los contadores usan únicamente eventos publicados. Los guardados del navegador se añaden mediante una acción expresa que conserva los favoritos existentes y la selección local.

Idioma y apariencia son controles reales compartidos con la cabecera y se conservan en este navegador, mediante la cookie de idioma y el almacenamiento local de tema. No se anuncian como preferencias sincronizadas por cuenta. Google/GitHub solo aparecen si están configurados. La entrada a Administración solo se muestra al perfil administrador.

La configuración de dos pasos ya no forma parte del espacio personal. La política opcional de administración del servidor conserva su flujo en `/admin/acceso`, disponible solo para administradores; el desafío de login de cuentas que ya tengan TOTP sigue funcionando. En el perfil local actual no se exige MFA.

`node tools/check_account.cjs` recorre registro real, colección vacía, importación expresa, enlaces, próximos/archivo, preferencias y recarga, cierre de sesión, registro cerrado y permisos. Comprueba GL/ES, ambos temas y anchuras de 320–1440 px. Solo elimina su propia cuenta QA; las capturas y resultados quedan en `output/account-redesign/`.

## Consulta de fuentes y gasto

`COLLECTION_ENABLED=false` es el valor inicial. Al habilitarlo y recrear backend/worker, el programador comprueba cada hora si toca descargar. La configuración permite una consulta diaria o lunes/jueves. El botón Consultar en Fuentes encola una lectura manual. Solo se permiten los dominios de `FETCH_ALLOWED_HOSTS`; añadir una fuente nueva no amplía esa lista automáticamente.

El conector es deliberadamente conservador y limitado: hasta seis fichas enlazadas por consulta, HTML/JSON-LD y estado estructurado GDG. Una fuente que necesite JavaScript, otro formato o tenga más páginas puede quedar parcial. Los errores figuran en la fuente y en la API de ejecuciones. No se ha demostrado en esta entrega una lectura completa y actual de los trece sitios reales.

**No hay adaptador LLM ni llamadas de pago en 0.1.** Frecuencia y presupuesto quedan guardados para la siguiente fase. No se promete que guardar un presupuesto implemente una reserva transaccional. La priorización actual es por proximidad de fecha. Traducción automática de contenido nuevo, deduplicación semántica, extracción más amplia y selección/descarga de imágenes nuevas siguen pendientes. Las portadas automáticas cubren los eventos que no tienen imagen local verificada.

## Acceso social y recuperación

El registro por correo/contraseña está disponible en `/registro` únicamente cuando `ALLOW_REGISTRATION=true`; el valor predeterminado es `false`, y el servidor también rechaza las altas cuando está cerrado. Login enlaza al registro solo cuando está habilitado. Las altas crean usuarios normales, nunca administradores, e inician sesión al completarse. Se valida la contraseña en el servidor y se exige repetirla en la interfaz. Con la configuración actual de pruebas no se envían verificaciones por correo. La apertura de registro público con verificación de email sigue pendiente de configurar SMTP y validar ese flujo.

Para las pruebas locales en este equipo se habilita expresamente `ALLOW_REGISTRATION=true` y `REQUIRE_ADMIN_MFA=false`, manteniendo `APP_BIND=127.0.0.1`. Esto permite recorrer la administración con una cuenta de pruebas sin configurar TOTP previamente. `.env.example` conserva registro cerrado y MFA obligatorio para administración, con configuración independiente del espacio personal en `/admin/acceso`. El perfil explícito `LOCAL_TEST_ACCOUNTS=true` habilita acceso por usuario o correo. El comando `python manage.py seed_local_users` prepara `admin/admin` (administración) y `user/user` (usuario normal), con nombres visibles iguales a sus usuarios. Reutiliza las dos cuentas reservadas de pruebas y conserva sus identificadores, sesiones y datos; rechaza conflictos con otras cuentas. Las contraseñas cortas se asignan únicamente a estas fixtures desde consola; el registro normal mantiene la validación de longitud y fortaleza. Este perfil está desactivado por defecto. Antes de reutilizar la base de pruebas fuera de ese entorno, hay que sustituir o eliminar esas cuentas. Los secretos del despliegue siguen fuera de Git.

Con ese perfil local, las cuentas nuevas creadas mediante `/registro` se marcan en el servidor como temporales (`User.is_ephemeral`). Duran durante esa ejecución del backend: cerrar sesión, recargar o cerrar el navegador no las borra. Antes de iniciar Gunicorn, el contenedor ejecuta `prepare_local_environment`: prepara los dos accesos fijos y elimina las cuentas temporales de la ejecución anterior, sus sesiones autenticadas y sus relaciones, incluidos favoritos y autenticadores. Los eventos, fuentes y cuentas sin esa marca se conservan. Las cuentas anteriores a este cambio no se convierten automáticamente en temporales.

Reiniciar o recrear el contenedor `backend` inicia una ejecución nueva; arrancar de nuevo el conjunto detenido también. Reiniciar solo el worker, el frontend o un proceso hijo de Gunicorn no provoca la limpieza. Tampoco se ejecuta al lanzar migraciones, pruebas o comandos de gestión. Fuera de `LOCAL_TEST_ACCOUNTS=true`, el registro crea cuentas persistentes y el arranque no prepara fixtures ni borra usuarios. Los guardados anónimos del navegador mantienen su funcionamiento independiente.

`node tools/check_temporary_accounts.cjs` verifica un alta real, guardado, logout/login, reinicio de worker sin borrado y reinicio real de backend con eliminación de la cuenta, sus sesiones y sus credenciales. Comprueba también la conservación del catálogo y de las cuentas fijas, sus sesiones y sus favoritos. Requiere el perfil local y eventos de muestra; reinicia esos dos servicios del proyecto. Resultado en `output/temporary-accounts/checks.json`.

`node tools/check_registration.cjs` prueba registro, confirmación, validación, sesión, logout/login, permisos de usuario normal y acceso de la cuenta administradora local, sin cambiar fuentes o revisiones. Solo crea y elimina sus propias cuentas QA. La suite Django cubre también CSRF, registro cerrado y rechazo de intentos de asignarse permisos administrativos.

Google/GitHub son opcionales: sin credenciales sus botones no aparecen. Configurar `GOOGLE_CLIENT_ID/SECRET` o `GITHUB_CLIENT_ID/SECRET`, registrar los callbacks oficiales `/accounts/google/login/callback/` y `/accounts/github/login/callback/` para el origen elegido y comprobar el flujo real. Una cuenta existente puede vincular su identidad desde Mi cuenta. No se enlazan cuentas automáticamente por coincidencia de email y el registro social permanece cerrado. Esta entrega no ha probado callbacks con aplicaciones reales ni ha contratado servicios externos.

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

Verificado: construcción de imágenes, TypeScript, 43 pruebas Django sobre PostgreSQL real, cuenta/contraseña/TOTP, permisos, CSRF, guardados y fuentes persistentes, revisión, calendario, GL/ES y ambos temas. Guardados sin cuenta: reinicio real de Chrome, pestañas, detalle/calendario, importación expresa, separación entre cuenta y navegador, errores de almacenamiento y vista móvil de 320/390 px. Operación (validación inicial de 0.1): tarea encolada mientras worker estaba parado y ejecutada después; recreación de PostgreSQL conservando volumen; autenticación bloqueada y catálogo público disponible con Redis detenido; seis healthchecks.

Pendiente de la siguiente fase: despliegue y medición en el LXC real, TLS, alta de la cuenta propietaria definitiva, pruebas OAuth reales, integración/evaluación LLM con reservas de presupuesto, traducciones nuevas, conectores completos, administración editorial ampliada, política de copias externa y validación de carga. Esta versión no se declara preparada para exposición pública.

## Referencias utilizadas

- [Django 5.2](https://docs.djangoproject.com/en/5.2/).
- [Instalación de allauth headless](https://docs.allauth.org/en/latest/headless/installation.html).
- [Límites de acceso de allauth](https://docs.allauth.org/en/latest/account/rate_limits.html).
- [Configuración de Django Q2](https://django-q2.readthedocs.io/en/master/configure.html).

Las versiones exactas de Python están en `backend/requirements.lock`; Next/React/Tailwind en `frontend/pnpm-lock.yaml`; las bases de imagen están fijadas por digest en los Dockerfiles y Compose. Las fuentes consultadas no sustituyen las pruebas del conjunto integrado.
