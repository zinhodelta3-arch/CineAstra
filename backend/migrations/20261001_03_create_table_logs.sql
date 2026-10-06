-- Migration: Criar tabela logs
-- Data: 2026-05-28
-- Descrição: Criação de tabela para armazenar informações de requisições passadas

USE cineastra;

CREATE TABLE IF NOT EXISTS logs (
    id_log BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    id_usuario INT UNSIGNED NULL,

    rota VARCHAR(255) NOT NULL,
    metodo VARCHAR(16) NOT NULL,

    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(512) NULL,

    status_code SMALLINT UNSIGNED NOT NULL,
    tempo_resposta_ms INT UNSIGNED NOT NULL,
    tamanho_resposta_bytes INT UNSIGNED NULL,

    data_hora DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    dados_requisicao JSON NULL,
    dados_resposta JSON NULL,

    PRIMARY KEY (id_log),

    CONSTRAINT fk_logs_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL,

    CONSTRAINT chk_logs_status_code
        CHECK (status_code BETWEEN 100 AND 599)
);

CREATE INDEX idx_logs_data_hora
    ON logs(data_hora);

CREATE INDEX idx_logs_usuario_data
    ON logs(id_usuario, data_hora);

CREATE INDEX idx_logs_status_data
    ON logs(status_code, data_hora);


DROP EVENT IF EXISTS ev_logs_expurgo;

CREATE EVENT ev_logs_expurgo
ON SCHEDULE EVERY 15 MINUTE
STARTS CURRENT_TIMESTAMP + INTERVAL 15 MINUTE
ON COMPLETION PRESERVE
ENABLE
COMMENT 'Expurgo gradual de logs HTTP com mais de 90 dias'
DO
    DELETE FROM logs
    WHERE data_hora < CURRENT_TIMESTAMP(3) - INTERVAL 90 DAY
    ORDER BY data_hora ASC
    LIMIT 5000;