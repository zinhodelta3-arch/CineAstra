# Continuidade

- Última tarefa: 23 — insumos e equipamentos (08/10/2026). Cadastros integrados; aceite MySQL BLOQUEADO por ausência de `TEST_DB_*`/schema `_test` isolado.
- 14 operações em `/api/inputs`, `/api/equipment` e vínculos fornecedor-local. FORNECEDOR opera próprios itens em locais autorizados; saldo inicia em zero, sem PATCH genérico; patrimônio normalizado UNIQUE.
- Migration `20261008_08_supplier_products.sql` preparada, não aplicada. Auditar patrimônios legados duplicados antes do ALTER. `npm test` 98/98; OpenAPI 140 operações; duas suítes MySQL puladas.
- RF25/RF26 parciais até movimentos de estoque; preço de catálogo não é custo. Contrato na raiz: `docs/backend-products.md`.
- Próximo passo: validar FK/UNIQUE/locks no MySQL `_test` vazio; depois tarefa 24.

## Histórico — tarefa 22

- Última tarefa: 22 — fornecedores (08/10/2026). Cadastro integrado; aceite MySQL BLOQUEADO por ausência de `TEST_DB_*`/schema `_test` isolado.
- 6 operações: ADMIN CRUD lógico `/api/admin/suppliers`; FORNECEDOR consulta `/api/suppliers/me` com CNPJ redigido. Conta vinculada exige perfil FORNECEDOR ativo.
- Queries usam `nome_cine` do ALTER legado; migration `20261008_07_supplier_cnpj.sql` acrescenta UNIQUE normalizado para CNPJ numérico/alfanumérico, preparada e não aplicada.
- `npm test` 94/94; OpenAPI 126 operações válidas; suíte MySQL opt-in preparada. RF25–RF28 de estoque/logística permanecem futuros; escopo por fornecedor/local em `docs/backend-suppliers.md` na raiz.
- Próximo passo: auditar duplicatas legadas e validar ALTER/UNIQUE no MySQL `_test` vazio; depois tarefa 23 (insumos e equipamentos).

## Histórico — tarefa 21

- Última tarefa: 21 — notificações (08/10/2026). API e consumidor integrados; aceite MySQL BLOQUEADO por ausência de `TEST_DB_*`/schema `_test` isolado.
- GET `/api/notifications/me` lista próprias com cursor/filtros; PATCH `/:id/read` marca própria. Não há POST público. Convite de equipe emite `TEAM_INVITATION` na transação, com dedupe por entrada.
- Migration `20261008_06_notification_dedupe.sql` preparada, não aplicada. `npm test` 90/90; OpenAPI 120 operações válidas; integração MySQL opt-in ainda pulada.
- RF23 parcial: promoções, suporte, planos, cobrança e UI aguardam seus módulos. Contrato na raiz: `docs/backend-notifications.md`.
- Próximo passo: validar migration/UNIQUE no MySQL `_test` vazio; depois tarefa 22 (fornecedores).

## Histórico — tarefa 20

- Última tarefa: 20 — chamados internos (08/10/2026). Implementação integrada; aceite MySQL BLOQUEADO por ausência de `TEST_DB_*`/schema `_test` isolado.
- 10 operações `/api/teams/:id/chamados`: criar, consultar, editar, cancelar logicamente, atribuir, aceitar, resolver, fechar e histórico. Supervisor apenas equipe própria; colaborador precisa de vínculo ativo.
- Migration `20261008_05_internal_tasks.sql` acrescenta equipe/sessão e eventos históricos; preparada e não aplicada. Duplo aceite serializado por lock de equipe/chamado.
- `npm test` 86/86; OpenAPI 118 operações válidas; suíte MySQL opt-in preparada. Contrato em `docs/backend-internal-tasks.md` na raiz.
- Próximo passo: validar migration, FK composta e aceite concorrente em MySQL `_test` vazio; depois tarefa 21 (notificações).

## Histórico — tarefa 19

- Última tarefa: 19 — equipes e membros (08/10/2026). Implementação integrada; aceite MySQL BLOQUEADO por ausência de `TEST_DB_*`/schema `_test` isolado.
- 13 operações em `/api/teams`: equipe por sessão, membros, solicitação, convite e decisão. Supervisor só equipe própria; convite ou solicitação não incorporam automaticamente; função definida por ADMIN/supervisor autorizado.
- Migration `20261008_04_team_entries.sql` cria pendências explícitas e UNIQUE por equipe/usuário; preparada e não aplicada.
- `npm test` 81/81; OpenAPI 108 operações válidas; duas suítes MySQL puladas. Ver `docs/backend-teams.md` na raiz para contrato e bloqueio.
- Próximo passo: validar migration/FK/UNIQUE/locks em MySQL `_test` vazio; depois tarefa 20 (chamados internos).

