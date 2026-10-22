# Cuenta de usuario, acceso y configuración

Revisión técnica posterior: la [propuesta del 21 de octubre](arquitectura-propuesta-2026-10-21.md) concreta allauth headless y recomienda un Redis local para los límites de intentos, resolviendo la elección de almacenamiento compartido que este documento dejaba pendiente. Las propuestas siguen sin implementación real.

Revisión de planteamiento del 20 de octubre de 2026. Este documento sustituye la propuesta anterior centrada en un login exclusivo de administración. Es diseño y planificación: no hay autenticación, OAuth ni autorización real conectados.

## Decisiones de experiencia de usuario

La cabecera pública muestra Agenda y Mi cuenta. La entrada a administración está dentro de Mi cuenta y aparece únicamente para perfiles que tengan los permisos correspondientes. La consulta de eventos y de sus fuentes sigue siendo pública.

- Visitante: ve la opción de iniciar sesión; puede consultar la agenda.
- Usuario: tiene perfil y preferencias. No ve enlaces de administración.
- Administrador: dispone además de fuentes, revisión, resumen y ajustes de aplicación.
- Propietario: tendrá la capacidad adicional de conceder y retirar permisos administrativos. Se trata de una capacidad de autorización, no de un método de login distinto.

Iniciar sesión con GitHub, Google o credenciales locales identifica a la persona. Ninguno de esos métodos concede por sí mismo el rol administrador. Las cuentas nuevas empiezan como usuarios. La asignación de administración procede de una operación autorizada del propietario.

El login se centra en una única tarjeta. Se elimina la columna de beneficios. Presenta métodos de acceso configurados y el formulario local, con recuperación y estados de error/caducidad. El segundo factor se muestra cuando la política de la cuenta u operación lo exige; no se fuerza visualmente a todos los usuarios normales.

## Login con el menor número de servicios

Se mantiene Django con django-allauth, ejecutándose dentro de la propia aplicación. No requiere arrancar Keycloak, Authentik, CAS, Firebase, Clerk o un servidor de identidad adicional. PostgreSQL conserva cuentas, identidades vinculadas, roles y sesiones.

### Arquitectura elegida: Django + Next.js

El usuario elige Django con Next.js el 20 de octubre de 2026. Esta decisión sustituye las alternativas evaluadas de Django con HTMX, SvelteKit, Nuxt o Astro; no implica que el prototipo HTML esté migrado.

- Next.js: agenda pública, fichas de eventos, área de usuario e interfaz de gestión con el diseño Material Expressive existente.
- Django: API, validación de datos, cuentas, sesiones, permisos, configuración y lógica de fuentes, eventos y revisión.
- django-allauth: acceso local y flujos de Google/GitHub gestionados por Django. Next.js no mantiene un segundo sistema de cuentas o sesiones.
- PostgreSQL: almacenamiento compartido de los datos de aplicación y sesiones.
- Recopilación: proceso separado de las peticiones web que reutiliza la lógica Python del proyecto; la programación y la cola se decidirán al implementar.

La propuesta de despliegue publica ambos servidores bajo un mismo origen mediante un proxy: Next.js sirve la interfaz y Django recibe los prefijos reservados para API y cuentas, incluidos los callbacks OAuth. Las rutas exactas se fijarán al implementar. El frontend usa la sesión de Django con cookies HttpOnly y protección CSRF en las operaciones que modifican datos. Si Next.js consulta datos privados durante el renderizado en servidor, debe transmitir la sesión de esa petición a Django y evitar cachés compartidas de contenido personal.

Django decide la autorización en cada operación y solo devuelve los datos permitidos. Los controles de navegación de Next.js complementan esa decisión. No se propone añadir Auth.js/NextAuth ni guardar tokens de acceso en localStorage.

Esto requiere ejecutar el servidor de Next.js y el de Django, además de la base de datos y el proceso de recopilación. Se podrán alojar en el mismo servidor doméstico o público; la arquitectura no exige contratar una plataforma de hosting concreta.

La propuesta revisada es ofrecer GitHub y Google como accesos principales configurables y conservar una vía local de acceso y recuperación para el propietario. Se pueden desactivar los proveedores y usar solo credenciales locales. Tampoco es obligatorio que los usuarios sociales tengan una contraseña local: activar ese método requiere un proceso autorizado de establecimiento de contraseña.

