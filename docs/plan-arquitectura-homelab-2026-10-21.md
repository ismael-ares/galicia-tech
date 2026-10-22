# Plan técnico consolidado · homelab

**Actualización del 22 de octubre:** se ha iniciado la implementación funcional. Consultar [versión 0.1](primera-version-0.1.md) para el alcance y las comprobaciones actuales. Este documento conserva las decisiones y los criterios originales; no todas sus fases se dan por completadas.

Fecha: 21 de octubre de 2026. Documento vigente para retomar el proyecto.

Este plan incorpora la última decisión del usuario: PostgreSQL y Redis confirmados, RabbitMQ descartado y construcción, pruebas y despliegue inicial íntegramente en el homelab. GitHub Actions, publicación de imágenes y despliegue cloud quedan aplazados. GitHub como proveedor opcional de acceso es una cuestión distinta.

**Estado de la arquitectura completa:** no hay backend ni despliegue LXC implementados. Tras esta recopilación, el usuario pidió un nuevo mock: existe ahora una [interfaz Next.js/TypeScript/Tailwind con su propio contenedor de vista previa](../mock-next/README.md), comprobado en Docker local. Eso no completa los seis servicios ni las fases de datos, identidad, trabajos o LLM. El contenido siguiente conserva el plan de esa arquitectura completa.

## 1. Decisiones y grado de cierre

| ID | Decisión | Estado y motivo |
| --- | --- | --- |
| D01 | Docker y Docker Compose | Requisito confirmado. Mismo empaquetado para homelab y futuro servidor |
| D02 | LXC dedicado en Proxmox; Debian 13 | Destino comunicado y distribución disponible. Compatibilidad real de Docker dentro de ese LXC pendiente |
| D03 | Next.js + TypeScript + Tailwind CSS | Elección confirmada. Tailwind cubre estilos y animación CSS; no se añade Motion por suposición |
| D04 | Django + Django REST Framework | Backend elegido: reglas, API, cuentas y permisos centralizados |
| D05 | PostgreSQL | Confirmado expresamente. Datos relacionados, sesiones, trabajos y reservas transaccionales de gasto |
| D06 | Redis local | Confirmado expresamente. Caché compartida dedicada a límites de acceso; no es la cola de tareas de este diseño |
| D07 | Django Q2 con broker ORM PostgreSQL | Solución técnica propuesta para el volumen inicial. Requiere probar reentrega, bloqueos y reinicios |
| D08 | Django Auth + django-allauth headless | Sesión propia del producto, credenciales locales y Google/GitHub opcionales. Sin servicio de identidad externo obligatorio |
| D09 | Gateway Nginx incluido | Propuesta para servir interfaz y API bajo un origen. Traefik del homelab es una integración opcional de entrada |
| D10 | API LLM de pago por consumo, máximo inicial 5 EUR/mes | Criterio acordado; objetivo gastar bastante menos. Proveedor definitivo y tarifa completa aún sin validar |
| D11 | DeepSeek directo como primer candidato; Haiku comparativo | Propuesta de evaluación, no una calidad ni un coste real demostrados |
| D12 | Procesamiento LLM dos veces por semana, configurable | Punto de partida propuesto a partir del margen indicado por el usuario. Días y horas pendientes |
| D13 | LAN y WireGuard durante las pruebas | Confirmado. Sin compra de dominio ni publicación en Internet en esta fase |
| D14 | Construcción y operación locales | Última instrucción confirmada. Sin GitHub Actions, runners, GHCR ni plataforma cloud en el despliegue inicial |
| D15 | RabbitMQ fuera del plan | Descartado expresamente. No se implementan dos sistemas de colas |

La autonomía significa que la aplicación conserva cuentas, configuración y datos propios. Las consultas a las fuentes, la API LLM y los proveedores sociales habilitados siguen necesitando Internet. No se propone alojar un modelo local con los recursos actuales.

## 2. Componentes, versiones y responsabilidades

