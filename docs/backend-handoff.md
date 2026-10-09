# CineAstra — handoff tarefa 15

## Atualização tarefa 18 — 08/10/2026

**Implementada; aceite SQL BLOQUEADO por ausência de banco de teste isolado.** Criados `backend/models/sessionModel.js`, `services/sessionService.js`, `validators/sessionValidators.js`, `controllers/sessionController.js`, `routes/sessionRoutes.js`, `scripts/generateSessionOpenapi.js`, `tests/session.test.js` e [backend-sessions.md](backend-sessions.md). App, package.json, OpenAPI, teste MySQL opcional e registros de continuidade atualizados. Frontend intacto.

Sete endpoints: GET `/api/sessions[/:id]`, GET `/api/admin/sessions[/:id]`, POST `/api/admin/sessions`, PATCH/DELETE `/api/admin/sessions/:id`. RF09 e RF30: consulta/gestão de horários por local coberta no backend, com RN19 de uma hora entre sessões do mesmo local e revalidação sob lock. Item de pedido bloqueia alterações que invalidariam direitos. RN20 não aplicado a sessões administrativas; reserva de usuário exige modelo/fluxo futuro. Nenhuma migration nova/aplicada. `npm test` 76/76; OpenAPI 95 operações; duas suítes MySQL puladas sem `TEST_DB_*`. Próximo passo: validar corrida e FKs no `_test` confirmado, depois tarefa 19.

## Atualização tarefa 17 — 08/10/2026

**Implementada; aceite SQL BLOQUEADO por ausência de banco de teste isolado.** Criados `backend/models/venueModel.js`, `services/venueService.js`, `validators/venueValidators.js`, `controllers/venueController.js`, `routes/venueRoutes.js`, `scripts/generateVenueOpenapi.js`, `tests/venue.test.js` e [backend-venues.md](backend-venues.md). App, package.json, OpenAPI, teste MySQL opcional e registros de continuidade atualizados. Frontend intacto.

21 operações: GET público/admin de listas e detalhes de locais, salas e assentos; POST/PATCH/DELETE administrativos para cada entidade. Todos sob `/api/locations` ou `/api/admin/locations`, aninhando salas por `:localId` e assentos por `:roomId`. DELETE arquiva. RF45 cobre gestão de locais e estrutura de salas/assentos; RF09/RF30 recebem somente cadastro/consulta da estrutura, pois sessões/horários são tarefa 18. Nenhuma migration nova/aplicada; tabelas/FKs/UNIQUE da base são reutilizadas. `npm test`: 72/72; `npm run validate:openapi`: 88 operações válidas; 2 suítes MySQL puladas sem `TEST_DB_*`. Próximo passo: validar constraints/locks em schema `_test` vazio confirmado, então tarefa 18 deve adquirir os mesmos locks ao agendar sessão.

## Atualização tarefa 16 — 08/10/2026

**Implementada; aceite SQL BLOQUEADO por ausência de banco de teste isolado.** Galeria de filmes V4 integrada com sete operações HTTP: GET público `/api/films/:id/images`, GET WebP `/api/film-images/:key`; GET/POST `/api/admin/films/:id/images`, PATCH/DELETE `/api/admin/films/:id/images/:imageId` e POST `/api/admin/films/:id/images/reconcile`. ADMIN + sessão/2FA para gestão. Reutiliza staging 15, publica cópia durável, bloqueia filme em toda escrita, mantém uma principal por tipo com constraint V4 e sincroniza `filmes.imagem`.

Arquivos novos: `backend/controllers/filmGalleryController.js`, `routes/filmGalleryRoutes.js`, `scripts/generateFilmGalleryOpenapi.js`, `tests/filmGallery.test.js`, `docs/backend-film-gallery.md`; models/service/validators de galeria pré-existentes foram integrados e ajustados. Config/roteamento/OpenAPI e middleware de prazo Node 24 atualizados. Nenhuma migration criada/aplicada. `npm ci` com lockfile intacto, `npm test` 68/68, `npm run validate:openapi` válido (67 operações). Integração MySQL preparada em `tests/integration/identity.mysql.test.js`, sem execução por falta de `TEST_DB_*`/confirmação de schema `_test` vazio e não produtivo. Próximo passo: prover esse ambiente, executar aceite SQL da 14/16 e revisar volume privado/backup para produção. [Detalhes](backend-film-gallery.md).

Atualização 08/10/2026: **tarefa 15 CONCLUÍDA — staging administrativo seguro de imagens**. 64/64 testes aprovados; OpenAPI válido, 60 operações; auditoria da instalação sem vulnerabilidades reportadas. Nenhuma migration criada/aplicada. [Contrato, arquivos e limites operacionais](backend-image-uploads.md).

