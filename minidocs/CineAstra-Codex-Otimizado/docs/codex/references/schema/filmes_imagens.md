# filmes_imagens

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE filmes_imagens (
    id_imagem BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_filme INT UNSIGNED NOT NULL,
    tipo ENUM('CAPA','BANNER','ALTERNATIVA') NOT NULL DEFAULT 'ALTERNATIVA',
    url VARCHAR(2048) NOT NULL,
    texto_alternativo VARCHAR(255) NULL,
    ordem INT UNSIGNED NOT NULL DEFAULT 0,
    principal BOOLEAN NOT NULL DEFAULT FALSE,
    tipo_principal VARCHAR(20) GENERATED ALWAYS AS (
        CASE WHEN principal = 1 THEN tipo ELSE NULL END
    ) STORED,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_filmes_imagens_principal (id_filme, tipo_principal),
    KEY idx_filmes_imagens_galeria (id_filme, tipo, ordem, id_imagem),
    CONSTRAINT chk_filmes_imagens_url CHECK (CHAR_LENGTH(TRIM(url)) > 0),
    CONSTRAINT chk_filmes_imagens_principal CHECK (principal IN (0, 1)),
    CONSTRAINT fk_filmes_imagens_filme FOREIGN KEY (id_filme)
        REFERENCES filmes(id_filme) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
