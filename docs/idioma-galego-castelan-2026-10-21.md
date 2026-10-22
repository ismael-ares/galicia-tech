# Idioma: galego e castelán

Requisito confirmado o 21 de outubro de 2026: selector de idioma xunto ao cambio de tema, con galego e castelán. Por defecto úsase a preferencia compatible do navegador; se non hai ningunha, galego.

## Comportamento implementado no mock

- Botón co símbolo de idiomas e indicador GL/ES, inmediatamente xunto ao tema. Un clic alterna entre os dous idiomas. Inclúe nome accesible, foco de teclado e indicación do idioma actual.
- Prioridade: elección manual gardada > primeiro idioma compatible de Accept-Language (rexións e pesos q incluídos) > galego. Exemplos: es-ES → es; gl-ES → gl; en-US,es;q=0.8 → es; en-US → gl.
- Elección persistente nunha cookie funcional galicia-tech-locale (un ano, Path=/, SameSite=Lax e Secure baixo HTTPS). Non se garda ningunha credencial. Non se engade ningún servizo externo nin dependencia.
- A selección inicial resólvese no servidor e chega ao provedor React; html.lang, interface e título do documento concordan desde a primeira resposta. Next renderiza estas páxinas por petición, ao consultar cabeceiras e cookies.
- O cambio manual mantén a páxina, o tema, os filtros, os gardados e o estado de revisión. A navegación e a recarga conservan a preferencia.
- Interface traducida: cabeceira, axenda, filtros, etiquetas, avisos, fichas, conta, login, panel, configuración, galerías e páxina da mostra. O contido dos eventos tamén cambia ao galego: títulos, descricións, requisitos, avisos e etiquetas de fontes. Os orixinais consérvanse por separado. Os nomes oficiais das comunidades e lugares, as URL e as evidencias citadas na revisión manteñen a súa forma orixinal. Esta ampliación do requisito substitúe a decisión inicial de traducir só a interface.
- Datas e horas seguen Europe/Madrid. O navegador de verificación non ofrece datos ICU de gl-ES; por iso os formatadores comparten a estrutura es-ES e substitúen só as partes de mes/día polos nomes galegos incluídos no proxecto. Eses nomes proceden do Intl/ICU de Node, que si inclúe galego. Evítanse diferenzas entre o HTML do servidor e o navegador.

## Ficheiros

- mock-next/lib/locale.ts: negociación e prioridades.
- mock-next/lib/request-locale.ts: cabeceiras/cookie no servidor.
- mock-next/components/i18n.tsx: provedor, traducións, selector e formatos.
- mock-next/lib/messages/gl.json: catálogo de textos da interface, co castelán como chave de orixe.
- mock-next/lib/date-format.ts e messages/gl-date-parts.json: nomes de datas compatibles entre servidor e navegador.
- mock-next/app/language.css: selector e adaptación da cabeceira.
- tools/check_mock_locale.cjs: probas de negociación, renderización inicial, persistencia e interaccións bilingües.

## Verificación

Build de produción e TypeScript correctos; contedor Docker saudable. Probas de idioma, suite xeral e suite de movemento: PASS. Verificados navegador castelán/galego e navegador sen idioma compatible, pesos q, prioridade da cookie, cambio manual con teclado, recarga, navegación ao panel, conservación de filtros/gardados/tema, datos orixinais dos eventos e nomes de datas. Sen desbordamentos a 320, 390, 641, 768 e 1440 px. Sen erros de hidratación. Capturas: output/next-mock/idioma-*.png.

O modelo de usuarios de Django segue pendente. Nunha implementación con contas, a mesma preferencia poderase sincronizar co perfil; o mock non simula esa sincronización.
