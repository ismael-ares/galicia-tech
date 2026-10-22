# Recapitulación y ruta para continuar

Continuación del 21 de octubre: [Arquitectura propuesta para el primer backend](arquitectura-propuesta-2026-10-21.md). Concreta recomendaciones para los puntos abiertos de este registro histórico; distingue lo propuesto de las pruebas y decisiones aún pendientes.

Matices posteriores: [Tecnologías y motivos de elección](tecnologias-y-motivos-2026-10-21.md). El usuario confirma Tailwind CSS; plantea alternativas relacionales, más SSO, RabbitMQ y GitHub Actions. Las respuestas y las decisiones todavía abiertas están documentadas allí.

Sesión de texto y voz del 20 de octubre de 2026. Punto de reanudación: cerrar arquitectura, tecnologías, proveedores y coste antes de discutir nuevas funcionalidades o pantallas. El usuario solicita documentar y terminar la llamada; no iniciar la implementación real todavía.

> Actualización del 21 de octubre: esta recapitulación histórica queda complementada por el [plan vigente del homelab](plan-arquitectura-homelab-2026-10-21.md), con PostgreSQL y Redis confirmados, RabbitMQ descartado y GitHub Actions/cloud aplazados. Consultar allí el estado actual y sus evidencias.

## Decisiones y restricciones confirmadas

- Aplicación de eventos tecnológicos en Galicia, independiente de los servicios particulares del homelab y trasladable a alojamiento público.
- Stack elegido: Next.js, Django/Python y PostgreSQL. Docker obligatorio; Compose es la propuesta para ejecutar el conjunto.
- Primera instalación de pruebas en un LXC dedicado de Proxmox. El usuario dispone de plantilla Debian 13 y acepta otras distribuciones; se recomienda conservar Debian 13.
- Host con 16 GB de RAM total y unos 12–16 hilos, sin confirmar capacidad libre ni número exacto.
- Acceso privado por LAN y WireGuard. Traefik existente. No comprar dominio ni publicar en Internet para el testeo inicial.
- Alojamiento público futuro sin proveedor elegido: prioridad al coste total bajo, DNS y operación sencilla. Cloudflare/Vercel son posibilidades mencionadas, no contrataciones ni destinos confirmados.
- LLM por consumo, sin otra suscripción mensual de unos 20 EUR/USD. Techo inicial aceptado de 5 EUR/mes, intentando gastar bastante menos. No se ha comprado saldo, contratado ni conectado ningún servicio.
- Claude Code de aproximadamente 20 USD/mes se toma como Claude Pro; no asumir créditos API incluidos. No depender de renovar Codex.
- Preferencia por un modelo chino económico como DeepSeek, admitiendo Haiku u otros si coste y calidad encajan.
- El usuario acepta reducir la frecuencia de análisis LLM a cada tres días o dos veces por semana. No hay días/horas fijados ni una automatización creada.
- Proveedor y modelo intercambiables por configuración. Procesar novedades/cambios y reutilizar resultados.

## Propuestas técnicas que aún no son decisiones definitivas

- LXC inicial con 2 vCPU, 4 GB de RAM y 40 GB de disco, condicionado a recursos libres y medición real.
- Django y el trabajador Python compartirán lógica e imagen cuando proceda; los trabajos largos se ejecutarán fuera de las peticiones web.
- Un solo dominio/origen para interfaz y API, con una entrada web propia a la que Traefik pueda dirigir tráfico. La app no dependerá del login del proxy.
- django-allauth para credenciales locales y Google/GitHub; Django como única autoridad de cuentas, sesiones y permisos. No añadir otro servidor de identidad ni otro sistema de sesión en Next.js inicialmente.
- API directa de DeepSeek como primer candidato de prueba; Haiku como comparación y OpenRouter como alternativa para acceder a varios modelos. Falta elegir modelo concreto y validar calidad, tarifas y condiciones.
- Dos ejecuciones LLM semanales configurables como punto de partida. Separar este calendario de la consulta y extracción de fuentes, que pueden funcionar más a menudo sin tokens LLM. No asumir que toda API externa sea gratuita.
- Mantener la agenda y las tareas pendientes al llegar al techo de gasto; sin cambios automáticos a proveedores pagados que eludan el límite.
- Sin Redis obligatorio al comienzo; programación, cola y almacenamiento compartido de límites siguen por concretar y probar.

