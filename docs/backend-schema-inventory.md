# Inventário documental do schema v3 + V4

Prompt 00, 06/10/2026. **Não é dump do banco real nem certificação de migrations aplicadas.** Fonte integral: anexo `cineAstrasqlv4.txt`; DDL equivalente em `backend/migrations/20261001_02_create_tables.sql`, `20261001_03_create_table_logs.sql`, `20261001_04_update_alter_table_fornecedores.sql`, `20261006_alter_table_filmes.sql`. As migrations são a referência para tamanho/null/default exato de cada coluna antes de SQL de aplicação.

## Convenções e entidades (47)

PK simples abaixo é AUTO_INCREMENT; `I` = INT UNSIGNED, `B` = BIGINT UNSIGNED. FKs têm tipo do alvo; relações sem ON DELETE explícito preservam RESTRICT/NO ACTION, não CASCADE. Índices FK podem ser implícitos/reaproveitados pelo InnoDB, nome real exige SHOW CREATE/STATISTICS. DECIMAL de valores/preços (10,2), descontos (5,2). DATETIME técnico sem timezone embutido, DATE calendário e TIME horário; só logs tem DATETIME(3). BOOLEAN é TINYINT e não implica CHECK universal. Tabelas base dependem do default engine do servidor, V4 fixa InnoDB.

