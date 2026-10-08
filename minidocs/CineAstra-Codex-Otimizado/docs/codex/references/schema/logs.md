# logs

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE logs (
    id_log BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    id_usuario INT UNSIGNED NULL,

    rota VARCHAR(255) NOT NULL,
    metodo VARCHAR(16) NOT NULL,

    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(512) NULL,

    status_code SMALLINT UNSIGNED NOT NULL,
    tempo_resposta_ms INT UNSIGNED NOT NULL,
    tamanho_resposta_bytes INT UNSIGNED NULL,

    data_hora DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    dados_requisicao JSON NULL,
    dados_resposta JSON NULL,

    PRIMARY KEY (id_log),

    CONSTRAINT fk_logs_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE SET NULL,

    CONSTRAINT chk_logs_status_code
        CHECK (status_code BETWEEN 100 AND 599)
);
```
