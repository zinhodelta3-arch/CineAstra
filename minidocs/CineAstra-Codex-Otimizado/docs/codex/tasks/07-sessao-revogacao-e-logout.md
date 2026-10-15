# 07 — Sessão, revogação e logout

Requisitos: RF02; RN02.

## Trabalho e aceite
Implemente revogação persistente conforme contrato JWT, logout real e invalidação após mudança crítica. Se refresh usado, rotação/replay; se cookie usado, CSRF e atributos seguros. Migration mínima para sessão quando necessária. Teste logout e token antigo; não invente refresh sem decisão.

## Consultas direcionadas
- [Schema usuarios](../references/schema/usuarios.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
