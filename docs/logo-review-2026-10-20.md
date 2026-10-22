# Revisión del logo de Galicia Tech — 20 de octubre de 2026

Alcance: vieira abierta hacia la derecha, cuatro paletas, exports SVG, galería de marca, animación compartida y aplicación del tema. Se conserva la orientación y la identidad elegida.

## Hallazgos y correcciones

| Prioridad | Hallazgo en el código anterior | Consecuencia | Corrección |
|---|---|---|---|
| P2 | El círculo usaba `scale()` sin un origen de transformación propio. | El punto se desplazaba hacia la esquina del SVG durante el pulso. | `transform-box: fill-box` y origen centrado; medido en el navegador: desplazamiento del centro = 0 px. |
| P2 | Cada SVG importado repetía `title` y `desc`; la geometría compartida necesita además un identificador de recorte. | Las referencias de accesibilidad y recorte podían resolver otra instancia del documento. | Identificadores propios por instancia y actualización de referencias locales. Nombre accesible único para el botón SVG. |
| P2 | `aria-labelledby` seguía presente junto a un nuevo `aria-label`. | El lector podía anunciar el título estático en lugar de la acción de reproducir. | Se usa una sola etiqueta accesible en la versión interactiva. El SVG descargable conserva título y descripción. |
| P2 | El final de cada reproducción dependía de un temporizador fijo de 3000 ms. | La duración real y el estado de reproducción podían divergir. | Finalización mediante las promesas de las animaciones reales, con protección frente a cancelaciones y reinicios rápidos. |
| P2 | El texto del logo tenía colores oscuros fijos incluso sobre el tema oscuro. | El nombre perdía legibilidad en la navegación de la aplicación. | Export claro sobre oscuro y selección automática al aplicar el tema, incluida la vuelta al modo claro. |
| P3 | Los controles cuadráticos de las nervaduras estaban alineados con sus extremos. | Los supuestos radios curvos eran segmentos rectos. | Curvatura real, 11 nervaduras con más grosor y contorno suavizado con curvas cúbicas. |
| P3 | Quince líneas muy finas se reducían juntas en tamaños pequeños. | Acumulación visual y pérdida de detalle. | Export compacto de 7 nervaduras para 24–32 px; muestras a tamaño real. |
| P3 | La animación y sus keyframes estaban incrustados en el HTML. Los SVG de las paletas se editaban independientemente. | Mayor riesgo de diferencias entre variantes y duplicación de mantenimiento. | Hoja de movimiento separada y generador único de geometría y paletas con siete exports reproducibles. |
| P3 | Los botones podían pulsarse antes de cargar el SVG. | Una interacción podía no producir ningún resultado. | Se habilitan al terminar la preparación. Ante fallo de la carga interactiva se conserva el logo estático y los controles quedan deshabilitados. |
| P3 | Una variante terracota todavía se anunciaba como «Pizarra y marfil». | Nombre accesible distinto del contenido visible. | Texto alternativo y etiqueta corregidos. |

## Archivos

- `tools/build_logos.py`: fuente común de geometría, paletas y exports. Ejecutar `python3 tools/build_logos.py` desde la raíz del proyecto.
- `mock/galicia-tech-logo.svg`: logo principal.
- `mock/galicia-tech-logo-dark.svg`: versión sobre fondo oscuro.
- `mock/galicia-tech-symbol.svg`: símbolo independiente.
- `mock/galicia-tech-symbol-compact.svg`: símbolo simplificado para tamaños pequeños.
- `mock/logo-animation.js`: carga, identificadores, interacción y ciclo de animación.
- `mock/logo-motion.css`: secuencia de movimiento de la vieira.
- `mock/theme.js`: adaptación del logo al tema de la aplicación.
- `mock/logos-concha.html`: comparación de paletas, tamaños reales y fondo oscuro.

## Evidencia de navegador

Chromium local mediante Playwright, escritorio 1440 px y móvil 390 px. Script y resultados en `output/logo-review/check.cjs` y `output/logo-review/evidence.json` (salida local ignorada por Git).

- Sin identificadores repetidos y recortes resueltos dentro de cada instancia.
- Once nervaduras; las laterales tienen curvatura real.
- Centro del nodo inmóvil durante el escalado: 0 px de deriva.
- Un segundo clic no queda cancelado por la finalización de la secuencia anterior.
- Reproducción con Enter y con controles individuales.
- Movimiento reducido: no se inicia ninguna animación.
- Sin desbordamiento horizontal a 390 px.
- El cambio oscuro/claro carga el SVG correspondiente en la agenda.
- Fallo simulado de la petición que prepara la animación: permanece la imagen estática.
- Galería Ruta G conservada: reproducción completa operativa.
- Sin errores de JavaScript en la galería revisada.

Capturas: `mock/capturas/logo-review-desktop.png` y `mock/capturas/logo-review-movil.png`.

## Límite de esta entrega

El nombre y el subtítulo siguen siendo texto SVG con fuente de sistema, adecuado para el mock y editable. Su forma tipográfica puede variar entre plataformas. Para una entrega de marca definitiva conviene elegir la fuente y exportar también una copia con el texto convertido en trazados. Las comprobaciones de accesibilidad son de interacción y atributos en Chromium; no constituyen una prueba con lector de pantalla real.

## Iteración visual posterior: silueta de vieira

A petición del usuario se sustituyó el contorno elíptico ondulado por una silueta de vieira con bisagra corta, dos orejas y cuerpo ensanchado hacia la derecha. El borde libre se construye con nueve lóbulos suaves y nueve nervaduras alineadas; el icono compacto usa cinco. Se conservan las paletas, los nombres de los exports y el contrato de animación. Las cifras de once y siete nervaduras en el informe anterior describen la revisión previa.
