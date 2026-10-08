# 02 — Proteção HTTP e limites

Requisitos: RNF17–RNF20.

## Trabalho e aceite
Configure Helmet, CORS explícito, body/timeouts e rate limiting geral. trust proxy segue topologia real; limite compartilhado se múltiplas instâncias. Defina CAPTCHA adapter para fluxos sensíveis e bloqueio de produção se ausente. Teste origin, payload excessivo e 429; não implementar login aqui.

## Consultas direcionadas
- Consultar arquivos reais relevantes; nenhuma tabela obrigatória nesta tarefa.
- Localize os requisitos indicados em ../references/INDICE-REQUISITOS.md.
- Consulte parágrafos completos somente quando necessários à regra desta tarefa.

## Fechamento
Integre a mudança ao código existente; rotas alteradas atualizam OpenAPI. Execute
verificações pertinentes ao aceite. Corrija falhas; impedimento real é BLOQUEADA.
Atualize progresso/CONTINUIDADE; COBERTURA apenas linhas afetadas. Decisões só se novas.
Resumo de até 10 linhas, sem colar arquivos inteiros. Conclua esta tarefa e pare.
