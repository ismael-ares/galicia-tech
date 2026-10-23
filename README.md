# Galicia Tech

## Aplicación funcional v0.2

Ya existe la primera base funcional con Next.js, Django, PostgreSQL, Redis, Q2 y Nginx. Se despliega con el [Compose de la raíz](compose.yaml) y arranca en `http://127.0.0.1:8088/`. La agenda es la entrada principal. Consulta la [guía de instalación, alcance y verificación](docs/primera-version-0.1.md) antes de desplegar en el LXC.

La etiqueta `v0.2` identifica esta entrega (versión interna `0.2.0`). El [historial de cambios](CHANGELOG.md) resume las mejoras respecto a la primera versión.

Puedes guardar eventos sin iniciar sesión: se conservan en este navegador. Con una cuenta se guardan en el servidor y puedes incorporar expresamente tu selección local desde Guardados.

La navegación ofrece **Agenda**, **Calendario** y una colección independiente de **Guardados**. Mi cuenta reúne próximos encuentros, pasados guardados, asistencias y estadísticas personales. El menú **Ajustes** abre cuenta, preferencias, administración según permisos y un único acceso para iniciar sesión o registrarse.

```sh
python3 tools/init_env.py
sh infra/start.sh
docker compose exec backend python manage.py create_owner --email tu@correo.example
```

Las fuentes y la política de la aplicación se versionan en [configuration/app.yaml](configuration/app.yaml). La web muestra esas secciones en solo lectura. Consulta [cómo validar y aplicar el YAML](docs/configuracion-yaml.md); claves y contraseñas permanecen en `.env` o archivos de secretos. `APP_PROFILE=local` activa el perfil de pruebas y `production` conserva los valores de acceso predeterminados.

El mock del puerto 8874 sigue separado de la aplicación. Los apartados siguientes documentan los prototipos y las pruebas de recopilación previas. El LLM de pago, los callbacks OAuth reales y el despliegue Proxmox todavía requieren su fase de integración.

## Prototipos y evidencia previa


La referencia técnica vigente es el [plan consolidado para el homelab](docs/plan-arquitectura-homelab-2026-10-21.md), con [decisiones y evidencias verificables](docs/evidencias/arquitectura-2026-10-21/README.md). Confirma PostgreSQL y Redis, descarta RabbitMQ y aplaza GitHub Actions/cloud. Ese documento conserva el plan de partida; el estado actual se detalla en la guía de la versión v0.2 enlazada arriba.

CLI manual en Python, sin interfaz web, scheduler ni credenciales. Lee directamente las páginas públicas GDG acordadas y el grupo WordPress Coruña; en GDG utiliza el estado estructurado público de la página y ficha JSON-LD, y en Meetup enlaces visibles y JSON-LD de fichas. La conversión de fechas se presenta en Europe/Madrid. La referencia predeterminada es `2026-10-19` y puede cambiarse con `--as-of YYYY-MM-DD`.

```sh
python3 eventos_galicia.py --as-of 2026-10-19
python3 -m unittest discover -s tests -v
```

La salida real se guarda en `output/real/`; cada snapshot tiene nombre inmutable y `latest.json` apunta a la lectura más reciente. Se guarda un informe Markdown con fuentes, registro, precio y cambios. Si una página o ficha falla tras reintentos acotados, el informe lo dice y el código conserva observaciones previas afectadas. Una fuente que responde sin un evento visible produce “no observado”, nunca una cancelación. `--reuse-snapshot` permite inspeccionar una comparación sin volver a consultar internet; no constituye una segunda captura.

`tests/` contiene casos sintéticos pequeños de JSON-LD, conversión horaria, precio desconocido, clasificación por fecha, comparación y conservación ante fallos. No son evidencia de eventos reales.

