# newsletter_tokens

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE newsletter_tokens (
    id_token BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_inscrito INT UNSIGNED NOT NULL,
    finalidade ENUM('CONFIRMACAO','DESCADASTRO') NOT NULL,
    token_hash BINARY(32) NOT NULL,
    criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expira_em DATETIME NOT NULL,
    utilizado_em DATETIME NULL,
    UNIQUE KEY uk_newsletter_tokens_hash (token_hash),
    KEY idx_newsletter_tokens_inscrito (id_inscrito, finalidade, utilizado_em),
    KEY idx_newsletter_tokens_expiracao (expira_em),
    CONSTRAINT chk_newsletter_tokens_expiracao CHECK (expira_em > criado_em),
    CONSTRAINT chk_newsletter_tokens_utilizacao CHECK (
        utilizado_em IS NULL OR utilizado_em >= criado_em
    ),
    CONSTRAINT fk_newsletter_tokens_inscrito FOREIGN KEY (id_inscrito)
        REFERENCES newsletter_inscritos(id_inscrito) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
