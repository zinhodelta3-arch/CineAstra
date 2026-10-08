# recuperacao_senha

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE recuperacao_senha (
    id_recuperacao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    token VARCHAR(255) NOT NULL,
    expiracao DATETIME NOT NULL,
    utilizado BOOLEAN DEFAULT FALSE,
    UNIQUE KEY uk_recuperacao_token (token),
    CONSTRAINT fk_recuperacao_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```
