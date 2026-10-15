# filmes

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE filmes (
    id_filme INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    duracao INT COMMENT 'duração em minutos',
    classificacao ENUM('L','10','12','14','16','18') NOT NULL DEFAULT 'L',
    data_lancamento DATE,
    diretor VARCHAR(150),
    imagem VARCHAR(255),
    trailer VARCHAR(255),
    url_reproducao VARCHAR(2048) NULL,
    disponivel_cinema BOOLEAN DEFAULT TRUE,
    disponivel_streaming BOOLEAN DEFAULT FALSE,
    preco_aluguel DECIMAL(10,2),
    preco_compra DECIMAL(10,2),
    dias_acesso_aluguel INT DEFAULT 3 COMMENT 'validade do aluguel, em dias, a partir da compra',
    status ENUM('ATIVO','INATIVO') DEFAULT 'ATIVO',
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_filmes_duracao CHECK (duracao IS NULL OR duracao > 0),
    CONSTRAINT chk_filmes_precos CHECK (
        (preco_aluguel IS NULL OR preco_aluguel >= 0) AND
        (preco_compra IS NULL OR preco_compra >= 0)
    ),
    CONSTRAINT chk_filmes_dias_aluguel CHECK (dias_acesso_aluguel IS NULL OR dias_acesso_aluguel > 0)
);
```

URL de reprodução privada; CHECK V4 proíbe URL vazia.
