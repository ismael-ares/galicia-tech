# Fuentes seleccionadas para ampliar la muestra · 20/10/2026

Se incorporan las siete fuentes autorizadas: WordPress Lugo, Santiago, Pontevedra, Ferrolterra y Ourense, CoruñaJUG y Python A Coruña. Se conservan las seis anteriores: catálogo base de **13 fuentes**, incluidos los **siete grupos locales de WordPress**. No se añaden otras candidatas del informe ni se ejecuta una recopilación diaria.

## Resultado de la lectura manual

- Los cinco grupos nuevos de WordPress no muestran próximos eventos en la selección visible. Sus tarjetas recogen la fecha de la última convocatoria observada. Ourense conserva expresamente el año 2025. No se inventan eventos por la periodicidad del grupo.
- CoruñaJUG aporta «Extreme AI engineering» (22 de octubre, 19:30–21:30, gratis según la oferta de Eventbrite) y «Un día con IA» (21 de noviembre, 09:00–18:30, entradas desde 20 euros según el programa oficial). La segunda se contrasta con el programa de Cascarilla Tech enlazado por el organizador; ese enlace es una fuente del evento y no un nuevo canal habitual del catálogo.
- Python A Coruña aporta la ficha de Hacktoberfest del 24 de octubre, 10:00–21:00, Centro Universitario Riazor. El texto enumera a GDG A Coruña y GPUL entre sus coorganizadores. Se reúne con la convocatoria GDG bajo el identificador existente `hacktoberfest`, con las dos fuentes y una inscripción directa de Meetup.
- El formulario alimentario enlazado en el texto de Python conserva un identificador de 2024. No se ofrece como inscripción vigente ni se deduce una fecha de ese enlace.

La muestra base tiene **ocho eventos visibles**, una incorporación pendiente (GPUL) y dos incidencias pendientes (hora de GPUL y hora final del Hackathon ETSE). La antigua duda de identidad del Hacktoberfest pasa a Resueltas como **corroborada por cruce de fuentes**. Se distingue esta procedencia de una decisión manual del usuario. Si el usuario ya había guardado un descarte o una nota pendiente para esa revisión, su decisión se conserva y las cantidades pueden variar. Reabrir la confirmación recupera la revisión pendiente y retira esa incorporación de la agenda local.

Los filtros de comunidad incluyen a los coorganizadores de la ficha compartida. El Hacktoberfest aparece al filtrar por Python A Coruña o GDG A Coruña, y conserva una sola tarjeta.

## Preferencias y portadas

El catálogo pasa a versión 3. Se añaden las nuevas fuentes sin duplicar páginas que el usuario hubiera añadido antes. Se conservan pausas, notas y decisiones. Ferrol se admite en el formulario y en la restauración de preferencias. La retirada anterior de cuatro fuentes pertenece a la migración de versión 2 y no se repite sobre una fuente que el usuario hubiera vuelto a añadir manualmente después.

Las dos nuevas fichas de CoruñaJUG usan imágenes de sus convocatorias. La imagen observada en la ficha Python es el logo genérico de la comunidad, no un cartel del Hacktoberfest; se revisa y descarta. El identificador de recurso Meetup se utiliza para excluir también sus recortes y alias de CDN. Si no hay otra portada válida, se usa la portada automática rotulada.

## Evidencia y comprobaciones

Lecturas HTML y resumen estructurado: `output/selected-sources-2026-10-20/`. Las páginas se leyeron directamente porque el buscador ofrecía en algunos casos versiones antiguas. Son capturas puntuales, sin cobertura completa del histórico ni servicio automático conectado.

22 pruebas Python del colector y las portadas, más la prueba Node del modelo: migración a 13 fuentes, identidad compartida del evento, preferencia de las decisiones manuales y reapertura persistente. Prueba de navegador: siete grupos WordPress, edición de Ferrol, ocho eventos de base, filtros por coorganizador, fichas y revisión; sin errores JavaScript ni desbordamiento horizontal a 320, 390, 768 y 1280 px. Se usan contextos aislados para las pruebas, sin modificar preferencias del navegador del usuario.
