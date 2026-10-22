# Identidad visual de Galicia Tech

Logo elegido el 20 de octubre de 2026: vieira abierta hacia la derecha, bisagra estrecha con dos orejas, nueve lóbulos y nervaduras claras. La marca principal usa verde y menta. No lleva punto ni trazo amarillo en el interior.

## Colores principales

| Uso | Color |
|---|---|
| Concha | `#175B4C` |
| Contorno | `#12483D` |
| Nervaduras y fondo del símbolo | `#DDF3EA` |
| Nombre sobre fondo claro | `#20332F` |
| Nombre sobre fondo oscuro | `#E4F1EA` |
| Concha sobre fondo oscuro | `#A7DCC0` |
| Base del símbolo sobre fondo oscuro | `#193C34` |
| Nervaduras sobre fondo oscuro | `#214D40` |

Las paletas uva, atlántico y terracota se conservan en la galería como alternativas. La identidad activa es la verde y menta.

## Aplicaciones y archivos

| Uso | Archivo dentro de `mock/` |
|---|---|
| Cabecera sobre fondo claro | `galicia-tech-logo.svg` |
| Cabecera sobre fondo oscuro | `galicia-tech-logo-dark.svg` |
| Símbolo independiente | `galicia-tech-symbol.svg` |
| Símbolo y versión compacta sobre fondo oscuro | `galicia-tech-symbol-dark.svg`, `galicia-tech-symbol-compact-dark.svg` |
| Símbolo simplificado, nueve lóbulos y cinco nervaduras, para tamaños pequeños | `galicia-tech-symbol-compact.svg` |
| Favicon vectorial | `favicon.svg` |
| Favicon clásico de 16, 32 y 48 px | `favicon.ico` |
| PNG de navegador | `assets/brand/favicon-16.png`, `favicon-32.png` y `favicon-48.png` |
| Icono de pantalla de inicio de Apple, 180 px | `assets/brand/apple-touch-icon.png` |
| Iconos generales, 192 y 512 px | `assets/brand/app-icon-192.png` y `app-icon-512.png` |
| Icono adaptable a máscaras, 512 px | `assets/brand/app-icon-maskable-512.png` |
| Fuente del icono adaptable | `assets/brand/app-icon-maskable.svg` |
| Imagen general de marca para compartir, 1200 × 630 px | `assets/brand/social.png` |
| Nombre, colores, iconos y entrada de la webapp | `site.webmanifest` |

Los iconos adaptables tienen un fondo opaco y el símbolo reducido dentro de una zona segura central. La imagen para compartir queda preparada como recurso; al publicar, su URL absoluta se configura en los metadatos de la aplicación real.

## Integración en el mock

- Las ocho pantallas principales usan el logo animado en su cabecera. `logo-animation.js` sustituye progresivamente la imagen estática por un SVG en línea dentro del enlace original; si falla su carga, la imagen y la navegación siguen disponibles.
- La animación de entrada, cursor y foco afecta al símbolo y mantiene el nombre legible. Pulsar el logo en la agenda reproduce la secuencia completa y vuelve arriba; desde otra pantalla el enlace navega normalmente a la agenda. Los clics modificados mantienen su comportamiento nativo. La preferencia de movimiento reducido desactiva las animaciones.
- `brand.css` aplica los colores al SVG en línea según el tema. `brand-colors.css` se genera desde las mismas paletas que los exports SVG para que no diverjan. En oscuro la concha es menta clara, el recuadro verde profundo y las nervaduras oscuras; se conserva la geometría.
- `theme.js` adapta las imágenes estáticas de respaldo y los símbolos de las portadas automáticas. El cambio claro/oscuro recolorea el SVG en línea al instante, sin sustituir el componente ni recargarlo.
- Las 16 páginas HTML tienen el favicon, el icono de pantalla de inicio, el manifiesto y el nombre de aplicación.
- Las portadas automáticas usan el símbolo compacto de Galicia Tech. En las miniaturas se muestra el símbolo y la etiqueta de portada automática; el título del evento está junto a la portada.
- Las comparativas de estilos y la agenda anterior también muestran la identidad elegida.
- La raíz `/` abre la agenda vigente y conserva los parámetros y la sección de la URL. El boceto inicial se conserva en `agenda-inicial.html`, con el logo actualizado y embebido para funcionar dentro de su iframe.
- Las galerías de propuestas conservan las alternativas para consulta, con la identidad elegida en la cabecera.

El manifiesto prepara nombre e iconos. No incorpora por sí solo un servicio de funcionamiento sin conexión.

## Regeneración

La geometría y las paletas tienen una única fuente en `tools/build_logos.py`:

```sh
python3 tools/build_logos.py
node tools/render_brand.cjs
```

El segundo comando necesita Playwright, Chromium y Python con Pillow. En el entorno de Codex se puede resolver Playwright mediante `NODE_PATH`, indicar el ejecutable de Chromium con `BRAND_CHROMIUM_PATH` y seleccionar Python con `BRAND_PYTHON`. Los comandos generan los SVG, las variables de color de las cabeceras, el manifiesto, PNG e ICO; no requieren consultar imágenes externas.

Al cambiar la marca, regenerar ambos conjuntos y actualizar la versión de caché de sus referencias HTML y `theme.js`.

## Verificación de esta integración

Evidencia local: `output/brand-rollout/evidence.json`, generada por una comprobación de Playwright en Chromium.

- Ocho pantallas principales comprobadas en claro y oscuro: logo cargado y variante correcta.
- Cabeceras e iconos comprobados en las comparativas y galerías.
- Metadatos de identidad presentes en las 16 páginas HTML.
- Todos los iconos del manifiesto responden correctamente. Dimensiones PNG e imágenes opacas de Apple/máscaras verificadas con Pillow; ICO con 16, 32 y 48 px verificado.
- Entrada de la raíz conserva `?perfil=admin#lista` al abrir la agenda.
- Sin desbordamiento horizontal a 390 px ni errores de JavaScript en las pantallas comprobadas.
- Las solicitudes externas de portadas se bloquearon intencionadamente durante esta comprobación para verificar las portadas automáticas y la marca local. Esto no valida la disponibilidad de las portadas remotas.

Capturas: `mock/capturas/app-logo-claro.png`, `app-logo-oscuro.png` y `app-logo-movil.png`.

## Comprobación de animación y variante oscura

Evidencia adicional en `output/brand-motion/evidence.json`:

- Entrada y cursor activan la animación en la cabecera real; el nombre permanece visible durante la secuencia breve.
- Pulsar el logo desde la agenda reproduce la secuencia sin recargar. Desde la ficha de evento navega a la agenda. El enlace conserva su nombre accesible y no contiene otro botón o foco anidado.
- Paleta oscura comprobada en el SVG en línea; cambio a claro y vuelta a oscuro en el mismo componente. También cambian los símbolos de las portadas automáticas.
- Ocho pantallas principales con cabecera animada. Las comparativas de estilos mantienen el componente al cambiar de diseño, incluida la variante oscura «Tech sobrio».
- Galería con cinco SVG animados e identificadores únicos; controles de animación conservados.
- Preferencia de movimiento reducido respetada, sin desbordamiento horizontal a 390 px ni errores de JavaScript.
- Fallo simulado de la petición de animación: se conserva el logo estático.

Capturas actuales: `mock/capturas/app-animado-claro.png`, `app-animado-oscuro.png` y `app-animado-movil.png`. `logo-oscuro-animado.gif` muestra una captura por fotogramas de la secuencia completa en la cabecera real.
