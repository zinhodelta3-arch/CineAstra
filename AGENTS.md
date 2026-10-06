# CineAstra — instruções para o Codex

## Contexto

Este é um projeto existente. Identifique a estrutura e o comportamento atual
antes de implementar mudanças.

Fontes:
- docs/requisitos-cineastra.txt
- docs/banco-referencia-cineastra.txt
- docs/CineAstra-prompts-backend.md

O prompt anterior é referência histórica:
- docs/prompt-anterior-cineastra.txt

Aplique o Contrato global do documento de prompts e execute somente o módulo
solicitado na rodada.

## Implementação

- Preserve a arquitetura e o sistema de módulos existentes.
- Preserve as URLs e os formatos de resposta usados pelo frontend.
- Quando uma mudança exigir alteração de contrato, documente seu impacto.
- Use JavaScript, Node.js, Express e mysql2/promise.
- Organize models, controllers e routes, com services para regras e transações.
- Use dotenv, bcryptjs, jsonwebtoken, helmet, cors, multer e swagger-ui-express.
- Atualize a especificação OpenAPI em cada módulo.
- Confira tabelas, colunas, ENUMs e migrations antes de escrever SQL.
- Resolva estruturas ausentes por migrations explícitas e justificadas.
- Aplique autorização por perfil, propriedade e vínculo operacional.
- Use SQL parametrizado, dinheiro exato e IDs BIGINT sem perda de precisão.
- Não altere o frontend fora do escopo solicitado.

## Ambiente e validação

- Use banco de desenvolvimento e banco de teste separados de produção.
- Não execute migrations nem testes destrutivos em produção.
- Não imprima credenciais, tokens ou conteúdo sensível do .env.
- Preserve o gerenciador de pacotes e o lockfile existentes.
- Descubra os comandos disponíveis no package.json.
- Execute os testes relevantes; registre impedimentos quando não puder executá-los.
- Não simule pagamentos ou integrações como bem-sucedidos em produção.

## Continuidade

Atualize:
- docs/backend-architecture-plan.md
- docs/backend-coverage.md
- docs/backend-handoff.md

Ao terminar, informe arquivos alterados, endpoints, migrations, requisitos
cobertos, testes executados e pendências concretas.