# movimentacoes_estoque

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE movimentacoes_estoque (
    id_movimentacao BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_insumo INT UNSIGNED,
    id_equipamento INT UNSIGNED,
    id_usuario INT UNSIGNED NOT NULL,
    tipo ENUM('ENTRADA','SAIDA','AJUSTE','PERDA','DEVOLUCAO') NOT NULL,
    quantidade INT NOT NULL,
    motivo VARCHAR(255),
    data_movimentacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_movestoque_insumo FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo),
    CONSTRAINT fk_movestoque_equipamento FOREIGN KEY (id_equipamento) REFERENCES equipamentos(id_equipamento),
    CONSTRAINT fk_movestoque_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_movestoque_quantidade CHECK (quantidade <> 0),
    CONSTRAINT chk_movestoque_item CHECK (
        (id_insumo IS NOT NULL AND id_equipamento IS NULL) OR
        (id_insumo IS NULL AND id_equipamento IS NOT NULL)
    )
);
```
