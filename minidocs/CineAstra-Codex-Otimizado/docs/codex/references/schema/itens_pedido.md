# itens_pedido

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE itens_pedido (
    id_item BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_pedido BIGINT UNSIGNED NOT NULL,
    id_insumo INT UNSIGNED,
    id_combo INT UNSIGNED,
    id_sessao INT UNSIGNED,
    id_assento INT UNSIGNED,
    id_filme INT UNSIGNED,
    tipo_streaming ENUM('ALUGUEL','COMPRA'),
    tipo_ingresso ENUM('INTEIRA','MEIA','ISENTA') DEFAULT 'INTEIRA',
    quantidade INT NOT NULL DEFAULT 1,
    valor_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    CONSTRAINT fk_itenspedido_pedido FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    CONSTRAINT fk_itenspedido_insumo FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo),
    CONSTRAINT fk_itenspedido_combo FOREIGN KEY (id_combo) REFERENCES combos(id_combo),
    CONSTRAINT fk_itenspedido_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao),
    CONSTRAINT fk_itenspedido_assento FOREIGN KEY (id_assento) REFERENCES assentos(id_assento),
    CONSTRAINT fk_itenspedido_filme FOREIGN KEY (id_filme) REFERENCES filmes(id_filme),
    UNIQUE KEY uk_sessao_assento (id_sessao, id_assento) COMMENT 'impede vender o mesmo assento duas vezes na mesma sessão',
    CONSTRAINT chk_itenspedido_quantidade CHECK (quantidade > 0),
    CONSTRAINT chk_itenspedido_sessao_qtd CHECK (id_sessao IS NULL OR quantidade = 1),
    CONSTRAINT chk_itenspedido_valores CHECK (valor_unitario >= 0 AND subtotal >= 0),
    CONSTRAINT chk_itenspedido_tipo CHECK (
        (id_insumo IS NOT NULL AND id_combo IS NULL AND id_sessao IS NULL AND id_filme IS NULL AND id_assento IS NULL) OR
        (id_insumo IS NULL AND id_combo IS NOT NULL AND id_sessao IS NULL AND id_filme IS NULL AND id_assento IS NULL) OR
        (id_insumo IS NULL AND id_combo IS NULL AND id_sessao IS NOT NULL AND id_filme IS NULL AND id_assento IS NOT NULL) OR
        (id_insumo IS NULL AND id_combo IS NULL AND id_sessao IS NULL AND id_filme IS NOT NULL AND id_assento IS NULL)
    ),
    CONSTRAINT chk_itenspedido_streaming CHECK (
        (id_filme IS NOT NULL AND tipo_streaming IS NOT NULL) OR
        (id_filme IS NULL AND tipo_streaming IS NULL)
    )
);
```
