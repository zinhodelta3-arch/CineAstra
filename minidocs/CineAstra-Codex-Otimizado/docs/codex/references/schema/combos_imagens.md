# combos_imagens

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE combos_imagens (
    id_imagem BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_combo INT UNSIGNED NOT NULL,
    tipo ENUM('PRINCIPAL','ALTERNATIVA') NOT NULL DEFAULT 'ALTERNATIVA',
    url VARCHAR(2048) NOT NULL,
    texto_alternativo VARCHAR(255) NULL,
    ordem INT UNSIGNED NOT NULL DEFAULT 0,
    slot_principal TINYINT GENERATED ALWAYS AS (
        CASE WHEN tipo = 'PRINCIPAL' THEN 1 ELSE NULL END
    ) STORED,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_combos_imagens_principal (id_combo, slot_principal),
    KEY idx_combos_imagens_galeria (id_combo, tipo, ordem, id_imagem),
    CONSTRAINT chk_combos_imagens_url CHECK (CHAR_LENGTH(TRIM(url)) > 0),
    CONSTRAINT fk_combos_imagens_combo FOREIGN KEY (id_combo)
        REFERENCES combos(id_combo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
