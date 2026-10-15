# insumos

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE insumos (
    id_insumo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_fornecedor INT UNSIGNED NOT NULL,
    id_local INT UNSIGNED NOT NULL COMMENT 'local físico onde o insumo está estocado',
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    categoria VARCHAR(100),
    quantidade INT NOT NULL DEFAULT 0,
    quantidade_minima INT NOT NULL DEFAULT 0,
    preco DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('DISPONIVEL','INDISPONIVEL') DEFAULT 'DISPONIVEL',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_insumos_quantidades CHECK (quantidade >= 0 AND quantidade_minima >= 0),
    CONSTRAINT chk_insumos_preco CHECK (preco >= 0),
    CONSTRAINT fk_insumos_fornecedor FOREIGN KEY (id_fornecedor) REFERENCES fornecedores(id_fornecedor),
    CONSTRAINT fk_insumos_local FOREIGN KEY (id_local) REFERENCES locais(id_local)
);
```
