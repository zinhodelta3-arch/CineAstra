# cupons

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE cupons (
    id_cupom INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    desconto DECIMAL(5,2) NOT NULL,
    validade DATE NOT NULL,
    limite_uso INT DEFAULT 0 COMMENT '0 = ilimitado',
    ativo BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_cupons_desconto CHECK (desconto >= 0 AND desconto <= 100),
    CONSTRAINT chk_cupons_limite_uso CHECK (limite_uso >= 0)
);
```
