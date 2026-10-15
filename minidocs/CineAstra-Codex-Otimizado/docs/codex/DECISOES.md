# Decisões compartilhadas

## Decisão da tarefa 48 — 11/10/2026

- Relatório financeiro é de movimento de capturas e estornos por data UTC, não demonstração de resultado. Custo conhecido vem do snapshot de precificação uma vez por pedido; captura duplicada é indicada, não apagada. Sem custos completos, despesas e tributos, RN17 retorna base/valor indisponíveis, sem calcular lucro líquido ou lançar destinação.
- Consulta HTTP libera apenas templates conhecidos do OpenAPI e campos mínimos; logs antigos com rota não reconhecida são redigidos. RF45 continua nos serviços de domínio, sem endpoint CRUD genérico.

## Decisão da tarefa 47 — 11/10/2026

- Conteúdo institucional e legal é publicado somente por ADMIN em versões imutáveis com fonte; sem dados oficiais não há seed, cotação contratual ou contratação. Hash da oferta vincula entrada, preços e versões; snapshot do pedido fica em tabela própria, e assinatura acrescenta seção legal ao snapshot existente sem remover os benefícios congelados.
- IA recebe apenas a pergunta textual através de adapter sem ferramentas/ações. Provider ausente ou falho oferece encaminhamento humano via solicitação de suporte; nenhuma resposta da IA concede autorização.

## Decisão da tarefa 46 — 11/10/2026

- `suporte` permanece o agregado e conserva mensagem/resposta legadas; `suporte_mensagens` registra conversa append-only. Timestamp de resposta legada desconhecido fica NULL com origem explícita, sem atribuir data fictícia.
- Atendimento ao vivo dura no máximo dez minutos por sessão. Ao expirar, o job devolve a demanda à fila ABERTO; não a resolve. Prazo de manifestação é abertura + cinco dias corridos, primeira resposta ADMIN é registrada. Reembolso continua exclusivamente no serviço financeiro da tarefa 31.

## Decisão da tarefa 45 — 11/10/2026

- `id_envio` é chave estável de idempotência externa quando o provider oferece deduplicação; o banco usa `tentativas` como fencing de workers antigos, com lease de 300 segundos e cinco tentativas. Sem exactly-once externo, entrega incerta após crash exige reconciliação.
- Bounce/reclamação verificados pelo adaptador criam supressão persistente por inscrito (migration 26), além do status `BLOQUEADO` quando ativo. Isso preserva `descadastrado_em` de quem já fez opt-out e impede reinscrição futura após evento de bloqueio.

## Decisão da tarefa 43 — 10/10/2026

- Gestão por prova de posse do e-mail usa token `GESTAO` de 30 minutos, separado do token `DESCADASTRO` de opt-out. Consulta por POST não consome token; escrita consome. Reinscrição de e-mail descadastrado exige novo aceite e volta a `PENDENTE` até double opt-in. A migration 25 amplia o ENUM existente.

## Decisão da tarefa 42 — 10/10/2026

- O aceite de newsletter usa versão/texto publicados em `GET /api/newsletter/options`, seleção explícita de categorias e confirmação por POST após o link de e-mail. E-mail duplicado não altera inscrição; sem provider não se registra como enviado. Falha de envio após commit exige recuperação operacional autenticada, sem reativação pública por e-mail.

## Decisão da tarefa 41 — 10/10/2026

- Direito de streaming do plano é calculado no play a partir do contrato, vigência, participante e cota; não se cria `item_pedido` ou `acessos_streaming` artificial. A compra avulsa segue seu direito próprio. Participante sem primeira cota usa o pagamento do titular; cota própria emitida passa a exigir pagamento próprio.

## Decisões da tarefa 40 — 10/10/2026

- Vencimento da renovação é `fim + 1 dia`; competência é o primeiro dia do mês do vencimento. Multa de 2% uma vez; juros simples de 1% por 30 dias corridos sobre principal; IPCA é a razão dos números-índice IBGE/SIDRA 1737 do mês anterior ao vencimento ao último mês encerrado. Índice indisponível não é estimado. Cancelamento por atraso ocorre a partir do dia 31.
- Intenção de pagamento aberta congela encargos; confirmação tardia de dívida de ciclo cancelado pode liquidar o débito sem restaurar benefício. Não se executa débito automático sem mandato/gateway real.

