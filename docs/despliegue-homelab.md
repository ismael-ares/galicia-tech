# Despliegue inicial: homelab con LXC dedicado

La [propuesta del 21 de octubre](arquitectura-propuesta-2026-10-21.md) amplía el esquema inicial siguiente a seis servicios Compose con Redis local para límites de acceso y Django Q2 sobre PostgreSQL para las tareas. Es una recomendación técnica pendiente de integración.

Decisión del usuario, 20 de octubre de 2026. Este documento describe el destino de la futura implementación; todavía no hay un despliegue funcional ni compatibilidad comprobada en el LXC.

> Referencia actual: [plan consolidado del 21 de octubre](plan-arquitectura-homelab-2026-10-21.md). Construcción, pruebas y despliegue inicial dentro del homelab; sin CI/CD remoto en esta fase. Este documento conserva el contexto previo y no acredita un despliegue ejecutado.

## Requisitos confirmados

- Primer alojamiento: un LXC dedicado en el homelab del usuario, para pruebas.
- Dockerización obligatoria. Se propone Docker Compose dentro del LXC para ejecutar el conjunto.
- Aplicación independiente de los sistemas de identidad y servicios particulares del homelab.
- Arquitectura elegida: Next.js, Django y PostgreSQL.
- Posibilidad de trasladar la instalación a un servidor público conservando datos y el modelo de cuentas.

## Entorno comunicado por el usuario

- Host Proxmox con 16 GB de RAM total y aproximadamente 12–16 hilos; el número exacto y los recursos libres no están verificados.
- Plantilla Debian 13 disponible, con flexibilidad para elegir distribución. Propuesta: conservar Debian 13, soportado por Docker Engine según su [documentación](https://docs.docker.com/engine/install/debian/).
- Acceso de pruebas por LAN y por el WireGuard existente; no se solicita exposición pública.
- Traefik ya disponible en el homelab. Su conexión a la entrada web será opcional para conservar un despliegue independiente.
- No se comprará un dominio para el testeo. Proveedor y dominio públicos se elegirán después, priorizando coste total y facilidad de operación.
- Presupuesto LLM bajo, con techo inicial aceptado de 5 EUR/mes y preferencia por gastar bastante menos, sin otra suscripción mensual. No hay contratación ni compra de saldo. Proveedor/modelo configurable; DeepSeek directo es el candidato inicial propuesto, pendiente de comparación.

## Dimensionamiento propuesto, pendiente de medir

Empezar con 2 vCPU, 4 GB de RAM y 40 GB de disco para el LXC, si el host dispone de ese margen libre. Es una propuesta de partida, no una medición de consumo. El resto de servicios del homelab comparte los 16 GB totales.

Una única tarea de recopilación a la vez al comenzar. No se propone alojar el LLM en el homelab inicialmente; las llamadas irían a un proveedor configurable. Las compilaciones pueden hacerse fuera del LXC si sus picos afectan a la memoria disponible.

La navegación puede probarse por IP privada. Para sesiones y autenticación reales se preparará HTTPS confiable en el entorno local; un nombre interno no exige comprar un dominio. Los accesos sociales se probarán con callbacks admitidos por cada proveedor, sin asumir que cualquier dirección privada es válida.

El adaptador LLM y sus controles de gasto se describen en [LLM y presupuesto](llm-presupuesto.md).

## Distribución propuesta

```text
Homelab
└── LXC dedicado: alojamiento de Docker
    └── Docker Compose
        ├── Entrada web / proxy
        ├── Interfaz Next.js
        ├── API y cuentas Django
        ├── Tareas de recopilación Python
        └── PostgreSQL
```

El proxy del conjunto permitirá una instalación autónoma. Si existe un proxy en el homelab, podrá dirigir tráfico a esa entrada; el producto no dependerá de su autenticación.

Solo se publicará la entrada web hacia la red prevista. PostgreSQL y las comunicaciones entre servicios permanecerán en redes internas de Docker. El destino inicial es el homelab; no se presupone apertura de puertos a Internet.

Los datos de PostgreSQL y los archivos persistentes se conservarán en volúmenes. Las copias recuperables cubrirán base de datos, archivos y secretos necesarios, con una copia fuera del LXC. Una instantánea del LXC puede complementar ese procedimiento; no se dará por validada una restauración sin probarla.

La configuración del dominio, conexiones y secretos se suministrará al despliegue. La migración futura incluirá datos, archivos, configuración de HTTPS y actualización de callbacks de acceso social si cambia el dominio.

## Pendiente antes de desplegar

- Confirmar versión de Proxmox, arquitectura, recursos libres y configuración privilegiada/no privilegiada del LXC. Debian 13 es la distribución propuesta.
- Comprobar Docker dentro del LXC y los ajustes de anidamiento, almacenamiento y red que requiera esa plataforma. No se asume que cualquier LXC pueda ejecutarlo sin preparación.
- Concretar IP o nombre interno, HTTPS y conexión con Traefik para la LAN y WireGuard existentes.
- Elegir programación/cola de tareas y validar persistencia, reinicios, actualización y restauración.

La preparación del host se documentará aparte de la aplicación. Los cambios de configuración del host se concretarán cuando se conozca su plataforma.
