-- ============================================================================
-- BLOCO 01 - USUARIOS E AUTENTICACAO
-- ============================================================================

CREATE TABLE usuarios (
    id_usuario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL COMMENT 'armazenar sempre com hash (bcrypt/argon2)',
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    data_nascimento DATE,
    tipo_usuario ENUM('ADMIN','FORNECEDOR','SUPERVISOR','COLABORADOR','CLIENTE') NOT NULL,
    status ENUM('ATIVO','INATIVO','BLOQUEADO','PENDENTE_VERIFICACAO') NOT NULL DEFAULT 'PENDENTE_VERIFICACAO',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE enderecos (
    id_endereco INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    cep VARCHAR(10),
    logradouro VARCHAR(150),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    principal BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_enderecos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE contatos (
    id_contato INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    tipo ENUM('TELEFONE','WHATSAPP','EMAIL_SECUNDARIO') NOT NULL,
    valor VARCHAR(150) NOT NULL,
    principal BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_contatos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE recuperacao_senha (
    id_recuperacao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    token VARCHAR(255) NOT NULL,
    expiracao DATETIME NOT NULL,
    utilizado BOOLEAN DEFAULT FALSE,
    UNIQUE KEY uk_recuperacao_token (token),
    CONSTRAINT fk_recuperacao_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- 2FA obrigatório para ADMIN/SUPERVISOR: validar na aplicação no login.
CREATE TABLE autenticacao_2fa (
    id_2fa INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    metodo ENUM('APP','SMS','EMAIL') NOT NULL DEFAULT 'APP',
    chave VARCHAR(255),
    ativo BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_2fa_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE preferencias_usuario (
    id_preferencia INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    tema ENUM('CLARO','ESCURO','SISTEMA') DEFAULT 'SISTEMA',
    tamanho_fonte ENUM('PEQUENO','MEDIO','GRANDE','MUITO_GRANDE') DEFAULT 'MEDIO',
    alto_contraste BOOLEAN DEFAULT FALSE,
    modo_acessibilidade BOOLEAN DEFAULT FALSE,
    idioma VARCHAR(10) DEFAULT 'pt-BR',
    UNIQUE KEY uk_preferencias_usuario (id_usuario),
    CONSTRAINT fk_preferencias_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);


-- ============================================================================
-- BLOCO 02 - CATALOGO DE FILMES
-- ============================================================================

CREATE TABLE generos (
    id_genero INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE filmes (
    id_filme INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    duracao INT COMMENT 'duração em minutos',
    classificacao ENUM('L','10','12','14','16','18') NOT NULL DEFAULT 'L',
    data_lancamento DATE,
    diretor VARCHAR(150),
    imagem VARCHAR(255),
    trailer VARCHAR(255),
    disponivel_cinema BOOLEAN DEFAULT TRUE,
    disponivel_streaming BOOLEAN DEFAULT FALSE,
    preco_aluguel DECIMAL(10,2),
    preco_compra DECIMAL(10,2),
    dias_acesso_aluguel INT DEFAULT 3 COMMENT 'validade do aluguel, em dias, a partir da compra',
    status ENUM('ATIVO','INATIVO') DEFAULT 'ATIVO',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_filmes_duracao CHECK (duracao IS NULL OR duracao > 0),
    CONSTRAINT chk_filmes_precos CHECK (
        (preco_aluguel IS NULL OR preco_aluguel >= 0) AND
        (preco_compra IS NULL OR preco_compra >= 0)
    ),
    CONSTRAINT chk_filmes_dias_aluguel CHECK (dias_acesso_aluguel IS NULL OR dias_acesso_aluguel > 0)
);

CREATE TABLE filme_generos (
    id_filme INT UNSIGNED NOT NULL,
    id_genero INT UNSIGNED NOT NULL,
    PRIMARY KEY (id_filme, id_genero),
    CONSTRAINT fk_filmegen_filme FOREIGN KEY (id_filme) REFERENCES filmes(id_filme) ON DELETE CASCADE,
    CONSTRAINT fk_filmegen_genero FOREIGN KEY (id_genero) REFERENCES generos(id_genero) ON DELETE CASCADE
);


-- ============================================================================
-- BLOCO 03 - LOCAIS, SALAS E ASSENTOS
-- ============================================================================

CREATE TABLE locais (
    id_local INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cep VARCHAR(10),
    logradouro VARCHAR(150),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    telefone VARCHAR(20),
    status ENUM('ATIVO','INATIVO','MANUTENCAO') DEFAULT 'ATIVO',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE salas (
    id_sala INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_local INT UNSIGNED NOT NULL,
    nome VARCHAR(100) NOT NULL,
    capacidade INT NOT NULL,
    tipo ENUM('2D','3D','4DX','VIP','IMAX') DEFAULT '2D',
    status ENUM('ATIVA','MANUTENCAO','INATIVA') DEFAULT 'ATIVA',
    UNIQUE KEY uk_sala_local_nome (id_local, nome),
    CONSTRAINT chk_salas_capacidade CHECK (capacidade > 0),
    CONSTRAINT fk_salas_local FOREIGN KEY (id_local) REFERENCES locais(id_local)
);

CREATE TABLE assentos (
    id_assento INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_sala INT UNSIGNED NOT NULL,
    fileira VARCHAR(5) NOT NULL,
    numero INT NOT NULL,
    tipo ENUM('COMUM','PCD','OBESO','IDOSO','CASAL') DEFAULT 'COMUM' COMMENT 'PCD/OBESO/IDOSO cobrem a NFR de acessibilidade',
    status ENUM('ATIVA','INATIVA') DEFAULT 'ATIVA',
    UNIQUE KEY uk_assento_sala (id_sala, fileira, numero),
    CONSTRAINT chk_assentos_numero CHECK (numero > 0),
    CONSTRAINT fk_assentos_sala FOREIGN KEY (id_sala) REFERENCES salas(id_sala)
);


-- ============================================================================
-- BLOCO 04 - SESSOES
-- ============================================================================

CREATE TABLE sessoes (
    id_sessao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_filme INT UNSIGNED NOT NULL,
    id_sala INT UNSIGNED NOT NULL,
    data DATE NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    idioma ENUM('DUBLADO','LEGENDADO','ORIGINAL') DEFAULT 'DUBLADO',
    preco_inteira DECIMAL(10,2) NOT NULL COMMENT 'valor da meia-entrada = preco_inteira / 2',
    status ENUM('AGENDADA','EM_CARTAZ','ENCERRADA','CANCELADA') DEFAULT 'AGENDADA',
    CONSTRAINT chk_sessoes_preco CHECK (preco_inteira >= 0),
    CONSTRAINT fk_sessoes_filme FOREIGN KEY (id_filme) REFERENCES filmes(id_filme),
    CONSTRAINT fk_sessoes_sala FOREIGN KEY (id_sala) REFERENCES salas(id_sala)
);


-- ============================================================================
-- BLOCO 05 - EQUIPES E CHAMADOS INTERNOS (STAFF)
-- ============================================================================

CREATE TABLE equipes (
    id_equipe INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_supervisor INT UNSIGNED NOT NULL,
    id_sessao INT UNSIGNED NOT NULL,
    nome VARCHAR(100) NOT NULL,
    status ENUM('ATIVA','FINALIZADA','CANCELADA') DEFAULT 'ATIVA',
    CONSTRAINT fk_equipes_supervisor FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_equipes_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao)
);

CREATE TABLE equipe_membros (
    id_equipe_membro INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_equipe INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    funcao VARCHAR(100),
    data_entrada DATE DEFAULT (CURRENT_DATE),
    status ENUM('ATIVO','INATIVO') DEFAULT 'ATIVO',
    UNIQUE KEY uk_equipe_usuario (id_equipe, id_usuario),
    CONSTRAINT fk_equipemembros_equipe FOREIGN KEY (id_equipe) REFERENCES equipes(id_equipe),
    CONSTRAINT fk_equipemembros_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- Chamados internos (staff) - diferente de "suporte" (bloco 12), que é
-- atendimento ao cliente final. Volume limitado ao time interno:
-- INT UNSIGNED é suficiente por décadas.
CREATE TABLE chamados (
    id_chamado INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_criador INT UNSIGNED NOT NULL,
    id_responsavel INT UNSIGNED,
    id_sessao INT UNSIGNED,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    prioridade ENUM('BAIXA','MEDIA','ALTA','URGENTE') DEFAULT 'MEDIA',
    status ENUM('ABERTO','EM_ANDAMENTO','RESOLVIDO','FECHADO') DEFAULT 'ABERTO',
    data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_fechamento DATETIME,
    CONSTRAINT fk_chamados_criador FOREIGN KEY (id_criador) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_chamados_responsavel FOREIGN KEY (id_responsavel) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_chamados_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao)
);

-- [BIGINT] gerada a cada evento relevante do sistema para cada usuário;
-- em escala, é uma das tabelas que mais cresce e nunca é podada.
CREATE TABLE notificacoes (
    id_notificacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT,
    tipo VARCHAR(50),
    lida BOOLEAN DEFAULT FALSE,
    data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notificacoes_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);


-- ============================================================================
-- BLOCO 06 - FORNECEDORES, INSUMOS, EQUIPAMENTOS E COMBOS
-- ============================================================================

CREATE TABLE fornecedores (
    id_fornecedor INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL UNIQUE COMMENT 'conta de acesso do fornecedor ao sistema',
    razao_social VARCHAR(150) NOT NULL,
    nome_fantasia VARCHAR(150),
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    status ENUM('ATIVO','INATIVO') DEFAULT 'ATIVO',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fornecedores_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE insumos (
    id_insumo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_fornecedor INT UNSIGNED NOT NULL,
    id_local INT UNSIGNED NOT NULL COMMENT 'local físico onde o insumo está estocado',
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    quantidade INT NOT NULL DEFAULT 0,
    quantidade_minima INT NOT NULL DEFAULT 0,
    preco DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('DISPONIVEL','INDISPONIVEL') DEFAULT 'DISPONIVEL',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_insumos_quantidades CHECK (quantidade >= 0 AND quantidade_minima >= 0),
    CONSTRAINT chk_insumos_preco CHECK (preco >= 0),
    CONSTRAINT fk_insumos_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor),
    CONSTRAINT fk_insumos_local FOREIGN KEY (id_local) REFERENCES locais(id_local)
);

CREATE TABLE equipamentos (
    id_equipamento INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_fornecedor INT UNSIGNED NOT NULL,
    id_local INT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    numero_patrimonio VARCHAR(100) UNIQUE,
    quantidade INT NOT NULL DEFAULT 0,
    status ENUM('DISPONIVEL','MANUTENCAO','INDISPONIVEL') DEFAULT 'DISPONIVEL',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_equipamentos_quantidade CHECK (quantidade >= 0),
    CONSTRAINT fk_equipamentos_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor),
    CONSTRAINT fk_equipamentos_local FOREIGN KEY (id_local) REFERENCES locais(id_local)
);

CREATE TABLE combos (
    id_combo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_combos_preco CHECK (preco >= 0)
);

CREATE TABLE combo_itens (
    id_combo INT UNSIGNED NOT NULL,
    id_insumo INT UNSIGNED NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_combo, id_insumo),
    CONSTRAINT chk_comboitens_quantidade CHECK (quantidade > 0),
    CONSTRAINT fk_comboitens_combo FOREIGN KEY (id_combo) REFERENCES combos(id_combo) ON DELETE CASCADE,
    CONSTRAINT fk_comboitens_insumo FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo)
);


-- ============================================================================
-- BLOCO 07 - ESTOQUE (MOVIMENTACOES E SOLICITACOES)
-- ============================================================================

-- [BIGINT] uma linha por entrada/saída/ajuste de insumo OU equipamento;
-- em operação contínua multi-local, é tabela de alto volume de escrita.
CREATE TABLE movimentacoes_estoque (
    id_movimentacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_insumo INT UNSIGNED,
    id_equipamento INT UNSIGNED,
    id_usuario INT UNSIGNED NOT NULL,
    tipo ENUM('ENTRADA','SAIDA','AJUSTE','PERDA','DEVOLUCAO') NOT NULL,
    quantidade INT NOT NULL,
    motivo VARCHAR(255),
    data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movestoque_insumo FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo),
    CONSTRAINT fk_movestoque_equipamento FOREIGN KEY (id_equipamento) REFERENCES equipamentos(id_equipamento),
    CONSTRAINT fk_movestoque_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_movestoque_quantidade CHECK (quantidade <> 0),
    CONSTRAINT chk_movestoque_item CHECK (
        (id_insumo IS NOT NULL AND id_equipamento IS NULL) OR
        (id_insumo IS NULL AND id_equipamento IS NOT NULL)
    )
);

-- Volume limitado por sessão/local (não por venda ao consumidor final):
-- INT UNSIGNED é suficiente por décadas.
CREATE TABLE solicitacoes_estoque (
    id_solicitacao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    id_local INT UNSIGNED NOT NULL,
    id_sessao INT UNSIGNED,
    id_insumo INT UNSIGNED,
    id_equipamento INT UNSIGNED,
    quantidade INT NOT NULL,
    status ENUM('PENDENTE','APROVADA','RECUSADA','FINALIZADA') DEFAULT 'PENDENTE',
    observacao TEXT,
    data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_solicestoque_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_solicestoque_local FOREIGN KEY (id_local) REFERENCES locais(id_local),
    CONSTRAINT fk_solicestoque_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao),
    CONSTRAINT fk_solicestoque_insumo FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo),
    CONSTRAINT fk_solicestoque_equipamento FOREIGN KEY (id_equipamento) REFERENCES equipamentos(id_equipamento),
    CONSTRAINT chk_solicestoque_quantidade CHECK (quantidade > 0),
    CONSTRAINT chk_solicestoque_item CHECK (
        (id_insumo IS NOT NULL AND id_equipamento IS NULL) OR
        (id_insumo IS NULL AND id_equipamento IS NOT NULL)
    )
);


