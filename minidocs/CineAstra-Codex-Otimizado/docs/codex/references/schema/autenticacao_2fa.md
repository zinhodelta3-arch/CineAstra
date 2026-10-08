# autenticacao_2fa

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE autenticacao_2fa (
    id_2fa INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    metodo ENUM('APP','SMS','EMAIL') NOT NULL DEFAULT 'APP',
    chave VARCHAR(255),
    ativo BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_2fa_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```
