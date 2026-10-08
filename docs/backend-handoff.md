# CineAstra — handoff Prompt 01

Atualização: **08/10/2026** (implementação iniciada em 06/10). **STATUS: CONCLUÍDO COM PENDÊNCIAS.** Todo trabalho independente de serviço/configuração externa desta etapa foi integrado e validado. Os critérios que exigem MySQL real ainda não foram satisfeitos; **não pronto para produção**. Não implementados módulos de negócio, login ou fluxo de venda. Nenhum banco foi alterado.

## Resultado atual

- Factory Express 5 ESM sem listen (`app.js`), entrypoint `server.js`, configuração/env validada antes da composição, shutdown HTTP/worker/fila/limiter/pool e deadline.
- Pool mysql2/promise com fila finita, SQL parametrizado nos models, UTC/DATE/DECIMAL/BIGINT seguros, transaction de uma conexão com rollback/release; rollback falho/timeout destrói conexão, não retorna estado transacional quebrado ao pool.
- JWT HS256/issuer/audience/expiração curta, perfil/status atual, RBAC uppercase, owner/interface vínculo; default provider de sessão indisponível até M02/Prompt02. Tokens válidos retornam503 nesse caso, nunca autorização sem revogação/2FA. Nenhum endpoint falso de login.
- Helmet/CORS whitelist/PATCH, JSON/urlencoded limitados, requestId/erros seguros, limites geral e8fluxos IP/identidade, CAPTCHA fail-closed, trust proxy IP/CIDR real; store externo exige provider configurado.
- Logs HTTP antes de parsers/limiter, SQL limitado, sem body/query/URL/headers/User-Agent, somente template/status/duração/IP/tamanho/identidade autorizada; fila limitada/métricas/redaction/drop/failure/drain. Expurgo90dias com verificação de scheduler/evento ou worker sem evento habilitado concorrente. Não ligar scheduler nem executar DDL de evento automaticamente.
- Swagger/OpenAPI única3.0.3 válida, UI/assets/Authorize configurados, sem tokens e sem persistAuthorization; desativada em produção, ajusteCSP apenas UI. Specs somente operações realmente integradas.
- Runner de migrations seguro/offline por padrão, manifest explícito73statements, checksum/markerRUNNING por statement e GET_LOCK, sem USE/createDatabase/seeds/SELECTexemplo/eventos. Base existente sem ledger/DDLinterrompido/checksumdivergente recusados. M01audit/outbox migration/helper explícitos criados, **não aplicados**; consumeroutbox de domínio permanece futuro.
- `/uploads` genérico não servido; Multer limitado/lazy/gatecontent, sem upload de negócio/storagefictício. Frontend não editado pelo agente.

## Arquivos da etapa (incluindo os incorporados ao commit do usuário durante a sessão)

| Área | Caminhos criados/corrigidos |
| --- | --- |
| Bootstrap/config/dependências | `.gitignore`, `backend/package.json`, `backend/package-lock.json`, `backend/.env.example`, `backend/app.js`, `backend/server.js`, `backend/config/env.js`, `backend/config/database.js`, `backend/config/jwt.js` |
| HTTP/segurança | `backend/middlewares/authMiddleware.js`, `errorMiddleware.js`, `logMiddleware.js`, `uploadMiddleware.js`, `requestMiddleware.js`, `rateLimitMiddleware.js` |
| DTO/erros/telemetria/provider | `backend/utils/ApiError.js`, `dto.js`, `telemetry.js`; `backend/providers/captchaProvider.js` |
| Arquitetura/model/service | `backend/models/userAccessModel.js`, `logModel.js`, `auditModel.js`; `backend/services/accessService.js`, `healthService.js`, `logService.js`; `backend/controllers/healthController.js`; `backend/routes/infrastructureRoutes.js`; `backend/jobs/logRetention.js` |
| Swagger/SQL/scripts | `backend/docs/openapi.json`, `backend/migrations/20261006_01_infrastructure_events.sql`, `backend/scripts/validateOpenapi.js`, `migrationPlan.js`, `migrate.js`, `inspectDatabase.js` |
| Testes | `backend/tests/helpers.js`, `http.test.js`, `access.test.js`, `foundation.test.js`, `server.test.js`, `integration/mysql.test.js` |
| Documentação | `backend/README.md`, `docs/backend-architecture-plan.md`, `docs/backend-coverage.md`, `docs/backend-schema-inventory.md`, `docs/backend-handoff.md` |