allauth dispone de integraciones con [GitHub](https://docs.allauth.org/en/latest/socialaccount/providers/github.html) y [Google](https://docs.allauth.org/en/latest/socialaccount/providers/google.html). Estas se conectan directamente con los proveedores y necesitan sus propios clientes OAuth, secretos y callbacks registrados. Los botones solo aparecerán en producción si ese proveedor está configurado correctamente.

### Coste y dependencia

La integración propuesta evita contratar un intermediario de autenticación de pago. Google documenta la creación de una cuenta y proyecto gratuitos para su integración de acceso; GitHub permite registrar una aplicación bajo la cuenta personal u organización. No se ha identificado en esas guías una suscripción adicional exigida para la integración básica descrita. Antes de activar producción deberán comprobarse condiciones, cuotas y verificación aplicables; no es una garantía de gratuidad ilimitada o permanente. [Guía oficial de Google](https://codelabs.developers.google.com/codelabs/sign-in-with-google-button), [registro de aplicaciones GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app).

Google Cloud Identity Platform es un producto con su propia facturación por uso. No forma parte de la integración directa recomendada aquí. [Precios oficiales de Identity Platform](https://cloud.google.com/identity-platform/pricing).

Delegar el acceso simplifica el recorrido de contraseña y recuperación del usuario, pero depende de la disponibilidad y políticas del proveedor. La aplicación sigue siendo dueña de sus datos, permisos y sesiones. El acceso local del propietario permite administrar la instalación sin depender del login externo, y debe conservar su propia protección de segundo factor.

### Identidades y permisos

Mantener un usuario interno estable y una tabla de identidades externas con una restricción única por proveedor y sujeto. Para Google se identifica la cuenta validando los datos OIDC y su sujeto estable; para GitHub se utiliza la identidad estable devuelta por su flujo OAuth y API. No convertir un nombre visible, un correo coincidente o el nombre de usuario actual de GitHub en una concesión de permisos.

La vinculación de un nuevo proveedor a una cuenta existente debe hacerse tras autenticar esa cuenta o con un procedimiento explícito de recuperación. No activar asociaciones automáticas globales por coincidencia de correo. allauth advierte del riesgo de tratar un correo de proveedor como acceso automático a una cuenta local. [Configuración de cuentas sociales](https://docs.allauth.org/en/latest/socialaccount/configuration.html).

El backend validará el protocolo mediante la librería: estados, callbacks, validación de tokens cuando corresponda, emisor/audiencia y protección contra reutilización. Se solicitarán solo permisos de identificación; no se requieren permisos de repositorios, organizaciones, Drive o calendario.

El frontend recibirá de la aplicación sus capacidades, por ejemplo `can_access_management` o `can_manage_sources`. Ocultar enlaces mejora la navegación; la autorización de todas las operaciones se comprueba en servidor. La información de rol del proveedor externo o una propiedad enviada por el cliente no es la fuente de permisos de esta aplicación.

## Menos servicios desde el primer despliegue

La base para el acceso es aplicación + PostgreSQL. Sesiones, roles, auditoría y configuración de gestión pueden vivir en esa base. Redis deja de ser un requisito inicial del login de la propuesta anterior.

Si se ejecutan varias instancias, las sesiones y los límites de intentos deben compartir estado. La implementación del limitador deberá usar un backend compartido compatible y probado: puede justificarse Redis si el mecanismo o la carga lo necesita, o una solución transaccional sobre la base de datos. No se dará por resuelto usando contadores en memoria ni asumiendo que cualquier caché de base de datos hace incrementos atómicos.

Los trabajos de consulta de fuentes se separarán de las peticiones web, pero no obligan a introducir un servicio de identidad. Se decidirá su cola/programación al implementar la ingestión. La misma aplicación podrá desplegarse en casa o en un alojamiento público cambiando configuración y datos, no su modelo de cuentas.

## Configuración web frente a YAML

Recomendación: usar ambos con responsabilidades y autoridad explícitas.

| Información | Fuente propuesta | Tratamiento en la web |
| --- | --- | --- |
| Conexión a BD, claves y secretos OAuth | Secretos del entorno/archivos de secretos | Nunca se devuelven sus valores al navegador. |
| Dominio, proxies de confianza y configuración de despliegue | Entorno/YAML del servidor | Estado informativo, no edición ordinaria. |
| Proveedores habilitados y políticas de cuenta | Web o YAML, eligiendo una autoridad para esta sección | Editable si la autoridad es web; solo lectura si es YAML. |
| Fuentes y parámetros de las lecturas | Web por defecto; YAML opcional para despliegues declarativos | Mismo criterio de autoridad por sección. |
| Eventos, revisiones, cuentas, roles y sesiones | Base de datos | Se gestionan con permisos; no son un archivo de configuración. |

### Modo web

Los valores se validan, se guardan de forma transaccional y se versionan en la base de datos. La configuración efectiva se comparte entre procesos; cambiarla no modifica archivos dentro de un contenedor. Registrar quién cambió cada valor. Exigir permisos y reautenticación para modificar métodos de acceso o políticas sensibles.

### Modo YAML

El archivo es la autoridad para la sección declarada. La UI muestra valores efectivos, origen y estado de aplicación, con controles deshabilitados. La API también rechaza escrituras sobre esa sección: bloquear solo los campos del navegador no basta.

Validar esquema, versión, claves desconocidas/duplicadas y tipos antes de aplicar; no admitir etiquetas que construyan objetos ejecutables. Una recarga incorrecta conserva la última configuración válida e informa del fallo. Un arranque sin configuración válida falla explícitamente. No se hace una mezcla silenciosa de valores de web y YAML sobre la misma sección.

El cambio de autoridad debe ser una operación administrativa explícita, con validación y revisión de diferencias. No se propone guardar roles de usuarios o contraseñas en YAML. El alta inicial del propietario se hace mediante el procedimiento administrativo del servidor y no como un «primer usuario que se registra».

Se adjunta `config.example.yaml` como ejemplo de contrato futuro. No lo lee el mock ni está conectado a un backend. Las referencias a secretos son nombres de variables, no los secretos.

## Protección prevista para el backend

Se mantienen las sesiones revocables del lado servidor, cookies Secure/HttpOnly/SameSite, CSRF, límites de intentos y auditoría sin credenciales. La administración requiere sesión completa y permiso; con contraseña válida y MFA pendiente no se autoriza una operación de gestión. El login social tampoco debe saltarse la política de MFA adicional que la aplicación imponga al propietario.

El enlace a un proveedor, la retirada de un método y la recuperación de una cuenta deben impedir dejar al propietario sin una vía de acceso operativa. La recuperación de una contraseña no elimina por sí sola un MFA activo. Mantener un procedimiento local de recuperación para evitar que una cuenta externa bloqueada deje inaccesible la instalación.

El futuro registro social puede crear usuarios ordinarios, según la política configurada; no administradores. El registro local público se mantendría cerrado inicialmente. Estas son propuestas de producto para confirmar al implementar, no servicios conectados por este cambio.

## Qué hace el mock revisado

- `cuenta.html`: vistas de visitante, usuario y administrador. El selector está dentro de «Vista de muestra».
- `login.html`: tarjeta centrada, accesos GitHub/Google y credenciales locales simulados. Todos conducen al perfil ordinario de muestra.
- `ajustes.html`: sección de acceso editable en la vista web o bloqueada en la vista YAML. «Aplicar a esta vista» no persiste ni modifica el servidor.
- Los perfiles se propagan entre páginas mediante un parámetro `perfil` de demostración. No se guardan roles o sesiones de autenticación en localStorage ni cookies.
- Las rutas privadas muestran un estado de acceso restringido al recorrerlas con el perfil ordinario/visitante. Esto es presentación: sus recursos siguen servidos por un servidor estático y no hay seguridad real.
- La validación y transmisión de credenciales y los contactos con Google/GitHub siguen desconectados.

El parámetro de muestra nunca será una fuente de permisos en la aplicación real. La identidad efectiva procederá exclusivamente de la sesión validada y de los permisos almacenados en el servidor.

## Validación del prototipo revisado

Se comprobó el recorrido visitante → login → usuario; ambos proveedores simulados entrando como usuario ordinario; la vista administrativa del perfil de muestra; la conservación de las pausas de fuentes; navegación y salida; controles deshabilitados en modo YAML y editables en modo web; y sincronización del tema desde Mi cuenta. No se detectaron errores JavaScript, solicitudes con los datos de prueba del formulario ni desbordes en nueve vistas, dos temas y cinco anchos entre 320 y 1280 px. La comprobación numérica de 374 textos sobre fondos uniformes no encontró ratios inferiores a 4,5:1 (3:1 para texto grande). No constituye una auditoría de accesibilidad o seguridad del backend futuro.

## Criterios para la implementación posterior

1. Un visitante y un usuario normal no reciben controles ni datos administrativos de las APIs.
2. Conceder y retirar permisos afecta al servidor; falsificar `perfil`, un rol en JSON o el almacenamiento del navegador no cambia la autorización.
3. Cualquier método de acceso crea/recupera el mismo usuario interno; no concede administración ni fusiona cuentas por coincidencias no verificadas.
4. Se puede desactivar un proveedor y el propietario conserva una vía de acceso y recuperación operativa.
5. OAuth inválido, callback manipulado, `next` externo y una sesión con MFA pendiente no permiten entrar en gestión.
6. El modo YAML es solo lectura también en servidor, y un archivo inválido no aplica cambios parciales.
7. Configuración, sesiones, límites y revocaciones funcionan con más de una instancia de la aplicación.
8. Se prueba la restauración de datos, configuración y secretos en otro servidor.

Estos criterios pertenecen al backend futuro y no se validan por el comportamiento del prototipo.
