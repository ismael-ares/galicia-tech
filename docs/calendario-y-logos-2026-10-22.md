# Revisión del calendario y logos de comunidades

Alcance: refinamiento del mock Next.js, previo a la primera implementación. Sin backend, consultas externas ni llamadas LLM.

## Calendario

- Encabezado mensual con navegación, hoy y selector directo de mes, accesible también en móvil.
- Cuadrícula de lunes a domingo, fines de semana discretos, hoy y selección diferenciados. Altura uniforme de las semanas: los días concurridos no deforman el mes.
- Cada día ofrece una previsualización con logo oficial, hora y título traducido. Cuando hay más eventos, el acceso «+N más» selecciona el día para consultar todos.
- Panel del día con portada, comunidad, título, resumen, hora, localidad, precio, tema y avisos. Fuente original y ficha mantienen enlaces independientes.
- Accesos a los días con encuentros y navegación entre ellos dentro del mes. Los días vacíos permiten saltar a una fecha con eventos del mes.
- En escritorio, panel lateral; en tablet y móvil, detalle debajo. En móvil la cuadrícula muestra fechas e indicadores, sin títulos comprimidos en siete columnas.
- Se conservan filtros compartidos, guardados, URL e historial para vista/mes, calendario civil Europe/Madrid, jornadas múltiples y horarios por confirmar. El día seleccionado sigue siendo estado local.
- Se conservan galego/castellano, temas claro/oscuro, teclado y movimiento reducido.

## Logos

`lib/community-logo.ts` y `components/community-logo.tsx` resuelven la identidad de la comunidad antes que su plataforma: WordPress y Python alojados en Meetup reciben sus propios logos. Se usan los recursos oficiales guardados en `public/assets/source-logos/`, sin consultas a terceros durante la navegación.

Se aplican a las 13 fuentes del panel, al calendario y a las comunidades del encabezado, que todavía usaban G / W / Py. Un recurso desconocido o fallido muestra un icono de web; nunca una inicial inventada. Los logos de agenda ya usaban estos mismos archivos y conservan su presentación.

## Verificación realizada

- Build de producción Next.js y comprobación TypeScript: correctos.
- `tools/check_mock_calendar_design.cjs`: semanas uniformes (132 px en la captura de escritorio), navegación por días con eventos, resúmenes, las 13 imágenes cargadas y asignadas a la comunidad correcta, tres logos del encabezado, ambos temas, GL/ES y ausencia de desbordamiento entre 320 y 1440 px: PASS.
- `tools/check_mock_calendar.cjs`: fechas, meses/años, cambio horario, fin exclusivo, jornadas múltiples, filtros, URL/historial, teclado, fuentes y fichas, idiomas y agenda preservada: PASS.
- `tools/check_mock_event_content.cjs`: 86 campos traducidos, búsqueda bilingüe, agenda/calendario/detalle/portadas, guardados y revisión: PASS.
- `tools/check_next_mock.cjs`: regresión general de rutas, filtros, destacados, guardados, fuentes, revisión, perfiles simulados, configuración, temas y móvil: PASS.
- SHA-256 sin cambios de las funciones EncounterRow, Poster y Save y las cuatro hojas de estilos de tarjetas. El cambio de catálogo se limita al encabezado con logos.
- Capturas revisadas de calendario claro/oscuro, móvil y fuentes en `output/next-mock/calendar-redesign-*` y `sources-redesign*`.

La comprobación de esta revisión se sirvió con Node local en Windows. Docker Desktop no estaba disponible desde la distribución WSL de esta sesión; no se modifica el contrato de Docker Compose ni se declara una nueva validación del contenedor.
