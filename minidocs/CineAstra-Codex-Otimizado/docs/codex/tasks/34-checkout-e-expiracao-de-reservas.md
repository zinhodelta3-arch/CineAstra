# 34 — Checkout e expiração de reservas

Requisitos: RF15; RN12; RN16.

## Trabalho e aceite
Integre estoque26/ocupação32/preço28/pagamento30. Transação curta persiste pedido/itens/snapshots/reservas, gateway fora locks. Confirmação autenticada consome uma vez. Job TTL cancela não pago e libera reservas, sem ticket. Idempotência por usuário/operação/entrada. Teste estoque/cupom/assento concorrentes e aprovação tardia.

## Consultas direcionadas
- [Schema pedidos](../references/schema/pedidos.md)
- [Schema itens_pedido](../references/schema/itens_pedido.md)
- [Schema pagamentos](../references/schema/pagamentos.md)
- [Schema cupons](../references/schema/cupons.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
