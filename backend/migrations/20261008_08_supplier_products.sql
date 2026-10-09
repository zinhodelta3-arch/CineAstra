-- Tarefa 23: autorização operacional explícita por fornecedor/local.
CREATE TABLE fornecedor_locais (
    id_fornecedor INT UNSIGNED NOT NULL,
    id_local INT UNSIGNED NOT NULL,
    status ENUM('ATIVO','INATIVO') NOT NULL DEFAULT 'ATIVO',
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_fornecedor,id_local),
    KEY idx_fornecedor_locais_local (id_local,status),
    CONSTRAINT fk_fornecedor_locais_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor),
    CONSTRAINT fk_fornecedor_locais_local FOREIGN KEY (id_local) REFERENCES locais(id_local)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Patrimônio já é UNIQUE literal; a chave gerada fecha variações de caixa/espaços.
-- Auditar duplicatas legadas antes de aplicar este ALTER.
ALTER TABLE equipamentos
    ADD COLUMN patrimonio_normalizado VARCHAR(100)
        GENERATED ALWAYS AS (NULLIF(UPPER(TRIM(numero_patrimonio)), '')) STORED,
    ADD UNIQUE KEY uk_equipamentos_patrimonio_normalizado (patrimonio_normalizado);
