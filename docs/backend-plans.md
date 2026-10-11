# Planos e contratação — tarefa 38

## Contrato HTTP

- Público: `GET /api/plans`, `GET /api/plans/{planId}`. Somente ofertas ativas com preço mensal e anual publicados.
- ADMIN com sessão e 2FA: `GET/POST /api/admin/plans`, `GET/PATCH/DELETE /api/admin/plans/{planId}`. `DELETE` arquiva; custo dos benefícios aparece só na vista administrativa. Criar inicia inativo. A publicação de preços/custos e descontos por categoria permanece em `/api/admin/pricing/plans/{planId}/publish` e `/api/admin/pricing/plans/{planId}/benefits/{category}`.
- CLIENTE: `POST /api/subscriptions` com `Idempotency-Key`, `planId`, `period` (`MENSAL`/`ANUAL`), `autoRenew`. Retorna contrato `PENDENTE`, `chargeId` e `paymentPath`. `GET /api/subscriptions/me` e `GET /api/subscriptions/{subscriptionId}` são próprios. O cancelamento existente segue em `POST /api/subscriptions/{subscriptionId}/cancel`.
- A cobrança usa `POST /api/payments` com `chargeId`, `methodId` e outra chave idempotente. Somente webhook autenticado ou consulta ao provider que confirme aprovação exata ativa o contrato na transação financeira. Sem provider, pagamento responde 503; nenhum direito é concedido.
- `POST /api/subscriptions/{subscriptionId}/benefits/combo/redeem` requer titular, contrato ativo/vigente, cobrança paga e combo mensal no snapshot. Retorna `SOLICITADO`. A UNIQUE de assinatura/competência impede segundo pedido, inclusive concorrente. Entrega física e baixa de estoque exigem processo operacional futuro; `SOLICITADO` não significa retirado.

## Dados e regras

`20261010_22_plan_contracts.sql` adiciona acesso ao catálogo, combo elegível e snapshot imutável de oferta/preço/limite/descontos na assinatura, além de `beneficio_resgates`. Plano ativo exige custos cadastrados, ambos preços positivos e preço que deixe ao menos 20% da receita acima do custo dos benefícios (`preço * 0,8 >= custo`). A elegibilidade do combo é declarada pelo ADMIN no plano porque o schema de `combos` não contém porte; selecionar `id_combo_medio` equivale a afirmar que aquele cadastro é o combo médio. Idade verificada `ATE_16` ainda fica bloqueada neste fluxo até autorização específica do responsável.

O contrato congela benefícios e desconto para assinaturas novas; a cotação usa o snapshot após pagamento. Assinaturas legadas sem snapshot mantêm a regra de competência paga do motor anterior. O lock na linha do titular serializa contratações simultâneas. `BIGINT` volta como string e dinheiro DECIMAL é comparado em centavos inteiros.

## Aceite pendente

Migration 22 não foi aplicada: falta MySQL `_test` isolado e configuração `TEST_DB_*`. Conferir planos legados com `limite_membros` fora de 1–100 antes do CHECK, FK do combo, JSON, UNIQUE, corrida de contratação e resgate no MySQL. Falta provider real para comprovar webhook/cobrança e fluxo de entrega do combo. Renovação efetiva, Pix Automático, débito automático e rateio são da tarefa 39/40; `autoRenew` apenas registra a escolha nesta etapa. Acesso ao catálogo por assinatura depende da tarefa 41.