SQLs legados preservados integralmente. npm/lock/ESM preservados, dependências corrigidas e instaladas. Versões adicionadas consultadas no registry: mysql2 3.24.5, bcryptjs3.0.3, jsonwebtoken9.0.3, swagger-ui-express5.0.1, express-rate-limit8.7.1, swagger-parser13.1.0, supertest7.3.1. Multer2.4.0 preservado e aviso oficial GHSA-3pph-fpjx-jg34 revisto (correção2.4.0). FonteNode oficial confirma24LTS; máquina24.14.1 testada, atualização do patchLTS pelo operador recomendada antes de produção.

## Endpoints, banco e contratos

GET `/` identificação; `/health` liveness; `/ready` readiness MySQL+logs/retenção; `/openapi.json` spec; `/api-docs` (redirect para `/api-docs/`) UI/arquivos. Públicos com security:[], Helmet/CORS/rate limiter; docs desativadas em produção. Prefixo futuro `/api` mantido nas decisões, sem inventar roteador `/api/auth` sem controller.

Novas tabelas propostas em migration M01: **auditoria_eventos** e **outbox_eventos**. Runner define **schema_migrations** para ledger. Alvo documental completo50tabelas (47 v3/V4 +2M01 +ledger). **Nenhuma criada/aplicada nesta sessão.** Logs/eventoV4 existente continuam não verificados no banco real. Caller futuro `recordAuditEvent(connection,event)` deve compartilhar transaction da operação; outboxconsumer/retention de negócio não implementados nesta etapa. HTTPlog é volátil/90dias, não substitui auditoria.

Mudança de contrato: respostas portuguesas do esqueleto substituídas por `{success,data,requestId}` e erro `{success:false,code,message,requestId,details?}` conforme diagnóstico; frontend inspecionado no00 não consumia API. Remove informação/rotas falsas de loja de roupas e staticupload genérico não funcional. IDsstrings/DECIMALstrings/DATEstrings/UTC definidos. Não alterar novos contratos frontend sem rodada autorizada; frontend mudou pelo usuário durante a pausa e deve ser reinspecionado no02.

## Testes e comandos executados — resultados finais

| Comando | Resultado / alcance |
| --- | --- |
| `npm view` das bibliotecas adicionadas/Multer | Registry consultado; versões não escolhidas só por memória |
| `npm install --ignore-scripts` no backend | Sucesso,146pacotes instalados/147auditados; lockatualizado e mantido npm; nenhum postinstall |
| `npm test` final | **34 testes aprovados, 0 falhas/0 skips**; HTTP/Supertest e servidor loopback, unit env/JWT/RBAC/IDOR/limiter/log/queue/retention/transactions/deadline/BIGINT/DDLplan/shutdown; dependências DB/session simuladas explicitamente |
| `npm run validate:openapi` | Sucesso, OpenAPI3.0.3validada e cinco operações comparadas ao registry |
| Swagger HTTPsmoke na suíte | JSON/UI HTML/init/bundle respondem, bearerAuth e persistAuthorizationfalse, CSP local; docs404emproduction. Não foi teste visual no browser nem fluxo manual login/Authorizereal |
| `npm run migrate -- --plan` | Sucesso, plano73statements/checksums, nenhum banco acessado nem SQLaplicado |
| `npm run test:integration` | Comando executado; **1teste skip explicitamente**, sem RUN_MYSQL_TESTS/TEST_DB_* configurados. Não chamar isso aprovação MySQL |
| `npm audit --json` | Exit0, zero vulnerabilidades reportadas,146dependências no metadata; não certifica segurança do código/serviços |
| `git diff --check` | Sem erro de whitespace; avisos LF->CRLF conforme configuração Git do Windows |
| `node --check` em todos os JS backend (script recursivo excluindo node_modules) | 34 arquivos aprovados sintaticamente |
| Inspeção do estado Git após pausa | Commit `31245e7 FEAT: backend-0.5` contém fundação desta sessão; staged frontend é trabalho usuário preservado, não foi revertido/resetado/staged pelo agente |

A primeira execução teve 29/31 aprovados: regex do plan bloqueava `ON DELETE` legítimo de FK e teste Swagger confundia branch genérico da lib com opção de pré-autorização. Corrigidos sem remover integridade ou autorizar tokens. Reexecução 31/31 e mais dois testes (deadline SQL callback pendente e marker/checksum DDL) chegaram a 33/33. Um teste adicional valida que falha no encerramento de worker não impede fechar fila/pool (34/34). Revisão passou rollback falho a destruir conexão, docs fail-closed em produção mesmo com config injetada e limiter por identidade testado com IPs distintos por proxy explicitamente confiável na fixture.