-- ============================================================================
-- BLOCO 08 - LOGISTICA
-- ============================================================================

CREATE TABLE logistica (
    id_logistica INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_fornecedor INT UNSIGNED NOT NULL,
    id_local_origem INT UNSIGNED COMMENT 'estoque físico do fornecedor',
    id_local_destino INT UNSIGNED NOT NULL COMMENT 'local/sessão que solicitou os recursos',
    id_solicitacao INT UNSIGNED,
    data_envio DATETIME,
    data_prevista DATETIME,
    data_recebimento DATETIME,
    status ENUM('PENDENTE','ENVIADO','EM_TRANSITO','RECEBIDO','CANCELADO') DEFAULT 'PENDENTE',
    observacao TEXT,
    CONSTRAINT fk_logistica_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor),
    CONSTRAINT fk_logistica_origem FOREIGN KEY (id_local_origem) REFERENCES locais(id_local),
    CONSTRAINT fk_logistica_destino FOREIGN KEY (id_local_destino) REFERENCES locais(id_local),
    CONSTRAINT fk_logistica_solicitacao FOREIGN KEY (id_solicitacao) REFERENCES solicitacoes_estoque(id_solicitacao)
);


-- ============================================================================
-- BLOCO 09 - CUPONS
-- ============================================================================

