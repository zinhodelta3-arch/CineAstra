# CineAstra — matriz de cobertura e contratos (Prompt 00)

## Suporte: disputa de atribuição e resposta — 11/10/2026

Dois ADMINs autenticados foram sincronizados antes do lock SQL por barreira de teste em HTTP/MySQL temporário: atribuições concorrentes resultaram em 200/409, com único responsável/auditoria; somente ele respondeu. Resposta simultânea do responsável e tentativa de troca resultaram em 201/409, com autoria/histórico corretos e nenhuma mensagem rejeitada gravada. `support.test.js`: 6/6; runner MySQL isolado: 28/28, zero skips. A segunda atribuição antes da correção sobrescrevia silenciosamente (200/200). Reatribuição explícita não está definida no contrato e não foi implementada.

## Suporte HTTP/MySQL: autorização e projeções — 11/10/2026

`identity.mysql.test.js` confirmou em MySQL temporário que dois CLIENTES listam, consultam e escrevem apenas nas próprias solicitações; acesso a detalhe, histórico, escrita e fechamento alheios retorna 404. Corpos com IDs extras de cliente, autor ou solicitação são rejeitados com 422; autoria e vínculo persistidos vêm da sessão e da rota. Listas/detalhes não incluem texto de mensagem nem campos SQL internos, e a listagem de um cliente não contém assunto ou mensagem do outro. ADMIN pode consultar fila/detalhe/histórico antes da atribuição; só o ADMIN atribuído escreve, conforme contrato existente. `scripts/runIsolatedMysqlTests.ps1`: 27/27, zero skips; `node --test tests/support.test.js`: 6/6. Não se testou provider externo nem toda a concorrência de live da tarefa 46.

## Upgrade isolado da migration 30 — 11/10/2026

`identity.mysql.test.js` aplica as migrations até 29, cria pedidos pendentes/pagos/cancelados com pagamento e reservas sintéticas, aplica a 30 via `applyPlan` e a executa novamente. Ledger `APPLIED` único e checksum correto; pedidos, itens, intenção, pagamento e histórico permanecem ligados. Após o upgrade, a rota manual libera assento, estoque e cupom na mesma transação; falha injetada depois das três liberações restaura todos os estados e não grava recibo. `scripts/runIsolatedMysqlTests.ps1`: 26/26, zero skips. Não houve upgrade de dados reais nem gateway externo.

## Cancelamento manual aprovado parcialmente — 11/10/2026

| Escopo | Evidência atual | Limite |
| --- | --- | --- |
| Titular CLIENTE, 404 alheio, chave repetida/conflitante, 409 pago/ENVIADA, `PREPARADA` neutralizada, revenda, concorrência com despacho/expiração e rollback de liberação | `identity.mysql.test.js` em MySQL 8.0 temporário: 25/25, zero skips; `checkout.test.js` e regressões de pagamento/pedido/assento: 19/19; OpenAPI válido | Estoque/cupom no cancelamento verificados por teste de serviço; não houve gateway externo nem upgrade de base legada. Captura incerta é recusada pelo estado `ENVIADA`, sem prova com provider real. |

Os registros abaixo são históricos da validação anterior, quando a rota manual ainda não existia. A decisão atual e as pendências estão em [proposta](backend-manual-order-cancellation-proposal.md).

## Auditoria de cancelamento solicitado pelo cliente — 11/10/2026

| Verificação | Resultado em banco isolado | Lacuna |
| --- | --- | --- |
| Cancelamento antecipado pelo titular | Não verificado: `POST /api/orders/{id}/cancel` retorna 404 também ao titular; rota e regra não constam do contrato | Definir estados elegíveis, momento limite, efeito sobre pagamento já despachado e idempotência antes de implementar |
| Propriedade | Outro CLIENTE recebe 404 na consulta do pedido e dos tickets e no pedido de reembolso do pagamento | Não existe endpoint de cancelamento manual onde provar IDOR dessa ação |
| Expiração e liberação | Job cancela pedido vencido, libera assento e permite revenda; segunda execução retorna zero cancelamentos | Não prova cancelamento antes do prazo a pedido do cliente |
| Corrida expiração × aprovação | Pedido vencido termina CANCELADO, pagamento APROVADO para revisão e zero tickets/ocupações ativas | Gateway externo e suas regras de desfazimento não testados |
| Pedido pago | Titular recebe 202 para arrependimento dentro de sete dias; retry com a mesma chave devolve o mesmo ID; pedido permanece PAGO e ticket UTILIZADO | Estorno externo não executado; compensação/revogação de ticket segue PENDENTE |

Evidência: `identity.mysql.test.js`, `runIsolatedMysqlTests.ps1` 25/25 sem skips; `node --test tests/refund.test.js` 7/7. Nenhuma rota, migration ou OpenAPI alterada.

## Verificação isolada do fluxo de ingresso — 11/10/2026

| Requisito | Entrega / limite | Evidência | Pendência |
| --- | --- | --- | --- |
| RF10–RF15, RF34/RF41, RN04 | Jornada HTTP/MySQL de pedido, reserva exclusiva, cancelamento por expiração, revenda, aprovação duplicada, ticket único e consumo único aprovada em schema temporário | `runIsolatedMysqlTests.ps1`: 25/25, zero skips; cenário integrado em `identity.mysql.test.js`; testes locais relacionados 22/22 | Gateway e webhook externos reais, compra/consumo pelo frontend, cancelamento solicitado pelo usuário e homologação com dados legados não verificados |

## Atualização tarefa 51 — 11/10/2026

| Requisito | Entrega / limite | Evidência | Pendência |
| --- | --- | --- | --- |
| RF01–RF46 / RN01–RN26 / RNF | Auditoria de backend e contratos entregue; não há aceite de produto em produção | 222/222 testes locais; 24/24 MySQL isolados; OpenAPI 291 operações; plano 169 statements; `npm audit --omit=dev` 0 avisos nesta data; relatório final | Integrações reais, menor/meia, frontend, upgrade legado, carga e operação/infra exigem homologação; ver relatório |

## Atualização tarefa 50 — 11/10/2026

| Requisito | Entrega / limite | Evidência | Pendência |
| --- | --- | --- | --- |
| RF10–RF15 / RN comerciais | Assento, estoque e cupom de último uso; revenda histórica, ticket e aprovação tardia/duplicada verificados em MySQL isolado | `identity.mysql.test.js` com migração do baseline, locks/UNIQUE e webhook de fixture; 24/24 integração | Gateway sandbox/real e conciliação externa não homologados |
| RF16–RF20 | Rateio, renovação e direito streaming de participante com cota paga/suspensa verificados em MySQL; opções de pagamento continuam nos módulos existentes | Suíte MySQL, `subscriptionBilling.test.js`, `streaming.test.js`, `payment.test.js`; 222/222 locais | Provedor de mídia privada, mandato/débito automático e aceites externos reais pendentes |

## Atualização tarefa 49 — 11/10/2026

| Requisito | Entrega / limite | Evidência | Pendência |
| --- | --- | --- | --- |
| RF01–RF09 / RNF segurança | Regressão das rotas existentes de identidade/cadastros e consumidores; nenhum contrato HTTP alterado | 222 testes locais, OpenAPI válido; fixture SQL corrigida para migração ordenada e cotação com conteúdo publicado | 3 suítes MySQL puladas sem banco `_test` isolado; validar locks, FK e UNIQUE reais |

## Atualização tarefa 46 — 11/10/2026

| Requisito | Entrega / limite | Evidência | Pendência |
| --- | --- | --- | --- |
| RF22 suporte | CLIENTE só próprio; ADMIN atribui, responde e resolve; histórico append-only e notificação | 11 rotas `/api/support` e `/api/admin/support`; `support.test.js`, OpenAPI | FAQ na tarefa 47; migration 27 e IDOR HTTP/MySQL real pendentes |
| RN03 atendimento/reembolso | Prazo de manifestação de cinco dias; reembolso preserva rotas/serviço 31 | `prazo_resposta_em`, `primeira_resposta_em`; `POST /api/payments/{id}/refunds` existente | Operação real da fila e gateway/estorno ainda dependem de infraestrutura/provider |
| RN13 excesso/limite | Live único por solicitação, até dez minutos; expiração volta à fila ABERTO | `suporte_atendimentos`, job e testes de expiração | CHECK/UNIQUE e corrida real em MySQL `_test` pendentes |

