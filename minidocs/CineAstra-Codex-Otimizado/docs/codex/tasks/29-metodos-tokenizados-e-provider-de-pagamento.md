# 29 — Métodos tokenizados e provider de pagamento

Requisitos: RF06; RF18; RF20; RNF22.

## Trabalho e aceite
CRUD método próprio com token real do gateway, sem PAN/CVV. Provider criar/consultar/cancelar/estornar/verificar webhook; ausente falha explicitamente. Obrigação pedido OU cobrança e pagador autorizado. Defina idempotência persistente antes do checkout. Teste método alheio e provider indisponível.

## Consultas direcionadas
- [Schema metodos_pagamento](../references/schema/metodos_pagamento.md)
- [Schema pagamentos](../references/schema/pagamentos.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
