-- ================================================================================
-- CINEASTRA - DADOS DE TESTE (INSERTS) + SELECTS DE VERIFICACAO
-- ================================================================================
-- Referente ao schema cineastra_banco_dados_v3.txt. Este arquivo substitui e
-- estende o anterior (cineastra_dados_teste.txt): mesmos INSERTs, agora seguidos
-- de um bloco de SELECTs de verificação para cada tabela.

-- ORGANIZACAO PARA MIGRATIONS/SEEDS (futuro):
-- Os blocos abaixo (01 a 12) seguem a mesma numeração do schema. Ao separar em
-- pastas, a sugestão é:
--     seeds/01_usuarios_autenticacao.sql   <- INSERTs do Bloco 01
--     seeds/02_catalogo_filmes.sql         <- INSERTs do Bloco 02
--     ... (um arquivo de seed por bloco, na mesma ordem, por causa das FKs)
--     tests/01_usuarios_autenticacao.sql   <- SELECTs do Bloco 01
--     tests/02_catalogo_filmes.sql         <- SELECTs do Bloco 02
--     ...
-- Os SELECTs de cada bloco só devem rodar depois do respectivo seed (e dos
-- seeds anteriores, pelas FKs). Por isso a PARTE 2 inteira pressupõe que a
-- PARTE 1 inteira já foi executada.

-- Os IDs nascem 1, 2, 3... na ordem de inserção (tabelas vazias) e os
-- comentários indicam qual ID cada linha assume, para referência nos FKs.
-- ================================================================================

-- USE cineastra;


-- ################################################################################
-- # PARTE 1 - INSERTS DE TESTE
-- ################################################################################

-- ============================================================================
-- BLOCO 01 - USUARIOS E AUTENTICACAO
-- ============================================================================

-- id_usuario: 1=Ana Paula(ADMIN) 2=Carlos(FORNECEDOR) 3=Fernanda(FORNECEDOR)
-- 4=Rafael(SUPERVISOR) 5=Juliana(COLABORADOR) 6=Bruno(COLABORADOR)
-- 7=Mariana(CLIENTE) 8=Pedro(CLIENTE) 9=Camila(CLIENTE)
INSERT INTO usuarios (nome, email, senha, cpf, telefone, data_nascimento, tipo_usuario, status) VALUES
('Ana Paula Ribeiro', 'ana.ribeiro@cineastra.com', '$2a$12$hashexemplo0000000000000000000000000000000000000001', '111.222.333-01', '11988880001', '1985-03-12', 'ADMIN', 'ATIVO'),
('Carlos Eduardo Lima', 'carlos.lima@pipocaprime.com', '$2a$12$hashexemplo0000000000000000000000000000000000000002', '111.222.333-02', '11988880002', '1980-07-22', 'FORNECEDOR', 'ATIVO'),
('Fernanda Souza Martins', 'fernanda.martins@techcine.com', '$2a$12$hashexemplo0000000000000000000000000000000000000003', '111.222.333-03', '11988880003', '1983-11-05', 'FORNECEDOR', 'ATIVO'),
('Rafael Augusto Torres', 'rafael.torres@cineastra.com', '$2a$12$hashexemplo0000000000000000000000000000000000000004', '111.222.333-04', '11988880004', '1990-01-18', 'SUPERVISOR', 'ATIVO'),
('Juliana Pereira Costa', 'juliana.costa@cineastra.com', '$2a$12$hashexemplo0000000000000000000000000000000000000005', '111.222.333-05', '11988880005', '1998-05-30', 'COLABORADOR', 'ATIVO'),
('Bruno Henrique Alves', 'bruno.alves@cineastra.com', '$2a$12$hashexemplo0000000000000000000000000000000000000006', '111.222.333-06', '11988880006', '1999-09-09', 'COLABORADOR', 'ATIVO'),
('Mariana Oliveira Santos', 'mariana.santos@gmail.com', '$2a$12$hashexemplo0000000000000000000000000000000000000007', '111.222.333-07', '11988880007', '1995-02-14', 'CLIENTE', 'ATIVO'),
('Pedro Henrique Gomes', 'pedro.gomes@gmail.com', '$2a$12$hashexemplo0000000000000000000000000000000000000008', '111.222.333-08', '11988880008', '1992-06-25', 'CLIENTE', 'ATIVO'),
('Camila Fernandes Rocha', 'camila.rocha@gmail.com', '$2a$12$hashexemplo0000000000000000000000000000000000000009', '111.222.333-09', '11988880009', '1997-12-03', 'CLIENTE', 'PENDENTE_VERIFICACAO');

