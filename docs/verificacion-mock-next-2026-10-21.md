# Verificación del nuevo mock · 21 de octubre de 2026

Solicitud: nueva muestra con tecnologías y correcciones asimiladas. Implementación aislada en `mock-next/`; se conserva el prototipo estático anterior.

## Ejecutado y comprobado

- Next.js 16.4.2, React 19.3.1, TypeScript 5.9.3 y Tailwind CSS 4.3.3; dependencias resueltas en `pnpm-lock.yaml`.
- `pnpm typecheck` correcto. Compilación de producción correcta, también dentro de Docker tras los últimos cambios de código.
- `docker compose -p galicia-tech-mock build`: imagen construida con base Node 24 Alpine fijada por digest.
- `docker compose -p galicia-tech-mock up -d --wait --wait-timeout 45`: contenedor saludable en Docker Desktop local, puerto `127.0.0.1:8874`.
- Usuario de ejecución comprobado: UID 1000. El proceso de producción usa la salida standalone de Next.js.
- Playwright con Chrome instalado: rutas, filtros y vacíos, destacados de altura estable, guardados, fuentes compactas y persistencia, revisión y reapertura, perfiles simulados, sección YAML de solo lectura, temas persistentes, móvil sin desbordamiento horizontal y movimiento reducido. Sin errores JavaScript de página en el recorrido.
- Las comprobaciones de navegador finales se ejecutaron contra el contenedor, no solo contra el servidor de desarrollo.
- La prueba preexistente `node tests/test_mock_state.cjs` sigue pasando.

El recorrido automatizado está en `tools/check_next_mock.cjs`. Registros y capturas en `output/next-mock/` (salida local ignorada por Git). Se inspeccionaron capturas de escritorio, móvil y tema oscuro.

## Cambios de experiencia

Agenda pública sin enlaces administrativos en la cabecera, fichas independientes con fuentes e inscripción, portadas originales con alternativa automática identificada, vieira animada y tema oscuro. Login centrado y acceso a gestión desde Mi cuenta solo para el perfil administrador de muestra. Fuentes clasificables y editor de revisión construido a partir de campos y evidencias comunes. La configuración demuestra autoridad web/YAML y un techo de 5 EUR, sin ejecutar servicios.

## Límites

El único servicio de este Compose es el frontend de muestra. Django, DRF, allauth, PostgreSQL, Redis y Q2 no están conectados. No se prueba aquí autenticación real, autorización del servidor, presupuesto transaccional ni despliegue Proxmox/LXC.

Los perfiles y las decisiones son estado público del prototipo en el navegador; no constituyen seguridad. OAuth, credenciales y trabajos son simulados. No se guarda ni transmite lo escrito en los campos de credenciales. No hay consultas programadas ni llamadas LLM pagadas.

El catálogo mantiene la fecha de muestra del 19–20 de octubre de 2026. No se han actualizado eventos por Internet ni establecido un ranking real mediante LLM. La prueba no garantiza disponibilidad futura de las portadas externas; el componente dispone de alternativa ante errores de carga.

No se ha creado repositorio remoto, pipeline ni publicación cloud.

## Revisión de Todos los encuentros

La vista agrupa fechas en una columna propia, amplía portadas y títulos y separa el pie con precio, condiciones, avisos y guardado. La tarjeta completa abre la ficha mediante el enlace del título, con un botón de guardado independiente. El diseño móvil presenta la fecha sobre el grupo y permite más espacio al título.

Compilación Docker y recorrido Playwright correctos tras el rediseño. Comprobación adicional de clic en el pie de la tarjeta y ausencia de desbordamientos horizontales en 320, 390 y 768 píxeles. Capturas locales en `output/next-mock/encuentros-claro.png` y `encuentros-movil.png`.

### Tarjetas e información

Segunda revisión: portada ampliada, logo de comunidad, resumen tomado de la descripción existente, localidad/recinto y horario en bloques diferenciados. Guardado en la esquina y pie con entrada, condiciones y fuente original directa. Si hay varias fuentes, el enlace adicional lleva a la sección identificada `#fuentes` de la ficha. No se generan nuevos datos ni resúmenes con un LLM.

La hora de finalización discutida se presenta como «fin por confirmar». El recorrido Playwright sigue pasando; se comprobaron además los enlaces directos y múltiples, el aviso de horario y ausencia de desbordamientos a 320/390/768 píxeles. Capturas inspeccionadas en `output/next-mock/tarjetas-escritorio.png` y `tarjetas-movil.png`.