| Pieza | Familia objetivo | Responsabilidad |
| --- | --- | --- |
| Frontend | Next.js 16, TypeScript, Tailwind CSS 4; Node.js 24 LTS | Interfaz y renderizado; nunca acceso SQL directo ni autoridad paralela de autenticación |
| Backend | Python 3.13, Django 5.2 LTS, DRF | API, validación, sesiones, autorización, configuración y auditoría |
| Autenticación | django-allauth con headless y MFA | Flujos de contraseña, acceso social, vinculación y segundo factor |
| Datos | PostgreSQL 17 y psycopg 3 | Persistencia, integridad, transacciones y cola ORM |
| Trabajos | Django Q2 | Programador y ejecución fuera de las peticiones web |
| Límites | Redis | Contadores compartidos de acceso con expiración |
| Entrada | Nginx | Enrutamiento al frontend/backend y entrega controlada de archivos públicos |
| Operación | Docker Engine + plugin Compose | Imágenes, redes, volúmenes y ciclo de vida |

Estas familias son objetivos documentales, **no un conjunto de versiones ya resuelto**. Antes de construir se fijarán versiones exactas compatibles, dependencias transitivas, imágenes base y sus identificadores. No se utilizará `latest` como contrato de despliegue. Redis, Nginx y Q2 necesitan selección de versión mantenida en ese paso.

Se reutilizará la lógica útil de los scripts mediante módulos y pruebas, sin convertir el CLI completo en una petición web. El catálogo del mock tiene trece fuentes, pero el colector actual solo dispone de cuatro adaptadores originales; migrar el catálogo no equivale a disponer de trece conectores operativos.

### Por qué PostgreSQL y Redis

PostgreSQL encaja con las relaciones entre fuentes, eventos, observaciones y cuentas. Django soporta su ORM y sus bloqueos transaccionales, necesarios para reservar presupuesto ante llamadas concurrentes. MySQL/MariaDB también serían opciones relacionales válidas; aquí la elección ya está cerrada. No existe una comparativa que demuestre mayor rendimiento de esta aplicación.

Redis resuelve un estado temporal compartido entre procesos para el limitador de allauth. Las sesiones, las tareas y el presupuesto permanecen en PostgreSQL. Esta separación evita que vaciar una caché borre trabajos o saldos. No se necesita RabbitMQ para este reparto.

## 3. Topología y recursos

```text
LAN / WireGuard
      |
Traefik del homelab (opcional, terminación HTTPS)
      |
gateway Nginx
      |-- frontend Next.js
      |-- backend Django ---- PostgreSQL
      |          |                 |
      |        Redis          worker Django Q2
      |                            |
      |                       fuentes / API LLM
```

Seis servicios permanentes: `gateway`, `frontend`, `backend`, `worker`, `db`, `redis`. Backend y worker comparten imagen Python con comandos distintos. Q2 incluye el programador; inicialmente habrá uno activo y un trabajador efectivo. Migraciones, aprovisionamiento y copias serán comandos puntuales, no servicios permanentes adicionales.

Solo se publicará el puerto de entrada. PostgreSQL y Redis quedarán en redes internas de Compose. El navegador no accede a ellos. Las salidas a Internet se limitarán a los componentes que las necesiten; no se presupone que una red Docker sustituya la validación de URLs.

Orientación inicial: **2 vCPU, 4 GB RAM y 40 GB de disco para el LXC**, sujeta a espacio libre y medición. El host tiene 16 GB totales según el usuario; no se conoce la carga restante. Esto no es una garantía de capacidad. Construir Next.js puede producir picos: las compilaciones se harán secuencialmente dentro del homelab y se medirán antes de fijar límites.

Debian 13 figura entre los sistemas soportados por Docker Engine. Eso no valida automáticamente Docker dentro de un LXC: hay que comprobar versión de Proxmox, tipo de contenedor, arquitectura, cgroups, permisos/anidamiento, driver de almacenamiento y volúmenes. No se modificarán privilegios del contenedor sin conocer esos datos.

## 4. Contrato entre interfaz, servidor y acceso

- Un origen web para interfaz, `/api/v1/` y las rutas oficiales de allauth correspondientes a su versión bloqueada.
- Django es la autoridad de usuarios, permisos y sesiones. Next.js consulta la API; ocultar botones no sustituye la autorización del servidor.
- Sesión de navegador mediante cookie HttpOnly y Secure, HTTPS confiable, comprobación CSRF y política SameSite compatible con los callbacks probados. No se guardarán credenciales de sesión en localStorage.
- Respuestas privadas fuera de cachés compartidas del frontend y gateway; no reutilizar datos de un usuario para otro.
- Acceso local del propietario creado mediante comando de servidor, sin contraseña por defecto ni privilegios para el primer registro.
- Google/GitHub solo se habilitan al registrar aplicaciones y probar secretos/callbacks. Su ausencia no impide arrancar. No se presume que una IP privada sirva como callback válido para todos los proveedores.
- MFA TOTP y códigos de recuperación para administradores. El acceso social no otorga privilegios por sí mismo; vincular identidades exige un flujo explícito.
- Recuperación del propietario disponible desde el servidor. El envío de correo no se da por operativo hasta configurar y probar SMTP.