## Histórico — tarefa 18

- Última tarefa: 18 — agendamento de sessões (08/10/2026). Implementação integrada; aceite MySQL BLOQUEADO por ausência de `TEST_DB_*`/schema `_test` isolado.
- Sete endpoints em `/api/sessions` e `/api/admin/sessions`; público consulta sessões ativas por local/data/horário, ADMIN cria/edita/cancela.
- RN19: uma hora livre por local, inclusive salas distintas e virada de dia, sob lock local → sala → sessão. Item de pedido congela direitos. RN20 fica para futura reserva de usuário.
- `npm test` 76/76; OpenAPI 95 operações válidas; duas suítes MySQL puladas. Nenhuma migration nova ou aplicada.
- Próximo passo: validar concorrência/locks e migration aplicada no MySQL `_test`; depois tarefa 19 (equipes e membros).

## Histórico — tarefa 17

- Última tarefa: 17 — locais, salas e assentos (08/10/2026). Implementação integrada; aceite MySQL BLOQUEADO por ausência de `TEST_DB_*`/schema `_test` isolado.
- 21 operações em `/api/locations` e `/api/admin/locations`, com salas e assentos aninhados; público só cadeia ATIVA, ADMIN gerencia e DELETE arquiva.
- Sala ativa exige assentos ativos = capacidade; sessão vinculada congela layout/status/arquivamento. Tarefa 18 deve bloquear local/sala na mesma ordem antes de agendar.
- `npm test` 72/72; OpenAPI 88 operações válidas; 2 suites MySQL puladas. Nenhuma migration nova ou aplicada.
- Próximo passo: verificar migrations/constraints/locks no MySQL de teste não produtivo; depois tarefa 18 (sessões e horários).

## Histórico — tarefa 16

- Última tarefa: 16 — galeria de filmes (08/10/2026). Implementação integrada; aceite SQL BLOQUEADO pelo mesmo ambiente MySQL isolado pendente da 14.
- Endpoints: GET `/api/films/:id/images`, GET `/api/film-images/:key`; GET/POST `/api/admin/films/:id/images`, PATCH/DELETE `/:imageId`, POST `/reconcile`.
- V4 existente reutilizada sem migration nova/aplicada; lock no filme em escrita, principal única por tipo, `filmes.imagem` sincronizada; staging 15 promovido a storage durável com journal/compensação.
- Verificação: `npm test` 68/68, OpenAPI 3.0.3 válido (67 operações); SQL MySQL da 14/16 preparado e não executado sem `TEST_DB_*` e confirmação `_test` não produtivo.
- Próximo passo: configurar banco de teste vazio e volume privado, rodar integração MySQL e verificar constraints/locks; depois tarefa 17.

## Histórico — tarefa 15

- Última tarefa: 15 — upload seguro de imagens (08/10/2026).
- Estado: CONCLUIDA no escopo de staging administrativo local.
- Arquivos: imageStorage, imageProcessor, imageUpload service/controller/routes/testes/gerador; app/config/middleware/manifests/lock/OpenAPI/docs.
- Verificação: 64/64 testes aprovados; OpenAPI 60 operações (3 novas); auditoria da instalação 0 vulnerabilidades reportadas.
- Evidência real: Sharp, filesystem temporário, multipart e abort HTTP; repository de identidade simulado explicitamente.
- Migration: nenhuma nesta tarefa; migration e aceite SQL da 14 continuam pendentes.
- Endpoints: POST /api/admin/uploads/images; GET/DELETE /api/admin/uploads/images/:key; ADMIN + sessão/2FA.
- Decisões: staging privado, uma instância, 5 MiB/16 MP/8192 px entrada; WebP 2048 px sem metadados; TTL acesso 24h, expurgo sob demanda, quota 200.
- Operação: IMAGE_STAGING_DIR absoluto privado em produção; ausente/multi-instância falha 503.
- Próxima tarefa: 16 — galerias, promoção durável com compensação de storage/SQL.
- Referências na raiz: docs/backend-image-uploads.md e docs/backend-handoff.md; preservar histórico 14 e 00–13 não conciliado.