-- id_endereco: 1=Ana(usuario1) 2=Mariana(usuario7) 3=Pedro(usuario8)
INSERT INTO enderecos (id_usuario, cep, logradouro, numero, complemento, bairro, cidade, estado, principal) VALUES
(1, '01310-100', 'Avenida Paulista', '1000', 'Apto 101', 'Bela Vista', 'São Paulo', 'SP', TRUE),
(7, '09015-000', 'Rua das Palmeiras', '250', NULL, 'Centro', 'Santo André', 'SP', TRUE),
(8, '04538-133', 'Rua Fidêncio Ramos', '302', 'Bloco B', 'Vila Olímpia', 'São Paulo', 'SP', TRUE);

-- id_contato: 1=Ana 2=Mariana 3=Pedro
INSERT INTO contatos (id_usuario, tipo, valor, principal) VALUES
(1, 'WHATSAPP', '11988880001', TRUE),
(7, 'WHATSAPP', '11988880007', TRUE),
(8, 'WHATSAPP', '11988880008', TRUE);

-- id_recuperacao: 1=Pedro (token já utilizado)
INSERT INTO recuperacao_senha (id_usuario, token, expiracao, utilizado) VALUES
(8, 'f3a9c1d2-rec-token-exemplo-0001', '2026-08-20 10:00:00', TRUE);

-- id_2fa: 1=Ana(ADMIN) 2=Rafael(SUPERVISOR) — obrigatório para perfis administrativos
INSERT INTO autenticacao_2fa (id_usuario, metodo, chave, ativo) VALUES
(1, 'APP', 'TOTP-SECRET-EXEMPLO-ANA', TRUE),
(4, 'APP', 'TOTP-SECRET-EXEMPLO-RAFAEL', TRUE);

-- id_preferencia: 1=Mariana 2=Pedro 3=Camila
INSERT INTO preferencias_usuario (id_usuario, tema, tamanho_fonte, alto_contraste, modo_acessibilidade, idioma) VALUES
(7, 'ESCURO', 'MEDIO', FALSE, FALSE, 'pt-BR'),
(8, 'SISTEMA', 'GRANDE', FALSE, TRUE, 'pt-BR'),
(9, 'CLARO', 'MUITO_GRANDE', TRUE, TRUE, 'pt-BR');


-- ============================================================================
-- BLOCO 02 - CATALOGO DE FILMES
-- ============================================================================

-- id_genero: 1=Ação 2=Comédia 3=Drama 4=Ficção Científica 5=Terror 6=Animação
INSERT INTO generos (nome) VALUES
('Ação'), ('Comédia'), ('Drama'), ('Ficção Científica'), ('Terror'), ('Animação');

-- id_filme: 1=Órbita Selvagem 2=Risadas em Fuga 3=Sombra Eterna 4=Pequenos Heróis 5=Noite sem Fim
INSERT INTO filmes (titulo, descricao, duracao, classificacao, data_lancamento, diretor, imagem, trailer, disponivel_cinema, disponivel_streaming, preco_aluguel, preco_compra, dias_acesso_aluguel, status) VALUES
('Órbita Selvagem', 'Uma tripulação precisa sobreviver após perder contato com a Terra.', 128, '12', '2026-08-15', 'Luiz Ferraz', '/img/orbita-selvagem.jpg', '/trailer/orbita-selvagem.mp4', TRUE, FALSE, NULL, NULL, NULL, 'ATIVO'),
('Risadas em Fuga', 'Dois amigos se envolvem em uma trapalhada ao tentar organizar um casamento.', 95, 'L', '2026-07-01', 'Camila Dutra', '/img/risadas-em-fuga.jpg', '/trailer/risadas-em-fuga.mp4', TRUE, TRUE, 9.90, 24.90, 5, 'ATIVO'),
('Sombra Eterna', 'Uma família se muda para uma casa antiga com um passado sombrio.', 110, '16', '2026-09-10', 'Thiago Moraes', '/img/sombra-eterna.jpg', '/trailer/sombra-eterna.mp4', TRUE, FALSE, NULL, NULL, NULL, 'ATIVO'),
('Pequenos Heróis', 'Um grupo de animais da floresta se une para salvar seu lar.', 90, 'L', '2026-06-20', 'Renata Blum', '/img/pequenos-herois.jpg', '/trailer/pequenos-herois.mp4', TRUE, TRUE, 7.90, 19.90, 7, 'ATIVO'),
('Noite sem Fim', 'Um drama sobre reencontros e segundas chances, lançado direto no streaming.', 105, '14', '2026-05-05', 'Felipe Andrade', '/img/noite-sem-fim.jpg', '/trailer/noite-sem-fim.mp4', FALSE, TRUE, 6.90, 17.90, 5, 'ATIVO');

INSERT INTO filme_generos (id_filme, id_genero) VALUES
(1, 4), (1, 1),
(2, 2),
(3, 5),
(4, 6), (4, 2),
(5, 3);


