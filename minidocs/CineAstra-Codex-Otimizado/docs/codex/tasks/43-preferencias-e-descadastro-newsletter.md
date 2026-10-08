# 43 — Preferências e descadastro newsletter

Requisitos: V4 newsletter.

## Trabalho e aceite
Conta própria ou autorização específica; DESCADASTRO não concede gestão de email. Ausência de preferência=recusa. Opt-out cancela fila pendente/falha, invalida tokens e respeita CHECK de datas. Reinscrição novo aceite/confirmação. GET scanner não consome token automaticamente. Teste alheio e opt-out após enfileirar.

## Consultas direcionadas
- [Schema newsletter_inscritos](../references/schema/newsletter_inscritos.md)
- [Schema newsletter_preferencias](../references/schema/newsletter_preferencias.md)
- [Schema newsletter_tokens](../references/schema/newsletter_tokens.md)
- [Schema newsletter_envios](../references/schema/newsletter_envios.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
