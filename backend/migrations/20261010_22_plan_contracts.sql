-- Beneficios de catálogo e combo elegivel sao configurados no plano, mas
-- contratos existentes mantem o snapshot da oferta aceita pelo cliente.
ALTER TABLE planos
    ADD COLUMN acesso_catalogo BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN id_combo_medio INT UNSIGNED NULL,
    ADD CONSTRAINT fk_planos_combo_medio FOREIGN KEY (id_combo_medio) REFERENCES combos(id_combo),
    ADD CONSTRAINT chk_planos_limite_membros CHECK (limite_membros BETWEEN 1 AND 100);

ALTER TABLE assinaturas
    ADD COLUMN chave_contratacao VARCHAR(120) COLLATE utf8mb4_bin NULL,
    ADD COLUMN contratacao_hash CHAR(64) COLLATE utf8mb4_bin NULL,
    ADD COLUMN contrato_snapshot JSON NULL,
    ADD COLUMN preco_contratado DECIMAL(10,2) NULL,
    ADD COLUMN limite_membros_contratado INT UNSIGNED NULL,
    ADD UNIQUE KEY uk_assinatura_titular_chave (id_usuario,chave_contratacao),
    ADD CONSTRAINT chk_assinatura_preco_contratado CHECK (preco_contratado IS NULL OR preco_contratado > 0);

-- Um pedido de beneficio por assinatura/competencia. SOLICITADO nao significa
-- retirada: estoque e comprovacao operacional exigem etapa posterior.
CREATE TABLE beneficio_resgates (
    id_resgate BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_assinatura INT UNSIGNED NOT NULL,
    id_usuario INT UNSIGNED NOT NULL,
    id_combo INT UNSIGNED NOT NULL,
    competencia DATE NOT NULL,
    status ENUM('SOLICITADO','ENTREGUE','CANCELADO') NOT NULL DEFAULT 'SOLICITADO',
    solicitado_em DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE KEY uk_resgate_assinatura_competencia (id_assinatura,competencia),
    CONSTRAINT fk_resgate_assinatura FOREIGN KEY (id_assinatura) REFERENCES assinaturas(id_assinatura),
    CONSTRAINT fk_resgate_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_resgate_combo FOREIGN KEY (id_combo) REFERENCES combos(id_combo)
);
