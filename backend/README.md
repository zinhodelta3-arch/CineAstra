# CineAstra — backend

API existente em JavaScript ESM, Node.js 24, Express 5 e MySQL 8.0. Os módulos cobrem identidade, catálogo, operações de cinema, comércio, pagamentos, assinaturas, newsletter, suporte e relatórios. A especificação de rotas e DTOs está em [`docs/openapi.json`](docs/openapi.json); os contratos e limites por módulo estão em `../docs/backend-*.md`. **Esta entrega não está pronta para produção**: consulte o [relatório final](../minidocs/CineAstra-Codex-Otimizado/docs/codex/RELATORIO-FINAL.md).

## Preparar o ambiente

1. Na pasta `backend`, execute `npm ci` com Node.js 24 e npm 11.
2. Copie `.env.example` para `.env` local. Preencha host/schema/usuário/senha de **desenvolvimento**, `JWT_SECRET` aleatório (mínimo de 32 bytes), `TWO_FACTOR_ENCRYPTION_KEY` (32 bytes aleatórios em Base64), origem permitida e versões jurídicas publicadas. O exemplo não contém segredos utilizáveis. Nunca versione `.env`.
3. Crie o schema MySQL 8.0 de desenvolvimento, vazio e separado de produção. Confira host, nome, permissões e backup antes de qualquer DDL. `npm run migrate -- --plan` mostra o plano e checksums sem conexão; para aplicar apenas em ambiente não produtivo confirmado, defina `MIGRATION_CONFIRMED_NON_PRODUCTION=true` e `MIGRATION_TARGET` igual a `DB_NAME`, então execute `npm run migrate -- --apply`. O runner recusa base existente sem ledger; não faça baseline automático nem repita DDL após falha parcial.
4. `npm start` inicia a API em `HOST:PORT` (padrão `127.0.0.1:3001`). `GET /health` verifica o processo; `GET /ready` verifica banco, logs e retenção. Ambos não atestam provedores externos. Em desenvolvimento, Swagger fica em `/api-docs/` e a spec em `/openapi.json`; produção desabilita essas rotas.

O servidor carrega adaptadores de identidade, CAPTCHA, pagamento, mídia privada, e-mail e IA pela composição de `createApp`/`startServer`. Os padrões de integrações críticas são indisponíveis e falham explicitamente. `npm start` não configura provedores reais apenas por variáveis de ambiente. Uma implantação exige adaptadores reais, autenticação de webhooks, credenciais protegidas, TLS/WAF e monitoramento operacional; não use fixtures de teste como provedores.

## Contrato e arquitetura

Fluxo: `routes → middlewares/validators → controllers → services → models → MySQL`. Services controlam transações; models recebem a mesma conexão. Respostas usam `{success:true,data,requestId}` ou `{success:false,code,message,requestId,details?}`. IDs `BIGINT` e valores `DECIMAL` saem como strings. JWT exige sessão ativa, perfil atual e 2FA quando aplicável; propriedade e vínculo operacional são conferidos por recurso. CORS explícito, Helmet, limites de corpo/rate e logs redigidos ficam em `app.js` e middlewares.

A OpenAPI contém 291 operações registradas (estado da auditoria 51). Grupos principais: `/api/auth`, `/api/catalog`, `/api/admin`, `/api/orders`, `/api/payments`, `/api/tickets`, `/api/streaming`, `/api/plans`, `/api/newsletter`, `/api/support`, `/api/content` e `/api/assistant`. Consulte a spec para método, URL, autenticação, entrada e erros; não infira permissões do prefixo. O frontend atual é um protótipo de páginas e formulários sem integração HTTP comprovada com esses contratos.

## Comandos de verificação

| Comando (na pasta `backend`) | O que comprova |
| --- | --- |
| `npm test` | Testes locais e HTTP com dependências simuladas declaradas. |
| `npm run validate:openapi` | Validade OpenAPI e correspondência com registry de operações. |
| `npm run test:integration` | Suítes MySQL opt-in; sem `TEST_DB_*`, pulam explicitamente. |
| `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/runIsolatedMysqlTests.ps1` | No Windows com MySQL 8.0 instalado, cria instância temporária local, schema `_test` vazio e credenciais efêmeras, executa integração e três `EXPLAIN` indicativos, e encerra a instância. Aceita `-MySqlBase` se os binários estiverem em outro diretório. Deixa dados diagnósticos em `%TEMP%`. |
| `npm audit --omit=dev` | Consulta avisos conhecidos das dependências de produção; resultado muda com o tempo. |
| `npm run migrate -- --plan` | Gera plano SQL offline; **não** aplica DDL. |

O plano atual contém 169 statements revisados, incluindo baseline V4 e migrations 01–29. A suíte MySQL aplica o plano somente a um schema temporário vazio. Isso não prova upgrade de banco legado com dados reais, migração de produção, desempenho sob carga ou integrações externas. Os jobs de expiração de checkout, cobrança, newsletter, atendimento e retenção iniciam com `npm start`; seus efeitos externos dependem dos provedores e configuração aplicáveis. Consulte `../docs/backend-handoff.md` para comandos de operação, evidência e pendências.
