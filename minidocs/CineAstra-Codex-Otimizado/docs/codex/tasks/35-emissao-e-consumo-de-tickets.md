# 35 — Emissão e consumo de tickets

Requisitos: RF13; RF34; RF41; RN21; RN23.

## Trabalho e aceite
Emitir só após pagamento, unicidade finalidade/unidade e código opaco. Definir retirada total/parcial para quantidade>1; combo RETIRADA_INSUMO vinculado à sessão/expiração até30min após término. Validar distinto de consumir, consumo atômico staff vinculado e comprovação meia mínima. Teste duplicação/duplo consumo/expiração.

## Consultas direcionadas
- [Schema tickets](../references/schema/tickets.md)
- [Schema itens_pedido](../references/schema/itens_pedido.md)
- [Schema sessoes](../references/schema/sessoes.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
