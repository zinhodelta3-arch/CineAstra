# notificacoes

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE notificacoes (
    id_notificacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT,
    tipo VARCHAR(50),
    lida BOOLEAN DEFAULT FALSE,
    data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notificacoes_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```
