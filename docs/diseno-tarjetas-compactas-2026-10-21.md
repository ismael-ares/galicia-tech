# Tarjetas compactas: dirección visual y validación

Fecha: 2026-10-21. Ámbito: frontend del mock local; se mantienen los eventos de muestra existentes.

## Referencias consultadas

- Skill Sites local: desarrollo en el checkout existente, identidad conservada, revisión visual y adaptación responsive.
- Guía pública frontend-design: https://github.com/anthropics/skills/tree/main/skills/frontend-design. Consultada sin instalar dependencias ni cambiar configuración global. Se aplican jerarquía deliberada, composición coherente con el producto y crítica visual tras capturas.
- Luma, https://luma.com/sf y https://luma.com/tech: lista cronológica con portadas y datos breves.
- Partiful Explore, https://partiful.com/explore: relación entre cartel y contenido en tarjetas horizontales.
- Material 3, https://m3.material.io/components/cards/guidelines: referencia del componente. La página requiere JavaScript; no se atribuyen pautas concretas no verificadas en su contenido.

Capturas de referencia: output/next-mock/reference-luma.png y reference-partiful.png. Son material de consulta, no recursos incorporados a la aplicación.

## Diseño aplicado

Pizarra y tinta se mantiene: fondo #f6f7f9, superficie #ffffff, texto #242b35 y acento #34597c; en oscuro, fondo #171b21 y acento #afc7e4. Se conserva la familia tipográfica del producto. Títulos de 21 px en escritorio, resumen de 12,5 px, datos de 13 px y etiquetas de 10 px.

Composición: portada lateral que comparte altura con el bloque de lectura; organizador, título, resumen de dos líneas y tres datos alineados; notas contextuales solo cuando existen; temática y enlaces a las fuentes en la misma línea inferior. La dirección completa queda en la ficha, el recinto permanece en la tarjeta. Las imágenes originales se contienen completas sin recortar carteles.

Se descarta la franja de datos a todo el ancho con separadores: consumía una fila completa y producía huecos bajo el texto. Los datos se integran en la columna de contenido. Se retiran las etiquetas visuales Lugar/Horario/Entrada, manteniéndolas como términos accesibles del listado de definición y usando iconos consistentes para reconocerlos. Precio e incertidumbre no usan píldoras especiales.

En móvil, miniatura junto a organizador y título, resumen de dos líneas a todo el ancho y tres columnas de datos debajo. Las portadas automáticas conservan las veinte plantillas y muestran arte e identidad sin repetir el título.

## Verificación

- Build de producción, TypeScript y contenedor Docker saludables.
- Suite existente: rutas, filtros, carrusel, guardados, fuentes, revisión, perfiles, YAML, temas y móvil: PASS.
- Ocho tarjetas, ocho resúmenes, ocho bloques de etiquetas y tres datos por tarjeta.
- Altura media en 1440 px: aproximadamente 389 px antes y 235 px después (reducción del 40 %). Tarjetas entre 226 y 250 px en esta muestra.
- Sin desbordamiento horizontal a 320, 360, 390, 640, 641, 768, 1024, 1440 y 1920 px.
- Capturas revisadas de escritorio, móvil y modo oscuro: output/next-mock/tarjetas-editorial-*.png; portada automática: tarjeta-auto-editorial-dark.png.
- Guardar, fuente original en nueva pestaña, fuentes adicionales y navegación a la ficha: comprobados por separado.
- Horario incierto una sola vez; precio ausente sigue como Sin confirmar; condiciones de acceso conservadas.
- Interacciones respetan reduced-motion, foco visible y navegación por teclado. No se incorporan dependencias ni servicios externos nuevos.