| Tabela / PK | Colunas funcionais além da PK | FKs -> tabela.coluna | UNIQUE / CHECK / particularidades |
| --- | --- | --- | --- |
| usuarios / id_usuario I | nome,email,senha,cpf,telefone,data_nascimento,tipo_usuario,status,data_cadastro | — | U email, cpf; hash não validado por SQL |
| enderecos / id_endereco I | id_usuario,cep,logradouro,numero,complemento,bairro,cidade,estado,principal | id_usuario -> usuarios.id_usuario | Sem principal único |
| contatos / id_contato I | id_usuario,tipo,valor,principal | id_usuario -> usuarios.id_usuario | Sem principal único |
| recuperacao_senha / id_recuperacao I | id_usuario,token,expiracao,utilizado | id_usuario -> usuarios.id_usuario | U token |
| autenticacao_2fa / id_2fa I | id_usuario,metodo,chave,ativo | id_usuario -> usuarios.id_usuario | Sem U usuário/método |
| preferencias_usuario / id_preferencia I | id_usuario,tema,tamanho_fonte,alto_contraste,modo_acessibilidade,idioma | id_usuario -> usuarios.id_usuario | U id_usuario |
| generos / id_genero I | nome | — | U nome |
| filmes / id_filme I | titulo,descricao,duracao,classificacao,data_lancamento,diretor,imagem,trailer,url_reproducao,disponivel_cinema,disponivel_streaming,preco_aluguel,preco_compra,dias_acesso_aluguel,status,data_cadastro | — | CHECK duração NULL ou >0, preços NULL ou >=0, dias NULL ou >0; url_reproducao NULL ou TRIM não vazio |
| filme_generos / (id_filme,id_genero) I/I | — | filme -> filmes.id_filme; genero -> generos.id_genero | PK composta, ambos CASCADE |
| locais / id_local I | nome,cep,logradouro,numero,complemento,bairro,cidade,estado,telefone,status,data_cadastro | — | Sem custos/coordenadas |
| salas / id_sala I | id_local,nome,capacidade,tipo,status | id_local -> locais.id_local | U(id_local,nome), CHECK capacidade>0 |
| assentos / id_assento I | id_sala,fileira,numero,tipo,status | id_sala -> salas.id_sala | U(id_sala,fileira,numero), CHECK numero>0 |
| sessoes / id_sessao I | id_filme,id_sala,data,horario_inicio,horario_fim,idioma,preco_inteira,status | filme -> filmes.id_filme; sala -> salas.id_sala | CHECK preco_inteira>=0; sem fim/data final explícita nem conflito de horários SQL |
| equipes / id_equipe I | id_supervisor,id_sessao,nome,status | supervisor -> usuarios.id_usuario; sessão -> sessoes.id_sessao | FK não garante perfil de supervisor |
| equipe_membros / id_equipe_membro I | id_equipe,id_usuario,funcao,data_entrada,status | equipe -> equipes.id_equipe; usuário -> usuarios.id_usuario | U(id_equipe,id_usuario) |
| chamados / id_chamado I | id_criador,id_responsavel,id_sessao,titulo,descricao,prioridade,status,data_abertura,data_fechamento | criador/responsável -> usuarios.id_usuario; sessão -> sessoes.id_sessao | Responsável/sessão nullable |
| notificacoes / id_notificacao B | id_usuario,titulo,mensagem,tipo,lida,data_envio | usuário -> usuarios.id_usuario | Sem chave de dedupe |
| fornecedores / id_fornecedor I | id_usuario,razao_social,nome_cine,cnpj,status,data_cadastro | usuário -> usuarios.id_usuario | U id_usuario, cnpj; nome_fantasia renomeado, não coexistência documental |
| insumos / id_insumo I | id_fornecedor,id_local,nome,descricao,categoria,quantidade,quantidade_minima,preco,status,data_cadastro | fornecedor -> fornecedores.id_fornecedor; local -> locais.id_local | CHECK quantidades>=0 inteiras, preço>=0 |
| equipamentos / id_equipamento I | id_fornecedor,id_local,nome,descricao,categoria,numero_patrimonio,quantidade,status,data_cadastro | fornecedor -> fornecedores.id_fornecedor; local -> locais.id_local | U numero_patrimonio nullable; CHECK quantidade>=0 |
| combos / id_combo I | nome,descricao,preco,ativo,data_cadastro | — | CHECK preco>=0; sem local |
| combo_itens / (id_combo,id_insumo) I/I | quantidade | combo -> combos.id_combo CASCADE; insumo -> insumos.id_insumo | PK composta; CHECK quantidade>0 |
| movimentacoes_estoque / id_movimentacao B | id_insumo,id_equipamento,id_usuario,tipo,quantidade,motivo,data_movimentacao | insumo -> insumos.id_insumo; equipamento -> equipamentos.id_equipamento; usuário -> usuarios.id_usuario | CHECK quantidade<>0; exatamente um insumo/equipamento; aceita quantidade negativa sem semântica SQL |
| solicitacoes_estoque / id_solicitacao I | id_usuario,id_local,id_sessao,id_insumo,id_equipamento,quantidade,status,observacao,data_solicitacao | usuário -> usuarios.id_usuario; local -> locais.id_local; sessão -> sessoes.id_sessao; insumo/equipamento -> respectivos IDs | CHECK quantidade>0, XOR insumo/equipamento |
| logistica / id_logistica I | id_fornecedor,id_local_origem,id_local_destino,id_solicitacao,data_envio,data_prevista,data_recebimento,status,observacao | fornecedor -> fornecedores.id_fornecedor; origem/destino -> locais.id_local; solicitação -> solicitacoes_estoque.id_solicitacao | Origem/solicitação nullable, sem mapeamento origem/destino de item |
| cupons / id_cupom I | codigo,desconto,validade,limite_uso,ativo | — | U codigo; CHECK desconto 0..100, limite_uso>=0 (0 ilimitado), sem uso/reserva persistido próprio |
| pedidos / id_pedido B | id_usuario,id_cupom,data_pedido,status,valor_total | usuário -> usuarios.id_usuario; cupom -> cupons.id_cupom | CHECK valor_total>=0 |
| itens_pedido / id_item B | id_pedido,id_insumo,id_combo,id_sessao,id_assento,id_filme,tipo_streaming,tipo_ingresso,quantidade,valor_unitario,subtotal | pedido -> pedidos.id_pedido B; demais -> insumos/combos/sessoes/assentos/filmes respectivos IDs I | U(id_sessao,id_assento); CHECK quantidade>0, sessão exige qtd=1, valores>=0, exatamente um produto/combinação válida, streaming exige tipo quando filme e NULL quando não filme; não garante sala do assento |
| tickets / id_ticket B | id_item,codigo,tipo,status,data_geracao,data_utilizacao | item -> itens_pedido.id_item B | U codigo; sem expiry/UNIQUE item/tipo |
| acessos_streaming / id_acesso B | id_item,id_usuario,id_filme,data_inicio,data_expiracao,status | item -> itens_pedido.id_item B; usuário/filme -> respectivos IDs I | U id_item; expiração NULL para compra |
| metodos_pagamento / id_metodo I | id_usuario,tipo,identificacao,principal | usuário -> usuarios.id_usuario | Sem token gateway/principal único |
| planos / id_plano I | nome,descricao,valor_mensal,valor_anual,desconto,limite_membros,valor_multa_atraso,ativo | — | Sem CHECK financeiro/limite; multa fixa não representa RN12 percentual |
| assinaturas / id_assinatura I | id_usuario,id_plano,inicio,fim,periodicidade,tipo_divisao,status,renovacao_automatica | usuário -> usuarios.id_usuario; plano -> planos.id_plano | Default ATIVA não é autorização para ativar sem pagamento |
| convites_plano / id_convite I | id_assinatura,id_usuario_convidado,status,data_convite,data_resposta | assinatura -> assinaturas.id_assinatura; usuário -> usuarios.id_usuario | U(id_assinatura,id_usuario_convidado), não associação de participante |
| assinatura_cobrancas / id_cobranca B | id_assinatura,id_usuario,competencia,valor_devido,valor_multa_aplicada,status,data_vencimento,data_pagamento | assinatura -> assinaturas.id_assinatura; usuário -> usuarios.id_usuario | U(assinatura,usuário,competência); CHECK valores>=0; dia 01 só comentário, não CHECK |
| pagamentos / id_pagamento B | id_pedido,id_cobranca,id_metodo,valor,status,data_pagamento,transacao_id | pedido -> pedidos.id_pedido B; cobrança -> assinatura_cobrancas.id_cobranca B; método -> metodos_pagamento.id_metodo I | CHECK valor>=0 e XOR pedido/cobrança; transacao_id não UNIQUE |
| suporte / id_suporte I | id_cliente,id_atendente,assunto,mensagem,resposta,status,data_abertura,data_fechamento | cliente/atendente -> usuarios.id_usuario | Sem conversa/histórico próprio |
| logs / id_log B | id_usuario,rota,metodo,ip_address,user_agent,status_code,tempo_resposta_ms,tamanho_resposta_bytes,data_hora,dados_requisicao,dados_resposta | usuário -> usuarios.id_usuario SET NULL | CHECK status 100..599; JSON nullable; DATETIME(3); expurgo descrito abaixo |
| filmes_imagens / id_imagem B | id_filme,tipo,url,texto_alternativo,ordem,principal,tipo_principal,data_cadastro | filme -> filmes.id_filme CASCADE | U(id_filme,tipo_principal); CHECK url TRIM não vazia, principal IN(0,1); gerada tipo_principal |
| insumos_imagens / id_imagem B | id_insumo,tipo,url,texto_alternativo,ordem,slot_principal,data_cadastro | insumo -> insumos.id_insumo CASCADE | U(id_insumo,slot_principal); CHECK url TRIM não vazia; gerada slot_principal |
| combos_imagens / id_imagem B | id_combo,tipo,url,texto_alternativo,ordem,slot_principal,data_cadastro | combo -> combos.id_combo CASCADE | U(id_combo,slot_principal); CHECK url TRIM não vazia; gerada slot_principal |
| newsletter_inscritos / id_inscrito I | id_usuario,email,nome,status,origem,versao_termo,consentimento_em,confirmado_em,descadastrado_em,data_cadastro,atualizado_em | usuário -> usuarios.id_usuario SET NULL | U email e usuário nullable; email utf8mb4_0900_as_ci; CHECK email/termo não vazios, ATIVO exige confirmação, DESCADASTRADO iff data descadastro não NULL, datas>=consentimento |
| newsletter_categorias / id_categoria I | codigo,nome,descricao,ativo | — | U codigo ascii_bin; CHECK ativo IN(0,1), código TRIM não vazio; seeds PROMOCOES/LANCAMENTOS/NOVIDADES |
| newsletter_preferencias / (id_inscrito,id_categoria) I/I | aceita,atualizado_em | inscrito -> newsletter_inscritos.id_inscrito CASCADE; categoria -> newsletter_categorias.id_categoria | PK composta; CHECK aceita IN(0,1) |
| newsletter_tokens / id_token B | id_inscrito,finalidade,token_hash,criado_em,expira_em,utilizado_em | inscrito -> newsletter_inscritos.id_inscrito CASCADE | U token_hash BINARY(32); CHECK expira>criado, utilizado NULL ou >=criado |
| newsletter_campanhas / id_campanha I | id_categoria,nome,assunto,conteudo_html,conteudo_texto,status,agendada_para,iniciada_em,concluida_em,data_cadastro,atualizado_em | categoria -> newsletter_categorias.id_categoria | HTML MEDIUMTEXT; CHECK assunto TRIM não vazio, AGENDADA exige data |
| newsletter_envios / id_envio B | id_campanha,id_inscrito,status,tentativas,ultima_tentativa_em,processando_desde,enviado_em,id_mensagem_provedor,ultimo_erro,data_cadastro,atualizado_em | campanha -> newsletter_campanhas.id_campanha; inscrito -> newsletter_inscritos.id_inscrito CASCADE | U(campanha,inscrito); CHECK ENVIADO exige data, PROCESSANDO exige lease |

