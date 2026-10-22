# Contenido de eventos en galego

Requisito confirmado el 21 de octubre de 2026: el selector de idioma debe aplicarse también al contenido de los eventos, incluyendo títulos, descripciones y demás textos. Amplía la implementación inicial, que traducía solo la interfaz.

## Implementación del mock

- Traducciones guardadas en `mock-next/lib/messages/events-gl.json`, separadas de los textos de interfaz y de `sample.json`.
- `mock-next/lib/event-content.ts` aplica la traducción exclusivamente en la presentación. No transforma el evento usado para clasificar, filtrar fechas, resolver dudas de horario ni calcular precios.
- Se muestran títulos, párrafos, requisitos, avisos, etiquetas de las fuentes y motivos de destacados en galego. Las tarjetas de agenda conservan sus estilos; el calendario, las fichas, los guardados, los ejemplos de paletas y las portadas automáticas comparten el mismo traductor.
- Originales conservados. Volver a castellano muestra el texto original. Nombres oficiales, identificadores, importes, fechas, direcciones y URL no se alteran. Los carteles originales conservan la imagen publicada; las portadas automáticas sí incluyen el título traducido.
- La búsqueda indexa el título original y el galego simultáneamente. Cambiar de idioma con una búsqueda activa no pierde el resultado.
- La clave de cada traducción es el texto original exacto: un cambio posterior no puede reaprovechar una traducción desactualizada. Si falta una versión, se conserva el original hasta actualizarla. La muestra actual tiene cobertura completa de sus 86 campos de evento no vacíos, incluidos candidatos pendientes de revisión, además de las explicaciones de destacados.

Las traducciones del mock están redactadas y guardadas en el proyecto. Alternar de idioma no ejecuta un LLM, no realiza peticiones de traducción y no tiene coste de API.

## Criterio para la implementación futura

Cuando exista el procesamiento real, generar y almacenar la versión galega una vez por novedad o revisión de contenido, junto a su versión o huella de origen. Formará parte del procesamiento de nuevos datos y conservará los límites presupuestarios existentes. No traducir por cada visita ni al pulsar el selector. El backend y ese procesamiento siguen pendientes.

## Verificación

- Build Docker y TypeScript correctos; contenedor saludable.
- `tools/check_mock_event_content.cjs`: cobertura de campos, datos originales sin mutación, búsqueda bilingüe, agenda, calendario, fichas, portadas, fuentes originales, guardados, alternancia de idioma y revisión de horarios: PASS.
- Suites existentes de integración, idioma y calendario: PASS.
- Verificado en 320 y 1440 px; sin desbordamiento ni errores de hidratación.
- Capturas en `output/next-mock/eventos-galego-desktop.png` y `evento-galego-mobile.png`.
