# newsletter_preferencias

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE newsletter_preferencias (
    id_inscrito INT UNSIGNED NOT NULL,
    id_categoria INT UNSIGNED NOT NULL,
    aceita BOOLEAN NOT NULL DEFAULT FALSE,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id_inscrito, id_categoria),
    KEY idx_newsletter_preferencias_publico (id_categoria, aceita, id_inscrito),
    CONSTRAINT chk_newsletter_preferencias_aceita CHECK (aceita IN (0, 1)),
    CONSTRAINT fk_newsletter_preferencias_inscrito FOREIGN KEY (id_inscrito)
        REFERENCES newsletter_inscritos(id_inscrito) ON DELETE CASCADE,
    CONSTRAINT fk_newsletter_preferencias_categoria FOREIGN KEY (id_categoria)
        REFERENCES newsletter_categorias(id_categoria)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