CREATE TABLE cupons (
    id_cupom INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    desconto DECIMAL(5,2) NOT NULL,
    validade DATE NOT NULL,
    limite_uso INT DEFAULT 0 COMMENT '0 = ilimitado',
    ativo BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_cupons_desconto CHECK (desconto >= 0 AND desconto <= 100),
    CONSTRAINT chk_cupons_limite_uso CHECK (limite_uso >= 0)
);


-- ============================================================================
-- BLOCO 10 - PEDIDOS, INGRESSOS E STREAMING
-- ============================================================================

-- [BIGINT] uma linha por compra do cliente final; é o núcleo transacional
-- da plataforma e o que mais cresce ao longo dos anos.
CREATE TABLE pedidos (
    id_pedido BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    id_cupom INT UNSIGNED,
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('EM_ANDAMENTO','AGUARDANDO_PAGAMENTO','PAGO','CANCELADO','FINALIZADO') DEFAULT 'EM_ANDAMENTO',
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_pedidos_valor_total CHECK (valor_total >= 0),
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_pedidos_cupom FOREIGN KEY (id_cupom) REFERENCES cupons(id_cupom)
);

-- [BIGINT] várias linhas por pedido (um ingresso, um insumo, um combo...);
-- cresce mais rápido ainda do que pedidos.
-- [NOVO] chk_itenspedido_sessao_qtd: uma linha de ingresso = um assento
-- específico, então quantidade > 1 nessa linha seria um dado inválido
-- (ex.: "3 unidades da poltrona A5" não existe).
CREATE TABLE itens_pedido (
    id_item BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_pedido BIGINT UNSIGNED NOT NULL,
    id_insumo INT UNSIGNED,
    id_combo INT UNSIGNED,
    id_sessao INT UNSIGNED,
    id_assento INT UNSIGNED,
    id_filme INT UNSIGNED,
    tipo_streaming ENUM('ALUGUEL','COMPRA'),
    tipo_ingresso ENUM('INTEIRA','MEIA','ISENTA') DEFAULT 'INTEIRA',
    quantidade INT NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_itenspedido_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_itenspedido_insumo FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo),
    CONSTRAINT fk_itenspedido_combo FOREIGN KEY (id_combo) REFERENCES combos(id_combo),
    CONSTRAINT fk_itenspedido_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao),
    CONSTRAINT fk_itenspedido_assento FOREIGN KEY (id_assento) REFERENCES assentos(id_assento),
    CONSTRAINT fk_itenspedido_filme FOREIGN KEY (id_filme) REFERENCES filmes(id_filme),
    UNIQUE KEY uk_sessao_assento (id_sessao, id_assento) COMMENT 'impede vender o mesmo assento duas vezes na mesma sessão',
    CONSTRAINT chk_itenspedido_quantidade CHECK (quantidade > 0),
    CONSTRAINT chk_itenspedido_sessao_qtd CHECK (id_sessao IS NULL OR quantidade = 1),
    CONSTRAINT chk_itenspedido_valores CHECK (valor_unitario >= 0 AND subtotal >= 0),
    CONSTRAINT chk_itenspedido_tipo CHECK (
        (id_insumo IS NOT NULL AND id_combo IS NULL AND id_sessao IS NULL AND id_filme IS NULL AND id_assento IS NULL) OR
        (id_insumo IS NULL AND id_combo IS NOT NULL AND id_sessao IS NULL AND id_filme IS NULL AND id_assento IS NULL) OR
        (id_insumo IS NULL AND id_combo IS NULL AND id_sessao IS NOT NULL AND id_filme IS NULL AND id_assento IS NOT NULL) OR
        (id_insumo IS NULL AND id_combo IS NULL AND id_sessao IS NULL AND id_filme IS NOT NULL AND id_assento IS NULL)
    ),
    CONSTRAINT chk_itenspedido_streaming CHECK (
        (id_filme IS NOT NULL AND tipo_streaming IS NOT NULL) OR
        (id_filme IS NULL AND tipo_streaming IS NULL)
    )
);