-- ============================================================================
-- BLOCO 03 - LOCAIS, SALAS E ASSENTOS
-- ============================================================================

-- id_local: 1=Shopping Central (São Paulo) 2=Shopping ABC (Santo André)
INSERT INTO locais (nome, cep, logradouro, numero, complemento, bairro, cidade, estado, telefone, status) VALUES
('CineAstra Shopping Central', '01310-200', 'Avenida Paulista', '1500', 'Piso L3', 'Bela Vista', 'São Paulo', 'SP', '1132220001', 'ATIVO'),
('CineAstra Shopping ABC', '09015-100', 'Rua Senador Flaquer', '300', 'Piso 2', 'Centro', 'Santo André', 'SP', '1142330002', 'ATIVO');

-- id_sala: 1=Sala 1(local1) 2=Sala 2(local1) 3=Sala 1(local2) 4=Sala VIP(local2)
INSERT INTO salas (id_local, nome, capacidade, tipo, status) VALUES
(1, 'Sala 1', 120, '2D', 'ATIVA'),
(1, 'Sala 2', 80, '3D', 'ATIVA'),
(2, 'Sala 1', 100, '2D', 'ATIVA'),
(2, 'Sala VIP', 40, 'VIP', 'ATIVA');

-- id_assento: 1..10, todos da sala 1 (local1) — fileiras A e B
INSERT INTO assentos (id_sala, fileira, numero, tipo, status) VALUES
(1, 'A', 1, 'COMUM', 'ATIVA'),
(1, 'A', 2, 'COMUM', 'ATIVA'),
(1, 'A', 3, 'PCD', 'ATIVA'),
(1, 'A', 4, 'COMUM', 'ATIVA'),
(1, 'A', 5, 'COMUM', 'ATIVA'),
(1, 'B', 1, 'COMUM', 'ATIVA'),
(1, 'B', 2, 'COMUM', 'ATIVA'),
(1, 'B', 3, 'COMUM', 'ATIVA'),
(1, 'B', 4, 'IDOSO', 'ATIVA'),
(1, 'B', 5, 'COMUM', 'ATIVA');


-- ============================================================================
-- BLOCO 04 - SESSOES
-- ============================================================================

-- id_sessao: 1=Órbita(sala1) 2=Risadas(sala2) 3=Sombra(sala3) 4=Pequenos Heróis(sala4)
INSERT INTO sessoes (id_filme, id_sala, data, horario_inicio, horario_fim, idioma, preco_inteira, status) VALUES
(1, 1, '2026-10-05', '19:00:00', '21:10:00', 'LEGENDADO', 32.00, 'EM_CARTAZ'),
(2, 2, '2026-10-05', '20:00:00', '21:45:00', 'DUBLADO', 28.00, 'EM_CARTAZ'),
(3, 3, '2026-10-06', '22:00:00', '23:50:00', 'LEGENDADO', 30.00, 'AGENDADA'),
(4, 4, '2026-10-06', '16:00:00', '17:40:00', 'DUBLADO', 45.00, 'AGENDADA');


-- ============================================================================
-- BLOCO 05 - EQUIPES E CHAMADOS INTERNOS (STAFF)
-- ============================================================================

-- id_equipe: 1=Equipe Sessão 1  2=Equipe Sessão 2
INSERT INTO equipes (id_supervisor, id_sessao, nome, status) VALUES
(4, 1, 'Equipe Bilheteria - Sessão 1', 'ATIVA'),
(4, 2, 'Equipe Sala 2', 'ATIVA');

INSERT INTO equipe_membros (id_equipe, id_usuario, funcao, data_entrada, status) VALUES
(1, 5, 'Bilheteria', '2026-09-01', 'ATIVO'),
(1, 6, 'Segurança', '2026-09-01', 'ATIVO'),
(2, 5, 'Operador de Sala', '2026-09-15', 'ATIVO');

INSERT INTO chamados (id_criador, id_responsavel, id_sessao, titulo, descricao, prioridade, status, data_fechamento) VALUES
(5, 4, 1, 'Projetor com ruído na Sala 1', 'Durante os testes pré-sessão foi identificado um ruído intermitente no projetor.', 'ALTA', 'EM_ANDAMENTO', NULL),
(6, NULL, NULL, 'Solicitação de treinamento de atendimento', 'Equipe de bilheteria pede reciclagem sobre o novo fluxo de meia-entrada.', 'BAIXA', 'ABERTO', NULL);

INSERT INTO notificacoes (id_usuario, titulo, mensagem, tipo, lida, data_envio) VALUES
(7, 'Pedido confirmado', 'Seu pedido #1 foi confirmado e o pagamento aprovado.', 'PEDIDO', FALSE, '2026-09-28 19:35:00'),
(8, 'Aluguel de streaming liberado', 'Seu acesso a "Risadas em Fuga" já está disponível.', 'STREAMING', FALSE, '2026-09-28 20:10:00'),
(9, 'Convite de assinatura compartilhada', 'Mariana Santos convidou você para o plano CineAstra Família.', 'ASSINATURA', TRUE, '2026-07-16 09:00:00');