## Atualização tarefa 45 — 11/10/2026

| Requisito | Entrega / limite | Evidência | Pendência |
| --- | --- | --- | --- |
| V4 newsletter: worker | Claim `SKIP LOCKED`, revalidação pré-envio, até 5 tentativas com backoff/lease e fencing; conclusão por fila terminal | `newsletterDelivery.test.js`, job e provider injetável | Locks/crash reais em MySQL `_test`; provedor real com idempotência/conciliação |
| V4 newsletter: bounce/reclamação | Webhook bruto verificado pelo provider; bloqueio persistente e cancelamento de pendências | `POST /api/newsletter/webhooks/{provider}`, migration 26, OpenAPI | Assinatura real do provider e migration 26 não aplicada |

## Atualização tarefa 44 — 11/10/2026

| Requisito | Entrega / limite | Evidência | Pendência |
| --- | --- | --- | --- |
| V4 newsletter: categorias e campanhas | ADMIN gerencia categorias e rascunhos; agenda/cancela campanha, HTML sanitizado e texto simples | 10 rotas `/api/admin/newsletter`; `newsletterCampaign.test.js` e OpenAPI | Seleção real/locks/UNIQUE em MySQL `_test` pendentes; worker/provider na tarefa 45 |

## Atualização tarefa 43 — 10/10/2026

| Requisito | Entrega / limite | Evidência |
| --- | --- | --- |
| V4 newsletter: preferências | Token `GESTAO` específico, leitura sem consumo e categorias independentes; ausência=recusa | `/api/newsletter/preferences/view`, `PATCH /api/newsletter/preferences`; testes de finalidade e troca |
| V4 newsletter: descadastro | Token `DESCADASTRO` só opt-out, fila pendente/falha cancelada, tokens invalidados, CHECK de datas preservada | `POST /api/newsletter/unsubscribe`; teste de opt-out após enfileirar |
| V4 newsletter: reinscrição | Novo aceite/categorias e nova confirmação, sem reativação por e-mail duplicado | `POST /api/newsletter/resubscribe`; migration 25 não aplicada; provider/MySQL `_test` pendentes |

## Atualização tarefa 42 — 10/10/2026

| Requisito | Entrega / limite | Evidência |
| --- | --- | --- |
| V4 newsletter: inscrição | Aceite expresso/versionado e categorias independentes; `PENDENTE` até confirmação | `GET /api/newsletter/options`, `POST /api/newsletter/subscribe`; `newsletter.test.js` |
| V4 newsletter: confirmação | Token aleatório de 32 bytes, hash SHA-256 binário, finalidade, prazo de 24 h, uso único e lock inscrito→token | `POST /api/newsletter/confirm`; testes de replay/expiração/enumeração |
| Aceite externo | Sem provider de e-mail ou MySQL `_test` não há prova de entrega/concorrência real | Provider padrão 503; migration V4 existente não aplicada nesta rodada; [limites](backend-newsletter.md) |

## Atualização tarefa 41 — 10/10/2026

| Requisito | Entrega / limite | Evidência |
| --- | --- | --- |
| RF16 | Play por filme mediante benefício de catálogo, assinatura vigente e titular/participante ativo | `POST /api/streaming/films/{filmId}/play`; `streaming.test.js` |
| RN12 | Suspensão e cota do pagador revalidadas; compra avulsa própria continua acessível | Testes de suspensão individual e compra paga; MySQL `_test` pendente |
| RN22 | Idade verificada e classificação do filme a cada play | Teste de idade, revalidação após assinatura de URL; provider privado real pendente |

## Atualização tarefa 40 — 10/10/2026

| Requisito | Entrega / limite | Evidência |
| --- | --- | --- |
| RN12 cobrança | Ciclos mensal/anual e cotas únicos; aviso dia 1, suspensão individual dia 8, cancelamento no dia 31; 2% + 1% pro rata + IPCA/IBGE publicado | Migration 24; `subscriptionBilling.test.js`; cobrança própria e pagamento pelo total atualizado |
| RN26 cessação | Cancelamento desliga renovação e nova emissão; pagamento tardio não reativa cancelada | Serviço transacional, teste de corrida/cancelamento; gateway/mandato real pendente |
| Aceite | Backend e contrato OpenAPI integrados; SQL e conciliação externos ainda não aceitos | MySQL `_test`/`TEST_DB_*` e gateway real ausentes; [detalhes](backend-subscription-billing.md) |

## Atualização tarefa 15 — 08/10/2026

| Requisito | Entrega / limite | Evidência |
| --- | --- | --- |
| RNF05 | Upload de imagem limitado e reprocessado, endpoint de prévia privada; exibição visual frontend não alterada | imageUpload.test.js; POST/GET/DELETE /api/admin/uploads/images; OpenAPI multipart |
| RNF17 (upload) | ADMIN/2FA, rate limit, conteúdo real, memória/pixels/dimensões/concorrência limitados, paths internos, cleanup, sem fetch | 5 grupos novos; regressão 64/64; decoder, filesystem e abort HTTP reais |
| Limites operacionais | Staging local, instância única, quota 200/TTL 24h; promoção à galeria futura | Sem migration; produção exige volume privado; aceite MySQL da 14 permanece pendente |

Detalhes e fontes oficiais da revisão de dependências: [backend-image-uploads.md](backend-image-uploads.md).

## Atualização tarefa 14 — 08/10/2026

| Requisito | Entrega e limite | Evidência |
| --- | --- | --- |
| RF45 — filmes/gêneros | CRUD ADMIN, associação, arquivamento preserva vínculos; outros cadastros não pertencem à tarefa | `catalog.test.js`, 18 operações OpenAPI |
| RF08 — parcial | Catálogo público, filtros, metadados e preços exatos; sem aluguel/compra/playback | Projeção sem URL privada e validação de preços |
| Segurança/contrato global | ADMIN + 2FA, sessão atual, campos permitidos, SQL parametrizado, auditoria/outbox transacional | Suíte isolada + regressão total 59 testes aprovados |
| Banco real | Migration explícita status gênero; cenário de integração preparado | BLOQUEADO: 2 suítes MySQL puladas, `TEST_DB_*`/opt-in ausentes; nenhuma migration aplicada |

Detalhes/limites: [backend-catalog.md](backend-catalog.md). Matrizes abaixo são históricas; esta atualização prevalece apenas para o catálogo da tarefa 14.

Snapshot diagnóstico:06/10/2026. Atualização Prompt02:08/10/2026. **Infraestrutura e identidade integradas, com pendências reais de MySQL/providers/privacidade.** Matrizes originais preservam planejamento00; as seções Prompt01/Prompt02 ao fim atualizam somente seus respectivos escopos. Fontes/achados: [arquitetura](backend-architecture-plan.md); PK/FK/ENUM/CHECK/índices: [inventário](backend-schema-inventory.md); execução e bloqueios: [handoff](backend-handoff.md).

## DECISÕES COMPARTILHADAS

Prefixo `/api`, OpenAPI 3.0.3 única no Prompt 01, DTOs `{success,data,requestId}` e erros `{success:false,code,message,requestId,details?}`; IDs strings, BRL decimal string, UTC técnico/calendário America/Sao_Paulo a confirmar; bearer JWT revogável; deny by default com perfil **e** dono/vínculo; preço só servidor; estados financeiros/operacionais separados. SQL de domínio nos models, regras/transações nos services, conexão compartilhada, efeitos externos fora dos locks, idempotência/auditoria/outbox persistentes. Logs HTTP 90 dias não substituem auditoria financeira. Demais decisões obrigatórias e migrations propostas M00–M16 estão no plano.

Legenda: **A** ausente na API; **P** componente parcial existente; **I** incompatibilidade constatada; **F** funcional isolado com execução nesta rodada; **FE/INF** responsabilidade frontend/infra, não dispensada. Perfil: C=CLIENTE, F=FORNECEDOR, S=SUPERVISOR, L=COLABORADOR, AD=ADMIN. `próprio` e `vinculado` são obrigatórios mesmo quando o perfil permite a operação. Testes da matriz são **critérios futuros, não executados**.

## RF -> fluxo -> entidade -> endpoint -> perfil/escopo -> teste

