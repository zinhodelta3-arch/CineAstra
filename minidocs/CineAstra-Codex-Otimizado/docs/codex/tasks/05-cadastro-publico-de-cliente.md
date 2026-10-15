# 05 — Cadastro público de cliente

Requisitos: RF01; RNF13; RNF15; RN24.

## Trabalho e aceite
Cadastro só CLIENTE, confirmação/hash da senha, CPF/e-mail normalizados e únicos, DTO seguro. Registro de termos/idade/responsável usa estado real: autodeclaração não vira idade verificada. Integre contrato pendente de verificação. Teste role forjado, duplicidade e senha inválida; migrations mínimas justificadas.

## Consultas direcionadas
- [Schema usuarios](../references/schema/usuarios.md)
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
