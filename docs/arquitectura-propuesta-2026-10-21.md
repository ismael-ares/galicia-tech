# Arquitectura propuesta para el primer backend

> Documento anterior conservado como antecedente. La referencia vigente es el [plan consolidado del homelab](plan-arquitectura-homelab-2026-10-21.md): PostgreSQL y Redis confirmados, RabbitMQ descartado, GitHub Actions/cloud aplazados y toda construcción inicial dentro del homelab. Las alternativas y pendientes de este texto no prevalecen sobre ese plan.

Revisión del 21 de octubre de 2026, retomando las decisiones del usuario. Es una propuesta concreta para revisar antes de empezar a implementar. No hay servicios desplegados, proveedores contratados ni pruebas de integración realizadas.

Este documento actualiza las propuestas técnicas pendientes de la recapitulación del día 20. Mantiene los requisitos confirmados: Django + Next.js + PostgreSQL, Docker obligatorio, LXC dedicado en Proxmox, independencia del homelab y gasto LLM pequeño con techo inicial de 5 EUR/mes. Funcionalidades y nuevas pantallas se tratarán después.

## 1. Componentes y versiones objetivo

| Componente | Propuesta | Responsabilidad |
| --- | --- | --- |
| Interfaz | Next.js 16, TypeScript, Tailwind CSS 4, Node.js 24 LTS | Pantallas públicas, cuenta, gestión, estilos y animaciones CSS |
| Servidor | Python 3.13, Django 5.2 LTS, Django REST Framework | API, validación, autorización y configuración |
| Acceso | django-allauth con API headless para navegador | Contraseña local, Google/GitHub, sesiones y MFA |
| Base de datos | PostgreSQL 17, controlador psycopg 3 | Datos, sesiones, historial, tareas y registro de gasto |
| Tareas | Django Q2, cola ORM sobre PostgreSQL | Programación y ejecución en segundo plano |
| Estado temporal de acceso | Redis local, caché dedicada | Límites de intentos compartidos entre procesos |
| Entrada web | Nginx incluido en el conjunto | Un origen para interfaz, API y callbacks |
| Empaquetado | Docker Engine y Compose | Servicios, redes, volúmenes y configuración reproducible |

Son familias objetivo. En el primer paso de implementación se elegirán parches mantenidos, versiones compatibles de las librerías, imágenes y archivos de dependencias bloqueados. La consulta documental no sustituye resolver dependencias, compilar y probar el conjunto.

El usuario aclara que la herramienta de estilos/animaciones que quiere incorporar es Tailwind. La justificación de base de datos, alternativas de SSO, papel de RabbitMQ y propuesta de entrega por GitHub Actions se desarrolla en [Tecnologías y motivos de elección](tecnologias-y-motivos-2026-10-21.md).

