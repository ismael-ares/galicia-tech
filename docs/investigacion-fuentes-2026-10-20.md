# Investigación de fuentes tech de Galicia

Consulta: **20 de octubre de 2026**. Se parte de las seis fuentes seleccionadas: GDG A Coruña, GDG Ourense, GDG Santiago de Compostela, WordPress Coruña, WordPress Vigo y GPUL. Durante la investigación no se modificó el catálogo. **Selección posterior aplicada:** se añadieron los cinco grupos WordPress, CoruñaJUG y Python A Coruña; el catálogo base tiene ahora 13 fuentes. Véase `fuentes-seleccionadas-2026-10-20.md`. Las recomendaciones de este informe son propuestas para seleccionar fuentes.

Se han revisado páginas oficiales, perfiles de los organizadores, el directorio público de GDG y enlaces cruzados desde las fuentes actuales. Las referencias a actividad se limitan a lo que muestran las páginas consultadas: no son una auditoría de todos los eventos de cada colectivo. Las fichas se contrastaron mediante descarga directa cuando el buscador ofrecía versiones antiguas. HTML y resultados de inspección: `output/research-sources-2026-10-20/`.

## 1. Otras comunidades de las mismas familias

### Google Developer Groups

El [directorio oficial de capítulos](https://gdg.community.dev/chapters/) contiene un listado público `localChapters`. En la lectura actual se identifican **A Coruña, Ourense y Santiago de Compostela** al filtrar España y las localidades gallegas. Ya están en el prototipo. No he encontrado otro capítulo gallego actual en ese listado; esto no demuestra que no pueda haber otros canales o iniciativas universitarias fuera del listado consultado.

| Candidata | Evidencia actual | Decisión propuesta |
| --- | --- | --- |
| [GDG Lugo](https://www.meetup.com/es-es/gdg-lugo/) | El grupo existe en Meetup. La página muestra dos eventos pasados, de octubre y noviembre de **2019**, sin próximos visibles. La URL supuesta `gdg.community.dev/gdg-lugo/` devuelve 404. | Confirmado como grupo, pero **prioridad baja** hasta observar reactivación. |
| GDG Vigo | Hay referencias históricas en el [blog de GDG Spain](https://blog.gdg.es/2017/02/?m=0). La ruta `gdg.community.dev/gdg-vigo/` termina en la portada general; el antiguo perfil `meetup.com/GDGVigo/` devuelve una página «Group not found», aunque el HTTP sea 200. | **No proponer como fuente operativa actual** con estas direcciones. |
| GDG Pontevedra | Aparece en [material histórico de GDG Galicia](https://devfest.gdggalicia.com/assets/GDG_DevFest_Partnership.pdf). La ruta `gdg.community.dev/gdg-pontevedra/` acaba en la portada general. La variante de Meetup probada no identifica un grupo; no se ha confirmado una dirección vigente. | Existencia histórica, **canal actual pendiente de localizar**. |

También se comprobaron `gdg.gal` y `galicia.gdg.gal`, enlazado este último desde GDG Ourense. Las páginas recuperadas se titulan «Google Developer Group Ourense». Se consideran **posibles canales complementarios de una comunidad existente**, no dos nuevas sucursales. Antes de incorporarlos conviene comprobar la cobertura de eventos que aportan.

### WordPress

La propia [WordCamp Galicia enumera siete comunidades locales y enlaza sus Meetup](https://galicia.wordcamp.org/2025/videos-fotos-meetups-e-demais/). Coruña y Vigo ya están seleccionadas. Las cinco adicionales son:

| Fuente | Última convocatoria visible en la lectura directa | Próximos visibles | Prioridad sugerida |
| --- | --- | --- | --- |
| [WordPress Lugo](https://www.meetup.com/wordpresslugo/) | 24/09/2026: «CSI WordPress: investigando webs rotas». | No | Alta como ampliación territorial. |
| [WordPress Santiago](https://www.meetup.com/santiago-de-compostela-wordpress-meetup-group/) | 23/09/2026: presentación de proyectos de la comunidad. | No | Alta como ampliación territorial. |
| [WordPress Pontevedra](https://www.meetup.com/pontevedra-wordpress-meetup/) | 11/09/2026: consultoría para webs emprendedoras. | No | Alta como ampliación territorial. |
| [Ferrolterra WordPress](https://www.meetup.com/ferrolterrawordpress/) | 19/06/2026: avance de proyectos. | No | Media; cubre otra comarca. |
| [WordPress Ourense](https://www.meetup.com/wordpressourense/) | 26/03/**2025**: creatividad e IA. | No | Baja hasta comprobar novedades. |

«No» significa que no se vieron próximos eventos en la página recuperada. No significa que el grupo haya cerrado. El formato permite reutilizar la aproximación de Meetup del prototipo, pero debe probarse cada página y sus fichas; esto no acredita todavía una integración automática.

### GPUL: ampliar canales y distinguir iniciativas

No he encontrado una red de sucursales geográficas de GPUL equivalente a GDG o WordPress. Sí hay varios **canales y programas de la misma asociación**:

- **[GPUL en Meetup / gpul-labs](https://www.meetup.com/gpul-labs/): prioridad alta.** La lectura directa encuentra dos próximas convocatorias: taller de terminal del 21 de octubre y Atlántica Labs del 27. Es un complemento útil a `gpul.org`, no una comunidad independiente.
- **[RSS oficial de eventos](https://gpul.org/rss/eventos.xml):** ya está enlazado desde GPUL. Conviene evaluarlo como transporte de la fuente existente; no he validado aquí su cobertura completa.
- **[AtlánticaConf](https://atlanticaconf.com/):** la portada actual anuncia **junio de 2027**, en la Facultad de Informática de A Coruña; todavía no concreta el día. Las versiones de 2025 son archivos y no deben publicarse como novedades. La antigua ruta `/labs.html`, aún indexada por el buscador, devuelve 404 en la descarga directa.
- **[HackUDC](https://gpul.org/novas/2026/hackudc-2026):** GPUL documenta la edición celebrada en 2026. Sirve para seguir esa iniciativa, pero en la evidencia consultada no se verifica una siguiente convocatoria.

Un hallazgo útil para el mock: [la ficha de Meetup del taller de terminal](https://www.meetup.com/gpul-labs/events/316994900/) y el texto visible del grupo indican **17:00**, en línea con el texto de `gpul.org`. Esto aporta otra evidencia para la revisión existente. No se ha cambiado ni aprobado automáticamente la incidencia.

## 2. Otras webs y organizadores

### Candidatas con mayor utilidad inmediata

| Fuente propuesta | Ámbito y contenido | Evidencia observada | Lectura y cautelas |
| --- | --- | --- | --- |
| **[Mancomún — Axenda](https://mancomun.gal/axenda/)** | Galicia; software libre, hardware, formación y comunidades. | La descarga directa muestra convocatorias del 22 de octubre y de noviembre de 2026. Su sección de actualidad también recoge actividades de otros colectivos. | Prioridad alta. Listado y fichas públicas. Conservar al organizador original y deduplicar. Algunos enlaces de calendario contienen un final inválido en 1970: usar la ficha, no copiar ese valor. |
| **[CoruñaJUG](https://corunajug.org/)** | A Coruña; JVM, desarrollo, arquitectura y actualmente también IA. | «Extreme AI engineering», **22/10/2026 a las 19:30**, Cidade das TIC. Enlaza la ficha del organizador en Eventbrite. | Prioridad alta. Además dispone de [feed estructurado](https://corunajug.org/feed.json), con diez eventos y zona `Europe/Madrid` en la lectura. Falta desarrollar y probar un adaptador. |
| **[CNTG](https://cntg.xunta.gal/gl)** | Formación tecnológica desde Galicia: Linux, Python, cloud, seguridad, desarrollo. | [Seminario Open source](https://cntg.xunta.gal/gl/seminario/x20261022/open-source-mais-alo-do-codigo-licenzas-comunidades-e-modelos-de-negocio), **22/10/2026**, presencial, con inscripción y horario detallados. | Prioridad alta si incluimos cursos y seminarios. Revisar requisitos, plazas y plazo por ficha. La agenda agregadora no siempre refleja correctamente la hora local. |
| **[Python A Coruña](https://www.meetup.com/python-a-coruna/)** | Python, IA, datos y software libre. | Próximo Hacktoberfest del **24/10/2026**, coorganizado con comunidades que ya seguimos. | Prioridad alta por afinidad. Aportará duplicados legítimos: unir fuentes de un evento, no crear una tarjeta por cada organizador. Se mantiene fuera Python Vigo, como pidió el usuario. |
| **[GALPon](https://www.galpon.org/)** | Software libre, sistemas, robótica y talleres en Galicia. | Web propia con actividades y participación en esLibre 2026. Enlaza su [grupo de eventos en Mobilizon](https://mobilizon.fr/@obradoiros_galpon). | Prioridad media/alta. Es una asociación independiente, no una sucursal de GPUL. Web comprobada; el acceso al calendario externo no quedó validado. No generar fechas por su periodicidad habitual. |
| **[CorunaEvents](https://coruna.events/en)** | Directorio y agenda de comunidades de A Coruña. | Incluye comunidades técnicas y eventos de distintos tipos; aparecen también recurrencias que se extienden durante años. | Prioridad media como descubridor. Necesita filtro tech y confirmación con organizadores; una recurrencia de calendario no prueba una convocatoria futura. |
| **[Amigus](https://www.amigus.org/)** | As Pontes; talleres de impresión 3D, programación y tecnología, también infantiles. | Convocatoria de diseño e impresión 3D para el **26/09/2026**, ya pasada. | Prioridad media por cobertura geográfica y temática. El portal también publica noticias y ocio: hace falta selección de contenido. |
| **[Píntega Conf / antigua Lareira](https://lareiraconf.es/)** | Encuentro de comunidades técnicas en A Coruña. | Anuncia **9–10/04/2027**. Charlas el 10 en el Rectorado UDC; el lugar del preevento del 9 sigue pendiente. | Fuente propia interesante para eventos de mayor tamaño. Conservar el cambio de nombre, el dominio antiguo y las incertidumbres de cada jornada. |

### Más opciones, con menor urgencia o comprobaciones pendientes

| Fuente | Qué aporta | Estado y límites de lo observado |
| --- | --- | --- |
| [BricoLabs](https://www.bricolabs.cc/) y [OSHWDem](https://www.oshwdem.org/) | Hardware abierto, robótica, electrónica, encuentros maker. | La asociación enlaza la feria oficial. Hay material de 2026; no se ha validado una siguiente fecha futura. Elegir el sitio de eventos como canal principal cuando exista convocatoria. |
| [WordCamp Galicia](https://galicia.wordcamp.org/2026/) | Conferencia itinerante de la comunidad WordPress gallega. | Edición del **16–18/10/2026**, A Coruña, ya pasada. Útil para descubrir la siguiente edición y otros grupos, sin inventar su sede futura. |
| [La Datolada](https://eventos.datola.es/) / [Datola](https://datola.es/) | Analítica y datos; comunidad enlazada desde GDG A Coruña. | La página actual anuncia **quinta edición próximamente**, sin fecha. La cuarta edición de 2026 queda en archivo. No asignar fecha ni ubicación a la siguiente por analogía. |
| [Maker Faire Galicia](https://makerfairegalicia.es/) | Fabricación digital, hardware y divulgación tecnológica. | Web de la edición de 2026. No he confirmado una nueva convocatoria futura; vigilar el cambio de edición. |
| [CoruñaWTF en Eventbrite](https://www.eventbrite.es/o/corunawtf-58544773663) | Desarrollo y diseño web. | Perfil del organizador accesible en descarga directa. El buscador tuvo respuestas 429 y la página recuperada no aportó una próxima ficha validada. Candidata, no agenda confirmada. |
| [Sysarmy Galicia, en directorio](https://coruna.events/en/community/sysarmy-galicia) | Sistemas, infraestructura y encuentros informales. | Hay actividades de 2026 y perfiles de organizadores en plataformas. El dominio anunciado `sysarmygalicia.com` no resuelve en la comprobación directa. Falta fijar un canal oficial estable. |
| [CESGA — Formación](https://www.cesga.es/que-hacemos/formacion/) | Supercomputación, cuántica y formación técnica, presencial y online. | Listado oficial de cursos con fechas explícitas. En la sección consultada no se ha identificado una convocatoria posterior al 20/10/2026. No confundir la fecha de actualización de la página con la de cada curso. |
| [CITIC](https://citic.udc.es/) / [XoveTIC](https://xovetic.citic.udc.es/programa/) | Investigación TIC, IA y encuentros académicos en A Coruña. | Programa XoveTIC de octubre de 2026; no se ha validado una siguiente convocatoria. Algunas actividades se dirigen a personal investigador: revisar acceso. |
| [CPEIG — Novas](https://cpeig.gal/comunicacion/novas) | Jornadas, formación y divulgación profesional en Galicia. | Publicaciones recientes, pero mezcla convocatorias y noticias retrospectivas. Es una fuente complementaria, no una agenda limpia de eventos abiertos. |
| [GHANDALF](https://ghandalf.org/) | Cultura y software libres, datos abiertos y talleres. | El sitio funciona sin `www`; las últimas publicaciones visibles son antiguas, con una de **2019**. Prioridad baja como calendario actual. |
| [Comunidade O Zulo, convocatoria en Mancomún](https://mancomun.gal/novas/mugardos-acolle-a-xornada-de-software-e-cultura-libre-2026/) | Software y cultura libres en Mugardos. | Jornada anunciada para el **14/11/2026**. Interesante para ampliar territorio; pendiente de validar un canal propio estable del organizador. |
| [PulpoCon](https://pulpocon.es/) | Desarrollo, arquitectura y buenas prácticas en Vigo. | La web principal aún muestra **2025**. El [anuncio del organizador](https://es.linkedin.com/posts/pulpocon_nos-entristece-confirmar-que-este-a%C3%B1o-no-activity-7499551975743623168-n4B7) confirma que no habrá edición en **2026** y que estudian fechas de 2027. No publicar una edición futura como confirmada. |
| [Aquelarre Dixital](https://github.com/Aquelarre-Dixital) | Comunidad enlazada desde GDG A Coruña. | Organización identificada en GitHub, pero no se ha verificado una agenda pública estable. Mantener como pista de descubrimiento. |

## 3. Selección que propondría para la siguiente prueba

1. **Ampliar WordPress** con Lugo, Santiago, Pontevedra y Ferrolterra. Dejar Ourense identificado, con menor prioridad por la antigüedad de su actividad visible.
2. **Completar GPUL con su Meetup**: aporta eventos que no estaban en la muestra de su web y evidencia adicional para la hora de terminal.
3. **Añadir candidatas de alto rendimiento:** Mancomún, CoruñaJUG, CNTG y Python A Coruña. Tienen contenido próximo o una convocatoria próxima verificada.
4. **Ampliar hardware y territorio:** GALPon, Amigus y OSHWDem. Sus públicos y formatos son distintos de los meetups de programación.
5. **Seguir conferencias con otro ritmo:** Píntega y AtlánticaConf ya tienen anuncios de 2027; Datolada anuncia edición sin fecha. No hace falta presentar una fecha exacta para conservar una candidata en investigación.

Es una recomendación por afinidad, información comprobable y cobertura, no una validación de confianza en nombre del usuario.

## 4. Consecuencias para el futuro recopilador

- Una comunidad puede tener varias fuentes: web, Meetup y feed. No equiparar «fuente» con «organizador» ni contar canales como sucursales.
- Mantener juntos identidad, ciudad, URL solicitada y URL final. Un HTTP 200 puede ser una portada genérica o «Group not found».
- Usar fechas de eventos y zona horaria explícita; las publicaciones, los archivos y los enlaces de calendario pueden contener otros valores.
- Guardar evidencias y distinguir anuncio, inscripción abierta, pendiente de fecha, pasado y cancelado explícitamente.
- Deduplicar coorganizaciones —por ejemplo, Hacktoberfest— sin perder enlaces de procedencia.
- Tener una vía para excluir organizadores aun cuando aparezcan republicados en un agregador. **VigoTech, Python Vigo, A Industriosa y Cloud Native Galicia siguen retirados**; no se proponen de nuevo en este informe.
- La existencia de RSS o JSON se ha anotado donde se observó. No se ha construido un adaptador ni se ha demostrado todavía cobertura diaria o exhaustiva de las candidatas.