## Decisões da tarefa 37 — 10/10/2026

- Aluguel e compra avulsos seguem o checkout/pagamento existentes. O prazo do aluguel é congelado no item; a vigência começa no horário de aprovação autenticada pelo gateway, nunca no primeiro play. Compra usa expiração NULL.
- Venda de streaming e play exigem provider de mídia privada configurado; padrão responde 503. A lista de direitos nunca traz origem/URL; play revalida dono, pagamento, vigência, filme e idade e devolve URL assinada de até 60 segundos em host permitido. Menor `ATE_16` fica bloqueado até existir autorização específica de reprodução.

## Decisões da tarefa 36 — 10/10/2026

- `pedidos.status` permanece financeiro; o estado operacional é projeção por ticket e janela de sessão, com prioridade documentada no agregado. Streaming fica sem estado operacional até sua tarefa.
- `UTILIZADO` marca somente o primeiro consumo. Presença atual deriva da última `ticket_passagens`, protegida por lock do ticket; reentrada exige saída anterior, validade e reconferência de meia. Migration 20 importa passagens legadas sem apagar os campos antigos.

## Decisões da tarefa 35 — 10/10/2026

- Cada unidade de item recebe ticket próprio após pagamento aprovado; retirada parcial consome unidades separadas. Código aleatório de 256 bits, UNIQUE por item/tipo/unidade. Tickets legados não são recriados automaticamente.
- Combo exige sessão de retirada do mesmo local no checkout e vence 30 minutos após o fim; ingresso vence ao fim. Sessão mantém a interpretação UTC civil já usada no backend.
- Validação é leitura; consumo e saída são operações distintas e atômicas por equipe vinculada. Meia exige atestação presencial do tipo de documento, sem copiar dados do documento; compra de meia e exposição da cota seguem pendentes.


## Decisões da tarefa 34 — 10/10/2026

- Checkout avulso cria pedido e reservas por 15 minutos; pagamento usa a rota já existente após commit. Chave de checkout é única por usuário e hash da entrada; pedido legado com TTL NULL fica fora do job.
- Aprovação após prazo/cancelamento é registrada para revisão financeira sem consumir reservas. Ticket pertence à tarefa 35. Menor e prévia de meia continuam sem finalização na falta de comprovação/autorização; taxa adicional zero.


## Decisões da tarefa 33 — 10/10/2026

- Carrinho nesta tarefa é cotação informativa em `POST /api/orders/quote`. A tarefa 34 persiste pedido/itens/snapshot e reserva estoque/assento na transação de checkout, conforme seu aceite; a cotação deve ser refeita então.
- Compra definitiva de streaming usa categoria `PURCHASE`, custo `filmes.custo_streaming_compra` e preço `filmes.preco_compra`. Custo não cadastrado bloqueia cotação; migration 17 amplia ENUMs de preço/promoção/benefício sem preencher custo fictício.
- Menor de até 16 anos pode ver prévia, mas `finalizable=false` e autorização de responsável continua necessária no checkout. Meia é prévia não verificada. Taxa adicional nesta cotação é zero.

## Decisões da tarefa 32 — 10/10/2026

- A ocupação ativa fica em `assento_ocupacoes` com UNIQUE sessão/assento; `itens_pedido` conserva histórico e deixa de impor exclusividade permanente. Backfill mantém pedidos pagos/finalizados e pendências dentro do TTL de 15 minutos; cancelados e pendências vencidas ficam livres.
- Checkout e cancelamento futuros devem usar serviço interno na mesma transação do pedido, itens, tickets e pagamento. Ticket GERADO/UTILIZADO impede liberação; confirmar após TTL exige revisão, sem conceder direito automaticamente.
- Migration só remove a UNIQUE histórica após preflight de sala/assento e cobertura. Teste MySQL isolado ainda pendente.