Redis tendrá una caché dedicada, memoria dimensionada, TTL y política `noeviction`, con persistencia y tratamiento explícito de errores. Los accesos que necesitan límites no continuarán sin protección ante caída o saturación. Deben probarse reinicios, pérdida de contadores y concurrencia; instalar Redis no demuestra que el limitador sea correcto. Solo se confiará en cabeceras de IP procedentes del proxy configurado.

No se necesita CAS, Keycloak ni otro servidor de identidad independiente para este alcance. La portabilidad se obtiene manteniendo la identidad del producto en Django y las integraciones externas como opciones.

## 5. Datos y almacenamiento

Propuesta de grupos de datos, sin cerrar todavía todos los modelos o campos:

| Grupo | Datos e invariantes |
| --- | --- |
| Identidad | Usuario, identidad social vinculada, roles, MFA y sesiones; permisos comprobados en servidor |
| Fuentes | Catálogo, configuración del conector, observaciones fechadas y estado de consulta |
| Eventos | Evento normalizado, relación con una o varias fuentes y revisiones; conservar procedencia por dato relevante |
| Ejecuciones | Trabajo lógico, intentos y resultados; identificadores únicos e idempotencia |
| Gasto | Periodo, tarifa, reserva y consumo confirmado/incierto; contabilidad transaccional |
| Configuración | Autoridad por sección, versión activa y registro de cambios |

PostgreSQL guarda datos estructurados y metadatos. Un volumen de archivos guarda portadas y evidencias, referenciadas desde la base. Los archivos privados no se exponen mediante una ruta pública de medios.

Fechas persistidas en UTC; calendarios y presentación en Europe/Madrid. Se declarará y comprobará la disponibilidad de `tzdata`, especialmente en desarrollo Windows. Probar cambios de horario y fechas sin zona explícita.

Los contenidos de fuentes y las salidas LLM son datos no confiables: no ejecutan instrucciones del servidor. Las descargas tendrán límites de tiempo, tamaño y tipo. Las URLs configuradas y cada redirección deberán impedir acceso a loopback, direcciones privadas y servicios internos del homelab; los dominios de imágenes/CDN requerirán una política explícita. El contenido presentado se escapará o saneará; las imágenes descargadas se validarán antes de servirlas.

Retención inicial propuesta: capturas sin referencias 30 días; conservar las que respalden registros/revisiones vigentes. Consumo por petición 12 meses y agregados posteriores. Son valores pendientes de validar con el volumen real, no reglas aplicadas actualmente.

## 6. Cola, programador y recuperación

Django Q2 usará el broker ORM de PostgreSQL. Se acepta entrega con posibles reintentos, sin prometer ejecución exactamente una vez.

1. Un trabajador efectivo y un programador; concurrencia adicional solo tras medir y probar.
2. Trabajos registrados antes de ejecutarse; identificador lógico único según operación, fuente, contenido y versión de procesamiento.
3. Escrituras idempotentes y restricciones en base para que una reentrega no duplique eventos ni decisiones.
4. Timeouts HTTP y de tarea acotados; intervalo de reentrega superior al timeout y al tiempo posible de espera en la cola. Dos intentos máximos para errores recuperables; verificar la semántica en la versión elegida.
5. `catch_up=False` para evitar una ráfaga de ejecuciones omitidas tras apagar el servidor. Reconciliar las novedades pendientes de forma acotada.
6. Separar frecuencia de descarga y frecuencia LLM. Horarios sin configurar y llamadas pagadas desactivadas hasta completar las comprobaciones.
7. Una fuente inaccesible o un evento que desaparece de un listado no constituyen una cancelación.

Las operaciones LLM requieren estados propios: una petición enviada sin respuesta puede haber sido cobrada. Conservar su reserva, marcarla incierta y evitar el reintento automático. Alcanzar el presupuesto produce trabajo aplazado, no una tormenta de reintentos.

