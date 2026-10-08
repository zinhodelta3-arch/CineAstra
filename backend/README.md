# CineAstra API — fundação e identidade (Prompts 01–02)

JavaScript ESM/Express 5, Node 24 LTS e npm 11. Infraestrutura e identidade integradas: cadastro/login/logout/reset, TOTP, perfil, endereços/contatos/preferências e privacidade. Catálogo/checkout/pagamentos não pertencem a esta etapa. **CONCLUÍDO COM PENDÊNCIAS; não pronto para produção.** Nenhum frontend alterado. Liveness independe de MySQL; `/ready` verifica banco/logs/retenção, não certifica providers de identidade.

## Instalar e executar

Na pasta `backend`, execute `npm ci`, copie `.env.example` para `.env` local e preencha somente com configuração autorizada de desenvolvimento. Gere JWT_SECRET aleatório com pelo menos 32 bytes e mantenha fora do versionamento; não reutilize fixtures de testes. São obrigatórios `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `JWT_ISSUER`, `JWT_AUDIENCE`. Password vazia não é aceita. Nenhuma conexão/credencial foi fornecida nesta entrega.

- `npm start`: carrega `backend/.env`, valida config, inicia `server.js`; sem config válida, exit 1 sem imprimir valores.
- `npm run dev`: mesmo startup com watch.
- `npm test`: testes unitários/HTTP com dependências SQL/sessão **explicitamente simuladas**, sem MySQL externo.
- `npm run validate:openapi`: valida OAS 3.0.3 e compara 5 operações de infraestrutura + 34 de identidade.
- `npm run generate:openapi:identity`: atualiza contratos de identidade na mesma spec, a partir dos validadores e registry de rotas.
- `npm run test:integration`: MySQL real somente com opt-in configurado abaixo; skip explícito caso ausente.
- `npm run migrate -- --plan`: plano/checksums **sem conexão nem execução SQL**.
- `npm run db:inspect`: consulta versão/metadados de V4/logs e estado da retenção; exige `DB_INSPECT_CONFIRMED_NON_PRODUCTION=true`, não executa DDL/DML.

Env fixa limites: corpo 64KiB (configurável até 1MiB), URLencoded até 50 campos, fila SQL 100/conexões10, deadline SQL padrão3s/HTTP10s. Port3001 por padrão evita Next3000. Node24 foi confirmado LTS pela fonte oficial em 06/10/2026: https://nodejs.org/en/about/previous-releases. Ambiente de teste disponível24.14.1; atualizar para patch LTS recente aprovado antes de publicar (fonte indicava24.21.0), sem alterar instalação global nesta rodada.

## Endpoints e Swagger

| Método | URL | Acesso / formato |
| --- | --- | --- |
| GET | `/` | Público, identificação CineAstra sem dados internos |
| GET | `/health` | Público, liveness sem SQL |
| GET | `/ready` | Público, ping SQL + logs + retenção; 200/503 seguro |
| GET | `/openapi.json` | Especificação única, apenas docs habilitadas em dev/test/staging |
| GET | `/api-docs` e `/api-docs/` | Swagger UI e assets locais; Authorize bearer JWT, persistAuthorization=false |

Abra `http://localhost:3001/api-docs/` após startup válido. Try it out dos health checks não valida pagamentos/RBAC/concorrência. Os testes verificam JSON/UI/assets/CSP; produção desativa ambas as rotas de documentação. A CSP só flexibiliza estilos inline na UI, mantém scripts/connect self; Helmet permanece no resto da API. Não há exemplos com tokens/credenciais, nem aprovação artificial de login para preencher Authorize.

Sucesso `{success:true,data,requestId}`; erro `{success:false,code,message,requestId,details?}`; details somente `field/code` de validação. 400 malformado,401 auth,403 CORS/perfil/escopo,404 rota,409 conflito,413 limite,415 mídia,422 regra,429 limite,500 interno,503 dependência/deadline. X-Request-Id sempre gerado no servidor, sem refletir header externo. Erro nunca retorna SQL/stack nem em development. Identificadores são strings decimais (incluindo BIGINT), DECIMAL strings exatas/sem conversão float, DATE string e instantes UTC. Não publicar DTO financeiro por serialização de linha SQL genérica.

## Compor módulos futuros com segurança