[Django 5.2 y Python compatibles](https://docs.djangoproject.com/en/5.2/releases/5.2/), [Next.js](https://nextjs.org/docs/app/getting-started/installation), [Node LTS](https://nodejs.org/en/about/previous-releases), [soporte PostgreSQL](https://www.postgresql.org/support/versioning/), [Django REST Framework](https://www.django-rest-framework.org/).

## 2. Distribución en el LXC

```text
LAN / WireGuard
       |
Traefik existente (opcional para el producto; HTTPS del entorno)
       |
Entrada web incluida (Nginx)
       |-- Next.js
       |-- Django -------- PostgreSQL
       |       |                |
       |       Redis       Trabajador Django Q2
       |                        |
       |                  Fuentes y API LLM
```

Propuesta de seis servicios Compose: `gateway`, `frontend`, `backend`, `worker`, `db`, `redis`. Backend y trabajador reutilizan la misma imagen Python con comandos distintos. El programador de Q2 vive en el trabajador; no hace falta otro contenedor dedicado al calendario inicial.

Solo se publica la entrada web. PostgreSQL y Redis permanecen en las redes internas; Next.js no consulta directamente las tablas. Habrá procesos puntuales para migraciones, aprovisionamiento y copias, sin contenedores permanentes para cada comando.

El destino inicial sigue siendo Debian 13 en Proxmox, con LAN y WireGuard. Traefik puede dirigir tráfico al gateway, pero la autenticación pertenece a Django. Un futuro servidor público podrá ejecutar las mismas imágenes cambiando configuración y restaurando datos.

Se mantiene como orientación 2 vCPU, 4 GB de RAM y 40 GB de disco si están libres. No es un consumo medido; las compilaciones pueden ejecutarse fuera del LXC. Falta verificar versión de Proxmox, permisos, anidamiento y almacenamiento Docker.

## 3. Tareas persistentes y programación

Se recomienda Django Q2 con broker ORM, para que las tareas se guarden en PostgreSQL. Su documentación contempla esta modalidad para tareas programadas y volúmenes moderados, con confirmación de entrega. No se promete ejecución exactamente una vez. [Brokers Q2](https://django-q2.readthedocs.io/en/master/brokers.html).

Punto de partida propuesto:

- Un trabajador efectivo (`workers=1`) y un solo programador activo.
- Cola interna pequeña; timeout de tarea y tiempo de reentrega configurados explícitamente, con `retry` holgadamente superior al timeout y al tiempo posible de espera en cola.
- Dos intentos como máximo para errores recuperables, sin reintentos ilimitados.
- `catch_up=False`: tras un apagado no ejecutar en ráfaga todos los análisis históricos omitidos. Reconciliar una vez las novedades pendientes.
- Identificador lógico único de cada trabajo y escrituras idempotentes para que una reentrega no duplique eventos o publicaciones.
- Catálogo cerrado de funciones ejecutables; las fuentes y las respuestas del LLM nunca proporcionan código o nombres de funciones para ejecutar.

[Configuración Q2](https://django-q2.readthedocs.io/en/master/configure.html), [programación y recuperación tras interrupciones](https://django-q2.readthedocs.io/en/master/schedules.html).

Dos calendarios independientes: consulta/extracción de fuentes y procesamiento LLM. Para el segundo se propone dos veces por semana. Días y horas siguen pendientes; todas las fechas se guardan en UTC y los calendarios se configuran con Europe/Madrid. No se ha creado una automatización en este chat.

Las tareas LLM necesitan tratamiento adicional: una petición que termina sin respuesta de red puede haber sido cobrada. Se conserva su reserva de gasto y se marca como incierta; no se repite automáticamente como si no hubiera ocurrido. El agotamiento de presupuesto queda pendiente para otro periodo y no se trata como error que deba reintentarse inmediatamente.

## 4. Redis: por qué se añade a la recomendación

La propuesta del día 20 permitía empezar sin Redis, dejando por concretar el limitador de acceso. Se recomienda ahora un Redis local dedicado a los contadores de autenticación, para compartirlos entre procesos y evitar desarrollar un sistema de caché propio.

allauth documenta que la caché del limitador debe ser compartida y conservar las entradas hasta su expiración; también recomienda operaciones atómicas y lecturas consistentes. Esto exige configuración y pruebas, no queda resuelto simplemente instalando Redis. [Requisitos del limitador de allauth](https://docs.allauth.org/en/latest/common/rate_limits.html).

Configurar una caché exclusiva, capacidad acotada con política sin expulsión de entradas de acceso, persistencia y manejo explícito de errores. Si deja de estar disponible, las operaciones que requieren esos límites no continúan sin protección. Verificar también comportamiento al reiniciar y presión de memoria.

Redis no es un servicio contratado ni un servidor de identidad. Implica consumo local y mantenimiento de un contenedor más. PostgreSQL conserva sesiones, tareas y presupuesto; la cola no depende de Redis. Una alternativa sin Redis requeriría elegir y probar un backend compartido equivalente antes de sustituirlo.

## 5. Cuentas, sesión y acceso social

Recomendación: django-allauth headless en Django, con sesión para navegador. Next.js presenta el formulario y los recorridos; no añade otra autoridad de sesión. Los cambios usan CSRF y cookies de sesión HttpOnly/Secure sobre HTTPS. El contenido privado no se almacena en cachés compartidas de Next.js. [allauth headless](https://docs.allauth.org/en/latest/headless/index.html).

API propia en `/api/v1/`; reservar también las rutas que necesite allauth y sus callbacks, publicadas por el mismo gateway. Las rutas exactas de allauth se tomarán de su versión bloqueada, sin inventar un protocolo paralelo.

- Credenciales locales para el propietario desde el primer acceso real.
- GitHub y Google habilitados solo cuando tengan cliente, secretos y callbacks válidos. Su ausencia no bloquea el arranque local.
- TOTP y códigos de recuperación para administración; el login social no concede permisos ni evita la política MFA del producto.
- Propietario creado mediante comando del servidor, sin contraseña predeterminada ni privilegio automático para el primer registro.
- Asignar permisos en Django y comprobarlos en cada operación. Vinculación de identidades explícita, sin fusionar cuentas por coincidencia simple de correo.
- Recuperación administrativa documentada desde el servidor. El correo para enlaces de recuperación será opcional hasta configurar y probar SMTP; no simular que se envían mensajes reales.

Probar los callbacks sociales con las direcciones admitidas por sus proveedores. No es necesario comprar dominio para iniciar el desarrollo, pero habrá que preparar HTTPS local confiable para sesiones reales. La preparación del entorno es un pendiente de despliegue.

## 6. LLM y presupuesto

Primer candidato de integración: API directa de DeepSeek con `deepseek-flash`, como identificador actualmente documentado. Es un alias que puede cambiar de modelo subyacente: registrar el modelo informado, versión de instrucciones/esquema y tarifa aplicada en cada petición, y reevaluar cambios. Haiku será candidato comparativo; no hay ganador validado por calidad todavía. [API oficial de DeepSeek](https://api-docs.deepseek.com/quick_start/).

El adaptador recibe texto ya extraído y un esquema de salida; devuelve datos validados y consumo. Proveedor/modelo se configuran en servidor; no se envía la clave al navegador. No se activa navegación autónoma ni herramientas de pago del proveedor como parte de la primera integración.

Reglas propuestas del gasto:

1. Techo de 5 EUR por mes natural de la aplicación en Europe/Madrid. Es un máximo, no un importe a consumir. La factura del proveedor puede usar otro calendario.
2. Registro contable en PostgreSQL con importes decimales o unidades enteras, estados reservado/confirmado/incierto y tarifas versionadas. Incluir todos los intentos y razonamiento facturable, cuando exista.
3. Antes de admitir una petición, bloquear transaccionalmente el presupuesto del periodo y reservar una cota conservadora según entrada acotada, salida máxima y tarifa. Otra tarea debe ver esa reserva antes de gastar.
4. Conversión USD/EUR conservadora y provisión de impuestos/comisiones configurables. Si no se puede valorar la petición con una tarifa vigente y una cota conocida, no ejecutarla. El límite local es un control preventivo basado en esa información; no garantiza por sí mismo el importe exacto de una factura externa.
5. Una llamada LLM concurrente inicialmente. Límites de tamaño, salida y duración; el modo de razonamiento se decide con la prueba de calidad y se incluye en el presupuesto.
6. Al llegar al techo, dejar tareas pendientes y mantener el resto de la aplicación operativo. No recargar saldo ni cambiar a otro proveedor pagado automáticamente.
7. La compra inicial de saldo y su posible comisión se revisan por separado antes de contratar: el pago adelantado no equivale al consumo mensual. No hay compras autorizadas por este documento.

Los resultados se reutilizan por contenido relevante, modelo, instrucciones y esquema. Se propone conservar observaciones originales para poder revisar el resultado; una web inaccesible o una llamada LLM fallida no cancela un evento.

Prueba previa al proveedor definitivo: casos etiquetados de la muestra y variaciones sintéticas identificadas, cubriendo fecha/zona horaria, acceso restringido, contradicciones, duplicados, campos ausentes y texto engañoso. Medir calidad y coste completo. No aceptar invenciones críticas de fechas, precios o acceso; los casos ambiguos deben quedar señalados. Ejecutar el mismo conjunto con los candidatos dentro del presupuesto, una vez configuradas sus claves.

La tarifa completa de DeepSeek y su disponibilidad para la cuenta siguen pendientes de comprobación antes de gastar. La página de inicio consultada documenta el modelo/API, pero no basta para calcular una factura. No se presenta un ahorro medido ni se reutiliza como previsión el ejemplo aritmético de Haiku del día 20.

## 7. Configuración, almacenamiento y operación

Mantener secretos y parámetros de alojamiento en archivos de secretos/entorno del servidor. Las fuentes, frecuencias y configuración operativa se gestionan desde la web por defecto. YAML es una autoridad alternativa por sección; cuando se elige, tanto interfaz como API impiden editar esa sección. Validar completamente el archivo antes de aplicarlo y conservar la última configuración válida ante una recarga fallida.

PostgreSQL guarda datos de negocio y metadatos. Un volumen `media` almacena imágenes y evidencias necesarias; sus rutas se referencian desde la base. El historial de versiones y las decisiones de revisión se guardan con su procedencia. No se guardan imágenes grandes como filas ordinarias.

Propuesta inicial de retención: 30 días para capturas brutas sin referencias, conservando las que sostengan eventos o revisiones mientras sean necesarias. Registrar el consumo por petición durante 12 meses y mantener agregados. Estos valores son configurables y no están aplicados al mock.

Copia diaria consistente de PostgreSQL junto a archivos y secretos necesarios, fuera del LXC; retención inicial propuesta de siete copias diarias y cuatro semanales. Antes de dar por válido el despliegue, restaurar en un entorno separado y comprobar cuentas, eventos, imágenes, trabajos y gasto. Las actualizaciones incluirán copia previa, migraciones coordinadas y comprobación de salud; volver a una imagen anterior no revierte automáticamente la base de datos.

## 8. Ruta de implementación y puntos de comprobación

| Paso | Entregable | Evidencia necesaria |
| --- | --- | --- |
| 1 | Versiones bloqueadas y Compose | Construcción y arranque desde configuración de ejemplo, redes internas y salud |
| 2 | API, PostgreSQL y Next.js conectados | Evento leído desde la base y persistencia tras recrear contenedores |
| 3 | Sesión, roles, MFA y límites compartidos | Visitante/usuario sin acceso administrativo, concurrencia y fallos de caché probados |
| 4 | Cola ORM y consulta de fuentes | Reinicios, reentregas, reintentos y fallos de fuente sin duplicados |
| 5 | Adaptador LLM y presupuesto | Prueba comparativa, reservas concurrentes y corte de gasto, sin repeticiones inciertas |
| 6 | Despliegue LXC | LAN/WireGuard, Traefik/HTTPS, copias y restauración |

Primero se revisa esta propuesta técnica. La implementación real y la contratación siguen pendientes. Para el despliegue harán falta los datos concretos del LXC; para la prueba de modelos, acceso a API configurado de forma privada. Las nuevas funcionalidades y pantallas permanecen fuera de esta fase.
