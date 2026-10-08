# fornecedores

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE fornecedores (
    id_fornecedor INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT UNSIGNED NOT NULL UNIQUE COMMENT 'conta de acesso do fornecedor ao sistema',
    razao_social VARCHAR(150) NOT NULL,
    nome_cine VARCHAR(150),
    cnpj VARCHAR(18) NOT NULL UNIQUE,
    status ENUM('ATIVO','INATIVO') DEFAULT 'ATIVO',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fornecedores_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
```
