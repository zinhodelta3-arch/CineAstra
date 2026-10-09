# Continuidade

- Última tarefa: 29 — métodos tokenizados e provider (09/10/2026). Cinco rotas próprias integradas, intenção idempotente interna; aceite BLOQUEADO sem gateway real e MySQL `_test` isolado.
- Migration `20261009_13_payment_methods.sql` no manifest, não aplicada. Auditar donos com múltiplos principais antes do ALTER; legados ficam sem token e não são cobrados. Validar DDL, FK, UNIQUE, principal concorrente e rollback no `_test`.
- Provider injetável `tokenize/create/consult/cancel/refund/verifyWebhook`, padrão 503. Nenhum pagamento aprovado ou estorno simulado.
- `npm test` 122/122, OpenAPI 204 operações; duas suítes MySQL opt-in puladas. Próximo passo: configurar gateway real com tokenização hospedada e validar migration; tarefa 30 implementa despacho, webhook e conciliação.

- Última tarefa: 28 — custos, parâmetros, promoções e cotação (09/10/2026). Backend integrado; aceite MySQL BLOQUEADO sem `TEST_DB_*`/schema `_test` isolado.
- Dezessete operações de precificação: cotação pública redigida, cotação ADMIN com alertas de margem, custos, publicação de preço, parâmetros, promoções, cupons e benefícios de plano.
- Migration `20261009_12_pricing.sql` no manifest, não aplicada. Custos legados NULL; auditar histórico de cupons antes do backfill conservador. `commit`/`settleCoupon` internos aguardam checkout/pagamento.
- `pricing.test.js` cobre C100→160→120, meia, combo, cupom concorrente e validação HTTP. Prova de meia, cota, snapshot ligado aos itens do pedido e rateio dependem das tarefas 32–39.
- `npm test` 119/119; OpenAPI 199 operações; duas suítes MySQL opt-in puladas por falta de banco isolado.
- Próximo passo: validar migration/locks no MySQL `_test`; depois tarefa 29.

- Última tarefa: 27 — solicitações e logística (09/10/2026). Backend integrado; aceite MySQL BLOQUEADO por ausência de `TEST_DB_*` e schema `_test` isolado.
- Treze operações em `/api/stock`, `/api/stock/requests` e `/api/logistics`: autorização por fornecedor/equipe/local, envio, trânsito, recebimento único e devolução de equipamento após sessão encerrada.
- Migration `20261009_11_supply_logistics.sql` no manifest, não aplicada. Auditar logísticas legadas com `id_solicitacao` duplicado ou sem identidade/quantidade antes do ALTER.
- `supply.test.js` cobre local errado, fornecedor alheio, recebimento/devolução repetidos e `a_chegar`. `npm test` 111/111; OpenAPI 182 operações; duas suítes MySQL puladas. ETA/distância real de RN11 e uso efetivo de equipamento não têm dados/provider.
- Próximo passo: validar FK/CHECK/UNIQUE, locks e rollback em MySQL `_test` isolado; depois tarefa 28.

- Última tarefa: 26 — movimentos e reserva de estoque (09/10/2026). Implementação integrada; aceite MySQL BLOQUEADO por ausência de `TEST_DB_*`/schema `_test` isolado.
- Cinco operações em `/api/inventory` para saldo, movimentos e alertas. Saldo físico/reservado separado; movimento único com sinal por tipo, histórico atômico; fornecedor só itens próprios.
- Serviço interno reserva todos componentes de combo e transiciona CONSUMIR/LIBERAR/COMPENSAR na conexão do checkout. Migration `20261009_10_inventory_reservations.sql` preparada, não aplicada.
- `npm test` 108/108; OpenAPI 169 operações; duas suítes MySQL puladas. Contrato na raiz: `docs/backend-inventory.md`. RF43/RN15 parciais até solicitação/logística e interface.
- Próximo passo: validar constraints/locks/rollback no MySQL `_test`; depois tarefa 27. Checkout futuro deve usar a mesma transação.

## Histórico — tarefa 25

- Última tarefa: 25 — galerias de insumos e combos (09/10/2026). Implementação integrada; aceite MySQL BLOQUEADO por ausência de `TEST_DB_*`/schema `_test` isolado.
- 14 operações de galeria e 3 de staging FORNECEDOR. PRINCIPAL única sob lock do pai, imagens alternativas para apresentação, propriedade por conta e compensação/journal reutilizados.
- Schema V4 já contém `insumos_imagens`/`combos_imagens`; nenhuma migration nova ou aplicada. Staging antigo sem sidecar precisa ser reenviado. `npm test` 104/104; OpenAPI 164 operações; duas suítes MySQL puladas.
- Contrato na raiz: `docs/backend-commerce-galleries.md`. Próximo passo: validar UNIQUE/locks/conciliação no MySQL `_test` e prosseguir com tarefa 26.

## Histórico — tarefa 24

- Última tarefa: 24 — combos e composição (09/10/2026). CRUD e catálogo público integrados; aceite MySQL BLOQUEADO por ausência de `TEST_DB_*`/schema `_test` isolado.
- Sete operações em `/api/combos` e `/api/admin/combos`; composição exige quantidade positiva, insumos únicos e mesmo local ativo. Referência em pedido congela edição/composição; DELETE arquiva.
- Migration `20261008_09_combo_location.sql` preparada, não aplicada. Combos legados sem local ficam ocultos da consulta pública até saneamento. `npm test` 101/101; OpenAPI 147 operações; duas suítes MySQL puladas.
- RF12/RN10 parciais: compra/consumo no fluxo posterior; preço/desconto na tarefa 28. Contrato na raiz: `docs/backend-combos.md`.
- Próximo passo: validar migration/FK/referências no MySQL `_test` vazio; depois tarefa 25.

## Histórico — tarefa 23

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