Não executados: SQLDDL/migrations/seeds/SHOWCREATE/schedulercontra serviço real; login/logout/2FA/CAPTCHAproviderreal; concorrênciaMySQL; consumeroutbox/jobcomercial; browservisual/frontendbuild/lint; provaTLS/WAF/SLA. Testes mocks não demonstram locks/pagamento real nem revogação persistida.

## Dependências exatas e próximo checkpoint

1. **MySQL:** conexão/schema dev e `_test` separados de produção, `TEST_DB_*`, opt-in e confirmação não produtiva, permissões/metadados fornecidos por operador. Executar `db:inspect` somente leitura para confirmar V4/logs; baseline manual de base existente, DDL novo+upgradeisolados, then teste integração. Não há serviço/credencial disponível, nenhum banco real verificado.
2. **Retenção logs:** DBA confirma `ev_logs_expurgo`, definer/scheduler/UTC/execução/90dias ou escolhe worker e desativa evento concorrente. App normal não recebe SUPER/EVENT nem muda global. Sem confirmação readiness503 é correto.
3. **Prompt02:** implementar migration sessão/revogação/desafios/consentimento/idade/responsável e conectar SessionProvider ao createApp/server; emitir JWT somente sessão plenamente autenticada/2FA. Hoje authdefault503. Provideridade/e-mail/SMS/CAPTCHA continuam dependências de aceite dos respectivos fluxos.
4. **Multi-instância:** escolher store compartilhado, fornecer factory/name namespaces e encerramento real na composição; `external` sem factory ou memorycominstances>1 bloqueados. Instância única memória explicitamente documentada.
5. **Produção:** operador atualiza patchNodeLTS e configura TLS/WAF/topologiaproxy/backups/monitoramento. Sem isso não satisfaz RNF08/20/21/36. Providers de pagamento/CDN não pertencem a01 e permanecem bloqueios futuros, não motivo para inventar sucesso.
6. **Fontes:** `docs/CineAstra-prompts-backend.md`/requisitos/banco integrais ainda ausentes no checkout. Foi relido o anexo revisado em Downloads (ContratoGlobal+Prompt01), com decisões dosdocs00. Disponibilizar fontes integrais aprovadas nos caminhos esperados para portabilidade; não substituir por resumo.

**Próxima rodada solicitável:** Prompt02 identidade, consumindo `backend/README.md`, esta atualização, arquitetura/coverage e OpenAPI. Revalidar usuárioalterações/frontend/schema; finalizar validaçãoMySQL da fundação assim que ambiente estiver disponível. Não reimplementar fundação nem avançar pagamentos/checkout. `CONCLUÍDO COM PENDÊNCIAS` aqui não representa pronto para produção ou aceiteMySQL concluído.

---

## Histórico: handoff Prompt 00 (snapshot em 06/10/2026)

As seções seguintes são registro histórico: comandos/scripts, ausência de infraestrutura e próximaetapa01 referem-se ao estado antes da implementação acima.

Data: 06/10/2026. **STATUS: CONCLUÍDO COM PENDÊNCIAS de evidência do ambiente/banco.** Entregas de diagnóstico produzidas; backend não funcional nem pronto para produção. Executado somente Prompt 00 + Contrato global. Não iniciar módulos futuros automaticamente.

## Arquivos criados nesta rodada

- `docs/backend-architecture-plan.md`: arquitetura atual/alvo, classificação, dependências/risco, frontend, permissões, máquinas de estado, contratos, propostas M00–M16, sequência e dependências externas.
- `docs/backend-schema-inventory.md`: 47 tabelas v3+V4, colunas funcionais, PK/FK/UNIQUE/CHECK, ENUMs, geradas, índices e evento de logs.
- `docs/backend-coverage.md`: matriz de todos RF01–46/RN01–26/RNF01–36, fluxo/entidade/endpoint planejado/perfil/escopo/responsável/teste, V4.
- `docs/backend-handoff.md`: checkpoint, comandos/resultados e bloqueios.

Sem alterações em código frontend/backend, manifests/lockfiles, migrations, seeds ou banco. Sem endpoint criado/modificado. Sem permissão/transação de negócio implementada. OpenAPI ausente: convenção/local/versão definidos para Prompt 01, sem spec fictícia de rotas não implementadas.

## Resumo que a próxima rodada precisa confirmar