-- [BIGINT] um ticket por item de ingresso/insumo/streaming vendido.
CREATE TABLE tickets (
    id_ticket BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_item BIGINT UNSIGNED NOT NULL,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    tipo ENUM('INGRESSO_SESSAO','RETIRADA_INSUMO','ACESSO_STREAMING') NOT NULL,
    status ENUM('GERADO','UTILIZADO','CANCELADO','EXPIRADO') DEFAULT 'GERADO',
    data_geracao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_utilizacao DATETIME,
    CONSTRAINT fk_tickets_item FOREIGN KEY (id_item) REFERENCES itens_pedido(id_item)
);

-- [BIGINT] um registro por compra/aluguel de streaming do usuário.
CREATE TABLE acessos_streaming (
    id_acesso BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_item BIGINT UNSIGNED NOT NULL UNIQUE,
    id_usuario INT UNSIGNED NOT NULL,
    id_filme INT UNSIGNED NOT NULL,
    data_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_expiracao DATETIME COMMENT 'NULL para compra definitiva',
    status ENUM('ATIVO','EXPIRADO','REVOGADO') DEFAULT 'ATIVO',
    CONSTRAINT fk_acessostream_item FOREIGN KEY (id_item) REFERENCES itens_pedido(id_item),
    CONSTRAINT fk_acessostream_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_acessostream_filme FOREIGN KEY (id_filme) REFERENCES filmes(id_filme)
);