## 7. LLM: integración y límite económico

No se añade otra suscripción mensual. La suscripción personal de herramientas de desarrollo no es una dependencia de ejecución de la aplicación. El candidato inicial es la API directa de DeepSeek, comparada después con Haiku en una muestra pequeña; OpenRouter queda como alternativa.

El adaptador del servidor recibirá contenido ya extraído y devolverá un objeto validado junto al consumo disponible. Proveedor, modelo, tarifa y límites serán configurables. La clave nunca se entrega al navegador ni se incorpora a imágenes Docker.

El identificador `deepseek-flash` figura en la documentación consultada; es un alias, no un modelo inmutable. Se registrarán el modelo informado y las versiones de instrucciones/esquema. La tarifa completa, las condiciones de saldo y la disponibilidad de la cuenta deben comprobarse antes de cualquier compra o llamada real.

El modo JSON ayuda al formato, pero no garantiza el esquema ni la veracidad de los datos. Validación estricta en la aplicación, campos desconocidos explícitos y contradicciones dirigidas a revisión. Propuesta inicial: razonamiento desactivado explícitamente para controlar coste/latencia, sujeto a evaluación; contabilizar todo razonamiento facturable cuando se habilite.

Controles necesarios:

- Reutilizar resultados por hash de contenido relevante, proveedor/modelo, instrucciones y esquema. No volver a enviar una página idéntica por cambiar su fecha de consulta.
- Entrada, salida, duración e intentos acotados; una llamada concurrente inicialmente.
- Tope inicial de **5 EUR por mes natural en Europe/Madrid**, con objetivo inferior. Registrar en qué periodo se admitió la petición, aunque termine en otro mes.
- Reservar una cota conservadora del coste en una transacción PostgreSQL antes de llamar. Usar enteros o Decimal; incluir cambio de moneda, impuestos/comisiones y todos los intentos.
- Si falta una tarifa vigente o no puede calcularse una cota, no llamar. Reconciliar la reserva con el consumo confirmado; conservarla ante incertidumbre.
- Sin recarga automática ni cambio automático a otro proveedor pagado. La agenda debe seguir funcionando cuando se agote el presupuesto.

El control local depende de tarifas y medición; no garantiza por sí solo una factura externa exacta. La compra adelantada de saldo es otro gasto y requiere revisarse por separado. **No hay compra ni llamadas pagadas autorizadas o realizadas como parte de este plan.**

La evaluación futura medirá fechas, precios, duplicados, contradicciones, campos ausentes y texto engañoso con casos etiquetados. Se guardarán consumo y errores por modelo. No se puede afirmar aún cuánto costará un mes real ni cuál ofrece mejor calidad.

## 8. Configuración y secretos

Los parámetros de alojamiento y secretos residirán en archivos del servidor con permisos restringidos. La configuración funcional podrá tener autoridad web o YAML por sección, nunca dos autoridades editables simultáneas. Una sección YAML se bloquea también en la API; una recarga inválida conserva la última versión válida.

El archivo existente `config.example.yaml` es un ejemplo de contrato, no una configuración ejecutable. Antes de adoptarlo se definirán esquema, validación y migraciones. Las claves API, credenciales OAuth, secretos Django y contraseñas SQL quedan fuera del catálogo y del repositorio.

Los logs incluirán identificadores de trabajo, fuente, duración, resultado y consumo; no contraseñas, tokens, cookies ni claves. Salud de proceso y disponibilidad de dependencias se comprobarán por separado. No se añade una plataforma externa de observabilidad al arranque inicial.

## 9. Construcción, despliegue y copias en el homelab

La implementación futura preparará Compose, Dockerfiles, ejemplos sin secretos y comandos locales documentados. Esta fase no los crea.

Secuencia prevista de entrega local:

1. Comprobar configuración y resolver dependencias bloqueadas.
2. Ejecutar las pruebas y construir las imágenes dentro del homelab, controlando picos de recursos.
3. Identificar la entrega por versión y huellas de fuentes/imágenes. Conservar la anterior; no depender de etiquetas mutables.
4. Realizar copia previa y detener trabajos durante cambios incompatibles.
5. Esperar salud de PostgreSQL/Redis, ejecutar migraciones una vez y solo entonces iniciar procesos dependientes.
6. Verificar API, sesión, worker y persistencia. Registrar resultado y versión desplegada.

