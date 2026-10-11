# CineAstra — relatório da auditoria final (tarefa 51)

## Validação posterior: upgrade da migration 30 — 11/10/2026

`powershell -NoProfile -ExecutionPolicy Bypass -File scripts/runIsolatedMysqlTests.ps1` em `backend`: 26/26 testes MySQL 8.0 temporários aprovados, zero skips. A base foi criada com migrations anteriores à 30 e dados sintéticos de pedidos pendentes/pagos/cancelados, pagamento, itens e reservas. O `applyPlan` oficial aplicou a 30, preservou histórico/relacionamentos e reconheceu a reexecução pelo ledger. A rota cancelou após o upgrade; a liberação conjunta de assento/estoque/cupom e o rollback de falha após as três mutações foram confirmados no banco. Não houve banco legado real nem gateway externo.

## Entrega posterior: cancelamento manual restrito — 11/10/2026

Decisão de produto aprovada somente para pedido próprio `AGUARDANDO_PAGAMENTO`, sem ticket nem cobrança despachada/incerta. `POST /api/orders/{orderId}/cancel` usa chave obrigatória, recibo persistente (migration 30), 404 para alheio, 200 idempotente e 409 `ORDER_CANCEL_CONFLICT` para inelegível. Intenção `PREPARADA` é neutralizada, e reservas liberadas na mesma transação. MySQL temporário 25/25, zero skips; regressões locais 19/19 e OpenAPI válido. A execução usou fixture de gateway, sem captura real. Estoque/cupom foram exercitados por teste de serviço; a aplicação da migration em homologação com dados existentes e a política de reembolso/ingresso pago continuam pendentes. As seções seguintes descrevem resultados históricos anteriores a esta entrega.

## Verificação posterior: cancelamento solicitado pelo cliente — 11/10/2026

**Lacuna confirmada:** não há rota nem política documentada para cliente cancelar antecipadamente um pedido; `POST /api/orders/{id}/cancel` retorna 404. A execução isolada confirmou 404 para outro cliente na consulta do pedido/ticket e na solicitação de reembolso; cancelamento automático por expiração idempotente com liberação do assento; corrida com aprovação tardia que preserva pedido CANCELADO, registra pagamento APROVADO para revisão e não emite ticket. Pedido pago aceita solicitação idempotente de arrependimento em até sete dias (202), mas não é cancelado pela solicitação e o ticket consumido não é revogado: compensação pendente. Integração MySQL temporária 25/25 sem skips; testes locais de reembolso 7/7. Pagamento, assinatura e estorno externos não foram acionados. Não inferir sucesso do cancelamento manual nem do estorno real.

## Verificação posterior: compra de ingresso em MySQL isolado — 11/10/2026

Um cenário HTTP/MySQL adicional confirmou cotação, aceite, corrida de duas compras pelo mesmo assento (201/409), cancelamento por expiração, revenda, pagamento por provider de teste, aprovação duplicada, emissão de um ticket e consumo único (segunda tentativa 409). `runIsolatedMysqlTests.ps1`: 25/25 aprovados e zero skips em instância temporária; testes locais relacionados: 22/22. O gateway e sua assinatura HMAC são fixture local, sem captura externa; frontend, cancelamento solicitado pelo usuário e base legada permanecem não verificados. Os números 24/24 abaixo são o registro histórico da tarefa 51, anterior a este cenário.

Data: 11/10/2026. Escopo: backend e seus contratos; inspeção separada do frontend e da infraestrutura. **Auditoria entregue; produto não aprovado para produção.** O resultado dos testes no banco isolado comprova o caminho implementado com dados sintéticos, não pagamentos, envio, reprodução ou operação externa reais. A matriz de requisitos é [`COBERTURA.md`](COBERTURA.md); o handoff operacional está em `../../../../docs/backend-handoff.md`.

## Evidência e gates

