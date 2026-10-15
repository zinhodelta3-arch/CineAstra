# locais

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE locais (
    id_local INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cep VARCHAR(10),
    logradouro VARCHAR(150),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    telefone VARCHAR(20),
    status ENUM('ATIVO','INATIVO','MANUTENCAO') DEFAULT 'ATIVO',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
