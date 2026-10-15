-- Valores legados preservados. Parcial só altera o estado após confirmação do gateway.
ALTER TABLE pagamentos MODIFY COLUMN status ENUM('PENDENTE','APROVADO','RECUSADO','PARCIALMENTE_ESTORNADO','ESTORNADO') DEFAULT 'PENDENTE';

CREATE TABLE reembolso_solicitacoes (
    id_reembolso BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_pagamento BIGINT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    chave_idempotencia VARCHAR(120) NOT NULL,
    motivo ENUM('ARREPENDIMENTO','DEFEITO','OUTRO','CANCELAMENTO_PLANO') NOT NULL,
    detalhes VARCHAR(1000) NULL,
    dentro_prazo BOOLEAN NOT NULL,
    termos_versao VARCHAR(50) NULL,
    decisao_fundamento VARCHAR(1000) NULL,
    valor_solicitado DECIMAL(10,2) NULL,
    valor_confirmado DECIMAL(10,2) NULL,
    status ENUM('RECEBIDA','EM_ANALISE','ENVIADA','CONFIRMADA','NEGADA','FALHOU') NOT NULL DEFAULT 'RECEBIDA',
    provider_ref VARCHAR(150) COLLATE utf8mb4_bin NULL,
    compensacao_status ENUM('NAO_APLICAVEL','PENDENTE','CONCLUIDA') NOT NULL DEFAULT 'NAO_APLICAVEL',
    solicitado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    prazo_resposta_em DATETIME(3) NOT NULL,
    respondido_em DATETIME(3) NULL,
    aberta_pagamento BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status IN ('RECEBIDA','EM_ANALISE','ENVIADA') THEN id_pagamento ELSE NULL END) STORED,
    UNIQUE KEY uk_reembolso_usuario_chave(id_usuario,chave_idempotencia),
    UNIQUE KEY uk_reembolso_aberto(aberta_pagamento),
    KEY idx_reembolso_pagamento(id_pagamento),
    CONSTRAINT fk_reembolso_pagamento FOREIGN KEY(id_pagamento) REFERENCES pagamentos(id_pagamento),
    CONSTRAINT fk_reembolso_usuario FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_reembolso_valores CHECK ((valor_solicitado IS NULL OR valor_solicitado > 0) AND (valor_confirmado IS NULL OR (valor_confirmado > 0 AND valor_confirmado <= valor_solicitado)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