## Decisões da tarefa 18 — 08/10/2026
- `sessoes.data` é o dia de início; `horario_fim` menor que o início indica término no dia seguinte. `data_fim` é derivada no DTO, sem DDL. Hora civil local sem fuso persistido é limitação para expansão multizona.
- RN19: uma hora livre no mesmo local, inclusive salas diferentes; lock estável em `locais` antes de sala/sessão e revalidação de candidatos D−2..D+2. Exatamente uma hora é válida. Tarefa 17 já bloqueia pais na mesma ordem.
- Item de pedido associado congela filme, preço e horário e impede cancelamento; estado operacional pode avançar. DELETE é cancelamento lógico. Sala não muda por PATCH.
- RN20 de cinco horas pertence a reserva de usuário; fluxo administrativo de sessão não a restringe, pois não há marcador/vínculo de reserva no schema atual.

## Decisões da tarefa 17 — 08/10/2026
- Reutilizar tabelas/FKs/UNIQUE de locais, salas e assentos da migration base; não criar DDL duplicado. DELETE arquiva por status para preservar referências.
- Sala nasce INATIVA; só ativa com quantidade de assentos ATIVA igual à capacidade e local ATIVO. Tipos PCD/OBESO/IDOSO geram filtro/flag `acessivel`, sem afirmar disponibilidade ou certificação física.
- Qualquer sessão vinculada congela estrutura, status e arquivamento da sala e de seus assentos; local vinculado só permite editar telefone. Mais estrito que pedido PAGO para preservar histórico. Tarefa 18 deve bloquear local/sala na mesma ordem antes de criar sessão.
- Consultas públicas exigem cada pai ativo; CRUD administrativo exige ADMIN com sessão/2FA. Aceite MySQL real pendente do schema `_test` não produtivo.

## Decisões da tarefa 16 — 08/10/2026
- Reutilizar `filmes_imagens` V4 e migration existente; não criar estrutura duplicada. Escritas bloqueiam `filmes` e sincronizam `filmes.imagem`; coluna gerada `tipo_principal` só é lida pela constraint.
- Publicação copia staging para volume privado durável com nova chave e journal por arquivo. Reconciliação consulta referência SQL sob lock antes de manter/remover arquivo; endpoint ADMIN permite retry após falha.
- Lista ordena por `ordem,id_imagem`, com cursor composto; alterações de ordem entre páginas exigem reiniciar paginação. Bytes públicos somente se URL estiver vinculada a filme ATIVO.
- Storage local de instância única; `IMAGE_GALLERY_DIR` privado e distinto de staging em produção. Aceite SQL fica bloqueado sem banco `_test` confirmado, apesar de 68 testes locais e OpenAPI validado.

## Decisões da tarefa 15 — 08/10/2026
- Staging administrativo compartilhado apenas por ADMIN com sessão/2FA; nenhuma associação de galeria antecipada.
- Sharp 0.35.5 reprocessa PNG/JPEG/WebP estáticos em WebP sem metadados; Multer 2.4.0 mantido após revisão/registry/auditoria.
- Storage interno local de instância única, UUID, quota 200, acesso por 24h e expurgo sob demanda; IMAGE_STAGING_DIR explícito em produção. Sem static/fetch/URLs de entrada.
- Rotas POST /api/admin/uploads/images e GET/DELETE /:key. Tarefa 16 promove cópia durável, registra vínculo e compensa falhas SQL; staging não é fonte definitiva.
- 64 testes aprovados com decoder/filesystem/abort HTTP reais; nenhuma migration. Bloqueio MySQL anterior da 14 continua separado.

Preencher na tarefa 00; depois atualizar somente decisões novas/alteradas.
Histórico real anterior à adoção deste kit: `docs/backend-architecture-plan.md` e `docs/backend-handoff.md` na raiz do projeto. A tabela original abaixo permanece pendente de conciliação, não exige refazer o diagnóstico para a tarefa 14.

