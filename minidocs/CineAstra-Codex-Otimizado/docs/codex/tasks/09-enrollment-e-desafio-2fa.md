# 09 — Enrollment e desafio 2FA

Requisitos: RF04; RNF16.

## Trabalho e aceite
TOTP com biblioteca mantida; segredo cifrado e exposto só no enrollment autorizado. APP/SMS/EMAIL por provider configurado. Confirmar fator antes de ativar, limitar desafios e impedir replay; perfis obrigatórios não desativam indevidamente. Teste bypass, replay e inscrição concorrente.

## Consultas direcionadas
- [Schema autenticacao_2fa](../references/schema/autenticacao_2fa.md)
- [Schema usuarios](../references/schema/usuarios.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
