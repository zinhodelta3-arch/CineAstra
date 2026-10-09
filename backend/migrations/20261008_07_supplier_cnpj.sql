-- Tarefa 22: CNPJ numérico e alfanumérico normalizados/únicos após o ALTER nome_cine legado.
-- Antes de aplicar, auditar duplicatas legadas por pontuação/caixa; DDL falha se existirem.
ALTER TABLE fornecedores
    ADD COLUMN cnpj_normalizado CHAR(14) CHARACTER SET ascii COLLATE ascii_bin
        GENERATED ALWAYS AS (UPPER(REPLACE(REPLACE(REPLACE(TRIM(cnpj), '.', ''), '/', ''), '-', ''))) STORED,
    ADD UNIQUE KEY uk_fornecedores_cnpj_normalizado (cnpj_normalizado);
