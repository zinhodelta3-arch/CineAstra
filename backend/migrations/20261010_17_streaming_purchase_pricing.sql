-- Compra de streaming tem custo proprio; NULL exige cadastro antes da venda.
ALTER TABLE filmes ADD COLUMN custo_streaming_compra DECIMAL(10,2) NULL,
    ADD CONSTRAINT chk_filmes_custo_compra CHECK (custo_streaming_compra IS NULL OR custo_streaming_compra >= 0);
ALTER TABLE precificacao_parametros MODIFY categoria ENUM('SESSION','INPUT','COMBO','RENTAL','PURCHASE','PLAN') NOT NULL;
INSERT INTO precificacao_parametros(categoria) VALUES ('PURCHASE');
ALTER TABLE plano_beneficios MODIFY categoria ENUM('SESSION','INPUT','COMBO','RENTAL','PURCHASE') NOT NULL;
ALTER TABLE promocoes_precificacao MODIFY categoria ENUM('SESSION','INPUT','COMBO','RENTAL','PURCHASE','PLAN') NOT NULL;