| Área | Evidência desta revisão | Limite |
| --- | --- | --- |
| Schema/migrations V4 | `npm run migrate -- --plan`: 169 statements versionados; baseline e migrations 01–29 aplicados pela suíte em schema MySQL 8.0 `_test` vazio | Nenhuma aplicação/inspeção em banco de produção ou upgrade de legado com dados reais |
| Rotas/contrato | `npm run validate:openapi`: OpenAPI 3.0.3 válido e 291 operações correspondem ao registry das rotas | UI Swagger manual e integração frontend ponta a ponta não executadas |
| Regressão local | `npm test`: 222/222 aprovados após correção de composição dos providers | Muitos testes usam fixtures deliberadas; não certificam integrações externas |
| Integridade/concorrência | `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/runIsolatedMysqlTests.ps1`: 24/24, sem skips, em instância/schema exclusivos; transações, FK/UNIQUE, último assento/estoque/cupom, ticket, rateio/renovação e aprovação tardia/duplicada | Dados pequenos e sintéticos; sem carga real, concorrência distribuída ou gateway sandbox autenticado |
| Consultas reais no MySQL | `EXPLAIN` no schema de teste: checkout vencido usa `ix_pedidos_checkout_expira`; pagamentos usa `idx_pagamentos_relatorio`; fila de newsletter usa `idx_newsletter_envios_fila` com `filesort` | Com uma linha estimada, o plano não prevê custo em escala; medir fila e relatórios com cardinalidade representativa antes de produção |
| Dependências | `npm audit --omit=dev --json`: zero vulnerabilidades reportadas na consulta desta data | Resultado temporal; não substitui revisão e atualização de dependências |
| Higiene | `git -c core.safecrlf=false diff --check` sem erro; exemplo `.env.example` sem valores de segredo utilizáveis | Valores antigos do exemplo podem persistir no histórico Git; rotacionar se usados fora de teste |

## Achados corrigidos na tarefa 51

- `server.js` agora encaminha os adapters `streamingProvider` e `assistantProvider` recebidos por `startServer` para `createApp`. Antes, a composição do servidor ignorava ambos, mesmo quando um operador os injetava. O CLI `npm start` continua sem provedores reais configurados; esta correção não simula disponibilidade.
- `.env.example` deixou de conter senha e chaves preenchidas. O arquivo serve de modelo e exige valores próprios. Qualquer uso anterior dos valores publicados requer rotação e análise de histórico/implantação.
- `backend/README.md` foi refeito para o estado atual: instalação, plano de migrations, comandos, contrato, teste isolado e condições de operação. Nenhum endpoint, DTO, OpenAPI ou DDL foi alterado nesta tarefa.

## Requisitos e limites de aceite

RF01–RF46 e RN01–RN26 têm implementações de backend em graus diferentes, documentadas na matriz. Não há afirmação de cobertura integral do produto. Os bloqueios mais relevantes são:

1. **Identidade, menores e direitos de ingresso:** CAPTCHA, recuperação/confirmação por e-mail, verificação confiável de idade, vínculo e autorização do responsável, comprovante de meia na compra e cota visível/assegurada de 40% não estão homologados. RN22–RN24 e RF01/RF10 não podem ser liberados como fluxos de venda de menores ou meia-entrada.
2. **Dinheiro e contratos:** faltam gateway real e sandbox autenticado com webhooks, conciliação financeira, mandatos de débito/Pix Automático, estorno real, documentação contratual/empresarial oficial e validação do texto na interface. Aprovação de fixture em teste nunca é captura real. RN03–RN04, RN25–RN26 e RF15–RF20 dependem desses aceites.
3. **Provedores externos:** mídia em origem privada/CDN assinada, e-mail de newsletter e identidade, IA com política de dados e canais de notificação não estão integrados a fornecedores reais. Os providers padrão respondem indisponível; delivery incerto após crash exige conciliação.
4. **Dados e operação:** não houve migração da base existente nem auditoria de duplicatas/legado, backup/restauração, TLS/WAF, retenção e outbox em operação, observabilidade e alerta, nem testes de falha e carga. Consulta de índices no schema sintético não estabelece latência, throughput ou plano com cardinalidade de produção. Relatórios financeiros não apuram lucro líquido; RN17 permanece sem base para destinação.
5. **Frontend:** o diretório `frontend` contém páginas e componentes Next, mas não um `package.json`/lockfile de build nem chamadas `fetch`/Axios para as APIs nesta revisão. Formulários de login e suporte são demonstrações de UI. Não houve validação visual, acessibilidade, contrato ponta a ponta ou checkout real. RF07 e partes visuais de RN23/RN25 não estão entregues.
6. **Lacunas funcionais específicas:** RN11 não calcula ETA por distância real; RN20 exige fluxo de reserva do usuário; RF28 não modela uso efetivo do equipamento. RF45 é atendido por operações de domínio, sem CRUD genérico que contorne regras; cada fluxo depende de aceite operacional.

## Próximo passo para entrega operacional

Priorizar integração real de identidade/idade e documentos jurídicos; homologar gateway e mídia com credenciais/sandbox separados; ligar frontend aos contratos OpenAPI; migrar cópia saneada da base legada em homologação; provar conciliação, retenção, backup/restauração, observabilidade e performance com volume representativo. Só após esses gates e nova regressão em homologação considerar liberação de produção.

Comandos reprodutíveis e configuração estão em `backend/README.md`. O script MySQL de teste cria schema novo, não reutiliza produção e desliga sua instância no final. Nenhuma migration foi executada em produção nesta auditoria.