-- ============================================================================
-- BLOCO 06 - FORNECEDORES, INSUMOS, EQUIPAMENTOS E COMBOS
-- ============================================================================

-- id_fornecedor: 1=Pipoca Prime(usuario2) 2=TechCine(usuario3)
INSERT INTO fornecedores (id_usuario, razao_social, nome_fantasia, cnpj, status) VALUES
(2, 'Distribuidora Pipoca Prime Ltda', 'Pipoca Prime', '12.345.678/0001-90', 'ATIVO'),
(3, 'TechCine Equipamentos Audiovisuais Ltda', 'TechCine', '98.765.432/0001-10', 'ATIVO');

-- id_insumo: 1=Pipoca 2=Refrigerante 3=Nachos(abaixo do mínimo) 4=Água
INSERT INTO insumos (id_fornecedor, id_local, nome, descricao, categoria, quantidade, quantidade_minima, preco, status) VALUES
(1, 1, 'Pipoca Grande', 'Balde de pipoca salgada 1,5L', 'Alimentos', 500, 100, 18.00, 'DISPONIVEL'),
(1, 1, 'Refrigerante 500ml', 'Refrigerante lata/copo 500ml, sabores variados', 'Bebidas', 800, 150, 9.50, 'DISPONIVEL'),
(1, 1, 'Nachos com Cheddar', 'Porção de nachos com molho cheddar', 'Alimentos', 50, 60, 22.00, 'DISPONIVEL'),
(1, 1, 'Água Mineral 500ml', 'Água mineral sem gás', 'Bebidas', 300, 80, 6.00, 'DISPONIVEL');

-- id_equipamento: 1=Projetor 2=Som(manutenção) 3=Óculos 3D
INSERT INTO equipamentos (id_fornecedor, id_local, nome, descricao, categoria, numero_patrimonio, quantidade, status) VALUES
(2, 1, 'Projetor Laser 4K', 'Projetor digital laser 4K HDR', 'Projeção', 'PAT-PROJ-0001', 2, 'DISPONIVEL'),
(2, 1, 'Sistema de Som Dolby Atmos', 'Receiver e caixas de som Dolby Atmos', 'Áudio', 'PAT-SOM-0002', 1, 'MANUTENCAO'),
(2, 2, 'Óculos 3D (par)', 'Óculos para sessões 3D, lote de reposição', 'Acessórios', 'PAT-OCUL-0003', 150, 'DISPONIVEL');

-- id_combo: 1=Combo Casal 2=Combo Solo
INSERT INTO combos (nome, descricao, preco, ativo) VALUES
('Combo Casal', 'Pipoca grande + 2 refrigerantes', 45.00, TRUE),
('Combo Solo', 'Pipoca grande + 1 refrigerante', 28.00, TRUE);

INSERT INTO combo_itens (id_combo, id_insumo, quantidade) VALUES
(1, 1, 1),
(1, 2, 2),
(2, 1, 1),
(2, 2, 1);


-- ============================================================================
-- BLOCO 07 - ESTOQUE (MOVIMENTACOES E SOLICITACOES)
-- ============================================================================

INSERT INTO movimentacoes_estoque (id_insumo, id_equipamento, id_usuario, tipo, quantidade, motivo, data_movimentacao) VALUES
(1, NULL, 5, 'ENTRADA', 500, 'Reposição inicial de estoque', '2026-09-01 08:00:00'),
(3, NULL, 5, 'SAIDA', 10, 'Venda de combos no fim de semana', '2026-09-27 22:30:00'),
(NULL, 2, 4, 'AJUSTE', 1, 'Equipamento enviado para manutenção preventiva', '2026-09-20 10:00:00');

-- id_solicitacao: 1=requisição de projetor para a sessão 1
INSERT INTO solicitacoes_estoque (id_usuario, id_local, id_sessao, id_insumo, id_equipamento, quantidade, status, observacao) VALUES
(4, 1, 1, NULL, 1, 1, 'APROVADA', 'Necessário para exibição da sessão 1 na Sala 1.');


-- ============================================================================
-- BLOCO 08 - LOGISTICA
-- ============================================================================

-- id_local_origem NULL = estoque físico do próprio fornecedor (não cadastrado em locais)
INSERT INTO logistica (id_fornecedor, id_local_origem, id_local_destino, id_solicitacao, data_envio, data_prevista, data_recebimento, status, observacao) VALUES
(2, NULL, 1, 1, '2026-09-30 09:00:00', '2026-10-01 18:00:00', NULL, 'EM_TRANSITO', 'Entrega do projetor reserva para a Sala 1.');


