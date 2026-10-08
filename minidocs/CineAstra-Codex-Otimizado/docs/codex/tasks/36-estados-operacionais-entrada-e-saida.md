# 36 — Estados operacionais, entrada e saída

Requisitos: RF14; RF35; RF41.

## Trabalho e aceite
Separar status operacional de financeiro, mapear agendado/atrasado/participando/finalizado sem ENUM imaginário. Entradas/saídas/reentrada exigem histórico/autorização próprios; não reusar ticket UTILIZADO indiscriminadamente. Teste staff de outra sessão e transição inválida.

## Consultas direcionadas
- [Schema pedidos](../references/schema/pedidos.md)
- [Schema tickets](../references/schema/tickets.md)
- [Schema equipes](../references/schema/equipes.md)
- [Schema sessoes](../references/schema/sessoes.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
