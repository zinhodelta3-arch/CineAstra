# insumos_imagens

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE insumos_imagens (
    id_imagem BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_insumo INT UNSIGNED NOT NULL,
    tipo ENUM('PRINCIPAL','ALTERNATIVA') NOT NULL DEFAULT 'ALTERNATIVA',
    url VARCHAR(2048) NOT NULL,
    texto_alternativo VARCHAR(255) NULL,
    ordem INT UNSIGNED NOT NULL DEFAULT 0,
    slot_principal TINYINT GENERATED ALWAYS AS (
        CASE WHEN tipo = 'PRINCIPAL' THEN 1 ELSE NULL END
    ) STORED,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_insumos_imagens_principal (id_insumo, slot_principal),
    KEY idx_insumos_imagens_galeria (id_insumo, tipo, ordem, id_imagem),
    CONSTRAINT chk_insumos_imagens_url CHECK (CHAR_LENGTH(TRIM(url)) > 0),
    CONSTRAINT fk_insumos_imagens_insumo FOREIGN KEY (id_insumo)
        REFERENCES insumos(id_insumo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
