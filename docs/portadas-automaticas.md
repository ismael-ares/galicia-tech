# Portadas automáticas · propuesta en el mock

La imagen publicada por la organización sigue siendo la primera opción. Cuando falta o falla su carga, el mock compone un cartel local con los datos de la ficha. No hay peticiones al LLM ni generación de fotografías.

- Cuatro paletas decorativas: menta, iris, atlántico y arcilla, con variantes claras y oscuras. El color no representa importancia, precio ni verificación.
- Tres composiciones: órbitas, módulos y ondas. La paleta se deriva de la comunidad y la composición del identificador del evento, de forma estable.
- Comunidad, título íntegro, fecha o rango de fechas, localidad y marca Galicia Tech. Fechas en Europe/Madrid; se indica cuando falta la fecha.
- La etiqueta temática se obtiene con reglas sencillas a partir del título o la comunidad; si no hay coincidencia, se usa «Encuentro tech». Es una propuesta visual, no una clasificación editorial completa.
- En miniaturas se conservan fecha, temática y símbolo; el título completo permanece junto a la portada en la tarjeta.
- El texto se ajusta al espacio disponible. El carrusel mantiene su altura y ajusta el ancho destinado a la portada.

## Revisión

`mock/portadas.html` permite probar las cuatro paletas y las tres composiciones con los eventos de muestra. Sus controles no guardan preferencias ni alteran la agenda. Los mismos componentes alimentan agenda, ficha y galería.

Implementación: `mock/covers-ui.js`, `mock/automatic-covers.css`; galería: `mock/portadas-ui.js` y `mock/portadas.css`.

Las portadas son composiciones HTML/CSS/SVG adaptativas, no archivos PNG exportados. Un servicio de exportación para redes sociales se puede añadir después reutilizando estos datos y reglas.

## Comprobaciones realizadas

Evidencia local: `output/automatic-covers/evidence.json` y `check.cjs`.

Se comprobaron controles de muestra, cambio de tema, fechas de varios días, títulos largos, anchos de 320/390/768/1440 px, ausencia de recortes en los bloques de portada, preferencia por la imagen original y sustitución tras un error de carga. Las imágenes remotas se bloquearon en las pruebas para ejercitar el respaldo; una imagen SVG local controlada permitió comprobar la prioridad de la original. No valida la disponibilidad actual de los servidores externos.