-- ============================================================================
-- BLOCO 09 - CUPONS
-- ============================================================================

INSERT INTO cupons (codigo, desconto, validade, limite_uso, ativo) VALUES
('BEMVINDO10', 10.00, '2026-12-31', 100, TRUE),
('CINEASTRA20', 20.00, '2026-11-30', 0, TRUE);


-- ============================================================================
-- BLOCO 10 - PEDIDOS, INGRESSOS E STREAMING
-- ============================================================================

-- id_pedido: 1=Mariana(com cupom) 2=Pedro
INSERT INTO pedidos (id_usuario, id_cupom, data_pedido, status, valor_total) VALUES
(7, 1, '2026-09-28 19:30:00', 'PAGO', 83.70),
(8, NULL, '2026-09-28 20:05:00', 'PAGO', 21.90);

-- id_item: 1=ingresso meia(A3) 2=ingresso inteira(A4) 3=combo casal 4=streaming aluguel 5=água avulsa
INSERT INTO itens_pedido (id_pedido, id_insumo, id_combo, id_sessao, id_assento, id_filme, tipo_streaming, tipo_ingresso, quantidade, valor_unitario, subtotal) VALUES
(1, NULL, NULL, 1, 3, NULL, NULL, 'MEIA', 1, 16.00, 16.00),
(1, NULL, NULL, 1, 4, NULL, NULL, 'INTEIRA', 1, 32.00, 32.00),
(1, NULL, 1, NULL, NULL, NULL, NULL, 'INTEIRA', 1, 45.00, 45.00),
(2, NULL, NULL, NULL, NULL, 2, 'ALUGUEL', 'INTEIRA', 1, 9.90, 9.90),
(2, 4, NULL, NULL, NULL, NULL, NULL, 'INTEIRA', 2, 6.00, 12.00);

-- id_ticket: 1,2=ingressos sessão 3=retirada combo 4=acesso streaming 5=retirada água
INSERT INTO tickets (id_item, codigo, tipo, status, data_utilizacao) VALUES
(1, 'CINE-INGR-00001', 'INGRESSO_SESSAO', 'GERADO', NULL),
(2, 'CINE-INGR-00002', 'INGRESSO_SESSAO', 'GERADO', NULL),
(3, 'CINE-RET-00001', 'RETIRADA_INSUMO', 'GERADO', NULL),
(4, 'CINE-STREAM-00001', 'ACESSO_STREAMING', 'UTILIZADO', '2026-09-29 21:00:00'),
(5, 'CINE-RET-00002', 'RETIRADA_INSUMO', 'GERADO', NULL);

-- id_acesso: 1=Pedro assistindo Risadas em Fuga (aluguel de 5 dias)
INSERT INTO acessos_streaming (id_item, id_usuario, id_filme, data_inicio, data_expiracao, status) VALUES
(4, 8, 2, '2026-09-28 20:10:00', '2026-10-03 20:10:00', 'ATIVO');


-- ============================================================================
-- BLOCO 11 - PLANOS, ASSINATURAS E PAGAMENTOS
-- ============================================================================

-- id_metodo: 1=Mariana(PIX) 2=Pedro(CREDITO)
INSERT INTO metodos_pagamento (id_usuario, tipo, identificacao, principal) VALUES
(7, 'PIX', 'Chave Pix via CPF', TRUE),
(8, 'CREDITO', 'Cartão final 4242', TRUE);

-- id_plano: 1=Solo 2=Família
INSERT INTO planos (nome, descricao, valor_mensal, valor_anual, desconto, limite_membros, valor_multa_atraso, ativo) VALUES
('CineAstra Solo', 'Assinatura individual com benefícios em ingressos e streaming.', 19.90, 199.00, 0.00, 1, 5.00, TRUE),
('CineAstra Família', 'Assinatura compartilhável com até 4 perfis.', 39.90, 399.00, 5.00, 4, 8.00, TRUE);

-- id_assinatura: 1=Mariana titular do plano Família, divisão igual
INSERT INTO assinaturas (id_usuario, id_plano, inicio, fim, periodicidade, tipo_divisao, status, renovacao_automatica) VALUES
(7, 2, '2026-07-15', NULL, 'MENSAL', 'DIVISAO_IGUAL', 'ATIVA', TRUE);

-- id_convite: 1=Camila aceitou o convite da assinatura de Mariana
INSERT INTO convites_plano (id_assinatura, id_usuario_convidado, status, data_convite, data_resposta) VALUES
(1, 9, 'ACEITO', '2026-07-16 09:00:00', '2026-07-16 14:20:00');

