# 01 — App, env e conexão MySQL

Requisitos: RNF19; RNF32–RNF35.

## Trabalho e aceite
Integre app testável separado de listen, env validado, pool mysql2/promise e transação que libera conexão em finally. Defina erros/404 e shutdown. Preserve estrutura atual. Teste startup, env ausente, rollback/release e falha de conexão com banco de teste quando disponível.

## Consultas direcionadas
- Consultar arquivos reais relevantes; nenhuma tabela obrigatória nesta tarefa.
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
