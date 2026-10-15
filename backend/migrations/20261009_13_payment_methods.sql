-- Métodos legados permanecem sem token e não podem ser usados em cobranças novas.
ALTER TABLE metodos_pagamento
    ADD COLUMN provider VARCHAR(40) NULL,
    ADD COLUMN provider_token VARCHAR(255) COLLATE utf8mb4_bin NULL,
    ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN principal_dono INT UNSIGNED GENERATED ALWAYS AS (CASE WHEN ativo = TRUE AND principal = TRUE THEN id_usuario ELSE NULL END) STORED,
    ADD CONSTRAINT chk_metodos_token_par CHECK ((provider IS NULL AND provider_token IS NULL) OR (provider IS NOT NULL AND provider_token IS NOT NULL)),
    ADD UNIQUE KEY uk_metodos_provider_token(provider,provider_token),
    ADD UNIQUE KEY uk_metodos_principal_dono(principal_dono),
    ADD KEY idx_metodos_dono_ativo(id_usuario,ativo);

-- A chave é por pagador. Fingerprint imutável impede reutilização para outra obrigação.
-- Preparação persistente antecede qualquer chamada externa de cobrança.
CREATE TABLE pagamento_intencoes (
    id_intencao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    chave_idempotencia VARCHAR(120) NOT NULL,
    id_pedido BIGINT UNSIGNED NULL,
    id_cobranca BIGINT UNSIGNED NULL,
    id_metodo INT UNSIGNED NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    estado ENUM('PREPARADA','ENVIADA','CONCILIADA','CANCELADA') NOT NULL DEFAULT 'PREPARADA',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_intencao_pagador_chave(id_usuario,chave_idempotencia),
    KEY idx_intencao_pedido(id_pedido),
    KEY idx_intencao_cobranca(id_cobranca),
    CONSTRAINT fk_intencao_usuario FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_intencao_pedido FOREIGN KEY(id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_intencao_cobranca FOREIGN KEY(id_cobranca) REFERENCES assinatura_cobrancas(id_cobranca),
    CONSTRAINT fk_intencao_metodo FOREIGN KEY(id_metodo) REFERENCES metodos_pagamento(id_metodo),
    CONSTRAINT chk_intencao_obrigacao CHECK ((id_pedido IS NOT NULL AND id_cobranca IS NULL) OR (id_pedido IS NULL AND id_cobranca IS NOT NULL)),
    CONSTRAINT chk_intencao_valor CHECK (valor > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