## Decisões da tarefa 14 — 08/10/2026
- Reutilizar backend ESM/Express/mysql2, auth ADMIN + 2FA, transações/auditoria/outbox existentes; npm e contratos `/api` preservados.
- Catálogo público só ATIVO, IDs/preços strings, paginação por ID; URL de reprodução restrita ao ADMIN.
- DELETE arquiva filmes e gêneros, preservando relações; migration mínima acrescenta status ao gênero (não aplicada).
- URLs de trailer/reprodução recebidas exigem HTTPS e host exato em CATALOG_MEDIA_HOSTS; sem fetch ou reprodução nesta etapa.
- Uploads/galerias ficam em 15/16. Aceite SQL bloqueado por ausência de TEST_DB_* e opt-in não produtivo; cenário preparado na suíte de identidade.

| Tema | Decisão e evidência |
| --- | --- |
| Raiz do backend / frontend | A identificar |
| Node / Express / MySQL / módulos | A identificar |
| Gerenciador / comandos start, lint, teste, migrations | A identificar no package.json |
| Prefixo, DTOs, erros, OpenAPI | Preservar contratos existentes; identificar |
| Migrations aplicadas / V4 | Conferir banco de desenvolvimento ou histórico |
| Dinheiro / BIGINT / datas / fuso | Definir representação exata e consistente |
| JWT, sessões, 2FA, CSRF, proxy e limites | Definir pelo ambiente real |
| Perfis, dono e vínculos operacionais | Mapear por endpoint/contexto |
| Reserva/estoque/pagamento/idempotência | Definir contratos antes do checkout |
| Provedores reais / ausentes | Registrar interfaces e bloqueios |

## Lacunas conhecidas nos anexos
- UNIQUE do assento em itens históricos impede revenda após cancelamento.
- Custos/parâmetros, promoções e benefícios não estão completamente persistidos.
- Convite ACEITO não representa saída, suspensão e mudança no ciclo seguinte.
- Métodos/pagamentos precisam tokenização, webhooks, idempotência e reembolsos.
- Idade/responsável, consentimentos, entrada/saída e suporte histórico exigem modelo.
- Status operacionais RF14 diferem dos financeiros; sessão atravessando meia-noite.
- Expiração/quantidade/finalidade dos tickets e vínculo da retirada de combo.
- 2FA precisa enrollment/desafio/replay e autenticação precisa revogação.
- nome_fantasia virou nome_cine; consultas antigas precisam ajuste.
- Galerias/newsletter já existem no V4; colunas geradas são somente leitura.
- Logs HTTP têm expurgo de 90 dias; retenção de negócio é decisão separada.

Registre solução/migration mínima e tarefa responsável por cada lacuna pertinente.

## Decisões da tarefa 19 — 08/10/2026

- Equipe vincula-se à sessão existente; não há FK direta para local. Supervisor próprio ou ADMIN gerencia; COLABORADOR só solicita para si ou aceita convite destinado a si. Função fica com quem autoriza a entrada. `equipe_entradas` guarda pendência/histórico e UNIQUE de pendência; membro só é criado ou reativado depois da decisão positiva. Chamados ficam na tarefa 20.

## Decisões da tarefa 20 — 08/10/2026

- Chamados internos ficam aninhados em `/api/teams/:id/chamados`, separados de suporte ao cliente; todo chamado novo recebe equipe e sessão correspondente. Legados sem equipe permanecem no banco, mas não aparecem nessas rotas.
- Atribuição mantém ABERTO; aceite do responsável ou de membro ativo quando livre muda para EM_ANDAMENTO. Responsável resolve, responsável ou gestor fecha. Exclusão elegível vira CANCELADO com histórico. A migration acrescenta FK composta equipe/sessão e `chamado_eventos`; não foi aplicada.

## Decisões da tarefa 21 — 08/10/2026

- Notificações não têm rota pública de emissão. Serviço interno exige conexão transacional e chave estável; UNIQUE por destinatário/chave preserva lida em retry. Convite de equipe usa `team-invitation:<id_entrada>` como primeiro consumidor. Fontes de notificação de cliente de RF23 aguardam os respectivos módulos, sem mensagens fictícias.

## Decisões da tarefa 22 — 08/10/2026

- Cadastro exige conta FORNECEDOR ativa e `id_usuario` imutável; DELETE marca INATIVO. DTO próprio omite dados da conta e CNPJ completo. ALTER legado fornece `nome_cine`; migration nova cria UNIQUE sobre CNPJ normalizado, inclusive alfanumérico vigente em 2026. Não há relação direta fornecedor-local: rotas de estoque/logística devem verificar as duas chaves nos recursos.

