# Tecnologías y motivos de elección

> Antecedente de la discusión de alternativas. Actualización posterior del usuario: PostgreSQL y Redis confirmados, RabbitMQ descartado y GitHub Actions/registro remoto aplazados. Rige el [plan consolidado del homelab](plan-arquitectura-homelab-2026-10-21.md). Los apartados sobre RabbitMQ y GitHub Actions conservan la valoración histórica; no son trabajo aprobado para la fase actual.

Matices del usuario y valoración del 21 de octubre de 2026. Continúa la planificación; no se instalan dependencias ni se crean workflows o servicios reales por este cambio.

## Interfaz: Tailwind CSS

El usuario confirma que se refería a Tailwind, no a una biblioteca de animación React. Incorporación a la propuesta: Next.js + TypeScript + Tailwind CSS 4.

Tailwind es un framework CSS de utilidades: organiza estilos, estados, diseño adaptable y modo oscuro. Incluye utilidades para transiciones y animaciones CSS, variantes de movimiento reducido y soporte para animaciones propias. No decide por sí solo el aspecto de los componentes: se conserva la identidad Material Expressive aprobada, los colores y la vieira.

Utilizar Tailwind para maquetación, temas, estados y transiciones habituales. Conservar animaciones personalizadas de SVG/CSS cuando lo requiera la marca. Respetar movimiento reducido, foco y teclado. La extracción de componentes React compartidos evita repetir largas combinaciones de clases por toda la aplicación.

No se incorpora Motion/Framer Motion por suposición. Si aparecen necesidades complejas de animación de disposición o coordinación de gestos, se evaluará una biblioteca específica con un caso concreto. Los estilos y animaciones del mock siguen en sus archivos actuales hasta la migración.