- POST `/api/admin/uploads/images`, GET/DELETE `/api/admin/uploads/images/:key`, todos ADMIN + sessão/2FA. Multer com limites, assinatura + decoder Sharp, WebP sem metadados, dimensões limitadas, nomes aleatórios, prévia privada, cleanup em abort/erro, expiração e quota de staging.
- Criados `models/imageStorage.js`, `services/imageProcessor.js`, `services/imageUploadService.js`, `controllers/imageUploadController.js`, `routes/imageUploadRoutes.js`, gerador OpenAPI e testes de upload; composição/config/middleware/manifests/lock/spec/continuidade atualizados. Frontend preservado.
- RNF05 backend upload e suporte à prévia cobertos; prévia visual frontend fica pendente. RNF17 controles do upload cobertos; não certifica segurança global. Filesystem/decoder/socket reais testados, repository de identidade simulado explicitamente.
- Operação local de instância única: `IMAGE_STAGING_DIR` absoluto privado obrigatório em produção; ausência ou multi-instância retorna 503. Staging expira em 24h, expurgo físico sob demanda, quota 200 arquivos. Não é galeria durável nem storage de playback.
- Próxima tarefa **16 — galerias**, promovendo cópia durável e vínculo V4. Bloqueio SQL da tarefa 14 permanece; esta rodada não repetiu testes MySQL sem ambiente.

## Histórico — tarefa 14

Atualização 08/10/2026: **tarefa 14 implementada; aceite MySQL BLOQUEADO por ambiente ausente**. 59 testes unitários/HTTP aprovados, OpenAPI válido (57 operações, 18 novas), 2 suítes MySQL puladas. Nenhuma migration aplicada. Escopo e comandos: [backend-catalog.md](backend-catalog.md).

- Novos: `backend/{models,services,controllers,routes,validators}/catalog*.js`, `scripts/generateCatalogOpenapi.js`, `tests/catalog.test.js`, `migrations/20261008_03_catalog_genres.sql`, `docs/backend-catalog.md`.
- Integrados/atualizados: `app.js`, `config/env.js`, `.env.example`, `package.json`, `scripts/migrationPlan.js`, `scripts/validateOpenapi.js`, `docs/openapi.json`, `tests/integration/identity.mysql.test.js`; arquitetura/cobertura/handoff e progresso/decisões/continuidade do kit.
- Endpoints: CRUD `/api/films` e `/api/genres`; consultas privadas `/api/admin/films` e `/api/admin/genres`; vínculos `/api/films/:id/genres` e leitura administrativa correspondente. ADMIN + 2FA para escrita; público só ATIVO e sem `url_reproducao`.
- Migration mínima: status de gênero para arquivamento que preserva vínculos; filmes usam status existente. DELETE sempre arquiva. RF45 catálogo coberto isoladamente; RF08 somente metadados/preços, sem compra/playback.
- Dependência exata: conexão MySQL dev/test não produtiva; `TEST_DB_*`, schema vazio `_test` diferente de `DB_NAME`, `TEST_DB_CONFIRMED_NON_PRODUCTION=true`, `RUN_IDENTITY_MYSQL_TESTS=true`. Cenário SQL do catálogo preparado na suíte de identidade, ainda não executado. Para URLs novas, configurar `CATALOG_MEDIA_HOSTS` com hosts HTTPS aprovados.
- Próxima tarefa de implementação do kit: **15 (uploads)**, sem iniciar nesta rodada. Tarefas 00–13 do kit não foram retroativamente certificadas; fundação/identidade anteriores são referência dos handoffs históricos abaixo.

## Histórico — Prompt 02

Atualização: **08/10/2026. STATUS: CONCLUÍDO COM PENDÊNCIAS.** Implementação independente de integrações externas concluída e conectada à fundação. **54 testes isolados/HTTP aprovados; 2 testes MySQL pulados por configuração ausente. Nenhuma migration aplicada; não pronto para produção.** O histórico do Prompt 01 abaixo permanece para rastreabilidade, não descreve o estado atual de identidade.

## Entrega atual

