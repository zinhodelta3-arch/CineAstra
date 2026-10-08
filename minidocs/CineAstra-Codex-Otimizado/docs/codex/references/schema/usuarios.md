# usuarios

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE usuarios (
    id_usuario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL COMMENT 'armazenar sempre com hash (bcrypt/argon2)',
    cpf VARCHAR(14) NOT NULL UNIQUE,
    telefone VARCHAR(20),
    data_nascimento DATE,
    tipo_usuario ENUM('ADMIN','FORNECEDOR','SUPERVISOR','COLABORADOR','CLIENTE') NOT NULL,
    status ENUM('ATIVO','INATIVO','BLOQUEADO','PENDENTE_VERIFICACAO') NOT NULL DEFAULT 'PENDENTE_VERIFICACAO',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