-- id_cobranca: 1=Mariana(paga) 2=Camila(atrasada, com multa)
INSERT INTO assinatura_cobrancas (id_assinatura, id_usuario, competencia, valor_devido, valor_multa_aplicada, status, data_vencimento, data_pagamento) VALUES
(1, 7, '2026-09-01', 19.95, 0.00, 'PAGO', '2026-09-10', '2026-09-08 11:00:00'),
(1, 9, '2026-09-01', 19.95, 2.00, 'ATRASADO', '2026-09-10', NULL);

-- id_pagamento: 1=pedido1 2=pedido2 3=cobrança de Mariana (cobrança de Camila segue em aberto, sem pagamento)
INSERT INTO pagamentos (id_pedido, id_cobranca, id_metodo, valor, status, data_pagamento, transacao_id) VALUES
(1, NULL, 1, 83.70, 'APROVADO', '2026-09-28 19:31:00', 'TXN-0000000001'),
(2, NULL, 2, 21.90, 'APROVADO', '2026-09-28 20:06:00', 'TXN-0000000002'),
(NULL, 1, 1, 19.95, 'APROVADO', '2026-09-08 11:00:00', 'TXN-0000000003');


-- ============================================================================
-- BLOCO 12 - SUPORTE AO CLIENTE
-- ============================================================================

INSERT INTO suporte (id_cliente, id_atendente, assunto, mensagem, resposta, status, data_fechamento) VALUES
(8, NULL, 'Dúvida sobre aluguel de streaming', 'Por quantos dias fico com acesso ao filme alugado?', NULL, 'ABERTO', NULL),
(7, 5, 'Problema ao aplicar cupom', 'O cupom BEMVINDO10 não aplicou o desconto no primeiro pedido.', 'Verificamos e o desconto foi aplicado corretamente no valor final. Qualquer dúvida estamos à disposição.', 'RESOLVIDO', '2026-09-29 15:00:00');



################################################################################
# PARTE 2 - SELECTS DE VERIFICACAO
# Um SELECT * por tabela (conferir se o INSERT do bloco correspondente
# gravou o número de linhas esperado) + algumas consultas de checagem
# cruzada para confirmar que os dados fazem sentido entre si.
################################################################################

-- ============================================================================
-- BLOCO 01 - USUARIOS E AUTENTICACAO (esperado: 9,3,3,1,2,3 linhas)
-- ============================================================================

SELECT * FROM usuarios ORDER BY id_usuario;
SELECT * FROM enderecos ORDER BY id_endereco;
SELECT * FROM contatos ORDER BY id_contato;
SELECT * FROM recuperacao_senha ORDER BY id_recuperacao;
SELECT * FROM autenticacao_2fa ORDER BY id_2fa;
SELECT * FROM preferencias_usuario ORDER BY id_preferencia;

-- teste: todo ADMIN/SUPERVISOR deve ter 2FA ativo (regra de negócio validada na aplicação)
SELECT u.id_usuario, u.nome, u.tipo_usuario, af.ativo AS tem_2fa_ativo
FROM usuarios u
LEFT JOIN autenticacao_2fa af ON af.id_usuario = u.id_usuario
WHERE u.tipo_usuario IN ('ADMIN','SUPERVISOR');


-- ============================================================================
-- BLOCO 02 - CATALOGO DE FILMES (esperado: 6,5,7 linhas)
-- ============================================================================

SELECT * FROM generos ORDER BY id_genero;
SELECT * FROM filmes ORDER BY id_filme;
SELECT * FROM filme_generos ORDER BY id_filme, id_genero;

-- teste: filmes com seus gêneros concatenados
SELECT f.id_filme, f.titulo, GROUP_CONCAT(g.nome ORDER BY g.nome SEPARATOR ', ') AS generos
FROM filmes f
LEFT JOIN filme_generos fg ON fg.id_filme = f.id_filme
LEFT JOIN generos g ON g.id_genero = fg.id_genero
GROUP BY f.id_filme;


-- ============================================================================
-- BLOCO 03 - LOCAIS, SALAS E ASSENTOS (esperado: 2,4,10 linhas)
-- ============================================================================

SELECT * FROM locais ORDER BY id_local;
SELECT * FROM salas ORDER BY id_sala;
SELECT * FROM assentos ORDER BY id_assento;

-- teste: quantidade de assentos cadastrados por sala
SELECT id_sala, COUNT(*) AS total_assentos FROM assentos GROUP BY id_sala;


-- ============================================================================
-- BLOCO 04 - SESSOES (esperado: 4 linhas)
-- ============================================================================

SELECT * FROM sessoes ORDER BY id_sessao;

-- teste: sessões com filme/sala/local já resolvidos (como a tela de cartaz veria)
SELECT s.id_sessao, f.titulo, sa.nome AS sala, l.nome AS local,
       s.data, s.horario_inicio, s.idioma, s.preco_inteira, s.status