Compose necesita healthchecks y dependencias de disponibilidad; que un contenedor esté arrancado no significa que acepte conexiones. No habrá un workflow de GitHub ni un registro remoto obligatorio. Si se construye en otra máquina del homelab, habrá que probar el traslado/importación de las mismas imágenes.

Persistencia: datos PostgreSQL, medios/evidencias, estado Redis y configuración/secretos externos a las imágenes. Propuesta: copia diaria consistente con archivos y secretos necesarios, cifrada fuera del LXC, en almacenamiento del homelab. Retención inicial: siete diarias y cuatro semanales. Destino y capacidad pendientes.

Antes de aceptar el despliegue se restaurará una copia en un entorno separado, sin disparar tareas pagadas ni duplicar programadores. Comprobar usuarios, eventos, archivos, trabajos y reservas. Los snapshots del LXC no serán la única copia; volver a una imagen antigua no revierte una migración SQL.

## 10. Hoja de ruta técnica y criterios de aceptación

Estas son fases futuras de arquitectura; no incluyen el nuevo diseño de pantallas.

| Fase | Entregable | Evidencia para darla por terminada |
| --- | --- | --- |
| P0 · actual | Plan, decisiones y evidencia de partida | Documentación enlazada y distinción entre probado/propuesto/pendiente |
| P1 · entorno | Inventario real del LXC y versiones bloqueadas | Docker/Compose funcionando, recursos libres medidos, zonas horarias disponibles y dependencias resueltas |
| P2 · base local | Seis servicios, API mínima y persistencia | Construcción reproducible, healthchecks, migración única y datos conservados tras recrear contenedores |
| P3 · identidad | Sesión, roles, MFA y limitación compartida | Visitante/usuario sin permisos admin; CSRF, caché privada, concurrencia y caída/saturación Redis comprobados |
| P4 · trabajos | Q2, adaptadores y observaciones persistentes | Reentrega sin duplicados, apagado/reinicio, máximo de intentos y fallo de fuente sin cancelación inventada |
| P5 · LLM | Adaptador, evaluación y presupuesto | Primero simulaciones de reservas concurrentes/mes/corte/timeout incierto; después prueba real limitada con clave y tarifa verificadas |
| P6 · operación | Despliegue local y recuperación | LAN/WireGuard/HTTPS, medición de carga, copia y restauración ensayadas con versión identificada |

Pruebas nuevas deberán verificar riesgos reales de integración: SQL concurrente, cookies/permisos, fallos de Redis, reentregas y gasto incierto. No se considerará suficiente que los mocks pasen. Las llamadas pagadas estarán desactivadas en las pruebas ordinarias.

## 11. Datos pendientes antes de implementar/desplegar

- Proxmox y LXC: versiones, arquitectura, tipo/privilegios, espacio y RAM realmente libres, almacenamiento y configuración de anidamiento.
- Dirección de acceso, integración opcional con Traefik y método de HTTPS confiable local.
- Destino de copias fuera del LXC y prueba de restauración.
- Parches exactos compatibles y formato final de configuración. Comprobar licencia y requisitos de las versiones seleccionadas.
- Días/horas de los dos calendarios y sus límites por ejecución.
- Para activar LLM: proveedor/modelo tras evaluación, tarifa completa, límites de cuenta y clave introducida de forma privada.
- Para activar SSO: clientes OAuth y callbacks válidos; SMTP si se quiere recuperación por correo.

No hace falta resolver todos esos datos para revisar este plan. Sí son puertas de entrada a sus fases correspondientes; no se darán por confirmados por ausencia de respuesta.

## 12. Evidencia y continuidad

El [registro de evidencias](evidencias/arquitectura-2026-10-21/README.md) recoge archivos inspeccionados, resultados reales, huellas y fuentes documentales oficiales. La compatibilidad documentada se distingue de una integración ejecutada.

Resultado local de partida: prueba Node del modelo del mock correcta; 14 pruebas Python de portadas correctas y un error de importación del módulo del colector por ausencia de `tzdata`/Europe/Madrid. La batería completa no está aprobada. No hay mediciones del LXC ni pruebas reales de autenticación, cola o LLM.

Tras cerrar esta documentación, el siguiente trabajo de planificación será definir las opciones esenciales de la primera pantalla en un documento separado. No se añaden aquí calendarios, notificaciones ni nuevos recorridos visuales.
