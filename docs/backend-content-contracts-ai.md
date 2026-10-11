# Conteúdo, contratos e assistente — tarefa 47

## Publicação

`POST /api/admin/content` (ADMIN) publica versão imutável de `business`, `team`, `history`, `reputation`, `partners`, `social-campaigns`, `terms`, `privacy` ou `faq`. Envie `slug`, `version`, `title`, `body` e `source` (URL da fonte aprovada). `business.body` exige nome empresarial, CNPJ numérico com dígitos verificadores, endereço físico, e-mail e canais; `faq.body.items` contém perguntas/respostas; os demais usam `body.text`. Não há seed de identidade ou reputação. A versão mais recente por slug sai em `GET /api/content/{slug}`; inexistente retorna 404. Publicar outra versão não altera a anterior.

## Contratação

`POST /api/orders/quote` e `POST /api/subscriptions/summary` retornam `contract`/sumário com versões atuais de `business`, `terms`, `privacy`, dados da oferta, total em decimal e `offerHash`. Enquanto faltar uma dessas publicações, respondem 503. `POST /api/orders/checkout` e `POST /api/subscriptions` exigem `acceptance: { offerHash, accepted: true }`; nova cotação ou publicação invalida hash anterior. O pedido grava snapshot em `pedido_contratos` na transação do checkout, consultável pelo proprietário em `GET /api/orders/{orderId}/receipt`. A assinatura inclui `legal` no `contrato_snapshot` já existente, consultável pelo titular em `GET /api/subscriptions/{subscriptionId}`. Pedidos antigos não recebem aceite fictício e não possuem recibo novo. Confirmação imediata da aceitação é o ID e estado retornados no 201; aprovação financeira permanece separada.

O frontend ainda precisa destacar os dados oficiais, características completas, pagamento/entrega/restrições e apresentar o sumário antes do botão de aceite. O backend fornece cotação e snapshots, mas o fluxo visual não está validado. O corpo da oferta avulsa contém as linhas de preço/benefícios; detalhes de sessão/filme/entrega devem ser completados antes de alegar atendimento integral da RN25. Métodos de pagamento disponíveis dependem de tokenização/provider real, consultáveis na rota própria. Conteúdo aprovado real, provider e MySQL `_test` são requisitos de ativação.

## IA

`POST /api/assistant/messages` é CLIENTE e devolve `identity: "IA"` e `handoffPath`. Provider padrão ausente devolve `available: false` e texto de encaminhamento, sem fingir resposta. O adaptador recebe somente a dúvida textual, sem identidade, histórico, ferramenta, SQL ou capacidade de operação financeira. As rotas da IA têm limite dedicado por IP e identidade. `POST /api/assistant/handoff` abre solicitação no serviço humano existente, com o prazo/histórico da tarefa 46. Nenhum conteúdo externo ou mensagem do usuário altera autorização do servidor. Não há provider real configurado nem política operacional aprovada de retenção/transmissão para ativá-lo.

## Implantação e verificação

Migration `20261011_28_content_contracts.sql` acrescenta publicações versionadas e snapshot de pedido. Não aplicada nesta rodada. Aplicar somente após migrations anteriores, em banco isolado e com ledger íntegro. `npm test`: 218/218; `npm run validate:openapi`: válido; `npm run test:integration`: 3 suítes puladas por ausência de `TEST_DB_*`/banco `_test`. Esses testes locais não comprovam DDL, FK, concorrência nem fluxo HTTP com MySQL real.