| RF / estado atual | Fluxo / entidade existente ou proposta | Endpoint planejado (prefixo /api) | Perfil + escopo | Dono / teste de aceite |
| --- | --- | --- | --- | --- |
| RF01 A | Cadastro+termos+idade/responsável; usuarios, consentimentos/verificações/vínculos novos | POST /auth/register (alias /auth/registrar anunciado) | Público cria somente C, responsável comprovado | 02; role injection, termos ausentes, idade provider indisponível, compra menor |
| RF02 A/I | Login todos, conta interna criada AD; usuarios+sessões novas | POST /auth/login; POST /users | Público login; AD cadastro interno | 02; conta bloqueada, perfil atual, ADMIN uppercase, sem bootstrap fixo |
| RF03 A | Recuperação/reset; recuperacao_senha | POST /auth/password/forgot, /auth/password/reset | Público com token válido/antiabuso | 02; resposta genérica, hash expirado/consumido, reset concorrente |
| RF04 P | Enrollment/desafio 2FA; autenticacao_2fa+desafios | POST /auth/2fa/enroll, /verify, /challenge; POST /auth/2fa/disable | Próprio reautenticado; AD/S obrigatórios | 02; sem JWT pleno antes de fator, replay/tentativas/segredo protegido |
| RF05 A | Perfil/exportação/exclusão; usuarios+retenção | GET/PATCH/DELETE /users/me; POST /users/me/export | Próprio; AD política auditada | 02; IDOR, anonimização preserva pagamentos/FKs |
| RF06 A | Endereço/contato/método; enderecos,contatos,metodos_pagamento | GET/POST /users/me/addresses, /contacts, /payment-methods; PATCH/DELETE respectivos /:id | Próprio | 02/09; principal concorrente, método alheio, PAN/CVV rejeitados |
| RF07 P FE/I | Preferências pessoais; preferencias_usuario; localStorage existente | GET/PATCH /users/me/preferences | Próprio | 02+FE; modo e preset separados, persistência/contraste/fontes |
| RF08 A | Catálogo+aluguel/compra; filmes,galerias,itens_pedido,acessos_streaming | GET /films, /films/:id; checkout /orders/:id/checkout; GET /streaming/my-accesses; POST /streaming/:id/play | Público catálogo; C dono do direito | 03/10/11; pagamento pendente/vencimento, ausência URL privada, mídia indisponível |
| RF09 A | Sessões disponíveis por local/data; locais,salas,sessoes | GET /sessions; GET /sessions/:id/available-seats | Público DTO elegível | 04/10; filtros, sala correta, reservado/pago excluídos |
| RF10 A | Ingresso/meia/assento/ticket; pedidos,itens,ocupação/meia novos,tickets | POST /orders; POST /orders/:id/checkout | C dono e idade/responsável/benefício | 08–10; último assento, duas compras, meia elegível, sem ticket antes de pagar |
| RF11 A | Compra insumo/retirada; insumos,estoque,pedido,tickets | POST /orders/:id/items; POST /orders/:id/checkout | C dono/local coerente | 07–10; último insumo, qtd inteira, rollback e retirada total |
| RF12 A | Combo/consumo componentes; combos,combo_itens,pedido,tickets | POST /orders/:id/items; POST /orders/:id/checkout | C dono/local coerente | 06–10; último componente, desconto único, tipo RETIRADA_INSUMO |
| RF13 A | Tickets organizam pedido; itens_pedido,tickets | GET /orders/:id; GET /tickets, /tickets/:id | C dono; staff sessão; AD auditado | 10; item alheio, código opaco, emissão única |
| RF14 A/I | Acompanhamento operacional, separado de financeiro; pedidos+estado operacional novo | GET /orders/:id | C dono; staff vinculado DTO mínimo | 10; agendado/realização/atraso/participação/finalizado sem corromper PAGO |
| RF15 A | Cotação/checkout/cupons; custos/parâmetros/promoções novos,cupons,pedidos | POST /pricing/quotes; POST /orders/:id/checkout | C dono; AD configura parâmetros | 08/10; total cliente rejeitado, teto 25%, concorrência cupom |
| RF16 A | Benefícios/plano+combo mensal; planos,assinaturas+benefícios/resgate novos | GET /plans; POST /subscriptions; POST /subscriptions/:id/benefits/:benefitId/redeem | C titular/participante ativo | 08/12; um resgate competência, acesso catálogo e combo elegível configurados |
| RF17 A | Compartilhamento/convite; convites_plano+participantes | POST /subscriptions/:id/invitations; POST /invitations/:id/accept, /decline | Titular; convidado responde próprio | 12; limite concorrente, convite alheio, aceite único |
| RF18 A | Recorrência/rateio; assinatura_cobrancas,pagamentos+método tokenizado | POST /subscriptions; GET /subscriptions/:id/charges; POST /payments | C titular/pagador da própria cota | 09/12; recorrência capacidade real, rateio exato, timeout/mandato |
| RF19 A | Cancelamento/saída; assinatura,participantes,reembolsos | POST /subscriptions/:id/cancel; POST /subscriptions/:id/members/me/leave | Titular cancela; participante sai próprio | 09/12; cessa futuras cobranças, saída ciclo seguinte/reembolso anual |
| RF20 A | Meios avulsos; metodos_pagamento,pagamentos | POST /payments; GET /payments/:id; POST /payments/webhooks/:provider | C pagador; callback assinatura provider | 09/10; pedido XOR cobrança, método alheio, webhook forjado |
| RF21 A | Backend integrado; provider real pendente | POST /api/assistant/messages; POST /api/assistant/handoff | CLIENTE, identidade IA explícita; só dúvida textual ao adapter | content.test.js; provider real/política de dados pendentes |
| RF22 A | FAQ/suporte; conteúdo versionado,suporte+mensagens | GET /faq; GET/POST /support; POST /support/:id/messages | Público FAQ; C dono; AD atendente | 14; histórico, IDOR, prazo de resposta |
| RF23 A | Eventos/notificações; notificacoes+outbox | GET /notifications/me; PATCH /notifications/:id/read | Todos apenas próprias; criação interna | 05+emissores; evento repetido, leitura alheia, paginação |
| RF24 A | Publicação versionada integrada; conteúdo real pendente | GET /api/content/{slug}; POST /api/admin/content | Público lê; ADMIN publica versões imutáveis | content.test.js; equipe/história/reputação/parcerias/termos oficiais não fornecidos |
| RF25 A | Estoque por local; insumos/equipamentos/movimentações | GET /stock; POST /stock/movements | F próprio/local autorizado; S/L vínculo/função; AD | 06/07; IDOR local, saldo negativo concorrente |
| RF26 A | Cadastros materiais/galerias; insumos,equipamentos | GET/POST /supplies, /equipment; GET/PATCH/DELETE /:id; galeria /supplies/:id/images | F propriedade/local; AD gerência | 06; quantidade não via PATCH livre, referenciado arquiva |
| RF27 A | Logística/envio/recebimento; logistica,transferências | GET/POST /logistics; POST /logistics/:id/send, /receive, /cancel | F próprio; S/L destino vinculado/função | 07; recebimento repetido, origem/destino reais |
| RF28 A | Uso/devolução equipamento/sessão; equipamentos,logistica,movimentações | GET /sessions/:id/equipment; POST /stock/returns | F equipamento próprio+vínculo; S/L local | 06/07/04; status vinculado, restituição uma vez |
| RF29 A | Sessão/adesão supervisor; equipes,adesões novas | GET /sessions; POST /teams/:id/join-requests | S elegível, aprovação de responsável/AD | 04/05; não autoatribuir responsabilidade, escopo sessão |
| RF30 A | Gerência horário/local; sessoes,locais | PATCH /sessions/:id; PATCH /locations/:id | S local/sessão responsável; AD | 04; intervalo 1h entre salas do local, vendas dependentes |
| RF31 A | Estoque a chegar/faltante; solicitação/logística | GET /stock; GET/POST /stock/requests | S local responsável | 07; quantidade XOR item, estado a chegar real |
| RF32 A | Chamados internos; chamados | GET/POST /tasks; PATCH/DELETE /tasks/:id | S sessão responsável, AD; exclusão elegível | 05; não apagar histórico executado, não confundir suporte |
| RF33 A | Funções/atribuição; equipe_membros,chamados | PATCH /teams/:id/members/:memberId; POST /tasks/:id/assign | S responsável/AD | 05; perfil e membro correto, função não autoatribuída |
| RF34 A | Tickets da sessão; tickets,itens,sessão | GET /sessions/:id/tickets | S responsável/AD | 10; tickets de outra sessão negados |
| RF35 A | Entradas/saídas/histórico/atrasos; presença nova | GET /sessions/:id/attendance; POST /tickets/:id/entry, /exit | S responsável; L função; AD | 10; transições presença, reentrada legítima, atraso |
| RF36 A | Cliente vinculado; usuarios,itens,equipes | GET /sessions/:id/customers | S responsável/AD DTO mínimo | 05/10; sem CPF/hash, nenhum cliente global |
| RF37 A/I | Solicitação/convite de equipe; equipe_adesoes | POST /teams/:id/join-requests; POST /team-invitations/:id/accept | L próprio, aprovação S responsável | 05; pendente não membro ativo, convite errado |
| RF38 A | Status de sessão; sessoes/equipe | GET /sessions/:id | L equipe ativa, DTO operacional | 04/05; sessão alheia operacional negada |
| RF39 A | Função/tarefas próprias; equipe_membros,chamados | GET /teams/me; GET /tasks/me | L vínculo/função/atribuição | 05; mudança de função, usuário removido |
| RF40 A | Chamado criar/aceitar/fechar; chamados | POST /tasks; POST /tasks/:id/accept, /close | L sessão/função elegível | 05; dois aceites, fechado não aceita |
| RF41 A | Validar/consumir/entrada/saída/meia; ticket,presença,comprovação | POST /tickets/:id/validate, /consume, /entry, /exit | L/S sessão+função, comprovação mínima | 10; validar não consome, duplo consumo, meia na portaria |
| RF42 A | Clientes da sessão; usuários,itens,equipe | GET /sessions/:id/customers | L ativo na sessão DTO mínimo | 05/10; vínculo aninhado, minimização de dados |
| RF43 A | Estoque/solicitação não planejada; movimentos,solicitações | POST /stock/movements; POST /stock/requests | L local vinculado+função | 07; origem adequada, alerta mínimo, atomicidade |
| RF44 A | Solicitar faltantes; solicitacoes_estoque | GET/POST /stock/requests | L/S local vinculado | 07; XOR, quantidade positiva, id_sessao/local coerentes |
| RF45 A | Cadastros/ações ADMIN permanecem nos módulos de domínio; tarefa 48 não cria bypass | Rotas ADMIN existentes de usuários, catálogo, fornecedores, operações, preço, planos, suporte e conteúdo | Autorização/regras de cada serviço preservadas; reportRoutes é só leitura | Cobertura de cada domínio e SQL `_test` ainda requerem aceite próprio |
| RF46 P/A | Relatórios e logs ADMIN integrados; aceite SQL pendente | GET `/api/admin/reports/finance`, `/social-allocation`, `/api/admin/audit-logs`, `/http-logs`; parâmetros existentes em precificação | report.test.js; capturas/estornos separados, snapshot único, redação/paginação | MySQL `_test` para agregações/índices; lucro líquido não disponível |

