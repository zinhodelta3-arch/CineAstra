-- Tarefa 26: quantidade é saldo físico; reservado nunca supera o físico.
ALTER TABLE insumos
    ADD COLUMN quantidade_reservada INT NOT NULL DEFAULT 0 AFTER quantidade,
    ADD CONSTRAINT chk_insumos_reserva CHECK (quantidade_reservada >= 0 AND quantidade_reservada <= quantidade);

-- Uma reserva por insumo e pedido; reenvio do mesmo pedido deve ser idempotente.
CREATE TABLE estoque_reservas (
    id_reserva BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_pedido BIGINT UNSIGNED NOT NULL,
    id_insumo INT UNSIGNED NOT NULL,
    quantidade INT NOT NULL,
    status ENUM('ATIVA','CONSUMIDA','LIBERADA','COMPENSADA') NOT NULL DEFAULT 'ATIVA',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_estoque_reservas_pedido_insumo (id_pedido,id_insumo),
    KEY idx_estoque_reservas_insumo_status (id_insumo,status),
    CONSTRAINT chk_estoque_reservas_quantidade CHECK (quantidade > 0),
    CONSTRAINT fk_estoque_reservas_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_estoque_reservas_insumo FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE movimentacoes_estoque
    ADD COLUMN id_reserva BIGINT UNSIGNED NULL AFTER id_equipamento,
    ADD UNIQUE KEY uk_movestoque_reserva_tipo (id_reserva,tipo),
    ADD CONSTRAINT fk_movestoque_reserva FOREIGN KEY (id_reserva) REFERENCES estoque_reservas(id_reserva);
