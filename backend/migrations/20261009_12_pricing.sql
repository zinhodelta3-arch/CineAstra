-- Tarefa 28: custos ausentes permanecem NULL até cadastramento real pelo ADMIN.
ALTER TABLE insumos ADD COLUMN custo_receita DECIMAL(10,2) NULL, ADD COLUMN custo_parceria DECIMAL(10,2) NULL,
    ADD CONSTRAINT chk_insumos_custos CHECK ((custo_receita IS NULL OR custo_receita >= 0) AND (custo_parceria IS NULL OR custo_parceria >= 0));
ALTER TABLE sessoes ADD COLUMN custo_local_dia DECIMAL(10,2) NULL, ADD COLUMN custo_exibicao DECIMAL(10,2) NULL,
    ADD CONSTRAINT chk_sessoes_custos CHECK ((custo_local_dia IS NULL OR custo_local_dia >= 0) AND (custo_exibicao IS NULL OR custo_exibicao >= 0));
ALTER TABLE filmes ADD COLUMN custo_streaming_dia DECIMAL(10,2) NULL,
    ADD CONSTRAINT chk_filmes_custo_streaming CHECK (custo_streaming_dia IS NULL OR custo_streaming_dia >= 0);
ALTER TABLE combos ADD COLUMN custo_operacional DECIMAL(10,2) NULL,
    ADD CONSTRAINT chk_combos_custo CHECK (custo_operacional IS NULL OR custo_operacional >= 0);
ALTER TABLE planos ADD COLUMN custo_beneficios_mensal DECIMAL(10,2) NULL, ADD COLUMN custo_beneficios_anual DECIMAL(10,2) NULL,
    ADD COLUMN combo_gratis_mes INT NOT NULL DEFAULT 0,
    ADD CONSTRAINT chk_planos_custos CHECK ((custo_beneficios_mensal IS NULL OR custo_beneficios_mensal >= 0) AND (custo_beneficios_anual IS NULL OR custo_beneficios_anual >= 0) AND combo_gratis_mes >= 0);

CREATE TABLE precificacao_parametros (
    categoria ENUM('SESSION','INPUT','COMBO','RENTAL','PLAN') PRIMARY KEY,
    markup_bps SMALLINT UNSIGNED NOT NULL DEFAULT 6000,
    margem_alerta_bps SMALLINT UNSIGNED NOT NULL DEFAULT 2000,
    teto_desconto_bps SMALLINT UNSIGNED NOT NULL DEFAULT 2500,
    ocupacao_referencia SMALLINT UNSIGNED NOT NULL DEFAULT 20,
    meia_projecao_bps SMALLINT UNSIGNED NOT NULL DEFAULT 5000,
    combo_passo_bps SMALLINT UNSIGNED NOT NULL DEFAULT 500,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_precificacao_parametros CHECK (markup_bps <= 30000 AND margem_alerta_bps <= 10000 AND teto_desconto_bps <= 10000 AND ocupacao_referencia > 0 AND meia_projecao_bps <= 10000 AND combo_passo_bps <= 10000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO precificacao_parametros(categoria) VALUES ('SESSION'),('INPUT'),('COMBO'),('RENTAL'),('PLAN');

CREATE TABLE plano_beneficios (
    id_plano INT UNSIGNED NOT NULL,
    categoria ENUM('SESSION','INPUT','COMBO','RENTAL') NOT NULL,
    desconto_bps SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY(id_plano,categoria),
    CONSTRAINT fk_plano_beneficios_plano FOREIGN KEY(id_plano) REFERENCES planos(id_plano),
    CONSTRAINT chk_plano_beneficios_desconto CHECK(desconto_bps <= 10000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE promocoes_precificacao (
    id_promocao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    categoria ENUM('SESSION','INPUT','COMBO','RENTAL','PLAN') NOT NULL,
    desconto_bps SMALLINT UNSIGNED NOT NULL,
    publico_geral BOOLEAN NOT NULL DEFAULT FALSE,
    inicio DATETIME NOT NULL,
    fim DATETIME NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_promocoes_desconto CHECK(desconto_bps > 0 AND desconto_bps <= 10000),
    CONSTRAINT chk_promocoes_periodo CHECK(fim > inicio),
    KEY idx_promocoes_ativas(categoria,ativo,inicio,fim)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Histórico anterior com cupom precisa ser auditado antes da migração. A importação
-- conservadora conta pedidos não cancelados; consumo real só ocorre no checkout.
CREATE TABLE cupom_utilizacoes (
    id_pedido BIGINT UNSIGNED PRIMARY KEY,
    id_cupom INT UNSIGNED NOT NULL,
    desconto_bps SMALLINT UNSIGNED NOT NULL,
    status ENUM('RESERVADO','CONFIRMADO','LIBERADO') NOT NULL DEFAULT 'RESERVADO',
    expira_em DATETIME NULL,
    utilizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_cupom_utilizacoes_cupom(id_cupom),
    CONSTRAINT fk_cupom_utilizacoes_pedido FOREIGN KEY(id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_cupom_utilizacoes_cupom FOREIGN KEY(id_cupom) REFERENCES cupons(id_cupom)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
INSERT INTO cupom_utilizacoes(id_pedido,id_cupom,desconto_bps,status)
    SELECT id_pedido,id_cupom,CAST(ROUND(desconto*100,0) AS UNSIGNED),'CONFIRMADO' FROM pedidos JOIN cupons USING(id_cupom)
    WHERE id_cupom IS NOT NULL AND pedidos.status <> 'CANCELADO';

CREATE TABLE pedido_precificacao (
    id_pedido BIGINT UNSIGNED PRIMARY KEY,
    snapshot JSON NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedido_precificacao_pedido FOREIGN KEY(id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT chk_pedido_precificacao_total CHECK(total >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