`createApp({config,database,logQueue,retention,sessionProvider,identityProviders,captchaProvider,storeFactory,registerRoutes})` é factory sem listen/pool global. `server.js` compõe pool e identidade; `startServer(config, overrides)` recebe adapters reais para composição explícita. `registerRoutes(app,{auth,limits,captcha})` permanece ponto de extensão. Providers não são habilitados por nomes/configuração fictícia.

- `auth` exige bearer HS256/issuer/audience/iat/exp/sub/sid/jti/purpose, chama `sessionProvider.verifyActive({userId,sessionId,jti,signal})`, consulta perfil/status atuais em `usuarios`. Default usa `sessoes_autenticacao` via identityModel e retorna `{userId,expiresAt,revoked,twoFactorVerified}`. Login/logout/reset estão integrados; AD/S exigem 2FA, demais perfis com fator ativo também. Sem refresh token/cookies. Migration/provider indisponível nunca autoriza acesso.
- `allowRoles` usa ENUM uppercase. `requireOwner(resolver)` exige dono real e não dá bypass ADMIN. `requireOperationalScope(check)` espera consulta de vínculo ativo/relações aninhadas no service; provider ausente 503, false403. Perfil sozinho não dá acesso global.
- `limits.login/register/recovery/twoFactor/checkout/tickets/upload/newsletter` são arrays IP+identidade; montar antes dos respectivos fluxos futuros. Identity email normalizado ou usuário atual é SHA256 na memória/store; nunca logado. Montar limite autenticado após auth para usar id. Limite geral precede parsing/CORS e retorna429+Retry-After, que também entra no log.
- `captcha` default indisponível. `requireCaptcha(provider)` exige token e verificação servidor; ausência422/false422/provider ausente503. Não ignora provider ausente em produção; provider real depende de escolha/config do projeto.
- `database.transaction(async connection => {...}, {signal})`: uma conexão com START TRANSACTION,COMMIT ou ROLLBACK e release no finally; se rollback/deadline falhar, socket destruído em vez de devolver conexão quebrada. Models recebem conexão e usam `execute(sql,params)`. Nenhum helper de tabela/where arbitrários permanece. Nada de chamada externa dentro de locks; callback cancelado não pode continuar com SQL após timeout; não há retry automático de commit incerto/deadlock.
- `recordAuditEvent(connection,event)` persiste auditoria+outbox no mesmo transaction caller e aceita somente metadados mínimos. Exige M01 aplicada. Identidade emite eventos duráveis; não há consumidor de notificações nesta etapa, nem dependência desse consumidor para revogar acesso. Consumer idempotente e retenção por evento ficam explícitos para módulos seguintes. Logger HTTP não substitui auditoria.
- Upload não tem rota e `/uploads` não é servido publicamente. Factory Multer tem limite de bytes/files/fields/parts, não aceita arquivos genéricos irrestritos. MIME é só filtro inicial; `requireUploadContentValidator` falha503 sem validador real. Storage/assinatura/decodificação/nomes aleatórios/compensação entram no03; não publicar buffer bruto.

## Banco e migrations (somente dev/test/homologação autorizados)

Os SQLs legados permanecem intactos. `scripts/migrationPlan.js` usa manifest revisado: DDL v3 + índices, logs, rename, V4+backfill de capa/categorias, M01 auditoria/outbox. Exclui `CREATE DATABASE`, `USE`, seeds `05`, SELECTs de referência com `?`, exemplos comentados e DROP/CREATE EVENT. Seeds antigos têm nome_fantasia/hashes inválidos/valores estáticos e não são executados nem bootstrap administrativo.

O DBA deve criar previamente schema InnoDB/utf8mb4 em **MySQL>=8.0.16** e credencial dev/test apropriada. MariaDB não foi validado e a collation V4 exige MySQL8. Em uma **base vazia confirmada**, configure `MIGRATION_CONFIRMED_NON_PRODUCTION=true` e `MIGRATION_TARGET` exatamente igual ao DB_NAME e execute `npm run migrate -- --apply`. Estes flags não são proteção mágica: confirme host/schema/backup fora do código, nunca aponte para produção. Runtime produção recusa apply.

