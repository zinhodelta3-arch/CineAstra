# equipamentos

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE equipamentos (
    id_equipamento INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_fornecedor INT UNSIGNED NOT NULL,
    id_local INT UNSIGNED NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    numero_patrimonio VARCHAR(100) UNIQUE,
    quantidade INT NOT NULL DEFAULT 0,
    status ENUM('DISPONIVEL','MANUTENCAO','INDISPONIVEL') DEFAULT 'DISPONIVEL',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_equipamentos_quantidade CHECK (quantidade >= 0),
    CONSTRAINT fk_equipamentos_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor),
    CONSTRAINT fk_equipamentos_local FOREIGN KEY (id_local) REFERENCES locais(id_local)
);
```