## RN -> fluxo -> entidade -> endpoint -> permissão -> teste

| RN / estado | Fluxo e persistência | Endpoint/escopo | Dono / teste ou dependência impeditiva |
| --- | --- | --- | --- |
| RN01 A | Sanção/motivo/evento, usuarios+auditoria | POST /users/:id/sanctions; AD autorizado | 02/14; mudança privilégio revoga sessão, termos/procedimento aprovados |
| RN02 P/I | JWT esqueleto sem escopo/perfil atual | Todos privados; perfil+dono+vínculo | 01/02+todos; RBAC/IDOR/local/equipe/uppercase |
| RN03 A | Reembolso persistido, confirmação e SLA | POST /orders/:id/refunds, /subscriptions/:id/refunds; dono | 09/14; recebido imediatamente sem estorno fictício, prazo 5 dias; revisão jurídica |
| RN04 A | Oferta/cotação/total servidor/snapshot | POST /pricing/quotes, checkout; C próprio | 08/10/FE; clareza encargos, tampering de total |
| RN05 A | Custo/licença+duração aluguel; filme/item snapshot | Quotes/checkout/play; próprio | 08/11; proporcionalidade duração, início pagamento confirmado |
| RN06 A | Custos/benefícios plano/margem | /plans e /subscriptions; AD/C próprio | 08/12; oferta cobre custos e alerta mínimo, custos faltantes |
| RN07 A | Custo local/tempo+exibição/20/markup | Quote ingresso; AD parâmetros | 08; 20 ingressos/10 meias, duração/unidades aprovadas |
| RN08 A | Receita+parceria como custo, venda distinta | Quote insumo; C/AD configuração | 08; C=100 ->160 ->120 a 25%, retorno 20% |
| RN09 A/I | Participação/concordância/ciclo seguinte/rateio | POST /subscriptions/:id/division-changes; titular+aceites | 12; entrada/saída não altera fatura atual, soma cotas exata |
| RN10 A | Combo/composição/desconto no teto | Quote combo; C, AD configuração | 06/08; sem desconto duplo e componentes reais; fórmula quantitativa aprovada |
| RN11 A | Origem física/distância/fórmula/provider | GET /logistics/:id/estimate; F/local vinculado | 07; provider ausente não produz ETA preciso; coord/identidade origem |
| RN12 A/I | Encargos percentual/juros/IPCA e régua individual | Cobranças/checkout/job; pagador da cota | 09/10/12; dia1/8/>30, multa única, direitos pagos preservados, IPCA real |
| RN13 A/I | Fila/sessão suporte/histórico/prazo | /support e mensagens; dono/AD | 14; 10min retorna fila sem fechar, responde prazo 5 dias |
| RN14 Fora do escopo | Salários/operações empresariais não implementados | Nenhum endpoint dessas operações | 14/15; revisão de escopo, relatórios não fazem folha/transferência automática |
| RN15 A | Saldo mínimo/evento dedup de reposição | /stock, /notifications/me; F/S/L vinculados | 07/05; queda até mínimo alerta uma vez, não prometer nunca zerar sem capacidade real |
| RN16 A | Desconto comum/teto/meia alternativa/custo | /pricing/quotes e checkout; C próprio | 08/10; plano+combo+cupom+promo <=25%, meia não cumulativa, não abaixo custo |
| RN17 A | Política 5–10% exposta sem valor fictício | GET `/api/admin/reports/social-allocation` retorna NOT_CALCULABLE | report.test.js: amount NULL | Apuração contábil real de lucro líquido e destinação externa pendentes; folha RN14 fora |
| RN18 A | Alertas vendidos agregados de snapshot; parâmetros ADMIN existentes | `/api/admin/reports/finance`, `/api/pricing` ADMIN | report.test.js e pricing.test.js | MySQL `_test` e cobertura de snapshot legado pendentes |
| RN19 A | Agenda por local/instantes/lock estável | POST/PATCH /sessions; S responsável/AD | 04; concorrência entre salas, fronteiras/meia-noite e 1h |
| RN20 A | Reserva de sessão/espaço pelo usuário, não assento | POST /session-reservations (fluxo proposto); C aprovado | 04; 5h, definição comercial/estrutura ausente; não confundir TTL checkout |
| RN21 A/I | Sessão vinculada/expiração retirada combo | Ticket validate/consume; staff vinculado | 10; até fim+30min, sem sessão associada bloqueia emissão |
| RN22 A | Classificação/idade/acompanhamento | Checkout/play/entrada; C elegível/responsável | 02/04/10/11; idade não autodeclarada, regra vigente oficial antes de algoritmo |
| RN23 A/I | Base meia/benefício/cota/evidência compra+portaria | Sessões/quotes/checkout/consume; C/staff | 08/10; saldo transacional visível, >=40%, idosos/regimes separados; revisão base jurídica |
| RN24 A | Verificação e responsável/supervisão/autorizações | Register, parental controls, checkout/assinatura/play | 02+callers+FE; sem provider não atesta idade; dados não publicidade; enquadramento jurídico |
| RN25 A | Backend parcial: aceite/snapshot/recibo integrados | /api/content, /api/orders/quote e checkout/receipt, /api/subscriptions/summary e contratação | checkout.test.js, plan.test.js, content.test.js; OpenAPI | Dados reais, detalhes completos da oferta e exibição destacada no frontend; MySQL `_test` pendente |
| RN26 A | Cancelar/cessar cobrança/reembolso/ciclo | POST /subscriptions/:id/cancel, /refunds; titular/dono | 09/12; 7 dias integral e anual proporcional conforme termos, corrida renovação |

## RNF -> fluxo -> entidade/área -> endpoint/escopo -> teste

