# tickets

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE tickets (
    id_ticket BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_item BIGINT UNSIGNED NOT NULL,
    codigo VARCHAR(100) NOT NULL UNIQUE,
    tipo ENUM('INGRESSO_SESSAO','RETIRADA_INSUMO','ACESSO_STREAMING') NOT NULL,
    status ENUM('GERADO','UTILIZADO','CANCELADO','EXPIRADO') DEFAULT 'GERADO',
    data_geracao DATETIME DEFAULT CURRENT_TIMESTAMP,
    data_utilizacao DATETIME,
    CONSTRAINT fk_tickets_item FOREIGN KEY (id_item) REFERENCES itens_pedido(id_item)
);
```