No se llama a ningún LLM de pago: coste de LLM en esta prueba = 0. Esto no cubre APIs privadas, eventos renderizados exclusivamente tras iniciar sesión, CAPTCHA, feed completo de Meetup ni servicio diario. Si una fuente cambia formato o bloquea la descarga, queda anotada como fallo en vez de inferir que el evento se canceló. La extracción estructurada no valida por sí sola que todos los datos secundarios o el enlace de registro sigan vigentes; para el enlace observado de Hacktoberfest se contrasta título y fecha y se conserva como candidato inválido, sin ofrecerlo como inscripción.

## Navegar por el prototipo

**Nueva vista:** [mock Next.js + TypeScript + Tailwind](mock-next/README.md), en `http://localhost:8874` cuando su servidor esté arrancado. Incorpora las decisiones de navegación, roles de muestra, portadas, revisión y configuración. Este mock continúa aislado; la aplicación funcional está en `frontend/` y `backend/`. La versión estática anterior se conserva en el puerto 8873.

```sh
python3 -m http.server 8873 --bind 127.0.0.1 --directory mock
```

Abre `http://localhost:8873/agenda.html`. La cabecera ofrece Agenda y Mi cuenta. `cuenta.html` muestra el acceso de visitante o el perfil de usuario; únicamente el perfil administrador de muestra incorpora enlaces a gestión. El login de `login.html` es una tarjeta centrada con Google/GitHub y credenciales locales simulados. Todos esos accesos llevan al perfil ordinario. En «Vista de muestra» de Mi cuenta se puede explorar el administrador. Los parámetros `perfil=visitante`, `perfil=usuario` y `perfil=admin` solo controlan la presentación; no autentican ni autorizan usuarios reales.

La gestión reúne Resumen (`admin.html`), Fuentes (`fuentes.html`), Revisión (`revision.html`) y Ajustes (`ajustes.html`). Los contadores reflejan las preferencias y decisiones locales. Fuentes conserva búsqueda, chips y filtros combinables, ordenación y páginas de 20 elementos, logos genéricos y edición local de fuentes. Una fuente nueva o cuyo enlace cambie queda «Sin consultar». La búsqueda diaria y el acceso real siguen sin conectar.

El cambio claro/oscuro está disponible en las ocho pantallas y en las preferencias de Mi cuenta. Se conserva en `galicia-tech-theme`, sigue inicialmente el sistema y se comparte entre pestañas. La paleta usa tarjetas neutras, lila en destacados y ámbar en incertidumbre; las imágenes y marcas conservan sus colores.

## Cuenta, acceso y configuración (diseño)

El [plan técnico consolidado del 21 de octubre](docs/plan-arquitectura-homelab-2026-10-21.md) concreta versiones objetivo, seis servicios Compose, Django Q2 con cola en PostgreSQL, Redis local para límites de acceso y control de gasto LLM. Es planificación pendiente de implementación e integración; no representa un backend ya construido.

La arquitectura elegida es **Django + Next.js**, documentada en [Cuenta, acceso y configuración](docs/cuenta-acceso-configuracion-2026-10-20.md). Next.js gestionará la interfaz pública, el área de usuario y la gestión; Django será responsable de la API, cuentas, sesiones y permisos, con django-allauth para el acceso directo con GitHub/Google y las credenciales locales. PostgreSQL conservará datos y sesiones. Se propone servir ambos bajo un mismo origen, sin un segundo sistema de autenticación en Next.js. El usuario confirma Redis local para compartir los límites de intentos entre procesos, resolviendo un punto abierto de la propuesta anterior. Los detalles de proveedores, límites y costes deben verificarse al activar producción. Esta elección está planificada: el prototipo sigue siendo HTML/CSS/JavaScript y el backend no está implementado.

En Ajustes se puede comparar una sección gestionada desde la web con la misma sección en modo YAML y solo lectura. Este era un diseño previo; la aplicación funcional usa ahora [configuration/app.yaml](configuration/app.yaml) como autoridad única. El mock no lee ese archivo, no activa OAuth y no valida, transmite ni guarda credenciales. Los campos del login no tienen `name` y permanecen desactivados sin JavaScript. El cambio de perfil por URL y los estados de acceso restringido son demostraciones visuales; los recursos privados siguen sirviéndose estáticamente.

