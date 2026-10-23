# Configuración de la aplicación en Git

El archivo activo es [configuration/app.yaml](../configuration/app.yaml), montado como solo lectura en backend y worker. Sustituye los antiguos ajustes web, `processing.yaml` y los parámetros de política que estaban en `.env`. El esquema es `version: 1` y rechaza claves desconocidas, claves repetidas, tipos incorrectos y valores fuera de sus límites.

| Sección | Qué controla |
| --- | --- |
| `sources` | Identificador estable, nombre, URL HTTPS, localidad, plataforma y estado de cada fuente. |
| `collection` | Activación, frecuencia, días de consulta, intervalo mínimo, programador, fichas y eventos por fuente, tiempo de trabajo y trabajos interrumpidos. |
| `fetch` | Dominios permitidos, tamaño de página, redirecciones y esperas de conexión/lectura. |
| `processing` | Frecuencia y presupuesto previstos para LLM; las llamadas pagadas siguen sin implementar y se exige `false`. |
| `access` | Registro, cuentas locales de prueba, MFA administrativo, proveedores sociales admitidos, duración de sesión e inactividad y limitador adicional de intentos. |
| `profiles.local.access` | Ajustes de acceso del perfil local, sin duplicar el catálogo ni el resto de la política. |

`APP_PROFILE=production` es el valor predeterminado de `.env.example`. En este equipo se usa `APP_PROFILE=local`: registro habilitado, `admin/admin`, `user/user`, cuentas registradas temporales y administración sin MFA obligatorio. Al actualizar un despliegue anterior, sustituye sus variables `ALLOW_REGISTRATION`, `LOCAL_TEST_ACCOUNTS`, `REQUIRE_ADMIN_MFA`, `COLLECTION_ENABLED` y `CONFIG_AUTHORITY` por el perfil y las claves correspondientes del YAML. Los perfiles forman parte del YAML y se validan incluso cuando no están seleccionados. El modo de registro social continúa cerrado; habilitar un proveedor requiere además sus credenciales OAuth y comprobar sus callbacks.

Los secretos no se escriben en YAML ni en Git: contraseña de PostgreSQL, claves Django/MFA y credenciales OAuth siguen en `.env` o sus variables `*_FILE`. Dirección, puerto, hosts/orígenes del despliegue y cookies HTTPS permanecen en `.env`; contenedores, redes y volúmenes en `compose.yaml`. Preferencias y datos personales, revisiones, observaciones y eventos se guardan en PostgreSQL. Los límites internos de allauth siguen vigentes además del limitador adicional configurable.

## Cambiar una fuente

Edita una entrada de `sources` conservando su `id`. Para pausar, cambia `enabled: false`. Para añadir, incorpora una entrada con identificador y URL únicos; su dominio debe estar expresamente en `fetch.allowed_hosts`. No se amplía esa lista de permisos automáticamente. La validación no realiza peticiones ni garantiza que una página disponga de un formato de extracción compatible.

```yaml
- id: coruna
  name: GDG A Coruña
  url: https://gdg.community.dev/gdg-a-coruna/
  city: A Coruña
  platform: GDG
  enabled: true
```

El arranque crea y actualiza esos campos en la base y conserva fechas de lectura y errores operativos. Una fuente retirada del YAML se desactiva, no se borra: mantiene sus eventos, relaciones, observaciones y revisiones y aparece identificada como «Fuera del YAML» en la pantalla de consulta. Los eventos publicados siguen visibles. Tampoco se borran guardados ni asistencias. El colector solo admite fuentes activas presentes en el YAML.

`daily` permite consultar cualquier día; `twice-weekly` restringe la consulta a los dos días indicados en `weekdays`. El intervalo mínimo entre consultas también se aplica en ambos modos.

El archivo completo se valida antes de aplicar nada. La sincronización usa una transacción y falla ante conflictos de identidad/URL; no reasigna una URL existente a otro identificador. Las ejecuciones repetidas del mismo archivo no duplican fuentes, programadores o auditorías. `seed_sources` se conserva como alias de sincronización y ya no lee fuentes del JSON de muestra.

## Validar y aplicar

La configuración queda fijada al iniciar cada proceso; no hay recarga implícita en cada petición. Para un cambio exclusivo del YAML:

```sh
# Verificación de sintaxis, esquema, perfiles y fuentes, sin Django ni base de datos:
docker compose run --rm --no-deps backend python -m config.app_configuration

# Opcional: compatibilidad de identificadores y URLs con la base, sin escribir:
docker compose run --rm --no-deps backend python manage.py sync_configuration --check

# Repite las dos verificaciones, detiene el worker y recrea backend y worker en orden:
sh infra/reload-config.sh
```

La validación no detiene servicios si encuentra un error. Tras validarla, el backend sincroniza fuentes, parámetros y programador antes de atender tráfico; el worker se inicia cuando el backend está sano. El frontend lee la política efectiva desde la API y no necesita reconstruirse por un cambio exclusivo de YAML. Al cambiar también código o esquema, usa `sh infra/start.sh` para construir y migrar antes del arranque.

El reinicio del backend elimina las cuentas temporales de pruebas de la ejecución anterior. Los dos accesos fijos, las cuentas persistentes y sus datos permanecen. Si una aplicación falla después de la validación previa, el comando termina con error; revisa los registros, corrige o revierte el YAML en Git y vuelve a aplicar. Una sincronización fallida revierte la transacción y conserva el catálogo.

## Consultar qué está aplicado

Configuración muestra perfil, revisión SHA-256 de la política efectiva, parámetros activos y su YAML sin secretos. Si se edita el archivo durante una ejecución, indica «Cambios pendientes» o «YAML inválido» y conserva los valores de esa ejecución. Un archivo inválido impide un nuevo arranque. La revisión identifica contenido, no es un hash de commit Git; el historial y las diferencias se consultan en Git.

Las API de fuentes y parámetros rechazan POST/PATCH/PUT aunque el usuario sea administrador. La revisión editorial y las consultas manuales habilitadas siguen siendo operaciones del panel. Las API públicas no exponen el documento de configuración ni claves.
