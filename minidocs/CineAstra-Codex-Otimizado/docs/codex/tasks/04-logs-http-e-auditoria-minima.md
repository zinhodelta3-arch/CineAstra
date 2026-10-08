# 04 — Logs HTTP e auditoria mínima

Requisitos: RF46; RNF18; RNF34.

## Trabalho e aceite
Metadados mínimos, redigir headers/query/tokens e omitir bodies por padrão. Fila limitada com erros observáveis; logs HTTP expurgam em 90 dias. Defina mecanismo durável separado para eventos críticos. Teste redação/falha de gravação; não criar sistema ilimitado de logging.

## Consultas direcionadas
- [Schema logs](../references/schema/logs.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
