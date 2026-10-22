# Movimiento de la interfaz · Pizarra y tinta

Diseñado e implementado en el mock Next.js el 21 de octubre de 2026. Incluye el cambio claro/oscuro solicitado expresamente por el usuario. Conserva la paleta y la distribución aprobadas.

## Criterio común

El movimiento indica cambio, respuesta y continuidad. No retrasa la navegación, simula procesamiento remoto ni oculta controles hasta que acaba una animación. No hay reproducción automática del carrusel, movimiento decorativo continuo ni entrada de contenido condicionada a hacer scroll.

| Uso | Tiempo | Comportamiento |
| --- | --- | --- |
| Pulsación y estados | 140–220 ms | Respuesta contenida de botones, chips y guardado |
| Desplegables | 240 ms | Apertura/cierre de filtros y explicación de destacados |
| Listas | 260 ms | Aparición breve y recolocación de resultados; escalonado máximo 110 ms |
| Destacados | 280–320 ms | Entrada direccional de texto y fundido de portada; altura estable |
| Navegación | 360 ms | Entrada de página con desplazamiento de 7 px |
| Tarjetas | 140–360 ms | Borde/sombra y elevación de 2 px; zoom de portada de 2.5% solo con puntero preciso |
| Apariencia | 180–220 ms | Fundido completo entre temas y sustitución del icono sol/luna |
| Logo | 900 ms | Pulso, apertura desde la bisagra y dibujo escalonado de nervaduras |

Curvas comunes: salida suave `cubic-bezier(.2,.8,.2,1)` y asentamiento `cubic-bezier(.22,1,.36,1)`. Los tiempos y curvas se centralizan en `mock-next/app/motion.css`.

## Cobertura

- Agenda y guardados: entrada de página, tarjetas, resultados de filtros, contador, selección, pulsación y marcador.
- Carrusel: dirección anterior/siguiente, portada y puntos de selección; sin temporizador automático.
- Filtros y explicación: desplegables reutilizables que se abren/cerran sin saltos de altura.
- Cuentas y login: foco de campos, botones, selección de perfil, confirmación, mensajes y errores.
- Administración: filtros/orden de fuentes y revisión con recolocación de filas/tarjetas, estado de fuentes y controles comunes.
- Avisos: entrada breve del toast, sin bloquear acciones posteriores.
- Marca: interacción al pulsar la vieira, sin repeticiones automáticas.
- Claro/oscuro: transición independiente del resto de animaciones y preferencia persistente.

Las funcionalidades siguen siendo las del mock: no se introducen indicadores de carga de Django o LLM como si estuviesen conectados.

## Cambio de apariencia

Se utiliza la transición nativa de vistas cuando está disponible. El navegador compone la apariencia anterior y la nueva con un fundido; no se realiza un barrido circular ni un desplazamiento de la página. El estado de tema y el icono se actualizan juntos y la preferencia se conserva en el navegador.

Pulsaciones sucesivas cancelan la transición anterior y respetan la última intención. Se manejan las promesas de preparación/finalización cuando una transición se cancela, evitando errores no controlados. Si falta la API, el tema se aplica directamente y conserva su funcionalidad.

## Accesibilidad y límites

- `prefers-reduced-motion: reduce` elimina entradas, escalados, recolocación y fundido de tema; la interfaz responde inmediatamente.
- Un cambio a movimiento reducido cancela la transición de tema y las animaciones de listas que estén activas.
- Los desplegables cerrados son `inert` y no reciben foco de teclado. Su estado se comunica con `aria-expanded`/`aria-hidden`.
- El foco y los clics siguen disponibles durante las animaciones; los controles activos no se ocultan para esperar un efecto.
- La recolocación evita animar la tarjeta que contiene el foco y no conserva duplicados de elementos eliminados.
- Los efectos de hover de portada se limitan a dispositivos con hover y puntero preciso.
- No se promete el fundido nativo en navegadores sin soporte; el cambio de tema inmediato es la alternativa prevista.

## Implementación

| Archivo | Función |
| --- | --- |
| `mock-next/app/motion.css` | Duraciones, curvas, interacciones, logo, apariencia y reducción de movimiento |
| `mock-next/app/template.tsx` | Entrada de páginas en la navegación Next.js |
| `mock-next/components/motion.tsx` | Desplegable, respuesta de pulsación y recolocación de listas con Web Animations |
| `mock-next/components/shell.tsx` | Apariencia, icono, cancelación de transiciones y coordinación del logo |
| `mock-next/components/catalog.tsx` | Dirección del carrusel, guardados y resultados de búsqueda |
| `mock-next/components/admin.tsx` | Recolocación de fuentes y revisión |

Se usan CSS y APIs del navegador, sin incorporar otra biblioteca de animación. Los resultados y cambios de estado se aplican inmediatamente; las animaciones acompañan su presentación.

## Verificación ejecutada

Compilación TypeScript/Next.js y contenedor Docker saludables. El recorrido general de `tools/check_next_mock.cjs` sigue pasando.

Prueba específica `tools/check_mock_motion.cjs`: logo completo sin finalizar por eventos de las nervaduras, apertura/cierre y foco de desplegables, tema nativo, cambios rápidos, preferencia guardada, navegación, filtros y guardado. Comprueba también movimiento reducido, ausencia de API nativa y móvil de 390 px sin desbordamiento. No se registran errores JavaScript de página en ese recorrido.

Resultado en `output/next-mock/motion-checks.json`. Estas comprobaciones se ejecutan contra el mock local; no acreditan servicios backend ni mediciones de rendimiento en el LXC.
