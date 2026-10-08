# 33 — Carrinho e cotação de pedido

Requisitos: RF10–RF15; RN04; RN16.

## Trabalho e aceite
Somente IDs/quantidades/benefícios elegíveis; preço/status/dono no servidor. Exatamente um tipo por item, ingresso quantidade1/assento correto; streaming ALUGUEL/COMPRA. Validar contexto/idade e calcular snapshots. Reutilizar preço 28, sem liberar direitos. Teste manipulação de preço e combinação inválida.

## Consultas direcionadas
- [Schema pedidos](../references/schema/pedidos.md)
- [Schema itens_pedido](../references/schema/itens_pedido.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