FROM sessoes s
JOIN filmes f ON f.id_filme = s.id_filme
JOIN salas sa ON sa.id_sala = s.id_sala
JOIN locais l ON l.id_local = sa.id_local
ORDER BY s.data, s.horario_inicio;


-- ============================================================================
-- BLOCO 05 - EQUIPES E CHAMADOS INTERNOS (esperado: 2,3,2,3 linhas)
-- ============================================================================

SELECT * FROM equipes ORDER BY id_equipe;
SELECT * FROM equipe_membros ORDER BY id_equipe_membro;
SELECT * FROM chamados ORDER BY id_chamado;
SELECT * FROM notificacoes ORDER BY id_notificacao;

-- teste: membros de cada equipe, com nome do colaborador e da sessão
SELECT eq.nome AS equipe, u.nome AS membro, em.funcao, s.id_sessao
FROM equipe_membros em
JOIN equipes eq ON eq.id_equipe = em.id_equipe
JOIN usuarios u ON u.id_usuario = em.id_usuario
JOIN sessoes s ON s.id_sessao = eq.id_sessao
ORDER BY eq.id_equipe;


-- ============================================================================
-- BLOCO 06 - FORNECEDORES, INSUMOS, EQUIPAMENTOS E COMBOS (esperado: 2,4,3,2,4 linhas)
-- ============================================================================

SELECT * FROM fornecedores ORDER BY id_fornecedor;
SELECT * FROM insumos ORDER BY id_insumo;
SELECT * FROM equipamentos ORDER BY id_equipamento;
SELECT * FROM combos ORDER BY id_combo;
SELECT * FROM combo_itens ORDER BY id_combo, id_insumo;

-- teste: insumo abaixo do mínimo (deve retornar "Nachos com Cheddar")
SELECT id_insumo, nome, quantidade, quantidade_minima
FROM insumos
WHERE quantidade <= quantidade_minima;

-- teste: composição de cada combo em insumos
SELECT c.nome AS combo, i.nome AS insumo, ci.quantidade
FROM combo_itens ci
JOIN combos c ON c.id_combo = ci.id_combo
JOIN insumos i ON i.id_insumo = ci.id_insumo
ORDER BY c.id_combo;


-- ============================================================================
-- BLOCO 07 - ESTOQUE (esperado: 3,1 linhas)
-- ============================================================================

SELECT * FROM movimentacoes_estoque ORDER BY id_movimentacao;
SELECT * FROM solicitacoes_estoque ORDER BY id_solicitacao;


-- ============================================================================
-- BLOCO 08 - LOGISTICA (esperado: 1 linha)
-- ============================================================================

SELECT * FROM logistica ORDER BY id_logistica;


-- ============================================================================
-- BLOCO 09 - CUPONS (esperado: 2 linhas)
-- ============================================================================

SELECT * FROM cupons ORDER BY id_cupom;


-- ============================================================================
-- BLOCO 10 - PEDIDOS, INGRESSOS E STREAMING (esperado: 2,5,5,1 linhas)
-- ============================================================================

SELECT * FROM pedidos ORDER BY id_pedido;
SELECT * FROM itens_pedido ORDER BY id_item;
SELECT * FROM tickets ORDER BY id_ticket;
SELECT * FROM acessos_streaming ORDER BY id_acesso;

-- teste: a soma dos itens de cada pedido deve bater com valor_total (pedido 1 já considera o cupom de 10%)
SELECT p.id_pedido, p.valor_total AS valor_total_pedido, SUM(ip.subtotal) AS soma_itens
FROM pedidos p
JOIN itens_pedido ip ON ip.id_pedido = p.id_pedido
GROUP BY p.id_pedido;

-- teste: nenhum assento pode se repetir na mesma sessão (confirma a uk_sessao_assento) — deve voltar vazio
SELECT id_sessao, id_assento, COUNT(*) AS ocorrencias
FROM itens_pedido
WHERE id_sessao IS NOT NULL
GROUP BY id_sessao, id_assento
HAVING COUNT(*) > 1;

-- teste: assentos livres restantes da sessão 1 (deve excluir A3 e A4, já vendidos)
SELECT a.id_assento, a.fileira, a.numero
FROM assentos a
WHERE a.id_sala = (SELECT id_sala FROM sessoes WHERE id_sessao = 1)
  AND a.id_assento NOT IN (
      SELECT ip.id_assento FROM itens_pedido ip
      WHERE ip.id_sessao = 1 AND ip.id_assento IS NOT NULL
  );


-- ============================================================================
-- BLOCO 11 - PLANOS, ASSINATURAS E PAGAMENTOS (esperado: 2,2,1,1,2,3 linhas)
-- ============================================================================

