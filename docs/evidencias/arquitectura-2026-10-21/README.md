# Evidencias de arquitectura · 21 de octubre de 2026

> Captura anterior a la creación del nuevo mock Next.js. Las huellas y la búsqueda de artefactos describen ese momento, no un inventario vivo. La [verificación posterior del mock](../../verificacion-mock-next-2026-10-21.md) documenta su interfaz y contenedor; el backend completo sigue pendiente.

Complemento del [plan vigente](../../plan-arquitectura-homelab-2026-10-21.md). Este registro permite distinguir decisiones humanas, código existente, pruebas locales y respaldo documental. Ninguna consulta documental prueba que el sistema esté desplegado.

## Decisiones de la conversación

| ID | Evidencia | Consecuencia |
| --- | --- | --- |
| E01 | Última instrucción: «base de datos vas a utilizar Postgre y vas a utilizar luego Redis. No me hagas caso con lo de Rabbit» | PostgreSQL y Redis confirmados; RabbitMQ descartado |
| E02 | Última instrucción: «obviar por ahora el tema de GitHub […] hacerlo todo en el homelab» | CI/CD y alojamiento externos aplazados; no afecta por sí sola a GitHub como login opcional |
| E03 | Última instrucción: «única y exclusivamente […] evidencias, tecnologías, decisiones […] arquitectura» | Entregable documental; pantallas y ejecución de servicios fuera de esta fase |
| E04 | Decisiones previas visibles en el historial: Django/Next.js, aclaración Tailwind, Docker imprescindible, LXC Proxmox, Debian 13 disponible, LAN/WireGuard | Restricciones de arquitectura; recursos y compatibilidad del LXC sin medir |
| E05 | Conversación sobre coste: API económica, sin nueva cuota fija, aceptación de techo inicial de 5 EUR y procesamiento espaciado | Control de gasto obligatorio; proveedor y calidad pendientes de prueba |

## Inventario y comprobaciones ejecutadas

El [inventario JSON](inventario.json) conserva SHA-256, tamaño de archivos y búsqueda de artefactos de implementación. Las huellas identifican la evidencia revisada; no sustituyen una entrega versionada. No se inspeccionaron credenciales ni variables privadas.

| ID | Archivo o prueba | Resultado y límite |
| --- | --- | --- |
| E06 | `eventos_galicia.py`: `gdg`, `meetup`, `deduplicate`, `reconcile`, `run` | CLI manual de cuatro fuentes originales. No backend, cola ni búsqueda programada real |
| E07 | `cover_discovery.py`: `parse_page`, `classify_candidate`, `discover_event`, `run` | Extracción de candidatos y validación de portadas. No agente LLM de búsqueda |
| E08 | `mock/source-catalog.json` y `tests/test_mock_state.cjs` | Catálogo/modelo del prototipo. No equivale a conectores operativos para todas las fuentes ni a autenticación |
| E09 | [Prueba Node](mock-tests.log), [metadatos](mock-result.json) | `node tests/test_mock_state.cjs`, Node v24.19.0, salida 0. Modelo del mock correcto; no prueba DOM, backend ni permisos reales |
| E10 | [Pruebas Python](python-tests.log), [metadatos](python-result.json) | Python 3.13.5, salida 1. Pasan 14 casos de portadas; falla la importación del módulo del colector por `ZoneInfoNotFoundError` y ausencia de `tzdata`. Los casos de ese módulo no llegaron a ejecutarse |
| E11 | Búsqueda local de Dockerfiles, Compose, manifiestos Python y Node | Resultado en inventario. No se dispone todavía del conjunto de implementación descrito por el plan |

Los tests usan fixtures y dobles de red. Sus resultados no verifican que las páginas públicas mantengan hoy el mismo contenido. Los logs se capturaron en el Windows de trabajo, no dentro del LXC. No se instalaron dependencias para corregir el fallo ni se realizaron llamadas LLM pagadas en esta recopilación.

