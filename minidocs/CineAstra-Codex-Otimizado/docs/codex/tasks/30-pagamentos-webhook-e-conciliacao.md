# 30 — Pagamentos, webhook e conciliação

Requisitos: RF20; RN04.

## Trabalho e aceite
Raw body se exigido antes parser, assinatura/timestamp/replay protocolados. Evento persistente único, comparar valor/moeda e tratar ordem/retries. HTTP gateway fora locks; aprovação atômica/outbox. Não disponibilizar PATCH cliente APROVADO. Teste timeout pós-cobrança, falso e duplo webhook.

## Consultas direcionadas
- [Schema pagamentos](../references/schema/pagamentos.md)
- [Schema pedidos](../references/schema/pedidos.md)
- [Schema assinatura_cobrancas](../references/schema/assinatura_cobrancas.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