## Decisiones pendientes, en orden

1. Elegir proveedor/modelo inicial tras una comparación pequeña de DeepSeek y Haiku. Verificar acceso por API, formato estructurado, tarifas vigentes y coste completo, incluidos razonamiento, reintentos, comisiones e impuestos cuando apliquen.
2. Definir el control de los 5 EUR: periodo mensual, conversión de moneda, costes que cuenta, reserva previa por petición y bloqueo compartido entre procesos. Diferenciar saldo comprado, consumo y alertas del proveedor.
3. Elegir biblioteca de programación/cola, persistencia de trabajos, reintentos y coordinación para evitar ejecuciones duplicadas. Fijar posteriormente días y horas.
4. Cerrar la configuración real de acceso: credenciales locales, habilitación de proveedores sociales, MFA de administración, recuperación y límites de intentos. Comprobar callbacks OAuth y HTTPS local sin exigir comprar dominio para las pruebas.
5. Fijar versiones compatibles, interfaz API y mecanismo de configuración web/YAML. Los secretos van al servidor, no al navegador ni al repositorio. Autoridad única por sección para evitar conflictos.
6. Concretar almacenamiento de imágenes/observaciones, retención, copias fuera del LXC y recuperación.
7. Verificar versión/arquitectura de Proxmox y LXC, recursos libres, permisos/anidamiento Docker, IP o nombre interno y conexión con Traefik.

## Ruta posterior de implementación, tras cerrar el plan

1. Crear la base Docker Compose con versiones fijadas y configuración de ejemplo. Comprobar arranque y estado de servicios.
2. Conectar Next.js con Django y PostgreSQL: mostrar un evento persistente y conservarlo tras recrear contenedores. El mock no equivale a este resultado.
3. Implementar cuentas, sesión y autorización real. Verificar que un visitante y un usuario ordinario no acceden a operaciones administrativas aunque conozcan sus rutas.
4. Integrar la consulta de fuentes, evidencias, historial y tareas persistentes. Probar cambios, fallos de fuentes y reinicios sin cancelar eventos ni duplicar publicaciones por inferencia.
5. Conectar el proveedor LLM elegido y comprobar calidad, medición y corte de gasto con una muestra acotada. Una estimación aritmética de tokens no sustituye esta prueba.
6. Desplegar en el LXC y comprobar acceso LAN/WireGuard, persistencia, actualización y restauración.
7. Retomar funcionalidades y experiencia de usuario pendientes cuando la arquitectura quede cerrada. El proveedor público se elegirá cuando llegue la publicación.

## Estado real al cerrar la llamada

Hay un mock navegable, herramientas Python de consulta manual y documentación. Backend Django, migración a Next.js, autenticación real, Compose funcional, límite de gasto y ejecución programada todavía no están implementados. No hay despliegue real en el homelab ni credenciales conectadas.

## Documentos de referencia

- [Despliegue y entorno del homelab](despliegue-homelab.md).
- [LLM, suscripciones y presupuesto](llm-presupuesto.md): fuentes consultadas y ejemplos de coste, sujetos a verificación antes de contratar.
- [Cuentas, acceso y configuración](cuenta-acceso-configuracion-2026-10-20.md).

Para reanudar: leer esta recapitulación y la propuesta del día 21; revisar las recomendaciones técnicas y continuar por los puntos que requieran credenciales, datos concretos del LXC o pruebas de integración. No volver a preguntar datos del homelab ya recogidos salvo que haga falta verificarlos para desplegar.
