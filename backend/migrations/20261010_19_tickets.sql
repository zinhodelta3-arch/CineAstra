-- O combo escolhe uma sessao no checkout; itens historicos permanecem NULL.
ALTER TABLE itens_pedido
    ADD COLUMN id_sessao_retirada INT UNSIGNED NULL,
    ADD KEY ix_itens_sessao_retirada (id_sessao_retirada),
    ADD CONSTRAINT fk_itens_sessao_retirada FOREIGN KEY (id_sessao_retirada) REFERENCES sessoes(id_sessao),
    ADD CONSTRAINT chk_itens_sessao_retirada CHECK (id_sessao_retirada IS NULL OR id_combo IS NOT NULL);

-- Preflight: auditar tickets legados repetidos por item/tipo antes desta UNIQUE.
-- Uma unidade por ticket permite retirada parcial sem estado fracionario ambiguo.
ALTER TABLE tickets
    ADD COLUMN unidade INT UNSIGNED NOT NULL DEFAULT 1,
    ADD COLUMN id_sessao_retirada INT UNSIGNED NULL,
    ADD COLUMN expira_em DATETIME(3) NULL,
    ADD COLUMN conferido_por INT UNSIGNED NULL,
    ADD COLUMN meia_comprovacao ENUM('CIE','PCD','ID_JOVEM','IDOSO') NULL,
    ADD COLUMN saida_em DATETIME(3) NULL,
    ADD COLUMN saida_por INT UNSIGNED NULL,
    ADD UNIQUE KEY uk_ticket_item_tipo_unidade (id_item,tipo,unidade),
    ADD KEY ix_ticket_sessao_retirada (id_sessao_retirada,status),
    ADD CONSTRAINT fk_ticket_sessao_retirada FOREIGN KEY (id_sessao_retirada) REFERENCES sessoes(id_sessao),
    ADD CONSTRAINT fk_ticket_conferido_por FOREIGN KEY (conferido_por) REFERENCES usuarios(id_usuario),
    ADD CONSTRAINT fk_ticket_saida_por FOREIGN KEY (saida_por) REFERENCES usuarios(id_usuario),
    ADD CONSTRAINT chk_ticket_unidade CHECK (unidade > 0),
    ADD CONSTRAINT chk_ticket_meia CHECK (meia_comprovacao IS NULL OR conferido_por IS NOT NULL),
    ADD CONSTRAINT chk_ticket_saida CHECK ((saida_em IS NULL AND saida_por IS NULL) OR (saida_em IS NOT NULL AND saida_por IS NOT NULL AND status='UTILIZADO' AND tipo='INGRESSO_SESSAO'));
