-- Chave por cliente e operacao; payload canonico impede reutilizacao alterada.
-- Pedidos legados permanecem NULL e fora do job de expiracao.
ALTER TABLE pedidos
    ADD COLUMN checkout_key VARCHAR(120) COLLATE utf8mb4_bin NULL,
    ADD COLUMN checkout_hash CHAR(64) COLLATE utf8mb4_bin NULL,
    ADD COLUMN checkout_expira_em DATETIME(3) NULL,
    ADD UNIQUE KEY uk_pedidos_checkout_usuario_chave (id_usuario,checkout_key),
    ADD KEY ix_pedidos_checkout_expira (status,checkout_expira_em),
    ADD CONSTRAINT chk_pedidos_checkout_meta CHECK
      ((checkout_key IS NULL AND checkout_hash IS NULL AND checkout_expira_em IS NULL) OR
       (checkout_key IS NOT NULL AND checkout_hash IS NOT NULL AND checkout_expira_em IS NOT NULL));

-- Alinha a precisao do cupom ao deadline do pedido, sem janela subsegundo falsa.
ALTER TABLE cupom_utilizacoes MODIFY expira_em DATETIME(3) NULL;
