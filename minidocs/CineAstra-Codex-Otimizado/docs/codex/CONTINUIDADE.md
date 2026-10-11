# Continuidade

- Última tarefa: 51 — auditoria final e entrega (11/10/2026), CONCLUIDA como auditoria, **sem aprovação para produção**. Relatório em `docs/codex/RELATORIO-FINAL.md`; `backend/README.md` atualizado. `server.js` encaminha providers de mídia/IA injetados; `.env.example` sem senha/chaves preenchidas. Gates: 222/222 testes locais, 24/24 MySQL isolados, OpenAPI 291 operações, plano 169 statements, auditoria npm sem avisos na data e diff sem whitespace inválido. Sem rota/migration nova ou DDL em produção.
- Próximo passo operacional: homologar identidade/idade/meia, gateway, mídia, e-mail e documentos oficiais; conectar frontend; migrar cópia saneada da base legada e comprovar carga, backup/restauração, retenção e monitoramento em homologação. Só depois reavaliar liberação de produção. A tarefa 49, antes bloqueada apenas pelo teste MySQL isolado, tem essa dependência satisfeita na tarefa 50; registros históricos abaixo preservam o estado de cada rodada.

- Última tarefa: 50 — revisão comercial e concorrência (11/10/2026), CONCLUIDA no marco de regressão. MySQL 8.0 isolado em porta local livre, schema novo `_test` por execução: `npm run test:integration` 24/24, `npm test` 222/222, OpenAPI e `git diff --check` válidos. Repetir na pasta `backend` com `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/runIsolatedMysqlTests.ps1` (MySQL 8.0 instalado); comando testado 24/24, servidor temporário desligado. Corrigidos controle de transação mysql2 (`beginTransaction`/`commit`/`rollback`) e leitura atual com lock do cupom; suíte SQL agora cobre último uso, rateio/renovação, direito streaming e webhook tardio/duplicado. Fixtures de galeria/ticket e contagem newsletter alinhadas ao comportamento real. Nenhuma migration/rota nova ou aplicada em produção.
- Próximo passo: tarefa 51 (auditoria final e entrega). Gateway `sandbox_fixture`, assinatura de mídia e conteúdo legal no teste são fixtures explícitas; integração com provedores reais, pagamentos, ambiente de implantação e dados oficiais ainda exigem aceite próprio. Instância temporária de teste não altera MySQL80 existente.

- Última tarefa: 49 — revisão de identidade e cadastros (11/10/2026). Regressão de JWT/revogação/2FA/IDOR, upload/galerias e horários sem falha de aplicação nos 222 testes locais. Consumidor compartilhado `/api/orders/quote`: fixture MySQL atualizada para exigir conteúdo oficial e iniciar upgrade por prefixo de migrations em ordem. Sem rota, contrato ou migration nova; OpenAPI válido.
- Aceite SQL real BLOQUEADO: as 3 suítes MySQL foram puladas por ausência de `TEST_DB_*` com schema `_test` vazio e confirmado. Próximo passo: executar a integração MySQL isolada, conferir FK/UNIQUE/concorrência e só então iniciar a tarefa 50.

- Última tarefa: 48 — relatórios e consulta administrativa (11/10/2026). Quatro rotas ADMIN: capturas/estornos por período/escopo, custo e alertas congelados, destinação social sem lucro fictício, auditoria e HTTP redigidos/paginados. RF45 segue serviços existentes.
- Migration 29 preparada/não aplicada. `npm test` 222/222 e OpenAPI válidos; 3 suítes MySQL puladas sem `TEST_DB_*`. MySQL `_test` ausente impede aceite de agregações `JSON_TABLE`, índices e concorrência/legado. Ver `docs/backend-admin-reports.md`; próxima tarefa 49.

