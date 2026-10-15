# combos

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE combos (
    id_combo INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_combos_preco CHECK (preco >= 0)
);
```