## ENUMs completos

| Tabela.coluna | Valores |
| --- | --- |
| usuarios.tipo_usuario | ADMIN, FORNECEDOR, SUPERVISOR, COLABORADOR, CLIENTE |
| usuarios.status | ATIVO, INATIVO, BLOQUEADO, PENDENTE_VERIFICACAO |
| contatos.tipo | TELEFONE, WHATSAPP, EMAIL_SECUNDARIO |
| autenticacao_2fa.metodo | APP, SMS, EMAIL |
| preferencias_usuario.tema / tamanho_fonte | CLARO, ESCURO, SISTEMA / PEQUENO, MEDIO, GRANDE, MUITO_GRANDE |
| filmes.classificacao / status | L, 10, 12, 14, 16, 18 / ATIVO, INATIVO |
| locais.status | ATIVO, INATIVO, MANUTENCAO |
| salas.tipo / status | 2D, 3D, 4DX, VIP, IMAX / ATIVA, MANUTENCAO, INATIVA |
| assentos.tipo / status | COMUM, PCD, OBESO, IDOSO, CASAL / ATIVA, INATIVA |
| sessoes.idioma / status | DUBLADO, LEGENDADO, ORIGINAL / AGENDADA, EM_CARTAZ, ENCERRADA, CANCELADA |
| equipes.status / equipe_membros.status | ATIVA, FINALIZADA, CANCELADA / ATIVO, INATIVO |
| chamados.prioridade / status | BAIXA, MEDIA, ALTA, URGENTE / ABERTO, EM_ANDAMENTO, RESOLVIDO, FECHADO |
| fornecedores.status | ATIVO, INATIVO |
| insumos.status | DISPONIVEL, INDISPONIVEL |
| equipamentos.status | DISPONIVEL, MANUTENCAO, INDISPONIVEL |
| movimentacoes_estoque.tipo | ENTRADA, SAIDA, AJUSTE, PERDA, DEVOLUCAO |
| solicitacoes_estoque.status | PENDENTE, APROVADA, RECUSADA, FINALIZADA |
| logistica.status | PENDENTE, ENVIADO, EM_TRANSITO, RECEBIDO, CANCELADO |
| pedidos.status | EM_ANDAMENTO, AGUARDANDO_PAGAMENTO, PAGO, CANCELADO, FINALIZADO |
| itens_pedido.tipo_streaming / tipo_ingresso | ALUGUEL, COMPRA / INTEIRA, MEIA, ISENTA |
| tickets.tipo / status | INGRESSO_SESSAO, RETIRADA_INSUMO, ACESSO_STREAMING / GERADO, UTILIZADO, CANCELADO, EXPIRADO |
| acessos_streaming.status | ATIVO, EXPIRADO, REVOGADO |
| metodos_pagamento.tipo | CREDITO, DEBITO, PIX, BOLETO |
| assinaturas.periodicidade / tipo_divisao / status | MENSAL, ANUAL / TITULAR_PAGA, DIVISAO_IGUAL / ATIVA, CANCELADA, EXPIRADA, PENDENTE |
| convites_plano.status | PENDENTE, ACEITO, RECUSADO, EXPIRADO |
| assinatura_cobrancas.status | PENDENTE, PAGO, ATRASADO, ISENTO |
| pagamentos.status | PENDENTE, APROVADO, RECUSADO, ESTORNADO |
| suporte.status | ABERTO, EM_ATENDIMENTO, RESOLVIDO, FECHADO |
| filmes_imagens.tipo | CAPA, BANNER, ALTERNATIVA |
| insumos_imagens.tipo / combos_imagens.tipo | PRINCIPAL, ALTERNATIVA |
| newsletter_inscritos.status | PENDENTE, ATIVO, DESCADASTRADO, BLOQUEADO |
| newsletter_tokens.finalidade | CONFIRMACAO, DESCADASTRO |
| newsletter_campanhas.status | RASCUNHO, AGENDADA, ENVIANDO, CONCLUIDA, CANCELADA |
| newsletter_envios.status | PENDENTE, PROCESSANDO, ENVIADO, FALHOU, CANCELADO |