- Última tarefa: 47 — FAQ, institucional, contratos e IA (11/10/2026). Conteúdo versionado com publicação ADMIN sem seed fictícia; cotação/assinatura exigem sumário e aceite de hash vigente, pedido conserva recibo, IA identifica-se e encaminha ao suporte humano.
- Migration 28 preparada/não aplicada. `npm test` 218/218 e OpenAPI válidos; 3 suítes MySQL puladas sem `TEST_DB_*`. Aceite de DDL/concorrência, dados empresariais/termos/FAQ reais, provider IA e apresentação destacada no frontend BLOQUEADOS. Ver `docs/backend-content-contracts-ai.md`; próxima tarefa 48.

- Última tarefa: 46 — suporte e histórico (11/10/2026). Onze rotas para CLIENTE próprio/ADMIN, mensagens append-only, prazo de cinco dias, live de dez minutos com retorno à fila e notificação de resposta. Reembolso mantém serviço 31; FAQ/IA ficam na 47.
- Migration 27 preparada/não aplicada. `npm test` 213/213 e OpenAPI válidos; 3 suítes MySQL puladas sem `TEST_DB_*`. Aceite SQL/concorrência BLOQUEADO. Ver `docs/backend-support.md`; próxima tarefa 47.


- Última tarefa: 45 — worker newsletter (11/10/2026). Claim curto `SKIP LOCKED`, revalidação de elegibilidade, backoff/lease, chave `id_envio`, webhook de bounce autenticado e supressão durável (migration 26 preparada/não aplicada).
- `npm test` 207/207 e OpenAPI válidos; 3 suítes MySQL puladas sem `TEST_DB_*`. Aceite de concorrência/DDL, provider real e reconciliação de entrega incerta BLOQUEADOS. Ver `docs/backend-newsletter.md`; próxima tarefa 46.


- Última tarefa: 44 — categorias e campanhas newsletter (11/10/2026). Dez rotas ADMIN; HTML sanitizado+texto, rascunho/agendamento/cancelamento, fila por inscrito ATIVO/confirmado e categoria ativa/aceita, UNIQUE sem reset de ENVIADO. Sem migration nova.
- `npm test` 199/199 e OpenAPI válidos; 3 suítes MySQL puladas sem `TEST_DB_*`, incluindo cenário PROMOCOES. Aceite SQL e provider/worker externos BLOQUEADOS. Ver `docs/backend-newsletter.md`; próxima tarefa 45.


- Última tarefa: 43 — preferências e descadastro newsletter (10/10/2026). Token `GESTAO` separado de `DESCADASTRO`; leitura não consome, troca recusa categorias ausentes, opt-out cancela fila pendente/falha e reinscrição exige novo aceite/confirmação.
- Migration 25 preparada/não aplicada. Testes locais/OpenAPI válidos; aceite MySQL `_test`, provider de e-mail real e worker com revalidação antes do envio BLOQUEADOS. Ver `docs/backend-newsletter.md`; próxima tarefa 44.

- Última tarefa: 42 — inscrição e confirmação de newsletter (10/10/2026). Opções de consentimento/categorias, inscrição `PENDENTE` e confirmação por token SHA-256 de uso único, com resposta uniforme para duplicado. Nenhuma migration nova; tabelas V4 existentes.
- Testes locais/OpenAPI validados; aceite MySQL `_test`, provider de e-mail, texto de consentimento publicado e recuperação de envio pós-commit BLOQUEADOS. Ver `docs/backend-newsletter.md`; próxima tarefa 43 implementa preferências e descadastro.

- Última tarefa: 41 — streaming por assinatura (10/10/2026). Nova rota de play por filme revalida benefício congelado, vigência, participante/cota, suspensão, filme e idade. Direito avulso pago continua separado; nenhuma migration nova.
- Testes locais/OpenAPI validados; autorização SQL com migrations 21–24 em MySQL `_test` e provider de mídia privada real seguem BLOQUEADOS. Ver `docs/backend-streaming.md`; próxima tarefa 42.