-- ============================================================================
-- BLOCO 11 - PLANOS, ASSINATURAS E PAGAMENTOS
-- ============================================================================

CREATE TABLE metodos_pagamento (
    id_metodo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    tipo ENUM('CREDITO','DEBITO','PIX','BOLETO') NOT NULL,
    identificacao VARCHAR(100) COMMENT 'ex.: últimos 4 dígitos do cartão',
    principal BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_metodospagto_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE planos (
    id_plano INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor_mensal DECIMAL(10,2),
    valor_anual DECIMAL(10,2),
    desconto DECIMAL(5,2) DEFAULT 0.00,
    limite_membros INT NOT NULL DEFAULT 1 COMMENT 'qtde máxima de perfis compartilhados no plano',
    valor_multa_atraso DECIMAL(10,2) DEFAULT 0.00,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE assinaturas (
    id_assinatura INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL COMMENT 'titular da assinatura',
    id_plano INT UNSIGNED NOT NULL,
    inicio DATE NOT NULL,
    fim DATE,
    periodicidade ENUM('MENSAL','ANUAL') NOT NULL,
    tipo_divisao ENUM('TITULAR_PAGA','DIVISAO_IGUAL') NOT NULL DEFAULT 'TITULAR_PAGA',
    status ENUM('ATIVA','CANCELADA','EXPIRADA','PENDENTE') DEFAULT 'ATIVA',
    renovacao_automatica BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_assinaturas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_assinaturas_plano FOREIGN KEY (id_plano) REFERENCES planos(id_plano)
);

CREATE TABLE convites_plano (
    id_convite INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_assinatura INT UNSIGNED NOT NULL,
    id_usuario_convidado INT UNSIGNED NOT NULL,
    status ENUM('PENDENTE','ACEITO','RECUSADO','EXPIRADO') DEFAULT 'PENDENTE',
    data_convite DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_resposta DATETIME,
    UNIQUE KEY uk_assinatura_convidado (id_assinatura, id_usuario_convidado),
    CONSTRAINT fk_convitesplano_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT fk_convitesplano_usuario FOREIGN KEY (id_usuario_convidado) REFERENCES usuarios(id_usuario)
);

-- [BIGINT] gerada todo mês por assinante (titular ou cada membro, conforme
-- tipo_divisao); é registro financeiro e nunca é apagada mesmo após o
-- cancelamento da assinatura — acumula indefinidamente.
CREATE TABLE assinatura_cobrancas (
    id_cobranca BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_assinatura INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL COMMENT 'responsável por esta fração da cobrança',
    competencia DATE NOT NULL COMMENT 'mês/ano de referência (usar sempre dia 01)',
    valor_devido DECIMAL(10,2) NOT NULL,
    valor_multa_aplicada DECIMAL(10,2) DEFAULT 0.00,
    status ENUM('PENDENTE','PAGO','ATRASADO','ISENTO') DEFAULT 'PENDENTE',
    data_vencimento DATE NOT NULL,
    data_pagamento DATETIME,
    UNIQUE KEY uk_cobranca_competencia (id_assinatura, id_usuario, competencia),
    CONSTRAINT chk_cobrancas_valores CHECK (valor_devido >= 0 AND valor_multa_aplicada >= 0),
    CONSTRAINT fk_cobrancas_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT fk_cobrancas_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

-- [BIGINT] acompanha pedidos (BIGINT); mesmo volume de escrita.
CREATE TABLE pagamentos (
    id_pagamento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_pedido BIGINT UNSIGNED,
    id_cobranca BIGINT UNSIGNED,
    id_metodo INT UNSIGNED NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status ENUM('PENDENTE','APROVADO','RECUSADO','ESTORNADO') DEFAULT 'PENDENTE',
    data_pagamento DATETIME,
    transacao_id VARCHAR(150),
    CONSTRAINT chk_pagamentos_valor CHECK (valor >= 0),
    CONSTRAINT fk_pagamentos_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_pagamentos_cobranca FOREIGN KEY (id_cobranca) REFERENCES assinatura_cobrancas(id_cobranca),
    CONSTRAINT fk_pagamentos_metodo FOREIGN KEY (id_metodo) REFERENCES metodos_pagamento(id_metodo),
    CONSTRAINT chk_pagamentos_referencia CHECK (
        (id_pedido IS NOT NULL AND id_cobranca IS NULL) OR
        (id_pedido IS NULL AND id_cobranca IS NOT NULL)
    )
);


-- ============================================================================
-- BLOCO 12 - SUPORTE AO CLIENTE
-- ============================================================================

-- Volume alto, mas muito abaixo de pedidos/notificações; INT UNSIGNED
-- comporta décadas mesmo em grande escala de atendimento.
CREATE TABLE suporte (
    id_suporte INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT UNSIGNED NOT NULL,
    id_atendente INT UNSIGNED,
    assunto VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    resposta TEXT,
    status ENUM('ABERTO','EM_ATENDIMENTO','RESOLVIDO','FECHADO') DEFAULT 'ABERTO',
    data_abertura DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_fechamento DATETIME,
    CONSTRAINT fk_suporte_cliente FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_suporte_atendente FOREIGN KEY (id_atendente) REFERENCES usuarios(id_usuario)
);


-- ============================================================================
-- BLOCO 13 - INDICES ADICIONAIS DE PERFORMANCE
-- O InnoDB já cria/usa índice para colunas de FOREIGN KEY quando necessário
-- (inclusive reaproveitando um índice composto cuja coluna da FK seja o
-- prefixo esquerdo) — por isso este bloco evita duplicar índices simples
-- dessas colunas, o que só adicionaria custo de escrita sem ganho de leitura.
-- ============================================================================

CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX idx_sessoes_data_sala ON sessoes(data, id_sala);
CREATE INDEX idx_pedidos_usuario_data ON pedidos(id_usuario, data_pedido DESC);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_acessos_streaming_usuario_status ON acessos_streaming(id_usuario, status);
CREATE INDEX idx_insumos_estoque_baixo ON insumos(status, quantidade, quantidade_minima);
CREATE INDEX idx_movestoque_data ON movimentacoes_estoque(data_movimentacao);
CREATE INDEX idx_assinaturas_status ON assinaturas(status);
CREATE INDEX idx_assinaturas_usuario_status ON assinaturas(id_usuario, status);
CREATE INDEX idx_cobrancas_vencimento_status ON assinatura_cobrancas(data_vencimento, status);
CREATE INDEX idx_chamados_status_data ON chamados(status, data_abertura);
CREATE INDEX idx_suporte_status ON suporte(status, data_abertura);
CREATE INDEX idx_notificacoes_usuario_lida_data ON notificacoes(id_usuario, lida, data_envio DESC);
CREATE INDEX idx_logistica_status ON logistica(status);
CREATE INDEX idx_solicitacoes_status_data ON solicitacoes_estoque(status, data_solicitacao);
CREATE INDEX idx_filme_generos_genero ON filme_generos(id_genero, id_filme);


-- ============================================================================
-- BLOCO 14 - CONSULTAS UTEIS (SELECTS DE REFERENCIA)
-- Não fazem parte das migrations. Troque os "?" pelos placeholders reais.
-- ============================================================================

-- 1. Sessões em cartaz hoje em um local específico, com preço inteira/meia
SELECT s.id_sessao, f.titulo, l.nome AS local, sa.nome AS sala,
       s.data, s.horario_inicio, s.idioma, s.preco_inteira,
       ROUND(s.preco_inteira/2,2) AS preco_meia
FROM sessoes s
JOIN filmes f ON f.id_filme = s.id_filme
JOIN salas sa ON sa.id_sala = s.id_sala
JOIN locais l ON l.id_local = sa.id_local
WHERE s.data = CURDATE() AND l.id_local = ? AND s.status = 'EM_CARTAZ';

-- 2. Assentos livres para uma sessão específica
SELECT a.id_assento, a.fileira, a.numero, a.tipo
FROM assentos a
WHERE a.id_sala = (SELECT id_sala FROM sessoes WHERE id_sessao = ?)
  AND a.status = 'ATIVA'
  AND a.id_assento NOT IN (
      SELECT ip.id_assento FROM itens_pedido ip
      WHERE ip.id_sessao = ? AND ip.id_assento IS NOT NULL
  );

-- 3. Insumos com estoque abaixo (ou igual) ao mínimo, para reposição
SELECT i.id_insumo, i.nome, i.quantidade, i.quantidade_minima, f.nome_fantasia
FROM insumos i
JOIN fornecedores f ON f.id_fornecedor = i.id_fornecedor
WHERE i.quantidade <= i.quantidade_minima AND i.status = 'DISPONIVEL';

-- 4. Cobranças de assinatura em atraso, para aplicar multa
SELECT c.id_cobranca, u.nome, u.email, c.competencia, c.valor_devido, c.data_vencimento
FROM assinatura_cobrancas c
JOIN usuarios u ON u.id_usuario = c.id_usuario
WHERE c.status = 'PENDENTE' AND c.data_vencimento < CURDATE();

-- 5. Membros ativos de uma assinatura compartilhada
SELECT u.nome, u.email, cp.status, cp.data_resposta
FROM convites_plano cp
JOIN usuarios u ON u.id_usuario = cp.id_usuario_convidado
WHERE cp.id_assinatura = ? AND cp.status = 'ACEITO';

-- 6. Faturamento por filme (ingressos de sessão) em um período, só pedidos pagos
SELECT f.titulo, SUM(ip.subtotal) AS receita_total, COUNT(ip.id_item) AS ingressos_vendidos
FROM itens_pedido ip
JOIN sessoes s ON s.id_sessao = ip.id_sessao
JOIN filmes f ON f.id_filme = s.id_filme
JOIN pedidos p ON p.id_pedido = ip.id_pedido
WHERE p.status = 'PAGO' AND p.data_pedido BETWEEN ? AND ?
GROUP BY f.id_filme
ORDER BY receita_total DESC;

-- 7. Remessas de logística pendentes por fornecedor
SELECT lg.id_logistica, f.nome_fantasia, lo.nome AS destino, lg.status, lg.data_prevista
FROM logistica lg
JOIN fornecedores f ON f.id_fornecedor = lg.id_fornecedor
JOIN locais lo ON lo.id_local = lg.id_local_destino
WHERE lg.status IN ('PENDENTE','ENVIADO','EM_TRANSITO');

-- 8. Acessos de streaming ativos de um usuário
SELECT f.titulo, ac.data_inicio, ac.data_expiracao, ac.status
FROM acessos_streaming ac
JOIN filmes f ON f.id_filme = ac.id_filme
WHERE ac.id_usuario = ? AND ac.status = 'ATIVO';

-- 9. Fila de tickets de suporte ao cliente em aberto, mais antigos primeiro
SELECT su.id_suporte, u.nome AS cliente, su.assunto, su.status, su.data_abertura
FROM suporte su
JOIN usuarios u ON u.id_usuario = su.id_cliente
WHERE su.status IN ('ABERTO','EM_ATENDIMENTO')
ORDER BY su.data_abertura ASC;

-- 10. Equipamentos disponíveis de um fornecedor por local
SELECT e.id_equipamento, e.nome, e.status, l.nome AS local
FROM equipamentos e
JOIN locais l ON l.id_local = e.id_local
WHERE e.id_fornecedor = ? AND e.status = 'DISPONIVEL';


-- ============================================================================
-- BLOCO 15 - RECOMENDACOES DE ESCALABILIDADE (NAO EXECUTAR AUTOMATICAMENTE)
-- Decisões de arquitetura que exigem acompanhamento de volume real antes
-- de aplicar; ficam documentadas aqui para quando o momento chegar.
-- ============================================================================

-- (A) ARQUIVAMENTO/EXPURGO de logs antigos (notificacoes, movimentacoes_
--     estoque). Mais simples e seguro que particionar, pois preserva as
--     FOREIGN KEY: mover periodicamente (job agendado) linhas com mais de
--     N meses para uma tabela "_historico" sem FK, ou exportar e apagar.
-- Exemplo:
-- CREATE TABLE notificacoes_historico LIKE notificacoes;
-- ALTER TABLE notificacoes_historico DROP FOREIGN KEY fk_notificacoes_usuario;
-- INSERT INTO notificacoes_historico SELECT * FROM notificacoes WHERE data_envio < (CURDATE() - INTERVAL 12 MONTH);
-- DELETE FROM notificacoes WHERE data_envio < (CURDATE() - INTERVAL 12 MONTH);

-- (B) PARTICIONAMENTO por data, alternativa a (A) se o volume justificar
--     consultas muito mais rápidas no histórico recente. ATENCAO: o InnoDB
--     NAO permite FOREIGN KEY em tabela particionada (nem ser referenciada
--     por uma) — exigiria remover fk_notificacoes_usuario e validar o
--     vínculo com id_usuario só na aplicação. Só adotar se o expurgo em (A)
--     deixar de ser suficiente.
-- Exemplo (ilustrativo, requer id_notificacao compor a PK junto da coluna
-- de particionamento):
-- ALTER TABLE notificacoes DROP FOREIGN KEY fk_notificacoes_usuario;
-- ALTER TABLE notificacoes
--     DROP PRIMARY KEY,
--     ADD PRIMARY KEY (id_notificacao, data_envio)
--     PARTITION BY RANGE (YEAR(data_envio)) (
--         PARTITION p2026 VALUES LESS THAN (2027),
--         PARTITION p2027 VALUES LESS THAN (2028),
--         PARTITION pmax  VALUES LESS THAN MAXVALUE
--     );

-- (C) CONTENÇÃO DE LOCK em insumos.quantidade sob alta concorrência:
--     sempre decrementar de forma atômica, sem ler o valor antes:
-- UPDATE insumos SET quantidade = quantidade - :qtd
--   WHERE id_insumo = :id AND quantidade >= :qtd;
--     Se a linha afetada vier 0, não havia estoque suficiente — tratar na
--     aplicação como falha da reserva, sem round-trip extra de leitura.

-- (D) innodb_autoincrement_lock_mode: em MySQL 8 o padrão (2, "interleaved")
--     já evita travar a tabela inteira em INSERTs concorrentes nas tabelas
--     de alto volume (pedidos, itens_pedido, tickets); confirmar que essa
--     configuração do servidor não foi revertida para o modo legado (0/1).git