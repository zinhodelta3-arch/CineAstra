# newsletter_categorias

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE newsletter_categorias (
    id_categoria INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_newsletter_categorias_ativo CHECK (ativo IN (0, 1)),
    CONSTRAINT chk_newsletter_categorias_codigo CHECK (
        CHAR_LENGTH(TRIM(codigo)) > 0
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