| RNF / estado | Área/fluxo/evidência atual | Endpoint ou tela/escopo | Dono / evidência de aceite necessária |
| --- | --- | --- | --- |
| RNF01 Não medido | Página <=2s; imagens/fontes externas e mocks | Home e páginas públicas | FE/INF +01/15; medir rede/cache/carga definida, não teste unitário |
| RNF02 A | Operação <=10s ou feedback; timeouts reais ausentes | Todas APIs/jobs 202 rastreáveis | 01+providers+FE; timeout banco/HTTP e feedback sem falsa conclusão |
| RNF03 P FE | Interação local React, feedback visual imediato não medido | Botões/modais | FE; medir resposta e estados acessíveis |
| RNF04 A FE | Skeleton/loading não integrados API | Páginas assíncronas | FE; throttling/renderização/erro por componente |
| RNF05 P | Multer só tamanho/MIME, sem rota | Upload multipart em /films/:id/images e galerias | 03/06+FE; forjado/excessivo/abortado, prévia, limites/tempo/storage |
| RNF06 P FE | CSS reduced-motion em home, sem comprovação geral | Navegação/carrossel | FE; dispositivo de poucos recursos, redução de efeitos |
| RNF07 P/A | CHECKs DDL e nenhum validator de domínio | Cadastros/cotação/estoque; por perfil | Todos+FE; negativo/decimal/qtd incoerente, rollback e MySQL real |
| RNF08 A INF | 99,5% disponibilidade não medida; bootstrap falha | Health/readiness planejados e serviços | 01/INF/15; monitoramento mensal, backup/restore, shutdown/dependência indisponível |
| RNF09 P | Erros portugueses variados sem requestId | Todas rotas | 01+FE; mensagens/códigos seguros e renderização clara |
| RNF10 A FE/INF | Isolamento de falha não demonstrado | Erro por tela/provedor | 01+FE; erro local não derruba serviços, retry/voltar home |
| RNF11 A FE | Orientação fatal não definida | Error boundary/página erro | FE/01; orientação segura ao suporte/admin, sem stack |
| RNF12 I FE | Mocks parecem catálogo/compra real, preços fixos | Home/booking | FE+todos; identificar simulação explicitamente, providers não aprovam em produção |
| RNF13 A | Confirmação/política senha ausentes | Register/reset/perfil próprio | 02+FE; política/confirmar/72 bytes bcrypt, operação assíncrona |
| RNF14 A FE | Não há formulário de senha | Login/cadastro | FE; oculta por padrão, toggle acessível |
| RNF15 P/A | UNIQUE CPF/CNPJ apenas DDL; seed sem normalização comprovada | Register/users/suppliers | 02/06; validar/normalizar, corrida de unicidade, resposta segura |
| RNF16 A | JWT parcial não implementa 2FA | Login/enrollment/desafio | 02; AD/S obrigatórios, fator opcional outros, replay negado |
| RNF17 P/I | Helmet parcial; where interpolado, sem validators | Todas privadas/HTML/uploads | 01+todos+FE/INF; SQLi/SSRF/XSS/CSRF conforme transporte, no mass assignment |
| RNF18 A | Limiter não instalado/configurado | Geral/fluxos sensíveis | 01; 429 Retry-After, logs seguros, store compartilhado/topologia real |
| RNF19 P/I | dotenv imports, env ausente e ignore raiz não protege env | Configuração startup | 01/INF; env inválido falha seguro, segredo não versionado/logado |
| RNF20 A INF | CAPTCHA/WAF não disponíveis | Register/forgot/newsletter/checkout e borda | 01/13/INF; validação servidor fail-closed, Cloudflare configurado, não garantido por CORS |
| RNF21 P/A | Helpers bcryptjs importam lib ausente; hashes seed incompletos; HTTPS sem evidência | Auth/TLS | 02/INF; hash real calibrado, tráfego TLS e sem plaintext |
| RNF22 A | Método sem referência gateway | /payment-methods,/payments; próprio | 09; tokenização real, nenhum PAN/CVV em banco/DTO/log |
| RNF23 A | Consentimento/finalidade/privacidade ausentes; newsletter só DDL | /users/me/export, DELETE/me, consentimentos | 02/13/14+privacidade; base legal/prazos/minimização/portabilidade e conservação financeira |
| RNF24 P FE | UI existente não auditada visualmente | Layout/componentes | FE; consistência visual/estados por tela |
| RNF25 P FE | Temas sem medição WCAG AA | Contraste/tipografia | FE; testes automatizados + revisão manual em todos presets |
| RNF26 P FE/A | Presets existem; fonte/leitor/narração/Libras sem cobertura comprovada | Preferências/telas | FE+02; teclado/leitor/fonte/daltonismo/Libras e persistência sem afirmar cobertura total |
| RNF27 P FE | Home/protótipo apenas | Fluxos inclusivos | FE; avaliação usuários/semântica/formulários |
| RNF28 P FE | Classes responsivas | Mobile-first | FE; viewport pequeno e fluxo comercial completo |
| RNF29 P FE | Grid/breakpoints existentes | Telas tamanhos diversos | FE; layout sem overflow e conteúdo legível |
| RNF30 Não testado | Browser/device consistência | Home e formulários futuros | FE; navegadores modernos e devices suportados |
| RNF31 P FE | Elementos clicáveis nem sempre teclado (card div) | Toque/mouse/teclado | FE; navegação foco/ativação equivalentes |
| RNF32 P | Pastas corretas, domínios vazios, esqueleto copiado | Todos módulos | 01+todos; responsabilidades, nomes CineAstra e docs rastreáveis |
| RNF33 P | Componentes FE; API sem controllers/models | Estrutura interna | FE/01+todos; separação controller/service/model sem duplicação |
| RNF34 P/I | ApiError local funciona, development expõe message/console URL | Erros/logger | 01; code/requestId, details seguros, redaction incluindo token na URL |
| RNF35 A | Sem tests/CI/migration runner/spec | Evolução de módulos | 01+todos/15; contratos/regressão/upgrade existentes e documentação atualizada |
| RNF36 Bloqueado produção | Dependências/imports/rotas/tests/integrações faltam | Gate publicação | 15+INF; nenhum risco crítico aberto, testes/carga/backup/segurança comprovados |

## V4 — cobertura adicional explícita

| Capacidade | Situação | Responsável / endpoint / teste |
| --- | --- | --- |
| nome_cine | Rename SQL presente; seed/query antigos incompatíveis; aplicação desconhecida | 01 baseline/06 models; /suppliers; schema real e sem nome_fantasia |
| Galeria filmes | DDL/backfill presentes; serviço ausente | 03; /films/:id/images + POST /:imageId/principal; gerada read-only, duas principais concorrentes |
| Galeria insumos/combos | DDL presente; serviço ausente | 06; /supplies/:id/images, /combos/:id/images; propriedade, troca principal, alternativas |
| url_reproducao | DDL presente; API/play ausentes | 03 escreve AD, 11 play autorizado; não retornar URL estável publicamente |
| Newsletter | Seis tabelas/seeds presentes; API/worker ausentes | 13; POST /newsletter/subscriptions,/confirm,/unsubscribe; GET/PATCH /newsletter/me/preferences; AD /newsletter/categories,/campaigns,/campaigns/:id/start,/cancel,/sends; tokens/double opt-in/categorias independentes/dois workers/crash |
| Logs HTTP | DDL/logger parcial; banco/evento não verificados | 01/14; /admin/logs; redaction/fila/scheduler/expurgo 90d, sem substituir auditoria |

## Evidências executadas versus aceite futuro

Executados: sintaxe dos 8 arquivos JS backend aprovada; 6 assertions isoladas de ApiError aprovadas; `npm test` backend falhou por placeholder; bootstrap `node backend/app.js` falhou com ERR_MODULE_NOT_FOUND express; resolução de libs ausentes; audit do lock backend sem vulnerabilidades reportadas; contagem de 47 tabelas DDL únicas excluindo exemplos comentados. Não houve testes HTTP, MySQL, concorrência, Swagger, build/lint/execução do frontend nem SLA/acessibilidade medidos. Testes das matrizes acima permanecem pendentes nos módulos respectivos. Nenhum RF/RN crítico marcado implementado apenas por existir tabela.

## Prompt 01 — cobertura atual (sobrepõe apenas fundação ao snapshot acima)