## Colunas geradas somente leitura

- `filmes_imagens.tipo_principal VARCHAR(20) STORED`: CASE principal=1 THEN tipo ELSE NULL. UNIQUE por filme/tipo principal; várias secundárias permitidas.
- `insumos_imagens.slot_principal` e `combos_imagens.slot_principal TINYINT STORED`: CASE tipo='PRINCIPAL' THEN 1 ELSE NULL. UNIQUE por pai/slot; alternativas ilimitadas pela estrutura.
- Não recebem INSERT/PATCH. Toda escrita da galeria bloqueia pai; trocar principal na mesma transação. `filmes.imagem` permanece legado e o backfill não sincroniza automaticamente.

## Índices explícitos além das PK/UNIQUE/FKs

| Nome | Tabela (colunas em ordem) |
| --- | --- |
| idx_usuarios_tipo | usuarios(tipo_usuario) |
| idx_sessoes_data_sala | sessoes(data,id_sala) |
| idx_pedidos_usuario_data / idx_pedidos_status | pedidos(id_usuario,data_pedido DESC) / pedidos(status) |
| idx_tickets_status | tickets(status) |
| idx_acessos_streaming_usuario_status | acessos_streaming(id_usuario,status) |
| idx_insumos_estoque_baixo | insumos(status,quantidade,quantidade_minima) |
| idx_movestoque_data | movimentacoes_estoque(data_movimentacao) |
| idx_assinaturas_status / idx_assinaturas_usuario_status | assinaturas(status) / assinaturas(id_usuario,status) |
| idx_cobrancas_vencimento_status | assinatura_cobrancas(data_vencimento,status) |
| idx_chamados_status_data | chamados(status,data_abertura) |
| idx_suporte_status | suporte(status,data_abertura) |
| idx_notificacoes_usuario_lida_data | notificacoes(id_usuario,lida,data_envio DESC) |
| idx_logistica_status | logistica(status) |
| idx_solicitacoes_status_data | solicitacoes_estoque(status,data_solicitacao) |
| idx_filme_generos_genero | filme_generos(id_genero,id_filme) |
| idx_logs_data_hora / idx_logs_usuario_data / idx_logs_status_data | logs(data_hora) / logs(id_usuario,data_hora) / logs(status_code,data_hora) |
| idx_filmes_imagens_galeria | filmes_imagens(id_filme,tipo,ordem,id_imagem) |
| idx_insumos_imagens_galeria | insumos_imagens(id_insumo,tipo,ordem,id_imagem) |
| idx_combos_imagens_galeria | combos_imagens(id_combo,tipo,ordem,id_imagem) |
| idx_newsletter_inscritos_status | newsletter_inscritos(status,id_inscrito) |
| idx_newsletter_preferencias_publico | newsletter_preferencias(id_categoria,aceita,id_inscrito) |
| idx_newsletter_tokens_inscrito / idx_newsletter_tokens_expiracao | newsletter_tokens(id_inscrito,finalidade,utilizado_em) / newsletter_tokens(expira_em) |
| idx_newsletter_campanhas_agendamento | newsletter_campanhas(status,agendada_para,id_campanha) |
| idx_newsletter_envios_fila / idx_newsletter_envios_recuperacao | newsletter_envios(status,id_campanha,id_envio) / newsletter_envios(status,processando_desde) |

`ev_logs_expurgo`: EVERY 15 MINUTE, ENABLE, DELETE logs data_hora < CURRENT_TIMESTAMP(3)-90 DAY ORDER BY data_hora ASC LIMIT 5000. Requer scheduler e privilégios/definer válidos; só presença no arquivo confirmada. Não criar partições/remover FKs com base nas recomendações comentadas. Comentários de crescimento não anulam retenção por finalidade nem autorizam expurgo financeiro.
