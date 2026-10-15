-- Ciclos e encargos preservam o valor contratado e o histórico financeiro.
ALTER TABLE assinatura_cobrancas
    ADD COLUMN juros_mora DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN correcao_ipca DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN encargos_calculados_ate DATE NULL,
    ADD COLUMN ipca_periodo_final CHAR(6) NULL,
    ADD CONSTRAINT chk_cobrancas_encargos CHECK (juros_mora >= 0);

ALTER TABLE assinaturas
    ADD COLUMN suspenso_por_cobranca BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE assinatura_participantes
    ADD COLUMN suspenso_por_cobranca BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE assinatura_ciclos (
    id_ciclo BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_assinatura INT UNSIGNED NOT NULL,
    competencia DATE NOT NULL,
    vencimento DATE NOT NULL,
    tipo_divisao ENUM('TITULAR_PAGA','DIVISAO_IGUAL') NOT NULL,
    valor_total DECIMAL(10,2) NOT NULL,
    participantes_snapshot JSON NOT NULL,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_assinatura_ciclo (id_assinatura,competencia),
    CONSTRAINT fk_ciclo_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT chk_ciclo_total CHECK (valor_total > 0)
);

CREATE TABLE assinatura_cobranca_marcos (
    id_marco BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_cobranca BIGINT UNSIGNED NOT NULL,
    marco ENUM('ATRASO_1','SUSPENSAO_8','CANCELAMENTO_30') NOT NULL,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_cobranca_marco (id_cobranca,marco),
    CONSTRAINT fk_marco_cobranca FOREIGN KEY (id_cobranca) REFERENCES assinatura_cobrancas(id_cobranca)
);