## Paleta azul y contraste

Nueva identidad azul en el mock Next.js: logo, favicon, navegación, botones, selección, portadas automáticas y superficies. Modo claro con fondos fríos y azul principal `#2457c5`; oscuro con fondo azul noche `#0c1424` y acento `#9fc3ff`. Los avisos conservan ámbar y texto explicativo.

Se eliminan opacidades que debilitaban texto y se separan bordes de controles de divisores decorativos. Placeholders, foco, selección, guardados y puntos de carrusel disponen de colores explícitos. El exportador vuelve a producir el SVG azul, por lo que regenerar datos no recupera la variante verde anterior.

Medición local de luminancia relativa: 26 pares de tokens comprobados, con umbral 4.5:1 para texto y 3:1 para controles/icono. Botón principal: 6.47:1 en claro y 8.36:1 en oscuro. Texto secundario sobre tarjeta: 6.51:1 y 9.01:1 respectivamente.

Revisión de estilos renderizados en siete rutas por tema: 1.028 elementos con texto comprobados, sin pares por debajo de 4.5:1 en ese recorrido. Se consideran color, fondo y opacidad; se excluyen elementos ocultos, deshabilitados y contenido interno de imágenes/SVG. Es una comprobación de contraste sobre la muestra y estados recorridos, no una certificación completa de accesibilidad.

Evidencias locales: `output/next-mock/contrast-audit.json`, `palette-contrast.json`, `azul-light.png`, `azul-dark.png` y `azul-movil.png`. Capturas claro/oscuro inspeccionadas. La compilación Docker y el recorrido de interacciones Playwright siguen pasando.

### Ajuste posterior a celeste

El usuario prefiere celeste inspirado en la bandera gallega. Se aplican botones `#8bd1f1` con texto oscuro en claro y `#8ed3f1` en oscuro; los enlaces mantienen un tono oscuro suficiente sobre fondos claros. Logo, favicon y portadas automáticas usan la misma familia celeste. No se afirma que los colores correspondan a una especificación oficial de la bandera.

Se verificaron 26 pares de colores: textos a partir de 4.5:1 y controles/icono a partir de 3:1. Botón principal: 7.36:1 en claro y 8.14:1 en oscuro. Compilación y contenedor saludables, persistencia del tema y móvil sin desbordamientos comprobados. Evidencias en `output/next-mock/celeste-contrast.json`, `celeste-claro.png` y `celeste-oscuro.png`.

### Paleta vigente: neutros con índigo y lavanda

El usuario rechaza el resultado celeste y solicita elegir una combinación más estética para este diseño. Se propone y aplica una base neutra: claro `#f6f5f2`/tarjetas blancas y oscuro `#16161a`/tarjetas `#222227`. El acento de acción es índigo `#5d59ad` en claro y lavanda `#c0b7ee` en oscuro. Logo, favicon y portadas automáticas acompañan la paleta; la geometría y la distribución no cambian.

