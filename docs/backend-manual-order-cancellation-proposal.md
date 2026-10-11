# Proposta de contrato — cancelamento manual de pedido

**Estado em 11/10/2026:** decisão de produto **aprovada somente para esta etapa**: o titular pode cancelar pedido `AGUARDANDO_PAGAMENTO`, sem ingresso emitido e sem cobrança despachada ou captura incerta. `POST /api/orders/{orderId}/cancel` foi implementado com `Idempotency-Key`, resposta mínima `{orderId,status:"CANCELADO"}`, 404 para pedido inexistente/alheio e 409 `ORDER_CANCEL_CONFLICT` para estado inelegível. Intenção `PREPARADA` é neutralizada sob lock antes do despacho; a transação também libera reservas e preserva histórico. Não há chamada ao gateway nem criação de reembolso. As demais propostas e decisões das seções 2–3 continuam **pendentes**; em especial, não foi aprovada a sugestão de cancelar com intenção `ENVIADA`/captura incerta nem validada a regra de sete dias.

## 1. Regras já documentadas e evidência atual

| Tema | Contrato existente |
| --- | --- |
| Checkout | `POST /api/orders/checkout` cria pedido `AGUARDANDO_PAGAMENTO` e reservas por 15 minutos na mesma transação; o cliente não define preço nem estado. Repetição da chave de checkout com o mesmo corpo devolve o mesmo pedido. [Checkout](backend-checkout.md). |
| Expiração | O job cancela pedido avulso não pago após o prazo e libera assento, estoque e cupom na mesma transação. Aprovação após vencimento/cancelamento registra pagamento para revisão financeira, sem conceder direito. [Checkout](backend-checkout.md), [pagamentos](backend-payments.md). |
| Cobrança | A intenção é persistida antes do despacho externo; timeout pode significar captura incerta. O mesmo pagamento não é despachado de novo: consulta/conciliação determina o resultado. Webhook duplicado não repete a aprovação. [Pagamentos](backend-payments.md). |
| Assento e estoque | Ocupação ativa é separada do item histórico. `releaseCancelled` exige pedido `CANCELADO` e impede liberação enquanto houver ticket `GERADO` ou `UTILIZADO`. Reserva de estoque `ATIVA` pode ser `LIBERADA` uma vez; estoque já `CONSUMIDO` requer compensação distinta. [Assentos](backend-seat-occupancy.md), [estoque](backend-inventory.md). |
| Pedido pago | O pagamento aprovado confirma reservas e emite tickets na mesma transação. Reembolso é solicitado pela rota do pagamento; o recebimento é confirmado antes do despacho externo. Somente confirmação do provider marca estorno confirmado. A compensação de direitos e tickets ainda está `PENDENTE`. [Tickets](backend-tickets.md), [reembolsos](backend-refunds.md). |
| Estado da validação | A rota de cancelamento manual não existe; `POST /api/orders/{id}/cancel` retornou 404 ao titular e a outro cliente. Em MySQL isolado, outro cliente não leu pedido/tickets nem pediu reembolso; expiração repetida não duplicou efeitos; corrida expiração × aprovação deixou pedido `CANCELADO`, pagamento `APROVADO` para revisão e nenhum ticket. Pedido pago recebeu solicitação idempotente de reembolso, mas permaneceu `PAGO` com ticket `UTILIZADO`. Gateway HMAC era fixture local. [Cobertura](backend-coverage.md), [handoff](backend-handoff.md), [relatório final](../minidocs/CineAstra-Codex-Otimizado/docs/codex/RELATORIO-FINAL.md). |

O [documento de prompts](CineAstra-prompts-backend.md) prevê uma ação `/cancel` e exige cancelar/revender sem apagar histórico. Ele não define elegibilidade, resposta HTTP ou o que fazer com cobrança já despachada. O comportamento de sete dias descrito em `backend-refunds.md` usa a data do pedido; sua adequação jurídica, marco inicial e aplicação a ingresso já utilizado **não foram validados** nesta proposta.

## 2. Contrato proposto, sujeito às decisões da seção 3

### Elegibilidade e resposta

| Estado do pedido no instante do lock | Proposta para solicitação do titular |
| --- | --- |
| `AGUARDANDO_PAGAMENTO`, reserva ainda ativa, sem ticket | Aceitar cancelamento manual. Alterar para `CANCELADO` e liberar reservas na mesma transação; responder com estado do pedido e indicação separada de que a situação da cobrança pode exigir conciliação. |
| `AGUARDANDO_PAGAMENTO`, prazo já vencido | Aplicar o mesmo resultado do job de expiração; a disputa entre job e solicitação deve produzir uma única transição e um único conjunto de liberações. |
| `EM_ANDAMENTO` | Não oferecer ao cliente: estado transitório interno do checkout. Uma tentativa deve falhar sem alterar dados. |
| `CANCELADO` | Repetir a solicitação devolve o resultado persistido, sem liberar novamente nem criar nova intenção financeira. |
| `PAGO` ou `FINALIZADO` | Não converter imediatamente em `CANCELADO` nem liberar assento/estoque. Encaminhar o titular ao processo de reembolso existente e informar que recebimento não equivale a estorno nem revogação de direitos. |

O candidato de contrato HTTP é uma ação de domínio `POST /api/orders/{orderId}/cancel`, autenticada como `CLIENTE`, com chave de idempotência própria. **É somente proposta:** URL, corpo, códigos, DTO e OpenAPI dependem de aprovação. A consulta deve devolver 404 para pedido alheio, sem revelar sua existência. O cliente não pode informar status financeiro, valor, assento a liberar ou resultado do gateway.

### Cobrança em processamento

