# metodos_pagamento

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE metodos_pagamento (
    id_metodo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    tipo ENUM('CREDITO','DEBITO','PIX','BOLETO') NOT NULL,
    identificacao VARCHAR(100) COMMENT 'ex.: últimos 4 dígitos do cartão',
    principal BOOLEAN DEFAULT FALSE,
    CONSTRAINT fk_metodospagto_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```