Criterio de diseño: separar superficies de bajo énfasis de acentos de interacción, siguiendo los [roles de color de Material 3](https://m3.material.io/m3/pages/color-roles?s=m3), consultados el 21 de octubre de 2026. La elección de estos colores concretos es una valoración de diseño del proyecto, no una paleta prescrita por Material.

Se verificaron 26 combinaciones de contraste (texto >=4.5:1, controles/icono >=3:1), compilación y contenedor, capturas claro/oscuro/móvil y recorrido Playwright completo. Se ajustó la comprobación de altura del destacado para tolerar diferencias de redondeo inferiores a medio píxel. Evidencias en `output/next-mock/neutral-contrast.json`, `neutral-claro.png`, `neutral-oscuro.png`, `neutral-tarjetas.png` y `neutral-movil.png`.

### Comparador posterior de paletas

El color índigo tampoco convence al usuario. Se añade `/paletas` para comparar tres direcciones sobre las mismas tarjetas: grafito/cobre, neutros/petróleo y pizarra/tinta. La elección es independiente del tema y persiste en el navegador; al volver a la agenda se mantienen sus variables de color. La vieira de cabecera, las portadas automáticas, los fondos y los controles responden a esas variables. El favicon continúa siendo el recurso base hasta cerrar la elección de identidad.

Compilación Docker correcta. Se verifican las tres opciones en ambos temas, la persistencia tras recargar, la aplicación al navegar a la agenda y la ausencia de desbordamiento en móvil. 42 combinaciones de contraste comprobadas en `output/next-mock/palette-comparison-contrast.json`; capturas `paleta-{copper,petrol,ink}-{light,dark}.png`. Son propuestas de muestra; no se da una paleta por aceptada definitivamente.

### Dirección elegida: Pizarra y tinta

El usuario indica «trabajemos sobre pizarra y tinta». Se promueve esa variante a los tokens base en claro/oscuro, HTML inicial y comparador. SVG, favicon y exportador también adoptan la variante. Las preferencias de comparación antiguas no recuperan cobre/petróleo al recargar; la comparación nueva utiliza una clave versionada independiente. El diseño de las tarjetas y los datos no cambian.

Compilación Docker y recorrido Playwright correctos. Comprobaciones específicas: carga con preferencia antigua cobre produce pizarra/tinta, colores de la vieira correctos en ambos modos, contenido del favicon actualizado y comparador inicialmente seleccionado en tinta. Capturas: `output/next-mock/pizarra-base-claro.png` y `pizarra-base-oscuro.png`.

### Precios, horarios y galería de portadas

Se da al precio un bloque de entrada propio con icono, etiqueta e importe destacado. Se conserva «Gratis», «5 €» y «Desde 20 €»; cuando la fuente no publica precio se muestra «Sin precio publicado». Condiciones y fuentes quedan fuera de ese bloque.

Horario con etiqueta y números más legibles, zona de Galicia y final incierto explícito. La fecha de inicio/fin se compara en Europe/Madrid. Las convocatorias de varios días muestran rango de fechas e inicio/fin general sin convertirlo en el horario confirmado de cada jornada.

`/portadas` muestra ocho ejemplos con el componente real forzado en modo automático. Las portadas originales siguen teniendo prioridad en la agenda. Los títulos largos adaptan la tipografía en la galería; título y fechas se toman de la misma ficha.

Compilación Docker y recorrido general correctos. Comprobaciones específicas de precio fijo, desde, desconocido, final incierto, rango multidía, ocho títulos coincidentes y ausencia de desbordamientos a 320/390/768 px. Capturas inspeccionadas: `output/next-mock/precios-horarios.png`, `portadas-automaticas.png` y `portada-oscura.png`. El test de tema espera a que se aplique la transición nativa antes de comprobar el nuevo estado.

### Variación de portadas y dimensiones constantes

Se sustituye el único motivo por seis familias SVG: órbitas, módulos, ondas, radios, tramas y conexiones. Un hash del ID elige motivo y uno de tres tonos: tinta, papel o acero. No se utiliza aleatoriedad en cada render, personalización por evento ni llamadas a un LLM. La muestra de ocho eventos utiliza cinco familias y los tres tonos; cada evento conserva su variante tras recargar. Se mantiene el título real, la fecha y la etiqueta de portada automática.

Precio con ancho/alto constantes por tamaño de pantalla: 190×66 px en escritorio/tablet y 164×64 px en móvil. «Gratis», importe, desde y desconocido conservan exactamente esas dimensiones. Se normalizan también las etiquetas de temática y los bloques de aviso/condición; si falta espacio, la distribución permite envolver bloques completos.

Verificación en navegador: ocho precios con el mismo ancho y alto a 1440/768/390/320 px, sin texto fuera del bloque ni desbordamiento horizontal. Identidades de portada estables tras recargar, cinco motivos visibles y tres tonos. Compilación Docker y recorrido general Playwright correctos. Evidencias: `output/next-mock/cover-variants-checks.json`, `portadas-variadas.png` y `portada-variada-movil.png`.

### Entrada compacta en la fila de datos
Precio trasladado junto a Dónde y Horario: 128×34 px en escritorio y 100×34 px en pantallas pequeñas, iguales para todos los valores. Pie reducido a 48 px (44 px en móvil), conservando fuentes y avisos. Build de producción y TypeScript correctos; revisión visual clara/oscura y sin desbordamiento horizontal en 1440, 768, 390 y 320 px. Capturas: output/next-mock/precio-compacto-*.png.

### Rediseño integral de tarjetas
Componente EncounterRow con estilos propios en encounter-redesign.css: organizador y título; Lugar/Horario/Entrada con idéntica tipografía, sin píldoras de precio; sin resumen ni temática inferida. El horario dudoso aparece una sola vez y no oculta condiciones de acceso. Fuente original, fuentes adicionales y guardar conservan objetivos independientes. Se mantiene el rango de fechas para encuentros de varias jornadas, sin inventar horarios diarios. Portadas automáticas del listado sin título/fecha duplicados; galerías y ficha conservan sus portadas completas. Build/TypeScript y suite de integración correctos. Comprobación visual clara/oscura y sin desbordamiento en 320, 390, 768 y 1440 px. Capturas en output/next-mock/tarjetas-redesign-*.png.

### Tarjetas completas con resumen y etiquetas
Restituidos el resumen descriptivo (hasta tres líneas) y las etiquetas temáticas en todas las tarjetas. Cabecera con portada y contenido; franja inferior de Lugar, Horario y Entrada; pie con condiciones y enlaces a fuentes. Descripción íntegra en la ficha del encuentro. Se conserva el tratamiento uniforme de precio y horario, con incertidumbres explícitas. Build/TypeScript y suite de integración correctos. Verificados ocho resúmenes y ocho grupos de etiquetas, sin desbordamiento en 320, 390, 768 y 1440 px, con revisión visual clara y oscura. Capturas: output/next-mock/tarjetas-completas-*.png.

### Tarjetas editoriales compactas
Nueva composición documentada en docs/diseno-tarjetas-compactas-2026-10-21.md. Altura media de 389 a 235 px en escritorio; se conservan portada, resumen, etiquetas, datos, condiciones, fuentes y guardados. Suite y controles de interacción correctos; nueve anchos sin desbordamiento. Referencias Luma y Partiful, skill Sites y guía pública frontend-design.

### Avisos junto a las etiquetas
Inscripción, acceso y avisos generales agrupados como chips junto a la temática; eliminada su línea intermedia. Icono informativo y contorno discreto distinguen los avisos. Los pendientes horarios permanecen junto a la hora. Footer flexible sin recortar avisos. Build/TypeScript correctos y contenedor saludable. Verificado agrupamiento y ausencia de desbordamiento en 320, 390, 768 y 1440 px; capturas claras y oscuras en output/next-mock/avisos-etiquetas-*.png.

### Título en las portadas automáticas del listado
Restituido el título exacto del evento dentro de la portada, sustituyendo el rótulo genérico visible por el símbolo de marca. Tipografía según ancho del contenedor y longitud del título. En móvil se prioriza el título sobre fecha y etiqueta de portada automática. Build/TypeScript correctos, contenedor saludable y cinco combinaciones de ancho/tema verificadas. Forzado el fallo de imágenes originales para comprobar los ocho títulos de fallback en 320 px, sin desbordamiento ni solapamiento. Capturas en output/next-mock/portada-titulo-*.png.

### Idioma galego/castellano
Selector junto al tema, negociación del idioma del navegador con fallback galego, preferencia manual persistente y HTML inicial con idioma correcto. Catálogo de interfaz y formatos de fechas compartidos. Sin dependencias nuevas. Build, TypeScript y suites de idioma, integración y movimiento correctos. Revisión móvil/escritorio, dos temas y ausencia de errores de hidratación. Evidencia y decisiones: docs/idioma-galego-castelan-2026-10-21.md. Capturas: output/next-mock/idioma-*.png.

### Agenda y calendario mensual
Refactorización del controlador común y renderizadores separados. Calendario navegable, selección de día, responsive, fechas multijornada y enlaces; URL de vista/mes e historial. Funciones y hojas de estilo de las tarjetas de agenda idénticas por SHA-256, altura verificada. Build, TypeScript y suites de calendario, integración, idioma y movimiento correctos. Ver docs/vistas-agenda-calendario-2026-10-21.md.

### Contenido de eventos en galego
Ampliado el idioma a títulos, párrafos, requisitos, avisos, fuentes y explicaciones de destacados. Originales conservados; traducción de presentación sin modificar datos, lógica ni estilos. Búsqueda por ambas versiones del título. Catálogo separado con cobertura de 86 campos no vacíos. Build y suites de contenido, integración, idioma y calendario correctos; alternancia y revisión comprobadas sin recuperar información obsoleta. Evidencias en docs/traducion-contido-eventos-2026-10-21.md y output/next-mock/eventos-galego-*.png.
