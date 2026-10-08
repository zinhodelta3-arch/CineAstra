# CineAstra — matriz de cobertura e contratos (Prompt 00)

Snapshot diagnóstico:06/10/2026. Atualização Prompt01:08/10/2026. **Infraestrutura implementada; fluxos HTTP de negócio ainda ausentes.** As matrizes RF/RN/RNF originais abaixo preservam o planejamento00, não certificam domínio entregue. Estado atualizado da fundação está na seção Prompt01 ao fim deste documento. Fontes/achados: [arquitetura](backend-architecture-plan.md); PK/FK/ENUM/CHECK/índices: [inventário](backend-schema-inventory.md); execução e bloqueios: [handoff](backend-handoff.md).

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
| RF21 A | IA com encaminhamento; provider+suporte/histórico | POST /assistant/messages; POST /assistant/handoff | C próprio, identidade IA explícita | 14; provider ausente, dados mínimos, handoff humano disponível |
| RF22 A | FAQ/suporte; conteúdo versionado,suporte+mensagens | GET /faq; GET/POST /support; POST /support/:id/messages | Público FAQ; C dono; AD atendente | 14; histórico, IDOR, prazo de resposta |
| RF23 A | Eventos/notificações; notificacoes+outbox | GET /notifications/me; PATCH /notifications/:id/read | Todos apenas próprias; criação interna | 05+emissores; evento repetido, leitura alheia, paginação |
| RF24 A | Institucional/termos; arquivos versionados | GET /institutional/:slug | Público, AD publica versão aprovada | 14; termos reais versionados, sem inventar empresa/parcerias |
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
| RF45 A | Administração cadastros e ações de domínio; todas entidades elegíveis | CRUD /users,/suppliers,/films,/locations,/sessions,/equipment,/supplies,/plans,/teams,/combos,/coupons,/promotions; ações /orders,/tickets,/subscriptions,/support | AD 2FA, invariantes+auditoria, histórico sem DELETE livre | 02–14; RBAC/IDOR/retention e contrato por recurso |
| RF46 P/A | Logs HTTP parcial; auditoria/relatórios/parâmetros ausentes | GET /admin/logs, /admin/reports/:type; GET/PATCH /admin/financial-parameters | AD 2FA | 01/08/14; redação, estorno no relatório, margem/custo snapshot |

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
| RN17 A | Apuração lucro líquido/base/percentual social | GET /admin/reports/social-allocation; AD | 08/14; 5–10% sobre lucro líquido definido, custos completos e termos reais pendentes |
| RN18 A | Parâmetros versionados e alertas sobre custo | /admin/financial-parameters, margem; AD | 08/14; custo denominador, custo zero, snapshot histórico |
| RN19 A | Agenda por local/instantes/lock estável | POST/PATCH /sessions; S responsável/AD | 04; concorrência entre salas, fronteiras/meia-noite e 1h |
| RN20 A | Reserva de sessão/espaço pelo usuário, não assento | POST /session-reservations (fluxo proposto); C aprovado | 04; 5h, definição comercial/estrutura ausente; não confundir TTL checkout |
| RN21 A/I | Sessão vinculada/expiração retirada combo | Ticket validate/consume; staff vinculado | 10; até fim+30min, sem sessão associada bloqueia emissão |
| RN22 A | Classificação/idade/acompanhamento | Checkout/play/entrada; C elegível/responsável | 02/04/10/11; idade não autodeclarada, regra vigente oficial antes de algoritmo |
| RN23 A/I | Base meia/benefício/cota/evidência compra+portaria | Sessões/quotes/checkout/consume; C/staff | 08/10; saldo transacional visível, >=40%, idosos/regimes separados; revisão base jurídica |
| RN24 A | Verificação e responsável/supervisão/autorizações | Register, parental controls, checkout/assinatura/play | 02+callers+FE; sem provider não atesta idade; dados não publicidade; enquadramento jurídico |
| RN25 A | Oferta/empresa/sumário/comprovante/versão | /institutional, quote, checkout e GET /orders/:id/receipt; público/dono | 10/14/FE; dados empresariais reais, conservação comprovante, encargos claros |
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