1. Checkout inicialmente limpo. API ESM esqueleto com pastas models/controllers/routes contendo apenas `.gitkeep`.
2. Dependências locais não instaladas; manifest usa mysql/bcrypt, código exige mysql2/bcryptjs e jsonwebtoken ausentes, swagger-ui-express ausente. Preserve npm e lock v3; corrigir só no Prompt 01 autorizado.
3. `app.js` importa middlewares sem extensão, referencia authRotas inexistente, wildcard `*` incompatível Express5, dá listen no import e contém rotas/texto de loja de roupas. Não existe login implementado a preservar; preservar prefixo `/api/auth`, avaliar alias anunciado `/registrar`.
4. Frontend é protótipo com arrays hardcoded; nenhuma chamada HTTP/endpoint/resposta da API consumida. Preset local difere de tema ENUM; checkout atual sem assento e total fixo é mock, não contrato comercial real.
5. Banco final esperado 47 tabelas, nome_cine/url/galerias/newsletter/logs versionados; **não sabemos quais foram aplicados**. Não tentar migration automática para descobrir.
6. Base `02` contém SELECTs de referência com placeholders fora de comentários e queries antigas; seed `05` usa nome_fantasia depois de rename e hashes aparentes incompletos de 58 caracteres, tokens/chaves estáticos, IDs fixos. Não usar em produção/bootstrap nem confundir SELECT manual com teste automatizado.
7. JWT tem perfil minúsculo incompatível; helpers SQL concatenam where/tabela/colunas e cada chamada usa conexão própria; logger/upload têm elementos úteis mas não cumprem Contrato global.
8. Não existe configuração `.env` local na raiz/backend/frontend; `.gitignore` raiz não protege .env. Não imprimir conteúdo sensível caso próxima rodada encontre configuração em outro lugar.

## Validação realizada (sem escrever no banco)

| Comando/verificação | Resultado observado / limite |
| --- | --- |
| `git status --short` antes de editar | Vazio, checkout inicialmente limpo |
| `node --version`; `npm --version` | v24.14.1 / 11.11.0 |
| Inventário dedicado + `Get-ChildItem -Force` | Pastas de domínio/uploads só .gitkeep; sem env/node_modules locais; mysql não encontrado por Get-Command |
| Inspeção de ambos package.json e JSON completo de ambos lockfiles por script Node | lock v3, versões/runtime coerentes com respectivos manifests; ausência das quatro libs backend exigidas |
| `require.resolve` com paths backend: express/mysql2/promise/bcryptjs/jsonwebtoken | NOT_RESOLVED para todas; não chamar libs travadas de “instaladas” |
| `node --check backend/app.js` e `Get-ChildItem backend -Recurse -Filter *.js ... node --check` | 8 arquivos JS backend aceitos sintaticamente; não resolve imports/nem valida Express em runtime |
| `node backend/app.js` | Exit 1, ERR_MODULE_NOT_FOUND: express; processo falhou antes de ouvir HTTP ou acessar SQL. Defeitos de imports/authRotas/wildcard além disso constatados estaticamente, não segundo erro runtime observado |
| `npm test` em backend | Exit 1: Error: no test specified. Nenhuma suíte existe |
| Script Node ESM com node:assert e import ApiError | 6 assertions aprovadas (status 400/404/401/403/500 e chaves JSON com detalhes); teste local ad hoc, não suíte persistida nem HTTP |
| `npm audit --package-lock-only --ignore-scripts --json` em backend | Exit 0, 0 vulnerabilidades reportadas, metadados prod=99/total=98 do próprio npm. Não instala nem atualiza lock. Não prova segurança do código/provedores |
| Consulta aviso oficial Multer GHSA-3pph-fpjx-jg34 | Correction 2.4.0, lock já nessa versão; revalidar todos avisos no 01 |
| Consulta oficial Lei 15.211/2025 Planalto | Art41-A vigência 17/03/2026; aplicabilidade/modulação Art39 e regulamentos exigem decisão jurídica, não certificação |
| Scripts de inspeção seed sem imprimir dados sensíveis | 37 alvos INSERT v3, nome antigo, SELECTs manuais, tokens estáticos e 9 hashes aparentes de comprimento 58; conteúdo não executado |
| Contagem CREATE TABLE removendo linhas comentadas | 47 nomes únicos; busca regex inicial sem remover comentários deu 48 por incluir exemplo notificacoes_historico, descartado |
| Busca fetch/axios/api no frontend e leitura page/providers/config | Nenhuma integração HTTP; arrays mock/localStorage e serviços externos de imagem/fontes/trailer |
| Script Node assert de integridade documental | RF46/46, RN26/26, RNF36/36 com linhas de matriz; 47/47 entidades DDL no inventário; links relativos entre documentos resolvidos |
| `git diff --check`; `git status --short` ao finalizar | Sem diff de arquivos previamente rastreados; apenas `?? docs/` com os quatro novos documentos. `diff --check` não valida arquivos ainda não rastreados |

