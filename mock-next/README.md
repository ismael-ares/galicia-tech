# Nuevo mock · Galicia Tech

Vista local con **Next.js 16, React, TypeScript y Tailwind CSS 4**. Conserva los ocho eventos, las trece fuentes, las evidencias y la vieira aprobados en el prototipo anterior. No sustituye todavía al backend del plan.

La dirección elegida por el usuario es **Pizarra y tinta**: blanco/gris frío con tarjetas blancas en claro y pizarra con tarjetas gris oscuro en el tema oscuro. Los acentos son azul tinta `#34597c` en claro y azul grisáceo `#afc7e4` en oscuro, conservando la geometría de la vieira. Los colores compartidos están en las variables de `app/globals.css`; `app/contrast.css` refuerza controles y estados. El exportador conserva esta variante del logo y favicon al regenerar la muestra.

Para revisar alternativas, `/paletas` conserva grafito/cobre, neutro/petróleo y pizarra/tinta con las mismas tarjetas. Ahora arranca en pizarra/tinta. Las pruebas de selección se guardan en `galicia-tech-demo-palette-v2`; las preferencias de la exploración anterior no sustituyen la nueva base. El tema claro/oscuro se selecciona por separado.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abrir `http://localhost:8874`. Para producción local: `pnpm build` y `pnpm start`.

Para mantener la vista previa ya construida independiente de la terminal, ejecutar `node ../tools/serve_mock_preview.cjs` desde este directorio. Prepara los recursos de la salida standalone, arranca en `http://127.0.0.1:8874` y comprueba la respuesta. Los registros quedan en `output/next-mock/preview.*.log`. Si ya responde, reutiliza el servidor existente. No instala un servicio de arranque del sistema; después de cambiar el código hay que reconstruir y reiniciar el servidor.

Vista previa mediante Docker Compose:

```sh
docker compose up --build -d
```

El Compose de este directorio sirve **solo la interfaz de muestra** y enlaza el puerto a loopback. No publica el mock en Internet ni instala los seis servicios definitivos. El Dockerfile usa una etapa de construcción, una base fijada por digest y una imagen de ejecución sin usuario root. La compatibilidad y los recursos del LXC siguen pendientes de comprobar en el entorno de destino.

## Recorrido

- Agenda: destacados, búsqueda, localidad, periodo, comunidad y guardados.
- Evento: pantalla propia, descripción, avisos, requisitos e inscripción/fuentes originales.
- Cuenta: selector explícito de perfil de muestra. El administrador ve el enlace a gestión dentro de su cuenta.
- Login centrado: correo/contraseña y Google/GitHub simulados; no se envían ni guardan credenciales.
- Administración: resumen, fuentes compactas con búsqueda/clasificación/estado, editor genérico de revisión y configuración web/YAML demostrativa.
- Sobre esta muestra: estado real de cada tecnología, sin presentarlas como servicios conectados.
- Portadas (`/portadas`): catálogo de 20 plantillas con vista previa sobre eventos de muestra, descarga individual SVG y paquete ZIP. La agenda conserva la prioridad de la imagen original.

Las tarjetas muestran organizador, título y tres datos con idéntica jerarquía: Lugar, Horario y Entrada. La entrada sin importe publicado aparece como «Sin confirmar», nunca como gratuita. Cada tarjeta conserva un resumen de dos líneas y su etiqueta temática. Portada lateral y contenido comparten altura; Lugar, Horario y Entrada están integrados bajo el resumen, con iconos y etiquetas accesibles. Temática y fuentes comparten la última línea. Los avisos horarios se muestran una sola vez. Las condiciones de acceso e inscripción conservan su espacio en el pie. Las jornadas múltiples muestran fechas e inicio/fin; una finalización dudosa queda explícitamente pendiente. No se interpreta un precio ausente como entrada gratuita.

Las portadas automáticas utilizan las 20 plantillas guardadas en `public/cover-templates/`, con tres tonos pizarra/tinta y cinco composiciones. La recarga no cambia su identidad. El catálogo del renderizador está en `lib/cover-templates.json` y el generador en `tools/build_cover_templates.cjs`, desde la raíz. Los SVG contienen campos de texto editables; las vistas previas de la web usan datos reales de muestra, sin inventar convocatorias. La entrada se representa como texto, igual que el lugar y el horario, sin píldora ni dimensiones dependientes del importe. Las portadas automáticas del listado contienen el título exacto del evento, con tipografía adaptada al ancho y a la longitud. La marca se reduce al símbolo; en las miniaturas móviles el título tiene prioridad sobre la fecha y la indicación de portada automática.

Temas y decisiones se guardan en localStorage. No hay autenticación ni autorización real: los datos de muestra son públicos. El selector de perfil no se reutilizará para permisos de producción. PostgreSQL, Redis, Django/allauth y Q2 siguen pendientes; el mock no consume LLM ni inicia consultas automáticas.

La referencia de filtros sigue siendo el 20 de octubre de 2026, no el reloj actual. Las portadas provienen del manifiesto existente; un error de carga usa la portada automática identificada. El orden de destacados es editorial, sin un LLM ejecutado.

El exportador `node tools/export_next_mock.cjs`, desde la raíz del proyecto, regenera la muestra y copia recursos locales del prototipo anterior. No descarga imágenes ni ejecuta el colector. Las preferencias anteriores no se importan automáticamente; el nuevo mock usa una clave separada.

## Verificación

Las animaciones, tiempos, alternativa de movimiento reducido y transición claro/oscuro están descritos en [Movimiento de la interfaz](../docs/movimiento-interfaz-2026-10-21.md). `tools/check_mock_motion.cjs` comprueba además los cambios rápidos de tema y el comportamiento sin soporte de transición nativa.

`pnpm typecheck` y `pnpm build` comprueban tipos y compilación. El script `tools/check_next_mock.cjs` de la raíz prueba rutas e interacciones en un servidor local ya arrancado y genera capturas; utiliza Playwright disponible en el entorno o indicado mediante `PLAYWRIGHT_MODULE`.

Arquitectura completa: [plan del homelab](../docs/plan-arquitectura-homelab-2026-10-21.md). La nueva interfaz no significa que las fases de identidad, datos, trabajos, presupuesto o restauración estén implementadas.

Idioma: selector GL/ES junto al tema. Se respeta la elección manual guardada; después, el idioma compatible del navegador; por último, galego. La interfaz, las fechas y el contenido de los eventos cambian con el idioma: títulos, descripciones, requisitos, avisos y etiquetas de las fuentes. El texto original se conserva y se recupera al volver a castellano; los nombres oficiales y las URL permanecen intactos. La preferencia se resuelve en el servidor mediante Accept-Language y una cookie funcional. Ver docs/idioma-galego-castelan-2026-10-21.md y tools/check_mock_locale.cjs.


Vistas del catálogo: Agenda y Calendario comparten datos y filtros. La vista mensual se abre con ?vista=calendario&mes=2026-10, incluye navegación por meses y detalle del día, y funciona también en guardados. Las tarjetas existentes de agenda permanecen intactas. Implementación y evidencias: docs/vistas-agenda-calendario-2026-10-21.md; comprobación: tools/check_mock_calendar.cjs.


Contenido bilingüe de eventos: catálogo independiente en lib/messages/events-gl.json y traductor de presentación en lib/event-content.ts. La búsqueda reconoce el título original y el galego en ambas vistas e idiomas. Las traducciones se vinculan al texto original exacto para evitar reutilizar una versión obsoleta tras una revisión. Ver docs/traducion-contido-eventos-2026-10-21.md y tools/check_mock_event_content.cjs.
