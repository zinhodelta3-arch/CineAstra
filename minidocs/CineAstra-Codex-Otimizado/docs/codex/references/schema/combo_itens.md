# combo_itens

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE combo_itens (
    id_combo INT UNSIGNED NOT NULL,
    id_insumo INT UNSIGNED NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    PRIMARY KEY (id_combo, id_insumo),
    CONSTRAINT chk_comboitens_quantidade CHECK (quantidade > 0),
    CONSTRAINT fk_comboitens_combo FOREIGN KEY (id_combo) REFERENCES combos(id_combo) ON DELETE CASCADE,
    CONSTRAINT fk_comboitens_insumo FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo)
);
```