Runner trava pelo GET_LOCK no schema e mantém `schema_migrations` com nome/checksum/status por statement. DDL faz commit implícito: RUNNING é persistido antes do statement, APPLIED depois. Crash/falha/ddl parcial ou checksum divergente bloqueia retry, exige SHOW CREATE e revisão manual; jamais simplesmente apagar marker ou usar --force. Bases existentes **sem ledger** são recusadas antes de DDL; baseline real deve mapear metadados a cada statement/backfill aplicado com evidência de operador, antes de alimentar ledger. Não há baseline automático nem inferência por existência de arquivo. As duas tabelas M01 são nova migration explícita, nunca tratar como já existentes. Nenhuma migration foi aplicada nesta rodada.

Para base existente, o operador decide migration mínima após comparação com `docs/backend-schema-inventory.md`; não repetir CREATE/ALTER V4 nem INSERT capa/categorias. Plano **88 statements**: 73 da fundação + 13 da migration `20261008_01_identity.sql` + 2 de `20261008_02_identity_guard.sql`. Ledger não integra a contagem. A segunda cria tabela/linha estável de lock administrativo. Verificar CPF/e-mail normalizados duplicados, fatores repetidos e principais antes dos UNIQUE da primeira; falha não autoriza apagar dados. Rodar DDL/upgrade em banco isolado ainda é pendência.

## Logs HTTP e expurgo

Tabela `logs` existente é usada por INSERT parametrizado com dados_requisicao/dados_resposta **sempre NULL**. Captura usuário autenticado quando disponível, método,status,duração,tamanho e IP conforme proxy confiável. URL/query/body/headers/User-Agent não são persistidos; grava só template da rota (sem baseUrl que possa conter valores) ou `[unmatched-or-middleware]`. Omissão User-Agent é intencional: campo controlado pelo cliente pode transportar token/PII. Parser/CORS/limiter/errors ficam depois do logger. Erros e mutações registrados, GET saudável amostrado; health saudável não ocupa log.

Fila limitada de uma escrita por vez, métricas `stats()` written/failed/dropped/pending, drain no shutdown; falha/drop registra evento sem SQL/segredo. Métricas devem ser coletadas pelo monitoramento interno, não expostas publicamente. Fila HTTP volátil pode perder registros em crash; não substitui auditoria/outbox durável.

- `LOG_RETENTION_MODE=event`: `/ready` verifica logs, @@global.event_scheduler=ON, evento ev_logs_expurgo ENABLED e definição conhecida90dias/15min/lote5000. Usuário aplicação só precisa SELECT de metadados, nunca SET GLOBAL/EVENT/SUPER. O DBA administra definer/scheduler/execução/UTC e confirma expurgo observado; arquivo versionado sozinho não comprova operação.
- `LOG_RETENTION_MODE=worker`: worker faz DELETE lote5000/90dias a cada15min configurável, somente se não houver evento habilitado concorrente. Antes de cada lote revalida metadados; concorrência DBA/worker exige coordenação operacional. Exige DELETE em logs e SELECT de metadados. É necessário que DBA desative/remova evento se existir; código não altera EVENT. Failure retorna503 em readiness/telemetria, sem marcação de sucesso fictício.
- Retenção HTTP90dias não se aplica a auditoria/financeiro/consentimentos. Não há job removendo auditoria/outbox; política de finalidade e prazos/consumers aprovados antes dos domínios.

## Teste MySQL real (opt-in)

Configure `RUN_MYSQL_TESTS=true`, `TEST_DB_HOST/PORT/USER/PASSWORD/NAME`, `TEST_DB_CONFIRMED_NON_PRODUCTION=true`, NODE_ENV não production. TEST_DB_NAME deve terminar `_test` e ser diferente de DB_NAME. Teste usa **TEMPORARY TABLE** aleatória InnoDB, verifica BIGINT SELECT+insertId >2^53, DECIMAL/DATE e COMMIT/ROLLBACK, depois DROP TEMPORARY e pool.end. Não altera tabela de domínio nem faz limpeza ampla. Sem configuração, skip identificado. Não use credencial produtiva mesmo que nome tenha `_test`.

