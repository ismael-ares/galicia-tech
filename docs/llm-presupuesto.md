# LLM y presupuesto: valoración para el primer despliegue

La [propuesta técnica del 21 de octubre](arquitectura-propuesta-2026-10-21.md) concreta calendario independiente de consulta/LLM, candidato DeepSeek Flash, reservas transaccionales del gasto y tratamiento de peticiones inciertas. No se han realizado llamadas pagadas ni una prueba comparativa de modelos.

Revisión documental del 20 de octubre de 2026. No se ha contratado ni conectado ningún proveedor. El colector actual no llama a un LLM.

> Referencia vigente: [plan consolidado del homelab](plan-arquitectura-homelab-2026-10-21.md), especialmente el contrato del adaptador y las reservas transaccionales de gasto. No hay proveedor evaluado ni consumo pagado en esta fase documental.

## Requisitos y propuesta

El usuario solicita un coste bajo, con preferencia por aprovechar una suscripción si su integración oficial admite el uso previsto. Acepta un máximo inicial de 5 EUR/mes para el LLM, buscando gastar por debajo de ese límite; no solicita otra suscripción de 20 EUR/mes. La elección del modelo queda pendiente de medir calidad y consumo en muestras reales.

En conversación de voz confirma que paga Claude Code y acepta una API por clave si el gasto es bajo. Indica que su plan es el de 20 USD, que se toma como Claude Pro; no se asumen créditos API incluidos. No se toma una renovación de Codex como dependencia del producto.

La documentación vigente de [créditos API para suscriptores de Claude](https://platform.claude.com/docs/en/about-claude/api-credits-for-subscribers) incluye créditos mensuales reclamables para Max y Team, y excluye Pro. Comprobar el plan y sus condiciones antes de asumir que hay saldo aprovechable. Es una integración por API y créditos, distinta de reutilizar credenciales OAuth de Claude Code.

Nuevo candidato para la prueba: [Claude Haiku 5.5](https://platform.claude.com/docs/en/models/haiku-5-5/overview), junto con DeepSeek. La documentación consultada publica 0,10 USD por millón de tokens de entrada y 0,50 USD por millón de salida para peticiones de hasta 100.000 tokens de entrada. Ejemplo aritmético: 1.000 procesamientos de 3.000 tokens de entrada y 500 tokens de salida cada uno serían 0,55 USD solo de esos tokens, sin impuestos, herramientas, razonamiento adicional ni reintentos. No es una previsión medida de nuestro consumo ni una prueba de calidad del modelo. Modelo y proveedor siguen pendientes de decisión.

Propuesta: adaptador de proveedor configurable, extracción estructurada primero y procesamiento de contenido nuevo o modificado. El LLM aportará interpretación, síntesis y propuestas de clasificación; la validación de fechas, permisos, estados y publicación seguirá en la aplicación.

Evaluar una API de bajo coste, por ejemplo DeepSeek, como opción para tareas automáticas. La [documentación oficial de DeepSeek](https://api-docs.deepseek.com/quick_start/) muestra autenticación por clave y una interfaz compatible con formatos OpenAI/Anthropic. Esta compatibilidad no implica que todos los parámetros, modelos o resultados sean intercambiables sin pruebas.

## Frecuencia y elección económica

El usuario acepta espaciar el análisis LLM, por ejemplo cada tres días o dos veces por semana, y prioriza coste bajo. No se han fijado días u horas ni se ha creado una programación. Propuesta inicial: dos ejecuciones LLM por semana, ajustables desde configuración.

Separar la consulta de fuentes de la reevaluación LLM: la descarga y extracción local no consumen tokens por sí mismas. Pueden consultar más a menudo y acumular cambios para la siguiente ejecución LLM. La frecuencia de consulta también será configurable; no se afirma que todas las APIs o fuentes externas sean gratuitas.

Preferencia por probar DeepSeek u otro modelo chino económico, admitiendo Haiku si calidad y coste encajan. DeepSeek directo es el candidato inicial propuesto, con OpenRouter como alternativa de intermediación para comparar modelos. No se ha elegido ni conectado definitivamente un proveedor. La comparación debe incluir tarifas, recargas/comisiones, reintentos y calidad, no solo país o marca.

## Suscripciones

- La [documentación de precios de OpenAI](https://learn.chatgpt.com/docs/pricing) distingue cuota de suscripción y facturación por API. No tratar una suscripción personal como una API general ilimitada.
- Existe una vía oficial de [uso del plan mediante Sign in with ChatGPT](https://developers.openai.com/siwc/token-sharing-open-source) para aplicaciones abiertas/locales elegibles; la documentación incluye [instalaciones propias en VM](https://developers.openai.com/siwc/token-sharing-open-source/self-hosted-vms). No está integrada ni comprobado su encaje con nuestra recopilación desatendida. La disponibilidad para una aplicación pública alojada remotamente requiere una evaluación propia; la documentación remite a un formulario de interés para aplicaciones pagadas o alojadas remotamente.
- [OpenCode Go](https://opencode.ai/v2/docs/console/go/) publica una suscripción de 10 USD/mes, límites y endpoints API. Su uso está orientado a OpenCode y agentes de programación con tráfico similar. No se da por autorizado ni validado un proceso genérico de recopilación de eventos por el mero hecho de disponer de endpoint.

## Controles propuestos

- Llamadas solo para novedades o cambios relevantes; reutilizar resultados según contenido, modelo y versión de instrucciones.
- Enviar fragmentos útiles, con tamaño y salida acotados. Evitar usar un agente de navegación abierto para cada fuente.
- Registrar consumo y coste estimado por ejecución, fuente y modelo, incluyendo reintentos.
- Límite diario y mensual en la aplicación, con reserva del coste máximo previsto antes de admitir una llamada y límites de concurrencia. Los límites del proveedor se configurarán y verificarán cuando existan; una alerta de facturación no equivale a un corte.
- Al alcanzar el límite, detener nuevas llamadas LLM y conservar tareas pendientes; mantener la lectura de datos estructurados y la agenda publicada. No cambiar automáticamente a un proveedor de pago alternativo.
- Máximo inicial aceptado: 5 EUR/mes para llamadas LLM. Es un techo, no un objetivo de consumo ni una autorización para contratar una suscripción. El coste mensual real se medirá.
- Comparar modelos con casos de la muestra: fechas, restricciones de acceso, conflictos entre fuentes, duplicados y resúmenes fieles. No se presupone necesario un modelo de frontera.

Estas decisiones son planificación. No hay límite de gasto ni persistencia de trabajos implementados todavía.
