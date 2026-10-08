# 11 — Endereços, contatos e preferências

Requisitos: RF06; RF07.

## Trabalho e aceite
CRUD próprio e preferências conforme ENUM; principal único definido por usuário/tipo com transação/constraint pertinente. Rotas aninhadas validam dono. Teste IDOR e mudança concorrente de principal; métodos de pagamento ficam na tarefa 29.

## Consultas direcionadas
- [Schema enderecos](../references/schema/enderecos.md)
- [Schema contatos](../references/schema/contatos.md)
- [Schema preferencias_usuario](../references/schema/preferencias_usuario.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
