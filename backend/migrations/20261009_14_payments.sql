-- Tarefa 30: não alterar pagamentos legados nem inferir aprovação deles.
ALTER TABLE pagamento_intencoes
    ADD COLUMN provider VARCHAR(40) NULL,
    ADD COLUMN provider_ref VARCHAR(150) COLLATE utf8mb4_bin NULL,
    ADD COLUMN moeda CHAR(3) NOT NULL DEFAULT 'BRL',
    ADD COLUMN enviado_em DATETIME(3) NULL,
    ADD COLUMN ultimo_evento_em DATETIME(3) NULL,
    ADD CONSTRAINT chk_intencao_moeda CHECK (moeda = 'BRL'),
    ADD KEY idx_intencao_provider_ref(provider,provider_ref);

ALTER TABLE pagamentos
    ADD COLUMN id_intencao BIGINT UNSIGNED NULL,
    ADD UNIQUE KEY uk_pagamentos_intencao(id_intencao),
    ADD CONSTRAINT fk_pagamentos_intencao FOREIGN KEY(id_intencao) REFERENCES pagamento_intencoes(id_intencao);

CREATE TABLE pagamento_gateway_eventos (
    id_gateway_evento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    provider VARCHAR(40) NOT NULL,
    evento_id VARCHAR(150) COLLATE utf8mb4_bin NOT NULL,
    id_intencao BIGINT UNSIGNED NOT NULL,
    tipo ENUM('WEBHOOK','CONSULTA') NOT NULL,
    status ENUM('PENDENTE','APROVADO','RECUSADO') NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    moeda CHAR(3) NOT NULL,
    ocorrido_em DATETIME(3) NOT NULL,
    recebido_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_gateway_evento(provider,evento_id),
    KEY idx_gateway_evento_intencao(id_intencao,ocorrido_em),
    CONSTRAINT fk_gateway_evento_intencao FOREIGN KEY(id_intencao) REFERENCES pagamento_intencoes(id_intencao),
    CONSTRAINT chk_gateway_evento_valor CHECK(valor > 0),
    CONSTRAINT chk_gateway_evento_moeda CHECK(moeda = 'BRL')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
