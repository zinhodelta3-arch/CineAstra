# pagamentos

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE pagamentos (
    id_pagamento BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_pedido BIGINT UNSIGNED,
    id_cobranca BIGINT UNSIGNED,
    id_metodo INT UNSIGNED NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    status ENUM('PENDENTE','APROVADO','RECUSADO','ESTORNADO') DEFAULT 'PENDENTE',
    data_pagamento DATETIME,
    transacao_id VARCHAR(150),
    CONSTRAINT chk_pagamentos_valor CHECK (valor >= 0),
    CONSTRAINT fk_pagamentos_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_pagamentos_cobranca FOREIGN KEY (id_cobranca) REFERENCES assinatura_cobrancas(id_cobranca),
    CONSTRAINT fk_pagamentos_metodo FOREIGN KEY (id_metodo) REFERENCES metodos_pagamento(id_metodo),
    CONSTRAINT chk_pagamentos_referencia CHECK (
        (id_pedido IS NOT NULL AND id_cobranca IS NULL) OR
        (id_pedido IS NULL AND id_cobranca IS NOT NULL)
    )
);
```
