# 45 — Worker de envio newsletter

Requisitos: V4 newsletter.

## Trabalho e aceite
Claim SKIP LOCKED curto; SMTP/API fora transação. Revalide consentimento/categoria/campanha imediatamente antes. Backoff/tentativas/lease recuperação e provedor idempotente se suportado. Bounces autenticados bloqueiam. Sem exactly-once externo inventado. Teste dois workers/crash/opt-out e indisponível.

## Consultas direcionadas
- [Schema newsletter_envios](../references/schema/newsletter_envios.md)
- [Schema newsletter_inscritos](../references/schema/newsletter_inscritos.md)
- [Schema newsletter_campanhas](../references/schema/newsletter_campanhas.md)
- [Schema newsletter_preferencias](../references/schema/newsletter_preferencias.md)
- [Schema newsletter_categorias](../references/schema/newsletter_categorias.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