## Fuentes documentales oficiales

Consultadas para esta planificación el 21 de octubre de 2026. Las páginas de documentación pueden cambiar; versiones exactas, tarifas y condiciones se volverán a comprobar al bloquear dependencias o activar servicios.

| ID | Fuente | Qué respalda y qué queda pendiente |
| --- | --- | --- |
| E12 | [Django 5.2](https://docs.djangoproject.com/en/5.2/releases/5.2/), [DRF](https://www.django-rest-framework.org/) | Familias propuestas y soporte declarado; resolver y probar dependencias juntas |
| E13 | [Bases Django](https://docs.djangoproject.com/en/5.2/ref/databases/), [versiones PostgreSQL](https://www.postgresql.org/support/versioning/) | Soporte de PostgreSQL y diferencias entre motores; no demuestra rendimiento del proyecto |
| E14 | [Next.js](https://nextjs.org/docs/app/getting-started/installation), [autoalojamiento](https://nextjs.org/docs/app/guides/self-hosting), [Node](https://nodejs.org/en/about/previous-releases) | Ejecución propia y requisitos de runtime; construcción de la aplicación pendiente |
| E15 | [Tailwind con Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs), [animación](https://tailwindcss.com/docs/animation) | Integración y utilidades CSS. No requiere incorporar otra biblioteca de movimiento |
| E16 | [allauth headless](https://docs.allauth.org/en/latest/headless/index.html), [instalación](https://docs.allauth.org/en/latest/headless/installation.html), [límites](https://docs.allauth.org/en/latest/common/rate_limits.html) | Sesiones y requisitos de caché compartida; autorización, CSRF, MFA y fallos necesitan pruebas reales |
| E17 | [Google en allauth](https://docs.allauth.org/en/latest/socialaccount/providers/google.html), [GitHub](https://docs.allauth.org/en/latest/socialaccount/providers/github.html) | Integraciones disponibles; no hay clientes ni callbacks del proyecto verificados |
| E18 | [Q2: brokers](https://django-q2.readthedocs.io/en/master/brokers.html), [configuración](https://django-q2.readthedocs.io/en/master/configure.html), [programación](https://django-q2.readthedocs.io/en/master/schedules.html) | Broker ORM, reentregas y recuperación de calendarios. No garantiza ejecución exactamente una vez |
| E19 | [Caché Django](https://docs.djangoproject.com/en/5.2/topics/cache/) | Backend Redis disponible. La política de errores y protección del login debe implementarse y probarse |
| E20 | [Docker en Debian](https://docs.docker.com/engine/install/debian/) | Debian 13 soportado por Docker. No certifica la configuración particular de Proxmox/LXC |
| E21 | [Orden y disponibilidad Compose](https://docs.docker.com/compose/how-tos/startup-order/) | Diferencia entre arranque y servicio disponible; healthchecks y migraciones coordinadas |
| E22 | [DeepSeek API](https://api-docs.deepseek.com/quick_start/), [JSON](https://api-docs.deepseek.com/guides/json_mode/), [razonamiento](https://api-docs.deepseek.com/guides/thinking_mode/) | Contrato del candidato, formato y control de razonamiento. Tarifa completa, acceso, calidad y gasto real pendientes |

## Lo que todavía no tiene evidencia de ejecución

- Compatibilidad Docker/almacenamiento dentro del LXC y consumo real de RAM/CPU/disco.
- Resolución conjunta de las versiones propuestas y arranque Compose.
- Autenticación, autorización, MFA, callbacks sociales y limitador Redis del producto.
- Cola persistente, concurrencia SQL, reinicios y control presupuestario.
- Comparativa de modelos o factura LLM real.
- HTTPS local, copia y restauración del despliegue.

Se aceptará cada punto únicamente con la evidencia definida en las fases P1–P6 del plan. La falta de evidencia no se presenta como una prueba superada.
