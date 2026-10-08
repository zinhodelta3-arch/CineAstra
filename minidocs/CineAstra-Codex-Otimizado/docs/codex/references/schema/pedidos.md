# pedidos

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE pedidos (
    id_pedido BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    id_cupom INT UNSIGNED,
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('EM_ANDAMENTO','AGUARDANDO_PAGAMENTO','PAGO','CANCELADO','FINALIZADO') DEFAULT 'EM_ANDAMENTO',
    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT chk_pedidos_valor_total CHECK (valor_total >= 0),
    CONSTRAINT fk_pedidos_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_pedidos_cupom FOREIGN KEY (id_cupom) REFERENCES cupons(id_cupom)
);
```
