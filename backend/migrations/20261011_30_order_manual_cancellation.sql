-- Recibo de idempotência da ação de cancelamento do titular.
-- O status do pedido continua sendo a fonte da verdade; não duplica reservas nem pagamentos.
CREATE TABLE pedido_cancelamentos (
    id_cancelamento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    id_pedido BIGINT UNSIGNED NOT NULL,
    chave_idempotencia VARCHAR(120) NOT NULL,
    criado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_pedido_cancelamento_usuario_chave(id_usuario,chave_idempotencia),
    KEY idx_pedido_cancelamento_pedido(id_pedido),
    CONSTRAINT fk_pedido_cancelamento_usuario FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_pedido_cancelamento_pedido FOREIGN KEY(id_pedido) REFERENCES pedidos(id_pedido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
