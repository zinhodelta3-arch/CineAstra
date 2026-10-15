# 06 — Login, JWT e autorização

Requisitos: RF02; RN02; RNF16.

## Trabalho e aceite
Login com mensagens seguras, bcryptjs e conta ativa. JWT algoritmo/claims/expiração explícitos; consultar autorização atual. ADMIN/SUPERVISOR com 2FA incompleto recebem desafio/sessão restrita. Criar middleware reutilizável, sem bypass temporário. Teste bloqueado, token inválido/expirado e role/contexto indevido.

## Consultas direcionadas
- [Schema usuarios](../references/schema/usuarios.md)
- [Schema autenticacao_2fa](../references/schema/autenticacao_2fa.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
