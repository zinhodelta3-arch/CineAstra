# newsletter_envios

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE newsletter_envios (
    id_envio BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_campanha INT UNSIGNED NOT NULL,
    id_inscrito INT UNSIGNED NOT NULL,
    status ENUM('PENDENTE','PROCESSANDO','ENVIADO','FALHOU','CANCELADO')
        NOT NULL DEFAULT 'PENDENTE',
    tentativas INT UNSIGNED NOT NULL DEFAULT 0,
    ultima_tentativa_em DATETIME NULL,
    processando_desde DATETIME NULL COMMENT 'Permite recuperar jobs abandonados',
    enviado_em DATETIME NULL,
    id_mensagem_provedor VARCHAR(255) NULL,
    ultimo_erro TEXT NULL,
    data_cadastro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_newsletter_envios_destinatario (id_campanha, id_inscrito),
    KEY idx_newsletter_envios_fila (status, id_campanha, id_envio),
    KEY idx_newsletter_envios_recuperacao (status, processando_desde),
    CONSTRAINT chk_newsletter_envios_enviado CHECK (
        status <> 'ENVIADO' OR enviado_em IS NOT NULL
    ),
    CONSTRAINT chk_newsletter_envios_processando CHECK (
        status <> 'PROCESSANDO' OR processando_desde IS NOT NULL
    ),
    CONSTRAINT fk_newsletter_envios_campanha FOREIGN KEY (id_campanha)
        REFERENCES newsletter_campanhas(id_campanha),
    CONSTRAINT fk_newsletter_envios_inscrito FOREIGN KEY (id_inscrito)
        REFERENCES newsletter_inscritos(id_inscrito) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```
