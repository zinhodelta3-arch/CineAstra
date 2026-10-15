-- Prompt 01 / M01: auditoria de negócio durável separada de logs HTTP e outbox.
-- NÃO aplicado automaticamente. Ator mantém tipo INT do schema usuarios.
CREATE TABLE auditoria_eventos (
    id_auditoria BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
    id_usuario INT UNSIGNED NULL,
    aggregate_id VARCHAR(20) NOT NULL,
    event_type VARCHAR(80) NOT NULL,
    occurred_at DATETIME(3) NOT NULL,
    version INT UNSIGNED NOT NULL,
    request_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE SET NULL,
    CONSTRAINT chk_auditoria_version CHECK (version > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE outbox_eventos (
    id_outbox BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
    payload JSON NOT NULL,
    status ENUM('PENDENTE','PROCESSANDO','CONCLUIDO','FALHOU') NOT NULL DEFAULT 'PENDENTE',
    tentativas INT UNSIGNED NOT NULL DEFAULT 0,
    disponivel_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    processando_desde DATETIME(3) NULL,
    CONSTRAINT fk_outbox_evento FOREIGN KEY (event_id) REFERENCES auditoria_eventos(event_id),
    CONSTRAINT chk_outbox_processing CHECK (status <> 'PROCESSANDO' OR processando_desde IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
