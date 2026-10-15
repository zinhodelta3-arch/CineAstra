# logistica

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE logistica (
    id_logistica INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_fornecedor INT UNSIGNED NOT NULL,
    id_local_origem INT UNSIGNED COMMENT 'estoque físico do fornecedor',
    id_local_destino INT UNSIGNED NOT NULL COMMENT 'local/sessão que solicitou os recursos',
    id_solicitacao INT UNSIGNED,
    data_envio DATETIME,
    data_prevista DATETIME,
    data_recebimento DATETIME,
    status ENUM('PENDENTE','ENVIADO','EM_TRANSITO','RECEBIDO','CANCELADO') DEFAULT 'PENDENTE',
    observacao TEXT,
    CONSTRAINT fk_logistica_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor),
    CONSTRAINT fk_logistica_origem FOREIGN KEY (id_local_origem) REFERENCES locais(id_local),
    CONSTRAINT fk_logistica_destino FOREIGN KEY (id_local_destino) REFERENCES locais(id_local),
    CONSTRAINT fk_logistica_solicitacao FOREIGN KEY (id_solicitacao) REFERENCES solicitacoes_estoque(id_solicitacao)
);
```