| Requisito/contrato | Entrega integrada / evidência executável | Limite/pendência |
| --- | --- | --- |
| RN02/RNF17 (parcial) | JWT strict, RBAC5perfisuppercase, owner/interface scope; access.test.js casos inválido/expirado/algoritmo/issuer/audience/IDOR/perfil/status/2FA | Provider de sessão real, revogação/enrollment/login e vínculos operacionais dos módulos ainda ausentes; default503 |
| RNF02/09/34 | env validado, requestId/404/erros seguros, deadlines HTTP/SQL, Promise cancellation/sockets destruídos; http.test/foundation.test/server.test | Tempo real sob carga/provedores/SLA não medido; sem frontend feedback implementado |
| RNF18 | Limiter geral e8fluxos IP+identidade/hash,429Retry-After/log; access/http.test | Store compartilhado não escolhido; >1instância/memory inválido e external sem factory bloqueia |
| RNF19 | dotenv startup antes de dependências, validação sem segredos, ignore/.env.example, teste startup inválido | Configdev/test e secret reais não fornecidos |
| RNF20 (parcial) | CAPTCHA interface fail-closed422/503, trust proxy restrito, testes; CORS não confundido com autorização | ProviderCAPTCHA, WAF/Cloudflare/TLS e topologia são dependências reais externas |
| RNF07/32/33/35 (fundação) | DTOID/Money/Pagination, pool/transação parametrizados, arquitetura routes-controller-service-model, scripts/tests/OpenAPI/runner | Regras e SQLdomínios M02+ não implementados; locks/concorrência só podem ser provados em MySQL real |
| RNF08/36 (parcial) | Liveness/readiness/shutdown, fecha HTTP/worker/fila/pool, readiness503seguro e teste realHTTP com dependências simuladas | Nenhum SLA/backup/monitoramento/produção certificado; MySQL real não testado |
| RF46 (somente preparação) | Logger SQL limitado/queue/redaction90dias+alternativa worker/metadados; schema/helper auditoria/outbox | Endpointadmin/relatórios/consumeroutbox ainda ausentes, novas tabelas não migradas e scheduler não comprovado |
| RF04/RNF16 | Preparação JWT/provider2FA e proteção AD/S testada com fixture | Não afirmar ativação/enrollment2FA implementada (Prompt02) |
| RNF05 | Multer limitado não global; MIME prefilter+gate de validadorreal; sem staticupload genérico | Upload domínio/conteúdo/storage/compensação ficam03; sem rota multipart nova nesta etapa |

**Rotas publicadas da fundação:** GET `/` (identificação), `/health` (liveness), `/ready` (banco/log/retenção200ou503), `/openapi.json`, `/api-docs`/assets (dev/test/stagingdocsEnabled). Todas públicas com `security:[]`, rate limiter geral/Helmet/CORS. Docs404emproduction. OpenAPI bearerAuth global disponível para futuros privados, sem login fictício. Todos os `/api/...` das matrizes anteriores continuam planejados.

**Banco:** runner offline manifest+ledger proposto e nova migration M01auditoria/outbox criados. Nenhum SQL executado; base existente sem ledger recusada, explicit baseline manual obrigatório. Logs/nome_cine/V4aplicados continuam desconhecidos. Migrations/tablePKFKENUMs foram inspecionadas como fontes, não database vivo.

**Testes:** fixtures SQL/session/retention de unit/HTTP explicitamente simuladas, mocks não provam sessão real/locks/scheduler. OpenAPI validada e UI/assets respondem com configurações seguras. TesteMySQLreal isolado existe e registra skip por TEST_DB_*não fornecidos; resultados finais/contagem/comandos estão no handoff01. Nenhum RFde negócio foi promovido a funcional com base nos testes da infraestrutura.

## Prompt 02 — cobertura atual de identidade (08/10/2026)

Implementação integrada não equivale a aceite de MySQL ou providers reais. Evidências: `backend/tests/identity.test.js` (20 testes), regressão fundação (34), `tests/integration/identity.mysql.test.js` (não executado sem configuração), `backend/docs/openapi.json` (34 operações desta etapa). Contratos e dependências: [backend-identity.md](backend-identity.md).

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF01 / RN24 | POST auth/register, users/me/age-verification; proofs, consentimentos/versões/base legal, responsável | Cadastro só CLIENTE, mass assignment/CPF/data negados, prova inválida/ausente, menor/vínculo, renovação | Parcial operacional: provider idade/CAPTCHA/vínculo legal e documentos aprovados ausentes; banco não migrado |
| RF02 / RN02 | login de perfis, admin/users e /:id/access, SessionProvider SQL, bootstrap:admin | JWT/sessão/status/JTI/logout, CLIENTE negado em admin, último ADMIN preservado | SQL/bootstrap real aguardam teste; reativação exige revisão |
| RF03 | forgot/reset com token hash, prazo, consumo e revogação | Resposta genérica, entrega falha sem falso sucesso, reset único e login antigo negado | E-mail real não configurado; SQL concorrente pendente |
| RF04 / RNF16 | 2fa/enroll/verify/disable, TOTP, rotacionar por enrollment autorizado | AD/S sem token pleno antes da prova, 5 tentativas commitadas, replay/bypass negados, cifragem/rotação/revogação | APP integrado; SMS/EMAIL aguardam adapter/protocolo/destino; chave real e recuperação de fator perdido/legado pendentes |
| RF05 / RNF23 | GET/PATCH/DELETE me, POST export; solicitação de exclusão durável | Reauth, campos estritos, export sem segredo, desativação/revogação e solicitação RECEBIDA | Parcial: anonimização final, retenção e resolução não automatizadas sem política; export cobre identidade, outros módulos devem ampliar |
| RF06 | CRUD addresses/contacts próprio, principal único | IDOR em GET/PATCH/DELETE, validação por tipo, principal e paginação | Métodos de pagamento ficam09; constraint/locks reais pendentes |
| RF07 | GET/PATCH preferences; aparência separada de tema | Preferências persistidas no repository de teste e validadas no HTTP | Frontend/acessibilidade visual não alterados nem certificados |
| RNF07/09 | Validadores Zod estritos, respostas/erros estáveis, IDs string | CPF/data/limite72bytes/duplicata/ID/paginação/erros seguros | Integridade real depende das migrations/constraints |
| RNF13/15/21 | Confirmação, bcryptjs assíncrono custo12, normalização/UNIQUE | Política UTF-8 sem truncamento, bcrypt, cadastro duplicado; 3 hashes custo12 medidos180–185ms | CNPJ pertence06; HTTPS é infraestrutura, carga/calibração produtiva não testadas |
| RNF17/18 | SQL parametrizado/whitelist, propriedade, sessão sob lock, limites IP/identidade/desafio | Injeção não entra em SQL, IDOR/mass assignment negados, revogação entre middleware/service, logs sem segredo | Sem cookies; CSRF revisto se transporte mudar; store compartilhado e testeMySQL pendentes |
| RNF19 | Config validada, chave AES separada, .env.example sem segredos | Suíte fundação/env; deps/lock preservados | Config real não fornecida |
| RNF20 | CAPTCHA obrigatório e fail-closed nas rotas sensíveis | Ausência/false/provider indisponível retornam422/503 | ProviderCAPTCHA real, WAF/Cloudflare operacionais pendentes |
| RNF22 | Nenhum dado de cartão ou método financeiro criado | Escopo preservado | Prompt09; não declarar atendido por identidade |
| RF46 (infra de auditoria) | identityModel/services usam recordAuditEvent/outbox na transação | Alterações auditadas; rollback no repository de teste e testeMySQL preparado | Consulta geral de auditoria/relatórios ainda14; consumer/retention por evento pendentes |

RF08–46 e demais RN/RNF não foram ampliados fora das dependências explícitas desta etapa. Frontend (incluindo RNF14 senha visível/oculta) não alterado. Não há declaração de conformidade LGPD/ECA Digital, SLA ou prontidão produtiva.

**Resultado:** `npm test`54/54; OpenAPI39operações validada; integraçãoMySQL2skips; audit0vulnerabilidades reportadas; sintaxe47JS e diffcheck aprovados. Plano88statements, nenhuma migration aplicada. Próximo aceite exige banco isolado + providers/políticas descritos no handoff.

