# Vistas de agenda y calendario mensual

Decisión del 21 de octubre de 2026: la agenda y el calendario son dos representaciones del mismo catálogo. Las tarjetas de agenda se conservan sin cambios de contenido, estructura ni estilos.

## Estructura

- `components/catalog.tsx` mantiene el controlador: datos revisados, fuentes habilitadas, guardados y filtros comunes. El selector Agenda/Calendario está junto al encabezado de resultados.
- `components/agenda-list.tsx` organiza los encuentros por fecha y recibe el renderizador existente de tarjetas. `EncounterRow`, `Poster` y `Save` permanecen intactos.
- `components/calendar-view.tsx` presenta el mes, navegación anterior/siguiente, retorno a hoy, selector directo de mes en escritorio y detalle del día seleccionado. Los destacados se muestran en agenda; el calendario usa ese espacio para la vista mensual.
- `lib/calendar.ts` centraliza fechas civiles en Europe/Madrid, cuadrículas de lunes a domingo, intervalos e índice de eventos por día. La conversión de fechas se calcula una vez por evento y mes.
- `components/event-view-switch.tsx` y `app/calendar.css` añaden el selector y los estilos exclusivos del calendario. Las cuatro hojas existentes de tarjetas no se modifican.

## Comportamiento

Vista inicial: agenda. `?vista=calendario&mes=2026-10` abre directamente octubre de 2026. Vista y mes se conservan al recargar y participan en el historial del navegador. El día seleccionado es estado local de la vista.

Búsqueda, localidad, comunidad, periodo y guardados alimentan ambas vistas. Cambiar de representación conserva los filtros, el idioma y el tema. Las decisiones de revisión y las fuentes pausadas siguen pasando por el mismo catálogo.

En escritorio se pueden abrir las fichas desde cada celda o consultar todos los eventos del día en el panel lateral. En móvil se muestran números, indicadores y cantidades; el detalle del día aparece debajo. Las fuentes originales tienen enlaces independientes.

Un evento de varios días aparece en cada fecha que ocupa, pero cuenta una sola vez en el total del mes. Un final exactamente a medianoche es exclusivo y no ocupa el día siguiente. No se inventan horarios diarios cuando están pendientes.

La cuadrícula admite teclado: flechas para recorrer fechas, Inicio/Fin para los extremos de la semana; el foco sigue al día al cruzar de mes. Hay nombres de fecha completos accesibles, selección explícita y marcador de hoy. Se mantienen las preferencias de movimiento reducido.

## Verificación

- Build Docker y TypeScript correctos; contenedor saludable.
- Suite nueva `tools/check_mock_calendar.cjs`: límites de mes/año, lunes inicial, años bisiestos, cambio de hora, fin exclusivo, eventos multijornada, filtros compartidos, URL, recarga, historial, teclado, enlaces a fichas y fuentes, idiomas y responsive: PASS.
- Suites existentes de integración, idioma y movimiento: PASS.
- Sin desbordamiento horizontal a 320, 390, 640, 641, 768, 1100 y 1440 px.
- Preservación: SHA-256 de las funciones `EncounterRow`, `Poster` y `Save`, y de `encounter-redesign.css`, `encounters.css`, `card-facts.css`, `cover-variants.css`, idénticos antes y después. Registro en `output/next-mock/agenda-preservation-before.json` y `agenda-preservation-after.json`.
- Misma altura de la primera tarjeta antes y después de alternar y filtrar.
- Capturas claras/oscuras de escritorio y móvil en `output/next-mock/calendario-*.png` y `calendar-tested-gl-mobile.png`.

Se mantiene el alcance del mock: no se implementa backend, no se ejecuta el colector ni se añaden dependencias o servicios.