SELECT * FROM metodos_pagamento ORDER BY id_metodo;
SELECT * FROM planos ORDER BY id_plano;
SELECT * FROM assinaturas ORDER BY id_assinatura;
SELECT * FROM convites_plano ORDER BY id_convite;
SELECT * FROM assinatura_cobrancas ORDER BY id_cobranca;
SELECT * FROM pagamentos ORDER BY id_pagamento;

-- teste: cobranças em atraso (deve retornar a cobrança da Camila)
SELECT c.id_cobranca, u.nome, c.competencia, c.valor_devido, c.valor_multa_aplicada, c.data_vencimento
FROM assinatura_cobrancas c
JOIN usuarios u ON u.id_usuario = c.id_usuario
WHERE c.status = 'ATRASADO';

-- teste: membros ativos da assinatura compartilhada de Mariana
SELECT u.nome, cp.status, cp.data_resposta
FROM convites_plano cp
JOIN usuarios u ON u.id_usuario = cp.id_usuario_convidado
WHERE cp.id_assinatura = 1 AND cp.status = 'ACEITO';


-- ============================================================================
-- BLOCO 12 - SUPORTE AO CLIENTE (esperado: 2 linhas)
-- ============================================================================

SELECT * FROM suporte ORDER BY id_suporte;

-- teste: fila de chamados de suporte em aberto
SELECT su.id_suporte, u.nome AS cliente, su.assunto, su.status, su.data_abertura
FROM suporte su
JOIN usuarios u ON u.id_usuario = su.id_cliente
WHERE su.status IN ('ABERTO','EM_ATENDIMENTO')
ORDER BY su.data_abertura ASC;


-- ============================================================================
-- RESUMO GERAL - contagem de linhas de todas as tabelas em uma só consulta
-- Útil como smoke test único após rodar todos os seeds.
-- ============================================================================

SELECT 'usuarios' AS tabela, COUNT(*) AS linhas FROM usuarios
UNION ALL SELECT 'enderecos', COUNT(*) FROM enderecos
UNION ALL SELECT 'contatos', COUNT(*) FROM contatos
UNION ALL SELECT 'recuperacao_senha', COUNT(*) FROM recuperacao_senha
UNION ALL SELECT 'autenticacao_2fa', COUNT(*) FROM autenticacao_2fa
UNION ALL SELECT 'preferencias_usuario', COUNT(*) FROM preferencias_usuario
UNION ALL SELECT 'generos', COUNT(*) FROM generos
UNION ALL SELECT 'filmes', COUNT(*) FROM filmes
UNION ALL SELECT 'filme_generos', COUNT(*) FROM filme_generos
UNION ALL SELECT 'locais', COUNT(*) FROM locais
UNION ALL SELECT 'salas', COUNT(*) FROM salas
UNION ALL SELECT 'assentos', COUNT(*) FROM assentos
UNION ALL SELECT 'sessoes', COUNT(*) FROM sessoes
UNION ALL SELECT 'equipes', COUNT(*) FROM equipes
UNION ALL SELECT 'equipe_membros', COUNT(*) FROM equipe_membros
UNION ALL SELECT 'chamados', COUNT(*) FROM chamados
UNION ALL SELECT 'notificacoes', COUNT(*) FROM notificacoes
UNION ALL SELECT 'fornecedores', COUNT(*) FROM fornecedores
UNION ALL SELECT 'insumos', COUNT(*) FROM insumos
UNION ALL SELECT 'equipamentos', COUNT(*) FROM equipamentos
UNION ALL SELECT 'combos', COUNT(*) FROM combos
UNION ALL SELECT 'combo_itens', COUNT(*) FROM combo_itens
UNION ALL SELECT 'movimentacoes_estoque', COUNT(*) FROM movimentacoes_estoque
UNION ALL SELECT 'solicitacoes_estoque', COUNT(*) FROM solicitacoes_estoque
UNION ALL SELECT 'logistica', COUNT(*) FROM logistica
UNION ALL SELECT 'cupons', COUNT(*) FROM cupons
UNION ALL SELECT 'pedidos', COUNT(*) FROM pedidos
UNION ALL SELECT 'itens_pedido', COUNT(*) FROM itens_pedido
UNION ALL SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL SELECT 'acessos_streaming', COUNT(*) FROM acessos_streaming
UNION ALL SELECT 'metodos_pagamento', COUNT(*) FROM metodos_pagamento
UNION ALL SELECT 'planos', COUNT(*) FROM planos
UNION ALL SELECT 'assinaturas', COUNT(*) FROM assinaturas
UNION ALL SELECT 'convites_plano', COUNT(*) FROM convites_plano
UNION ALL SELECT 'assinatura_cobrancas', COUNT(*) FROM assinatura_cobrancas
UNION ALL SELECT 'pagamentos', COUNT(*) FROM pagamentos
UNION ALL SELECT 'suporte', COUNT(*) FROM suporte;