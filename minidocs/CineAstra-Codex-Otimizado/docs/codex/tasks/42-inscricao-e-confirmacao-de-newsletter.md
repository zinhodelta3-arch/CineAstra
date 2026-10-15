# 42 — Inscrição e confirmação de newsletter

Requisitos: V4 newsletter.

## Trabalho e aceite
Aceite expresso/versionado e categorias independentes; PENDENTE até double opt-in. crypto.randomBytes32, SHA256 binário, finalidade/prazo/uso único; lock inscrito->token. Email duplicado não autoriza reativação/alteração por terceiro. E-mail provider sem configuração não afirma envio. Teste replay/expirado/enumeração.

## Consultas direcionadas
- [Schema newsletter_inscritos](../references/schema/newsletter_inscritos.md)
- [Schema newsletter_categorias](../references/schema/newsletter_categorias.md)
- [Schema newsletter_preferencias](../references/schema/newsletter_preferencias.md)
- [Schema newsletter_tokens](../references/schema/newsletter_tokens.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