## Decisões da tarefa 23 — 08/10/2026

- A ausência de autorização explícita fornecedor-local foi resolvida por `fornecedor_locais` com concessão/revogação ADMIN. A conta FORNECEDOR determina o próprio escopo; criar/editar exige vínculo e local ativos. Produtos preservam fornecedor/local imutáveis.
- `quantidade` inicia em zero e não tem PATCH genérico; movimentos posteriores serão a única via de saldo. `preco` é preço de catálogo decimal, distinto de custo de aquisição ausente no schema. DELETE arquiva registros referenciados. Patrimônio opcional ganha UNIQUE após trim/uppercase; dados legados precisam de auditoria antes do ALTER.

## Decisões da tarefa 24 — 09/10/2026

- `combos.id_local` torna o local explícito para validar a composição; NULL preserva legados sem atribuição arbitrária, que ficam fora da consulta pública até saneamento. Cada insumo do combo deve estar disponível no mesmo local e ter fornecedor/vínculo operacional ativos.
- Combo já referenciado em `itens_pedido` não aceita PATCH nem substituição da composição; DELETE apenas arquiva. Fotos alternativas em `combos_imagens` não são variantes comerciais. O preço armazenado é base decimal; descontos/limite pertencem à tarefa 28, saldo/consumo à 26.

## Decisões da tarefa 25 — 09/10/2026

- Reutiliza storage/journal V4 em namespaces separados para insumos e combos. Staging de FORNECEDOR exige sidecar persistente com ID da conta; arquivos antigos sem sidecar falham fechados e precisam de reenvio. Galeria de insumo aceita ADMIN e fornecedor proprietário/vínculo ativo; combo permanece ADMIN. Escritas bloqueiam o pai e rebaixam PRINCIPAL anterior antes da promoção. Não há migration nova porque tabelas/UNIQUE V4 já estão no schema.

## Decisões da tarefa 26 — 09/10/2026

- `insumos.quantidade` permanece saldo físico; `quantidade_reservada` nova determina disponibilidade. Uma reserva por pedido/insumo agrega linhas de insumo e todos componentes de combo, com UNIQUE e transições ATIVA/CONSUMIDA/LIBERADA/COMPENSADA. Checkout futuro deve usar a mesma transação/conexão; nenhuma reserva pública é exposta antes da compra real.
- Movimentos manuais só alteram saldo físico disponível e usam quantidade assinada: ENTRADA/DEVOLUCAO positivas, SAIDA/PERDA negativas, AJUSTE em ambos os sentidos. Consumo e compensação vinculam movimento à reserva; liberação não cria movimento físico. Alerta de mínimo usa disponível <= mínimo, sem afirmar garantia de reposição.

## Decisões da tarefa 27 — 09/10/2026

- Solicitação referencia exatamente um item de origem e um local de destino; equipamento exige sessão. Fornecedor precisa de vínculo ativo com ambos os locais. Aprovação cria uma logística única por solicitação; envio debita insumo e recebimento o credita em linha do destino, ligada ao envio. Equipamento transfere a linha integralmente; origem/destino históricos ficam na logística.
- Devolução de equipamento exige recebimento e sessão ENCERRADA; registra uma única devolução e reatribui local de origem. O schema não prova uso real durante a sessão. Não há coordenadas/provider para RN11, logo `data_prevista` permanece sem ETA inventado.

## Decisões da tarefa 28 — 09/10/2026

- Cálculos financeiros usam centavos `BigInt`, percentuais em pontos-base e arredondamento half-up. Custos ausentes ficam NULL e bloqueiam cotação; preços publicados são atualizados explicitamente pelo ADMIN, e catálogo fora da base calculada torna a cotação não finalizável. Passo inicial de combo: 5% por item adicional, configurável e sujeito ao teto de 25%.
- Meia usa metade do preço cobrado do público em geral, com promoções públicas refletidas nessa base, sem acumular descontos pessoais. Pode ficar abaixo do custo unitário por direito legal; a projeção de margem é avaliada pela ocupação e 50% de meias. Prévia de meia não é elegibilidade comprovada e não permite `commit` sem sinal confiável do checkout futuro.
- Cupom não é consumido em cotação. A confirmação interna bloqueia o cupom, reserva uso por 15 minutos e grava snapshot imutável do pedido; pagamento/cancelamento futuro deve confirmar ou liberar a reserva. Benefício de plano só vale com cobrança PAGA/ISENTA da competência.