## Destino inicial de despliegue

Para retomar la planificación: [Recapitulación de arquitectura y ruta de continuación · 20 de octubre](docs/continuacion-arquitectura-2026-10-20.md). Distingue requisitos confirmados, propuestas, decisiones pendientes y estado real de implementación.

El primer despliegue será para pruebas en un **LXC dedicado del homelab**, con **Docker como requisito obligatorio** y Docker Compose como propuesta para ejecutar el conjunto. La preparación del LXC, persistencia y traslado futuro están descritos en [Despliegue en homelab](docs/despliegue-homelab.md). El despliegue todavía no está implementado ni validado en ese entorno.

## Fuentes adicionales de la muestra

El prototipo incluye trece fuentes: los tres GDG originales, los siete grupos WordPress de Galicia, GPUL, CoruñaJUG y Python A Coruña. Las siete últimas incorporaciones autorizadas se consultaron manualmente el 20 de octubre de 2026. El CLI conserva sus cuatro adaptadores originales; la ampliación alimenta el mock mediante lecturas verificadas, sin búsqueda diaria conectada. El catálogo y las fechas están en `mock/source-catalog.json`; el resultado está documentado en `docs/fuentes-seleccionadas-2026-10-20.md`.

La muestra base tiene ocho eventos visibles y una incorporación pendiente, con dos incidencias pendientes y una corroborada por cruce de fuentes. El Hacktoberfest reúne GDG y Python A Coruña en una ficha; las decisiones manuales guardadas tienen preferencia sobre esta corroboración. Los casos se declaran mediante campos, opciones y evidencias en `mock/review-cases.js`, con editores compartidos. Las fuentes retiradas anteriormente siguen fuera del catálogo, y se conservan las preferencias y notas locales.

Prueba del modelo del navegador, con Node:

```sh
node tests/test_mock_state.cjs
```

## Portadas del mock

`python3 cover_discovery.py --as-of 2026-10-19` actualiza manualmente el manifiesto de portadas para las nueve convocatorias de `mock/cover-sources.json`. Consulta las fichas públicas GDG, Meetup, GPUL y Eventbrite y, en DevFest Santiago, hasta dos páginas oficiales enlazadas (`/` y `/agenda`). No usa buscadores, redes sociales ni LLM. Verifica tipo de contenido y dimensiones con Pillow si está disponible; si no, usa el lector acotado PNG/JPEG/GIF/WebP/SVG de la librería estándar. Conserva automáticamente el manifiesto anterior como `mock/cover-manifest.before-*.json` antes de reemplazarlo. Los metadatos sociales y títulos de página no bastan para validar una imagen; tampoco se aceptan nombres de recurso genéricos como `open-graph-image.png` o `GDG_Bevy_DefaultEventBanner`. Errores de red conservan solo una imagen anterior validada como específica, salvo que una revisión manual la haya invalidado. `mock/cover-review.json` registra esa revisión para la marca genérica de DevFest Santiago. El informe de la lectura se guarda en `output/cover_discovery/` (ignorado por Git).

La interfaz carga `mock/cover-manifest.js`; las imágenes confirmadas conservan página y evidencia en `mock/cover-manifest.json`. Si no hay imagen válida o falla la carga del navegador, la página usa una portada tipográfica generada localmente, rotulada “Portada automática”; no representa una fotografía ni una imagen del organizador. La superficie usa proporciones naturales de los archivos para reducir bandas vacías, manteniendo las portadas completas.

## Identidad de la aplicación

La marca principal es la vieira verde y menta abierta hacia la derecha, sin detalle amarillo interior. Está integrada en las cabeceras, portadas automáticas, favicon, iconos móviles y manifiesto del mock. La raíz del servidor abre la agenda actual; el primer boceto se conserva en `mock/agenda-inicial.html`.

Los archivos, colores, proceso de regeneración y comprobaciones están en [Identidad visual](docs/identidad-visual.md). La geometría se mantiene en `tools/build_logos.py` y los iconos PNG/ICO se exportan con `tools/render_brand.cjs`.
