# 26 — Movimentos e reserva de estoque

Requisitos: RF25; RF43; RN15.

## Trabalho e aceite
Exatamente um item por movimento; semântica do sinal por tipo, saldo não negativo, update+histórico atômico. Combos consomem todos componentes, locks ordenados. Modelo disponível/reservado compartilha checkout; corrigir por compensação. Teste último item concorrente e rollback parcial.

## Consultas direcionadas
- [Schema movimentacoes_estoque](../references/schema/movimentacoes_estoque.md)
- [Schema insumos](../references/schema/insumos.md)
- [Schema equipamentos](../references/schema/equipamentos.md)
- [Schema combo_itens](../references/schema/combo_itens.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
