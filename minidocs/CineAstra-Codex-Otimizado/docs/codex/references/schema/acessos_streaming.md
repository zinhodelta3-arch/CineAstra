# acessos_streaming

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE acessos_streaming (
    id_acesso BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_item BIGINT UNSIGNED NOT NULL UNIQUE,
    id_usuario INT UNSIGNED NOT NULL,
    id_filme INT UNSIGNED NOT NULL,
    data_inicio DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_expiracao DATETIME COMMENT 'NULL para compra definitiva',
    status ENUM('ATIVO','EXPIRADO','REVOGADO') DEFAULT 'ATIVO',
    CONSTRAINT fk_acessostream_item FOREIGN KEY (id_item) REFERENCES itens_pedido(id_item),
    CONSTRAINT fk_acessostream_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_acessostream_filme FOREIGN KEY (id_filme) REFERENCES filmes(id_filme)
);
```
