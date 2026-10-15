# 08 — Recuperação e reset de senha

Requisitos: RF03; RNF18.

## Trabalho e aceite
Resposta genérica, token aleatório armazenado como hash, prazo/uso único e consumo atômico. Reset invalida sessões. E-mail provider real ou indisponibilidade clara, nunca simular envio em produção. Teste expirado/repetido e limites.

## Consultas direcionadas
- [Schema recuperacao_senha](../references/schema/recuperacao_senha.md)
- [Schema usuarios](../references/schema/usuarios.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
