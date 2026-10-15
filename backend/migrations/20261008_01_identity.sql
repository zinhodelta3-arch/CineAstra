-- Prompt 02 / M02–M04. Não aplicado nesta entrega.
-- Antes de atualizar base existente: revisar duplicatas normalizadas, múltiplas
-- principais e fatores duplicados. UNIQUE falha fechado, não apaga dados para dedupe.
ALTER TABLE usuarios
    ADD COLUMN email_normalizado VARCHAR(150) GENERATED ALWAYS AS (LOWER(TRIM(email))) STORED,
    ADD COLUMN cpf_normalizado VARCHAR(14) GENERATED ALWAYS AS (REPLACE(REPLACE(TRIM(cpf), '.', ''), '-', '')) STORED,
    ADD UNIQUE KEY uk_usuarios_email_normalizado (email_normalizado),
    ADD UNIQUE KEY uk_usuarios_cpf_normalizado (cpf_normalizado);

ALTER TABLE autenticacao_2fa
    ADD COLUMN ultimo_passo BIGINT UNSIGNED NULL,
    ADD UNIQUE KEY uk_2fa_usuario_metodo (id_usuario, metodo);

ALTER TABLE enderecos
    ADD COLUMN slot_principal TINYINT GENERATED ALWAYS AS (CASE WHEN principal = 1 THEN 1 ELSE NULL END) STORED,
    ADD UNIQUE KEY uk_enderecos_principal (id_usuario, slot_principal);

ALTER TABLE contatos
    ADD COLUMN tipo_principal VARCHAR(30) GENERATED ALWAYS AS (CASE WHEN principal = 1 THEN tipo ELSE NULL END) STORED,
    ADD UNIQUE KEY uk_contatos_principal (id_usuario, tipo_principal);

ALTER TABLE preferencias_usuario
    ADD COLUMN aparencia ENUM('cineastra','violet-bloom','mocha-mousse','catppucin') NOT NULL DEFAULT 'cineastra';

CREATE TABLE sessoes_autenticacao (
    id_sessao_auth BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    jti_hash BINARY(32) NOT NULL UNIQUE,
    expiracao DATETIME(3) NOT NULL,
    revogada_em DATETIME(3) NULL,
    two_factor_verified BOOLEAN NOT NULL DEFAULT FALSE,
    criada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_sessoes_auth_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    KEY idx_sessoes_auth_usuario (id_usuario, revogada_em, expiracao)
) ENGINE=InnoDB;

CREATE TABLE desafios_2fa (
    id_desafio BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    token_hash BINARY(32) NOT NULL UNIQUE,
    finalidade ENUM('LOGIN','ENROLLMENT') NOT NULL,
    metodo ENUM('APP','SMS','EMAIL') NULL,
    codigo_hash BINARY(32) NULL,
    chave_pendente VARCHAR(255) NULL,
    expiracao DATETIME(3) NOT NULL,
    tentativas TINYINT UNSIGNED NOT NULL DEFAULT 0,
    consumido_em DATETIME(3) NULL,
    CONSTRAINT fk_desafios_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    KEY idx_desafios_usuario (id_usuario, consumido_em, expiracao)
) ENGINE=InnoDB;

CREATE TABLE consentimentos_usuario (
    id_consentimento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    finalidade ENUM('TERMOS','PRIVACIDADE') NOT NULL,
    versao VARCHAR(50) NOT NULL,
    base_legal VARCHAR(100) NOT NULL,
    aceito_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    revogado_em DATETIME(3) NULL,
    CONSTRAINT fk_consentimento_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE verificacoes_idade (
    id_verificacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    faixa_etaria ENUM('ATE_16','MAIOR_16') NOT NULL,
    referencia_provedor VARCHAR(150) NOT NULL,
    verificado_em DATETIME(3) NOT NULL,
    expiracao DATETIME(3) NOT NULL,
    CONSTRAINT fk_verificacao_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_verificacao_expiracao CHECK (expiracao > verificado_em)
) ENGINE=InnoDB;

CREATE TABLE responsaveis_usuario (
    id_vinculo BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_menor INT UNSIGNED NOT NULL,
    id_responsavel INT UNSIGNED NOT NULL,
    referencia_prova VARCHAR(150) NOT NULL,
    status ENUM('ATIVO','REVOGADO') NOT NULL DEFAULT 'ATIVO',
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    revogado_em DATETIME(3) NULL,
    UNIQUE KEY uk_responsavel_menor (id_menor, id_responsavel),
    CONSTRAINT chk_responsavel_distinto CHECK (id_menor <> id_responsavel),
    CONSTRAINT fk_responsavel_menor FOREIGN KEY (id_menor) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_responsavel_usuario FOREIGN KEY (id_responsavel) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE controles_parentais (
    id_menor INT UNSIGNED PRIMARY KEY,
    compras_permitidas BOOLEAN NOT NULL DEFAULT FALSE,
    assinaturas_permitidas BOOLEAN NOT NULL DEFAULT FALSE,
    limite_minutos_diarios SMALLINT UNSIGNED NOT NULL DEFAULT 120,
    atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    CONSTRAINT chk_parental_minutos CHECK (limite_minutos_diarios BETWEEN 1 AND 1440),
    CONSTRAINT fk_parental_menor FOREIGN KEY (id_menor) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE autorizacoes_responsavel (
    id_autorizacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_vinculo BIGINT UNSIGNED NOT NULL,
    finalidade ENUM('COMPRA','ASSINATURA') NOT NULL,
    referencia_operacao VARCHAR(100) NOT NULL,
    autorizada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    expiracao DATETIME(3) NOT NULL,
    revogada_em DATETIME(3) NULL,
    UNIQUE KEY uk_autorizacao_operacao (id_vinculo, finalidade, referencia_operacao),
    CONSTRAINT fk_autorizacao_vinculo FOREIGN KEY (id_vinculo) REFERENCES responsaveis_usuario(id_vinculo)
) ENGINE=InnoDB;

CREATE TABLE solicitacoes_privacidade (
    id_solicitacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    tipo ENUM('EXCLUSAO') NOT NULL,
    status ENUM('RECEBIDA','EM_ANALISE','CONCLUIDA','RECUSADA') NOT NULL DEFAULT 'RECEBIDA',
    motivo_decisao VARCHAR(255) NULL,
    criada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    encerrada_em DATETIME(3) NULL,
    slot_aberto TINYINT GENERATED ALWAYS AS (CASE WHEN status IN ('RECEBIDA','EM_ANALISE') THEN 1 ELSE NULL END) STORED,
    UNIQUE KEY uk_privacidade_aberta (id_usuario, tipo, slot_aberto),
    CONSTRAINT fk_privacidade_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
) ENGINE=InnoDB;