Proposta: aceitar o cancelamento local de um pedido pendente mesmo quando a intenção estiver `PREPARADA` ou `ENVIADA` e o pagamento `PENDENTE`, pois a captura externa pode ser incerta. A resposta deve distinguir **pedido cancelado** de **cobrança resolvida**; nunca afirmar que o gateway cancelou ou estornou a cobrança. Após commit, uma tarefa de conciliação consulta o provider por chave/transação. Se o provider suportar cancelamento da cobrança, a chamada é feita fora da transação com chave estável; seu resultado também precisa de confirmação. Se não suportar, a pendência financeira continua visível para operação.

Um webhook autenticado que confirme pagamento após o cancelamento mantém `pedidos.status=CANCELADO`, registra o pagamento `APROVADO` e o evento de revisão financeira, sem reocupar assento, consumir estoque/cupom ou emitir ticket. A decisão de abrir automaticamente solicitação de estorno nesse caso está pendente. Nenhuma nova tentativa de cobrança deve ser criada para o pedido cancelado.

### Transação, recursos e concorrência

O cancelamento local proposto deve bloquear o pedido e as obrigações financeiras relevantes, confirmar que não há ticket vivo, mudar o estado e liberar ocupação ativa, reservas `ATIVA` de estoque e cupom `RESERVADO` **em uma transação** com auditoria/outbox. Preservar `itens_pedido`, histórico do pagamento e snapshots. Não usar `COMPENSAR` para estoque apenas reservado; não liberar cadeira de ingresso pago ou utilizado. Uma falha em qualquer liberação reverte a transação inteira.

A implementação deve estabelecer uma ordem única de locks com webhook, job de expiração e checkout, e tratar deadlock com retry seguro da transação. Se a confirmação do pagamento vencer a corrida, o pedido fica `PAGO` com direitos emitidos e a solicitação manual segue o processo de reembolso, sem liberação imediata. Se o cancelamento vencer, a confirmação tardia segue revisão financeira sem direitos. Nunca permitir pedido `CANCELADO` com ticket recém-emitido ou duas ocupações ativas para o mesmo assento.

### Pedido pago, reembolso e ingresso utilizado

Para `PAGO`/`FINALIZADO`, manter o pedido financeiro e usar `POST /api/payments/{id}/refunds` para registrar a pretensão do titular. `202/RECEBIDA` confirma **somente o recebimento**. Nenhuma revenda de assento, reposição de estoque ou revogação de ticket decorre automaticamente dessa resposta. O fluxo de compensação após estorno confirmado precisa ser especificado e implementado separadamente, inclusive sua atomicidade e idempotência.

Se o ingresso já estiver `UTILIZADO`, ou se houve saída/reentrada, a proposta é impedir liberação automática do assento e exigir decisão explícita conforme motivo, consumo e Termos aplicáveis. Não presumir que o prazo de sete dias autoriza ou impede estorno nesse caso. Um ticket `GERADO` ainda não utilizado também exige decisão sobre quando revogar e quando permitir revenda; a garantia de ocupação não deve ser removida antes da revogação segura.

### Idempotência e autorização

Proposta: exigir `Idempotency-Key` distinta da chave de checkout/pagamento e persistir a associação `(titular, pedido, chave, conteúdo, resultado)`. Repetição idêntica devolve o mesmo recibo; reutilização da chave com outro pedido ou conteúdo retorna 409. Chaves diferentes para pedido já `CANCELADO` não repetem liberação, auditoria ou operação no provider. A autorização deve revalidar conta e propriedade sob a transação; outro CLIENTE recebe 404. ADMIN não deve cancelar pela rota do titular sem contrato operacional próprio. Logs e resposta não incluem token de pagamento nem código de ticket.

## 3. Decisões originais e pendências após a aprovação parcial

1. **Produto:** o titular pode cancelar qualquer checkout `AGUARDANDO_PAGAMENTO` antes dos 15 minutos, inclusive após despacho ao gateway? Recomendação desta proposta: sim, com situação financeira separada e conciliação obrigatória.
2. **Financeiro/provider:** existe operação de cancelamento da cobrança e consulta confiável por chave? Definir prazo de conciliação, responsável pela fila de revisão e comportamento quando o provider não responde. Não tratar timeout como cancelamento confirmado.
3. **Financeiro/jurídico:** aprovação tardia de pedido cancelado deve abrir estorno automaticamente ou requer revisão? Definir motivo, valor, prazo, comunicação ao cliente e como evitar solicitações de estorno duplicadas.
4. **Jurídico/produto:** confirmar marco inicial, abrangência e condições do prazo de sete dias descrito no módulo de reembolso; definir tratamento de ingresso já utilizado, sessão iniciada/encerrada, combo retirado e streaming consumido. A validação anterior não homologou essa regra.
5. **Produto/operação:** em pedido pago com ticket `GERADO`, decidir quando revogar direito e liberar assento para revenda; com ticket `UTILIZADO`, decidir compensação sem recriar estoque/assento indevidamente. Definir também cupom e benefícios após estorno parcial.
6. **Contrato HTTP/dados:** aprovar URL, corpo, códigos e DTO da ação; decidir se o recibo precisa de estado e chave persistidos em estrutura nova. Qualquer migration necessária será proposta separadamente após a decisão.

## 4. Aceite futuro do contrato

Após aprovação, testar em MySQL isolado: titular/alheio; pedido sem intenção, intenção `PREPARADA`, `ENVIADA` e captura incerta; retry com mesma e outra chave; corrida com job e webhook nos dois ordenamentos; rollback de liberação de assento/estoque/cupom; aprovação tardia duplicada; pedido pago com ticket `GERADO` e `UTILIZADO`; reembolso pendente/confirmado/falho. Gateway real ou sandbox autenticado requer aceite separado. Nenhum desses casos de **cancelamento manual** foi aprovado pela validação anterior.