## Tarefa 19 — equipes e membros

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF29 | GET `/api/teams` filtra equipes de sessão ativa para colaborador; `POST /entries/requests` solicita entrada | `team.test.js`: sessão cancelada negada, equipe própria e pedido sem membro automático | Disponibilidade e local derivam da sessão; fluxo visual do colaborador não foi alterado |
| RF33 | `PATCH /api/teams/:id/members/:memberId` define função somente por ADMIN/supervisor próprio | `team.test.js`: autoatribuição e supervisor alheio negados | Atribuições de chamados/tarefas concretas ficam na tarefa 20 |
| RF37 | Solicitação aprovada ou convite aceito cria membro; histórico em `equipe_entradas` | `team.test.js`: perfis, convite pendente, destinatário, função e duplicate; integração SQL preparada | Migration não aplicada; FK/UNIQUE/locks em MySQL aguardam schema `_test` isolado |

## Tarefa 20 — chamados internos

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF32 | POST/GET/PATCH/DELETE lógico em `/api/teams/:id/chamados` | `task.test.js`: autor, gestor, validação de campos, cancelamento e histórico | Migration não aplicada; SQL/MySQL isolado pendente |
| RF39 | Lista com `assigned=me`, detalhe e histórico; função via `/api/teams/:id/members` | `task.test.js`: filtro por responsável e membro ativo | Integração visual de função/tarefa não alterada |
| RF40 | Atribuir, aceitar, resolver e fechar com máquina de estado | `task.test.js`: transição inválida e duplo aceite; cenário SQL opt-in | Locks e FK composta aguardam execução em MySQL `_test` |

## Tarefa 21 — notificações

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF23 infraestrutura in-site | GET `/api/notifications/me`, PATCH `/:id/read`; emissão interna com dedupe | `notification.test.js`: IDOR, filtro/paginação, retry, ausência de POST; 90/90 totais | Migration/UNIQUE MySQL não executada sem `_test`; frontend não alterado |
| RF23 convite de equipe | `teamService.propose` emite `TEAM_INVITATION` na mesma transação | `team.test.js`: um evento por convite; cenário MySQL opt-in preparado | Eventos de promoções, suporte, planos e cobrança dependem dos módulos futuros; não afirmar RF23 completo |

## Tarefa 22 — fornecedores

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF45 cadastro fornecedor | ADMIN GET/POST/PATCH/DELETE `/api/admin/suppliers`; FORNECEDOR GET `/api/suppliers/me` | `supplier.test.js`: perfil, DTO redigido, CNPJ e `nome_cine`; 94/94 totais | Migration/UNIQUE e schema real aguardam `_test` isolado |
| RF25–RF28 vínculo fornecedor/local | Conta FORNECEDOR ligada a `fornecedores.id_usuario`; mapa de escopo documentado | Teste bloqueia acesso alheio e role incorreta | Estoque, produtos, logística e devolução pertencem às tarefas 23–27; não declarar RF25–28 completos |

## Tarefa 23 — insumos e equipamentos

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF25 insumos | `/api/inputs`; `fornecedor_locais`; preço string, saldo inicial zero | `product.test.js`: fornecedor alheio, local, PATCH de saldo/custo rejeitado; 98/98 totais | Movimentos/consumo na tarefa 26; MySQL `_test` ausente |
| RF26 equipamentos | `/api/equipment`; patrimônio normalizado UNIQUE; arquivamento lógico | `product.test.js`: patrimônio duplicado e referência preservada; OpenAPI 140 operações | Auditoria de duplicatas legadas e ALTER em MySQL `_test` pendentes |
| RF45 catálogo fornecedor | ADMIN concede/revoga locais; fornecedor opera próprios itens | Testes de perfil, escopo e SQL parametrizado; cenário MySQL opt-in | Estoque/logística, migrations reais e frontend futuros |

## Tarefa 24 — combos e composição

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF45 combos | ADMIN `POST/GET/PATCH/DELETE /api/admin/combos`, `PUT /:id/items`; público `GET /api/combos` e `/:id` | `combo.test.js`: perfil, composição, local e histórico; 101/101 testes, OpenAPI 147 operações | Migration/FK e cenário MySQL aguardam `_test` vazio |
| RF12 compra de combo | Catálogo público de combo disponível por local | Teste de visibilidade e arquivamento | Pedido, ticket e consumo reais pertencem a tarefas posteriores; RF12 parcial |
| RN10 desconto proporcional | Preço base decimal persistido, sem cálculo de desconto | Validação de dinheiro exato em create/PATCH | Preço/desconto/teto no serviço da tarefa 28; RN10 pendente |

## Tarefa 25 — galerias comerciais V4

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| V4 insumos/combos imagens | 14 operações de galeria em `/api/inputs/:id/images`, `/api/combos/:id/images`, administração e bytes; PRINCIPAL/ALTERNATIVA, ordem/alt | `commerceGallery.test.js`: principal concorrente, propriedade, compensação, visibilidade; 104/104 totais; OpenAPI 164 operações | UNIQUE/locks reais no MySQL `_test` ainda não executados |
| RNF05 staging fornecedor | `POST/GET/DELETE /api/uploads/images`; sidecar de proprietário persistente | Teste staging alheio 403; regressão de upload/galeria de filmes aprovada | Staging anterior sem sidecar exige reenvio; produção depende de storage privado configurado |

## Tarefa 26 — estoque

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF25 estoque por local | `GET /api/inventory/inputs/:id`, `/equipment/:id`, `GET/POST /movements`; saldo físico/reservado | `inventory.test.js`: sinal, item único, propriedade, saldo não negativo; 108/108 totais; OpenAPI 169 | Migration/constraints/locks MySQL `_test` não executados |
| RF25 combo/checkout | Serviço interno `reserve`/`transition` na conexão do pedido, componentes agregados e locks ordenados | Último item concorrente, rollback parcial, consumo/liberação/compensação; cenário SQL opt-in | Checkout/pagamento real deve chamar o serviço na mesma transação em etapa posterior |
| RF43 / RN15 alerta | `GET /api/inventory/alerts?localId=...` usa disponível <= mínimo | Teste de consulta e escopo | Solicitação não planejada/logística e UI futuras; alerta não garante reposição antes de zero |

## Tarefa 27 — solicitações e logística

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF27 envio/recebimento | `/api/logistics` GET, detalhe, send/transit/receive/cancel; migration com item, destino, UNIQUE e movimentos | `supply.test.js`: recebimento repetido, fornecedor alheio e saldo | Constraints/locks MySQL `_test` ainda não executados |
| RF28 devolução | `POST /api/logistics/:id/return` após sessão ENCERRADA, equipamento integral e local de origem preservado | Teste devolução antes/depois do encerramento e repetição | Uso efetivo de equipamento não é registrado no schema; regra depende do estado da sessão |
| RF31 / RF44 solicitação | `/api/stock`, `/api/stock/requests` e aprovação/recusa; sessão/local/equipe e item XOR | Teste local errado, equipe alheia, `a_chegar` | Interface frontend e MySQL `_test` pendentes |
| RN11 ETA | Origem/destino persistidos e visíveis; `data_prevista` sem preenchimento artificial | Contrato rejeita cálculo sem provider | Distância real e fórmula/provider ainda ausentes; RN11 parcial |

## Tarefa 28 — precificação

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RN05–RN08 | Custos de aluguel/sessão/insumo/plano; `/api/pricing/quote`, `/api/admin/pricing/costs`, `/publish` | `pricing.test.js`: C100→160→120, sessão e custo exato | Cadastro de custos reais e MySQL `_test` pendentes; RN06 depende do custo completo de benefícios |
| RN09 | Não há rateio nesta tarefa | Documentado para tarefa 39 | Participantes/cotas/cobranças ainda não integrados |
| RN10 / RN16 | Combo proporcional, promoções, benefícios de plano e cupom sob teto; reserva de cupom interna | Testes combo, limite concorrente, snapshot e rollback simulado | Checkout das tarefas 33–34 deve consumir o serviço; MySQL real pendente |
| RN18 / Apêndice A | Parâmetros iniciais 60/20/25, ocupação 20, projeção 50%; ADMIN vê `belowMargin` | Testes margem sobre custo, meia e projeção | Outros parâmetros operacionais em módulos futuros; interface ADMIN não alterada |
| RN23 na cotação | Meia do preço público, sem acumular benefício pessoal e sem piso de custo que negue direito | Teste meia e prévia não finalizável | Comprovação/cota/checkout nas tarefas 32–35 |