- Cadastro CLIENTE com prova externa obrigatória/aceites persistidos; login/sessão revogável/logout/reset; TOTP com enrollment restrito, limite de tentativas, replay, rotação e 2FA obrigatório para ADMIN/SUPERVISOR.
- Perfil, CRUD de endereços/contatos próprios com principal único, preferências, export paginado e solicitação de exclusão com desativação; vínculos/controles/autorizações parentais e renovação da prova de idade.
- Administração interna com mudança de acesso/revogação e proteção do último ADMIN; bootstrap controlado via stdin, sem senha fixa. SMS/e-mail 2FA permanecem 503 até integração real de protocolo/destino/entrega.
- OpenAPI 3.0.3: **34 operações de identidade + 5 de infraestrutura**. DTOs/URLs `/api` preservados conforme diagnóstico, nenhum frontend modificado.

## Arquivos criados e alterados

Novos: `backend/models/identityModel.js`, `services/identityService.js`, `services/profileService.js`, `controllers/identityController.js`, `routes/identityRoutes.js`, `scripts/bootstrapAdmin.js`, `scripts/generateIdentityOpenapi.js`, `migrations/20261008_02_identity_guard.sql`, `tests/identityFixture.js`, `tests/identity.test.js`, `tests/integration/identity.mysql.test.js`, `docs/backend-identity.md`. Fontes integrais de `agents/` copiadas para `docs/CineAstra-prompts-backend.md`, `requisitos-cineastra.txt`, `banco-referencia-cineastra.txt`, `prompt-anterior-cineastra.txt`.

Atualizados: `backend/app.js`, `server.js`, `config/env.js`, `.env.example`, `package.json`, `validators/identityValidators.js`, `providers/identityProviders.js`, `middlewares/rateLimitMiddleware.js`, `models/userAccessModel.js`, `services/accessService.js`, `scripts/migrationPlan.js`, `scripts/validateOpenapi.js`, `docs/openapi.json`, `README.md`; e os três documentos de continuidade. Preservados/reutilizados `identityCrypto.js` e migration `20261008_01_identity.sql` existentes. npm/lockfile preservados, sem dependência nova nesta rodada.

## Endpoints integrados

| Método | Caminho | Escopo |
| --- | --- | --- |
| POST | `/api/auth/register`, `/registrar`, `/login`, `/password/forgot`, `/password/reset` | Público, CAPTCHA/limites; nenhum perfil autoatribuído |
| POST | `/api/auth/logout` | Própria sessão |
| POST | `/api/auth/2fa/enroll`, `/verify`, `/disable` | Desafio restrito ou reautenticação conforme operação; disable só fator opcional |
| GET/PATCH/DELETE | `/api/users/me` | Próprio; DELETE registra solicitação 202, desativa e revoga |
| POST | `/api/users/me/age-verification`, `/export` | Próprio, provider de idade/reauth conforme fluxo |
| GET/POST | `/api/users/me/addresses`, `/contacts` | Próprio; listas paginadas |
| GET/PATCH/DELETE | `/api/users/me/addresses/:id`, `/contacts/:id` | Dono do recurso, 404 para recurso alheio |
| GET/PATCH | `/api/users/me/preferences` | Próprio |
| GET/PATCH | `/api/users/me/children/:id/controls` | Responsável legal comprovado e menor elegível |
| POST/GET | `/api/users/me/children/:id/authorizations` (POST), `/:authorizationId` (GET) | Responsável vinculado; finalidade/operação/prazo |
| POST/GET/PATCH | `/api/admin/users` (POST), `/:id` (GET), `/:id/access` (PATCH) | ADMIN + 2FA, sem último ADMIN removido nem reativação cega |
| GET | `/api/admin/privacy-requests/:id` | ADMIN + 2FA, acompanhamento persistido |

## Banco, regras e testes

Migration de identidade já existente: 5 ALTERs + 8 tabelas, aproveitada integralmente. Nova migration cria `identity_admin_guard` e linha estável para bootstrap/alteração administrativa. Plano offline **88 statements**, alvo **59 tabelas incluindo ledger**. Revisar duplicatas/segredos legados antes de upgrade; nenhum SQL aplicado.

RF01–07, RN02/RN24 e RNF07/09/13/15–19/21/23 têm entregas desta etapa, com limites por provider/infra/privacidade explícitos. RF06 meios de pagamento/RNF22 ficam no Prompt09; RF07 visual/RNF14 frontend não alterados; não afirmar conformidade integral. Matriz e evidências em [backend-coverage.md](backend-coverage.md).

`npm test`: **54/54**, `npm run validate:openapi`: aprovado (39 operações), `npm run test:integration`: **2 skips**, auditoria npm: **0 vulnerabilidades reportadas**, plano offline: **88**, sintaxe: **47 JS**, `git diff --check`: sem erro. Banco/providers simulados apenas nos testes identificados; locks reais ainda sem evidência. Runner exigiu execução fora do sandbox por `spawn EPERM`.

## Próximo checkpoint e bloqueios exatos