- Última tarefa: 40 — cobranças, atraso e cancelamento (10/10/2026). Job por competência, cotas do rateio aprovado, multa/juros/IPCA IBGE, régua 1/8/31 dias e cessação de renovação; cobrança e pagamento exibem/usam total atualizado.
- Migration 24 preparada, não aplicada. Testes locais/OpenAPI válidos; aceite de SQL concorrente, gateway/mandato real e avisos externos BLOQUEADO sem MySQL `_test` e integrações. Ver `docs/backend-subscription-billing.md`; próxima tarefa 41.

- Última tarefa: 39 — convites, participantes e rateio (10/10/2026). Quatorze rotas; limite inclui titular; entrada/saída/suspensão têm histórico, notificação e cota futura. Mudança de modalidade exige todos os consentimentos; cálculo em centavos não reescreve fatura passada.
- Migration 23 preparada e não aplicada. Testes locais/OpenAPI válidos; aceite MySQL `_test`/provider real BLOQUEADO. Próximo passo: validar backfill, locks e UNIQUE em banco isolado; tarefa 40 gera cobranças recorrentes, aplica modalidade agendada e atraso.


- Última tarefa: 38 — planos, contratação e benefícios (10/10/2026). Onze rotas de catálogo/ADMIN/assinatura; contratação congela preço e benefícios, cria cobrança `PENDENTE` e só ativa por confirmação autenticada do gateway. Combo mensal gera solicitação única, sem entrega implícita.
- Migration 22 e migrations anteriores não aplicadas; testes locais/OpenAPI válidos. Aceite MySQL `_test`, gateway real e baixa/retirada de combo BLOQUEADO. Próximo passo: validar migração, locks e webhook em ambiente isolado; então tarefa 39.


- Última tarefa: 37 — streaming avulso e reprodução (10/10/2026). Checkout congela prazo do aluguel; pagamento aprovado concede `acessos_streaming`; duas rotas próprias listam direitos sem URL e pedem play com revalidação de dono/idade/vigência.
- Migration 21 preparada, não aplicada. Testes locais/OpenAPI válidos; aceite MySQL `_test` e provider privado real BLOQUEADO. Próximo passo: validar migrations 15–21/concorrência em schema isolado, configurar origem/CDN privada e revogação em reembolso; então tarefa 38.

- Última tarefa: 36 — estado operacional e presença (10/10/2026). `GET /api/orders/{orderId}` separa financeiro/operacional; `GET /api/sessions/{sessionId}/attendance` traz histórico e atrasos; `POST /api/tickets/entry` permite reentrada após saída com nova conferência de meia.
- Migration 20 cria `ticket_passagens` e backfill; não aplicada. Testes locais/OpenAPI válidos; aceite MySQL `_test` BLOQUEADO sem ambiente isolado. Próximo passo: aplicar migrations 15–20 em `_test` vazio, testar locks/transições concorrentes e backfill; depois tarefa 37.

- Última tarefa: 35 — emissão e consumo de tickets (10/10/2026). Aprovação autenticada emite código opaco por unidade na transação do checkout; combo exige sessão e vence 30 minutos após o término, ingresso vence ao término.
- Cinco operações: tickets próprios do pedido, lista da sessão para equipe, validar sem consumir, consumir uma vez e registrar saída. Meia legada exige conferência presencial mínima; venda de meia/cota de 40% continua pendente.
- Migration 19 preparada, não aplicada; testes locais/OpenAPI válidos. Aceite BLOQUEADO sem MySQL `_test` e gateway real. Próximo passo: executar migrations/concorrência/duplo consumo em `_test`; depois tarefa 36, preservando pendência de meia e reembolso.