## Decisões da tarefa 29 — 09/10/2026

- A API recebe somente `setupReference` opaca de fluxo hospedado; o provider real emite token, marca e últimos quatro. Sem adaptador configurado, toda operação externa falha 503. Métodos legados sem token aparecem ao dono, mas são inelegíveis para cobrança.
- DELETE arquiva o método para preservar FKs financeiras. `pagamento_intencoes` registra antes do gateway a obrigação XOR, método, valor e chave única por pagador; retry idêntico retorna o registro original. Despacho externo/webhook ficam na tarefa 30, fora dos locks.

## Decisões da tarefa 30 — 10/10/2026

- O despacho passa a ENVIADA e cria `pagamentos` PENDENTE antes da chamada externa. Timeout ou resposta incerta não redisparam `create`; retentativa usa a intenção existente e `consult`. Retorno síncrono do provider não concede aprovação.
- O adaptador real valida assinatura criptográfica do corpo bruto com timestamp; eventos únicos persistidos são ordenados por instante. Aprovação financeira de obrigação cancelada/mutada gera `PAYMENT.APPROVAL_REVIEW` na auditoria/outbox, sem marcar pedido/cobrança como pago.

## Decisões da tarefa 31 — 10/10/2026

- Solicitação responde 202/RECEBIDA antes do gateway, com prazo de resposta de cinco dias registrado. Até sete dias, arrependimento/cancelamento solicita o saldo integral; demais motivos aguardam decisão ADMIN com versão atual dos Termos, fundamento e valor dentro do saldo. Não há fórmula presumida para anual proporcional.
- Refund sai fora do lock com chave estável; ENVIADA é conciliada por `consultRefund`, sem novo envio após timeout. Só CONFIRMED atualiza status financeiro; integral/parcial são distintos. Direitos, estoque, cupom e benefícios ficam explicitamente PENDENTES de compensação até integração do checkout/planos.
- Cancelamento do titular desliga renovação local e abre solicitação para cobrança própria paga. Mandato externo e cotas de outros participantes exigem os módulos de assinatura/participação; não declarar encerramento externo concluído.

## Decisões da tarefa 38 — 10/10/2026

- O plano designa explicitamente `id_combo_medio`: o schema de combos não classifica porte. O contrato congela oferta, preço, limite e descontos; editar/arquivar plano não retira benefício já pago. Assinaturas legadas sem snapshot mantêm a exigência de cobrança paga da competência.
- Contratação nova usa pagador titular, gera cobrança `PENDENTE` e trava a linha do usuário para serializar tentativas concorrentes. `autoRenew` registra escolha, sem prometer mandato ou próxima cobrança automática. Margem líquida mínima de 20% significa preço de pelo menos custo dividido por 0,8.
- Resgate grava `SOLICITADO` único por assinatura/competência. Retirada física, estoque e status `ENTREGUE` exigem implementação operacional; não são presumidos pela API.

## Decisões da tarefa 39 — 10/10/2026

- Limite contratado conta titular, participantes ativos/suspensos e convites pendentes. Suspensão retira benefícios, mas mantém vaga e responsabilidade financeira até saída ou tratamento da inadimplência; saída não modifica faturas existentes. Convites aceitos legados são incorporados como participantes pela migration 23.
- Mudança de modalidade requer aceite do titular e de todos os participantes atuais, inclusive suspensos. Entrada durante votação é bloqueada e saída cancela a proposta. Aprovada, fica agendada para a próxima competência; a geração efetiva de cobranças é da tarefa 40.
- Rateio ordena IDs numericamente e entrega os centavos excedentes aos primeiros, garantindo soma exata. A API mostra apenas cobrança do próprio pagador e avisa mudanças por notificação in-site transacional.
