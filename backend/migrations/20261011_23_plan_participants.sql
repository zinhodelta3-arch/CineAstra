-- Participantes atuais e trilha imutável; convites legados ACEITO são incorporados.
CREATE TABLE assinatura_participantes (
    id_assinatura INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    status ENUM('ATIVO','SAIU','SUSPENSO') NOT NULL DEFAULT 'ATIVO',
    entrada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    saida_em DATETIME(3) NULL,
    atualizado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (id_assinatura,id_usuario),
    CONSTRAINT fk_assinatura_participante_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT fk_assinatura_participante_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

INSERT INTO assinatura_participantes (id_assinatura,id_usuario,status,entrada_em)
SELECT id_assinatura,id_usuario_convidado,'ATIVO',COALESCE(data_resposta,data_convite)
FROM convites_plano WHERE status='ACEITO';

CREATE TABLE assinatura_participante_eventos (
    id_evento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_assinatura INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    id_ator INT UNSIGNED NOT NULL,
    evento ENUM('ENTROU','SAIU','SUSPENSO','REATIVADO') NOT NULL,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT fk_participante_evento_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT fk_participante_evento_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_participante_evento_ator FOREIGN KEY (id_ator) REFERENCES usuarios(id_usuario)
);

INSERT INTO assinatura_participante_eventos (id_assinatura,id_usuario,id_ator,evento,criado_em)
SELECT v.id_assinatura,v.id_usuario_convidado,v.id_usuario_convidado,'ENTROU',COALESCE(v.data_resposta,v.data_convite)
FROM convites_plano v WHERE v.status='ACEITO';

ALTER TABLE assinaturas
    ADD COLUMN tipo_divisao_proximo ENUM('TITULAR_PAGA','DIVISAO_IGUAL') NULL,
    ADD COLUMN tipo_divisao_efetiva_em DATE NULL;

CREATE TABLE assinatura_rateio_propostas (
    id_proposta BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_assinatura INT UNSIGNED NOT NULL,
    id_proponente INT UNSIGNED NOT NULL,
    tipo_divisao ENUM('TITULAR_PAGA','DIVISAO_IGUAL') NOT NULL,
    competencia_efetiva DATE NOT NULL,
    status ENUM('PENDENTE','APROVADA','REJEITADA','CANCELADA') NOT NULL DEFAULT 'PENDENTE',
    criada_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    decidida_em DATETIME(3) NULL,
    CONSTRAINT fk_rateio_proposta_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT fk_rateio_proposta_proponente FOREIGN KEY (id_proponente) REFERENCES usuarios(id_usuario),
    KEY idx_rateio_proposta_status (id_assinatura,status)
);

CREATE TABLE assinatura_rateio_consensos (
    id_proposta BIGINT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    status ENUM('PENDENTE','ACEITO','RECUSADO') NOT NULL DEFAULT 'PENDENTE',
    decidido_em DATETIME(3) NULL,
    PRIMARY KEY (id_proposta,id_usuario),
    CONSTRAINT fk_rateio_consenso_proposta FOREIGN KEY (id_proposta) REFERENCES assinatura_rateio_propostas(id_proposta),
    CONSTRAINT fk_rateio_consenso_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
