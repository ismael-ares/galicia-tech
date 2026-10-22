# Ampliación manual de la muestra · 20 de octubre de 2026

Selección posterior del usuario: se conservan GDG A Coruña, GDG Ourense, GDG Santiago, WordPress Coruña, GPUL y WordPress Vigo. VigoTech, Python Vigo, A Industriosa y Cloud Native Galicia se retiraron del catálogo y de las preferencias previas. El evento de WordPress Vigo mantiene únicamente su fuente directa. La tabla siguiente documenta la investigación anterior a esa selección.

Se añaden seis fuentes públicas a las cuatro originales. Esta lectura manual alimenta el prototipo; no amplía los adaptadores del CLI ni conecta una búsqueda diaria. Los resultados previos del 19 de octubre se conservan con su fecha. No se interpreta una página sin convocatorias próximas como una cancelación ni se deducen fechas por la periodicidad habitual.

| Fuente añadida | Página consultada | Resultado observado |
| --- | --- | --- |
| GPUL | https://gpul.org/ | Convocatoria «Introdución á terminal», 21 de octubre. Texto: 17:00. JSON-LD Event.startDate: `2026-10-21T17:00:00.000Z`, equivalente a 19:00 CEST. Pendiente de revisión; no se añade todavía a la agenda. |
| WordPress Vigo | https://www.meetup.com/vigo-wordpress-meetup/ | Ficha https://www.meetup.com/vigo-wordpress-meetup/events/316875139/ : 22 de octubre, 19:00–21:00 CEST, Círculo de Empresarios de Galicia, Vigo. Publicada una vez. El precio no consta. |
| VigoTech Alliance | https://vigotech.org/ | Enlaza la misma ficha de WordPress Vigo. Se conserva como segunda fuente del evento, sin duplicarlo. La cabecera representa la hora como 17:00 sin zona; la ficha de Meetup fija 19:00 CEST. Se utiliza el horario de la ficha directa. No se usa el calendario cargado por JavaScript como prueba de ausencia. |
| Python Vigo | https://www.python-vigo.es/ | La publicación del 12 de octubre anuncia una reunión el 15 de octubre a las 20:00. Ya pasó. No se confunde la fecha de publicación con la de celebración ni se crea una siguiente reunión a partir de su periodicidad. |
| A Industriosa | https://aindustriosa.org/tipo/eventos/ | La página consultada presenta un calendario de octubre y eventos pasados, entre ellos convocatorias de septiembre. La lectura no prueba cobertura de todo el calendario ni de otras páginas. |
| Cloud Native Galicia | https://community.cncf.io/cloud-native-galicia/ | Redirige a https://ocgroups.dev/cncf/group/39aenb6 . La página oficial indica «No upcoming events scheduled». Se conserva la dirección de procedencia y se documenta la redirección. |

## Datos y alcance del prototipo

- Catálogo: `mock/source-catalog.json`, con identificadores estables, fecha, método y nota de lectura. `mock/source-catalog.js` es su representación para el navegador sin backend.
- Nuevos eventos: `mock/more-samples.js`. WordPress Vigo conserva su fuente directa de Meetup y una sola ficha. El evento de GPUL solo se publica al aprobar una hora manualmente en esta demo.
- Revisión: `mock/review-cases.js` declara campos, evidencias, opciones y cambios. El modelo y el HTML compartidos no distinguen los casos por nombre ni por identificador. Actualmente hay editores reutilizables de elección y URL; un tipo desconocido permanece pendiente y admite notas.
- Migración: se añaden fuentes nuevas sin perder las pausas, notas o decisiones previas guardadas. Si el usuario ya añadió una de estas páginas, se reutiliza la entrada según URL.
- Portadas: se consultan las seis convocatorias configuradas. Se retiró el límite accidental de cuatro y se corrigió el caso en que un OG débil ocultaba la misma imagen asociada directamente a un Event. Se conservan las verificaciones contra logos y portadas genéricas.

Capturas HTML e inspección estructurada en `output/source-discovery/` (evidencia local ignorada por Git). Las decisiones tomadas en pruebas automatizadas usan contextos aislados y no se guardan en el navegador del usuario.

## Comprobaciones

21 pruebas Python del colector y las portadas; prueba Node del modelo con migración, deduplicación por fuente, aprobación y reapertura, y una incidencia sintética nueva declarada solo con datos. Navegación comprobada con Chromium en 1280, 768, 390 y 320 px: sin desbordamiento horizontal y sin errores JavaScript. El flujo GPUL permite aprobar, abrir la ficha con su fuente y sin inventar inscripción, y reabrir para retirarla de la agenda.
