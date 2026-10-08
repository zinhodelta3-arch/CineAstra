# solicitacoes_estoque

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE solicitacoes_estoque (
    id_solicitacao INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL,
    id_local INT UNSIGNED NOT NULL,
    id_sessao INT UNSIGNED,
    id_insumo INT UNSIGNED,
    id_equipamento INT UNSIGNED,
    quantidade INT NOT NULL,
    status ENUM('PENDENTE','APROVADA','RECUSADA','FINALIZADA') DEFAULT 'PENDENTE',
    observacao TEXT,
    data_solicitacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_solicestoque_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT fk_solicestoque_local FOREIGN KEY (id_local) REFERENCES locais(id_local),
    CONSTRAINT fk_solicestoque_sessao FOREIGN KEY (id_sessao) REFERENCES sessoes(id_sessao),
    CONSTRAINT fk_solicestoque_insumo FOREIGN KEY (id_insumo) REFERENCES insumos(id_insumo),
    CONSTRAINT fk_solicestoque_equipamento FOREIGN KEY (id_equipamento) REFERENCES equipamentos(id_equipamento),
    CONSTRAINT chk_solicestoque_quantidade CHECK (quantidade > 0),
    CONSTRAINT chk_solicestoque_item CHECK (
        (id_insumo IS NOT NULL AND id_equipamento IS NULL) OR
        (id_insumo IS NULL AND id_equipamento IS NOT NULL)
    )
);
```
