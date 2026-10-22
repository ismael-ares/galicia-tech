# 20 plantillas de portada guardadas

Catálogo de pizarra y tinta solicitado por el usuario. Los SVG independientes están en `mock-next/public/cover-templates/` y el paquete completo en `mock-next/public/cover-templates.zip`. Cada SVG es editable y contiene los textos con identificadores `event-title`, `event-subtitle` y `event-date`.

1. Órbitas
2. Módulos
3. Ondas
4. Radios
5. Trama escalonada
6. Conexiones
7. Topografía
8. Circuito
9. Pórticos
10. Horizonte
11. Tablero
12. Constelación
13. Cintas
14. Encuadre
15. Amanecer
16. Matriz
17. Hélice
18. Vectores
19. Pliegues
20. Diagonales

Los motivos, nombres, tonos y composiciones se declaran en `tools/build_cover_templates.cjs`. El script genera los SVG, `index.json` con huellas SHA-256 y el catálogo de renderizado `mock-next/lib/cover-templates.json`. El mock y los archivos guardados comparten los mismos motivos vectoriales; la web adapta los títulos reales con CSS y los SVG descargables llevan textos de sustitución.

Regenerar desde la raíz:

```powershell
node tools/build_cover_templates.cjs
$templateFiles = Get-ChildItem -LiteralPath mock-next/public/cover-templates -File | Select-Object -ExpandProperty FullName
Compress-Archive -LiteralPath $templateFiles -DestinationPath mock-next/public/cover-templates.zip -Force
```

`/portadas` muestra las veinte con nombre y descarga individual o ZIP. Los eventos se reutilizan como ejemplos identificados, sin inventar veinte convocatorias. Las portadas automáticas de la agenda seleccionan una plantilla mediante el ID del evento, con el mismo resultado al recargar mientras no cambie el catálogo. La imagen original conserva prioridad.

Validación realizada: 20 SVG válidos en XML, 20 motivos distintos, huellas correctas, ZIP íntegro y copias idénticas a los archivos originales. Comprobaciones HTTP y descarga del ZIP, veinte variantes visibles, títulos dentro de sus portadas y responsive a 390/768 px. Se comprobaron también trazados SVG no vacíos y la compilación Docker. El recorrido general de la aplicación sigue pasando. Captura local: `output/next-mock/20-plantillas.png`.
