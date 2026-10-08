# planos

Referência por tabela; confira migrations aplicadas.

```sql
CREATE TABLE planos (
    id_plano INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    valor_mensal DECIMAL(10,2),
    valor_anual DECIMAL(10,2),
    desconto DECIMAL(5,2) DEFAULT 0.00,
    limite_membros INT NOT NULL DEFAULT 1 COMMENT 'qtde máxima de perfis compartilhados no plano',
    valor_multa_atraso DECIMAL(10,2) DEFAULT 0.00,
    ativo BOOLEAN DEFAULT TRUE
);
```