Para identidade, habilite também `RUN_IDENTITY_MYSQL_TESTS=true` e forneça um **schema _test vazio**. A suíte `identity.mysql.test.js` recusa schema com tabelas, aplica baseline e upgrade com dado legado de teste, valida HTTP real, constraints, reset/2FA/principal concorrentes e rollback. Deixa dados/evidências no schema; não apaga/recria banco automaticamente. Reexecução exige outro schema vazio ou limpeza específica feita pelo operador. Não executar em produção.

## Identidade, providers e bootstrap

Contratos/rotas, configuração e limites: [backend-identity.md](../docs/backend-identity.md). Rotas também estão no Swagger. LOGIN pode retornar `next: ENROLL_2FA` ou `VERIFY_2FA`, com `challengeToken`; enviar esse token no body de enroll/verify, nunca como bearer ou URL. Só após receber `accessToken`, preencher Authorize. Logout revoga sessão no banco.

Configure `TWO_FACTOR_ENCRYPTION_KEY` como 32 bytes aleatórios em base64, separada de JWT_SECRET e protegida fora do banco. Backup seguro dessa chave é necessário para recuperação de fatores; não trocar/destruir silenciosamente. `BCRYPT_COST=12` por padrão. `TERMS_VERSION`, `PRIVACY_VERSION` e `IDENTITY_LEGAL_BASIS` devem corresponder a documentos e política reais aprovados. Sem eles/provedores, cadastro não conclui. CAPTCHA é obrigatório em login/cadastro/forgot/reset, inclusive desenvolvimento, exceto fixtures explicitamente injetadas em testes.

APP/TOTP está implementado. SMS/EMAIL retornam 503 e ainda exigem integração real de desafio, comprovação de destino e entrega. E-mail de recuperação/confirmação de endereço, idade/responsável e CAPTCHA também exigem adapters reais, conforme contratos em `providers/` e no documento de identidade. Não transformar fixtures em provider produtivo. Recuperação de fator perdido/legado e reativação/mudança de responsável dependem de procedimento aprovado.

Primeiro ADMIN: após migrations, em ambiente autorizado, configure `BOOTSTRAP_ADMIN_CONFIRMED=true` e execute `npm run bootstrap:admin -- --apply` recebendo **JSON por stdin seguro** com `name,email,cpf,dateOfBirth,password,passwordConfirmation`. Nunca coloque senha em argumentos/histórico de shell ou arquivo versionado. O comando não imprime entrada, não escolhe senha fixa e recusa qualquer ADMIN já existente. Guard estável impede dois bootstraps concorrentes. Conta criada deve completar enrollment e prova 2FA; chave cifradora/CAPTCHA reais são necessários para o login HTTP. Este comando foi criado/testado por contrato, **não executado contra banco nesta rodada**.

DELETE me retorna202, desativa conta/revoga acesso e registra solicitação, sem excluir histórico. Guardar ID para atendimento; Location é consulta administrativa. Anonimização/eliminação final aguarda política de retenção e revisão, não é declarada concluída. Export próprio é paginado por seção e exige reautenticação; apenas dados do módulo identidade, sem segredos. Métodos de pagamento ficam no09.

Validação desta rodada: **54 testes isolados/HTTP aprovados, OpenAPI39operações válido, 2 testes MySQL pulados por falta de configuração, audit sem vulnerabilidades reportadas**. Mocks não comprovam locks/DDL/provedores reais. Nenhuma migration aplicada.

## Operação/produção: condições não resolvidas por código

HTTP Node fica atrás de TLS/WAF configurado (não implementa HTTPS local). CORS_ORIGINS explícitas, HTTPS em production; TRUST_PROXY vazio por padrão. Configure apenas endereços/CIDRs dos proxies reais, nunca true/hops/rede global. Não confiar em X-Forwarded-For público. Memória de rate limit apenas instância única; INSTANCE_COUNT>1 com memory é inválido. External store exige `storeFactory(name)` real na composição, não há Redis escolhido/configurado: ausência bloqueia startup. HTTPS/Cloudflare/WAF/backup/monitoramento/limites de borda exigem configuração operacional e provas.

SIGINT/SIGTERM: readiness deixa de aceitar, fecha HTTP/idle, aguarda worker/fila, fecha limiter/pool; deadline força sockets e, no CLI, exit1 após prazo caso recursos travem. Não há workers de negócio a fechar nesta etapa. Prontidão não valida funcionalidades futuras, nem comprova SLA99,5% ou resistência total a ataques.