Consultar [backend-identity.md](backend-identity.md) para contratos, configuração, retenção, ordem de locks, comandos e limites. Falta conexão dev/test separada de produção para migrations/SQL/concorrência; faltam CAPTCHA, e-mail, verificação de idade/responsável e documentos/base legal aprovados. SMS/EMAIL exigem ainda integração de desafio/destino/entrega real. Anonimização final/limpeza/retenção, mudança de responsável, recuperação de fator perdido e reativação exigem política/procedimento aprovado. Não marcar solicitações de exclusão como concluídas.

Após resolver esses itens, executar validação MySQL descrita no README. Próximo módulo da sequência é **Prompt03**, a solicitar em outra rodada; consumir auth/session/requireAge atuais, sem reimplementar identidade. Nenhum catálogo/checkout/pagamento implementado nesta rodada.

---

## Histórico — Prompt 01

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

## Checkpoint tarefa 19 — 08/10/2026

Equipes, membros, solicitações e convites integrados em 13 operações `/api/teams`. `npm test` 81/81; OpenAPI 108 operações válida; `npm run test:integration` pulou duas suítes por ausência de `TEST_DB_*`. Migration `20261008_04_team_entries.sql` preparada, não aplicada. Antes do aceite SQL: fornecer schema `_test` vazio e não produtivo, configurar opt-in `RUN_IDENTITY_MYSQL_TESTS=true`, conferir baseline e executar `npm run test:integration`. Ver [backend-teams.md](backend-teams.md) para contrato, autorização e impacto. Não foi criado frontend nem chamado interno; tarefa seguinte é 20.

## Checkpoint tarefa 20 — 08/10/2026

Chamados internos integrados em 10 operações `/api/teams/:id/chamados`, separados de suporte. `npm test` 86/86; OpenAPI 118 operações válida. Migration `20261008_05_internal_tasks.sql` preparada, não aplicada. Integração MySQL opt-in de FK/duplo aceite/histórico foi acrescentada à suíte existente; `TEST_DB_*` e schema `_test` vazio não estão disponíveis. Próximo passo operacional: conferir baseline e executar as migrations e a suíte somente em banco isolado. Ver [backend-internal-tasks.md](backend-internal-tasks.md). Tarefa seguinte: 21 notificações.

## Checkpoint tarefa 21 — 08/10/2026

Notificações próprias integradas em 2 operações `/api/notifications/me`; convite de equipe emite evento interno na transação com dedupe persistente. `npm test` 90/90; OpenAPI 120 operações válida. Migration `20261008_06_notification_dedupe.sql` preparada, não aplicada. Suíte MySQL opt-in de UNIQUE foi ampliada; falta `TEST_DB_*` e schema `_test` vazio para execução. RF23 permanece parcial: promoções, suporte, planos, cobrança e frontend são módulos posteriores. Ver [backend-notifications.md](backend-notifications.md). Próxima tarefa: 22 fornecedores.

## Checkpoint tarefa 22 — 08/10/2026

Fornecedores integrados em 6 operações administrativas/próprias; `npm test` 94/94, OpenAPI 126 operações válida. O ALTER legado de `nome_cine` já consta no manifest; migration nova `20261008_07_supplier_cnpj.sql` preparada, não aplicada. Cenário MySQL opt-in verifica schema final e UNIQUE normalizado; falta `TEST_DB_*`/schema `_test` vazio. Pré-implantação exige auditar duplicatas legadas de CNPJ. RF25–RF28 permanecem parciais até produtos, estoque, logística e devolução. Ver [backend-suppliers.md](backend-suppliers.md). Próxima tarefa: 23 insumos e equipamentos.

## Checkpoint tarefa 23 — 08/10/2026

Insumos/equipamentos integrados em 14 operações de produto e vínculo fornecedor-local. `npm test` 98/98; OpenAPI 140 operações válida; MySQL opt-in pulou por ausência de `TEST_DB_*` e schema `_test` vazio. Migration `20261008_08_supplier_products.sql` preparada, não aplicada. Antes da aplicação, auditar patrimônios duplicados após trim/uppercase e validar FK/UNIQUE no banco de teste. Saldo só pode mudar no futuro módulo de movimentos; preço não representa custo. RF25/RF26 permanecem parciais. Ver [backend-products.md](backend-products.md). Próxima tarefa: 24.

## Checkpoint tarefa 24 — 09/10/2026