Fuentes: [Tailwind con Next.js](https://tailwindcss.com/docs/installation/framework-guides/nextjs), [animaciones y movimiento reducido](https://tailwindcss.com/docs/animation), [transiciones](https://tailwindcss.com/docs/transition-property).

## Base de datos: por qué PostgreSQL

PostgreSQL es relacional, igual que MySQL, MariaDB y SQLite. Las relaciones entre eventos, fuentes, usuarios y revisiones se representan mediante tablas, claves y restricciones. La recomendación no se basa en que las alternativas carezcan de transacciones.

La aplicación tendrá escrituras concurrentes desde la web y el trabajador. Necesita conservar datos relacionados, impedir duplicados y reservar presupuesto sin que dos procesos gasten el mismo saldo disponible. PostgreSQL aporta transacciones y bloqueos de filas, está soportado por Django y permite usar la misma base en el homelab y en un futuro servidor público.

También permite conservar metadatos variables de las fuentes en JSON junto a los datos normalizados, y dispone de opciones de búsqueda textual si llegaran a necesitarse. Estas capacidades no son exclusivas de PostgreSQL ni justifican usar JSON para toda la información.

| Alternativa | Valoración para este proyecto |
| --- | --- |
| PostgreSQL | Recomendación por integración con Django y encaje conjunto de datos, tareas y transacciones |
| MySQL/MariaDB con motor transaccional | Alternativas válidas; merecerían prioridad si hubiera una razón operativa concreta para utilizarlas |
| SQLite | Muy cómoda para herramientas locales; no es la base propuesta para API y trabajador concurrentes. Django documenta límites de concurrencia y que `select_for_update()` no bloquea filas en SQLite |

Elegir PostgreSQL supone mantener y copiar un servidor de base de datos, incluido como contenedor. MySQL/MariaDB también requieren esa operación. No se presume que PostgreSQL siempre sea más rápido ni que exista una comparativa de rendimiento de esta aplicación.

Fuentes: [bases de datos soportadas y diferencias en Django](https://docs.djangoproject.com/en/5.2/ref/databases/), [tipos JSON en PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html).

## Acceso: proveedores adicionales

Django aporta usuarios, permisos y sesiones. django-allauth añade recorridos de cuenta, MFA y proveedores sociales. Añadir un proveedor normalmente significa registrar la aplicación, configurar callbacks y secretos y probar vinculación y recuperación; no arrancar otro servidor de identidad.

La recomendación inicial sigue siendo credenciales locales, Google y GitHub. Microsoft es el candidato adicional más útil para cubrir cuentas personales y profesionales; allauth dispone de integración. La configuración del tenant y las políticas de las organizaciones afectan a quién puede entrar.

La integración básica de Microsoft se evalúa como registro directo de aplicación, no como contratación de un producto CIAM o de políticas empresariales premium. Antes de habilitarla se comprobarán requisitos y condiciones de la cuenta concreta; no se promete gratuidad universal para cualquier modalidad de identidad.

Otros proveedores, por ejemplo Discord, se valorarían cuando exista una necesidad. Aunque un acceso básico no tenga tarifa por login, cada integración añade configuración, secretos, pruebas y mantenimiento.

Apple queda aplazado: su integración web requiere un Services ID asociado a un App ID principal habilitado para Sign in with Apple. Su Developer Program publica una cuota de 99 USD/año, con precios regionales y posibles exenciones. No se añade esa obligación al proyecto personal para ampliar botones de acceso.

Ningún proveedor adicional se activa con este documento. El propietario conserva acceso local; los proveedores sociales no conceden roles administrativos.

Fuentes: [Microsoft en allauth](https://docs.allauth.org/en/latest/socialaccount/providers/microsoft.html), [registro de aplicaciones Microsoft](https://learn.microsoft.com/en-us/entra/identity-platform/quickstart-register-app), [Apple para web](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web), [cuota Developer Program](https://developer.apple.com/programs/enroll/).

## Redis, cola de tareas y RabbitMQ

El usuario plantea RabbitMQ como alternativa al interpretar que Redis guardaría tareas. La propuesta vigente distingue estas funciones:

| Función | Pieza propuesta |
| --- | --- |
| Contar y limitar intentos de acceso entre procesos | Redis, caché dedicada |
| Guardar trabajos pendientes y sus resultados | PostgreSQL, mediante Django Q2 |
| Programar y ejecutar esos trabajos | Programador y trabajador de Django Q2 |
| Distribuir mensajes con un broker dedicado alternativo | RabbitMQ, si se cambia la arquitectura de tareas |

Redis también puede utilizarse como broker en otras configuraciones; aquí se propone para acceso. RabbitMQ se dedica a mensajería y no sustituye directamente la caché que utiliza el limitador de allauth.

RabbitMQ es una alternativa sólida para mensajería dedicada y varios consumidores. Una opción coherente sería Celery + RabbitMQ, con programación mediante Celery Beat y resultados/estado en PostgreSQL. Ese cambio afectaría a Q2 y a su cola ORM; Redis seguiría teniendo un cometido separado si se conserva el limitador propuesto.

Para las pocas ejecuciones previstas inicialmente, se mantiene como recomendación Q2 + PostgreSQL por menor número de componentes operativos. No es una prohibición de RabbitMQ ni una elección definitiva aceptada por el usuario. Si se prefieren sus capacidades operativas desde el inicio, se revisarán conjunto, recursos y pruebas antes de implementar; no se añadirá RabbitMQ a Q2 por simple sustitución de una URL.

Fuentes: [colas RabbitMQ](https://www.rabbitmq.com/docs/queues), [brokers de Celery](https://docs.celeryq.dev/en/stable/getting-started/backends-and-brokers/index.html), [brokers Q2](https://django-q2.readthedocs.io/en/master/brokers.html), [limitador allauth](https://docs.allauth.org/en/latest/common/rate_limits.html).

## GitHub Actions y despliegue

El usuario plantea GitHub Actions/pipelines como dirección probable. Se recomienda GitHub Actions para CI/CD; un pipeline es el flujo de pasos y el rollout es la fase de despliegue, no son plataformas alternativas a Actions. Docker Compose sigue siendo el mecanismo que ejecuta la aplicación en el servidor.

Flujo propuesto:

1. Pull request: comprobaciones estáticas y pruebas con PostgreSQL/Redis de prueba, sin secretos ni llamadas LLM pagadas.
2. Código integrado y validado: construir las imágenes una vez y publicarlas en GHCR, identificadas por commit y digest.
3. Despliegue explícito de una versión: comprobar salud y copia previa, descargar esas imágenes, aplicar migraciones coordinadas y recrear los servicios con Compose.
4. Comprobar la aplicación y conservar referencia de la versión anterior. La restauración de base de datos se trata aparte del retroceso de imágenes.

El pipeline no obliga a crear una plataforma Kubernetes ni a contratar Azure DevOps. Evitar recompilar en el LXC reduce sus picos de memoria.

Un runner estándar alojado por GitHub no tiene acceso directo a nuestra LAN. El despliegue automatizado privado requiere elegir entre conectividad restringida por VPN o un runner local aislado para trabajos de despliegue confiables. También se puede iniciar con CI y publicación de imágenes en GitHub y un comando de despliegue ejecutado en el homelab.

No ejecutar pull requests no confiables en un runner con acceso al homelab o a las credenciales de despliegue. Separar sus permisos de los de compilación y fijar acciones y artefactos; esto responde al acceso real que tendría el ejecutor del pipeline.

El coste depende del repositorio, plan, tipo de runner y almacenamiento. GitHub publica cuotas para repositorios privados y gratuidad para runners estándar en repositorios públicos y para uso de runners propios; hay que presupuestar también el almacenamiento de imágenes/artefactos. No se garantiza coste cero sin comprobar el plan y el uso.

Pendientes: confirmar si el repositorio será público o privado, destino de publicación de imágenes y mecanismo de acceso desde el job de despliegue al LXC. No hay repositorio remoto creado ni workflow ejecutado por esta propuesta.

Fuentes: [conceptos Actions](https://docs.github.com/en/actions/get-started/understand-github-actions), [GHCR](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry), [red privada](https://docs.github.com/en/enterprise-cloud%40latest/actions/concepts/runners/private-networking), [runners y código no confiable](https://docs.github.com/en/actions/reference/security/secure-use), [facturación](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