## Tarefa 29 — métodos e provider

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF06 | Cinco operações em `/api/users/me/payment-methods`; próprio, principal e arquivamento lógico | `paymentMethod.test.js`: método alheio 404; 122 testes totais | Tokenização real depende de provider; migration/locks MySQL `_test` pendentes |
| RF18 | `prepare` interno aceita cobrança de assinatura própria e soma multa em centavos | Teste cobrança 19,95 + 2,00 e obrigação XOR | Recorrência, rateio, mandato e cobrança efetiva em tarefas 30/38–39 |
| RF20 | `prepare` interno aceita pedido próprio e chave idempotente persistente | Teste chave repetida, chave conflitante e método alheio | Endpoint de pagamento/webhook e conciliação na tarefa 30 |
| RNF22 | API rejeita PAN/CVV/token no corpo; método só recebe token do provider, DTO omite token | Teste schema e provider ausente 503 | Sem adaptador real, não declarar tokenização produtiva concluída |

## Tarefa 30 — pagamentos e conciliação

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF20 | `POST /api/payments`, `GET /:id`, `POST /:id/reconcile`, webhook bruto assinado | `payment.test.js`: timeout sem novo despacho, falso/duplo/antigo webhook e aprovação tardia; 129/129 totais | Gateway real e MySQL `_test` ausentes; sem aprovação simulada |
| RN04 | Aprovação de pagamento e pedido/cobrança na mesma transação com evento de auditoria/outbox | Serviço aplica valor/moeda, propriedade, ordem temporal e deduplicação; OpenAPI 208 operações | Rights/checkout completos e verificação SQL concorrente ficam em tarefas posteriores |

## Tarefa 31 — reembolso e estorno

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RN03 | `POST /api/payments/:id/refunds` persiste recebimento e prazo de resposta; `GET /api/refunds/:id`, reconcile e decisão ADMIN | `refund.test.js`: repetido, pendente/timeout, falha, confirmação integral e parcial | Gateway real, monitor de prazo e MySQL `_test`; compensação de direitos ainda PENDENTE |
| RN26 | `POST /api/subscriptions/:id/cancel` desliga renovação local e abre pedido para cobrança própria paga | Teste titular versus alheio, solicitação única; 136/136 totais, OpenAPI 213 | Mandato externo e cotas de participantes nas tarefas 38–39; proporcional anual depende dos Termos publicados |

## Tarefa 32 — ocupação ativa de assentos

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF10 | Reserva interna de 15 minutos, confirmação paga e liberação de pedido cancelado; nenhuma rota nova | `seatOccupancy.test.js` e cenário MySQL opt-in de último assento/revenda | Checkout da tarefa 33 e execução MySQL `_test` pendentes |
| RN19 | UNIQUE ativa por sessão/assento em `assento_ocupacoes`, histórico de itens preservado | Migration 16 com preflight/backfill; plano validado | Migration não aplicada; intervalo entre sessões segue na tarefa 18 |

## Tarefa 33 — carrinho e cotação

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF10–RF12 | `POST /api/orders/quote` valida ingresso/assento, insumo, combo e streaming ALUGUEL/COMPRA | `order.test.js`: tipo único, quantidade, sala, idade e estoque agregado | Pedido, reserva e ticket na tarefa 34/35; MySQL `_test` pendente |
| RF13–RF15 | Snapshot informativo de linhas/total, sem criar pedido ou direito | Preço/status/dono enviados pelo cliente são rejeitados | Persistência, estados e finalização na tarefa 34 |
| RN04 / RN16 | Preço/cupom/desconto do motor 28; taxa explícita zero | Teste de custo/preço de compra streaming; OpenAPI atualizado | Custos reais da categoria PURCHASE e migration 17 pendentes |

## Tarefa 34 — checkout e expiração

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF15 / RN16 | `POST /api/orders/checkout`; cotação refeita e snapshot/cupom/itens/reservas numa transação | `checkout.test.js`; OpenAPI 215 operações | MySQL `_test` e concorrência real de cupom/estoque/assento pendentes |
| RN12 | TTL 15 min, job cancela e libera sem ticket; aprovação tardia para revisão | Teste job e evento tardio; gateway fora de locks | Gateway real ausente; estorno da aprovação tardia exige conciliação financeira |

## Tarefa 35 — tickets

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF13 | Emissão paga por unidade, código opaco e UNIQUE item/tipo/unidade; `GET /api/orders/:orderId/tickets` próprio | `ticket.test.js`: só pago, três unidades, retry único | MySQL `_test` e pedidos legados sem emissão automática |
| RF34 | `GET /api/sessions/:sessionId/tickets`, `POST /api/tickets/validate` e `/consume` para equipe vinculada | Testes de vínculo, validação sem mutação e duplo consumo | Concorrência SQL real pendente |
| RF41 / RN23 | Consumo de entrada e `POST /api/tickets/exit`; meia exige atestação mínima na portaria | Testes de saída única e meia | Compra de meia/cota 40% e verificação documental automática ausentes |
| RN21 | Combo exige sessão; ticket por unidade expira até 30 min após término, inclusive virada do dia | Teste de horário e emissão tardia negada | Fuso civil da sessão não persistido; migration 19 não aplicada |

## Tarefa 36 — operação e presença

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF14 | `GET /api/orders/{orderId}` retorna estados financeiro e operacional separados, por unidade e agregado | `orderOperationalStatus.test.js` cobre cinco estados, dono e PAGO imutável | Streaming operacional depende da tarefa 37; MySQL `_test` pendente |
| RF35 | `GET /api/sessions/{sessionId}/attendance` mostra resumo de atrasos e histórico paginado de entrada/saída | `ticket.test.js` cobre histórico, reentrada e staff de outra sessão | Migration 20 não aplicada; contagem/locks reais pendentes |
| RF41 | `/api/tickets/consume`, `/exit`, `/entry`, `/validate` separam consumo, presença e reconferência de meia | Testes de transição inválida, dupla entrada/saída e meia em reentrada | Prova documental e venda de meia/cota ainda pendentes |

## Tarefa 37 — streaming avulso

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF08 | Checkout/pagamento existentes concedem `acessos_streaming`; GET `/api/streaming/my-accesses`, POST `/api/streaming/{accessId}/play` | `streaming.test.js`: concessão, dono, pendente, vencido, DTO sem origem | Provider privado real e MySQL `_test` ausentes; acesso legado sem snapshot exige revisão |
| RN05 | Duração de aluguel congelada em `itens_pedido`, expiração desde evento aprovado; compra sem prazo | Teste de snapshot e SQL de aluguel/compra; precificação proporcional da tarefa 28 | Migration 21 não aplicada |
| RN22 / V4 | Play revalida verificação de idade, classificação, filme e URL privada; provider assina temporariamente | Testes de idade, 503 e host HTTPS permitido | Menor `ATE_16` sem autorização de play; CDN real e revogação de reembolso pendentes |

## Tarefa 38 — planos e assinaturas

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF16 | Planos públicos e CRUD ADMIN; contrato com snapshot de catálogo/descontos/combo; pedido mensal único | `plan.test.js`: pendência, snapshot e resgate repetido | Acesso ao catálogo na tarefa 41; entrega física futura; migration 22 não aplicada |
| RF18 | Contratação mensal/anual `PENDENTE` com cobrança própria; gateway confirmado ativa | `plan.test.js`: sem pagamento e cancelado não ativa; integração do serviço de pagamento | Mandato recorrente, Pix Automático, débito e divisão da tarefa 39/40; gateway real ausente |
| RN06 | Ativação exige custo mensal/anual e preço com margem líquida mínima de 20% | Validação em centavos no serviço | Custos reais devem ser cadastrados e aceitos em MySQL `_test` |

## Tarefa 39 — participação e rateio

| Requisito | Implementação/endpoint | Evidência executada | Limite / dependência |
| --- | --- | --- | --- |
| RF17 | Convite próprio, aceite/recusa, participante persistido, limite com titular e histórico | `participation.test.js`: convites simultâneos, aceite e saída | Migration 23/backfill e lock em MySQL `_test` pendentes |
| RF19 | Saída própria e suspensão/reativação pelo titular; faturamento passado imutável | Teste de saída e consulta de cobrança própria | Cancelamento integral usa rota existente; job financeiro da tarefa 40 pendente |
| RN09 | Modo na contratação; mudança unânime agendada; prévia de cotas exatas e aviso in-site | Teste de consentimento, soma de centavos e fatura passada | Emissão idempotente de faturas futuras e cobrança real na tarefa 40 |