- Última tarefa: 34 — checkout e expiração (10/10/2026). `POST /api/orders/checkout` integra pedido/itens/snapshot, cupom, estoque e assento com chave por usuário/entrada e TTL de 15 minutos; job libera vencidos, sem ticket.
- Aprovação autenticada consome reservas uma vez; tardia fica para revisão sem direito. Pagamento continua em `/api/payments`, gateway fora dos locks. Migration 18 preparada e não aplicada.
- Testes locais e OpenAPI 215 operações validados; MySQL `_test`/gateway real ausentes. Próximo passo: aplicar migrations em schema isolado e testar UNIQUE/locks/corridas de estoque/cupom/assento e eventos tardios; então tarefa 35.


- Última tarefa: 33 — carrinho e cotação (10/10/2026). Endpoint `POST /api/orders/quote` integrado, sem pedido/reserva/ticket; aceite MySQL BLOQUEADO sem `_test` isolado.
- Valida entrada estrita, CLIENTE, idade, sala/assento, local e estoque agregado. Motor 28 calcula linhas, descontos e total; taxa zero explícita, menor e meia não aparecem como finalizáveis sem prova.
- Migration `20261010_17_streaming_purchase_pricing.sql` no manifest, não aplicada. Categoria PURCHASE exige custo próprio cadastrado; auditar ENUMs e preço publicado no MySQL de teste.
- `npm test` 141/141 e OpenAPI 214 operações válidos; duas suítes MySQL puladas. Cenário SQL opt-in preparado. Próximo passo: executar `_test` e tarefa 34, que persiste pedido/itens/snapshot/reservas e revalida preço/estoque.

- Última tarefa: 32 — ocupação ativa de assentos (10/10/2026). Migration 16 e serviço interno prontos; aceite BLOQUEADO sem MySQL `_test` isolado.
- Backfill preserva PAGO/FINALIZADO e pendências dentro de 15 minutos; preflight confere geometria/cobertura antes de remover UNIQUE histórica. Não aplicar em produção sem auditar histórico e ledger.
- `seatOccupancyService` reserva, confirma e libera após cancelamento e invalidação de ticket. Checkout da tarefa 34 deve chamar o serviço na mesma transação; nenhuma rota nova.
- `npm test` 137/137 e OpenAPI válidos; duas suítes MySQL puladas. Cenário SQL opt-in de backfill/último assento/cancelar/revender preparado. Próximo passo: executar em `_test` vazio e integrar tarefa 34.

- Última tarefa: 31 — reembolso e estorno (10/10/2026). Cinco rotas integradas; aceite BLOQUEADO sem gateway real, MySQL `_test` e contrato de compensação do checkout.
- Migration `20261010_15_refunds.sql` no manifest, não aplicada. Validar UNIQUE de solicitação aberta, status parcial, soma de estornos e rollback em MySQL isolado.
- Pedido confirma recebimento antes do gateway; timeout mantém ENVIADA sem segundo refund. Consultar provider confirma estorno; direitos/estoque/cupom ficam em `compensacao_status=PENDENTE` até consumidor de checkout. Cancelamento desliga renovação local; mandato externo e cotas compartilhadas pendem.
- `npm test` 136/136; OpenAPI 213 operações; duas suítes MySQL puladas. Próximo passo: configurar gateway/termos oficiais e validar `_test`; depois tarefa 32.

- Última tarefa: 30 — pagamentos, webhook e conciliação (10/10/2026). Quatro rotas integradas; aceite BLOQUEADO sem gateway real e MySQL `_test` isolado.
- Migration `20261009_14_payments.sql` no manifest, não aplicada. Validar vínculo único pagamento–intenção, deduplicação de evento, locks/rollback e ordenação em MySQL.
- Chamada externa fora da transação; timeout deixa PENDENTE sem segundo despacho. Webhook bruto exige assinatura/timestamp, e provider real deve verificar criptograficamente. Aprovação tardia de obrigação cancelada vira revisão sem direito.
- `npm test` 129/129; OpenAPI 208 operações; duas suítes MySQL opt-in puladas. Próximo passo: integrar gateway real/segredo de assinatura, validar ambiente `_test`; tarefa 31 trata estorno confirmado.

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