Combos integrados em 7 operações públicas/administrativas. `npm test` 101/101; OpenAPI 147 operações válida; duas suítes MySQL opt-in puladas por ausência de `TEST_DB_*` e schema `_test` vazio. Migration `20261008_09_combo_location.sql` preparada, não aplicada. Antes do ALTER, inspecionar combos legados sem local e decidir saneamento; sem isso ficam preservados mas ocultos do catálogo público. Validar FK, composição e bloqueio por `itens_pedido` no banco isolado. RF12 e RN10 permanecem parciais até compra/consumo e serviço de preço/desconto. Ver [backend-combos.md](backend-combos.md). Próxima tarefa: 25.

## Checkpoint tarefa 25 — 09/10/2026

Galerias de insumos/combos integradas em 14 operações, mais 3 operações de staging FORNECEDOR. `npm test` 104/104 e OpenAPI 164 operações passaram; duas suítes MySQL opt-in foram puladas sem `TEST_DB_*`/schema `_test` vazio. Nenhuma migration nova: tabelas V4 já previstas no manifest, mas sua aplicação não foi verificada. Cenário SQL de UNIQUE/principal concorrente/propriedade está preparado. Staging anterior sem sidecar de proprietário deve ser reenviado. Ver [backend-commerce-galleries.md](backend-commerce-galleries.md). Próxima tarefa: 26.

## Checkpoint tarefa 26 — 09/10/2026

Cinco operações de saldo/movimentos/alertas e API interna de reserva por pedido integradas. `npm test` 108/108; OpenAPI 169 operações válida; duas suítes MySQL opt-in puladas sem `TEST_DB_*`/schema `_test` vazio. Migration `20261009_10_inventory_reservations.sql` preparada, não aplicada. Antes do aceite, validar CHECK/FK/UNIQUE, último item concorrente e rollback parcial em MySQL isolado; conferir histórico e migração de dados legados. Checkout real deve usar a mesma conexão/transação para criar pedido, reservar, consumir ou compensar. RF43/RN15 permanecem parciais. Ver [backend-inventory.md](backend-inventory.md). Próxima tarefa: 27.

## Checkpoint tarefa 27 — 09/10/2026

Treze operações de estoque local, solicitações e logística integradas. `supply.test.js` cobre item/local, fornecedor, recebimento e devolução repetidos; `npm test` 111/111 e OpenAPI 182 operações válidas. Duas suítes MySQL opt-in foram puladas. Migration `20261009_11_supply_logistics.sql` está no manifest e não foi aplicada. Antes do ALTER, auditar logísticas legadas com solicitação duplicada ou sem item/quantidade. Falta `TEST_DB_*`/schema `_test` isolado para verificar FK, CHECK, UNIQUE, concorrência e rollback. ETA de RN11 depende de dados reais de distância; uso efetivo de equipamentos não está modelado. Ver [backend-supply-logistics.md](backend-supply-logistics.md). Próxima tarefa: 28 após o aceite SQL.

## Checkpoint tarefa 28 — 09/10/2026

Precificação integrada em 17 operações de cotação pública/ADMIN, custos, publicação, parâmetros, promoções, benefícios de plano e cupons. `pricing.test.js` cobre dinheiro exato, C100→160→120, meia, combo, acesso e limite concorrente de cupom. `npm test` 119/119 e OpenAPI 199 operações válidas; duas suítes MySQL opt-in puladas. Migration `20261009_12_pricing.sql` preparada no manifest e não aplicada. Auditar cupons e pedidos legados antes do backfill conservador; custos NULL exigem cadastro real. Sem `TEST_DB_*`/schema `_test` isolado, falta validar CHECK/FK, lock de cupom e snapshot no MySQL. Checkout deve chamar `commit`/`settleCoupon` na mesma transação e comprovar meia; não se declara pagamento ou direito validado. Ver [backend-pricing.md](backend-pricing.md). Próxima tarefa: 29.

## Checkpoint tarefa 29 — 09/10/2026

Cinco operações de método próprio tokenizado integradas. Provider injetável com `tokenize/create/consult/cancel/refund/verifyWebhook`; padrão 503, sem gateway real. `prepare` interno verifica obrigação pedido XOR cobrança, pagador, método e chave idempotente persistente antes de despacho externo. `paymentMethod.test.js` cobre IDOR, provider ausente, rejeição de PAN/CVV e chave repetida. `npm test` 122/122; OpenAPI 204 operações; duas suítes MySQL opt-in puladas. Migration `20261009_13_payment_methods.sql` no manifest, não aplicada; auditar múltiplos métodos principais legados antes do ALTER. Aceite bloqueado por ausência de gateway real e MySQL `_test`; webhook/conciliação ficam na tarefa 30. Ver [backend-payment-methods.md](backend-payment-methods.md).