Uma tentativa auxiliar de inspeção com regex via `node -e` falhou na interpretação de aspas do PowerShell, antes de executar JavaScript. Refeita por here-string com sucesso; não é falha do projeto. Não executados: instalação npm, migrations/seeds, conexão MySQL/SHOW CREATE/scheduler, HTTP/RBAC/login, concorrência/transação/reembolso, OpenAPI/Swagger, frontend build/lint/browser/carga/acessibilidade. Motivos: bibliotecas/suítes/configuração de banco ausentes e escopo diagnóstico; nenhuma evidência de serviço pronto.

## Próxima etapa: Prompt 01 — fundação, não domínio

Ler os quatro documentos, AGENTS e contrato revisado; reinspecionar arquivos. Arquivos previstos para preservar/corrigir: `backend/app.js`, `config/database.js`, `config/jwt.js`, os quatro middlewares, `utils/ApiError.js`, `backend/package.json`, `backend/package-lock.json`, `.gitignore`. Manter SQL como evidência até baseline real; frontend intocado. Criar `backend/server.js`, configuração env validada/`.env.example` sem segredos, helper transacional, requestId/404/limiter/autorizações básicas/health/readiness, specification `backend/docs/openapi.json`, infraestrutura de testes/validação da spec e runner seguro com separação seeds/exemplos. Diretórios globais atuais, sem arquitetura paralela.

Aceite 01: app importável sem listen, env inválido falha seguro, HTTP health/404/errors/limites/CORS/JWT/RBAC testados, pool libera/fecha, BIGINT >2^53 não arredonda (incluindo insertId), log redigido com fila limitada, Swagger válido sem afrouxar Helmet global. MySQL integration exige base dev/test confirmada e isolada. Infra não depende de gateway/IA para começar; providers críticos não configurados falham 503. Login/cadastro real e demais módulos ficam para rodadas respectivas.

## Bloqueios e condições para resolver

| Bloqueio real | O que impede | Responsável / condição concreta |
| --- | --- | --- |
| Sem conexão/atestado de ambiente dev/test/schema real | Dizer o que já está aplicado, testar SQL/locks/scheduler | Operações fornece config por canal seguro, confirma alvo não produtivo e autoriza leitura de metadados. Somente leitura na verificação inicial; não aplicar DDL sem rodada autorizada |
| Bibliotecas/manifests incompatíveis e bootstrap quebrado | Qualquer teste HTTP/inicialização da API | Prompt 01: corrigir dependências+imports+bootstrap com lock preservado e provas runtime |
| Sem suíte automatizada/runner de migration | Regressão/contrato/integração reproduzível | 01 cria infraestrutura; módulos implementam testes antes de afirmar cobertura |
| Fontes integrais só em anexos externos, não caminhos docs pedidos | Continuidade em outra máquina | Disponibilizar/copiar fontes integrais aprovadas nos nomes esperados; não usar resumos como contrato global completo |
| Gateway/tokenização/recorrência/webhook e mídia privada não definidos | Pagamento/reembolso real e play protegido | Financeiro/infra escolhem provider, sandbox/protocolo/capacidades; 09/11 integram e validam sem aprovação fictícia |
| E-mail/SMS/CAPTCHA/provider idade e prova responsável ausentes | Reset/double opt-in/2FA remoto/cadastro idade confiável | Produto/privacidade/infra definem provider, evidência mínima/base legal/config segura; nenhum sucesso presumido |
| Custos, TTL, combo médio, ETA, ciclo/IPCA/dias, conteúdo empresarial e jurídico não aprovados | Publicar ofertas/planos/regras legais como implementadas | Financeiro/produto/operações/jurídico resolvem pendências do plano; não criar dados fictícios para passar testes |
| HTTPS/WAF/store limiter/proxy/backups/monitoramento sem evidência | Critérios produção/disponibilidade/segurança | Infra disponibiliza topologia e testes/medições operacionais; gate final 15 |

## Continuidade obrigatória

Atualizar architecture/coverage/handoff em cada rodada e a OpenAPI no módulo que criar/alterar rotas. Endpoints nas matrizes são planejamento, não implementação. Migrations M00–M16 têm dono e critérios, não execução autorizada em lote. Revalidar schema antes de escrever SQL; não recriar V4 já aplicado nem apagar histórico para revender assento. Nenhum requisito crítico desaparece pela falta de coluna: responsável/solução ou dependência impeditiva está registrado.
