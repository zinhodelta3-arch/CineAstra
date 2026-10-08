# 32 — Ocupação ativa de assentos

Requisitos: RF10; RN19.

## Trabalho e aceite
Migration preserva histórico: ocupação/reserva ativa separada, TTL e UNIQUE substituta. Validar/backfill dados antes de ajustar uk_sessao_assento histórico. Cancelamento libera cadeira elegível. Todas escritas usam nova garantia. Teste último assento e cancelar/revender com banco real.

## Consultas direcionadas
- [Schema itens_pedido](../references/schema/itens_pedido.md)
- [Schema sessoes](../references/schema/sessoes.md)
- [Schema assentos](../references/schema/assentos.md)
- [Schema pedidos](../references/schema/pedidos.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
